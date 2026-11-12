import { describe, expect, it } from 'vitest'
import {
  assertProductionDemoUrl,
  isLocalDemoHostname,
} from '../src/app/demoUrlGuard'
import { createLayeredRouteLabUrl } from '../src/app/layeredRouteLabUrl'

describe('production Demo URL guard', () => {
  it('12. accepts public HTTP(S) URLs and rejects local production targets', () => {
    expect(
      assertProductionDemoUrl('https://demo.example.com/lab').href,
    ).toBe('https://demo.example.com/lab')

    for (const hostname of [
      'localhost',
      'app.localhost',
      '127.0.0.1',
      '127.0.0.42',
      '::1',
      '[::1]',
      '0.0.0.0',
    ]) {
      expect(isLocalDemoHostname(hostname), hostname).toBe(true)
    }

    for (const url of [
      'http://localhost:3000',
      'http://127.0.0.2:3000',
      'http://[::1]:3000',
      'http://0.0.0.0:3000',
    ]) {
      expect(() => assertProductionDemoUrl(url), url).toThrow(
        'Production builds cannot point at localhost',
      )
    }

    expect(() => assertProductionDemoUrl(undefined)).toThrow(
      'VITE_LAYERED_ROUTE_LAB_URL is required',
    )
    expect(() => assertProductionDemoUrl('not-a-url')).toThrow(
      'must be an absolute URL',
    )
    expect(() => assertProductionDemoUrl('file:///tmp/demo.html')).toThrow(
      'must use http:// or https://',
    )
    expect(
      assertProductionDemoUrl('http://localhost:3000', {
        allowLocal: true,
      }).hostname,
    ).toBe('localhost')
  })

  it('builds path routes for a root app and query routes for a static subpath app', () => {
    expect(
      createLayeredRouteLabUrl('http://localhost:3000', '/products', {
        agent_demo: '1',
      }),
    ).toBe('http://localhost:3000/products?agent_demo=1')

    expect(
      createLayeredRouteLabUrl(
        'https://me.azlar.cc/demos/layered-route-lab',
        '/products',
        { agent_demo: '1' },
      ),
    ).toBe(
      'https://me.azlar.cc/demos/layered-route-lab/?route=/products&agent_demo=1',
    )

    expect(
      createLayeredRouteLabUrl(
        'https://me.azlar.cc/demos/layered-route-lab/',
        '/product/1/orders/paid/order/1',
      ),
    ).toBe(
      'https://me.azlar.cc/demos/layered-route-lab/?route=/product/1/orders/paid/order/1',
    )
  })
})
