# Plan 6 — Replace whole-store subscriptions with selectors

## Problem
~30 production call sites do a bare `const {...} = useGameStore()`, subscribing each to the
entire store → any mutation re-renders all. Worst: `useWeekExecution.ts:18`
(`useMemo(reconstructGameState(store), [store])` reserializes full state on any change). The
codebase already has granular selectors (`src/state/selectors.ts`: `useWorldState`, `usePlayer`,
`useRoster`, `useRivals`, `useTreasury`, `useWeek`, `useIsSimulating`, `useReputationState`,
`useStyleStats`) and `useShallow` (`AppShell.tsx:92-104`) — applied inconsistently. Store is
`create()(subscribeWithSelector(immer(...)))`; **actions have stable identities** (safe to
select).

## Keystone fix — `useWeekExecution.ts:18`
```ts
const { doAdvanceDay, doAdvanceWeek, setSimulating, loadGame } = useGameStore(
  useShallow((s: GameStore) => ({ doAdvanceDay: s.doAdvanceDay, doAdvanceWeek: s.doAdvanceWeek,
    setSimulating: s.setSimulating, loadGame: s.loadGame })));
const gameState = useWorldState();   // = useGameStore(reconstructGameState), internally memoized
```
`reconstructGameState` (`serialization.ts:145-154`) returns cached `lastResult` when nothing
relevant changed → identical reference, re-renders only on real game-state change. Test mock
(`useWeekExecution.test.ts:129`) already supports the selector form.

## Migration pattern (mechanical)
Bare destructure → `useGameStore(useShallow((s: GameStore) => ({ ...only-used-fields, ...actions })))`,
or existing single-field selectors (`s => s.atTitleScreen`, `useRoster()`). Representative
offenders: `ArenaHub.tsx` (3 sites: 56/146/240), `Tournaments.tsx:79`, `Trainers.tsx:57`,
`Scouting.tsx:28`, `WarriorDetail.tsx:53`, `PromoterDirectory/Detail`, `StableHall`, `Graveyard`,
`Orphanage`, `StableLedger`, `HallOfFame`/`AdminTools` hooks, and trivial single-key sites
(`__root.tsx:29`, `useCoachTip`, `useBookingOffice`, `Training`, `StartGame`,
`PhysicalsSimulator` → `useRoster()`).

## isBookmarked trap (highest risk)
`isBookmarked` is a stable function; today components recompute bookmark-filtered `useMemo`s only
because they re-render on every store change. After scoping, also select `bookmarks: s.bookmarks`
and add `bookmarks` to those `useMemo` deps (Tournaments/Trainers/Scouting/PromoterDirectory).

## Rollout (incremental, commit per batch)
- **Batch 0** (validate): `useWeekExecution.ts` + `ArenaHub.tsx`, DevTools render-count check.
- **Batch 1:** bookmark-sensitive pages.
- **Batch 2:** remaining pages/hooks.
- **Batch 3:** sub-components/widgets.
- **Batch 4:** trivial single-key.

Do NOT touch `src/test/**` call sites.

## Verification
Per component, the selector object keys ⊇ all reads (static check); `type-check` (missing key
fails to compile); `npm test` (esp. `useWeekExecution.test.ts`); React DevTools "highlight
updates" — toggle an unrelated field (e.g. event log) and confirm heavy pages no longer flash;
behavioral smoke incl. bookmark toggle.

## Risks
isBookmarked stale memos; over/under-selecting (typecheck + read fully); action identity (stable,
safe); `reconstructGameState` shared cache (`clearReconstructionCache` on load/reset expected);
test mocks that return a bare object must support the selector form (grep `vi.mock('@/state/useGameStore')`).

## Critical files
`src/hooks/useWeekExecution.ts`; `src/pages/ArenaHub.tsx`; `src/state/selectors.ts`;
`src/state/serialization.ts`; `src/components/AppShell.tsx` (reference pattern).
