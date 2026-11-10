# MEGAPLAN V27 — Findings: Tournament Classes, FE & Freeze Dates

**Plan:** `MEGAPLAN_V27_PLAN.md`
**Source material:** Duel2 / Arena 93 Noblish Island articles — "What Is a Tourney Warrior?" and Pagan's "Are You Ready To Take Tournament Play Seriously?"
**Audit status:** every claim below verified against the code during plan validation (✅ verified, ⚠️ corrected, ❌ disproved).

---

## 1. The headline gap — interactive tournament resolution is a stripped path

**Verified.** Two tournament-bout resolution paths exist and they are NOT equivalent:

| Path | Entry | Career/fame | Learns/XP/discovery | Injuries | Death handling | Popularity |
|---|---|---|---|---|---|---|
| `tour_*` pipeline (`resolveBout` → `collectBoutImpacts`) | week-boundary `collectTournamentPairings` (`round===day`) | `applyRecords` + `calculateBoutFame` | `handleProgressions` (learns/XP/favorites/chart) | `handleInjuries` | `handleDeath` (obituary, unacknowledgedDeaths, +5 fame, house rules, `diedPostBout`) | ✅ |
| Interactive/sweep (`resolveRound` → `resolveRoundBouts` → `applyBoutResults`) | `advanceTournamentDay` (day tick), `sweepUnfinishedTournaments` | `updateWarriorFromBoutOutcome` — flat win=1/kill=3, **signature can't even accept deltas** | ❌ none | ❌ none | bespoke `applyTournamentKill` — graveyard/registry/events/roster-purge/participant-stamp but **no obituary, no +5 fame, ignores `severeInjuryInsteadOfDeath`, ignores `diedPostBout`** | ❌ none |

Interactive play — the path a human player actually experiences on tournament days — strips exactly the rewards the article calls the point of tournaments (skill learns, favorite-weapon discovery, development).

**Phase-3 fix (validated feasible):**
- `simulateTournamentBout` must return `planA`/`planD` (currently discarded) — `handleProgressions` grades discovery off executed plans.
- `handleInjuries` takes a numeric `seed` — derive per-bout (`hashStr(fightId)`), matching pipeline `boutSeed` semantics.
- Consequence rng = **per-bout seeded**, preserving pipeline draw order: death → injuries → progressions.
- `applyBoutResults` switches career writes to `updateWarriorAfterBout` (warriorStateUpdater) with `calculateBoutFame` deltas; killer-fatigue-reset replaces victim-reset — moot under tournament-week `skipFatigue`.
- `handleDeath` strictly subsumes `applyTournamentKill` — `deadWarriorIds` handler already re-stamps participant snapshots `Dead` (`impacts/warriors.ts`), killEvents carry `tournamentId`, feud exclusion via param. ⚠️ killEvent id format normalizes `kill_wk_vid_tId` → `kill_wk_vid` (dedupe semantics unchanged).
- Ordering = records → death → injuries → progressions → lastBoutWeek.

## 2. Article concept → current state → treatment matrix

