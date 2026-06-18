1. **`src/engine/narrative/loreGenerator.ts`**: Add 5-10 new ORIGINS, 3-5 new CHILDHOOD_TRAITS, and 3-5 new DEFINING_MOMENTS. Clean up duplicates if found.
2. **`src/data/arenas.ts`**: Add 2-3 new arena lore entries in `ARENA_LORE`.
3. **`src/engine/traits.ts`**: Add new traits (e.g., `orphan_survivor`, `pit_rat`) to `TRAITS`. They will be dynamically wired into `TraitId` (since it's `keyof typeof TRAITS`).
4. **`src/engine/scouting.ts`**: Ensure traits are scoutable (no explicit change needed if it dynamically reads from `TRAITS`).
5. **System Pass & Pruning**: Remove redundant/near-duplicate narrative content from `loreGenerator.ts` and archive them to `.claude/backups/narrative/lore/`.
6. **Pre-commit**: Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
