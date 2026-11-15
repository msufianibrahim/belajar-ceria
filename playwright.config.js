import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  timeout: 60000, // the long practice test takes ~32s on a slower laptop
  expect: { timeout: 10000 }, // first page loads are slow there too
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `${process.platform === 'win32' ? 'python' : 'python3'} tools/serve.py 4173`, // Windows has no python3
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    stderr: 'ignore', // python's per-request log
  },
  // The two kinds of tablet the app may run on.
  projects: [
    { name: 'android-tablet', use: { ...devices['Galaxy Tab S9'] } },
    { name: 'ipad', use: { ...devices['iPad (gen 11)'] } },
  ],
});
