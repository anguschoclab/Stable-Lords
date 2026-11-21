# MEGAPLAN V30 — Harmonization & Deduplication Campaign

One-sentence summary: audit-validated, test-first harmonization of every duplicated implementation, parallel flow, and duplicated impact in the repo, converging NPC AI and player stables onto a single mechanical ruleset under the full megaplan V30 doc ritual.

## 1. User decisions (locked)

| # | Decision | Value |
|---|----------|-------|
| D1 | Parity direction | **One ruleset for everyone** — harmonized flows ship identical mechanics to AI and player (supersedes earlier "parameterize differences" answer). Per-side policy params may exist in the shared API but both sides pass identical values. |
| D2 | Scope | **Everything** — production `src/`, `scripts/` boilerplate, and test↔test clone drain beyond registered exemptions. |
| D3 | Megaplan ritual | **Full V30 set** — `docs/MEGAPLAN_V30_{PLAN,FINDINGS,LEDGER,DEFERRED}.md`, V29 set `git mv`'d to `docs/archive/megaplans/`, pre/post restore tags, per-commit ledger, `MEGAPLAN_BACKLOG.md` fold at close-out. |
| D4 | New guards | **Yes — three**: `parityFlow` scanner (AI must route through shared flows), `seededId` scanner (no unseeded `generateId()`/crypto randomness in engine seeded paths), `jscpdRatchet` slow guard (total-clone-count ≤ post-campaign baseline). Registered in `GUARD_REGISTRY`. |
| D5 | Constraints | Zero save-file/backwards-compat constraints. `SAVE_STATE_VERSION` bump available but not needed unless serialized schema actually changes (currently none planned). |
| D6 | Deferred/optional scope | **All V30-plan deferred items are IN scope** (user directive "implement all optional, deferred and out of scope items" — clarified: "just the v30 items"). §10 watch items become W7–W9. Open BACKLOG register (V22-D3 damage model, V22-D4 ADM tier, V24-D5 game modes, V15 pool) is **explicitly NOT** in scope. |

### 1.1 Open adjudication (flagged, not silently decided)

**`AI_TRAINING_EFFECTIVENESS = 0.8`** (`src/engine/ai/workers/rosterWorkerTraining.ts`) — V26 documented this as an intentional AI handicap. D1 ("same ruleset") argues for removing it → AI gains ~25% more attributes/week → materially stronger rivals long-run. **Recommendation: remove it for full parity**, since the user directed "everyone under the same ruleset" — but this is the single largest balance consequence in the campaign and is flagged for explicit veto at plan-approval time. Alternative if vetoed: keep as a named `AI_TRAINING_EFFECTIVENESS` constant consumed by the shared executor (the flow stays unified; only the knob differs).

## 2. Validation verdicts (integrated — not a separate report)

Every candidate was re-read at file:line granularity. Verdicts:

### 2.1 APPROVED — true duplicates / divergences to unify

