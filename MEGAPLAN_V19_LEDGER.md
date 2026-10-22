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
| `ebf61111` | 0 | tag `pre-megaplan-v19` + LEDGER/FINDINGS/PLAN docs | docs |
| working-tree | 2 | `v19Dedup.guard.test.ts` (D15–D19) + `v19Srp.guard.test.ts` (S35–S40) + `uiTokens`/`duplication`/`paramBudget` contract extensions — 14 RED tests | test-first RED |
| working-tree | 4 (§D) | D15–D19 full drain — 58 test↔test pairs drained via `_fixtures/{competitionWorker,bidRoster,arenaTitle,determinism,statWarrior,equipmentLoadout,intelDossier,dashboardTabState,offseasonCtx,offerCard,factories}` + `_mocks/{framerMotion,archiveService,bookmarkStore,uiButton,uiMeta,entityLinkDeps}` + `_helpers/windowSnapshot`; 5 preamble pairs → EXEMPT | DEBT → 0 |
| working-tree | 6 (§A) | S35–S40 decompositions (`POSE_HANDLERS`, `buildCrownIndexes`, `PROJECTORS`, `assembleFighterState` options bundle + `FRESH_COMBAT_COUNTERS`, `applyGrandChampionAward` options bundle) | fns >80 → 0 |
| working-tree | 5 (§K) | K1–K10 triage — 4 true unexports (`CROWD_KILL_BONUS`, `RivalFightPlanOpts`, `ChosenWarriorOutcome`, `GrantableStat`); 6 reversed via TS4058 | deadExports 159→155 |
| working-tree | 7 (§C/§B) | `radius-violation` + `undefined-class` + `dead-keyframe` scanner rules; 17 radius repairs, `glow-neon-blue` dropped, 3 missing `animate-*` classes minted, 4 orphan keyframes deleted; `weatherMods` verdict REVERSED (live) | ui-audit 0 |
| working-tree | 3 (§W) | code-level deadExport classification complete (109 test-only / 18 scanner-blind / 22 Radix / 4 drain); feature-level spec re-audit — no new gaps | wiring closed |
| working-tree | 6 (§P) | `rivalStrategyPass.perf` gate — best-of-3 min sampling + 2s bound (was single-sample 500ms; flaked at 641–1141ms under concurrent 104-week sims vs ~250–310ms isolated); spy-count per-tick contract preserved | stabilized |
| working-tree | 4 (test-audit wave) | `TEST_AUDIT_FINDINGS`/`TEST_SUITE_AUDIT_LEDGER`/`TEST_SUITE_AUDIT_PLAN` landed; narrativeUnion merged, hitLocation folded, layout specs rehomed, `fsWalk` shared, 11 audit guards | recorded |
| `2d79b9c1` | 2/8 residual drain | `v19Preservation.guard.test.ts` (U1–U7) — the deferred Phase-2 §U inventory item; V19 ticket namespace registered in skipCount guard (`S35–S40`, `D15–D20`, `W*/K*/P*/C*/B*/U* ×10`); B2 fixed — per-tier dup-scan report filenames (`dup-scan-w12`, `-ident-w20`, `-ident-w16`); last 2 fast-suite >2s stragglers demoted (`truncationCadence` 4.7s + `enginePool` 2.0s → `.slow`); srp-census re-run (142→135); ident tiers re-scanned to dedicated reports | deferred items drained |

## Close-out matrix — measured post-campaign (2026-10-22)

| Gate | Baseline | Final | Δ |
| ---- | -------- | ----- | - |
| type-check | 0 errors | 0 errors | ✓ |
| lint | 0 err / 22 warn | 0 err / 25 warn (+3 new-fixture jsdoc) | ✓ |
| fast tests | 880 files / 9,467 | 883 files / 9,491 / 2 skipped | +3 files / +24 tests |
| dup w8 test↔test | 79 | 12 | −67 |
| dup w8 mixed | 17 | 18 (+1 registered literal pin) | +1 exempt |
| dup w8 src↔src | 27 | 27 (all exempt) | 0 |
| function-length >80 | 6 | 0 | −6 |
| param-budget | 0 | 0 | ✓ |
| orphan deadExports | 215 | 211 (−4 unexports) | −4 |
| ui-audit | 0 (5 rules) | 0 (8 rules incl. radius/undefined/dead-keyframe) | +3 rules |
| TEST_DEBT_PAIRS | 70 | 0 | −70 |
| TEST_DEBT_BUDGET | 25 | 0 | ratcheted |
| slow suite | — | 40/40 files, 268 tests (incl. stabilized rivalStrategyPass perf gate under load) | ✓ |
| e2e chromium | — | 5/5 | ✓ |
| build | ✓ | ✓ (6.8s) | ✓ |
| narrative-validate | ✓ | ✓ | ✓ |
| jscpd | 102 clones / 0.63% | 87 clones / 0.63% | −15 |
| knip (report-only) | 150 exp / 68 types / 4 dup | 152 exp / 68 types / 4 dup | +2 exp |

## Residual-drain addendum — verified 2026-10-22 (post `post-megaplan-v19`)

| Gate | Final | Note |
| ---- | ----- | ---- |
| over2s fast stragglers | 0 (8 >2s files, all `.slow`) | last two demoted this session |
| srp-census | 135 candidates / 1,282 files | re-run post-drain |
| dup w12 / ident w20 / ident w16 | 10 / 354 / 855 | per-tier report files (B2 fix) |
| fn band 60–80 | 286 | mild regrowth, 0 >80 holds |
| soak 40w | 0 violations @ 500.7 ms/week | measured under concurrent slow-suite load |
| determinismAudit | 4/4 | ✓ |
| megaplan guard suite | 31 files / 188 tests | incl. new `v19Preservation.guard` (7) |
