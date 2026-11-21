# MEGAPLAN V30 — Harmonization & Deduplication Campaign

One-sentence summary: audit-validated, test-first harmonization of every duplicated implementation, parallel flow, and duplicated impact in the repo, converging NPC AI and player stables onto a single mechanical ruleset.

> **Validation status:** every structural claim in this plan was audited against the code before landing (verdicts in `MEGAPLAN_V30_FINDINGS.md` §0). Phase T enforces strict test-first: every parity spec, consolidation pin, and new guard is authored, committed, and observed RED before its implementation phase.

## Scope decision (user-confirmed)

- **Framing — MEGAPLAN V30**: full ritual — `MEGAPLAN_V30_{PLAN,FINDINGS,LEDGER,DEFERRED}.md` at docs/ root, `pre-megaplan-v30` restore tag, per-commit ledger, BACKLOG fold at close-out, V29 set archives atomically with the V30 scaffold.
- **Parity direction — one ruleset for everyone**: harmonized flows ship identical mechanics to AI and player. Per-side params may exist in shared APIs but both sides pass identical values.
- **Dedup net — everything**: production `src/`, `scripts/` boilerplate, test↔test clone drain beyond registered exemptions.
- **New guards — three**: `parityFlow`, `seededId`, `jscpdRatchet` (slow tier). All register in `GUARD_REGISTRY`.
- **Deferred items — all V30-plan watch items in scope** (user: "implement all optional, deferred and out of scope items", clarified "just the v30 items"). Open BACKLOG register (V22-D3 damage model, V22-D4 ADM tier, V24-D5 game modes, V15 pool) is explicitly out.
- **Constraints:** zero save-file/backwards-compat. `SAVE_STATE_VERSION` (`src/constants/core/core.ts`) bump optional — none anticipated (no serialized-schema change planned).

## Adjudication flagged at approval

**`AI_TRAINING_EFFECTIVENESS = 0.8`** (`src/engine/ai/workers/rosterWorkerTraining.ts`) — V26-documented intentional AI handicap (BACKLOG §3 house divergence). The "same ruleset" directive overrides it: **removed** → AI gains ~25% more attributes/week → stronger rivals long-run. Largest balance consequence in the campaign; measured in Phase-6 sim probes and recorded in FINDINGS. (BACKLOG §3 entry gets a V30-supersession note at close-out.)

## Workstreams

| WS | Item | Target | Key files |
|----|------|--------|-----------|
| W1.1 | Shared weekly health tick | one `tickStableHealth` — fatigue −25 all; baseline `tickInjuries` all; accelerated `processRecovery` only under `'recovery'` assignment | `engine/ai/stableManager.ts`, `engine/ai/workers/rosterWorker.ts`, `engine/warrior/health.ts`→`stableHealth.ts`, `pipeline/passes/WarriorPass.ts`, `training/trainingImpact.ts` |
| W1.2 | Shared training executor | weather-aware, injury roll gated on real attempt; effectiveness → 1.0 | `engine/ai/workers/rosterWorkerTraining.ts`, `training/trainingImpact.ts` → `training/trainingAttempt.ts` |
| W1.3 | Shared drill executor | post-selection mechanics identical incl. `healingBonus + 1` injury roll both sides | same W1.2 set |
| W1.4 | Shared economy ledger emitter | rivals consume `computeEconomyImpact` + `TRUNCATION_CAPS.rivalLedger`; rival seed salt preserved | `engine/ai/stableManager.ts`, `economy/weeklyBreakdown.ts`, `engine/ai/agentCore.ts` |
| W1.5 | lastBoutWeek stamp | single `stampLastBoutWeek` for pipeline + tournament paths | `bout/services/boutResolution.ts`, `tournamentSelection/resolution/results.ts` → `bout/lastBoutWeek.ts` |
| W1.6 | Ownership resolver | `resolveWarriorOwner` (map-backed, scan fallback); single-entity lookups route through it | `bout/warriorRouting.ts`, `arenaChampionship/core.ts`, inline sites → `core/warriorOwnership.ts` |
| W2 | Dead code + namesakes | delete dead `updateWarriorAfterBout`/`updateWarriorStatus`/`appendFight`; `.slice(-500)`→`TRUNCATION_CAPS`; autosim renames/dedup; intelWorker + RecordBoards internal dups | careerUpdate, combatActions/types/initialState, stableManager, agentCore, autosim, intelWorker, RecordBoards |
| W3 | Seeded-id determinism | deterministic ids (zero draws) inside seeded paths | injuryAndRecovery, resolveHelpers, BoutSimulationPass, progressionHandler, reportingHandler, patronTokenService, warriorFactory |
| W4 | Type consolidation | `OffenseDefenseArgs`/`ResolveCombatOffenseDefenseArgs` → single interface + alias | `combat/resolution/offenseDefense/types.ts` |
| W5 | Scripts + tests consolidation | `scripts/lib/scanLib.mjs`; test↔test drain to `_fixtures`/`_helpers` | ~15 scanner scripts; flagged test pairs |
| W7 | Store equipment validation | `updateWarriorEquipment` validates via `validateLoadout` | `state/slices/`, `data/equipment` reuse |
| W8 | Autosim offer-acceptance parity | `processPlayerOffers` routes through `evaluateBoutOffer` + player→rival adapter | `engine/autosim/autosim.ts` → `engine/autosim/playerOfferView.ts` |
| W9 | Required-rng hardening | `rng` required in engine-seeded signatures | warriorFactory, patronTokenService, progressionHandler, reportingHandler + callers |
| G1–G3 | New guards | parityFlow, seededId, jscpdRatchet (slow) | `scripts/parity-flow-scan.mjs`, `scripts/seeded-id-scan.mjs`, `src/test/megaplan/{parityFlow,seededId,jscpdRatchet}*` |

