# Pipeline Parallelism — Phase 4 Findings

Status: **measured, ship gate FAILED — `poolSize=1` remains the default.**
Benchmark harness: `bun run scripts/parallel-bench.mjs [--weeks N] [--pool N]`.

## Architecture (implemented, opt-in)

- `src/engine/pool/enginePool.ts` — lazy `EnginePool` (`size`, `mapRivalShards`,
  `mapBoutShards`, `terminate`). Shared registry: `configureEnginePool(n)` /
  `getEnginePool()` / `shutdownEnginePool()`. `size <= 1`, missing `Worker`,
  spawn failure, or `terminate()` all degrade to the same shard functions
  running in-line — identical output by construction.
- `src/engine/pool/shardWorker.ts` — module worker entry exposing the two
  chunk functions through Comlink.
- `src/engine/pipeline/passes/rivalStableShard.ts` — extracted per-rival
  strategy computation (`processRivalStable`, `runRivalShardChunk`), seeded
  `absoluteWeek * 31 + index * 997 + owner.id.length` — independent of chunk
  assignment. `RivalStrategyPass` merges shard outputs in original stable order.
- Bout sharding — `processBoutShard` / `runBoutShardChunk` in `enginePool.ts`;
  pairings computed centrally in `boutProcessorService`, `resolveBout` is
  position-seeded (`hashStr(week|aId|dId)`), impacts merge in pairing order.
- Event transport — `engineEventBus` emissions can't cross a worker boundary;
  `collectBoutEvents` (`pool/shardTypes.ts`) captures per-chunk emissions and
  the coordinator re-emits in pairing order.
- Async pipeline — `WeekPassSpec.run` may return `Promise<StateImpact>`;
  stages stay sequential (only intra-pass sharding parallelizes). Sync
  callers are unaffected via overloads.
- Pool propagation — `advanceWeek` picks up `getEnginePool()` when
  configured > 1; `WeekAdvanceOptions.pool`, `AutosimOptions.pool`, and
  `AdvanceOptions.pool` allow explicit injection (tests).

## Determinism — verified

`src/test/engine/pipeline/parallelDeterminism.slow.test.ts` runs 8 weeks with
pool sizes 1 vs 4 through an in-process worker that structured-clones inputs
and outputs (faithfully reproducing the postMessage boundary). Final state
hashes and engine event streams are identical.

Getting there required fixing three real aliasing bugs that structured
cloning exposed — all would have been latent races under any shared-memory
execution too:

1. **Dossier aliasing** (`intelDossier.ts`): `decayDossiers` returned shared
   dossier objects (stale=0) and shallow copies sharing `knownStyles` /
   `recordVs`; `updateDossiers` mutated them in place, leaking cross-week
   writes into `state.rivals`. Now copy-on-write.
2. **Bout roster read-back** (`boutResolution.ts`): the `lastBoutWeek` rival
   roster rebuild read `state.rivals[].roster`, silently depending on
   `checkDiscovery`'s in-place favorites mutation being visible through
   shared references; shard clones lost it. Roster entries are now built
   from the validated combatants, plus `stitchCombatantMutations` replays
   each bout's post-resolution combatant into the merged roster updates
   (last-writer-wins `roster` partials otherwise drop earlier bouts).
3. **Graveyard aliasing** (`mortalityHandler.ts`): `graveyardEntry = {...victim}`
   shared `favorites` with the still-live roster object; post-death
   `checkDiscovery` writes (rival victims stay addressable via stale roster
   rebuilds) leaked into the memorial. The entry is now a `structuredClone`
   snapshot at time of death.
4. **Unseeded ids** (`rivalWarriorFactory.ts`): `rngWrapper.uuid` called
   `crypto.randomUUID()`; generated warriors got non-deterministic ids that
   perturb every downstream `hashStr` bout seed. Now delegates to the seeded
   rng.

## Ship gate — FAILED (as designed)

Measured on this machine (Bun, real module workers, headless harness,
seed 20260919, 26 weeks):

| run | wall-clock |
|-----|-----------|
| pool=1 (sequential) | 2,902 ms |
| pool=4 (distributed) | 7,593 ms |
| **speedup** | **0.38× — gate requires ≥1.30×** |

`structuredClone` of the full `GameState` per chunk costs far more than the
rival-strategy/bout-resolution compute it displaces — the shard workloads
(tens of ms per week across all stables/bouts) cannot amortize ~ms-scale
serializations of a multi-MB state graph per chunk per week.

**Decision:** machinery ships opt-in (`configureEnginePool`), default stays
`poolSize=1`. The pool is still useful if a future profile shows shard
compute growing much faster than state size, or if inputs are narrowed to
per-shard state slices rather than full state.

## SAB/Atomics evaluation — rejected for now

SharedArrayBuffer could eliminate clone cost, but:

- Requires COOP/COEP headers (`cross-origin-isolated`) — achievable in
  Electron via `webPreferences`/`session` headers, but it changes embedding
  constraints for every renderer and any remote content.
- Our payloads are rich object graphs (nested records, Maps, string ids) —
  SAB only shares raw bytes; we'd need a full struct-of-arrays or
  marshalling layer (e.g. flatbuffers-style) for `GameState`, `Warrior`,
  `RivalStableData` — a rewrite of the data model, not an optimization.
- Atomics-based handoff would serialize access anyway, and the bottleneck is
  marshalling size, not contention.

Revisit only if (a) per-shard inputs shrink to small serializable slices,
or (b) a shared-memory state representation lands for other reasons.

## Reproduction

```bash
bun run scripts/parallel-bench.mjs --weeks 52 --pool 4   # ship gate
bun run scripts/soak.mjs --weeks 40 --profile --invariants 5
bun x vitest run --config vitest.config.slow.ts \
  src/test/engine/pipeline/parallelDeterminism.slow.test.ts
```
