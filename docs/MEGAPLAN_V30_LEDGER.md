# MEGAPLAN V30 — Ledger

**Plan:** `MEGAPLAN_V30_PLAN.md`
**Findings:** `MEGAPLAN_V30_FINDINGS.md`

## §0 — Baseline (pre-megaplan-v30)

| Gate | Result | Notes |
| --- | --- | --- |
| `bun run type-check` | **clean** | tsr generate + tsc --build |
| `bun run lint` | _in flight_ | filled at first gate run |
| `bun run test` | **1012/1012 files · 10877 tests · 2 skipped · 58.1s** | clean baseline (pre-scaffold race noted: doc-layout re-verified solo green post-move) |
| `bun run dupes` (jscpd) | **106 clones · 1863 lines · 0.57%** | pre-campaign G3 reference; post-campaign ratchet baseline set in Phase 6 |
| `scripts/dup-scan.mjs` | registered baselines | `duplication.guard`: 28 src↔src / 38 test↔test / 25 mixed |
| safety | `pre-megaplan-v30` tag | pushed |

## §1 — Phase log

| Commit | Phase | Contents | Gates |
| --- | --- | --- | --- |
| _scaffold_ | 0 | V30 doc set + V29 archive + allowlists + INDEX/BACKLOG pointers | doc-layout guard |
| _phaseT_ | T | 13 specs + 4 guards authored & RED-verified; test-audit metadata regen | §3 RED log below |
| _phase1_ | 1 | W2 dead code + namesakes: dead `updateWarriorAfterBout`+test block, `combatActions.ts` file+types+tests (dead `appendFight`/`updateWarriorStatus`), `.slice(-500)`→`TRUNCATION_CAPS` ×2, autosim `extractWeekSummary`→`extractAutosimWeekSummary` + offer-loop merge into `playerOfferCandidates` generator, intelWorker `titleOpponents` generator, RecordBoards `warriorRows` merge | full fast suite: 10868 pass / 14 fail — **all failures are the intended-RED V30 specs** (list in §3); typecheck red only on target-API specs; lint clean. Collateral fixes the suite caught: stale scanInLoop allowlist entry removed, `Math.random` literal reworded in seededId doc, spec boilerplate deduped into `_fixtures/rngStub.ts` + `_scanGuardHelpers.ts` (duplication.guard test↔test pairs resolved, not registered) |

## §3 — Test inventory (Phase T hard gate)

Phase-T RED run (`vitest run` on the 13 new files): **13 failed / 21 tests, 8 passing —
all failures for the intended reason.** Verified 2026-11-23, pre-implementation.

| Spec | RED evidence |
| --- | --- |
| `engine/warrior/stableHealth.test.ts` | module missing — `Cannot find package '@/engine/warrior/stableHealth'` |
| `engine/training/trainingAttempt.test.ts` | module missing — `Cannot find package '@/engine/training/trainingAttempt'` |
| `engine/training/skillDrillParity.test.ts` | module missing (trainingAttempt) |
| `engine/bout/lastBoutWeek.test.ts` | module missing — `Cannot find package '@/engine/bout/lastBoutWeek'` |
| `engine/core/warriorOwnership.test.ts` | module missing — `Cannot find package '@/engine/core/warriorOwnership'` |
| `engine/ai/rosterFlowParity.test.ts` | **semantic pin**: AI drill rolled 0 injuries where player path rolls (`expected 0 to be greater than 0`) |
| `engine/economy/weeklyLedgerParity.test.ts` | **semantic pin**: `seedOffset` arg absent — rival salt `week*31+offset` not reproducible (`8a4a64c1… ≠ 85fe7950…`) |
| `engine/training/injuryIdDeterminism.test.ts` | **empirical determinism bug pinned**: identical seeds → different injury ids (`590988a5… ≠ 6a9ac5b1…`) — F13 root cause proven, not theoretical |
| `state/warriorEquipmentValidation.test.ts` | **semantic pin**: 2H+shield loadout accepted at store boundary (undefined rejection) |
| `engine/autosim/offerAcceptanceParity.test.ts` | **semantic pins**: injured-warrior offer accepted; clean offer left Pending (autosim gate diverges from `evaluateBoutOffer`) |
| `megaplan/parityFlow.guard.test.ts` | scanner RED — 10 violations: `decayFatigue`/`tickRecoveries` decls, `processRecovery(`/`processAttributeTraining(`/`rollForTrainingInjury(`/`processSkillDrillTraining(` AI call sites, `AI_TRAINING_EFFECTIVENESS` ×2, `.slice(-500)` ×2 (agentCore:175 + stableManager:98 — agentCore site was **new evidence the plan's F11 list missed**) |
| `megaplan/seededId.guard.test.ts` | scanner RED — 10 violations across 8 files (resolveHelpers, progressionHandler ×2, reportingHandler, warriorFactory, BoutSimulationPass, patronTokenService ×3, injuryAndRecovery) |
| `megaplan/v30Surface.guard.test.ts` | 5/5 assertions RED — dead `updateWarriorAfterBout`, dead `appendFight`/`updateWarriorStatus`, 2× `extractWeekSummary`, 2× offense/defense interfaces, `lastBoutWeekImpact`/`rosterUpdateImpacts` present |
| `megaplan/jscpdRatchet.guard.slow.test.ts` | GREEN at baseline 106 — ratchet starts holding from Phase 1 onward; tightened at Phase 6 |
| `megaplan/megaplanDocLayout.guard.test.ts` | updated for V30 lineage — GREEN |

**Guards registered:** `parityFlow`, `seededId`, `jscpdRatchet` (slow), `v30Surface` → `GUARD_REGISTRY` + test-audit metadata regenerated.

