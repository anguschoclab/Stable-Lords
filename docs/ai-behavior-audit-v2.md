# AI Behavior Audit v2 — Stable Lords (Phase-2 Megaplan, Stage A)

> Validation pass over the Phase-2 plan against live source. Verdicts:
> **APPROVED** (confirmed), **CORRECTED** (real but different mechanism),
> **DISPROVED** (premise false — dropped), **NEW** (found during validation).

## 1. Baselines (104-week soak, seed 4242, headless, `bun run scripts/soak.mjs`)

| Metric | Value |
|---|---|
| Pipeline | 238 ms/week total; `RivalStrategyPass` perf gate: **60.7ms** (bound <500ms) |
| Intent distribution (wk-104 snapshot) | CONSOLIDATION 28, AGGRESSIVE_EXPANSION 7, WEALTH_ACCUMULATION 5, RECOVERY 5; VENDETTA/TOURNAMENT_CAMPAIGN/EXPANSION/ROSTER_DIVERSITY: 0 |
| Crowns | AI-held 19, player-held 0, live title offers 6 |
| Reign endings (all-time) | died 155, defeated 13, stripped 1, retired 1 — reigns end almost exclusively by death |
| Grand Championships | 1 crowned (year 1); w52 bracket ran |
| Intel | avgDossierCoverage 12.0 dossiers/rival |
| Player interaction | playerChallengedWeeks 18/104; counterOfferRate 0.00 (counters effectively never fire in harness) |
| World | 10,611 bouts, 140 deaths, 16 tournaments, 332 traited warriors, 0 invariant violations |

Baseline note for post-implementation comparison: `counterOfferRate` 0.00 and the
death-dominated reign-endings profile are the numbers Stages B/F are expected to move.

## 2. Phase-2 gap register — validated

| # | Finding | Verdict | Evidence |
|---|---------|---------|----------|
| N1 | `dossier.planIntel` written by `intelWorker` but never consumed — `aiPlanForWarrior` reads only `recordVs`. | APPROVED | `intelWorker.ts:115-134`; `coreGenerator.ts:86-97` |
| N2 | No crown campaigning — contender-venue bias is passive; no arena targeting. | APPROVED | `boutBidding.ts:362-378`; `contenderRankAtArena` has no AI consumers |
| N3 | No reign management — `relinquishCrown` is player-UI only. | APPROVED | `playerActions.ts:60` sole caller |
| N4 | Title-offer eval shallow — title branch skips HP/fatigue gates. | APPROVED + worse (V1) | `boutAcceptance.ts:105-112` returns before HP<70/fatigue>70 gates |
| N5 | Grand Championship blind spot — prep windows count seasonals only. | APPROVED | `absoluteWeek.ts` `isTournamentPrepWeek` doc; `weeksUntilNextSeasonalTournament` wraps year (w49–51 → until=13); `tournamentWorker.ts:27` intent-gated |
| N6 | Advisor/rival divergence; no per-warrior rival roles; no crown advice. | APPROVED + correction (V3) | `boutAcceptance.ts` never reads `state.promoters`; `boutOfferAdvisor.ts:184-187` does |
| N7 | Mid-bout adaptivity label-only; `tacticStreak` tracked but unread; no opponent-side triggers. | APPROVED | `intentStates.ts` header; `conditionEngine.ts:29-53`; `resolution.ts:162-175` |
| N8 | No counter-intel — scouting reads `w.plan` verbatim. | APPROVED | `scouting.ts:119-124` |
| N9 | No career arcs — retirement is pure age probability. | APPROVED, sharpened | `seasonalRetirementService.ts:34-47`: age≥30 → (age−30)·5%, ≥40 → certain; no record/personality input |
| N10 | Thin rival economics — Sadistic promoter penalty advisor-only; single counter round. | APPROVED | `offerProcessor.ts` "No second counter round"; `contractMutations.ts:70` |
| N11 | Player-pressure is one lever (vendetta chance). | APPROVED | `agentCore.ts:209-236` → `intentEngine.ts:89-102` |

