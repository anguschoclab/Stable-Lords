# V3 Codebase Scans

## Circular Dependencies (madge)
**7 circular dependencies found:**

1. `engine/bout/services/boutProcessorService.ts` ↔ `engine/bout/services/WeekFinalizationService.ts`
2. `engine/potential.ts` ↔ `engine/recruitment.ts`
3. `state/createStore.ts` → `state/serialization.ts` → `state/useGameStore.ts` (3-node cycle)
4. `state/serialization.ts` → `state/useGameStore.ts` → `state/selectors.ts` (3-node cycle)
5. `state/useGameStore.ts` → `state/selectors.ts` (2-node cycle)
6. `state/serialization.ts` → `state/useGameStore.ts` (2-node cycle)
7. `types/state.types.ts` ↔ `types/warrior.types.ts`

**Assessment**: Cycles 3-6 are in the state layer and likely involve type-only re-exports. Cycle 7 is a type-level circular import. Cycles 1-2 are in the engine and may need extraction of shared interfaces.

## Console.log in Production
**0 found** — clean. No `console.log`, `console.warn`, or `console.error` in source files.

## TODO/FIXME/HACK/XXX
**0 found** — clean. No TODO, FIXME, HACK, or XXX markers in source files.

## `any` Type Escapes (non-test, non-.d.ts)
**29 instances across 3 files:**

1. `src/data/narrative/index.ts` (26 instances) — JSON imports cast `as any` for dynamic module loading. This is a known pattern for lazy-loaded narrative data. **OBSERVATION**: Could be fixed with proper typed imports but low risk.
2. `src/engine/gazette/gazetteNarrative.ts:257` — `(narrativeContent as any).memorials?.tributes` — accessing lazy-loaded field before initialization. **OBSERVATION**: Could use optional chaining with proper type.
3. `src/components/dashboard/ActionTimeline.tsx:23` — `useShallow((s: any) => ...)` — store selector without typed state. **OBSERVATION**: Should use `GameStore` type.

## Summary
| Check | Count | Status |
|-------|-------|--------|
| Circular dependencies | 7 | Documented — 5 in state layer (type-only), 2 in engine |
| Console.log | 0 | Clean |
| TODO/FIXME | 0 | Clean |
| `any` escapes | 29 | 26 in narrative (lazy-load pattern), 3 fixable |
