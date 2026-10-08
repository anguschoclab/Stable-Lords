## 2024-05-24 - EntityLink Re-renders
**Learning:** Avoid passing raw `useGameStore((s) => findWarrior(s, undefined, name)?.id)` when name resolution requires the full store state. `findWarrior` triggers full store evaluation. Instead, use a specialized selector like `useWarriorNameState()` which returns a shallower slice for name resolution, or improve `findWarrior` to only depend on the specific state it needs.
**Action:** Use `useWarriorNameState()` to fetch the state needed for name resolution, and then use `findWarrior` or `findStableId` on that shallower state object.
