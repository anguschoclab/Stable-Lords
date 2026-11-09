# MEGAPLAN V26 — NPC/Player Parity Audit & Harmonization

One-sentence summary: Validated audit of the V22–V25 window (~118 commits): five real parity gaps plus a cross-cutting signing-funnel field-loss bug, closed via a strict test-first megaplan — complete RED spec batch before any implementation, then harmonized bloodfeuds, a shared favorites-discovery channel (incl. new tactic discovery), generation parity, a shared turnaround advisor consumer, and cleanup, ending in a mandatory world re-baseline.

## Validation verdict on the draft (explicit approve/disprove per claim)

| Draft claim | Verdict | Evidence |
|---|---|---|
| G1: `generateAIRecruit` misses favorites/equipment/potential/trainability | **APPROVED + deepened** — `signWarrior(prebuilt)` returns the warrior verbatim; `checkDiscovery` no-ops on `!fav`; `canGrow` treats missing potential as uncapped; `suspectedFavoriteWeapon` returns undefined; `applyInsightToken`/`mergeWeaponChart` no-op | `recruitGenerator.ts:201-218`, `signWarrior.ts:201-209`, `favorites.ts:184,274-279,332-348` |
| G2: `biasedAttrs` mints DOA builds (no DA floors, no concept steering) | **APPROVED + deepened** — all stats start at 3, template `attrBias` weights only; AND `makeWarrior` never sets `potential`, so world-minted rosters share the uncapped-headroom bug | `rivalWarriorFactory.ts:16-48`, `warriorFactory.ts:63-85` |
| G3: bloodfeuds are player-keyed | **APPROVED** — mark written only when `playerWarriorIds.has(victim.id)`; `bloodfeudSet` consulted only when `ctx.playerWarriorIds.has(warriorA.id)`; mark has no `owedStableId` field; dedup keyed by `killerWarriorId` latest-wins | `bloodfeud.ts:24-39`, `mortalityHandler.ts:283-293`, `offerMatchmaking.ts:183-193`, `impacts/warriors.ts:144-153`, `PromoterPass.ts:173-177` |
| G4: AI plans never consume rhythm/tactic favorites; `discovered.tactic` doesn't exist | **APPROVED** — `discovered` = `{weapon, rhythm, learn, hints}` only; `checkDiscovery` has 3 sections; AI tactics come from `defaultStylePreset` + `mods.changeTactics` + counter-lever + riposte-fill; nothing reads `favorites.rhythm`/`favorites.tactic` in plan code. Note: `getAITactics` is used ONLY for decoy axes — `strategicLayer.ts:199-208` doc comment claiming it feeds base tactics is stale | `favorites.ts:142-155,216-265`, `planDefaults.ts`, `strategicLayer.ts:196-209`, `doctrine.ts:124-131` |
| G5: `recentLossFactors` written but never consumed; `diagnoseTurnaround` player-only | **APPROVED + refined** — ledger written in `seasonRecord.recordBoutOutcome`, cloned in `cloneStrategyMemory`, read nowhere. `diagnoseTurnaround(w)` is pure, returns structured `TurnaroundAction[]` (kinds plan/weapon/challenge/avoid/train/drill/learn) — **reuse it directly** rather than building a parallel table | `seasonRecord.ts:111-147`, `strategyLab.ts:36`, `turnaroundAdvisor.ts:277-313` |
| G6: orphaned `DOUBLE_CHALLENGE_MULT`; EquipmentPass subsumed; fallback `killDesire: 7` | **APPROVED + deepened** — `DOUBLE_CHALLENGE_MULT` has zero usages (real mechanism is `challengeCounts × CHALLENGE_BONUS`). EquipmentPass is worse than redundant: it vets favorites at `attPenalty < -4` while `rosterWorkerEquipment` uses `.met` → a discovered favorite that fails `.met` gets equipped by EquipmentPass then stripped by `refitRosterWeapons` in the same tick — weekly oscillation between two legality standards. Fallback `kd:7` at `boutResolution.ts:79` | `balance.ts:232`, `EquipmentPass.ts:23-27`, `rosterWorkerEquipment.ts:34,74-75`, `boutResolution.ts:79` |
| G7: player may lack `challengePlans` authoring | **DISPROVEN — parity confirmed** — `ContingencyPlans.tsx` gives the player `whenProposer`/`whenChallenged` authoring; `applyChallengeContext` merges symmetrically for both combatants | `ContingencyPlans.tsx:83-167`, `challengePlans.ts:50-62` |

