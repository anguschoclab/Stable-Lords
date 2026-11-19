---
name: run-e2e-tests
description: Runs Playwright end-to-end tests (chromium smoke or full matrix)
disable-model-invocation: true
---

Run Playwright end-to-end tests (from the repository root):

```bash
bun run e2e         # fast tier: chromium only, --grep-invert @slow — default for UI changes
bun run e2e:all     # full matrix: 5 projects (chromium, firefox, webkit, Mobile Chrome, Mobile Safari) incl. @slow
bun run e2e:ui      # interactive UI mode
bun run e2e:headed  # headed browser
bun run e2e:debug   # step-through debugging
```

Specs live in `e2e/` (`golden-path`, `primary-cta`, `seasonal-tournament`,
`v13-surfaces`, `v25-archetypes`, `residual-routes`). Tag a spec
`{ tag: '@slow' }` when it drives a long session (e.g. `seasonal-tournament`'s
full-year soak) — `e2e:all` is adhoc/nightly, not a per-change gate. The config
starts the dev server automatically.
