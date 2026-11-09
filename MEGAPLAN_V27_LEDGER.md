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
| 4 | Classes + freeze | — | |
| 5 | Emission + prizes + TV elevation | — | emission draws change — re-baseline |
| 6 | Player entry surfaces | — | |
| 7 | AI metagame | — | shard draws shift — re-baseline |
| 8 | Multi-bracket day resolution | — | |
| 9 | Design-review tourney axis | — | |
| 10 | Grudge matches | — | offer draws shift |
| 11 | Close-out + docs | — | |

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
