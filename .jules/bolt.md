## 2024-06-25 - Object Creation Inside Zustand's useShallow Defeats Memoization

**Learning:** When using Zustand's `useShallow`, its internal comparison logic only checks for equality at a single shallow level (e.g., comparing array elements by reference). If you write a `useShallow` selector that constructs a _new array of new objects_ (e.g., `s.roster.map(w => ({ id: w.id }))` or manually pushing objects into an array), the selector returns new object references on every single evaluation. Because the inner objects are new, `useShallow` correctly determines the arrays are "different" and fails to memoize, triggering re-renders across the app for completely unrelated state changes (like the week advancing).
**Action:** Never map state to a new array containing _new objects_ inside a `useShallow` selector. If you just need primitives (like IDs or names), `useShallow((s) => s.roster.map(w => w.id))` is safe because primitive values compare successfully. For objects, extract the required state array directly (`const roster = useGameStore(s => s.roster)`) and then use `useMemo` outside the hook to derive your new array of objects.

## 2026-07-06 - Prevent massive re-renders from useWorldState at root level

**Learning:** Using `useWorldState()` at the root level (like in `RootComponent` or components always mounted) causes the entire application to re-render whenever any state property changes, defeating React's reconciliation.
**Action:** Always select only the specific state properties needed, especially in high-level components. Avoid `useWorldState()` outside of debug views.

## 2024-07-26 - O(N²) array lookups in deep nested loops for Matchmaking Bidding

**Learning:** In `src/engine/ai/workers/competitionWorker/boutBidding.ts`, `generateBoutBids` runs an outer loop over the entire active roster, and within this loop for VENDETTA intents, it searches `mockState.rivals` sequentially using `.find((r) => r.id === targetStableId)` for every single warrior. This causes an O(W * R) lookup where W is the number of warriors and R is the number of rivals, which unnecessarily consumes CPU cycles when a Map lookup (O(1)) would result in an O(W + R) cost. For heavy simulation steps across many teams and weeks, this compounds significantly.
**Action:** When working with nested loops iterating over arrays, immediately consider building a `Map` structure for lookups by ID outside the inner loop to prevent redundant `O(N)` scans.
