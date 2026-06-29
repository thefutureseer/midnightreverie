// @ts-check
import { defineConfig, devices } from "@playwright/test";

/**
 * Replit NixOS note:
 * Playwright's bundled Chromium can't find system libs in NixOS.
 * We use the Nix-managed `chromium` package instead, which ships with
 * all its shared-library deps properly linked inside the Nix store.
 *
 * The theater and API-server workflows are already running via Replit —
 * no webServer block needed.
 */
const CHROMIUM_EXECUTABLE =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: "http://localhost:80",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    launchOptions: {
      executablePath: CHROMIUM_EXECUTABLE,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath: CHROMIUM_EXECUTABLE,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
      },
    },
  ],
});
