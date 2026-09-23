# Pipeline Dependency Map

Who owns what, who may mutate what, and where the integration boundaries are.

## Ownership boundaries

```text
UI/hooks (main thread)
  ├─ useWeekExecution ── engineSession.runExclusive ──▶ workerProxy ──▶ engine worker
  ├─ useAdminTools.skipSeason ── engineSession ──▶ advanceQuarter (worker)
  └─ createStore (zustand) ── commits worker results, owns deferredBoutLogs retry requeue

engine worker
  ├─ worker.ts ── jobQueue (FIFO) ──▶ TickOrchestrator / TimeAdvanceService / runAutosim
  └─ NO persistence I/O — returns pendingArchives to caller

main thread persistence
  ├─ archiveService ──▶ Electron IPC (app) or archiveWorkerProxy → OPFS worker (web)
  └─ opfsArchiver ── drains deferredBoutLogs, owns retry registry + onArchiveRetry
```

## Mutation rules

- Passes never mutate shared state; they return `StateImpact` objects.
- `advanceWeek(state, { mutableInput })`: default clones input (caller keeps
  ownership). `mutableInput: true` is legal only when the caller owns the state
  chain — worker-deserialized input, or week 2+ of an autosim/quarter/year run.
- `buildWeekCaches` output is transient — stripped before worker transfer, rebuilt
  at stage boundaries and on reconstruction.
- `pendingArchives` is data, not I/O — the engine never writes; callers flush via
  `archiveService`.

## Resolution stages (pipelineStages.ts)

| Stage | Passes (order in WEEK_PIPELINE_PASSES) |
| --- | --- |
| `core` | boutSimulation, warrior, economy, equipment |
| `world` | world, recruitment, system, rankings, promoter, promoterLifecycle, trainer, rivalStrategy |
| `content` | event, narrative, progression (+ seasonal handling) |

Rules enforced by `validatePipelinePasses`:

- Two passes may not `replace`-write the same key within one stage.
- `dictMerge`/`mapMerge` collisions are legal only for disjoint keys.
- `after` deps must resolve earlier in the same stage or in an earlier stage.

## Key couplings

- `rosterUpdates`/`rivalsUpdates` replace objects → caches must resync before
  `rivalStrategy`, `boutBidding`, grudge logic read them.
- `RecruitmentPass` must run before `RivalStrategyPass` (draft-pool ordering).
- `WorldPass` computes `computeNextSeason` weekly — no post-hoc season writes
  anywhere else.
- Tournament days share `resolveTournamentDay` (one seed formula, threaded
  tournament entry) between `advanceDay` and `skipToWeekEnd`.
- `engineSession` epoch bumps on `loadGame`/reset; results captured pre-bump are
  discarded (resolve `undefined`).
