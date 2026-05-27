1. **Refactor `processRoster` in `src/engine/ai/workers/rosterWorker.ts` to use `updateEntityInList`.**
   - Import `updateEntityInList` from `src/utils/stateUtils.ts`.
   - Replace the multiple occurrences of `updatedRival.roster = updatedRival.roster.map((w) => w.id === X ? Y : w)` with `updateEntityInList(updatedRival.roster, X, () => Y)`.
   - This optimization replaces O(N) array traversals/allocations with targeted index updates, saving CPU cycles when modifying single elements, as highlighted in `bolt.md`.
2. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
3. **Submit the PR.**
