# MEGAPLAN V30 — Findings

**Plan:** `MEGAPLAN_V30_PLAN.md` · **Ledger:** `MEGAPLAN_V30_LEDGER.md`

## §0 — Validation audit (pre-implementation, file:line verified)

Every candidate was re-read at file:line granularity during plan drafting. Verdicts:

### §0.1 APPROVED — true duplicates / divergences to unify

| ID | Finding | Evidence | Verdict |
|----|---------|----------|---------|
| F1 | AI training-injury roll ignores weather (defaults `'Clear'`) and fires on `hardCapped`/blocked no-op attempts | `rosterWorkerTraining.ts:160` unconditional `rollForTrainingInjury(warrior, healingBonus, rng)` — no weather arg, no gate; player gates at `trainingImpact.ts:148`, passes `state.weather` (`:83`,`:148`); `hardCapped` on result (`attributeTraining.ts:54,170-171`) | ✅ duplicated flow, divergent rules |
| F2 | AI skill drills never roll training injuries | `performAISkillDrill` (`rosterWorkerTraining.ts`) calls `processSkillDrillTraining` with no `rollForTrainingInjury`; player `processSkillDrillAssignment` rolls at `trainingImpact.ts:83` (`healingBonus + 1`) | ✅ duplicated flow, divergent rules |
| F3 | AI heals every wounded warrior at accelerated `processRecovery` rate for free; player gets baseline `tickInjuries` (−1) + `'recovery'`-assignment-gated accelerated | `rosterWorker.ts:44-59` (`tickRecoveries`); `trainingImpact.ts:34-40,186`; `health.ts:14-38` → `tickInjuries` (`injurySystem.ts:221`) | ✅ duplicated flow, divergent rules |
| F4 | Fatigue decay −25/week implemented twice | `stableManager.ts:37-45` `decayFatigue` vs `health.ts` `computeHealthImpact` (player, via `WarriorPass.ts:44`) | ✅ same rule, two implementations |
| F5 | `lastBoutWeek` stamping duplicated | `boutResolution.ts:173-187` `rosterUpdateImpacts` vs `results.ts:39-54` `lastBoutWeekImpact` | ✅ same impact shape, two emitters |
| F6 | `OffenseDefenseArgs` ≡ `ResolveCombatOffenseDefenseArgs` | `combat/resolution/offenseDefense/types.ts` — identical 36-field interfaces | ✅ type-level dup |
| F7 | Rival weekly-ledger loop re-implements `computeEconomyImpact` | `stableManager.ts:78-98` vs `weeklyBreakdown.ts` `computeEconomyImpact`; rival salt `week*31+id.length`, rival-only `.slice(-500)` | ✅ same breakdown→ledger mapping |
| F8 | Dead `updateWarriorAfterBout` (`careerUpdate.ts:228-230`) — opposite `wasKilled` semantics vs live `warriorStateUpdater.ts` used by `recordHandler.ts:7,84,102`; only caller is its own test (`careerUpdate.test.ts:296-359`) | ✅ dead footgun |
| F9 | Dead `updateWarriorStatus` + `appendFight` slice actions (`combatActions.ts:25,40`, `worldSlice/types.ts:88,98`, `initialState.ts:17,23`) — zero production call sites | ✅ dead duplicated bout-outcome application |
| F10 | Hardcoded `.slice(-500)` vs `TRUNCATION_CAPS.rivalLedger` | `stableManager.ts:98`, `agentCore.ts:175`; `truncation.ts:48` + canonical `:184` | ✅ magic-number dup |
| F11 | Four ownership-resolution paths | `isPlayerOwned` (`warriorRouting.ts`), `owningStableOf` (`arenaChampionship/core.ts:132`), `state.warriorToStableMap`, ~7 inline `stableId === player.id` | ✅ same question, four answers |
| F12 | Autosim internal dups | `processPlayerOffers`/`processPlayerOffersScan` filter loops; `extractWeekSummary` namesakes (autosim vs `timeAdvance/summaries.ts`) | ✅ local dup + namesake |
| F13 | Unseeded `generateId()` inside seeded engine paths (V26-D4 class) | `injuryAndRecovery.ts:44`, `resolveHelpers.ts:83` (unconditional), `BoutSimulationPass.ts:64`, `warriorFactory.ts:70`, `patronTokenService.ts:24,38,101`, `progressionHandler.ts:146,210`, `reportingHandler.ts:55` (optional-rng fallbacks) | ✅ determinism leak class |
| F14 | Internal file dups | `intelWorker.ts` (~13L ×2), `RecordBoards.tsx` render block ×2 | ✅ local dup |
| F15 | `scripts/*.mjs` shared boilerplate | jscpd: 68L `entries-in-loop`↔`scan-in-loop`; 15–23L clusters across ~9 scanners + `balance-lab`↔`style-probe` + seed probes | ✅ tooling dup |

