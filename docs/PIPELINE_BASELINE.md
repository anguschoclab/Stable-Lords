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
| Fresh-state 13-week `advanceQuarter` (headless)           | `pipeline.perf.slow.test.ts`          | gated <20 s (catastrophic-regression ceiling, not a benchmark; ~1.43 s/wk at the 160-stable band ⇒ ~18.6 s worst case) |
| 52-week autosim (large week count)                        | `pipeline.perf.slow.test.ts`          | ~17 s isolated / ~26 s under suite load (~330–500 ms/wk) |
| Batch memory growth                                       | `pipeline.perf.slow.test.ts`          | within gate        |
| `advanceYear` ≡ 52× `advanceWeek`                         | `weekDeterminism.slow.test.ts`        | ~1.7 s, equivalent |
| Same-seed determinism (SimPulse + rivals hash)            | `sim/determinism.slow.test.ts`        | identical, ~4 s    |
| Living-world week, 90-stable band (headless advanceWeek)  | `pipeline.perf.slow.test.ts`          | ~630 ms/week (re-measured; ~566 prior) |
| Living-world week, 160-stable band (headless advanceWeek) | `pipeline.perf.slow.test.ts`          | ~1,430 ms/week (re-measured; ~1,378 prior) |

## Harness soak baseline (A2 re-measure, telemetry-provider profiling)

Measured via `bun run scripts/soak.mjs --weeks 40 --profile --invariants 5`
(Bun, headless, seed 20260919, idle machine — earlier figures of ~2,800
ms/wk were measured while a concurrent test suite saturated the box).
Harness ms/week includes archive drain, pulse logging, and tracker overhead
that the bare `advanceWeek` perf rows above exclude — do not compare them
directly.

| Config                        | ms/week | invariants |
| ----------------------------- | ------- | ---------- |
| week-mode (weekly advance)    | 292.7   | 0          |
| day-mode (`--day-mode`, seven `advanceDay` ticks per week) | 303.1 | 0 |

Day-mode costs ~+4% over week-mode — the seven day ticks are cheap and the
weekly pipeline on day 7 dominates either way.

Per-pass profile (40 weeks, total ms — telemetry `pipeline_pass_timing`
events folded by the harness provider):

| pass              | stage   | total ms | avg ms/wk | share |
| ----------------- | ------- | -------- | --------- | ----- |
| rivalStrategy     | world   | 6,604    | 165       | ~56%  |
| promoter          | world   | 1,098    | 27.5      | ~9%   |
| arenaChampionship | world   | 241      | 6.0       | ~2%   |
| all others        | —       | <52 each  | <1.3     | ~33%  |

### B3 hot-path optimization outcome (post-optimization A/B)

CPU profiling (`bun --cpu-prof`) identified the dominant rival-strategy
internals: per-pair O(F) head-to-head scans (`getHeadToHeadRecord`,
~405 ms/20wk), per-bout `underservedWeights` history scans (~246 ms/20wk),
and `STYLE_ORDER.indexOf` inside `getMatchupBonus` (~115 ms/20wk). Fixes
shipped:

- `headToHead.ts` — one-pass directional pair index per `arenaHistory`
  identity (O(F) once, O(1) per pair); equivalence tested pair-by-pair.
- `arenaFit.ts` — `underservedByHistory` WeakMap memo per (history, week).
- `combat/matchup.ts` — `STYLE_INDEX` map replaces `indexOf` scans.
- `boutBidding/generation.ts` — hoisted per-warrior `aStableId` out of the
  opponent loop; `computeMetaDrift` and the `generatePairings` UI preview
  were inspected and are NOT real hotspots — left alone.

A/B soak, same seed, idle machine, `--weeks 20`:

| Code           | ms/week | final state         |
| -------------- | ------- | ------------------- |
| pre-B3         | 359.8   | reference           |
| post-B3        | 281.3   | **byte-identical**  |

≈22% faster with provably unchanged output. Post-change CPU profile no
longer shows `getHeadToHeadRecord` or `underservedWeights`; the remaining
`scorePairwiseMatchup` self-time is the inherent O(roster × world) opponent
scan in `bestMatchupModifier`.

Heap check (40-wk soak, `Bun.gc(true)` samples every 5 wk): heap grows
~1.5 MB/wk tracking `arenaHistory` accumulation (append-only by design);
post-run full GC returns to ~43 MB — no leak signature.

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
pool=1 15,630 ms vs pool=4 47,546 ms → **0.33×, FAIL**. (A prior same-day
pair, 17,946/49,058 → 0.37×, concurs; a still-earlier 1.51× report was
contaminated by a concurrent full-test-suite run inflating the sequential
leg — always run the gate on an idle machine.)
Determinism leg passes (`parallelDeterminism.slow`, pool 1 vs 4 byte-identical);
the wall-clock leg remains the blocker. Full history in
`docs/PIPELINE_PARALLELISM.md`.