## 3. New findings (validation pass)

| # | Finding | Evidence |
|---|---------|----------|
| V1 | **Title offers are double-gated**: `offerProcessor` runs `verifyBoutAcceptance` (title-*unaware*: RECOVERY refuses killers, +300 fame-gap refuse, Aggressive auto-accept) *before* `evaluateBoutOffer`'s title branch — a champion can rack up strip-counting refusals through the first gate. | `offerProcessor.ts:95-117` |
| V2 | **Persisted NPC plans never reach resolution**: `getNPCPlan` honors `w.plan` only when `planWeek === absoluteWeek`; `persistNPCPlans` stamps the signing week and bouts resolve at +2 — the honor branch is production-dead. Persisted plans are scoutable artifacts; resolution deterministically recomputes. | `agentPlan.ts:107`, `boutResolution.ts:75-82` |
| V3 | **Advisor evaluators are player-coupled**: `evaluateBoutOffers` reads `state.treasury`/`state.roster`; `getOpponentIntel` reads `state.insightTokens` (player-only). Rival reuse requires an explicit stable context. | `boutOfferAdvisor.ts:131-134`, `intelAdvisor.ts:42-52` |
| V4 | Grand Championship lives in `championsTournament.ts` (`selectGrandChampionshipField`, `buildChampionsTournament`, `recordGrandChampions`); `RivalStrategyPass` calls `buildChampionsTournament`. | post-draft refactor |
| V5 | Tournament-week defense slides: pending test expects `deferrals++` when a defense slides during any tournament week (incl. w52); `scheduleTitleBouts` currently early-returns. Crown-cadence math must follow final semantics. | `arenaChampionship.test.ts` it.each([10,20,30,42,52]); `arenaChampionship.ts:704` |
| V6 | `Warrior.campaignFocus` exists on the shared type — rivals can reuse the field (not in `WarriorSchema` today). | `warrior.types.ts:196` |
| V7 | `AI_INTENTS`↔`AIIntentSchema` sync is covered by `schemaCharacterization.test.ts`; `INTENT_REASONS` is exhaustive `Record<AIIntent>` (tsc-enforced); `AIEventCause` union is hand-maintained. | `schemaEnums.ts:438`, `intentEngine.ts:245`, `state.types.ts:330` |
| V8 | New `ConditionTriggerType` members require: union (`shared.types.ts:330`), `ConditionTriggerTypeSchema` (`schemaEnums.ts:248`), `conditionMet` (`conditionEngine.ts`), `ConditionEditor`/`ConditionTriggerSection` UI. | verified |
| V9 | `ctx.trainerModsA/D` already flow through `ResolutionContext` — corner-advice quality can key off real trainer presence with no new plumbing. | `exchangePrep.ts:258-263` |
| V10 | "AI style retraining" — **DISPROVED**: no retraining mechanic exists for anyone; AI-only would be cheating. Dropped from scope. | no `w.style` writers outside factories |

## 4. Hard rules carried into implementation

- Seeded RNG only (`resolveRng`/`SeededRNGService`); `Math.random` lint-banned.
- World-view data built once per tick in `buildPerceptionSnapshot`; shard ctx immutable/clone-safe.
- Feature flags via `globalThis.AI_*` (precedent `AI_POACHING`).
- No save-migration constraints; new fields get schema + factory defaults.
- Combat changes follow `.claude/skills/combat-balance` — constants, pure helpers, `STYLE_PENALTIES` re-ratchet, four `balance.test.ts` guardrails, weapon matrix & mortality are canon (untouchable).
- Symmetric machinery: mid-bout mechanics must be expressible through `FightPlan` — no AI-only edges.
- Strict test-first: each stage lands a red-test commit before its implementation.

## 5. Post-implementation results (Stages B–H, commit ee164576 + H)