| ID | Finding | Evidence | Verdict |
|----|---------|----------|---------|
| F1 | AI training-injury roll ignores weather (defaults `'Clear'`) and fires even on `hardCapped`/blocked no-op attempts | `rosterWorkerTraining.ts:160` calls `rollForTrainingInjury(warrior, healingBonus, rng)` unconditionally, no weather arg, no gate; player path gates at `trainingImpact.ts:148` and passes `state.weather` (`:83`,`:148`); `hardCapped` exists on result (`attributeTraining.ts:54,170-171`) | ✅ duplicated flow, divergent rules |
| F2 | AI skill drills never roll training injuries | `performAISkillDrill` (`rosterWorkerTraining.ts:~250-286`) calls `processSkillDrillTraining` with no `rollForTrainingInjury`; player `processSkillDrillAssignment` rolls at `trainingImpact.ts:83` with `healingBonus + 1` | ✅ duplicated flow, divergent rules |
| F3 | AI heals every wounded warrior at accelerated `processRecovery` rate (1+bonus) for free; player gets baseline `tickInjuries` (−1) and must spend a `'recovery'` assignment for the accelerated path | `rosterWorker.ts:44-59` (`tickRecoveries` → `processRecovery` per wounded warrior); `trainingImpact.ts:34-40,186` (assignment-gated `processRecovery`); `health.ts:14-38` → `tickInjuries` (`injurySystem.ts:221`) | ✅ duplicated flow, divergent rules |
| F4 | Fatigue decay −25/week implemented twice | `stableManager.ts:37-45` `decayFatigue` (rivals) vs `health.ts` `computeHealthImpact` (player via `WarriorPass.ts:44`) | ✅ same rule, two implementations |
| F5 | `lastBoutWeek` stamping duplicated across bout paths | `boutResolution.ts:173-187` `rosterUpdateImpacts` vs `matchmaking/tournamentSelection/resolution/results.ts:39-54` `lastBoutWeekImpact` | ✅ same impact shape, two emitters |
| F6 | `OffenseDefenseArgs` ≡ `ResolveCombatOffenseDefenseArgs` — identical 36-field interfaces | `combat/resolution/offenseDefense/types.ts` | ✅ type-level dup |
| F7 | Rival weekly-ledger loop re-implements `computeEconomyImpact` mapping | `stableManager.ts:78-98` vs `weeklyBreakdown.ts` `computeEconomyImpact` (~:344-373); different seed salt (`week*31+id.length` vs `week*31`) and rival-only `.slice(-500)` | ✅ same breakdown→ledger mapping |
| F8 | Dead `updateWarriorAfterBout` in `careerUpdate.ts:228-230` — opposite `wasKilled` semantics vs the live `warriorStateUpdater.ts` version used by `recordHandler.ts:7,84,102`; only callers are its own test block (`careerUpdate.test.ts:296-359`) | ✅ dead footgun |
| F9 | Dead `updateWarriorStatus` + `appendFight` slice actions — definitions at `combatActions.ts:25,40`, decls `worldSlice/types.ts:88,98`, `initialState.ts:17,23`; zero production call sites | ✅ dead duplicated bout-outcome application |
| F10 | Hardcoded `.slice(-500)` vs `TRUNCATION_CAPS.rivalLedger` | `stableManager.ts:98`, `agentCore.ts:175`; constant at `truncation.ts:48`, canonical use at `truncation.ts:184` | ✅ magic-number dup of a ratchet |
| F11 | Four ownership-resolution paths | `isPlayerOwned` (`bout/warriorRouting.ts`), `owningStableOf` (`arenaChampionship/core.ts:132`), `state.warriorToStableMap`, ~7 inline `w.stableId === state.player.id` checks | ✅ same question, four answers |
| F12 | Autosim internal dups | `processPlayerOffers` vs `processPlayerOffersScan` filter heuristics and two `extractWeekSummary` (autosim.ts:88-131 vs `tick/timeAdvance/summaries.ts`) | ✅ local dup + namesake collision |
| F13 | Unseeded `generateId()` inside seeded engine paths — V26-D4 bug class | `injuryAndRecovery.ts:44` (every training injury id), `resolveHelpers.ts:83` (purse ledger id — unconditional), `BoutSimulationPass.ts:64`, `warriorFactory.ts:70`, `patronTokenService.ts:24,38,101`, `progressionHandler.ts:146,210`, `reportingHandler.ts:55` (optional-rng fallbacks) | ✅ determinism leak class |
| F14 | Internal file dups | `intelWorker.ts` (~13L block ×2), `RecordBoards.tsx` (render block ×2) | ✅ local dup |
| F15 | `scripts/*.mjs` shared boilerplate | jscpd: 68L clone `entries-in-loop`↔`scan-in-loop`; ~15-23L clusters across `ai-parity-funnel`, `arena-lookup-scan`, `dup-scan`, `function-length`, `param-count`, `srp-census`, `ui-audit-scan`, `balance-lab`↔`style-probe`, seed probes | ✅ tooling dup |

