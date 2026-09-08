import { defineConfig, devices } from '@playwright/test';

const browserChannel = process.env.PW_BROWSER === 'chrome' ? 'chrome' : 'msedge';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8081',
    channel: browserChannel,
    headless: process.env.PW_HEADLESS !== 'false',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run web -- --port 8081',
    url: 'http://localhost:8081',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: browserChannel,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
