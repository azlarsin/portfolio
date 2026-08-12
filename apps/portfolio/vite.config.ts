import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { assertProductionDemoUrl } from './src/app/demoUrlGuard'

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const fileEnv = loadEnv(mode, process.cwd(), '')
    const demoUrl = process.env.VITE_LAYERED_ROUTE_LAB_URL || fileEnv.VITE_LAYERED_ROUTE_LAB_URL
    assertProductionDemoUrl(demoUrl, {
      allowLocal: process.env.ALLOW_LOCAL_DEMO_URL === '1',
    })
  }

  return {
    plugins: [react()],
    server: {
      fs: {
        allow: ['../..'],
      },
    },
  }
})
