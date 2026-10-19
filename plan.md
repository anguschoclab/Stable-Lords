1. **Optimize `WeeklyDigestWidget`:**
   - In `src/components/dashboard/WeeklyDigestWidget.tsx`, replace `const roster = useGameStore((s) => s.roster);` with a `useShallow` mapping over `s.roster` to extract only the primitive `id` string for each warrior.
   - Use `useMemo` to convert that array of primitive IDs into a `Set<WarriorId>`.
   - Update imports to include `useShallow` from `zustand/react/shallow`.
2. **Optimize `useRivalryAlerts`:**
   - In `src/hooks/useRivalryAlerts.ts`, perform the exact same optimization: replace `const rosterRaw = useGameStore((s) => s.roster);` with `useShallow` mapping over `id`, and create the `Set` in the `useMemo`.
   - Update imports to include `useShallow` from `zustand/react/shallow`.
3. **Verify:**
   - Run type checks, linter, and `vitest` tests (like `bun run test src/test/hooks/useShallowStability.test.ts`) to make sure the app passes.
4. **Complete Pre-Commit Steps:**
   - Execute the pre-commit steps by fetching them.
5. **Submit the PR:**
   - Create a PR with title starting with "⚡ Bolt: " describing the reduced re-rendering optimization.
