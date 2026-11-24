---
name: tournament-cycle
description: Work on the seasonal tournament cycle — FE (fight-equivalency) classes, the class-freeze snapshot, multi-class bracket emission, entry caps, tournament resolution and terminal sweeps. Use whenever touching src/engine/matchmaking/tournamentSelection/, src/engine/matchmaking/tournament/, championship/champions week logic, tournamentSlice, autosim sweeps, or FE accrual — covers the five FE-banded classes, freeze at TOURNAMENT_FREEZE_OFFSET, who accrues FE (odd rounds only), and the consequence-parity rule that tournament bouts must mutate the world like arena bouts.
---

# Tournament Cycle Domain

Seasonal tournaments run on **fight-equivalency (FE) classes**, not a single
open bracket. Core spec: `src/engine/matchmaking/tournamentSelection/classes.ts`.

## The cycle

- **Classes** — `TOURNAMENT_CLASSES`: `rookies` (FE 0), `apprentices` (1–4),
  `initiates` (5–10), `adepts` (11–20), `champions` (21+). Each spec carries
  `fieldCap`, `minField`, `purse`, `freelancerPool` (attribute budget used to
  pad short fields).
- **FE accrual** — 1 arena bout = 1 FE; a tournament bout grants 1 FE per
  **odd round fought** (rounds 1/3/5 of a six-round bracket). Byes, forfeits,
  and the bronze playoff accrue nothing.
- **Freeze** — `TOURNAMENT_FREEZE_OFFSET = 2`: the class roster snapshots
  `feByWarrior` two display weeks before the bracket (freeze weeks 8/18/28/40
  for seasonals at 10/20/30/42). `classAtFreeze` is the authority — never
  recompute live FE for a live cycle or the class-jump exploit returns.
- **Entries** — `CLASS_INVITE_COUNT` committee invites per class;
  `STABLE_CLASS_ENTRY_CAP` bounds one stable's declared entries.
- **Emission** — `tournamentSelection/emission.ts`, `freeze.ts`,
  `generation.ts`, `bracket.ts`, `committee.ts`/`ncaaCommittee.ts`;
  multi-bracket days in `multiBracketDay` paths.
- **Resolution** — `tournamentResolution.ts`, `tournamentSelection/resolveRound`
  - `resolution/` (`results`, `bouts`, `awards`). Bronze match injected when
    two semifinal losers exist; `(bye)` opponents auto-advance.
- **Terminal sweep** — `sweepUnfinishedTournaments(state, true)` runs at autosim
  completion so a final-week bracket never returns unresolved.

## Consequence parity — the load-bearing invariant

Tournament bouts must apply the same world mutations as arena bouts —
injuries, deaths, fame, XP, rivalry/grudge updates, ledger — pinned by
`consequenceParity` specs. A bracket that resolves fights without impacts is a
regression, not a shortcut.

## Wiring

- Store: `tournamentSlice` (`src/state/slices/tournamentSlice.ts`) holds cycle
  state (`tournamentCycle.feByWarrior`, declared entries); serialization round
  trips are spec-pinned.
- AI side: `src/engine/ai/workers/tournamentWorker.ts`, `tourneyDraftBias` —
  rivals plan entries through the worker layer (see `rival-ai`).
- Matchmaking adjacency: `grudgeMatches`, `rivalryLogic`, `arena` venue
  selection (`tournamentArenaSelection`).

## Verify

`tournament-bracket` (runner) maps the specs; `week-pipeline` for the pass
wiring; `integration-autosim` for `championshipAdvanceWeek` slow coverage.