### 2.2 DISPROVED — already unified or intentional; do NOT re-litigate

| ID | Suspected dup | Evidence | Verdict |
|----|---------------|----------|---------|
| X1 | "Tournament day path bypasses bout consequences" | `results.ts` imports `applyRecords`, `handleDeath`, `handleInjuries`, `handleProgressions`, `calculateBoutFame` — V27 consequence-parity work landed. Only F5's lastBoutWeek stamp remains | ❌ resolved upstream |
| X2 | "Duplicate week-advance pipelines" | Canonical `advanceWeek` (`weekPipelineService.ts`); `finalizeWeekTransition` shared by `advanceDay` and `skipToWeekEnd`; autosim calls `advanceWeek` (dual path explicitly removed) | ❌ single canonical flow |
| X3 | "Newsletter/gazette duplicated systems" | `newsletter/feed.ts:107` documents the old accumulator already deleted; gazette (announcement feed) vs newsletter (weekly issue) are distinct domains | ❌ intentional |
| X4 | "Impact merge is clobber-prone" | `impactSystem.ts` MERGE_CONFIG + `resolveImpacts` already handles replacement-ordering and deferred epithets; fine-grained `rivalWarriorPatches`/`rivalRosterRemovals` prevent roster clobbering | ❌ already correct — preserve |
| X5 | "Plan/consumption parity gaps" | V26 landed `applyChallengeContext`, shared `rivalFightPlan`, `persistNPCPlans` (`finish.ts:167-175`), `ai-parity-funnel` guard | ❌ resolved |
| X6 | Literal src↔src clones | `duplication.guard.test.ts` already ratchets (baseline 28) with exempt/debt ledgers; remaining pairs are registered literal pins | ❌ governed already |

### 2.3 REFINED — real overlap but not mechanical merge

| ID | Finding | Verdict |
|----|---------|---------|
| R1 | Ownership resolution (F11) | Keep `warriorToStableMap` for bulk/hot paths; route single-entity lookups (`isPlayerOwned`, `owningStableOf`, inline checks) through one resolver — these serve different perf contracts, not pure dupes |
| R2 | Player equipment validation | Player loadouts are UI-gated (`checkWeaponRequirements`/`validateLoadout` in `useStableEquipment`, `LoadoutCard`, `SlotSelector`); store action trusts callers; AI always fits via `.met`. Effective ruleset identical (bout-legal gear); enforcement surface differs. → Watch item, not a merge |
| R3 | `generateId()` UI-side uses | `economySlice:50,70`, `tutorialBout`, avatar/admin/hiring/startGame seeds, `useRivalryAlerts` — genuinely unseeded UI flows | ✅ intentional — allowlist in guard |
| R4 | `exchangeSetup.ts` vs `resolution.ts` arg-bag | Registered literal pin in `duplication.guard` — the pin is the test | ✅ exempt by design |

## 3. Canonical flows (current → target)

### 3.1 Warrior weekly health tick — W1.1
- **Now:** rivals → `decayFatigue` + `tickRecoveries` (free accelerated heal, all wounded); player → `computeHealthImpact` (fatigue −25 + baseline `tickInjuries`) + accelerated heal only via `'recovery'` assignment in `trainingImpact`.
- **Target:** one `tickStableHealth({ roster, trainers, assignments, policy })` in `src/engine/warrior/` — fatigue −25 for all; baseline `tickInjuries` for all wounded; `processRecovery` accelerated heal **only** for warriors holding a `'recovery'` assignment. Both sides call it; AI `'recovery'` assignments (already written by crown/tournament workers) now actually heal faster — the flag gains meaning. **RNG:** neither `tickInjuries` nor `processRecovery` consumes rng → zero stream change; AI heal-rate drop is a behavior change only.
- **Preserve:** healingBonus source (trainers), `isActive` gating, roster-write shape per container (`rival.roster` vs `rosterUpdates` Map).