| Article concept | Verified state | V27 treatment |
|---|---|---|
| FE (fight equivalency) | `prepChecks.fightExperience = wins+losses`; tourney bouts count full weight | `warrior.fightEquivalents`: +1 arena bout, +1 per **odd round fought** (rounds 1/3/5); byes/forfeits/bronze = 0 |
| Breakpoints R/N/A/I/A/C | `TOURNAMENT_TIERS` rank bands (top-256 committee) | `TOURNAMENT_CLASSES` verbatim Duel2 breakpoints: 0 / 1–4 / 5–10 / 11–20 / 21+; Novices folds into Rookies |
| Freeze date | Selection inside tourney week (`finish.ts weekEndImpacts`) | `tournamentCycle` at T−2 (`weeksUntilNextSeasonalTournament(nextWeek)===2`): FE snapshot → locked class + invites; T−2,T−1 = canon "2+ fights over breakpoints" window |
| Entry choice | Committee conscription; RECOVERY/SURVIVAL intent declines | Hybrid: top-16/class auto-invites (scratchable) + open declarations ≤4/stable/class + freelancers; `rival.tournamentEntryIds` (new field) |
| Tourney warriors | `designReview` 5 axes + `classifyArchetype` | New `'tourney'` axis (WT21+small→Champions frame; WT17→Initiates; ST/CN/WL→Rookie window; AB/TP→Rookie profile) |
| Knack / hidden stats | `luckfactor` ±4/skill + `bloodlust` at mint, applied in combat | Already canon — no work (scout-rumor surface deferred) |
| Death | Lethal; kills excluded from feuds | Keep; `handleDeath` replaces bespoke kill code (feud exclusion via `tournamentId` param) |
| TV / TC | Tier purse 5000/2500/1200/600 + 4-rung token table | 5-rung class ladder (Champions adds ~8000 rung); TC per class; "TV elevation" → auto-invite Champions class next seasonal |
| Sandbagging | `isBookable` blocks `trainingAssignments` — recovery IS the holdout mechanism | Advisor + AI holdouts at ceilings pre-freeze, aggression post-freeze |
| Class spreading | none | ≤4/stable/class cap; AI distributes |
| Roll-ups in fives | `aiDraftFromPool` exists | TOURNAMENT_CAMPAIGN scorer weight toward tourney archetypes |
| Personal records / weapon chart | `favorites.chart` via `handleProgressions` | Parity by Phase 3; + `career.tourneyRecord` dossier stat |
| Style lists / secrecy | dossiers/planIntel/planMasked/scout reports | Exists — prep entrant list is the style list |
| Matchups | STYLE_PENALTIES + canonTargeting | Emergent — unchanged |
| Grudge matches | `BoutOffer` + AI bid lanes exist | `grudgeOfTournamentId` lane, T+1, same-class pool, ≤1/warrior, +1 FE |
| ~30 warriors / class mix | — | Emergent via entry desk + class tabs |

## 3. Corrections surfaced by validation

1. **`finalizeRound` prize-skip needs no change** — `tierId !== CHAMPIONS_TOURNEY.TIER_ID` already works; class tierIds just must differ from `'Champions'`. `TournamentEntry.classId` discriminates for advisor/awards/UI, not the prize gate.
2. **`processTournamentPrep` is intent-gated only** — the metagame needs a calendar gate (`weeksUntilNextSeasonalTournament(nextWeek)`) inside the worker.
3. **`tournamentCycle` wiring is 4 points beyond schema/slice**: `serialization.ts` `GameStateValues`+`collectStoreValues`, `createStore` mirror, `opfsArchive/plausibility` whitelist.
4. **FE consumer split must be explicit** — ~15 wins+losses sites divide into:
   - *Experience* (→ `fightEquivalents ?? wins+losses`): `fighterState.totalFights` (mastery + death-roll `YOUTH_FIGHTS_REF`), `learnRoll.careerBouts`, `progression.ts`, `attFights` in boutBidding generation/conversion + boutAcceptance, `doctrine`/`strategicLayer`/`modifiers` counts, `rosterWorkerTraining`, `strategyValidator`, `trainers`, `tierProgression`, `prepChecks.fightExperience`, `MasterySection`.
   - *Record* (stays `career`): championship `MIN_BOUTS`, almanac, winrates/turnaround, `matchups.hasFought`, epithet milestones, record displays.
5. **Test filing**: domain dirs are `src/test/engine/matchmaking/tournamentSelection/` + `.../tournament/` + `engine/ai/` + `engine/warrior/` + `engine/advisor/` + `state/` + `megaplan/` — `testQualityAudit` enforced.
6. **`handleSeasonalTournaments` sets `day:0`** — the shared day counter is what makes `round===currentDay` pairings work across multiple brackets.
7. **Emission seed pattern** `((absoluteWeek+1)*881)` preserved for class emission.

## 4. Determinism notes (determinism-debug skill)

- Phase 3 adds day-tick consequence draws — per-bout seeded; the shared round rng order is unchanged until that point (fight sims draw identically before consequences run).
- Phase 7 AI decisions must stay draw-free (sorts) or use the stable's existing seeded stream — `processTournamentPrep` currently receives no rng; keep it that way.
- Phase 8 multi-bracket resolution uses the sweep's `+ i*16` stride precedent (`sweepUnfinishedTournaments`) to keep per-tournament streams disjoint.
- Phase 5 emission replaces committee draws with class-emit draws — **expected** re-baseline (world characterization changes).

## 5. Deferred (intentional)

- Scouting-rumor surface for knack (`luckfactor`/`bloodlust` exist but stay hidden).
- Duel2's separate Novices class (0-FE post-freeze debut = Rookies under our fold).
- Freeze deeper than T−2 (2-week window chosen: enough for the "2+ fights" exploit, bounded admin surface).
- FTF-style real-time social systems (already emergent via dossiers/decoys).
