<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN V20 LEDGER — Exhaustive Review & Full Branch Consolidation

One row per commit. Baseline block in §0; dispositions after.

## §0 Baseline — measured 2026-10-23, HEAD `2c5599e1`

| Gate | Command | Result | Δ vs V19 close-out |
| ---- | ------- | ------ | ------------------ |
| type-check | `bun run type-check` | 0 errors | ✓ (after B0 env fix) |
| lint | `bun run lint` | 0 errors / 25 warnings | ✓ same |
| fast tests | `bun run test` | 882 files / 9,480 pass / 2 skipped | +2 files / +13 tests vs V19 final |
| build | `bun run build` | OK (PWA precache 187) | ✓ |
| narrative | `bun run narrative-validate` | clean | ✓ |
| dup-scan w8 | `node scripts/dup-scan.mjs` | 27 src / 12 test / 18 mixed (57) | test 12 (was 79 at V19 open, 12 at close) — stable |
| dup-scan w12 | `--window 12` | 6 / 1 / 3 (10) | test 12→1 post-V19 drain |
| dup-scan ident w20 | `--ident --window 20` | 170 / 49 / 135 (354) | test 52→49 |
| dup-scan ident w16 | `--ident --window 16` | 453 / 117 / 285 (855) | src 454→453, test 128→117 |
| function-length | `node scripts/function-length.mjs` | 0 >80 / 0 >120; 2 data files >800 | ✓ held |
| param-count | `node scripts/param-count.mjs` | 0 violations | ✓ |
| orphan-scan | `node scripts/orphan-scan.mjs` | 0 unreachable / 211 deadExports / 0 unlinked | ✓ held |
| entries-in-loop | `node scripts/entries-in-loop.mjs` | 5 = 5 exceptions | ✓ |
| scan-in-loop | `node scripts/scan-in-loop.mjs` | 88 = 88 exceptions | ✓ |
| ui-audit | `node scripts/ui-audit-scan.mjs` | 0 all rules | ✓ |
| data-array | `node scripts/data-array-dup-scan.mjs` | clean | ✓ |
| test-audit | `node scripts/test-audit-scan.mjs` | 1,011 files; 3 localFactory / 2 deadPatterns / 37 importSetClusters / 0 over2s | over2s 23→0 (V19 residual drain held) |
| knip | `bun run dead-code:report` | 72 files: 152 exports + 68 types + 4 duplicates | = V19 final exactly |
| jscpd | `bun run dupes` | 88 clones / 0.53% lines | 87→88 clones, 0.63→0.53% |
| soak 40w | `bun scripts/soak.mjs --weeks 40 --seed 20260919` | 0 violations; 1,850 ms/wk (under concurrent test load — clean re-run at close-out) | ✓ violations |
| determinism | `determinismAudit.test.ts` | 4/4 pass | ✓ |
| sizes | `megaplan-sizes.json` | 1,283 src / 141,817 LOC; 1,011 test / 150,108 LOC | +17 test files / +259 LOC |

### Environment baseline note (B0)

`rehype-sanitize` (^6.0.0, declared dep) was absent from `node_modules` —
type-check failed TS2307, build failed, 3 spec files failed import
resolution (`MarkdownReader.test.tsx`, `HallOfFights.test.tsx`,
`GazetteArticle.test.tsx`). `bun install` restored it; all gates then
green. Environment drift, not code — recorded for honesty.

### Determinism-run note

First `determinismAudit` invocation raced the parallel fast-suite run
(`ENOTEMPTY` on `.vitest-cache` rmdir — Windows FS race, not a test
failure). Serial re-run: 4/4 pass. Lesson: never run two vitest
processes concurrently on this checkout.

## Commits

| Commit | Phase | Batch | Disposition |
| ------ | ----- | ----- | ----------- |
| (pending) | 0 | tag `pre-megaplan-v20`, backup refs, PLAN/FINDINGS/LEDGER seed, generated-file regen | docs |
