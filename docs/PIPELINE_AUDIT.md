# Pipeline Audit — Execution & Time-Advancement Systems

Audit of every simulation scale and the concurrency surfaces between them.
Findings are marked **fixed** (implemented and test-covered) or **open**.

## Time scales

| Scale   | Entry point                                                                             | Notes                                                                                 |
| ------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Day     | `TickOrchestrator.advanceDay` (`src/engine/pipeline/tick/TickOrchestrator.ts`)          | Tournament rounds only; week boundary delegates to `advanceWeek`.                     |
| Week    | `advanceWeek` (`src/engine/pipeline/services/weekPipelineService.ts`)                   | 16 passes emitting `StateImpact`s, resolved in three staged snapshots.                |
| Month   | `TimeAdvanceService.advanceMonth` / `skipToMonthEnd`                                    | 4-week stride; shares `advanceSpan` machinery with quarter.                           |
| Quarter | `TimeAdvanceService.advanceQuarter` (`src/engine/pipeline/tick/timeAdvance/service.ts`) | 13-week loop, headless mode, per-week stop conditions.                                |
| Year    | `TimeAdvanceService.advanceYear`                                                        | 4 quarters; `mutableInput` ownership chains across quarters after the first.          |
| Autosim | `runAutosim` (`src/engine/autosim/autosim.ts`)                                                  | Single sequential week loop; per-week stop evaluation; cooperative cancellation.      |

## Confirmed findings and resolutions

<!-- markdownlint-disable MD029 — findings are numbered continuously 1–22 across sections -->

### Concurrency / thread-safety

1. **Unqueued engine worker** — concurrent `workerProxy` calls interleaved at `await`
   points inside the worker. **Fixed:** `src/engine/jobQueue.ts` serializes every
   engine method FIFO inside `worker.ts`.
2. **Stale results overwriting a freshly loaded game** — a result computed before
   `loadGame`/reset could be committed after it. **Fixed:**
   `src/engine/session.ts` (`engineSession`) serializes main-thread engine calls and
   captures the epoch at `runExclusive` _call_ time; if `bumpEngineEpoch` fires
   while the job is queued or running, the result resolves `undefined` and is
   discarded. Call-time capture matters: a job enqueued before `loadGame` but
   started after it has already bound stale input state into its closure.
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

### Second-pass hardening (telemetry, guardrails, cancellation)

14. **`setTelemetryProvider` was dead code** — documented and referenced by
    benchmarks, but `globalProvider` was `const` so no provider could ever be
    installed and every metric silently no-oped. **Fixed:**
    `setTelemetryProvider`/`resetTelemetryProvider`/`isTelemetryEnabled` in
    `src/engine/core/telemetry.ts`.
15. **Perf gate was vacuous** — `advanceWeekPerformance.slow.test.ts` fired
    `advanceWeek` without `await`, so the wall-clock assertion measured a
    pending promise. **Fixed:** awaited; a real gate again.
16. **Tournament CTA bypassed every guard** — `useExecuteTournamentRound`
    called `engineProxy.resolveTournamentRound` directly: no `engineSession`
    epoch guard, no `isSimulating` pre-check, and rounds seeded with
    `cryptoRandomInt` instead of `tournamentDaySeed`. **Fixed:** routes
    through the store's `doAdvanceDay` (canonical day path); the hook detects
    non-advancement to surface failures `doAdvanceDay` swallows.
17. **`skipToWeekEnd` was the only worker entry without `mutableInput`** —
    every tournament week-end paid a wasted `structuredClone`. `advanceDay`'s
    day-7 delegation also dropped `opts.headless`. **Fixed:** options
    forwarded at both seams.
18. **Bare `process.env` reads in engine code** (`impactSystem.ts`,
    `rivals.ts`) — `ReferenceError` risk in worker/renderer contexts.
    **Fixed:** guarded `globalThis.process?.env` reads; `envSafety.test.ts`
    scans `src/engine` to keep it that way.
19. **Job timeouts dropped results but never cancelled** — the worker job
    kept burning CPU on a result nobody commits, and autosim had no stop
    affordance. **Fixed:** worker-local cancellation flag
    (`runtime/cancellation.ts`), unqueued `cancelSim` worker entry, week-
    boundary checks in autosim and `advanceSpan`, `cancelSim` invoked by the
    15 s store timeout, and a Stop button in `AutosimConsole`.
20. **UI-only state crossed the worker boundary** — `lastWeekBoutDisplay`
    (a display projection, never read inbound by the engine) was serialized
    outbound. **Fixed:** stripped in `serialization.ts`; durable
    `deferredBoutLogs` remain (they are the archive retry channel).
21. **Redundant `buildWeekCaches` rebuilds** — cache maps were rebuilt at
    every stage boundary even when the stage's resolved impacts could not
    have changed roster/rival contents. **Fixed:** rebuilds are gated on
    whether the stage emitted membership-changing impacts (`caches.ts`);
    the season-boundary rebuild in `finalize.ts` stays unconditional.
    Development pass-purity coverage: `passPurity.test.ts` deep-freezes the
    stage snapshot and asserts all 16 passes run without mutation.
22. **Shard re-attempt measured and gated off** — rival-shard inputs were
    narrowed (`narrowRivalShardState`) and the parallel bench re-run:
    0.33× vs the ≥1.30× gate. `poolSize=1` stays the shipped default; see
    `docs/PIPELINE_PARALLELISM.md`.

<!-- markdownlint-enable MD029 -->

## Disproved during validation

- `loadCombatNarrative` is already memoized — no fix needed.
- Both archive backends already serialize writes internally — no per-backend queue
  needed; ordering is now guaranteed by single-threaded flush ownership.
- `reconstructGameState` cache already has NF4 coverage — only slot keying was
  tightened.

## Open / deferred

- **True parallelism** (worker pool, rival/bout sharding) — re-attempted with
  narrowed shard inputs; measured 0.33× on the 52-week bench vs the ≥1.30×
  gate. `poolSize=1` remains the shipped config; the machinery stays opt-in.
  See `docs/PIPELINE_PARALLELISM.md` for why the next step is persistent
  shard state, not further payload dieting.
- **Comlink double-serialization** on the week path — inherent to the worker
  boundary; mitigated by `stripNonSerializable` but not eliminated.
