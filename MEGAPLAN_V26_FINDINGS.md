<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->
# MEGAPLAN V26 FINDINGS — NPC/Player Parity Audit

Scope: the last ~2 weeks of canon work (~118 commits, 2026-10-27 →
2026-11-09, the V22-tail/V23/V24/V25 cascade) — audited for whether the
NPC AI drives the same mechanics, the same information model, and the
same generation quality as the player. Every draft claim re-verified
against the code; verdicts: **APPROVED** / **APPROVED + deepened** /
**REFINED** / **DISPROVED**. New findings N1–N5 surfaced by the
validation pass itself.

## Draft-claim verdicts

| # | Draft claim | Verdict | Evidence |
|---|---|---|---|
| G1 | `generateAIRecruit` (pool-empty fallback) mints warriors without `favorites`/`equipment`/`potential`/`trainability` | **APPROVED + deepened** | `signWarrior(prebuilt)` returns the warrior verbatim (`signWarrior.ts:201-209`), bypassing `poolWarriorToWarrior`. Downstream: `checkDiscovery` no-ops on `!fav` (`favorites.ts:184`), `canGrow` treats missing potential as uncapped, `suspectedFavoriteWeapon` returns undefined, `applyInsightToken`/`mergeWeaponChart` no-op. The entire favorites layer silently misses these rivals. |
| G2 | `biasedAttrs` mints DOA builds — no DA_ST/WL floors, no concept-mean steering | **APPROVED + deepened** | `rivalWarriorFactory.ts:16-48`: all stats start at 3, only template `attrBias` weights shape the pool. **And** `makeWarrior` never sets `potential` (`warriorFactory.ts:63-85`) — every world-minted warrior (startup, successor, floor-refill, expansion) shares the uncapped-headroom bug. |
| G3 | Bloodfeuds are player-keyed — rivals never earn or spend marks | **APPROVED** | Mark written only when `playerWarriorIds.has(victim.id)` (`mortalityHandler.ts:283-293`); `bloodfeudSet` consulted only for player warriors (`offerMatchmaking.ts:183-193`); `BloodfeudMark` carries no `owedStableId`; dedup keyed `killerWarriorId` latest-wins (`impacts/warriors.ts:144-153`). |
| G4 | AI plans never consume favorite rhythm/tactic; `discovered.tactic` doesn't exist | **APPROVED** | `WarriorFavorites.discovered` = `{weapon, rhythm, learn, hints}` only (`warrior.types.ts:136-145`); `checkDiscovery` rolls 3 sections (`favorites.ts:216-265`). AI tactics = `defaultStylePreset` + `mods.changeTactics` + counter-lever + riposte-fill — nothing reads `favorites.rhythm`/`favorites.tactic`. `getAITactics` feeds decoy axes only; `strategicLayer.ts:199-208` doc comment claiming it feeds base tactics is stale. |
| G5 | `recentLossFactors` is write-only; `diagnoseTurnaround` player-only | **APPROVED + REFINED** | Written in `seasonRecord.recordBoutOutcome:111-147`, cloned in `strategyLab.ts:36`, read nowhere. `diagnoseTurnaround(w)` is pure and returns structured `TurnaroundAction[]` (kinds plan/weapon/challenge/avoid/train/drill/learn) — the AI consumer reuses it directly (`turnaroundAdvisor.ts:277-313`); no parallel taxonomy. |
| G6 | Orphaned `DOUBLE_CHALLENGE_MULT`; `EquipmentPass` subsumed; fallback `killDesire: 7` | **APPROVED + deepened** | `DOUBLE_CHALLENGE_MULT` has zero usages — the real mechanism is `challengeCounts × CHALLENGE_BONUS`. `EquipmentPass` is worse than redundant: it vets favorites at `attPenalty < -4` while `rosterWorkerEquipment` uses `.met` → a discovered favorite failing `.met` is equipped by EquipmentPass then stripped by `refitRosterWeapons` in the same tick — weekly oscillation between two legality standards. Fallback `kd:7` at `boutResolution.ts:79`. |
| G7 | Player may lack `challengePlans` authoring | **DISPROVED — parity confirmed** | `ContingencyPlans.tsx:83-167` gives the player `whenProposer`/`whenChallenged` authoring; `applyChallengeContext` merges symmetrically for both combatants (`challengePlans.ts:50-62`). No action. |

