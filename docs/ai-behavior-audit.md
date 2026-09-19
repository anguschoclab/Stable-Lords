# AI Behavior Audit — Stable Lords

> Generated as Stage A of the advanced-AI megaplan. Every claim verified against
> source at audit time; verdicts: **APPROVED** (confirmed), **CORRECTED** (real
> but different than drafted), **DISPROVED** (premise false — design replaced),
> **NEW**, **NOTE**.

## 1. Validated Architecture Map

The AI subsystem lives in `src/engine/ai/` and is orchestrated weekly by
`runRivalStrategyPass` (`src/engine/pipeline/passes/RivalStrategyPass.ts`)
inside `weekPipelineService.ts`:

- **Strategic** — `intentEngine.ts` (`pickWeeklyIntent` 8 intents,
  `verifyIntentSkepticism` 4 tiers, `updateAIStrategy` durations+targets);
  `agentCore.ts` (`createAgentContext`, `logAgentAction` 20-cap,
  `consolidateAgentMemory`, `computePlayerThreatLevel`);
  `worldManagement.ts` facade → `seasonalRetirementService` /
  `bankruptcyService` / `expansionService` (45-stable cap, legacy founders).
- **Workers** — `budgetWorker` (risk-tiered, personality tolerance),
  `staffWorker`, `rosterWorker` + `rosterWorkerTraining` +
  `rosterWorkerEquipment` (~80% effectiveness via shared `trainingGains`;
  validated gear via `equipmentOptimizer`; traits via `traitPolicy`),
  `recruitmentWorker` (via `draftService.aiDraftFromPool`, snake-draft by
  need), `competitionWorker` (`generateBoutBids` intent-shaped bids w/ full
  weather table + crowd + `scoreMatchup`; `convertBidsToOffers` priority
  pairing; `evaluateBoutOffer` / `verifyBoutAcceptance`;
  `processAllRivalsBoutOffers` weekly slates).
- **Tactical** — `aiPlanForWarrior` (personality+philosophy+matchup+intent+
  grudge → OE/AL/KD, phases, universal+personality conditions,
  `desperatePlan`, `fallbackCondition`, levers, gear reconciliation); injected
  at bout time by `boutResolution.getNPCPlan`.
- **In-bout** — `prepareExchange` → `evaluateConditions` (WT-gated,
  first-match-wins) → `evaluatePsychState` (6 states + `PSYCH_STATE_MODS`) →
  `handleDesperateState` (HP<30%/END<20% swap) → `calculateFinalOEAL`
  (fallback deltas). `ExchangeLogEntry` already carries `reasonCodes`,
  `killWindow`, `executionFlag`; `simulate/logging.ts` promotes
  `CombatEvent.metadata.cause` → `CAUSE_*` reason codes; `fightAnalysis.ts`
  persists `FightSummary.analysis`.
- **Social/world** — `planWorldBouts` (fame-proximity + vendetta bias),
  `PromoterPass` (tier/personality offers incl. player warriors; honors
  `playerChallenges`/`playerAvoids`), `updateRivalriesFromBouts` +
  `processOwnerGrudges` (both inside **NarrativePass**), shared
  `computeWeeklyBreakdown`, `TournamentSelectionService.committeeSelection`
  (pure rank conscription + weather skepticism), shared `restStates`, shared
  `hiringPool`/`recruitPool`.
- **UI** — `RivalIntelligence` (intent badges), `AgentReasoningWidget`
  (intent, action timeline, target), gazette/newsletter items.
- **Infra** — `simulation-harness.ts` headless runner, `SimPulse`/
  `collectPulse`, `worldLiveness.integration.slow.test.ts`,
  `pipeline.perf.slow.test.ts`, ~20 AI test files. No shared rival/warrior
  test factories — each suite defined local `makeRival`/`makeWarrior` (now
  unified in `src/test/_fixtures/factories.ts`).

## 2. Gap Register — Verdicts

