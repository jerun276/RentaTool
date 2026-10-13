import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./nfr-tests",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "nfr-playwright-report", open: "never" }]],
  outputDir: "nfr-test-results",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