## Strict test-first schedule

**Phase T commits ALL specs/scanners/guards before ANY production edit.** RED = failing assertion or missing-symbol import failure, logged in LEDGER §3. Documented exception: characterization pins (`// V30 pin:`) asserting *preserved* behavior — GREEN on old and new code, the no-regression net.

New specs (Phase T, all observed RED unless marked pin):
1. `test/engine/warrior/stableHealth.test.ts` — unified tick: fatigue −25 both; baseline −1 heal all; accelerated only via `'recovery'` assignment; identical outcomes both rosters.
2. `test/engine/training/trainingAttempt.test.ts` — weather forwarded; no roll on `hardCapped`/`blocked`; stats recompute; seasonalGrowth.
3. `test/engine/training/skillDrillParity.test.ts` — drill injury roll both sides at `healingBonus + 1`; cap/fallback preserved.
4. `test/engine/ai/rosterFlowParity.test.ts` — AI vs player path → identical warrior outcomes.
5. `test/engine/economy/weeklyLedgerParity.test.ts` — shared emitter; rival cap `TRUNCATION_CAPS.rivalLedger`; entry shape parity.
6. `test/engine/bout/lastBoutWeek.test.ts` — stamp parity pipeline vs tournament.
7. `test/engine/core/warriorOwnership.test.ts` — resolver equivalence player/rival/free-agent/missing.
8. `test/engine/training/injuryIdDeterminism.test.ts` — same-seed → identical injury ids.
9. `test/megaplan/parityFlow.guard.test.ts` + `scripts/parity-flow-scan.mjs`.
10. `test/megaplan/seededId.guard.test.ts` + `scripts/seeded-id-scan.mjs`.
11. `test/megaplan/jscpdRatchet.guard.slow.test.ts` (baseline constant set Phase 6).
12. `test/state/warriorEquipmentValidation.test.ts` — store rejects `validateLoadout` failures; accepts legal; no-op missing warrior.
13. `test/engine/autosim/offerAcceptanceParity.test.ts` — autosim honors `evaluateBoutOffer` verdicts incl. hard-gate declines despite `hype>100`.
14. Characterization pins: careerUpdate dead-describe removal pin, autosim summary, ownership call-sites.
15. `GUARD_REGISTRY` += G1–G3; `test-audit-scan` regen.

## Phases

- **Phase 0** — scaffold (this commit): tag, V29 archive, allowlists, V30 doc set, baselines → LEDGER §0.
- **Phase T** — all specs/scanners/guards authored + RED-verified.
- **Phase 1** — W2 dead code + namesakes.
- **Phase 2** — W1.4 economy, W1.5 stamps, W1.6 ownership, W4 types, W7 validation.
- **Phase 3** — W1.1/W1.2/W1.3 shared flows + W8 autosim acceptance (the parity core; the only ruleset-change phase).
- **Phase 4** — W3 seeded ids + W9 required-rng hardening.
- **Phase 5** — W5 scripts/tests consolidation.
- **Phase 6** — re-baselines (dup-scan, jscpd→G3, world digests, test-audit), sim-health probes (daily-oracle 1000wk + style-probe), `pre→post` tag, BACKLOG fold, DEFERRED.

## RNG / determinism ledger

| Change | Stream | Digest |
|--------|--------|--------|
| W1.1 unified health | none | none |
| W1.2 gated AI rolls | removes draws (AI no-op weeks) | shifts |
| W1.3 AI drill rolls | adds draws (AI drill weeks) | shifts |
| W1.2 weather + effectiveness | same draws, different odds/gate | outcome drift |
| W3/W9 deterministic + required rng | none added | id values change → deterministic |
| all other items | none | none |

Net: **one** world re-baseline attributable to Phase 3 (+ id shapes Phase 4).

## Preservation notes

`rivalWarriorPatches`/`rivalRosterRemovals` anti-clobber keys; player `TrainingResult` UI messages; AI drill-pick policy (`suspectedFavoriteLearn` evidence-first); AI `'recovery'` assignments (gain real meaning); rival ledger cap + salt; `isActive` gating; autosim `mutableInput` boundary; AI-only/player-only intel surfaces; exempt literal pins.

## Verification matrix

`test`+`type-check`+`lint` every phase · `test:slow` Phases 3–5 · `dupes`/`dup-scan` 2/5/6 · `test:bun` 6 · `e2e` if W2.6 changes render · daily-oracle + style-probe 6 · two-run seeded digest 4+6.

## Risks & rollback

- **Balance:** AI nerfs (heal/drill-injury) vs buff (effectiveness removal) — Phase-6 probes adjudicate; rollback = revert Phase 3 or `pre-megaplan-v30`.
- **Mid-flight red suite:** Phase T→per-batch is expected; targeted spec runs gate.
- **Shard equivalence:** `processRivalStable` must stay pure/deterministic inline AND distributed — parity spec covers both.
- **Test drain overreach:** literal pins stay exempt; conservative default.
