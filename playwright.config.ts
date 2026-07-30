import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:3021",
    channel: "msedge",
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: "npm start -- -p 3021",
    url: "http://127.0.0.1:3021",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
