---
name: Playwright on Replit NixOS
description: How to run Playwright Chromium in Replit's NixOS container without system lib errors
---

Playwright's bundled chromium-headless-shell requires `libglib-2.0.so.0` which isn't on the standard path in NixOS.

**Fix:** Install `chromium` via `installSystemDependencies({ packages: ["chromium"] })`, then point Playwright at it:

```js
const CHROMIUM_EXECUTABLE = "/nix/store/<hash>-chromium-<ver>/bin/chromium";
// or: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH

launchOptions: {
  executablePath: CHROMIUM_EXECUTABLE,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
}
```

Find the path with `which chromium` after install.

**Why:** NixOS stores all libs inside the Nix store with the binary; the Playwright-bundled binary expects standard Linux lib paths.

**How to apply:** Whenever Playwright is added to a Replit project, do this instead of `playwright install --with-deps` (apt-based, blocked by NixOS).

Also: **Do not add a `webServer` block** when the app is already served by Replit workflows. The `echo` trick exits too fast and Playwright treats it as a server crash even with `reuseExistingServer: true`. Just omit the block.
