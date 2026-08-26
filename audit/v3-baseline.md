# V3 Baseline Metrics

Captured: 2026-08-26

## TypeScript Check
- Command: `bunx tsc --noEmit`
- Result: **PASS** (0 errors)
- Note: `--ignoreDeprecations 6.0` flag invalid for installed TS 5.9.3 (package.json specifies 6.0.2 but installed version is 5.9.3)

## ESLint
- Command: `bunx eslint --ignore-pattern 'out/**' src/`
- Result: **FAIL** (config error)
- Error: `react-hooks/set-state-in-effect` rule not found in `eslint-plugin-react-hooks@7.1.1`
- Pre-existing config issue in `eslint.config.js:25`

## Unit Tests (Fast)
- Command: `bunx vitest run`
- Result: **547 passed | 1 failed (548 total)**
- Tests: **6942 passed | 1 failed (6943 total)**
- Duration: 336.82s
- Failure: `accessibilityMotionReduce.test.ts` — Windows path separator bug in glob exemption (FIXED)

## Build
- Command: `bunx vite build`
- Result: **PASS** (after `bun install`)
- Duration: 7.13s
- PWA: 143 precache entries (3655.38 KiB)
- Note: Initial run failed due to missing `@tailwindcss/postcss` — resolved by `bun install`

## Narrative Validation
- Command: `bun run narrative-validate`
- Result: **PASS** — no errors found

## Bug Fixes Applied During Baseline
1. **Windows path separator in test exemption** (`src/test/ui/accessibilityMotionReduce.test.ts:39`):
   `globSync` returns `layout\AppHeader.tsx` on Windows but test checked for `layout/AppHeader.tsx`.
   Fixed by normalizing backslashes: `file.replace(/\\/g, '/')`

## Pre-Existing Issues Noted (Not Fixed)
1. TS version mismatch: package.json specifies `typescript@6.0.2`, installed is `5.9.3`
2. ESLint config references `react-hooks/set-state-in-effect` rule not available in installed `eslint-plugin-react-hooks@7.1.1`
3. `vitest.config.ts` uses `__dirname` (deprecated in native config loader — Vite warning)
4. `vi.unmock` in `setup.ts` not at top level (Vitest warning — future error)