## New findings surfaced by validation (not in draft)

| # | Finding | Files | Severity |
|---|---|---|---|
| N1 | **Signing funnel loses fields for ALL signings (player AND AI)**: `poolWarriorToWarrior` drops `handedness` (→ ambi dual-wield ease, ambi-reversed primary side, and disarm hand semantics lost — `fighterState.ts:70,284-287`, `offhandAttack.ts:54`, `disarm.ts:132`), `trainability` (→ flat 0.6/0.65 defaults in `traitTraining.ts:70`/`traitCapacity.ts:21`), `xp`, `learnedSkills`, `skillDrills`, `strategyMemory`, `burnedSkills`. `warriorToPoolWarrior` doesn't carry those into `PoolWarrior` either → **freed veterans lose all bout progression on re-sign** | `signWarrior.ts:106-167`, `freeAgents.ts:17-59`, `recruitment/types.ts:35-80` | HIGH — one funnel fix heals both sides |
| N2 | **Masked-decoy discovery leak**: `checkDiscovery` context reads `w.plan` — for Tactician/Methodical rivals `w.plan` is the DECOY, not the fought plan. Rhythm-symmetry rolls (and the new tactic symmetry) must consume the resolved plan, not the persisted one | `progressionHandler.ts:188-192`, `boutResolution.ts:130-143`, `agentPlan.ts` | MEDIUM — wrong-input bug, fixed by threading planA/planD |
| N3 | `collectAllWarriors` includes rival rosters → the `findBestOpponent` feud branch generalizes cleanly to `owedStableId === warriorA.stableId` — ONE priority mechanism serves rival-vs-rival, rival-vs-player, and player-vs-rival feuds | `warriorCollection.ts:84`, `offerMatchmaking.ts:183` | Design enabler |
| N4 | `bookableRoster` excludes warriors with ANY `trainingAssignments` entry → a turnaround 'recovery' assignment suppresses bids automatically — rest enforcement is free | `boutBidding/generation.ts:135-156` | Design enabler |
| N5 | `favoriteLearnOf(w)` is `id`-hashed (not favorites-derived) → favorite-learn affinity works even without `favorites`; only `discovered.learn` requires the object | `learnRoll.ts:50` | Informational |

## Audit parity matrix (V22–V25 mechanics)

### A. Already at parity — no action

