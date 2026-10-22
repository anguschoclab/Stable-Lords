<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN V19 LEDGER — Exhaustive Re-Baseline Audit & Cleanup

One row per commit. Baseline block in §0; dispositions after.

## §0 Baseline — measured 2026-10-22, HEAD `217c1b7c`

| Gate | Command | Result |
| ---- | ------- | ------ |
| type-check | `bun run type-check` | 0 errors |
| lint | `bun run lint` | 0 errors / 22 jsdoc warnings |
| fast tests | `bun run test` | 880 files / 9,467 pass / 2 skipped |
| build | `bun run build` | OK (vite 1.93s + PWA precache 187) |
| narrative | `bun run narrative-validate` | clean |
| dup-scan w8 | `node scripts/dup-scan.mjs` | 27 src / 79 test / 17 mixed (123) |
| dup-scan w12 | `--window 12` | 6 / 12 / 3 (21) |
| dup-scan ident w20 | `--ident --window 20` | 170 / 52 / 135 (357) |
| dup-scan ident w16 | `--ident --window 16` | 454 / 128 / 288 (870) |
| function-length | `node scripts/function-length.mjs` | 6 >80 / 0 >120; band 268; 2 data files >800 |
| param-count | `node scripts/param-count.mjs` | 0 violations |
| orphan-scan | `node scripts/orphan-scan.mjs` | 0 unreachable (2 ambient .d.ts) / 0 test-only / 215 deadExports / 0 unlinked |
| entries-in-loop | `node scripts/entries-in-loop.mjs` | 5 = 5 exceptions |
| scan-in-loop | `node scripts/scan-in-loop.mjs` | 88 = 88 exceptions |
| ui-audit | `node scripts/ui-audit-scan.mjs` | 0 across all five rules |
| data-array | `node scripts/data-array-dup-scan.mjs` | clean |
| test-audit | `node scripts/test-audit-scan.mjs` | 926 files; 3 localFactory / 2 deadPatterns / 37 importSetClusters / 23 over2s |
| knip | `bun run dead-code:report` | 72 files: 150 exports + 68 types + 4 duplicates |
| jscpd | `bun run dupes` | 102 clones / 0.63% lines |
| soak 40w | `bun scripts/soak.mjs --weeks 40 --seed 20260919` | 0 invariant violations; 257.7 ms/week |
| determinism | `determinismAudit.test.ts` | 4/4 pass |
| sizes | `megaplan-sizes.json` | 1,283 src / 141,711 LOC; 994 test / 149,849 LOC |

In-flight at baseline: scan-in-loop drain (`217c1b7c`, `f9c9dc8a`) —
88 exceptions are the V19 re-triage queue.

## Commits

| Commit | Phase | Batch | Disposition |
| ------ | ----- | ----- | ----------- |
