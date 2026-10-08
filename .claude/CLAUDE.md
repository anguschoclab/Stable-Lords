# Execution Rules

When running shell commands or passing file paths, **always wrap paths in double quotes**. Never use backslash-escaped spaces. For example, you must use "src/folder with spaces/file.ts" instead of src/folder\ with\ spaces/file.ts.

## Testing Discipline

The test suite is tiered — the default run is the fast inner loop, and the
expensive tiers are deliberate, not automatic:

- **Default verification for any change:** `bun run test` (excludes
  `*.slow.test.*`) plus `bun run type-check` / `bun run lint` as relevant.
  Do NOT run the slow suite or the full e2e matrix as a routine check.
- **Slow suite (`bun run test:slow`):** run it only when the change touches
  the paths those tests cover (sim/pipeline/economy/balance harnesses,
  week advancement, determinism, subprocess-backed checks) or when the user
  asks. It gates nightly CI, not every PR.
- **E2E:** `bun run e2e` is a chromium smoke tier (`@slow` marathon specs
  excluded) — use it for UI-affecting changes. `bun run e2e:all` is the
  full 5-browser matrix: run it only when asked or before major releases.
- **When writing tests:** put the spec in the fast tier by default; name it
  `*.slow.test.ts` if it simulates many weeks, execSyncs a subprocess, or
  takes >~2s, and tag e2e specs `{ tag: '@slow' }` if they drive long
  sessions. File the spec under the `src/test/<domain>/` dir matching its
  subject's domain — `testQualityAudit` fails on misfiled tests. See
  `docs/TESTING.md` for the full conventions.
