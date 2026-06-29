---
name: Playwright test quirks for this codebase
description: Non-obvious Playwright selector/assertion gotchas discovered while writing E2E tests
---

## shadcn CardTitle is not a heading

`CardTitle` from `@/components/ui/card` renders as a `<div>`, not `<h1>`/`<h2>`.

**Wrong:** `page.getByRole("heading", { name: /join the waitlist/i })`
**Right:** `page.getByText("Join the Waitlist", { exact: true })`

## getByText is case-insensitive substring by default

`getByText("Join the Waitlist")` will also match a paragraph that contains "join the waitlist" anywhere (case-insensitive).
Always add `{ exact: true }` when targeting a specific exact string to avoid strict-mode violations.
