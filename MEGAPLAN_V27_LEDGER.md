# MEGAPLAN V27 — Ledger

**Plan:** `.devin/plans/megaplan-v27-tourney-classes.md`
**Findings:** `MEGAPLAN_V27_FINDINGS.md`

## Phase commits

| Phase | Description | Commit | Notes |
|---|---|---|---|
| 0 | Findings + ledger scaffold | this file | — |
| 1 | 12 spec files + compile stubs (RED-first) | — | 33 specs RED, typecheck clean; constants/plumbing ratchets green by design |
| 2 | FE counter & accrual | — | fightEquivalentsOf + feDelta through both paths; 13 experience consumers migrated |
| 3 | Tourney consequence parity | — | canonical stack wired; found+fixed stale-full-object patch bugs in recordHandler/progressionHandler/injuryHandler (player-side rosterUpdates reverted career/fame/xp); applyTournamentKill deleted; guards ratcheted |
| 4 | Classes + freeze | — | feByWarrior snapshot; invited capped per class via compositeScore; classAtFreeze authority |
| 5 | Emission + prizes + TV elevation | — | invited ∪ declared − scratched; pow2 pad w/ class-scaled freelancers; most-player-entrants → activeTournamentId; class purses; championId → cycle.elevated |
| 6 | Player entry surfaces | — | declareTournamentEntry/scratchTournamentEntry slice actions (≤4/class, scratch supersedes); EntryDeskSection on Prep page (freeze window); advisor rewrite (classId/fe/breakpointGap/entered + CLASS_LOCKED/ENTERED/FREEZE_WATCH) |
| 7 | AI metagame | — | processTournamentPrep calendar-gated (≤2 wks); freeze-week breakpoint holdouts (fe ≥ maxFE−1 → recovery); planTournamentEntries deterministic class buckets → tournamentEntryIds; RECOVERY/SURVIVAL → tournamentScratchIds; draft bias WT 21+/17+ for TOURNAMENT_CAMPAIGN |
| 8 | Multi-bracket day resolution | — | advanceTournamentDay + drainTournamentRounds: day-outer/bracket-inner, i*16 seed stride (single-bracket stream preserved); collectTournamentPairings all unfinished brackets; class tabs on Tournaments page |
| 9 | Design-review tourney axis | — | reviewTourney: WT21+SZ≤6 good; WT21 info; WT17–20 info; scum/AB CN15+WL15+ TP/AB/PR info; WT<11 warn; always ≥1 item |
| 10 | Grudge matches | — | buildGrudgeOffers: loser-vs-killer rematches ≤1/warrior, boutWeek=state.week+1, Proposed offers filed at bracket completion (finalizeRound → boutOffers) |
| 11 | Close-out + docs | — | 996 files / 10743 tests green; typecheck + lint (0 err) clean; guards re-ratcheted (fileBudget, paramBudget via options objects, scanInLoop +7 reviewed, v18Srp scoreCandidate split); TickOrchestrator threading preserved via threaded-map drain; DEFERRED.md written; slow battery pending |

## RNG stream changes (re-baseline triggers)

| Change | Stream affected | Direction |
|---|---|---|
| Phase 3 consequence parity | day-tick tournament bouts | +per-bout consequence draws (death/injury/progressions/fame) |
| Phase 5 class emission | pipeline week-end | committee draws → class-emit draws |
| Phase 7 AI metagame | rival shard | holdout/declaration writes (kept draw-free — sorts only) |
| Phase 8 multi-bracket days | day-tick | +sims for additional brackets (stride-disjoint) |
| Phase 10 grudge offers | offer generation | +T+1 grudge offers |

## Before/after characterization matrices

_(filled during Phase 11 re-baseline)_