## New findings (validation pass)

| # | Finding | Files | Severity |
|---|---|---|---|
| N1 | **Signing funnel loses fields for ALL signings — player and AI alike.** `poolWarriorToWarrior` drops `handedness` (ambi dual-wield ease, ambi-reversed primary side, disarm-hand semantics — `fighterState.ts:70,284-287`, `offhandAttack.ts:54`, `disarm.ts:132`), `trainability` (flat 0.6/0.65 defaults in `traitTraining.ts:70`/`traitCapacity.ts:21`), `xp`, `learnedSkills`, `skillDrills`, `strategyMemory`, `burnedSkills`. `warriorToPoolWarrior` doesn't carry them into `PoolWarrior` either → **freed veterans lose all bout progression on re-sign**. | `signWarrior.ts:106-167`, `freeAgents.ts:17-59`, `recruitment/types.ts:35-80` | HIGH — one funnel fix heals both sides |
| N2 | **Masked-decoy discovery leak.** `checkDiscovery` context reads `w.plan` — for Tactician/Methodical rivals `w.plan` is the DECOY, not the fought plan. Symmetry rolls must consume the resolved plan; `handleProgressions` args currently carry none. | `progressionHandler.ts:188-192`, `boutResolution.ts:130-143`, `agentPlan.ts` | MEDIUM — wrong-input bug |
| N3 | `collectAllWarriors` includes rival rosters → the `findBestOpponent` feud branch generalizes cleanly to `owedStableId === warriorA.stableId`; ONE priority mechanism serves rival-vs-rival, rival-vs-player, and player-vs-rival feuds. | `warriorCollection.ts:84`, `offerMatchmaking.ts:183` | Design enabler |
| N4 | `bookableRoster` excludes warriors with ANY `trainingAssignments` entry → a turnaround 'recovery' assignment suppresses bids automatically — rest enforcement is free. | `boutBidding/generation.ts:135-156` | Design enabler |
| N5 | `favoriteLearnOf(w)` is `id`-hashed (not favorites-derived) → favorite-learn affinity works even without `favorites`; only `discovered.learn` requires the object. | `learnRoll.ts:50` | Informational |

## Parity matrix — V22–V25 mechanics

### A. Already at parity — no action

| Mechanic (source megaplan) | Shared/AI path |
|---|---|
| All V22–V24 combat mechanics (will checks, endurance burn/recovery, dodge-riposte, ATT crit, hard-hit threshold, handedness, KD tax, clash jitter, offhand attack/disarm, weapon-vs-armor overrides, unsuited/double-tactic drains, favorite tactic hidden bonus, always-on rhythm bonus, luck pools, STYLE_PENALTIES) | `simulateFight` — symmetric, reads each warrior's plan/favorites/equipment |
| Per-fight learning (Arena-93) + learn caps | `rollBoutLearns` for both fighters in `handleProgressions` |
| Favorites discovery + weapon charting | `checkDiscovery` + `mergeWeaponChart` both fighters, `progressionHandler` |
| Full plan stack: doctrine caps, V25 archetype shaping, matchup mods incl. ST-vs-TP throttle, strategy-lab ε-greedy, dossier planIntel, rematch adaptation, decoy plans, phase plans, fallback/adaptive conditions, challenge plans | `aiPlanForWarrior` → `rivalFightPlan` → `getNPCPlan` |
| Challenge-plan authoring (player `ContingencyPlans` ↔ AI `applyChallengePlanEmission`) | `applyChallengeContext` merges symmetrically |
| Canon targeting (TP avoids AB, AB avoids LU, …) | `canonTargetingBias` in bid generation + nemesis refusal in `verifyBoutAcceptance`/`evaluateBoutOffer` |
| Weather dispositions (incl. Threads of Chaos offseason-only) | shared `weatherSuitability` → acceptance, decline, committee, bid modifiers |
| Archetype armor fitting, favorite-weapon preservation, validated loadouts | `rosterWorkerEquipment` → `fitArchetypeArmor`, `refitWeapon`, `favoriteWeaponPick` |
| Shared training pipeline (potential, TOTAL_CAP, seasonal caps, burns, injuries, recovery) | `rosterWorkerTraining` → same `processAttributeTraining`/`processSkillDrillTraining`/`processRecovery`; burn-risk exclusion; suspected-favorite-learn drills |
| AI learn-seek bidding | `AI_LEARN_*` in `boutBidding/conversion.ts` |
| Honor-culture down-challenge penalty | bid `dishonorPenalty` / gazette stigma |
| Bankrupt successors, floor refills, starvation folds | `mintSuccessorStable`, `mintFloorRefill`, `runStarvationAndFreeAgents` → `generateRivalStables` |
| Deterministic shard execution | `RivalStrategyPass` inline/worker byte-identical |
| Pool-draft signings | `signWarrior({recruit})` → `poolWarriorToWarrior` |
| Free-agent veterans keep favorites/potential | `warriorToPoolWarrior` preserves/backfills |
| Academy claims | `RecruitmentPass` → `academyStableId`; `visiblePool` first-look |

