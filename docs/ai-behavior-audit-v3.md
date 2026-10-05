# AI Behavior Audit v3 — Stable Lords (Phase-3 Megaplan)

> Validation pass + post-implementation outcome register for the Phase-3
> program (plan: `~/.devin/plans/plan-bfa61e7a78bf7e21.md`). Verdicts:
> **APPROVED** (confirmed), **CORRECTED** (real but different mechanism),
> **DISPROVED** (premise false — dropped/redesigned), **NEW** (found during
> validation). Stage outcomes at §4; open items at §6.

## 1. Baselines

### Pre-implementation (Phase A, 104-wk soaks, seeds 12345/777/2024)

| Metric                | Value                                                          |
| --------------------- | -------------------------------------------------------------- |
| `counterOfferRate`    | **0.00** on all seeds → Stage C.3 negotiation work GO          |
| `SURVIVAL` intent     | **absent** from every week's distribution → N1 dead code       |
| Intent leaders        | RECOVERY + CROWN_CAMPAIGN dominate; CONSOLIDATION sparse       |
| `lastLossFactors`     | written (`seasonRecord.ts:101-106`), **never read** → N2 dead  |

### Post-implementation (104-wk soak, seed 12345, `bun run scripts/soak.mjs`)

| Metric                  | Value                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| Throughput              | 104 wk in 35.6s (**342.5 ms/week**, bound <500ms)                        |
| Invariant violations    | **0**                                                                    |
| World                   | 15,454 bouts, 1,544 deaths, 16 tournaments, 589 traited warriors         |
| Intent distribution     | RECOVERY 40, WEALTH_ACCUMULATION 30, CROWN_CAMPAIGN 17, EXPANSION 2, CONSOLIDATION 1; **SURVIVAL 0**, VENDETTA 0 |
| Crowns                  | AI-held 19, player-held 0, live title offers 3                           |
| Reign endings           | defeated 51, died 26, displaced 5, stripped 2                            |
| `counterOfferRate`      | 0.00 on this run; **peak 0.004 / 16-of-40wk standing** with counter-bait on — see §6.1 |
| `playerChallengedWeeks` | 15/104                                                                   |
| `avgDossierCoverage`    | 12.0 dossiers/rival                                                      |

### Competence outcome gradient (26-wk probe, seed 12345, rival stables)

| Tier       | n  | avg treasury | career win-rate |
| ---------- | -- | ------------ | --------------- |
| Novice     | 23 | 1,293        | 0.544           |
| Journeyman | 32 | 1,081        | 0.512           |
| Veteran    | 28 | 3,064        | 0.540           |
| Master     | 11 | 2,556        | 0.521           |

**Treasury gradient: YES** — Veteran/Master stables hold ~2.4–2.8× the treasury
of Novice/Journeyman. **Win-rate gradient: flat** — expected: competence scales
*decision* quality (economic/strategic knobs), never combat rolls; any
roster-quality compounding needs a longer horizon than 26wk to diverge.
Distribution itself is sane: Masters rarest (11/94 ≈ 12%), Journeyman modal.

**104-wk re-probe (seed 11, unmocked harness):** win-rate still flat —
Master 0.523, Veteran 0.524, Journeyman 0.498, Novice 0.519. Median treasury
separation persists and sharpens with age: Novice medians 767→629 at
wk 26→104 vs top-half 783→1455. Confirmed: competence's signature is
economic, never martial.

## 2. Phase-3 gap register — validated

