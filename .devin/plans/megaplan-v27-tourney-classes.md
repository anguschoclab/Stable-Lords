# MEGAPLAN V27 — Tournament Classes: FE, Freeze Dates & the Tourney Metagame

One-sentence summary: Port the Duel2 tournament metagame (Pagan's Arena-93 articles) onto the existing bracket engine — a canon `fightEquivalents` counter (arena bout = 1 FE, tourney = 1 FE per odd round fought), five FE-banded classes per seasonal under a T−2 freeze date with hybrid invite+open entry, tourney-bout consequence parity (learns/XP/discovery/injuries/fame currently skipped on the interactive path), an AI breakpoint-sandbagging metagame, a design-review "tourney prospect" axis, all-class day resolution, and post-tourney grudge matches — while leaving the week-52 Grand Championship untouched.

> **Validation status:** every claim below was audited against the code on the review pass. Inline markers: ✅ = verified as drafted, ⚠️ = verified but required correction (correction stated), ❌ = disproved. Phase 1 enforces strict test-first: **all** new specs + compile stubs land before any production change.

## Scope Decision (user-confirmed)

- **Entry model — Hybrid**: committee invites auto-enter the top-16 ranked warriors per class (stables may scratch); remaining bracket slots filled by stable declarations (cap 4/stable/class) + freelancers. Grand Championship stays invite-by-crown.
- **Classes — 5 canon bands** every seasonal: Rookies (0 FE) / Apprentices (1–4) / Initiates (5–10) / Adepts (11–20) / Champions (21+). Duel2's Novices folds into Rookies (0-FE post-freeze debuts classify identically).
- **FE — separate counter**: `warrior.fightEquivalents`; career W/L keeps counting all bouts (records continuity). Experience consumers switch to the counter; record consumers stay on `career`.
- **Extras — all in**: AI tourney metagame, design-review tourney axis, multi-bracket interactive UX, **and** grudge matches.

## Validated Findings (article concept → verified code state → treatment)

| Article concept | Verified state (evidence) | V27 treatment |
|---|---|---|
| FE (fight equivalency) | `prepChecks.fightExperience` = `career.wins + career.losses` ✅ — tourney bouts count at full weight; prep page already labels it "FE" | New `Warrior.fightEquivalents`: +1 per arena bout, +1 per **odd round fought** in a tourney (rounds 1/3/5 in a 6-round bracket). Byes/forfeits = 0; the round-6 bronze playoff is even → 0 |
| Breakpoints R/N/A/I/A/C | `TOURNAMENT_TIERS` 4 rank bands (1–64/65–128/129–192/193–256) + `committeeSelection` top-40/style-champs/bubble/freelancer fill to 64 ✅ | `TOURNAMENT_CLASSES` carries the Duel2 breakpoints verbatim; five parallel class brackets per seasonal |
| Freeze date | None — `handleSeasonalTournaments` (finish.ts:172) emits inside the tourney week's own `weekEndImpacts` ✅ | `state.tournamentCycle` written by `weekEndImpacts` when `nextWeek` is T−2 (`weeksUntilNextSeasonalTournament(nextWeek) === 2` → weeks 8/18/28/40): FE snapshot → locked class + invites. Weeks T−2,T−1 are exactly the article's "2+ fights over the breakpoints" window |
| Entry choice | Committee conscripts; stables decline only via RECOVERY/SURVIVAL intent at `collectEligiblePool` ✅ | Hybrid: auto-entered invites + open declarations + scratch rights. `tournamentCycle.declared` (player, slice action) + `rival.tournamentEntryIds` (AI, **new field** on `RivalStableData` — none exists ⚠️) |
| Tourney warriors (21 WT, small size, physicals; scum/ABs for Rookies) | `designReview` has 5-axis union `'style'\|'physicals'\|'weapons'\|'trainability'\|'longevity'` + `DesignReviewItem{axis,verdict,title,detail,id?}` + `classifyArchetype` ✅ | New `'tourney'` axis: WT≥21+small→Champions material; WT≥17→Initiates-viable; ST/CN/WL frame→Rookie-window; AB/scum→Rookie profile. Surfaced in WarriorBuilder, recruit review, AI draft bias |
| Knack / hidden stats | `luckfactor` ±4-per-skill (fighterState.ts:308-312 applies at combat) + `bloodlust` (killWindow.ts:273) rolled at mint in all factories ✅ | Already canon — no work. Scouting-rumor surface deferred |
| Learns are the real prize | **Gap is bigger than drafted** ⚠️: `applyBoutResults` (results.ts:35) → `updateWarriorFromBoutOutcome` — which takes `{isAttacker,winnerSide,isKill,skipFatigue,arenaId}` and **cannot accept fame/popularity deltas at all**. Day-tick tourney bouts get: summary + career W/L + flat fame (win=1/kill=3) + hardcoded kill handling. Missing vs pipeline `resolveBout`: `calculateBoutFame`, popularity deltas, `handleDeath` (obituary, `unacknowledgedDeaths`, +5 fame-on-player-death, `severeInjuryInsteadOfDeath` house rule, `diedPostBout`), `handleInjuries`, `handleProgressions` (learns/XP/favorite-discovery/weapon-chart) | Phase 3: day-tick routes through the same handler trio + `resolveImpacts` |
| Death in tourneys | `applyTournamentKill` (results.ts:102): graveyard + `deadWarriorIds` + `killEvents` + roster purge + participant Dead-stamp ✅. `handleDeath` emits ALL of these as impacts — `deadWarriorIds` handler already re-stamps participants Dead (warriors.ts:112-119), killEvents carry `tournamentId`, feud exclusion via `tournamentId` param ✅ | Delete `applyTournamentKill`; `handleDeath` covers it strictly better. ⚠️ killEvent id format changes `kill_wk_vid_tId` → `kill_wk_vid` (same per-victim dedupe semantics) |
| TV / TC | `awardTournamentPrizes`: purse 5000/2500/1200/600 by tier + tokenMap 4 rungs + medals + rosterBonus ✅ | 5-rung ladder keyed by `classId` (Champions adds richest rung ~8000 + 5th token row); class champion = TC; "TV elevation": each class champion auto-invited into the Champions-class bracket next seasonal |
| Breakpoint sandbagging | Advisor only says "rest & taper" ≤2 wks out (`CONTENDER_REST`) ✅; `isBookable` blocks warriors with `trainingAssignments` — recovery assignment IS the holdout mechanism ✅ | Advisor rewritten around class/breakpoint/freeze; AI holds warriors at class ceilings pre-freeze via recovery assignments, runs them after |
| Class spreading | None ✅ | 4/stable/class cap forces spread; AI distributes under TOURNAMENT_CAMPAIGN (`AIIntent` + `SeasonObjective.kind:'TOURNAMENT'` hooks exist ✅) |
| Roll-ups in batches | `aiDraftFromPool({pool, rivals, week, state})` in finish.ts:54 ✅ | Extend draft scorer with tourney-archetype weight under TOURNAMENT_CAMPAIGN |
| Personal records / weapon charting | `favorites.chart` merged inside `handleProgressions` ✅ (tourney-path parity delivered by Phase 3) | + `career.tourneyRecord {entries, wins, losses, titles}` dossier stat |
| Style lists / secrecy | OpponentDossier/planIntel/decoy `planMasked`/ScoutReportData stack ✅ | Exists — prep-page entrant list IS the style list. No new system |
| Matchups | STYLE_PENALTIES + canonTargeting ✅ | Emergent — unchanged |
| Grudge matches | `BoutOffer{warriorIds,boutWeek,expirationWeek,proposerStableId,createdAbsoluteWeek…}` — `grudgeOfTournamentId` addition trivial ✅; AI bid generation lives in `competitionWorker/boutBidding/generation.ts` ✅ | Week T+1 grudge lane: ≤1/warrior, same-class participant pool, AI rematch/killer bids, +1 FE arena bout — advisor breakpoint warning |
| ~30 warriors across classes | — | Emergent UX via entry desk + class tabs |

## Confirmed gap — the headline finding (validated, extended)

The interactive tournament path is a **stripped resolver**: `advanceTournamentDay` → `resolveRound` → `resolveRoundBouts` → `applyBoutResults` applies only a fight summary, `updateWarriorFromBoutOutcome` (career/flat-fame/seasonPoints), and `applyTournamentKill`. Compared to the `tour_*` pipeline path (`resolveBout` → `collectBoutImpacts`), interactive play yields **no skill learns, no XP, no favorites discovery, no weapon-chart updates, no injuries, no popularity movement, no computed fame, no death obituaries, no `unacknowledgedDeaths`, no `severeInjuryInsteadOfDeath` honor, no `diedPostBout` processing** — the exact rewards the article says are the point of running tourneys.

⚠️ Corrections the fix needs:
- `simulateTournamentBout` (bouts.ts:49) **discards `planA`/`planD`** — must return them; `handleProgressions` grades favorite discovery off the *executed* plans.
- `handleInjuries` takes a numeric `seed` (not an rng object) — day-tick derives a per-bout seed (e.g. `hashStr(fightId)`), matching the pipeline's per-bout `boutSeed` derivation.
- `handleDeath`/`handleProgressions` take an `rng` — day-tick constructs a **per-bout seeded rng** (NOT the shared round rng) preserving the pipeline's load-bearing draw order: death pass → injury pass → progressions.
- `applyBoutResults` needs a new `round` param (for FE accrual) and switches career writes to `updateWarriorAfterBout` (warriorStateUpdater — the fame/pop/tag-aware variant used by `applyRecords`), retiring `updateWarriorFromBoutOutcome`. Note: killer-side fatigue reset replaces victim-side — moot while `skipFatigue` holds during tournament weeks.
- Ordering must match pipeline: records → death → injuries → progressions → lastBoutWeek stamps.

## Implementation steps (strict test-first)

### Phase 0 — Findings & ledger scaffold
- `MEGAPLAN_V27_FINDINGS.md` (concept matrix + validated-gap evidence) and `MEGAPLAN_V27_LEDGER.md` scaffold. No code.

### Phase 1 — ALL unit specs + compile stubs, RED-first (before any production logic)
Write every spec below plus the minimal type/constant scaffolding (type aliases, `TOURNAMENT_CLASSES` const, `classForFE`/`tournamentRoundFromContractId` signatures, `TournamentCycle`/`classId`/`fightEquivalents` field declarations, slice action stubs) so the suite **typechecks and fails on behavior, not on missing imports**. No production logic.

- `src/test/engine/matchmaking/tournamentSelection/feAccrual.test.ts` — arena bout +1; tourney odd-rounds (1/3/5) fought +1 each; even rounds (2/4/6 incl. bronze) +0; bye/forfeit +0; identical deltas via `tour_*` pipeline path and day-tick `applyBoutResults` path.
- `src/test/engine/matchmaking/tournament/consequenceParity.test.ts` — same warriors + seeded outcome through day-tick `applyBoutResults` vs pipeline `resolveBout`: learns/XP/favorites-delta/injury rolls present on both paths; kill case → graveyard+deadWarriorIds+killEvents+participant-stamp+obituary on both; `severeInjuryInsteadOfDeath` + `diedPostBout` honored on both.
- `src/test/engine/matchmaking/tournamentSelection/classes.test.ts` — `classForFE` breakpoints exact (0→Rookies / 1–4→Apprentices / 5–10→Initiates / 11–20→Adepts / 21+→Champions); `tournamentRoundFromContractId` parses `tour_<tId-with-underscores>_<round>_<idx>`.
- `src/test/engine/matchmaking/tournamentSelection/freeze.test.ts` — entering T−2 writes `tournamentCycle` (frozen FE across roster+rivals+freeAgents; invited top-16/class by compositeScore desc w/ id tie-break; weather-skip honored; empty declared/scratched); post-freeze FE growth does NOT change class; late signings (no snapshot) classify by live FE.
- `src/test/engine/matchmaking/tournamentSelection/emission.test.ts` — week-T emission: fields = invited∪declared−scratched−dead/retired, dedupe by warriorId, ≤4/stable/class, caps {64,64,64,48,32}, pad to next pow2 ≤ cap with class-scaled freelancers, class skipped + newsletter below minField 8, `classId` stamped, year-namespaced ids, `activeTournamentId` prefers player-populated bracket, `day:0`.
- `src/test/engine/matchmaking/tournament/multiBracketDay.test.ts` — `advanceTournamentDay` + `drainTournamentRounds` resolve each unfinished same-week bracket's current round per day; per-tournament seed disjointness; `collectTournamentPairings` emits `round===day` bouts for ALL live brackets; no bout resolves twice (`winner===undefined` guard).
- `src/test/engine/ai/tournamentMetagame.test.ts` — worker holds breakpoint-edge warriors (recovery assignments) ≤3 wks out; declares ≤cap/class during the window; spreads classes; RECOVERY/SURVIVAL → scratches; TOURNAMENT_CAMPAIGN → draft bias toward tourney archetypes; deterministic (sort-based, no rng) → shard-vs-inline equal.
- `src/test/engine/matchmaking/grudgeMatch.test.ts` — week T+1 offers carry `grudgeOfTournamentId`; ≤1/warrior; same-`classId` participant pool only; resolves as arena bout (+1 FE, normal feud rules); advisor breakpoint warning.
- `src/test/engine/warrior/designReview.test.ts` — tourney axis: 21-WT small frame → Champions material (good); WT 17–20 → Initiates-viable (info); scum frame → Rookie profile.
- `src/test/engine/advisor/tournamentAdvisor.test.ts` (extend existing) — class from frozen FE vs live pre-freeze; breakpoint distance; entered/scratched status; post-freeze "run them" advice replaces taper for entered non-Champions warriors.
- `src/test/state/serializationRoundTrip.test.ts` (extend) — `tournamentCycle` + `fightEquivalents` + `tourneyRecord` round-trip.
- `src/test/megaplan/v27Tournament.guard.test.ts` — exactly 5 classes w/ strictly ordered breakpoints; field caps; `TOURNAMENT_FREEZE_OFFSET===2`; no `Gold|Silver|Bronze|Iron` tierId references in emission/class modules.

### Phase 2 — FE counter & accrual (turns feAccrual green)
- `Warrior.fightEquivalents?: number` + `CareerRecord.tourneyRecord {entries,wins,losses,titles}` (+ `warriorSchemas` optional fields; legacy backfill `fe = wins+losses` at load — documented overcount for old tourney vets).
- `feDelta` through `calculateCareerUpdate`→`applyCareerUpdate` AND `updateWarriorAfterBout` (warriorStateUpdater — fame/pop-aware path); call sites: `applyRecords` (arena +1; `tour_*` → `tournamentRoundFromContractId`, +1 iff odd), `applyBoutResults` (new `round` param, odd check).
- **Experience-vs-record consumer split** — switch to `fightEquivalents ?? wins+losses` ONLY where the intent is "bouts fought": `fighterState.totalFights` (mastery + death-roll `YOUTH_FIGHTS_REF` via killWindow/deathRolls), `learnRoll.careerBouts`, `progression.ts` bouts, `boutBidding/generation+conversion` `attFights`, `boutAcceptance` `attFights`, `doctrine/strategicLayer/modifiers` fight counts, `rosterWorkerTraining` bouts, `strategyValidator`, `trainers`, `tierProgression`, `prepChecks.fightExperience`, `MasterySection`. **Stays on `career`**: championship `MIN_BOUTS`, almanac, winrates/turnaround, `matchups.hasFought`, epithet milestones, all record displays.
- Mints/factories/signWarrior start `fe = 0`.

### Phase 3 — Tourney consequence parity (turns consequenceParity green)
- `simulateTournamentBout` returns `{outcome, arenaId, planA, planD}`; `applyBoutResults` gains `round` + `planA/planD`.
- After summary + career writes (switched to `updateWarriorAfterBout` with `calculateBoutFame` deltas), run `handleDeath`(`tournamentId`) → `handleInjuries`(`seed=hashStr(fightId)`) → `handleProgressions` (per-bout seeded rng; draw order death→injury→progressions) → apply via `resolveImpacts`.
- Delete `applyTournamentKill`. Verify ordering: records → death → injuries → progressions → lastBoutWeek.

### Phase 4 — Class machinery & the freeze (turns classes/freeze green)
- `src/engine/matchmaking/tournamentSelection/classes.ts`: `TournamentClassId = 'rookies'|'apprentices'|'initiates'|'adepts'|'champions'`; `TOURNAMENT_CLASSES` = `{id,name,minFE,maxFE,fieldCap:{64,64,64,48,32},minField:8,purse:{600,1200,2500,5000,8000},tokenTable}`; `classForFE`; `TOURNAMENT_FREEZE_OFFSET=2`; `CLASS_INVITE_COUNT=16`; `STABLE_CLASS_ENTRY_CAP=4`; `isTournamentFreezeWeek(w) = weeksUntilNextSeasonalTournament(w)===2`.
- `tournamentRoundFromContractId` next to `tournamentIdFromContractId` in `pairings.ts` (`.at(-2)` — tIds contain underscores).
- `GameState.tournamentCycle?: {forWeek, season, frozenAtAbsWeek, feByWarrior, invited: Record<ClassId,WarriorId[]>, declared: Record<StableId,WarriorId[]>, scratched: WarriorId[], elevated: WarriorId[]}` — type + `gameStateSchema` + StateImpact key + `MERGE_CONFIG` `{strategy:'replace'}` + handler (tournamentsHandlers) + **serialization.ts `GameStateValues`/`collectStoreValues` + `createStore` mirror + `opfsArchive/plausibility` whitelist + tournamentSlice field** (⚠️ 4 wiring points beyond schema/slice).
- `weekEndImpacts`: `isTournamentFreezeWeek(nextWeek)` → `handleTournamentFreeze` — FE snapshot (roster+rivals+freeAgents), per-class invites (compositeScore desc, warriorId asc; `committeeWeatherSkip` honored; RECOVERY/SURVIVAL stables excluded), merge prior `elevated` champions into `invited.champions`, freeze newsletter (playerFacing).

### Phase 5 — Class-bracket emission & prizes (turns emission green)
- `emitClassTournaments(state, nextWeek, rng)` replaces `generateSeasonalTiers` inside `handleSeasonalTournaments` (same `((absWeek+1)*881)` seed pattern); per class: field = `invited[c]` ∪ all `declared` (class-checked: frozen FE, live-FE fallback for post-freeze signings) − `scratched` − dead/retired − RECOVERY/SURVIVAL-declining; cap 4/stable re-checked; pad to next pow2 ≤ cap via class-scaled `generateFreelancer` (pools ~70/85/100/110/125 — signature takes classId instead of tier string); skip < minField + newsletter; `buildTournament` reused with class tierId/name + `classId` stamp.
- Retire `committeeSelection`/`TOURNAMENT_TIERS` (guard test asserts no refs in new paths; bardEngine/advisor tests updated).
- `TournamentEntry.classId?: TournamentClassId` — ⚠️ `finalizeRound`'s `tierId !== CHAMPIONS_TOURNEY.TIER_ID` prize-skip stays UNCHANGED (class tierIds never equal 'Champions'); `classId` serves advisor/awards/UI discrimination, not the prize gate.
- `awards.ts`: purse/token ladder keyed by `classId` (5th rung for champions); legacy tier-string parse retained for in-flight old brackets.
- TV elevation: class champion ids appended to next `tournamentCycle.elevated` → freeze merges into `invited.champions` (over FE-band — elevation overrides class).
- `activeTournamentId` = bracket with most player entrants (tie → lowest class); `isTournamentWeek` iff ≥1 bracket emitted; `tournamentCycle` cleared post-emit; `day:0` preserved (round===day pairing rule).

### Phase 6 — Player entry surfaces
- `tournamentSlice`: `tournamentCycle` mirror + `declareTournamentEntry`/`scratchTournamentEntry` (cap + class checks; scratch invited or declared).
- `TournamentPrep` → Entry Desk: during window — roster rows w/ frozen FE, locked class, breakpoint distance ("+2 FE → Initiates"), declare/scratch toggles, invited badges, per-class entrant lists; tourney week — existing readiness; other weeks — class projection + freeze countdown.
- `tournamentAdvisor` rewrite: class from frozenFE (live pre-freeze), breakpoint distance, freeze countdown, entered status; post-freeze advice flips "rest & taper" → "run them — over the breakpoints" (canon rule #1); taper survives for Champions-class only; `WarriorTournamentAdvice` gains `{classId, fe, breakpointGap, entered}`.
- Warrior dossier: FE + locked/projected class + `career.tourneyRecord` (incremented on tourney bouts; titles on class champion).
- `stableCouncil` TOURNAMENT_PREP directive gains breakpoint advisories ("hold X at 4 FE — freeze next week").

### Phase 7 — AI tourney metagame (tournamentWorker v2)
- ⚠️ `processTournamentPrep` is intent-gated only — add the calendar gate: `weeksUntilNextSeasonalTournament(nextWeek)` drives behavior; stays deterministic (sorts only, no rng — shard parity preserved).
- ≤3 wks out (pre-freeze): warriors at/within-1 of a class ceiling get `recovery` assignments (unbookable) — competence-gated; post-freeze: entered warriors resume normal bidding.
- Window: `rival.tournamentEntryIds` — ≤4/class, best-first deterministic sort, spread across classes; RECOVERY/SURVIVAL → scratched invites (replaces the emit-time decline).
- TOURNAMENT_CAMPAIGN: fill every class + `aiDraftFromPool` scorer gains a tourney-archetype weight (via `classifyArchetype` + the new tourney axis; WT-weighted upper classes, scum/AB Rookies).

### Phase 8 — All-class day resolution & bracket UX
- `advanceTournamentDay` + `drainTournamentRounds`: iterate ALL unfinished same-week tournaments, resolve each one's current round per day (seed stride `+ i*16` like the sweep); per-class newsletter lines.
- `collectTournamentPairings`: `round===currentDay && winner===undefined` across all unfinished tournaments (not only `activeTournamentId`).
- Tournaments page: class tabs (all 5 brackets); featured = `activeTournamentId`; `useExecuteTournamentRound` CTA → "Advance all brackets".
- 16/32/48-field behavior verified by `seedNextRound` comment (works for any size; bronze on 2W+2L semis) — spec asserts.

### Phase 9 — Design-review tourney axis
- `designReview.ts`: extend `DesignAxis` union with `'tourney'` + `reviewTourney` items (WT≥21 & SZ≤6 & physicals ok → good "Champions-class frame"; WT 17–20 → info "Initiates-viable"; ST/CN/WL-heavy low-WT → info "Rookie-window"; AB/TP → info "Rookie profile").
- WarriorBuilder review panel + recruit cards ("tourney prospect" flag on WT≥21 frames); AI consumes via Phase 7 draft bias.

### Phase 10 — Grudge matches
- `BoutOffer.grudgeOfTournamentId?: TournamentId` (+ schema); eligibility = same-`classId` `participants`, `boutWeek = T+1`.
- Player: "Call out" on completed class-bracket rows → offer → normal `processAllRivalsBoutOffers` evaluation (boutAcceptance path).
- AI: `boutBidding/generation` T+1 lanes — same-class rematches + stablemate-killer hunts (grudge flavor, normal feud rules).
- Dedupe ≤1 grudge/warrior; +1 FE; advisor warns when it crosses next-cycle breakpoint.

### Phase 11 — Close-out battery + re-baseline
- `bun run test` + `type-check` + lint; `bun run test:slow` (worldLiveness, determinism same-seed + shard-vs-inline, economy); pipeline DAG/purity/order/mutableInput gates; tournament test group.
- Re-baseline world-liveness/guard baselines; before/after matrices (Phase-3 adds day-tick draws; Phase-7 shifts shard draws; Phase-8 adds sims).
- Chromium E2E smoke: entry desk, class tabs, grudge call-out.
- `MEGAPLAN_V27_LEDGER.md` + `MEGAPLAN_V27_DEFERRED.md`.

## Files to modify

- **FE**: `src/types/warrior.types.ts`, `src/schemas/warriorSchemas.ts`, `src/engine/warrior/careerUpdate.ts`, `src/engine/bout/warriorStateUpdater.ts`, `src/engine/bout/recordHandler.ts`, `src/engine/bout/core/pairings.ts` (`tournamentRoundFromContractId`), `src/engine/matchmaking/tournamentSelection/resolution/{results,bouts}.ts`, `src/pages/tournamentPrep/prepChecks.ts`, `src/engine/bout/fighterState.ts`, `src/engine/learning/learnRoll.ts`, `src/engine/warrior/progression.ts`, `src/engine/ai/workers/competitionWorker/boutBidding/{generation,conversion}.ts`, `.../boutAcceptance/index.ts`, `src/engine/ai/plan/coreGenerator/{doctrine,strategicLayer,modifiers}.ts`, `src/engine/ai/workers/rosterWorkerTraining.ts`, `src/engine/strategy/strategyValidator.ts`, `src/engine/trainers/trainers.ts`, `src/engine/pipeline/core/tierProgression.ts`, `src/components/planBuilder/MasterySection.tsx`, factories/signWarrior
- **Parity**: `src/engine/matchmaking/tournamentSelection/resolution/{results,bouts,index}.ts` (+ delete `applyTournamentKill`), reusing `mortalityHandler`/`injuryHandler`/`progressionHandler`/`calculateBoutFame`/`resolveImpacts`
- **Classes/freeze**: `tournamentSelection/classes.ts` (new), `src/engine/core/absoluteWeek.ts`, `src/types/state/{gameState,game}.ts`, `src/schemas/gameStateSchema.ts`, `src/engine/impacts/{types,impactSystem,tournaments}.ts`, `src/engine/pipeline/passes/RivalStrategyPass/finish.ts`, `src/state/slices/tournamentSlice.ts`, `src/state/serialization.ts`, `src/state/createStore.ts`, `src/engine/storage/opfsArchive/plausibility.ts`
- **Emission/prizes**: `tournamentSelection/{core,committee,utils,awards}.ts`, `resolution/index.ts`, `tournamentSelection.ts` (service export)
- **AI**: `tournamentWorker.ts` (v2), `draftService.ts`/`aiDraftFromPool` scorer, `RivalStableData.tournamentEntryIds` (game.ts), `competitionWorker/boutBidding/generation.ts`
- **UI**: `TournamentPrep.tsx` + `tournamentPrep/*` (entry desk), `Tournaments.tsx` + `components/tournaments/*` (class tabs, call-out), `tournamentAdvisor.ts` + advisor types + `stableCouncil/*`, dossier components, WarriorBuilder, scouting/recruit cards
- **Grudge**: `BoutOffer` (rankings.ts) + schema, bid lanes, advisor warning
- **Design axis**: `designReview.ts`, `designDoctrine.ts` thresholds
- **Docs**: `MEGAPLAN_V27_{FINDINGS,PLAN,LEDGER,DEFERRED}.md` at root

## Verification

- [ ] Phase 1 lands with suite RED-for-behavior (compiles; fails on unimplemented logic) — no production logic ships before it
- [ ] `bun run test` + `type-check` + lint green at each phase boundary
- [ ] `test:slow` — worldLiveness, determinism (same-seed + shard-vs-inline), economy
- [ ] Pipeline gates (DAG/ordering/purity/merge/mutableInput)
- [ ] Tournament group green on 16/32/48/64 fields
- [ ] Consequence-parity + freeze + FE specs green
- [ ] `v27Tournament.guard.test.ts` green
- [ ] Re-baseline + before/after matrices; E2E smoke (entry desk, tabs, call-out)

## Risks / considerations

- **RNG stream shifts (largest)**: Phase-3 adds day-tick consequence draws (per-bout seeded — keeps pipeline parity but new draws on that path); Phase-7 shifts shard draws; Phase-8 adds sims; Phase-10 shifts offer draws. All intended → mandatory re-baseline; shard-vs-inline asserted; streams documented in ledger.
- **Bracket-fill**: Champions thin early (world starts ~0-FE) → pad-to-pow2 + minField-8 skip handles; `seedNextRound`/bronze genericity verified by code comment + spec.
- **'Champions' tierId collision** — avoided: class tierIds ≠ 'Champions'; `classId` discriminator; audit tierId read sites (awards parse, prep headers).
- **Invite/declare dedupe** by warriorId; **no double-resolution** (`winner===undefined` guard + `round===currentDay` filter).
- **Save migration**: `fightEquivalents` backfill = W+L (overcount accepted); absent `tournamentCycle` → next freeze creates it; in-flight tiered brackets resolve under legacy awards parser; killEvent id format change noted.
- **Experience-vs-record split** is the subtlest correctness risk: switching a record consumer (MIN_BOUTS, winrates, matchups.hasFought) to FE would change titles/almanac semantics — the explicit two-list split above is the spec; a guard test pins the FE-consumer set.
- **`tour_*` pairing day-rule**: `collectTournamentPairings` filters `round===currentDay` — with 5 brackets sharing `state.day`, all same-week brackets advance in lockstep; a bracket that finishes early simply yields no pairings.
- **Advisor tone flip**: "rest & taper" → canon "run them" — only for entered/non-Champions warriors or advice contradicts itself.
- **Week-boundary catch-up**: `sweepUnfinishedTournaments` already resolves all unfinished brackets (any tier) — multi-bracket safe; ordering vs `tour_*` pairings must keep `winner===undefined` as the resolution authority.