### B. Intentional asymmetries — document only

- `AI_TRAINING_EFFECTIVENESS = 0.8` attempt-rate handicap; `competenceJitter`; personality-gated behaviors — design, not gap.
- Player-only surfaces: PlanBuilder, Design Review, TurnaroundCard UI, Almanac, SchedulingAssistant, insight tokens, gazette/learn write-ups, challenge/avoid list UI.
- AI-only advantages: `planIntel` dossiers, strategy-lab plan-cell memory, masked decoy plans — the player's scouting-report analog.
- Player challenge/avoid lists vs AI emergent avoidance (`stableIsAvoided`, canon targeting, grudges) — different interfaces over the same intent. Bloodfeud is the exception that must be unified (G3).

## User decisions (locked)

1. **Harmonize feuds for all stables** — one `bloodfeudMarks` table keyed by owed stable; writer emits for every non-tournament kill; consumers: generalized promoter feud branch + rival feud-priority bids; VENDETTA remains mark-less aggression.
2. **Same discovery system for all favorites** — `discovered.tactic` added to the shared schema + `checkDiscovery`; AI consumes discovered rhythm/tactic exactly as an informed player would; information parity in both directions.
3. **All of it** — mechanic parity AND generation parity; zero save-file/backwards-compat constraints → clean renames, no migration shims.
4. **Lightweight turnaround consumer** — reuse `diagnoseTurnaround` directly; translate `TurnaroundAction`s onto AI surfaces.

## Determinism notes

- `biasedAttrs`/`generateAIRecruit` changes shift mint draw counts → world re-baseline mandatory (same discipline as V24/V25).
- Tactic discovery draws on a dedicated per-warrior sub-stream (`hashStr(w.id)|tactic-discovery`) — shared bout stream untouched.
- Feud marks are pure bookkeeping — zero draws.
- `handleProgressions` threading resolved plans is plumbing, not draws.

### Phase-8 discovery — cross-engine sort hazard (fixed)

Seed probes (`bun run`, JSC) disagreed with the vitest suite (`bunx vitest`,
Node/V8) on identical seeds — byte-identical inputs to `planWorldBouts`
produced different pairings. Root cause: the pool sort comparator mixed
`fame` and `lastBoutWeek` inside a sliding ±100 gate — **not a total order**,
so spec-stable sorts on V8 vs JSC emitted different permutations → different
pairings → different worlds at week 12+. Re-ratcheted to a transitive
comparator (`Math.floor(fame/100)` bucket → `lastBoutWeek` → `fame`); V8/JSC
full-state digests then matched weeks 1–14 (only wall-clock
`meta.createdAt` differs — deferred D2/D3). New comparators in the sim must
be lexicographic key chains only (deferred register D6).
