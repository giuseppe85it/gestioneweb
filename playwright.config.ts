import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120000,
  retries: 1,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "test-results/chat-ia-e2e-results.json" }]],
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    actionTimeout: 30000,
    navigationTimeout: 30000,
    trace: "retain-on-failure",
  },
});