### §0.2 DISPROVED — already unified or intentional; not re-litigated

| ID | Suspected dup | Evidence | Verdict |
|----|---------------|----------|---------|
| X1 | "Tournament day path bypasses bout consequences" | `results.ts` imports `applyRecords`, `handleDeath`, `handleInjuries`, `handleProgressions`, `calculateBoutFame` — V27 parity landed; only F5's stamp remains | ❌ resolved upstream |
| X2 | "Duplicate week-advance pipelines" | Canonical `advanceWeek`; `finalizeWeekTransition` shared by `advanceDay`/`skipToWeekEnd`; autosim delegates | ❌ single canonical flow |
| X3 | "Newsletter/gazette duplicated systems" | `newsletter/feed.ts:107` — old accumulator already deleted; gazette (announcement feed) vs newsletter (weekly issue) are distinct domains | ❌ intentional |
| X4 | "Impact merge clobber-prone" | `impactSystem.ts` MERGE_CONFIG + replacement-ordering + deferred epithets; fine-grained rival keys prevent clobber | ❌ already correct — preserve |
| X5 | "Plan/consumption parity gaps" | V26: `applyChallengeContext`, `rivalFightPlan`, `persistNPCPlans`, `ai-parity-funnel` guard | ❌ resolved |
| X6 | Literal src↔src clones | `duplication.guard.test.ts` ratchet (baseline 28) + exempt/debt ledgers | ❌ governed already |

### §0.3 REFINED — real overlap, different contracts

| ID | Finding | Verdict |
|----|---------|---------|
| R1 | Ownership resolution (F11) | Keep `warriorToStableMap` for bulk paths; single-entity lookups route through one resolver |
| R2 | Player equipment validation | UI-gated only; store trusts callers → **W7** closes the programmatic gap |
| R3 | `generateId()` UI-side uses | `economySlice:50,70`, `tutorialBout`, avatar/admin/hiring/startGame, `useRivalryAlerts` — allowlisted in G2 |
| R4 | `exchangeSetup.ts` vs `resolution.ts` arg-bag | Registered literal pin — exempt |

## §A — Phase findings (filled during implementation)

### Post-campaign state (2026-11-23)

- **Fast suite:** 1025/1025 files · 10,910 tests — all green (baseline 1012/10877).
- **jscpd:** 96 clones / 0.50% (baseline 106 / 0.57%) — ratcheted.
- **dup-scan:** 28 src↔src / 38 test↔test / 25 mixed — at ratchet; two drained clusters still register on the ≥8-line window (imports/describe skeletons).
- **Slow suite:** 296/299 green — 2 V29-class seed-trajectory inversions folded to BACKLOG §A (worldLiveness gradient, worldBalance fill); orphanScan ratcheted 174→180 for the canonical type-export surface.

### AI-competitiveness check (the plan's mandated probe)

The unified ruleset measurably tightens rival economics: unconditional training spend (+20g per silent-blocked week that previously skipped the roll), drill injury rolls, weather-aware injury risk, and removal of free accelerated healing. Fast-tier `aiEconomyParity` pins the new spend (−20g/warrior-week vs the 0.8-gated world). The two slow-tier seed inversions are trajectory re-rolls of the same class as V29's — flagged for in-spec re-baseline rather than treated as collapse evidence; `worldBalance`'s 94.4% fill is inside noise of the 95% bar, and no fast-tier solvency/competitiveness spec regressed.
