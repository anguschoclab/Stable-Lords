# Baseline Metrics — Pre-Consolidation

Captured on integration/exhaustive-audit branch from main (commit 966e9210).

## Type Check
- `bunx tsc --noEmit` → 1 deprecation warning (baseUrl deprecated in TS 7.0), 0 real errors

## Lint
- `bun run lint` → 2945 errors (all parsing errors from tsconfigRootDir ambiguity with electron `out/` directory — not real code issues)

## Unit Tests
- `bunx vitest run` → **538 test files passed, 6834 tests passed, 0 failures**
- Duration: 102.28s

## Build
- `bunx vite build` → SUCCESS, built in 1.30s
- PWA: 140 precache entries (3858.64 KiB)

## Narrative Validation
- `bun run narrative-validate` → PASSED, no errors

## Summary
| Metric | Value |
|--------|-------|
| Type errors | 0 (1 deprecation warning) |
| Test files | 538 passed |
| Tests | 6834 passed |
| Test failures | 0 |
| Build | SUCCESS |
| Narrative | PASSED |
