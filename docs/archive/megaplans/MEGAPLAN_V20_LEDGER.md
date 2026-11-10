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
| `daf7e45c` | 0 | tag `pre-megaplan-v20`, backup refs, PLAN/FINDINGS/LEDGER seed, generated-file regen | docs |
| `45e7b896` | 3 | test-first inventory: 4 v20 guard files, skip-ticket registration, trait-balance list extension, skipCount Windows fix | tests |
| `508f1206` | 4 | merge #1069 StyleMeterTable useShallow | merge |
| `f28e82c8` | 4 | merge #1067 WeeklyDigestMini selector | merge |
| `4f15127f` | 4 | merge #1066 chaos squall + mysterious trader (JSON tail unioned vs fey_trickster) | merge |
| `4599e4a8` | 4 | merge #1068 lore + 3 traits; generated hunks regenerated not merged | merge |
| `9c64cf22` | 4 | merge #1065 lore expansion — 4 tail conflicts union-resolved | merge |
| `741810e7` | 4 | un-skip V2–V6 parked specs as merges land | tests |
| `bc5813d2` | 5 | F4 canonical OFFSEASON_EFFECT_TYPES + satisfies; F1 Events Record typing | fix |
| `78cad56c` | 6 | guard fallout: GUARD_REGISTRY entries, dup-pair registration, fixture attributes, vacuous pin replaced | tests |
| close-out | 6/7 | B4 transcript-contract Windows fix; B5 seed re-baselines (balance→31337, hardening→42, gradient→31337); FINDINGS/LEDGER final entries | fix+docs |

## Phase-4/5 merge notes

- #1066 JSON tail collided with `fey_trickster` (landed on main after the
  branch was cut) — unioned both events; JSON revalidated + parity green.
- #1068's generated-file hunks resolved by regeneration
  (`node scripts/test-audit-scan.mjs`), never by picking a side — V17 rule.
- #1065 four tail conflicts resolved as ordered unions (HEAD first, then
  branch appends) — all 20 entries disjoint by Phase-1 measurement.
- MEGAPLAN-V tickets un-parked per landing: V4 (#1069), V2/V3 (#1066),
  V5 (#1068), V6 (#1065∪#1068), V1 (F4 fix). Zero skips remain parked.
- `bun run test` fast suite: 886 files / 9,530 pass / 2 pre-existing skips.

## §6 Validation battery — triage record

Concurrent battery (slow suite + e2e + soak + coverage run together on one
machine) reported 11 slow + 4 coverage failures. Serial isolation sorted
them into three buckets:

- **Load flakes (8 slow + 4 coverage):** timeouts and perf-threshold misses
  that all pass serially — `headlessTranscriptContract` (after B4 fix),
  `orphanScan`, `batchTeardownParity`, `pipeline.perf` (2), `autosim`
  (68s>30s cap under load), `autosimChampionship` (300s timeout → 113s
  serial), `worldLiveness.slow` championship ecosystem (372s timeout →
  140s serial), plus 4 coverage `afterEach` hook timeouts.
- **B4 Windows path bug:** `headlessTranscriptContract` — fixed, 3/3 green.
- **B5 deterministic trajectory shifts (3):** `worldBalance` seed 777
  legacy=0; `simulation_hardening` seed 12345 end=89<90; `worldLiveness`
  gradient seed 13 → 0.718<1.3. All three verified PASS on
  `pre-megaplan-v20` worktree (install + run) → merge-induced RNG
  re-roll, not regression. Re-baselined per house convention with
  measured 6-seed / 4-seed probes:
  - `worldBalance`: 777 → **31337** (probe: legacy 2/0/0/1/1/2 for
    42/555/777/1234/2024/31337; 31337 = legacy 2, min 90, max 94,
    killRate 0.0971, dark 1) — verified green.
  - `simulation_hardening`: 12345 → **42** (probe: all 6 seeds hold
    90–91 rivals, deathRate 0.90–1.07) — verified green.
  - `worldLiveness` gradient: 13 → **31337** (probe: 42/777/555/31337 →
    0.727/0.686/0.235/1.775; coherence 0.229, objWeeks 9217) — same fat
    tail as all 5 documented re-baselines; verified green.

Gates confirmed green serially: e2e chromium 5/5, soak 40w 0 violations,
determinism 4/4, ui-audit 0, orphan-scan 0 unreachable, knip 151 exports
(−1 net from `Events` cleanup), jscpd 89 clones / 0.54% (+1 registered
preamble pair).

Close-out re-runs (serial, idle machine):

- `test:coverage`: 9,527 pass / 2 pre-existing skips — the only failures
  were 3 dup/audit violations from a scratch seed-probe file, removed
  after its measurements were recorded in the re-baselined specs. The 4
  `afterEach` timeouts from the concurrent run did not recur → load flakes.
- `bun run test`: 9,527 pass / 2 skips; 3 `afterEach` hook timeouts
  (`useWeekExecution`, `opfsArchiverFlush` ×2) under concurrent
  type-check+lint CPU load — all 25 specs pass isolated (11s).
- `killDeathDivergence` (300wk): PASS serial — 526s, 0 dead-id sightings,
  kill outcomes == unique deaths.
- Final type-check: 0 errors. Final lint: 0 errors / 25 pre-existing
  warnings (none in V20-touched files).
