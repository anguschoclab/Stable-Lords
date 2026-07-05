# Plan 4 — Move `processWeekBouts` off the main thread

## Key finding — changes the fix

The main-thread `processWeekBouts(gameState)` at `useWeekExecution.ts:53` is **NOT
authoritative**. `doAdvanceWeek` passes `undefined` as `processedState` (`createStore.ts:130-189`)
and `engineProxy.advanceWeek` runs `processWeekBouts` **again inside the worker** via
`BoutSimulationPass.ts:20`. The main-thread call's `impact` is discarded; only
`results`/`deathNames`/`injuryNames` survive to feed `ResolutionReveal`. Bouts are seeded by
`hashStr(\`${week}|${idA}|${idD}\`)` (`boutProcessorService.ts:299`) — the seed is intrinsic to
state, so the worker run is byte-identical.

## Recommendation: Option A (remove the redundant run)

**A1.** Surface display data from the single pipeline run: change `runBoutSimulationPass` to
return `{ impact, results, summary }`; `runBoutPhase` (`weekPipelineService.ts:110-123`) stashes
`{ results, deathNames, injuryNames }` onto the returned `GameState` (e.g.
`lastWeekBoutDisplay`, plain data, clones across the worker boundary). `doAdvanceWeek`/
`doAdvanceDay` build `pendingResolutionData` from `next.lastWeekBoutDisplay` instead of hook
args.

**A2.** In `useWeekExecution.ts` delete line 53/54 and the runtime
`import { processWeekBouts }` (line 4); `await doAdvanceWeek()` with no results args. Existing
spinner (`ExecuteWeekButton.tsx:23`, `running || isSimulating`) already covers the async work.

**A3.** Bonus: drops `@/engine/bout` from the eager main graph.

## Option B (literal request, fallback)

Expose `processWeekBouts` on `worker.ts` (add to the `engine` object) and `workerProxy.ts`
(mirror in the dev `Promise.all` + cached + proxy map), then
`await engineProxy.processWeekBouts(stripNonSerializable(gameState))` in the hook. Works, but
keeps a ~2x sim cost and **the dev proxy runs on the main thread — the freeze only resolves in
a production build** (`npm run build && npm run preview`). Same caveat as autosim today.

## Serialization

`stripNonSerializable` (`serialization.ts:15-25`) removes the Maps/caches; `processWeekBouts`
rebuilds `warriorMap` via `buildWarriorMap`. `BoutResult`/`WeekBoutSummary`/`FightOutcome.log`
are plain data → clone-safe (same path autosim results cross). No `Comlink.proxy()` needed
(no callbacks).

## Verification

Dev: full slate → ResolutionReveal correct, deterministic (reload save, re-run → identical),
autosim still works. **Responsiveness MUST be checked in `npm run build && npm run preview`**
(real Worker) — interact during resolution, no frozen frame; Option A: `processWeekBouts` fires
once, inside the worker. `type-check`/`lint`; `boutProcessorService.test.ts`,
`integration/autosim.test.ts`.

## Risks

Determinism mismatch if two runs get different inputs (Option A avoids by construction);
clone failures (strip Maps); rapid-click race (existing `runningRef` + `isSimulating` guards);
dev shows no fix (state in PR); removing `results` local state may break `AppShell.tsx:115`
(grep first); `doAdvanceWeek` signature churn; **tournament branch** (`doAdvanceDay`) must still
populate display payload — the subtlest part of Option A.

## Critical files

`src/hooks/useWeekExecution.ts`; `src/state/createStore.ts`;
`src/engine/pipeline/passes/BoutSimulationPass.ts`; `src/engine/worker.ts` + `workerProxy.ts`
(Option B); `src/components/ResolutionReveal.tsx`.