| Mechanic (source megaplan) | Shared/AI path |
|---|---|
| All V22–V24 combat mechanics (will checks, endurance burn/recovery, dodge-riposte, ATT crit, hard-hit threshold, handedness, KD tax, clash jitter, offhand attack/disarm, weapon-vs-armor overrides, unsuited/double-tactic drains, favorite tactic hidden bonus, always-on rhythm bonus, luck pools, STYLE_PENALTIES) | `simulateFight` — symmetric, reads each warrior's plan/favorites/equipment |
| Per-fight learning (Arena-93) + learn caps (LEARN_PER_SKILL_CAP 20 / career 120) | `rollBoutLearns` for both fighters in `handleProgressions` |
| Favorites discovery + weapon charting | `checkDiscovery` + `mergeWeaponChart` for both fighters in `progressionHandler` |
| Full plan stack: style doctrine caps, V25 archetype shaping (tank OE floor, defensive caps, riposte nudge), matchup mods incl. ST-vs-TP throttle, strategy-lab ε-greedy, dossier planIntel, rematch adaptation, decoy plans, phase plans, fallback/adaptive conditions (WIT+competence gated), challenge plans | `aiPlanForWarrior` via `rivalFightPlan` → `getNPCPlan`; signed plans persisted (`agentPlan`), recomputed when stale/opponent-mismatched/masked |
| Challenge-plan authoring (player `ContingencyPlans` ↔ AI `applyChallengePlanEmission`) | `applyChallengeContext` merges symmetrically |
| Canon targeting (TP avoids AB, AB avoids LU, etc.) | `canonTargetingBias` in rival bid generation AND nemesis refusal (≤−3) in `verifyBoutAcceptance`/`evaluateBoutOffer` |
| Weather dispositions (incl. Threads of Chaos offseason-only) | shared `weatherSuitability` table → acceptance, offer decline, committee, bid modifiers, intent hazard |
| Archetype-aware armor fitting, favorite-weapon preservation, validated loadouts (weapon reqs, 2H/shield, restricted styles, carry) | `rosterWorkerEquipment` → `generateRecommendations`, `fitArchetypeArmor`, `refitWeapon`, `favoriteWeaponPick` |
| Shared training pipeline (potential, TOTAL_CAP, seasonal caps, burns via skillBurn, injuries, recovery) | `rosterWorkerTraining` → same `processAttributeTraining`/`processSkillDrillTraining`/`processRecovery`; suspected-favorite-learn drills; TP scum order; burn-risk exclusion; WT-learn floor |
| AI learn-seek bidding | `AI_LEARN_*` in `boutBidding/conversion.ts` |
| Honor-culture down-challenge penalty | bid `dishonorPenalty` (AI) / gazette stigma (player) |
| Bankrupt successors, floor refills, starvation folds | `mintSuccessorStable`, `mintFloorRefill`, `runStarvationAndFreeAgents` — all via `generateRivalStables` |
| Deterministic shard execution | `RivalStrategyPass` inline/worker byte-identical |
| Pool-draft signings (dominant recruit path) | `signWarrior({recruit})` → `poolWarriorToWarrior` |
| Free-agent veterans keep favorites/potential | `warriorToPoolWarrior` preserves (backfills when missing) |
| Academy claims | `RecruitmentPass` assigns `academyStableId`; `visiblePool` enforces first-look |

### B. Intentional asymmetries — document only

- `AI_TRAINING_EFFECTIVENESS = 0.8` attempt-rate handicap; competence-tier noise (`competenceJitter`); personality-gated behaviors — design, not gap.
- Player-only surfaces: PlanBuilder, Design Review (`reviewWarriorDesign`), TurnaroundCard UI, Almanac, SchedulingAssistant, insight tokens, gazette/learn write-ups, challenge/avoid list UI.
- AI-only advantages: `planIntel` dossiers, strategy-lab plan-cell memory, masked decoy plans (Tactician/Methodical) — the player's scouting-report analog.
- Player challenge/avoid lists vs AI emergent avoidance (`stableIsAvoided`, canon targeting, grudges) — different interfaces over the same intent; bloodfeud is the exception that must be unified (G3).
- `STYLE_RHYTHM_RANGES`/`FAVORITE_TACTIC_POOLS` generation tables — shared already.

## User decisions applied

1. **Harmonize feuds for all stables** → Phase 5: single `bloodfeudMarks` table keyed by owed stable; writer emits for every non-tournament kill; two consumers (generalized promoter branch + rival feud-priority bids); VENDETTA remains mark-less aggression.
2. **Same discovery system for all favorites** → Phase 4: `discovered.tactic` + `tacticHints` added to the shared schema + `checkDiscovery`; AI consumes discovered rhythm/tactic exactly as an informed player would; strategy-lab explore arm probes WS-suited tactics so AI warriors earn discoveries organically.
3. **All of it** → Phases 2–3 close generation parity (including the funnel field-loss bug affecting the player too); Phases 4–6 close consumption parity.
4. **Lightweight turnaround consumer** → Phase 6: reuse `diagnoseTurnaround` directly — shared advisor, structured `TurnaroundAction[]` translated onto AI surfaces.

## Strict test-first mandate

