import { defineConfig, devices } from "@playwright/test";

const mockApiOrigin = "http://127.0.0.1:3101/api/v1";
const webServerEnv: Record<string, string> = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => {
    return typeof entry[1] === "string";
  }),
);
webServerEnv.API_INTERNAL_ORIGIN ??= mockApiOrigin;
webServerEnv.API_ORIGIN ??= mockApiOrigin;
webServerEnv.COREPACK_HOME ??= "/tmp/corepack";

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
        `API_INTERNAL_ORIGIN=${mockApiOrigin} API_ORIGIN=${mockApiOrigin} COREPACK_HOME=/tmp/corepack corepack pnpm dev`,
      env: webServerEnv,
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
