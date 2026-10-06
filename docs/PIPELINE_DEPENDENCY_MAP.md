# Pipeline Dependency Map

Who owns what, who may mutate what, and where the integration boundaries are.

## Ownership boundaries

```text
UI/hooks (main thread)
  ├─ useWeekExecution ── engineSession.runExclusive ──▶ workerProxy ──▶ engine worker
  ├─ useExecuteTournamentRound ── store.doAdvanceDay (canonical day path;
  │  no direct engineProxy calls — seeds, epoch guard, isSimulating come free)
  ├─ useAdminTools.skipSeason/skipMonth ── engineSession ──▶ advanceQuarter/advanceMonth (worker)
  └─ createStore (zustand) ── commits worker results, owns deferredBoutLogs retry requeue;
     15 s engine-job timeout calls worker cancelSim so abandoned jobs stop

engine worker
  ├─ worker.ts ── jobQueue (FIFO) ──▶ TickOrchestrator / TimeAdvanceService / runAutosim
  ├─ cancelSim ── UNQUEUED: flips the worker-local cancellation flag so the
  │  in-flight sim exits at the next week boundary (checked in runAutosim and
  │  advanceSpan); flag cleared at each sim-job start
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
  at stage boundaries (gated on whether the stage emitted membership-changing
  impacts) and on reconstruction.
- Outbound serialization strips UI-only `lastWeekBoutDisplay`; durable
  `deferredBoutLogs` always survives — it is the archive retry channel.
- `pendingArchives` is data, not I/O — the engine never writes; callers flush via
  `archiveService`.

## Resolution stages (pipelineStages.ts)

| Stage     | Passes (order in WEEK_PIPELINE_PASSES)                                                    |
| --------- | ----------------------------------------------------------------------------------------- |
| `core`    | boutSimulation, warrior, economy, equipment                                               |
| `world`   | world, recruitment, system, rankings, promoter, promoterLifecycle, trainer, rivalStrategy |
| `content` | event, narrative, progression (+ seasonal handling)                                       |

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
- `engineSession` captures the epoch at `runExclusive` call time; a bump
  (`loadGame`/reset) while the job is queued or running resolves `undefined`
  — results bound to pre-bump input state can never be committed.
- Engine code must not read bare `process.env` — use `globalThis.process?.env`
  (`envSafety.test.ts` enforces).
- `RivalStrategyPass` distributes a narrowed shard ctx
  (`narrowRivalShardState`) — identical bytes to the in-line path; adding a
  GameState field read by rival logic requires widening it
  (`shardInputSize.test.ts` guards both directions).

## Context-local caches

`src/engine` ships into multiple execution contexts (main thread, engine
worker, shard workers); each context gets its OWN module instance, and
`postMessage` structured-clones state — so a `GameState` object's identity
lives in exactly one context and module-level caches never cross it.

Identity-keyed caches (`WeakMap` on a state/history object):

| Cache | Key | Rebuild trigger |
| ----- | --- | --------------- |
| `core/warriorLookup.ts` `warriorCache` | `GameState` identity | new state object (every impact resolution, and every week under `mutableInput` since `createMutableWeekContext` shallow-spreads the top level) |
| `core/historyResolver.ts` `warriorCache`/`stableCache` | state object identity | same |
| `matchmaking/schedulingAssistant/headToHead.ts` `h2hByHistory` | `arenaHistory` array identity | new history array (append-only-by-replacement) |
| `matchmaking/arenaFit.ts` `underservedByHistory` | `arenaHistory` identity + week | new history or new week |
| `advisor/stableCouncilService.ts`, `campaignFocusEvaluator.ts` | state / derived-map identity | new input identity |

Coherence contract — all of these are safe only because:

1. `jobQueue` serializes each context's engine work — no concurrent caller
   can observe a partially-built map.
2. The engine never mutates the keyed collections in place: passes return
   `StateImpact`s (`passPurity.test.ts`) and resolution produces a new
   object identity. The residual hazard is a caller doing in-place roster
   mutation on the same state object — it would be served stale entries
   until identity turns; `clearWarriorCache()` is the escape hatch (tests
   call it in cleanup).

`moduleCacheRegistry.test.ts` forces every module-level mutable under
`src/engine` to be registered with a context-safety rationale.
