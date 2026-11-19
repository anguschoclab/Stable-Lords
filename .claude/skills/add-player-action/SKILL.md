---
name: add-player-action
description: Add a new player-facing action end-to-end in Stable Lords. Use whenever adding a gameplay action the player triggers from the UI — offer responses, renames, challenge/avoid marks, purchases, ads. Covers the canonical path — pure engine mutation fn returning a StateImpact → slice action via set() → useGameStore call from a component — and the engineProxy worker lane whose call sites are allowlist-guarded by v14EntryPoints (new worker surface is heavyweight, not the default). Plus what NOT to do: sim work inside set(), raw engineProxy calls from components, Math.random in engine code.
---

# Add a Player Action (the canonical paths)

Player actions reach the engine through **two lanes**, and picking the wrong
one is the classic failure. The default lane is a zustand slice action; the
worker lane is for heavy simulation only and is **guard-allowlisted**.

## Lane 1 — slice action (the default)

For anything that resolves synchronously from current state:

1. **Engine mutation fn** — pure function in `src/engine/<domain>/` taking
   `GameState` + args, returning a `StateImpact`/`Partial<GameStore>` (never
   mutates in place). Precedent: `respondToBoutOffer` in
   `src/engine/bout/mutations/contractMutations.ts`.

2. **Slice action** — add to the matching slice file under `src/state/slices/`
   and apply the returned partial via `set()`:

   ```ts
   // src/state/slices/worldSlice/boutActions.ts
   respondToBoutOffer: (offerId, warriorId, response) => {
     set((state) =>
       engineRespondToBoutOffer(state as unknown as GameState, offerId, warriorId, response)
         as unknown as Partial<GameStore>
     );
   },
   ```

   Slices: `economySlice` (`addFunds`/`deductFunds` — guard with `canTransact`),
   `rosterSlice`, `worldSlice/{playerActions,boutActions,combatActions,promoterActions}`,
   `tournamentSlice`, `progressionSlice`, `bookmarksSlice`, `avatarSlice`.

3. **Dispatch from the UI**:

   ```ts
   const respondToBoutOffer = useGameStore((s) => s.respondToBoutOffer);
   respondToBoutOffer(offerId, warriorId, 'Accepted');
   ```

## Lane 2 — worker job (heavy sim only; guard-allowlisted)

`engineProxy` (`src/engine/runtime/workerProxy.ts`) → Comlink → FIFO
`jobQueue` in `src/engine/runtime/worker.ts`. **`engineProxy.*` call sites are
frozen by `src/test/megaplan/v14EntryPoints.guard.test.ts`** — production
calls may only live in:

- `src/state/createStore.ts` (week/day advance → `commitWorkerResult` → `store.loadGame`)
- `src/hooks/useWeekExecution.ts` (autosim; `engineSession.runExclusive`)
- `src/pages/AdminTools/hooks/adminActions.ts` (fast-forward; `engineSession.runGuarded`)

Every allowlisted caller routes through `engineSession`
(`runExclusive`/`runGuarded`) — the epoch-guarded serializer with the
timeout→`cancelSim` affordance. Adding a new worker method means:

- implement it in `worker.ts`'s `engine` object behind `enqueueSim` (narrative
  preload + cancellation semantics),
- wire a caller inside an allowlisted file through `engineSession`, **or** pin
  it in the guard's `DEAD_SURFACE` (a pinned-dead method that gains a caller
  must leave the list),
- `stripNonSerializable` state before transfer (worker owns the
  structuredClone'd copy — `mutableInput`),
- callbacks must be **top-level args** (`Comlink.proxy(...)`) — Comlink only
  detects proxy markers on direct arguments; a nested callback hits
  `DataCloneError`.

## Mechanics that run every week are not actions

If the "action" is really a mechanic that ticks during week advancement
(training, economy, AI decisions), it belongs in a **pipeline pass**, not a
slice — see the `week-pipeline` skill (`src/engine/pipeline/passes/` +
`WeekPassSpec` in `pipelineStages.ts`).

## What NOT to do

- **Don't call `engineProxy` from a component or hook** — `v14EntryPoints`
  fails the suite. Slice it instead, or argue the guard change deliberately.
- **Don't run sim work inside a `set()` updater** — slice actions are
  synchronous and main-thread; heavy work belongs in the worker lane.
- **Don't mutate `state` in the updater** — return a `Partial<GameStore>`
  (early-return `state`/`{}` when nothing changes — see `updateBoutOfferStatus`).
- **No `Math.random()`/`Date.now()`/`crypto.*` in engine code.** Actions are
  pure; if one needs randomness thread a seeded rng (`resolveRng` precedent,
  `docs/engineering/rng-policy.md`), and remember a _player choice_ modulates
  weights inside the seeded sequence — it never becomes part of a seed string.
- **Don't skip the commit path** — worker results only reach the store via
  `commitWorkerResult`/`loadGame`; slice changes only persist via `set()`.

## Verify before declaring done

Trace the vertical slice: a real, clickable UI control → the slice action or
allowlisted worker call → the engine fn → the result visible in store/on
screen (see `verify-implementation`). Then `bun run test` +
`bun run type-check`.
