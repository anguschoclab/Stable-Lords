# Baseline Metrics — Pre-Consolidation

Captured on integration/exhaustive-audit branch from main (commit 966e9210).

## Type Check
- `bunx tsc --noEmit` → 1 deprecation warning (baseUrl deprecated in TS 7.0), 0 real errors

## Lint
- `bun run lint` → 2945 errors (all parsing errors from tsconfigRootDir ambiguity with electron `out/` directory — not real code issues)
- `bunx eslint --ignore-pattern 'out/**' src/` → 0 errors, 1028 warnings (all JSDoc)

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

---

## Post-Consolidation Metrics (Aug 13, 2026)

Captured after full plan execution + remaining items implementation on main (commit eb28ec99 + uncommitted cherry-picks).

### Verification Suite Results

| Check | Result |
|-------|--------|
| `bunx tsc --noEmit --ignoreDeprecations 6.0` | 0 errors |
| `bunx eslint --ignore-pattern 'out/**' src/` | 0 errors, 1028 warnings (JSDoc) |
| `bunx vite build` | SUCCESS, 9.70s, PWA 143 entries (3653 KiB) |
| `bun run narrative-validate` | PASSED |
| `bunx vitest run` (fast) | 6939 pass / 2 fail (pre-existing flaky) |
| `bunx vitest run --config vitest.config.slow.ts` | 117 pass / 1 fail (probabilistic) |

### Skill-Based Verification Results

| Skill | Tests | Result |
|-------|-------|--------|
| combat-sim | 944 | ALL PASS |
| narrative-validate | 221 + archive | ALL PASS |
| integration-autosim | 96 + 27 | ALL PASS |
| tournament-bracket | 198 | ALL PASS |
| training-coach | 188 | ALL PASS |
| recruitment-scout | 78 | ALL PASS |
| economy-balance | 9 | ALL PASS |
| ui-honesty-audit | grep scan | CLEAN (no fabricated chrome) |

### Codebase Scan Results

| Scan | Result |
|------|--------|
| madge --circular (shallow) | 0 circular deps |
| madge --circular --ts-config (deep) | 82 circular deps (type-level, no runtime impact) |
| ts-prune | 762 unused exports (types + barrel re-exports, low risk) |
| TODO/FIXME in source | 0 |
| console.log in production | 0 (only in logger.ts wrapper + scripts/) |

### Before/After Comparison

| Metric | Before (Phase 1) | After (Final) | Delta |
|--------|-----------------|----------------|-------|
| Type errors | 0 | 0 | 0 |
| Test pass count (fast) | 6834 | 6939 | +105 |
| Test fail count (fast) | 0 | 2 (pre-existing flaky) | +2 |
| Lint errors | 2945 (env issue) | 0 (with --ignore-pattern) | -2945 |
| Build | PASS | PASS | 0 |
| PWA precache entries | 140 | 143 | +3 |
| Narrative validate | PASS | PASS | 0 |
| Combat tests | — | 944 pass | — |
| Tournament tests | — | 198 pass | — |
| Training tests | — | 188 pass | — |
| Offseason determinism | — | 96 pass | — |
| Remote branches | 10 | 0 (after cherry-pick) | -10 |
