import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);
// Permite apontar a suíte para produção e validar o site publicado de verdade
// — inclusive se o CSP quebrou alguma coisa.
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  // Um teste que só passa na segunda tentativa é um sinal, não um sucesso:
  // no CI reexecuta para não travar o merge, mas localmente falha de primeira.
  retries: isCI ? 2 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: externalBaseUrl ?? "http://127.0.0.1:3021",
    // Era `channel: "msedge"`, que não existe nos runners Linux do CI.
    ...devices["Desktop Chrome"],
    headless: true,
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "npm start -- -p 3021",
        url: "http://127.0.0.1:3021",
        reuseExistingServer: !isCI,
        timeout: 60_000,
      },
});