### 3.2 Training attempt executor — W1.2
- **Now:** `executeTrainingAttempt` (AI) vs `processAttributeAssignment` (player) — same `processAttributeTraining` primitive, divergent injury-roll gating.
- **Target:** shared `runTrainingAttempt({ warrior, attr, stableCtx, weather, assignments, rng, policy })` in `src/engine/training/` consumed by both. Unified ruleset: weather passed through; injury roll gated on a real attempt (skip on `hardCapped`/`blocked` — this **removes** AI draws on no-op weeks → stream shift); `AI_TRAINING_EFFECTIVENESS` → per §1.1 adjudication (default remove → `1.0`).
- **Preserve:** `computeWarriorStats` recompute post-change, `seasonalGrowth` plumbing, message/results shape for player UI (player needs per-assignment results array; AI needs updated warrior + growth — adapter returns both projections).

### 3.3 Skill drill executor — W1.3
- **Now:** `performAISkillDrill` (no injury roll) vs `processSkillDrillAssignment` (rolls `healingBonus + 1`, weather-aware).
- **Target:** shared `runSkillDrill({ warrior, skillPick, stableCtx, weather, rng })` — drill selection policy stays per-side (AI's evidence-first pick via `suspectedFavoriteLearn` is *agent policy*, legitimately different — the user asks for same *rules*, not same *decisions*); post-selection mechanics identical incl. `healingBonus + 1` injury roll (adds draws for AI → stream shift).
- **Preserve:** `SKILL_DRILL_CAP`, least-drilled fallback order, drill gain math.

### 3.4 Weekly economy ledger emitter — W1.4
- **Now:** `stableManager.applyWeeklyEconomy` inline ledger loop + `slice(-500)` vs `computeEconomyImpact` (player pass).
- **Target:** both consume `computeEconomyImpact` → rival path applies emitted entries with `TRUNCATION_CAPS.rivalLedger`; keep rival seed salt `week*31 + id.length` as an explicit arg (preserves id-sequence vs player `week*31` — collision-avoidance, not ruleset divergence).
- **Preserve:** player `treasuryDelta` vs rival direct-treasury mutation boundary (documented in `resolveHelpers.ts` — rival bout purses ride `weeklyIncome`, player purses ride per-bout `treasuryDelta`; no double-pay).

### 3.5 Bout bookkeeping stamps — W1.5
- **Target:** `lastBoutWeekImpact` + `rosterUpdateImpacts` → single `stampLastBoutWeek(state, wA, wD, week)` in `src/engine/bout/` returning the same `rosterUpdates`/`rivalWarriorPatches` impact shape; consumed by `boutResolution` and tournament `results.ts`.

### 3.6 Ownership resolution — W1.6
- **Target:** `resolveWarriorOwner(state, warriorId)` in `src/engine/core/` (backed by `warriorToStableMap` when present, falls back to scan); `isPlayerOwned`, `owningStableOf`, inline `stableId === player.id` sites route through it. Bulk paths keep the prebuilt map.

### 3.7 Store equipment validation — W7 (was §10/R2 watch item)
- **Now:** `updateWarriorEquipment` slice action trusts callers; legality enforced only in UI (`checkWeaponRequirements`/`validateLoadout`).
- **Target:** store action validates via `validateLoadout` before committing — rejects weapon/armor combos violating attribute requirements; legal loadouts unchanged. UI already prevents illegal picks, so effective player behavior is unchanged; the guard only blocks programmatic bypasses.

### 3.8 Autosim offer acceptance — W8 (was §10 watch item)
- **Now:** autosim accepts player offers on `hype > 100 || purse > 200` (`autosim.ts:88-122`) — a third acceptance standard beside player manual UI and AI `evaluateBoutOffer` (hard gates → risk refusals → desperation → negotiation).
- **Target:** autosim evaluates each offer through `evaluateBoutOffer` against a player→rival adapter (`playerOfferView.ts` mapping player stable → `RivalStableData`-shaped `{ strategy.intent, treasury, roster }`); `Accepted`/`Countered` verdicts are honored via `respondToBoutOffer`, refusals become declines. The autopilot plays by the same ruleset as AI stables.
- **Preserve:** `warriorToOfferIds` index fast-path vs scan fallback (W2.5 merges the duplicated filter loops into one shared candidate-iter).

## 4. Workstreams & file map

| WS | Item | Files touched | New files |
|----|------|---------------|-----------|
| W1.1 | Shared health tick | `engine/ai/stableManager.ts`, `engine/ai/workers/rosterWorker.ts`, `engine/warrior/health.ts`, `pipeline/passes/WarriorPass.ts`, `training/trainingImpact.ts` | `engine/warrior/stableHealth.ts` |
| W1.2 | Shared training executor | `engine/ai/workers/rosterWorkerTraining.ts`, `engine/training/trainingImpact.ts`, `engine/training/trainingGains/` | `engine/training/trainingAttempt.ts` |
| W1.3 | Shared drill executor | same W1.2 set | (in `trainingAttempt.ts` or sibling) |
| W1.4 | Shared ledger emitter | `engine/ai/stableManager.ts`, `engine/economy/weeklyBreakdown.ts`, `engine/ai/agentCore.ts` | — |
| W1.5 | lastBoutWeek stamp | `engine/bout/services/boutResolution.ts`, `matchmaking/tournamentSelection/resolution/results.ts` | `engine/bout/lastBoutWeek.ts` |
| W1.6 | Ownership resolver | `engine/bout/warriorRouting.ts`, `engine/championship/arenaChampionship/core.ts`, ~7 inline sites | `engine/core/warriorOwnership.ts` |
| W2.1 | Delete dead `updateWarriorAfterBout` | `engine/warrior/careerUpdate.ts`, `test/engine/warrior/careerUpdate.test.ts` | — |
| W2.2 | Delete dead slice actions | `state/slices/worldSlice/combatActions.ts`, `types.ts`, `initialState.ts` | — |
| W2.3 | `slice(-500)` → caps | `stableManager.ts:98`, `agentCore.ts:175` | — |
| W2.4 | `extractWeekSummary` rename | `engine/autosim/autosim.ts` | — |
| W2.5 | Offer-filter dedupe | `engine/autosim/autosim.ts` | — |
| W2.6 | Internal file dups | `engine/ai/workers/intelWorker.ts`, `pages/arenaDetail/RecordBoards.tsx` | — |
| W3.1 | Injury id determinism | `engine/training/trainingGains/injuryAndRecovery.ts:44` | — |
| W3.2 | Ledger/bout/newsletter ids | `resolveHelpers.ts:83`, `BoutSimulationPass.ts:64`, `progressionHandler.ts:146,210`, `reportingHandler.ts:55`, `patronTokenService.ts:24,38,101`, `warriorFactory.ts:70` | — |
| W4 | Type consolidation | `combat/resolution/offenseDefense/types.ts` (+ importers) | — |
| W5.1 | Scanner lib | ~15 `scripts/*.mjs` | `scripts/lib/scanLib.mjs` |
| W5.2 | Test↔test clone drain | flagged `src/test/**` pairs → `_fixtures`/`_helpers` | fixture files as needed |
| W7 | Store-boundary equipment validation | `state/slices/` warrior equipment action (+ `data/equipment` reuse) | — |
| W8 | Autosim offer-acceptance parity | `engine/autosim/autosim.ts` (`processPlayerOffers`/`Scan`) | `engine/autosim/playerOfferView.ts` (player→rival adapter) |
| W9 | Required-rng hardening | `warriorFactory.ts`, `patronTokenService.ts`, `progressionHandler.ts`, `reportingHandler.ts` signatures + callers | — |
| G1 | parityFlow guard | — | `scripts/parity-flow-scan.mjs`, `src/test/megaplan/parityFlow.guard.test.ts` |
| G2 | seededId guard | — | `scripts/seeded-id-scan.mjs`, `src/test/megaplan/seededId.guard.test.ts` |
| G3 | jscpd ratchet guard | — | `src/test/megaplan/jscpdRatchet.guard.slow.test.ts` |

## 5. STRICT TEST-FIRST SCHEDULE

Per the user's mandate: **all tests, scanners, and guard tests are authored and committed in Phase T before ANY production edit.** Implementation phases only make pre-written specs go GREEN.

### Phase 0 — Megaplan scaffold (docs only, no code)
- `git tag megaplan-v30-pre`; create `docs/MEGAPLAN_V30_{PLAN,FINDINGS,LEDGER,DEFERRED}.md`; `git mv` V29 set → `docs/archive/megaplans/`; update `megaplanDocLayout.guard` `ARCHIVED_DOCS` allowlist (this is a test-metadata edit, part of scaffold); capture baselines: `bun run test`, `dupes`, `dup-scan`, orphan scan, daily-sim digest.

### Phase T — Complete test landing (RED-verified)
Author, in order, and commit as one test-only landing. Every spec must be **observed failing** against current code and the failure recorded in `LEDGER.md` — RED = failing assertion or missing-symbol import failure. Documented exception: **characterization pins** (marked `// V30 pin:`) that assert *preserved* behavior pass on both old and new code — these are the no-regression net, allowed to be GREEN from the start per the user's exception clause.

New spec files:
1. `src/test/engine/warrior/stableHealth.test.ts` — shared tick: fatigue −25 both sides; baseline heal −1 all wounded; accelerated `1+bonus` **only** under `'recovery'` assignment; AI roster + player roster give identical per-warrior outcomes.
2. `src/test/engine/training/trainingAttempt.test.ts` — shared executor: weather forwarded to injury roll; **no** roll on `hardCapped`/`blocked`; `computeWarriorStats` recompute; `seasonalGrowth` propagation.
3. `src/test/engine/training/skillDrillParity.test.ts` — drill injury roll fires for both sides at `healingBonus + 1`; cap/fallback order preserved.
4. `src/test/engine/ai/rosterFlowParity.test.ts` — integration: `runAITraining`-equivalent vs player path on identical inputs → identical warrior outcomes (modulo removed effectiveness per §1.1).
5. `src/test/engine/economy/weeklyLedgerParity.test.ts` — shared emitter: rival entries capped at `TRUNCATION_CAPS.rivalLedger`, entry shape identical to player ledger entries.
6. `src/test/engine/bout/lastBoutWeek.test.ts` — stamp parity: pipeline + tournament paths emit identical impact shape for same inputs.
7. `src/test/engine/core/warriorOwnership.test.ts` — resolver equivalence: player/rival/free-agent/missing cases across all three legacy call shapes.
8. `src/test/engine/training/injuryIdDeterminism.test.ts` — two same-seed runs → byte-identical injury ids.
9. `src/test/megaplan/parityFlow.guard.test.ts` + `scripts/parity-flow-scan.mjs` — scans that `rosterWorker*`/`stableManager` import shared flow fns and do NOT re-declare heal/fatigue/injury-roll logic (ai-parity-funnel precedent: import-graph allowlist).
10. `src/test/megaplan/seededId.guard.test.ts` + `scripts/seeded-id-scan.mjs` — no `generateId(`/`cryptoRandom`/`Math.random` in `src/engine/**` outside the R3 allowlist.
11. `src/test/megaplan/jscpdRatchet.guard.slow.test.ts` — runs `jscpd` against the post-campaign baseline (baseline constant set in Phase 6; lands RED as a placeholder-then-pinned guard — see Phase 5/6 ordering note).
12. `src/test/state/warriorEquipmentValidation.test.ts` — `updateWarriorEquipment` rejects loadouts failing `validateLoadout` (weapon req miss, illegal combo), accepts legal loadouts, no-ops on missing warrior.
13. `src/test/engine/autosim/offerAcceptanceParity.test.ts` — autosim's `processPlayerOffers` routes each offer through `evaluateBoutOffer`: hard-gated offer declined despite `hype > 100`; refusal-class offers declined; accepted verdicts respond `Accepted`.
14. Characterization pins appended to: `careerUpdate.test.ts` (delete dead describe → convert to "absent" assertion), autosim summary spec, ownership call-site specs.
15. Guard registration: add G1+G2+G3 to `GUARD_REGISTRY` in `testQualityAudit.test.ts`; regenerate `bun scripts/test-audit-scan.mjs`.

### Phase 1 — W2 dead code + namesake fixes (lowest risk)
Flip W2 specs GREEN. Delete F8/F9 dead code + their dead test blocks; caps constants; autosim renames/dedup; internal file extractions (F14). Verify: `bun run test`, `type-check`, `lint`.

### Phase 2 — W1.4 economy + W1.5 stamps + W1.6 ownership + W4 types + W7 validation
Flip corresponding specs GREEN. Pure consolidation, zero ruleset change (rival ledger cap/seed preserved); W7 adds a store-boundary guard the UI already enforces (no effective behavior change). Verify: `bun run test`, `type-check`, `lint`, `dupes` (expect clone-count drop → re-baseline `duplication.guard` ledgers as debt drains).

### Phase 3 — W1.1/W1.2/W1.3 shared flows (the parity core) + W8 autosim acceptance
Flip W1/W8 parity specs GREEN. Same-ruleset mechanics both sides; AI loses free accelerated heal + no-op injuries, gains drill injuries + weather-aware rolls; autosim autopilot adopts `evaluateBoutOffer`. Verify: `bun run test`, `test:slow` (pipeline/sim/determinism surfaces), `dupes`.

### Phase 4 — W3 seeded-id determinism + W9 required-rng hardening
Deterministic ids (derive from `warriorId:week:seq`/`contractId` — **zero rng draws**, so no extra stream shift beyond Phase 3). `rng` becomes required in engine-seeded signatures (`warriorFactory`, `patronTokenService`, `progressionHandler`, `reportingHandler`); callers updated, UI-side unseeded entry points keep generating ids via the allowlisted UI paths only. Flip `injuryIdDeterminism` + `seededId` guard GREEN. Verify: determinism suite, two same-seed sim runs → identical digests, `type-check`.

### Phase 5 — W5 scripts/test consolidation
`scanLib.mjs` extraction (each refactor re-runs that scanner's guard to prove output-identical); test↔test drain to `_fixtures`/`_helpers` (testQualityAudit factory rules; register only literal-pin exempts). Verify: `test`, `test:slow` guards, `dupes`, `dup-scan` rebaseline.

### Phase 6 — Re-baseline + close-out
- Re-baseline: `duplication.guard` counts, jscpd report (→ G3 ratchet baseline constant), daily-sim/world-diag digests (stream shifted by Phase 3), `test-audit-scan` regen.
- Sim-health check: `daily-oracle` 1000-week sim + style-probe — confirm AI-side nerfs didn't collapse rival competitiveness; record in FINDINGS.
- `git tag megaplan-v30-post`; finalize LEDGER; fold leftovers → `MEGAPLAN_BACKLOG.md`; write DEFERRED.

## 6. RNG / determinism ledger

| Change | Stream effect | Digest effect |
|--------|---------------|---------------|
| W1.1 unified health | none (heal fns consume no rng) | none |
| W1.2 gated AI injury rolls | **removes** draws on AI no-op weeks | shifts |
| W1.3 AI drill injury roll | **adds** draws on AI drill weeks | shifts |
| W1.2 weather passthrough | none (same draw count, different odds) | outcome drift |
| §1.1 effectiveness removal | none (same draws, different gate results) | outcome drift |
| W1.4 ledger seed salt | none (explicit arg preserved) | none |
| W3.x deterministic ids | none (no draws added) | id values change → deterministic |
| All other items | none | none |

Net: **one** world re-baseline, attributable entirely to Phase 3 (+ id-shape changes in Phase 4). No save-schema change anticipated → no `SAVE_STATE_VERSION` bump unless implementation discovers otherwise.

## 7. Preservation notes (what must NOT be lost)

- `rivalWarriorPatches`/`rivalRosterRemovals` fine-grained impact keys — anti-clobber design (documented in impact handlers).
- Player per-assignment `TrainingResult` messages for UI; AI's `seasonalGrowth` side-channel.
- AI drill-pick *policy* (`suspectedFavoriteLearn` evidence-first, primary-style, least-drilled fallback) — agent decision, legitimately distinct from player's manual pick.
- AI `'recovery'` assignments from crown/tournament workers — gain real meaning under unified healing.
- Rival ledger cap + seed-salt `id.length` term (collision avoidance vs player ledger).
- `isActive` gating everywhere; `MutableInput` ownership boundary in autosim.
- AI-only scouting/intel dossiers and player-only UI surfaces — designed asymmetry, untouched.
- Exempt literal pins in `duplication.guard` — never auto-drain.

## 8. Verification matrix

| Gate | When |
|------|------|
| `bun run test` + `type-check` + `lint` | every phase |
| `bun run test:slow` | Phases 3,4,5 (pipeline/sim/determinism/guard surfaces) |
| `bun run dupes`, `dup-scan` rebaseline | Phases 2,5,6 |
| `bun run test:bun` (Bun parity) | Phase 6 |
| `bun run e2e` | only if W2.6 UI extraction changes rendering |
| daily-oracle sim + style-probe | Phase 6 (post-parity world health) |
| Two-run seeded digest equality | Phase 4 + Phase 6 |

## 9. Risks & rollback

- **Balance risk (largest):** unified rules nerf AI healing + add AI drill injuries; §1.1 effectiveness removal buffs AI training ~25%. Mitigated by Phase-6 sim probes; rollback = revert Phase 3 commits (independent batch) or restore `megaplan-v30-pre` tag.
- **Mid-flight red suite:** Phase T intentionally lands RED specs — expected only until each batch lands; targeted spec runs are the gate, not full-suite green mid-phase.
- **Shard equivalence:** `rivalStableShard` runs inline OR distributed — shared-flow refactor must keep `processRivalStable` pure/deterministic in both modes (parity spec covers both paths).
- **Test drain overreach:** only pairs with an obvious shared home drain; literal pins stay exempt — conservative default.

## 10. DEFERRED / watch items (into DEFERRED at close-out)

All previously-listed watch items moved into active workstreams per D6:
- Player `updateWarriorEquipment` validation → **W7** (Phase 2).
- jscpd ratchet guard → **G3** (Phase 6 baseline).
- Required-rng API hardening → **W9** (Phase 4).
- Autosim offer acceptance → **W8** (Phase 3).

Explicit non-goals this campaign (per user clarification "just the v30 items"): open BACKLOG rows — V22-D3 damage-model rewrite, V22-D4 ADM graduation tier, V24-D5 game modes, V15 engine-pool sizing — stay open in `MEGAPLAN_BACKLOG.md` untouched.

## 11. Methodology note (validation already performed)

This draft is itself the validated plan: each §2 verdict cites the file:line evidence re-read during review; X1–X6 record *disproven* hypotheses (already-unified work from V26/V27/V29) so the campaign doesn't re-litigate adjudicated items. Remaining "verify-at-phase-time" items are marked inline (approximate line numbers re-pinned at implementation time).