| # | Finding | Verdict | Evidence |
| --- | --- | --- | --- |
| G1 | `seasonRecord.wins/losses/kills` never incremented → `seasonWinRate` always null → RECOVERY-on-bad-season and WEALTH_ACCUMULATION branches dead | APPROVED | Only writer is the week-1 reset (`agentCore.ts:110-128`); readers `intentEngine.ts:72-84,160-163` |
| G2 | `metaAwareness` initialized `{}`, never populated | APPROVED | `agentCore.ts:37`, `rivalStableFactory.ts:175`, `AIAgentMemorySchema` |
| G3 | `knownRivals` set once at first context init, never refreshed | APPROVED | `agentCore.ts:38-41` only runs when `agentMemory` missing |
| G4 | AI never initiates vs the player — bids iterate `state.rivals` only; vendetta→`player.id` fails `rivalMap.get()` → zero offers | APPROVED | `boutBidding.ts:38-46,270-289`; `planWorldBouts` rivals-only; player-side accept path exists (`respondToBoutOffer`) |
| G5 | Grudges **and rivalries** halt when `headless`/`playerStopped` (both live in NarrativePass); `processOwnerGrudges` only pairs rival×rival — no player×rival grudges | CORRECTED | `weekPipelineService.ts:190-199`; `NarrativePass.ts:35,38`; `owner/grudges.ts:21-96` |
| G6 | No agent scouting/intel model; `scoutReports`/`insightTokens` player-only | APPROVED | `agentCore.ts:137-164` is the only player-perception |
| G7 | Offer evaluation binary accept/decline; no counters | APPROVED | `boutAcceptance.ts:90-169`; counter needs new `counterBoutOffer` mutation |
| G8 | NPC plans computed in `getNPCPlan` and discarded; `w.plan` never written for rivals → Expert scouting `suspectedOE/AL` **silently absent** for NPC warriors | CORRECTED | `boutResolution.ts:56-79`; `scouting.ts:119-122`; only player UI writes `w.plan` |
| G9 | Two recruitment paths with divergent caps | APPROVED | `recruitmentWorker` (pool draft, cap 8/10) vs `processAIRosterManagement`→`generateAIRecruit` (cap 6/7/8) |
| G10 | Intent inferred by English substring match; bout outcomes absent from `actionHistory` | APPROVED | `agentCore.ts:79-91`; `AIEvent.type` = STRATEGY/FINANCE/ROSTER/STAFF |
| G11 | No per-opponent memory — rematch plans identical to first meetings | APPROVED | `aiPlanForWarrior` has no history input; `getHeadToHeadRecord` exists in `schedulingAssistant.ts` |
| G12 | In-bout: no named intent states / AI-decision telemetry — **structured telemetry channel already exists** | CORRECTED | `ExchangeLogEntry.reasonCodes`/`killWindow`/`executionFlag` exist; `logging.ts` lifts `metadata.cause`→`CAUSE_*`; emit `CombatEvent{metadata:{cause:'AI_INTENT_*'}}` instead of a side-channel |
| G13 | Tournament selection is pure rank conscription — bid-suppression cannot affect entry (bookings not consulted) | CORRECTED | `committeeSelection` checks only `status`/`lockedIds`/weather → TOURNAMENT_CAMPAIGN shapes preparation only |
| G14 | Desperation gate (`treasury<500`→accept anything) ignores `strategy.intent` and injuries | APPROVED | `boutAcceptance.ts:97-99` |
| G15 | `checkBudget` flat `reserve=300` ignores roster upkeep scale | APPROVED | `budgetWorker.ts:24-42` |
| G16 | Weather-rule logic duplicated across ≥5 sites — drift-prone | NEW | `boutBidding` table, `verifyBoutAcceptance`, `evaluateBoutOffer`, `PromoterPass.isWeatherDisadvantaged`, `intentEngine.isHazardousWeather`×2 |
| G17 | `generateBoutBids` builds `mockState` incl. `structuredClone(DEFAULT_PROGRESSION)` **per rival per week** | NEW (perf) | `boutBidding.ts:49-101` — hoist to once-per-tick |
| G18 | `scoreMatchup` is player-asymmetric — `convertBidsToOffers` calls it with real `state` for AI-AI scoring, leaking `playerChallenges`/`playerAvoids` + player-stable rivalry semantics | NEW | `schedulingAssistant.ts:77-91,129-133` vs `boutBidding.ts:306` — extract `scorePairwiseMatchup` |
| G19 | Rival `trainingAssignments` transient + invisible to `isBookable` (reads `state.trainingAssignments` = player's). Harmless today; decision: keep transient, documented | NOTE | `rosterWorker.ts:100-121`, `stableManager.ts:107`, `warriorStatus.ts:44-58` |
| G20 | `engine/market/contractMarket.ts` does not exist — "reuse bid logic" premise false | DISPROVED | No such module; poach bids built fresh on `computeWarriorLiability` + `policyFor` |
| G21 | "Overpay to deny trainers" — no auction exists; AI drains `hiringPool` before the player acts | DISPROVED → REDESIGN | Honest mechanic: intel-driven **preemptive hiring** — dossier detects player need → staffWorker prefers matching-focus trainers |

## 3. Design Decisions Log

- **G19**: rival `trainingAssignments` stays transient (cleared each tick in
  `processAIStable`); not consulted by `isBookable` by design — AI rest/peaking
  expresses itself via bid suppression and plan choices, not booking locks.
- **G13**: tournament committee untouched; TOURNAMENT_CAMPAIGN shapes
  preparation (rest bias, bid suppression, training focus) not entry.
- **G12**: AI intent telemetry emitted as `CombatEvent.metadata.cause`
  (`AI_INTENT_*`), surfacing automatically through `exchangeLog.reasonCodes`;
  gated to non-headless/`__AI_DEBUG`.
- **G20**: poaching scoped to AI→AI transfers and publicized player-bound
  offers (decision prompts only — never auto-transfer of player warriors).
- **G21**: no pricing/auction mechanics added anywhere; all "economic pressure"
  is emergent from intel-driven ordering.
- **Compatibility**: per directive, no save-migration constraints — new
  `AIAgentMemory` fields may be required; fresh rivals get defaults from
  `createAgentContext`/`rivalStableFactory`.

## 4. Implementation Notes (Stages E–I)

- **E** — NPC plans persist on `warrior.plan`/`planWeek` after bout resolution;
  Expert scouting reads `planIntel` dossiers; rematch adaptation feeds deltas
  into `aiPlanForWarrior`.
- **F** — In-bout intent states (`Press/Probe/Hold/Recover/Finish/Survive`) are
  pure selectors over existing plan options — no combat-math changes. Telemetry
  rides `reasonCodes` via `CombatEvent.metadata.cause`; headless runs emit
  nothing unless `__AI_DEBUG`. WIT shapes plan condition density
  (`coreGenerator`).
- **G** — Poaching market (`engine/ai/market/poachBid.ts`): once/season per
  stable, WEALTH_ACCUMULATION-gated, liability+trait-policy target selection,
  shared `checkBudget` + `aiRosterMax` guards. AI-AI bids settle immediately;
  player-bound bids surface as gazette items only. `AI_POACHING=false` disables.
  `RivalStableData.lastPoachSeason` added (type+schema).
- **H** — Reason text, season W-L-K, and typed-cause chips surface in
  `AgentReasoningWidget`/`ActionTimeline`; intel + tournament-posture chips in
  `RivalIntelligence`; Rival Challenge / Countered badges in `OfferCard`;
  dev-only `AIDebugDrawer` mounted in `BoutViewer`.
- **I** — `SimPulse` gained `intentDistribution`, `playerChallengedWeeks`,
  `vendettaCount`, `avgDossierCoverage`, `counterOfferRate`. 104-week liveness
  invariants + harness-level determinism + `RivalStrategyPass` perf gate
  (~43–73ms populated-world tick, perception built once).

### Bugs found & fixed during implementation

- `intentStillApplies` made CONSOLIDATION an absorbing state — hysteresis now
  only defends real intents, letting the fallback yield to new picks.
- `runRivalStrategyPass` called `generateBoutBids` without `state`, so
  vendetta→player bids could never fire in production — fixed call site.
- `crestGenerator.selectCharge` mutated the module-level
  `PHILOSOPHY_CHARGE_PREFERENCES` array via `push` — second+ runs in the same
  process diverged on crest charges (determinism harness caught it).
- `autosimMemoryGrowth` bankruptcy boundary was weather-luck dependent —
  re-based on seeded treasury so the memory assertion is deterministic.
