import { describe, expect, it } from 'vitest'
import { labSourceAtLocation, normalizeLabLocation } from '../src/app/labPlayerLocation'

describe('Lab routes shared through the portfolio player', () => {
  it('round-trips known deep routes and employee filters', () => {
    expect(normalizeLabLocation('/product/1/order/2/edit')).toBe('/product/1/order/2/edit')
    const location = '/employee/A-17/order/1?date=2026-08-06&period=午餐&focus_item=香草烩饭'
    const result = new URL(normalizeLabLocation(location)!, 'https://lab.invalid')
    expect(result.pathname).toBe('/employee/A-17/order/1')
    expect(result.searchParams.get('period')).toBe('午餐')
    expect(result.searchParams.get('focus_item')).toBe('香草烩饭')
  })

  it('rejects external URLs, unknown routes, and non-data parameters', () => {
    for (const value of [null, {}, 'https://evil.test/products', '//evil.test/products', '/\\evil.test/products', '/product/999', '/products#fragment', '/products?redirect=https://evil.test', '/products?agent_cmd=run', `/products?date=${'a'.repeat(201)}`, '/'.repeat(2049)]) {
      expect(normalizeLabLocation(value), String(value)).toBeNull()
    }
  })

  it('preserves the static entry point and shell flags while replacing route data', () => {
    const source = 'https://me.azlar.cc/demos/layered-route-lab/?route=/products&agent_demo=1&embed=1&demo_data=1'
    const next = new URL(labSourceAtLocation(source, '/product/1/order/2/edit?manualPay=1'))
    expect(next.pathname).toBe('/demos/layered-route-lab/')
    expect(next.searchParams.get('route')).toBe('/product/1/order/2/edit')
    expect(next.searchParams.get('embed')).toBe('1')
    expect(next.searchParams.get('manualPay')).toBe('1')
    expect(next.searchParams.has('demo_data')).toBe(false)
  })

  it('opens standalone pages at the current route without embedded overlays', () => {
    const source = 'http://localhost:3000/products?agent_demo=1&embed=1&graph=1'
    const next = new URL(labSourceAtLocation(source, '/product/2/order/2', true))
    expect(next.pathname).toBe('/product/2/order/2')
    expect(next.searchParams.has('embed')).toBe(false)
    expect(next.searchParams.has('agent_demo')).toBe(false)
    expect(next.searchParams.get('graph')).toBe('1')
    expect(labSourceAtLocation(source, '//evil.test')).toBe(source)
  })
})
