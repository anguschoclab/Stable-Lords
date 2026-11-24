---
name: engine-pool
description: Work on the engine shard pool and persistent shard-state sync — parallel rival-stable chunk execution, stage-boundary state sync with hash-verified healing, and deterministic reduce. Use whenever touching src/engine/pool/, ctx.pool in a pipeline pass, worker/shard dispatch, parallel-bench results, or "pool>1" week advancement — covers the sync stage chain (none→input→weekStart→postCore→weekResult), the heal→broken→in-line fallback, and why shard output order must stay deterministic.
---

# Engine Pool & Shard Sync

The pool (`src/engine/pool/`) parallelizes eligible weekly work — primarily the
rival-stable shard — across worker contexts while the pipeline stays logically
sequential.

## Architecture

- `enginePool.ts` — `EnginePool`, `WeekSyncLedger`, `SyncedShardWorkerApi`.
  Pool exists only when configured size > 1; **passes must treat absent
  `ctx.pool` as "run in-line"** (WeekPipelineContext contract).
- `syncCoordinator.ts` — V15 persistent shard-state sync. Each worker holds a
  replica positioned on the stage chain `none → input → weekStart → postCore →
weekResult`; dispatch replays only the transitions it needs (stage-granular
  deltas, not full-state clones).
- **Hash-verified healing** — stage boundary hashes are captured eagerly into
  the ledger (the state aliases keep mutating, so late hashing would pollute);
  a receipt mismatch heals by sending the full stage state once, and a worker
  that still mismatches is marked `broken` — its chunks fall back in-line.
- `syncedShardState.ts`, `shardWorker.ts`, `shardTypes.ts`, `stateHash.ts` —
  worker-side replica, dispatch surface, and hashing.
- `rivalStableShard/` under `src/engine/pipeline/passes/` — the shard payload:
  deterministic per-chunk rival strategy work reduced in stable order.

## The rules that get you

- **Reduce deterministically.** Shard output must not depend on completion
  order — merge in declared/chunk order. `parallelDeterminism` and
  `shardInputSize` tests gate this; `shardSync.slow.test.ts` pins sync behavior.
- **Never mutate the shared snapshot from a shard.** Same `mutableInput`/
  `passPurity` rules as in-line passes — emit impacts.
- **Hashing is the contract.** If you change what crosses the sync boundary,
  update what the ledger hashes at each stage; a stale hash silently heals
  every week and turns the pool into a clone tax.
- **Pool ≠ worker-proxy.** The `engineProxy` lane (main thread ↔ engine worker)
  is a different boundary governed by `add-player-action`/`v14EntryPoints`;
  the pool lives _inside_ the engine worker's week advance.

## Verify

```bash
bun run test:slow "src/test/engine/pool/shardSync.slow.test.ts" "src/test/engine/pipeline/parallelDeterminism.slow.test.ts"
bun scripts/parallel-bench.mjs   # pool=1 vs pool=N perf gate — idle machine only
```

`week-pipeline` owns the pass contract; `determinism-debug` owns seed/order
regressions; `perf-audit` owns measurement discipline (never compare
contaminated runs).
