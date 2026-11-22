# Rivalry Agent Journal

## 2026-05-13 - `state.rivalries` had no release valve; cooling must live in WorldPass

**Finding:** Stable-level `Rivalry` records only ever grew —
`updateRivalriesFromBouts` (`src/engine/matchmaking/rivalryLogic.ts`) does
`Math.max(existing.intensity, …)` or creates; nothing ever subtracted or
removed. Stale rivalries biased matchmaking forever (`+50 × intensity` in
`schedulingAssistant/pairwise.ts`), flipped `mortalityHandler` kills to
`RIVALRY_FINISH`, and filled the almanac board until `storage/truncation.ts`
sliced them arbitrarily. Unlike `OwnerGrudge` (deliberate floor-1 decay, a
tested contract), `Rivalry` had no cool-down path at all.

**Learning:** `updateRivalriesFromBouts` runs TWICE per week-advance — once in
`finalizeWeekSideEffectsToImpact` (bout resolution) and once in `runWorldPass`
(pipeline rollover) — both over the same `weekFights`. Any per-call decay
would double-fire. Cooling belongs in `runWorldPass` only
(`coolQuietRivalries`): exactly one -1/quiet-week pass, dissolving at 0 with a
gazette notice.

**Rule:** Future rivalry heat changes must respect the double-invocation —
`updateRivalriesFromBouts` is not a once-per-week boundary; `runWorldPass` is.
Do not add decay/floor logic inside `updateRivalriesFromBouts` (its unit tests
pin growth-only behavior for pairs absent from the week's fights).
