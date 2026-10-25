---
name: tournament-bracket
description: Run tournament system tests for bracket generation, round resolution, bronze match logic, and championship determination.
disable-model-invocation: true
---

# tournament-bracket

Tests the tournament system including bracket generation, round resolution, bronze match injection, bye handling, and championship determination.

## Usage

```
/tournament-bracket [filter]
```

## Test Groups

| Filter keyword | What it targets                                                             |
| -------------- | --------------------------------------------------------------------------- |
| (none)         | All tournament system tests                                                 |
| resolution     | src/test/engine/matchmaking/tournamentResolution.test.ts + tournamentSelection/resolveRound.test.ts + completion.test.ts |
| selection      | src/test/engine/matchmaking/tournamentSelection/\*.test.ts                  |
| builder        | src/test/engine/matchmaking/tournamentSelection/bracket.test.ts + generation.test.ts + tournament/bracketUtils.test.ts |
| state          | src/test/state/slices/tournamentSlice.test.ts                               |
| committee      | src/test/engine/matchmaking/tournament/tournamentSelectionCommittee.test.ts + ncaaCommittee.test.ts |
| champions      | src/test/engine/championship/championsTournament.test.ts (week-52 Grand Championship) |
| matchmaking    | src/test/engine/matchmaking/\*.test.ts                                      |

## Commands

**Run all tournament tests:**

```bash
bun run test --reporter=verbose src/test/engine/matchmaking/tournament/ src/test/engine/matchmaking/tournamentSelection/ src/test/engine/matchmaking/tournamentResolution.test.ts src/test/engine/matchmaking/tournamentArenaSelection.test.ts src/test/engine/matchmaking/worldMatchmaking.test.ts src/test/engine/matchmaking/historyLogic.test.ts src/test/engine/matchmaking/rivalryLogic.test.ts src/test/engine/championship/championsTournament.test.ts
```

**Run with a filter (e.g. /tournament-bracket resolution):**

```bash
bun run test --reporter=verbose -- <filter>
```

**Run tournament resolution tests:**

```bash
bun run test --reporter=verbose src/test/engine/matchmaking/tournamentResolution.test.ts src/test/engine/matchmaking/tournamentSelection/resolveRound.test.ts src/test/engine/matchmaking/tournamentSelection/completion.test.ts
```

**Run bracket builder tests:**

```bash
bun run test --reporter=verbose src/test/engine/matchmaking/tournamentSelection/bracket.test.ts src/test/engine/matchmaking/tournamentSelection/generation.test.ts src/test/engine/matchmaking/tournament/bracketUtils.test.ts
```

**Run tournament selection tests:**

```bash
bun run test --reporter=verbose src/test/engine/matchmaking/tournamentSelection/
```

## Notes

- Tournament bracket supports standard single-elimination with bronze match for 3rd place
- Bronze match is injected after semi-finals (Round 5) when 2 losers exist
- Bye handling: warriors with '(bye)' as opponent automatically advance
- Championship determination: winner of final round is declared champion
- Tournament resolution applies bout impacts (injuries, deaths, fame, XP) to warriors
- Tournament selection committee evaluates warriors based on fame, win rate, and recent performance
- Tournament state mutations handle bracket updates, warrior status changes, and completion flags
- Test timeout is 30s (set in vitest.config.ts)
