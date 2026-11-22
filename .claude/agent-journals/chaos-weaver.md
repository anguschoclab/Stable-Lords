# Chaos Weaver — Agent Journal

## 2026-11-14 - Graveyard is a readable state surface; `popularity` was an unused grant

**Discovery:** Two seams the 61-event pool never touched. (1) `state.graveyard`
(Warrior[]) holds the retention-capped dead — `elegy_for_the_fallen` reads it to
name the honored fallen in its newsletter; no prior event referenced the dead.
(2) `statGrantOutcome`'s `GrantableStat` union includes `popularity`, but no
handler granted it — the memorial feast is its first grant (+15 popularity is
the crowd's reward for a stable that honors its dead). Also: `events` (the
second JSON pool in offseason.json, no `effectType`) is legacy — only
`offseason_events` feeds `runSeasonalPass`.

**Trap (cost me a CI failure):** `makeStubRng().pick` returns `arr[0]`
(undefined on empty) but real `SeededRNG.pick` THROWS `Cannot pick from empty
array`. `rng.pick(state.graveyard ?? [])` crashed `runSeasonalPass` whenever a
test seed landed on the event with an empty graveyard — unit tests with the
stub all passed. ALWAYS `arr.length > 0 ? rng.pick(arr) : undefined` (the
wandering_healer / midnight_feast pattern) — never feed a possibly-empty array
to `rng.pick`.

**Rule:** The determinism characterization test only sweeps
`eventKeys.slice(0, 46)` — always APPEND new events to the end of
`offseason_events` in offseason.json so existing indices don't shift under the
rigged first-roll picker. Keep structural counts (newsletter/ledger/roster
updates) identical across all rng branches anyway — the shape gate still
applies to the events it covers.

**Check:** After wiring, fire `runSeasonalPass` with a stubbed first `next()`
returning `(index + 0.5) / eventCount` to force-select the new event and print
`impact.newsletterItems` — confirms the player-visible surface, not just the
handler's ctx effects.
