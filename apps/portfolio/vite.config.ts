import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const fileEnv = loadEnv(mode, process.cwd(), '')
    const demoUrl = process.env.VITE_LAYERED_ROUTE_LAB_URL || fileEnv.VITE_LAYERED_ROUTE_LAB_URL

    if (!demoUrl) {
      throw new Error(
        'VITE_LAYERED_ROUTE_LAB_URL is required for production builds. Copy .env.production.example and set the public Demo URL.',
      )
    }

    const parsedDemoUrl = new URL(demoUrl)
    const isLocalDemo = ['localhost', '127.0.0.1', '::1'].includes(parsedDemoUrl.hostname)

    if (!['http:', 'https:'].includes(parsedDemoUrl.protocol)) {
      throw new Error('VITE_LAYERED_ROUTE_LAB_URL must use http:// or https://.')
    }

    if (isLocalDemo && process.env.ALLOW_LOCAL_DEMO_URL !== '1') {
      throw new Error(
        'Production builds cannot point at localhost. Set the public Demo URL, or use pnpm build:local for local verification.',
      )
    }
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
