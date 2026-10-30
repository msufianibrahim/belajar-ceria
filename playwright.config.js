import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'python3 -m http.server 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    stderr: 'ignore', // python's per-request log
  },
  // The two kinds of tablet the app may run on.
  projects: [
    { name: 'android-tablet', use: { ...devices['Galaxy Tab S9'] } },
    { name: 'ipad', use: { ...devices['iPad (gen 11)'] } },
  ],
});
