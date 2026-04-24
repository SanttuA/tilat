import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: process.env.PLAYWRIGHT_MOCK_API_COMMAND ?? "node e2e/mock-api.mjs",
      url: "http://127.0.0.1:3101/health",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command:
        process.env.PLAYWRIGHT_WEB_COMMAND ??
        "API_INTERNAL_ORIGIN=http://127.0.0.1:3101/api/v1 API_ORIGIN=http://127.0.0.1:3101/api/v1 COREPACK_HOME=/tmp/corepack corepack pnpm dev",
      url: "http://127.0.0.1:3000/fi",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
