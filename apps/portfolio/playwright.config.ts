import { defineConfig } from '@playwright/test'

const baseURL = process.env.PORTFOLIO_UI_URL || 'http://127.0.0.1:5184'

export default defineConfig({
  testDir: './tests/ui',
  testMatch: '**/*.pw.ts',
  fullyParallel: true,
  workers: 2,
  use: { baseURL, locale: 'zh-CN', trace: 'retain-on-failure' },
  webServer: process.env.PORTFOLIO_UI_URL
    ? undefined
    : {
        command: 'pnpm exec vite --host 127.0.0.1 --port 5184 --strictPort',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      },
})
