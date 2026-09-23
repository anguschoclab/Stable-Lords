# Pipeline Audit — Execution & Time-Advancement Systems

Audit of every simulation scale and the concurrency surfaces between them.
Findings are marked **fixed** (implemented and test-covered) or **open**.

## Time scales

| Scale | Entry point | Notes |
| --- | --- | --- |
| Day | `TickOrchestrator.advanceDay` (`src/engine/pipeline/tick/TickOrchestrator.ts`) | Tournament rounds only; week boundary delegates to `advanceWeek`. |
| Week | `advanceWeek` (`src/engine/pipeline/services/weekPipelineService.ts`) | 15 passes emitting `StateImpact`s, resolved in three staged snapshots. |
| Quarter | `TimeAdvanceService.advanceQuarter` (`src/engine/pipeline/tick/timeAdvance/service.ts`) | 13-week loop, headless mode, per-week stop conditions. |
| Year | `TimeAdvanceService.advanceYear` | 4 quarters; `mutableInput` ownership chains across quarters after the first. |
| Autosim | `runAutosim` (`src/engine/autosim.ts`) | Single sequential week loop; per-week stop evaluation. |
| Month | — | **Does not exist.** No month abstraction; do not invent one without product sign-off. |

## Confirmed findings and resolutions

<!-- markdownlint-disable MD029 — findings are numbered continuously 1–13 across sections -->

### Concurrency / thread-safety

1. **Unqueued engine worker** — concurrent `workerProxy` calls interleaved at `await`
   points inside the worker. **Fixed:** `src/engine/jobQueue.ts` serializes every
   engine method FIFO inside `worker.ts`.
2. **Stale results overwriting a freshly loaded game** — a result computed before
   `loadGame`/reset could be committed after it. **Fixed:**
   `src/engine/session.ts` (`engineSession`) serializes main-thread engine calls and
   captures an epoch at job *start*; if `bumpEngineEpoch` fires while the job runs,
   the result resolves `undefined` and is discarded.
3. **Deferred bout-log retry was dead on the UI path** — failed archive writes were
   requeued onto an ephemeral worker-state array, and `loadGame` /
   `reconstructGameState` never carried `deferredBoutLogs`, dropping retries.
   **Fixed:** module-level retry registry in
   `src/engine/pipeline/adapters/opfsArchiver.ts`; the store subscribes via
   `onArchiveRetry` so requeued logs land on live state; `deferredBoutLogs` is
   threaded through `store.types.ts`, `serialization.ts`, and `createStore.ts`.
4. **Electron split-brain persistence** — week archives flushed on the main thread
   (IPC) while quarter/year flushes happened inside the engine worker (nested OPFS
   worker) → two different backends for the same data. **Fixed:** engine services
   return `pendingArchives`; all I/O happens on the caller/main thread through
   `archiveService`.
5. **Eager nested workers** — importing `workerProxy`/`archiveWorkerProxy` spawned
   workers at module load (broke Node/headless tests, nested-worker startup).
   **Fixed:** both proxies construct on first method call.
6. **`skipSeason` bypassed the `isSimulating` guard** and performed a redundant
   post-hoc `computeNextSeason` write (already applied weekly by `WorldPass`).
   **Fixed:** guarded by `isSimulating`, routed through `engineSession`, redundant
   season write removed.

### Pipeline correctness

7. **Gazette clobbering** — `ProgressionPass` and `NarrativePass` both wrote
   `gazettes` with a `replace` strategy in the same resolution group → one could
   overwrite the other. **Fixed:** resolution split into `core` → `world` →
   `content` stages (`pipelineStages.ts`); the DAG validator rejects same-stage
   `replace` collisions.
8. **Stale derived caches** — `rosterUpdates` replaced warrior objects mid-week, so
   `warriorMap`/`rivalryMap`/`grudgeMap` held pre-bout references consumed by
   `RivalStrategyPass`, `boutBidding`, and grudge logic. **Fixed:** stage-boundary
   `buildWeekCaches` resync in `weekPipelineService`.
9. **Tournament-day seed divergence** — `advanceDay` and `skipToWeekEnd` seeded
   rounds differently (`week*100+day` vs `year*10000+week*100+day`) and resolved
   them through different code. **Fixed:** shared `resolveTournamentDay` with one
   seed formula and threaded tournament entry.
10. **Stop conditions only evaluated at checkpoints** — a `rosterEmpty`/`playerDeath`
    could allow several extra simmed weeks. **Fixed:** autosim and quarter/year
    evaluate stop conditions every week.
11. **Duplicated `boutOffers` pruning** — offer cleanup existed in two places with
    divergent rules. **Fixed:** consolidated in `src/engine/bout/offerCleanup.ts`.
12. **Autosim dual-path divergence** — sequential and batch paths diverged in pass
    invocation (including an arg shift into `runNarrativePass`). **Fixed:** single
    sequential path; legacy signature and `useBatchMode` removed.

### Serialization overhead

13. **~4 deep + 2 shallow state copies per tick** — `structuredClone` at the week
    boundary, Comlink serialization both ways, immer copy on commit. **Partially
    fixed:** `mutableInput` lets owned chains (autosim weeks 2+, quarter/years 2+,
    worker entry points) skip the input clone; `stripNonSerializable` drops computed
    caches before transfer. Comlink transfer and immer commit remain by design.

<!-- markdownlint-enable MD029 -->

## Disproved during validation

- `loadCombatNarrative` is already memoized — no fix needed.
- Both archive backends already serialize writes internally — no per-backend queue
  needed; ordering is now guaranteed by single-threaded flush ownership.
- `reconstructGameState` cache already has NF4 coverage — only slot keying was
  tightened.

## Open / deferred

- **True parallelism** (worker pool, rival/bout sharding) — architecturally gated:
  requires a measured ≥30% win on 52-week autosim plus a determinism test before
  shipping; `poolSize=1` remains the shipped config.
- **Comlink double-serialization** on the week path — inherent to the worker
  boundary; mitigated by `stripNonSerializable` but not eliminated.
