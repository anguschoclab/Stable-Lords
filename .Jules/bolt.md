
## 2024-06-25 - Handlebars-style string substitution optimization
**Learning:** In tight loops (like narrative log generation and event processing), dynamically instantiating `new RegExp` objects inside an `Object.entries(data)` iteration is a severe performance bottleneck. Generating one regex string literal per object key forces the engine to parse, compile, and execute multiple regex patterns per template dynamically.
**Action:** Always prefer a single static pre-compiled Regex (like `replace(/\{\{\s*([^{}\s]+)\s*\}\}/g, (match, key) => ...)`) that matches the placeholder syntax directly. In our benchmarks, this single-pass matching strategy was over 2x faster, saving significant CPU cycles in hot loops.

## 2025-02-23 - [Regex String Interpolation in Template Engines]
**Learning:** Replaced multiple chained `.replace()` calls with a single-pass regex replacement logic. It turns out that passing a replacer function instead of a replacement string acts as a literal string replacer, silently solving edge-case bugs with special string characters like '$'.
**Action:** Always prefer a single regex pass with a dictionary lookup/switch statement over multiple chained .replace() calls to reduce array/string allocations and string parsing times in template engines.

## 2026-05-02 - O(N^2) Performance Jank in Bout Replays
**Learning:** Found that `HighlightLog` was re-parsing string combat logs on every tick of the bout viewer replay loop because its `useMemo` block depended on `visibleCount`. This meant O(N) operations per tick, turning into O(N^2) for the entire playback lifecycle.
**Action:** Always pre-calculate derived text properties of static arrays once (memoize based on the `log` array alone) and only filter the *results* array by tick counters (`visibleCount`) to reduce work from O(N) string matches per tick to an O(1) loop filter.

## 2026-05-10 - Precomputing relationships to prevent N+1 array scan bottlenecks
**Learning:** To prevent N+1 array scan bottlenecks in React components (e.g., repeatedly using `.find()` inside a loop over historical data), precompute relationships by storing required entity details directly into a `useMemo` Map or utilize existing global/store lookup utilities.
**Action:** When a UI component needs to look up entities (like warriors or stables) repeatedly, prefer extracting the lookup to a precomputed `Map` or using an optimized resolution utility like `findWarrior` rather than running `.find()` sequentially over large arrays (`roster`, `graveyard`, `rivals`, etc.) multiple times.

## 2024-05-13 - [O(1) lookups for findWarrior]
**Learning:** Found multiple places in React components doing `.find` on `state.roster`, `state.graveyard`, `state.retired` or `state.rivals` arrays. This is an O(N) operation per lookup, inside render cycles. The project specifically has O(1) caching utilities `findWarrior` in `src/utils/historyResolver.ts`.
**Action:** Replace `state.roster.find(...)` and `graveyard.find(...)` manual O(N) loops with `findWarrior(state, id)` where possible to resolve the N+1 array scan bottleneck.

## 2025-02-23 - [Caching compiled Regexes using WeakMap for Component Instances]
**Learning:** Found that using `useMemo` for expensive operations like compiling a `new RegExp` or instantiating a `new Set` is only component-scoped. In lists where many components (like `LinkifiedText` in `EventLog.tsx`) receive the exact same array reference (e.g. `allWarriorNames`), this results in compiling the regex N times during the initial render.
**Action:** Use a module-level `WeakMap` cache keyed by referentially stable arrays (e.g. `names` array) to share the compilation result across all instances, reducing CPU cycles and allocations significantly.

## 2024-05-18 - [Optimizing Single Element Array Updates]
**Learning:** Found that `updateEntityInList` was using `.map()` over potentially large arrays (e.g. `state.roster`) to update just one item. `.map()` executes the callback function for *every single item* and creates a brand new array every time.
**Action:** When updating a single element in an array based on an ID, use `.findIndex()` followed by a shallow array clone `[...list]` and direct index assignment instead of `.map()`. This early returns out of the array search once the item is found, reducing N function calls down to an average of N/2 native comparisons, and does a fast native shallow copy rather than repeated array pushes.

### ⚡ Performance Optimization: Skip To Week End (2026-05-22)
**What:** The `useGameStore` simulation action used to iterate day-by-day `advanceDay` through the worker proxy up to day 7 when `isTournamentWeek` was true. This involved awaiting a Promise.race over the worker bridge on every loop iteration. It has been replaced by delegating the entire `for` loop to `engineProxy.skipToWeekEnd`.
**Why:** Batching the simulation ticks inside `TickOrchestrator.skipToWeekEnd` before crossing the worker communication boundary drastically reduces asynchronous promise queuing and worker messaging overhead.
**Impact:** Local benchmark showed execution dropping from `102ms` to `63ms` (a ~38% speedup).