| #   | Claim                                                            | Verdict          | Evidence                                                                                     |
| --- | ---------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| V1  | Personality is the only owner axis                               | **CORRECTED**    | `personality` AND `metaAdaptation` exist (`owner.ts`). Competence built orthogonal to both — enforced by `competenceOrthogonality.test.ts`. |
| V2  | Intents are reactive single-step picks; no lookahead             | **APPROVED**     | `pickWeeklyIntent` cascade; no objective field in `AIStrategy`/`AIAgentMemory` — fixed by Stage C `seasonObjective`. |
| V3  | Negotiation is single-round                                      | **APPROVED**     | `evaluateNegotiationStage` multi-stage but one round; "No second counter round" (`offerProcessor.ts`). Fixed by bounded `resolveSecondRound`/`escalateCounter`. |
| V4  | `tacticStreak` unread for adaptation                             | **CORRECTED**    | Read by overuse penalty + narration lines; still no *plan-level* read — `OPPONENT_TACTIC_STREAK` trigger shipped (Stage D). |
| V5  | `ctx.trainerMods` unused by corner logic                         | **APPROVED**     | `cornerAdvice` was an unconditional phase-boundary boolean; now trainer-gated (Stage D).     |
| V6  | `responseNotes` title-only                                       | **APPROVED**     | `offerProcessor` gated on `titleArenaId`; generalized to all verdicts (Stage E).             |
| V7  | `feint` is a new lever                                           | **DISPROVED**    | `FightPlan.feintTendency` + `runFeint` already live; WT-derived, never AI-modulated (→N3). Stage D.2 redesigned to modulation, not a new field. |
| V8  | Player-facing surfaces exist                                     | **APPROVED**     | `possiblyMaskedPlan`, `responseNotes`, `AgentReasoningWidget`, gazette channels — all reused. |
| V9  | Schema plumbing pattern for new enums                            | **APPROVED**     | union → `enumSources` → `schemaEnums` → `conditionMet` → editor; followed for `OPPONENT_TACTIC_STREAK`. |
| V10 | `AI_POACHING` flag precedent                                     | **APPROVED**     | `globalThis.AI_*` convention confirmed.                                                      |
| V11 | No season plan-of-record                                         | **APPROVED**     | Same as V2 — `SeasonObjective` added to `AIAgentMemory`.                                     |
| V12 | Worldgen difficulty knob feasible                                | **CORRECTED**    | No `difficulty`/`worldOptions` in `GameState` — required new schema + `createFreshState` plumbing + `NewGameForm` picker, not just UI. Landed across `869478f4`/`fdaef651`. |

## 3. New findings (Phase A) — dispositions

| #   | Finding                                                                                          | Disposition                                                                 |
| --- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| N1  | **`SURVIVAL` is a dead intent** — never returned by `pickWeeklyIntent`; confirmed 0 in all soaks | **Deferred.** Vestigial `INTENT_REASONS` + `intentStillApplies` branches remain (`intentEngine.ts:368,409`). Revive-or-remove decision still open. |
| N2  | `lastLossFactors` written but never read                                                         | **Deferred.** Still dead post-Stage-C; objective re-planning consumed other signals instead. Either wire or remove in a follow-up. |
| N3  | AI never *modulates* `feintTendency` — only inherits WT baseline                                 | **Fixed** (Stage D.2a): personality modulation — Showman/Tactician +2, Pragmatic −1, Methodical −2, applied only when WT baseline >0, clamped [0,10]. |
| N4  | `advanceWeekPerformance` already gates <500ms/wk                                                 | **Observed.** Post-implementation soak: 342.5ms/wk; `RivalStrategyPass` tick 203.4ms — Stage C shard work fit the shared budget. |

## 4. Stage outcomes

| Stage | Scope                                                        | Red tests   | Implementation                       | Result |
| ----- | ------------------------------------------------------------ | ----------- | ------------------------------------ | ------ |
| B     | `OwnerCompetence` axis (Novice→Master) wired as noise/caps into intel, draft, budget, matchup skepticism, crown, poach, plan-condition density | `bedf55e4`  | `f2e29e60`                           | Landed. Key design correction: absent `competence` must be **inert** (not Journeyman noise) or every legacy fixture wobbles — effect helpers return neutral when unset. `SimPulse.competenceDistribution` added. |
| C     | Season objectives over the intent cascade; N-week cash-flow horizon; bounded 2nd counter round + personality walk-aways; ambition arcs on owner lifecycle | `4851b9bb`  | `ceb9f7ad`, signature bundling `28ef434b` | Landed. One regression found & fixed in-impl: REBUILD viability contradicted its own pick condition (roster-depleted + treasury ≥400 churned re-picks weekly). |
| D     | `OPPONENT_TACTIC_STREAK` trigger; feint modulation (N3); trainer-gated corner quality | `2ed86da9`  | `159b010e`                           | Landed. One legacy test updated (boundary re-check now requires an actual corner — new intended behavior). Balance lab + 46 slow balance tests green. |
| E     | Scouted competence estimates; `responseNotes` on all verdicts; season objective in `AgentReasoningWidget`; `CornerAnalysisPanel`; worldgen difficulty end-to-end | `e76d6245`  | `869478f4`, `fdaef651`, guardrail fixes `33a34dcb` | Landed. Worldgen wired through the real `createFreshState` path — initial rivals now mint competence; picker in `NewGameForm`. |

## 5. Post-implementation gates — all green

| Gate                            | Result                                                              |
| ------------------------------- | ------------------------------------------------------------------- |
| `tsc --project tsconfig.app.json` | 0 errors                                                          |
| `npx vitest run` (full suite)   | **779 files / 8,767 tests**, 2 skipped                              |
| Slow suite (selected)           | `parallelDeterminism` (pool 1 vs 4 byte-identical, 8wk), `stateInvariants` (30wk seq + 30wk parallel), `autosim` (25), `weekAdvancement` (18, 100wk integrity) |
| `worldLiveness` (104wk)         | Green — ecosystem dynamic two full years                            |
| `rivalStrategyPass.perf`        | **203.4ms/tick**, bound <500ms; perception built once per tick      |
| Balance                         | 46 slow balance tests green; `balance-lab` FLAT: no mirror drift >10pts, styles 41.4–55.1%, kill 14.3% |
| Megaplan hygiene guards         | function-size, param-budget, uiTokens, runnerGroups — all green     |

