# Scout journal

## 2026-11-22 - Bug-fix commits can land without regression tests

**Gap:** `fix(pipeline): seed skipToWeekEnd recap newsletter id by absoluteWeek` (6660def) shipped no test — a week-seeded uuid recurred yearly → duplicate `key={item.id}` collisions in `state.newsletter`.

**Learning:** `git show --stat` on recent fix commits is a reliable gap source in this repo — feature commits usually carry specs, fix commits sometimes only carry code + journal. Recheck them before mining coverage reports.

**Pattern:** `skipToWeekEnd` internals are private — drive the public entry with `vi.mock('@/engine/matchmaking/tournamentSelection')` returning non-empty `roundResults` + `isComplete: true`, spy `weekPipelineService.advanceWeek` to no-op, and set `state.tournaments = [{id:'cup',completed:false} as ...]` (one incomplete bracket). Assert `state.newsletter` on the RETURNED state — `drainTournamentRounds` works on a shallow copy. Scanner pins `vi.mock`-using specs to `isolated` — consistent with `skipToWeekEndOwnership.test.ts`.
