# Batch Advance — Production Notes

## Status: shipped (no feature flags)

The quarter/year batch advancement, headless mode, and deferred archiving
described in earlier revisions of this document are **unconditionally live**.
The `featureFlags.ts` gate, `useBatchMode` autosim flag, and the legacy
`runAutosim(state, weeks, cb)` signature no longer exist — there is one
sequential code path for every scale of advancement.

## Architecture

- `src/engine/pipeline/services/weekPipelineService.ts` — `advanceWeek`
  orchestrates the 15-pass staged pipeline (core → world → content) over
  `WEEK_PIPELINE_PASSES` (`pipelineStages.ts`). DAG-validated at boot;
  cache maps rebuilt at every stage boundary (`buildWeekCaches`).
- `src/engine/pipeline/tick/timeAdvance/service.ts` — `advanceQuarter` /
  `advanceYear` loop `advanceWeek`, evaluate stop conditions **every week**
  (not just at chunk boundaries), and return `pendingArchives` for the
  caller to flush — the service never performs I/O.
- `src/engine/autosim.ts` — single sequential path; per-week stop
  conditions; `mutableInput` ownership after week 1.
- `src/engine/pipeline/tick/TickOrchestrator.ts` — `advanceDay` and
  `skipToWeekEnd` share `resolveTournamentDay` and the
  `tournamentDaySeed(year, week, day)` formula.
- `src/engine/session.ts` + `src/engine/jobQueue.ts` — all worker entry
  points serialize through the job queue; `engineSession` adds the
  start-captured epoch guard so stale results can never be committed.
- `src/engine/pool/enginePool.ts` — opt-in shard pool (`configureEnginePool`).
  Ships at `poolSize=1` — see `docs/PIPELINE_PARALLELISM.md` for the
  measured ship-gate result.

## Telemetry events

Install a provider via `setTelemetryProvider`. Emitted events:

| Event | Kind | Emitted by |
|---|---|---|
| `advance_week` | timing | `advanceWeek` (per week) |
| `advance_day` | timing | `TickOrchestrator.advanceDay` |
| `advance_quarter` / `advance_year` | timing | `TimeAdvanceService` |
| `advance_quarter_success`/`_error`, `advance_year_success`/`_error` | counter | `TimeAdvanceService` |
| `stop_condition_triggered` | counter | `TimeAdvanceService` / autosim |
| `pipeline_pass_timing` | timing (tag: `pass`) | per-pass, when `__SL_PIPELINE_PROF` is set |
| `parallel_shard_ms` | timing (tag: `shards`) | `EnginePool.distributed` |
| `serialization_clone_ms` | timing | week-context clone (telemetry-enabled only) |
| `serialization_payload_bytes` | gauge | `doAdvanceWeek`/`doAdvanceDay` |
| `engine_roundtrip_ms` | timing (tag: `op`) | worker call boundary |
| `engine_job_queue_depth` | gauge | `jobQueue` on enqueue/dequeue |
| `flush_deferred_archives`, `deferred_logs_count` | timing / gauge | archive drain |

## Rollback

There is no runtime flag. The escape hatches are:

- **Shard pool**: `configureEnginePool(1)` (default) disables distribution
  entirely — the same shard functions run in-line.
- **Per-pass profiler**: off unless `globalThis.__SL_PIPELINE_PROF` is set;
  zero-cost otherwise (one flag read per pass).
- **Telemetry**: no-op provider by default; `setTelemetryProvider` is the
  only activation.

## Operations runbook

- **Benchmarks**: `bun run scripts/parallel-bench.mjs` (ship gate),
  `bun run scripts/soak.mjs --weeks 40 --profile --invariants 5`
  (pulse table + invariant validation + `out/baseline.json` profile).
- **Determinism**: `bun run test:slow` — `determinism.slow`,
  `parallelDeterminism.slow`, `stateInvariants.slow`.
- **Archive failures**: failed bout-log writes re-enter
  `deferredBoutLogs` via `onArchiveRetry` and are retried by the next
  flush; they are never silently dropped.

## Known limitations

1. Headless mode intentionally skips player-facing passes (newsletters,
   gazettes, events).
2. Shard parallelism is currently a measured pessimization (0.38×) — kept
   opt-in; revisit if shard inputs are narrowed to per-shard slices.
3. Graveyard entries are death-time snapshots; a rival victim that remains
   roster-addressable via `lastBoutWeek` rebuilds can accumulate post-death
   progression on the roster copy without affecting the memorial.
