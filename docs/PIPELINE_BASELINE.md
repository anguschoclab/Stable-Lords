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

| Benchmark                                                 | Source                                | Measured           |
| --------------------------------------------------------- | ------------------------------------- | ------------------ |
| Populated-world week tick (`RivalStrategyPass` dominant)  | `rivalStrategyPass.perf.slow.test.ts` | ~67 ms             |
| 52-week autosim (large week count)                        | `pipeline.perf.slow.test.ts`          | ~17 s isolated / ~26 s under suite load (~330–500 ms/wk) |
| Batch memory growth                                       | `pipeline.perf.slow.test.ts`          | within gate        |
| `advanceYear` ≡ 52× `advanceWeek`                         | `weekDeterminism.slow.test.ts`        | ~1.7 s, equivalent |
| Same-seed determinism (SimPulse + rivals hash)            | `sim/determinism.slow.test.ts`        | identical, ~4 s    |
| Living-world week, 90-stable band (headless advanceWeek)  | `pipeline.perf.slow.test.ts`          | ~566 ms/week       |
| Living-world week, 160-stable band (headless advanceWeek) | `pipeline.perf.slow.test.ts`          | ~1,378 ms/week     |

## Harness soak baseline (A2 re-measure, telemetry-provider profiling)

Measured via `bun run scripts/soak.mjs --weeks 40 --profile --invariants 5`
(Bun, headless, 90-rival band reached ~wk 26, seed 20260919). Harness ms/week
includes archive drain, pulse logging, and tracker overhead that the bare
`advanceWeek` perf rows above exclude — do not compare them directly.

| Config                        | ms/week | invariants |
| ----------------------------- | ------- | ---------- |
| week-mode (weekly advance)    | 2,799   | 0          |
| `--day-mode`                  | 3,109   | 0          |

Per-pass profile (40 weeks, total ms — telemetry `pipeline_pass_timing`
events folded by the harness provider):

| pass              | stage   | total ms | avg ms/wk | share |
| ----------------- | ------- | -------- | --------- | ----- |
| rivalStrategy     | world   | 64,489   | 1,612     | ~58%  |
| promoter          | world   | 11,974   | 299       | ~11%  |
| arenaChampionship | world   | 1,988    | 50        | ~2%   |
| all others        | —       | <410 each | <10      | ~29%  |

`rivalStrategy` remains the dominant week cost by ~5× the next pass — any
further optimization effort should target it (`B3` scope), not the
serial-boundary items.

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

**Gate result (re-measured with narrowed shard ctx, seed 20260919, 52 wk):**
pool=1 17,946 ms vs pool=4 49,058 ms → **0.37×, FAIL**. An earlier same-day
run reported 1.51× but was contaminated by a concurrent full-test-suite run
inflating the sequential leg — always run the gate on an idle machine.
Determinism leg passes (`parallelDeterminism.slow`, pool 1 vs 4 byte-identical);
the wall-clock leg remains the blocker. Full history in
`docs/PIPELINE_PARALLELISM.md`.
