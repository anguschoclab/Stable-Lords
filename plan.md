1. **Define a new off-season event in narrative data**
   - Add a `street_performance` event to `src/data/narrativeContent.json` under `offseason_events`. This event describes a gladiator performing for locals during the off-season.

2. **Add the effectType to the SeasonalPass interface**
   - In `src/engine/pipeline/seasonal.ts`, add `street_performance` to the `effectType` union within the `OffseasonEventNarrative` interface.

3. **Implement the mechanical effect in runSeasonalPass**
   - In `src/engine/pipeline/seasonal.ts`, inside the `runSeasonalPass` function, add a new `else if` branch for `e.effectType === 'street_performance'`.
   - The logic will select an active warrior, grant them some fame, grant the stable a minor amount of gold, log the treasury delta via `ledgerEntries`, and add a newsletter item detailing the event.
   - Include a new `TagBadge` UI badge display string in the newsletter if we want to hook it into the UI visually, or we'll just format the newsletter with UI elements like `[+Fame]`, `[+Gold]` to align with the prompt's request for a UI badge hook. Alternatively, add a temporary 'Popular' tag or similar. Let's just grant a tag: `"Local Hero"`. We can use `rosterUpdates` to push `"Local Hero"` to their `tags` array! This directly uses the UI Badge system for tags.

4. **Update Tag Descriptions**
   - Add `"Local Hero"` to `src/data/tagDescriptions.ts` to ensure the tag has a UI tooltip.

5. **Update test mocks**
   - In `src/test/engine/pipeline/passes/SeasonalPass.test.ts`, update the mocked `rng.next()` formulas to account for the new event array length (from 14 to 15 events), ensuring we don't break the seeded tests.
   - Add a small test for the `street_performance` event.

6. **Complete pre commit steps**
   - Complete pre commit steps to ensure proper testing, verification, review, and reflection are done.

7. **Submit the change**
   - Submit the change with a branch name and commit message.