### What shipped

- **B** — `CROWN_CAMPAIGN` intent + `targetArenaId`, per-tick contender index in
  `PerceptionSnapshot`, `crownWorker` (reign management, relinquish timing,
  defense posture, refusal economics), unified title-gate eval (V1 fixed),
  venue-pinned bids, Grand-Championship prep windows.
- **C** — `StableEvalContext` decouples advisor math from player finances (V3);
  rival per-warrior roles via `campaignFocus` (V6 field reused); `CROWN_BID`
  advisor card.
- **D** — `planIntel` consumed in `coreGenerator` (N1 fixed); observed tells
  blend into scouting; `planMasked` decoys for deceptive personalities (V2
  semantics pinned by `scouting.maskedPlan.test.ts`).
- **E** — real mid-bout adaptivity: opponent-state triggers, phase-boundary
  corner advice, `ConditionEditor` support; **latent percent-trigger bug fixed**
  (0–100 values vs 0–1 ratios — the universal `ENDURANCE_BELOW` safety
  override had been firing on every AI warrior, every exchange).
- **F** — career-aware retirement (age × permanent injuries × crown deferral),
  promoter-personality-aware rival offer eval, single-round venue counters
  (`COUNTERED_VENUE`), dominant-player dethrone pressure.
- **G** — crown standing on advisor cards, `topContenders` public ladder,
  roster contender chips, `CONDITION_*`/`PSYCH_*`/`@CORNER` telemetry into
  `reasonCodes` (debug drawer).
- **H** — 8 new SimPulse metrics (`crownCampaignsActive`, `titleOfferStatuses`,
  `avgPlanIntelStaleness`, `maskedScoutReports`, `grandChampFieldSize`,
  `grandChampCancellations`, `avgChampionFatigue`, `cornerAdviceEvents`),
  104-week liveness suite, `AIEventCause` bidirectional sync guard (V7).

### Grand Championship bisection (the "pre-existing failure")

The `autosimChampionship` w52-field failure observed mid-project was NOT
pre-existing — bisection shows:

| Commit | Stage | GC |
|---|---|---|
| `befbf6f9` | pre-AI | ✅ field ≥4, GC runs |
| `ecb31059`–`99bf4318` | B–D | ❌ field <4, cancelled |
| `fead1f85`+ | E–H | ✅ field = 6, GC runs |

The B–D behavior changes interacted with the always-firing
`ENDURANCE_BELOW` percent bug (every AI warrior permanently under the
survival override). Stage E's normalization fix restored realistic bout
outcomes and the w52 field. Verified deterministic across both directions
of the bisection — not flake.

### Validation gates (all green at HEAD)

| Gate | Result |
|---|---|
| `rivalStrategyPass.perf` | 86.9ms (<500 bound); perception once-per-tick spy ✓ |
| `determinism.slow` | same-seed two-run: identical pulses + rivals hash |
| `parallelDeterminism.slow` | shard pool 1 vs 4: byte-identical state, 8 wks |
| `styleWinConditions` (balance) | 15 guardrail tests green |
| `worldLiveness.slow` (new) | 104 wks: crowns change hands, campaigns active ≥2 wks, refusals < STRIP, GC integrity, avg champion fatigue <70 |
| `autosimChampionship.slow` | 120 wks: 6 crowned arenas, GC field 6, winner recorded |

### Residual observations (honest — not regressions, but worth a product look)

- Reign endings remain death-dominated (died 34, defeated 1 in the 120-wk
  autosim): champions almost never lose the belt *in* a title bout — they
  die in ordinary bookings first. `defensesBooked` stayed 0. The dethrone
  path exists but the world rarely reaches it; if a living-defense meta is
  desired, title-defense cadence vs. open-market bookings needs tuning.
- `counterOfferRate` baseline was 0.00; venue/purse counters now exist for
  AI but the metric only counts standing offers — watch post-H soaks for
  actual counter frequency.
