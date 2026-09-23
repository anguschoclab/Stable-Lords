# Pipeline Baseline — Benchmarks & Targets

Baseline-then-target methodology: every optimization must show a measured win
against these baselines before it ships. Numbers are from the vitest slow suite
(`bun run test:slow`) on the reference dev machine; re-measure on any hardware
change.

## How to measure

```bash
bun run test:slow        # perf gates + determinism + long-run liveness
bun x vitest run src/test/perf/pipeline.perf.slow.test.ts
bun x vitest run src/test/perf/rivalStrategyPass.perf.slow.test.ts
```

## Current measured values (post-refactor)

| Benchmark | Source | Measured |
| --- | --- | --- |
| Populated-world week tick (`RivalStrategyPass` dominant) | `rivalStrategyPass.perf.slow.test.ts` | ~67 ms |
| 52-week autosim (large week count) | `pipeline.perf.slow.test.ts` | ~480 ms |
| Batch memory growth | `pipeline.perf.slow.test.ts` | within gate |
| `advanceYear` ≡ 52× `advanceWeek` | `determinism.slow.test.ts` | ~1.7 s, equivalent |
| Same-seed determinism (SimPulse + rivals hash) | `sim/determinism.slow.test.ts` | identical, ~4 s |

## Structural costs removed by the refactor

- One `structuredClone` per week on owned chains (autosim weeks 2+, quarters 2+,
  worker entry) via `mutableInput`.
- Computed caches (`warriorMap`, `rivalMap`, `rivalryMap`, `grudgeMap`,
  `warriorToOfferIds`) no longer cross the worker boundary — stripped by
  `stripNonSerializable`, rebuilt by `buildWeekCaches`.
- Deferred bout logs drain weekly into `pendingArchives` during batch runs —
  bounded memory instead of accumulating in state.
- Zero worker spawns at module import (lazy proxies).

## Parallelism gate

True parallelism (rival/bout sharding on a worker pool) ships only if ALL hold:

1. ≥30% wall-clock improvement on 52-week autosim vs the baseline above.
2. Byte-identical deterministic output vs sequential execution (same seed).
3. No regression on the populated-world week tick.

Until then the shipped configuration is `poolSize = 1` (serialized, deterministic).