## 6. Open items & deviations — deferred-tail resolution

All items below were open when this audit was first written; the deferred
tail has since been implemented. Status and measurements updated.

1. **`counterOfferRate` — RESOLVED (observable).** Root cause was measurement, not the mechanic: organic soaks never produce counter-eligible offers, and countered offers that do sign clear before the 5-week pulse samples them. `simulation-harness` gained an opt-in `counterBait` config that pre-evaluates deliberately-lowball offers through the real `evaluateBoutOffer` (player-side proposers keep the bumped offer standing — the same surface real counters reach). `SimPulse` now carries raw `offerCount`/`counteredOfferCount`. Measured (seed 20260919, 40wk): peak rate 0.004, standing countered offers 16/40 weeks vs a flat 0.00 before. The bounded `resolveSecondRound`/`escalateCounter` path additionally escalates when the other side re-counters.
2. **`decoyAxes` (Stage D.2b) — SHIPPED.** `FightPlan.decoyAxes` masks the *resolved* plan (OE/AL + optional tactics) until the named phase boundary — a committed act: the fighter really performs the decoy, so opponent tactic-streak and momentum reads build on the false pattern, then a `DECOY_REVEAL` reason code fires once at the boundary. Tactician/Methodical stables author it on WT≥13 fighters, mirroring the scouting-level `planMasked` deception. Gated by `AI_DECOY` at both authoring and resolution.
3. **`phaseShiftOn` (Stage D.4) — SHIPPED.** Re-scoped as *boundary-reactive* curve shifts — distinct from `buildPhasePlan`'s static personality curve: evaluated once at the named phase boundary (momentum/HP read), a fired shift commits into the fighter's plan copy for the rest of that phase; a swing back does not revoke it (unlike per-exchange conditions). Authored per personality.
4. **Competence outcome-gradient — RATCHETED as a slow invariant.** `worldLiveness.integration.slow.test.ts` asserts top-half-tier (Master+Veteran) median treasury > 1.3× Novice median at 104wk. Medians, not means: whale treasuries skew the mean hard enough to flip sign between contexts (0.92–1.33 measured); Novice medians bottom consistently (629–767 vs top-half 1359–1636 at wk 52–104).
5. **SURVIVAL (N1) and `lastLossFactors` (N2) — BOTH REVIVED.** SURVIVAL is the deeper crisis tier — selected when the stable cannot cover its projected weekly burn *and* is losing (distinct from RECOVERY's 200g belt-tightening): no proactive bids, favored-only acceptance, hiring frozen, defensive plans, short plan duration. `lastLossFactors` feeds season-objective re-planning — structural loss factors steer objective selection rather than sitting dead.
6. **Win-rate gradient flat at 26wk — re-probed at 104wk, still flat by design.** Per-tier avg win-rate (seed 11): Master 0.523, Veteran 0.524, Journeyman 0.498, Novice 0.519 — no separation. Competence never touches combat rolls; roster-quality compounding does not drift win-rates even at 104 weeks. The treasury gradient is the observable competence signature.
7. **Feature flags (plan §8) — SHIPPED.** `globalThis` toggles per the V10 `__AI_DEBUG` precedent: `AI_COMPETENCE`, `AI_SEASON_PLANS`, `AI_READS`, `AI_DECOY`. Unset = enabled (shipped behavior); explicit `false` makes the feature inert at both authoring and resolution for clean soak bisection.
8. **Intent↔objective coherence — RATCHETED.** Same slow test: while a `seasonObjective` lives, its servicing intent fires >12% of objective-weeks (measured 18.5% — crisis intents legitimately outrank the plan-of-record).

## 7. Hard rules observed

- Seeded RNG only (`resolveRng`/absoluteWeek-derived); `Math.random` lint ban held.
- Once-per-tick `buildPerceptionSnapshot`; shard ctx immutable — determinism gates byte-identical.
- No save-migration constraints; all new fields carry schema + factory defaults.
- Stage-D combat changes followed `combat-balance`: constants → pure helpers → integration tests → full slow suite; weapon matrix/mortality untouched.
- All surfaced UI values map to real state (ui-honesty): competence shown as *scouted estimate*, corner panel reads real `reasonCodes`, difficulty picker feeds real worldgen plumbing.
- Param-budget convention (options objects >5 params) applied to all new signatures.
