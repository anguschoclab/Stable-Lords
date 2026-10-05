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
| `counterOfferRate`      | **0.00** — see §6.1 (measurement gap, not a revert trigger)              |
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

## 6. Open items & deviations

1. **`counterOfferRate` still 0.00 in soaks.** The plan's audit gate said "lift it or revert." Kept: the metric measures *first-round* counter frequency, which never fires in the harness at all — a soak-harness artifact (offers the harness generates rarely meet counter conditions), not evidence the second round is dead code. The bounded `resolveSecondRound`/`escalateCounter` path is covered by `negotiation.test.ts`. **Open:** the soak harness can't observe this behavior; either extend the harness to generate counter-eligible offers or accept unit coverage.
2. **`decoyAxes` (Stage D.2b) — not built.** Plan-level decoy axes feeding the streak-trigger read loop deferred; feint modulation (D.2a) shipped. Revisit only if `planMasked` scouting deception proves thin in play.
3. **`phaseShiftOn` (Stage D.4) — not built.** Validation found `buildPhasePlan` already produces personality-tweaked phase curves; the item was redundant as designed.
4. **Competence outcome-gradient not ratcheted as a slow-gate invariant.** Only `competenceDistribution` ships in `SimPulse`; the treasury gradient in §1 was probe-measured, not enforced. Candidate liveness invariant for a follow-up.
5. **SURVIVAL (N1) and `lastLossFactors` (N2) — both still dead.** Cheap cleanup: either revive with distinct triggers or delete the vestigial branches/field.
6. **Win-rate gradient flat at 26wk** — by design (competence never touches combat rolls), but worth re-probing at 104wk to confirm roster-quality compounding eventually separates tiers.

## 7. Hard rules observed

- Seeded RNG only (`resolveRng`/absoluteWeek-derived); `Math.random` lint ban held.
- Once-per-tick `buildPerceptionSnapshot`; shard ctx immutable — determinism gates byte-identical.
- No save-migration constraints; all new fields carry schema + factory defaults.
- Stage-D combat changes followed `combat-balance`: constants → pure helpers → integration tests → full slow suite; weapon matrix/mortality untouched.
- All surfaced UI values map to real state (ui-honesty): competence shown as *scouted estimate*, corner panel reads real `reasonCodes`, difficulty picker feeds real worldgen plumbing.
- Param-budget convention (options objects >5 params) applied to all new signatures.