**Phase 1 writes the ENTIRE spec batch and proves every spec RED before any implementation begins.** No phase may touch production code until its specs exist and fail for the right reason. Specs are filed by subject domain under `src/test/<domain>/` (`testQualityAudit` enforces filing), fast-tier by default — `*.slow.test.ts` only where a spec simulates many weeks.

## Implementation phases

### Phase 0 — Findings & ledger scaffold
- Write `MEGAPLAN_V26_FINDINGS.md`: the parity matrix above + validation verdicts (approved/disproven per claim, N1–N5).
- Scaffold `MEGAPLAN_V26_LEDGER.md` rows per phase.
- No code changes.

### Phase 1 — COMPLETE RED spec batch (all tests before any implementation)

| Spec file (fast tier unless noted) | Asserts |
|---|---|
| `src/test/engine/recruitment/signWarrior.parity.test.ts` | `poolWarriorToWarrior` carries `handedness` (incl. ambi/ambi-reversed), `trainability`, `xp`, `learnedSkills`, `skillDrills`, `strategyMemory`, `burnedSkills` for veterans (new `PoolWarrior` fields); ordinary recruits get rolled `trainability` + `handedness` at conversion |
| `src/test/engine/ai/recruitMaterialization.parity.test.ts` | `generateAIRecruit` → `signWarrior` output carries `favorites` (weaponId/rhythm/tactic/discovered), fitted `equipment` (`checkWeaponRequirements(...).met`), `potential` (tier headroom, `canGrow` caps), `trainability`, `handedness`; `checkDiscovery` mutates them |
| `src/test/engine/rivals/mintQuality.parity.test.ts` | `generateRivalStables`, `mintSuccessorStable`, `mintFloorRefill`, expansion mints: no ST<7/WL<7 (DA floor); style-keyed attrs track `conceptMean` directionally (distributional bounds, not exacts); warriors carry `potential` (template tier→headroom mapping) |
| `src/test/engine/favorites/tacticDiscovery.test.ts` | `generateFavorites` emits `discovered.tactic=false`/`tacticHints=0`; `checkDiscovery` tactic symmetry — fought plan used the favorite → ~25% reveal, else ~2%; hints cap 2; tactic-discovery rolls consume a dedicated per-warrior sub-stream (shared bout stream unaffected); schema round-trip with optional-field defaults |
| `src/test/engine/ai/plan/discoveredFavorites.test.ts` | `aiPlanForWarrior`: `discovered.rhythm` → OE/AL steered toward favorite cell, clamped to doctrine (TP-scum OE≤5 respected even when rhythm OE=8); `discovered.tactic` → correct slot holds favorite (off vs def by tactic type); undiscovered → preset tactics and no steering (information parity); strategy-lab explore arm probes a WS-suited tactic deterministically |
| `src/test/engine/bout/discoveryContext.test.ts` | `handleProgressions` feeds the RESOLVED plan (not `w.plan`) into `checkDiscovery` — a masked decoy's OE/AL/tactics no longer drive symmetry rolls; fought weapon feeds weapon symmetry |
| `src/test/engine/matchmaking/bloodfeud.harmonized.test.ts` | Kill vs rival victim → mark `owedStableId = victim.stableId`; kill vs player → owed to player stable id; tournaments exempt; `findBestOpponent` feud branch fires for ANY warrior whose stable holds a live mark on the candidate (transcends score window + priority); dedup keyed `(owedStableId, killerWarriorId)` latest-wins; expiry pruning at read AND write; rival mark → `targetStableId` feud bid emitted BEFORE intent emitters (feud precedence, vendetta-style bypass of `stableIsAvoided`); owed side's acceptance skips canon-nemesis refusal via a `bloodfeud` offer tag; killer side evaluates normally |
| `src/test/engine/ai/turnaround.test.ts` | Losing AI warrior gets `diagnoseTurnaround`-mapped actions: 'drill'→skill-drill assignment to win-condition skill; 'train'→attribute-focus override; 'avoid'→bid suppressed vs that style; 'challenge'→bid bonus vs that style; 'recovery'→rest assignment (which also suppresses bids via `bookableRoster`'s assignedIds filter); non-losers untouched; `recentLossFactors` gates response strength |
| `src/test/engine/ai/npcPlanFallback.test.ts` | `getNPCPlan` rivalMap-missing fallback → legal plan, KD from style preset (not hardcoded 7) |
| `src/test/engine/pipeline/equipmentPassRemoval.test.ts` | Single-writer invariant: a discovered favorite that fails `.met` is NOT equipped anywhere in the tick (no oscillation); `refitRosterWeapons` alone handles favorite equipping at the `.met` standard |
| `src/test/megaplan/aiParity.guard.test.ts` (+ `scripts/*.mjs` scan per guard-ratchet pattern) | Structural invariant: every warrior-materialization path funnels through the field-complete converter (no direct `Warrior` literal construction bypassing funnel fields) |

### Phase 2 — Funnel completeness (G1 + N1)
- `PoolWarrior` gains `handedness`, `trainability`, `xp`, `learnedSkills`, `skillDrills`, `strategyMemory`, `burnedSkills` (optional; veterans populate them).
- `warriorToPoolWarrior` preserves them on the out-path; `poolWarriorToWarrior` restores them on the in-path — veterans keep progression; prospects roll `trainability`/`handedness` at conversion when absent.
- `generateAIRecruit` → produces a `PoolWarrior`-shaped entry (personality/adaptation style pick + `generateRecruitAttrs` attrs — already concept-blended + DA-floored) signed via `signWarrior({recruit})` — never `prebuilt`.
- Specs green: `signWarrior.parity`, `recruitMaterialization.parity`.
- Determinism: fallback-mint draw counts change → documented stream shift, re-baseline.

### Phase 3 — Mint-build quality (G2 + potential backfill)
- Extract the ticket-mix (concept-mean style tickets + DA_ST/DA_WL floors) from `generateRecruitAttrs` into a shared helper; `biasedAttrs` composes it with template `attrBias` (template personality bias preserved, `catchupPool` semantics unchanged).
- `makeWarrior` gains `potential` via `generatePotential` — tier→headroom band mapping (Minor→Common, Established→Promising, Major→Exceptional, Legendary→Prodigy; uncategorized → Promising).
- Specs green: `mintQuality.parity`.
- Determinism: every mint stream shifts → world re-baseline mandatory.

### Phase 4 — Favorites discovery & consumption parity (G4 + N2)
- `WarriorFavorites.discovered` gains `tactic?: boolean` + `tacticHints?: number` (optional fields — no fixture churn, no migration).
- `checkDiscovery`: 4th section on a **dedicated per-warrior sub-stream** (`hashStr(w.id)|tactic-discovery`) — keeps the shared bout stream bit-stable per the determinism-debug skill; context gains fought `offensiveTactic`/`defensiveTactic`; symmetry at `CHANCE_REVEAL_SYMMETRY`; hint cap 2.
- `handleProgressions` args thread the RESOLVED planA/planD (fixes the masked-decoy leak — N2): discovery context uses fought `plan.OE`/`plan.AL`/tactics and the fought weapon for BOTH fighters.
- New `applyDiscoveredFavorites(plan, w)` step in `aiPlanForWarrior`, applied after `applyStrategicLayer` (a discovered favorite wins over rematch overrides — warriors run what they love): `discovered.rhythm` → nudge OE/AL toward the favorite cell inside doctrine bounds; `discovered.tactic` → set the correct slot.
- Strategy-lab explore arm: on `exploring`, deterministic hash-gated chance to substitute a weighted WS-suited tactic — the "experimenting manager" earns tactic discoveries organically and diversifies rival tactics for scouting.
- Player surface: favorites panel shows discovered tactic (the one small UI touch → chromium e2e smoke).
- Specs green: `tacticDiscovery`, `discoveredFavorites`, `discoveryContext`.

### Phase 5 — Harmonized bloodfeuds (G3)
- `BloodfeudMark` gains `owedStableId: StableId`. `state.playerBloodfeuds` → `state.bloodfeudMarks` (clean rename — zero compat constraint). Schema + `worldSlice` types + `initialState` + `impacts` handler (dedup key `(owedStableId, killerWarriorId)`, latest-wins, write-time expiry prune — mirrors existing merge).
- `bloodfeudMarksFromOutcome` → emits for ANY non-tournament kill, owed to `victim.stableId` (mark carries `killerWarriorId`, `killerStableId`, `owedStableId`, `expiresWeek`).
- `findBestOpponent` feud branch → gate on `marksOwedBy.get(warriorA.stableId)` (generalizes the player branch — the player stable is just another stable id; N3). `PromoterPass` builds the owed-index; `playerWarriorIds` no longer needed for feuds.
- New `emitFeudBid` in `INTENT_EMITTERS`, precedence above `emitVendettaBid`: a rival stable holding a live mark emits `targetStableId = killerStableId` proposals from bookable stablemates; vendetta-style bypass of `stableIsAvoided`; player-bound feud bids ride `MAX_PLAYER_OFFERS_*` caps.
- Feud offers carry a `bloodfeud: true` tag so the owed side's acceptance skips the canon-nemesis refusal (victim-side doctrine overrides); the killer's side evaluates normally.
- Specs green: `bloodfeud.harmonized`.

### Phase 6 — Turnaround consumer (G5)
- New `src/engine/ai/turnaround.ts`: weekly in `rosterWorker` (before `runAITraining`), for warriors where `diagnoseTurnaround(w)` returns a report — translate `TurnaroundAction`s onto AI surfaces: `drill` → next `performAISkillDrill` targets `report.winCondition.skill`; `train` → `selectTrainingFocus` override; `challenge`/`avoid` → a per-warrior `turnaroundTargets` nudge consumed by bid scoring (± canon bias scale); `plan`/`weapon`/`learn` → already covered (strategyLab / `refitRosterWeapons` / learn-seek bids — comments note the coverage).
- `recentLossFactors` gates response strength (≥2 same-factor entries → full response; else advisory-only) — the dead ledger earns its keep; 'recovery' assignments suppress bids for free (N4).
- Specs green: `turnaround`.

### Phase 7 — Cleanup (G6)
- Delete `DOUBLE_CHALLENGE_MULT` (orphan; real mechanism is `challengeCounts × CHALLENGE_BONUS`).
- Remove `EquipmentPass` + its `writes` entry — `refitRosterWeapons` is the single writer at the stricter `.met` standard (proven by `equipmentPassRemoval` spec; kills the `attPenalty<-4` vs `.met` oscillation). Run the week-pipeline gate tests: `weekPipelineDAG`, `passOrdering`, `passPurity`, `impactMergeOrder`, `mutableInput`.
- `getNPCPlan` fallback → `defaultPlanForWarrior(w)` without the `killDesire: 7` override.
- Specs green: `npcPlanFallback`, `equipmentPassRemoval`, `aiParity.guard`.

### Phase 8 — Close-out battery + re-baseline
- `bun run test` (full fast tier), `bun run type-check`, `bun run lint`.
- `bun run test:slow` — REQUIRED here (we touch sim/pipeline/determinism paths): determinism suites (same-seed + shard-vs-inline + narration), week-determinism, world-liveness, fixture + world balance guardrails.
- `balance-lab` + `world-diag` on 3 seeds (12345 / 777 / 2024): expected shifts — DA-floored mints (stronger world builds), capped potential on mints (mild long-run nerf vs the uncapped status quo), discovered-rhythm/tactic AI plans (small AI bump), rival feud bids (more kill→feud churn), fallback recruits with favorites. Record before/after matrices in the ledger; re-ratchet only if bands break (combat-balance discipline: `STYLE_PENALTIES`, never the matrix).
- `bun run e2e` chromium smoke — favorites-panel tactic row.
- Write `MEGAPLAN_V26_LEDGER.md` (commit hash per phase) + `MEGAPLAN_V26_DEFERRED.md` for anything punted.

## Files to modify

- **Funnel**: `src/engine/recruitment/recruitment/types.ts`, `src/engine/recruitment/recruitment/freeAgents.ts`, `src/engine/recruitment/signWarrior.ts`, `src/engine/owner/roster/recruitGenerator.ts`, `src/engine/ai/workers/recruitmentWorker.ts`
- **Mint**: `src/engine/rivals/rivalWarriorFactory.ts`, `src/engine/factories/warriorFactory.ts`, shared ticket-mix helper extracted from `src/engine/owner/roster/recruitGenerator.ts`
- **Favorites**: `src/types/warrior.types.ts`, `src/schemas/warriorSchemas.ts`, `src/engine/favorites/favorites.ts`, `src/engine/bout/progressionHandler.ts`, `src/engine/bout/services/boutResolution.ts`, `src/engine/ai/plan/coreGenerator/` (new `applyDiscoveredFavorites` step), `src/engine/ai/plan/strategyLab.ts`, `src/components/**` favorites panel
- **Feuds**: `src/types/state/gameState.ts`, `src/schemas/gameStateSchema.ts`, `src/state/slices/worldSlice/{types,initialState}.ts`, `src/engine/matchmaking/bloodfeud.ts`, `src/engine/bout/mortalityHandler.ts`, `src/engine/impacts/{types,warriors}.ts`, `src/engine/pipeline/passes/PromoterPass.ts`, `src/engine/promoters/offerMatchmaking.ts`, `src/engine/ai/workers/competitionWorker/boutBidding/{generation,conversion,types}.ts`
- **Turnaround**: new `src/engine/ai/turnaround.ts`, `src/engine/ai/workers/rosterWorker.ts`, `src/engine/ai/workers/rosterWorkerTraining.ts`, `src/engine/ai/workers/competitionWorker/boutBidding/generation.ts`
- **Cleanup**: `src/constants/combat/combat/balance.ts`, `src/engine/pipeline/passes/EquipmentPass.ts` (delete), `src/engine/pipeline/services/weekPipeline/passes.ts`, `src/engine/bout/services/boutResolution.ts`
- **Docs**: `MEGAPLAN_V26_{FINDINGS,PLAN,LEDGER,DEFERRED}.md` at repo root

## Verification

- [ ] Phase-1 spec batch exists; every spec fails RED for the intended reason before any implementation
- [ ] `bun run test` green (fast tier incl. all new parity specs)
- [ ] `bun run type-check` + `bun run lint` clean
- [ ] `bun run test:slow` green — determinism suites (same-seed, shard-vs-inline, narration) + fixture/world balance guardrails
- [ ] `bun run e2e` chromium smoke (favorites tactic row)
- [ ] `balance-lab` + `world-diag` re-baselined on 3 seeds; matrices recorded in ledger
- [ ] Guard scans pass (`testQualityAudit` domain filing, orphan-scan, duplication guard)
- [ ] Ledger rows carry commit hashes; deferred register written

## Risks / considerations

- **RNG streams**: `biasedAttrs`/`generateAIRecruit` changes shift mint draws → world re-baseline mandatory (same discipline as V24/V25). Tactic discovery draws from a dedicated per-warrior sub-stream (`hashStr(w.id)|tactic-discovery`) — no shared-stream shift. Feud marks are pure bookkeeping — zero draws.
- **Balance**: DA-floored mints (stronger builds) vs capped potential on mints (mild nerf where mints were uncapped) vs discovered-favorites AI plans (small bump) vs feud loops (more churn) — measure on 3 seeds, don't guess; re-ratchet `STYLE_PENALTIES` only if bands break.
- **Single-writer discipline**: `poolWarriorToWarrior` = the only pool→warrior materializer; `checkWeaponRequirements(.met)` = the only legality standard; `diagnoseTurnaround` = the only turnaround diagnoser. No parallel implementations — the EquipmentPass oscillation is the cautionary tale.
- **Info parity**: AI never reads undiscovered favorites — specs assert the gate in both directions (present→steer, absent→no steer).
- `generateAIRecruit` is the small-slice path; `biasedAttrs` is the high-volume fix — Phase 3's re-baseline is the largest seeded-diff surface.
