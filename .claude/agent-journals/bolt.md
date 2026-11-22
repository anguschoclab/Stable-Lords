# Bolt Journal

## 2026-05-14 - Identity-keyed WeakMap memoization + the moduleCacheRegistry trap

**Learning:** This codebase's canonical memoization pattern is a WeakMap keyed on
_array identity_ (not state-object identity): hot state arrays
(`arenaHistory`, `graveyard`, `deadWarriorIds`, `retired`) are
**append-only-by-replacement** — every writer assigns a new array (impact
'append' strategy concats; truncation slices; `state.x = [...]`). Verify with
`grep "fieldName.push\|fieldName.splice" src/` before relying on it; an
in-place push would silently poison the cache. Key on the state OBJECT is
wrong — the pipeline mutates `mutableState` in place while swapping arrays.
**Trap:** `src/test/engine/moduleCacheRegistry.test.ts` scans `src/engine/**`
for module-level mutable collections (`new Map/Set/WeakMap` with `.set/.add`
calls) and fails the fast suite unless each is registered with a
context-safety rationale — budget for that edit when adding any engine cache.
Multi-context rationale: engine modules are instantiated per worker context,
so identity-keyed WeakMaps are per-context by construction (safe).
**Action:** Prefer `ReadonlySet`/`readonly` return types for shared cached
collections — mutation becomes a compile error instead of cache corruption
(bouts.ts `inactiveIdSet` was the sole mutator; downstream `deadIds` params
were already `ReadonlySet`). When a second derived set shares input identity,
key its cache on the _first cache's returned instance_ — deadIdSet's shared
set doubles as inactiveIdSet's outer key, so a mid-round kill (new arrays →
new dead set) chains the invalidation for free.
