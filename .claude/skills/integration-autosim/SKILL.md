---
name: integration-autosim
description: Run integration tests for autosimulation including sequential/batch advancement, stop conditions, and determinism verification.
disable-model-invocation: true
---

# integration-autosim

Tests end-to-end autosimulation including week advancement, stop conditions, determinism, and bankruptcy detection.

## Usage

```
/integration-autosim [filter]
```

## Test Groups

| Filter keyword | What it targets                                    |
| -------------- | -------------------------------------------------- |
| (none)         | Full integration suite (slow tier)                 |
| determinism    | src/test/engine/determinismAudit.test.ts (+ sim/determinism.slow.test.ts) |
| long           | Long simulation (100 weeks)                        |
| autosim        | src/test/integration/autosim.slow.test.ts + src/test/engine/autosim/ |
| week           | src/test/integration/weekAdvancement.slow.test.ts + src/test/engine/weekPipeline.test.ts |
| smoke          | src/test/integration/autosim.slow.test.ts + weekAdvancement.slow.test.ts (SLOW tier) |

## Commands

**Run full integration test (slow tier):**

```bash
bun run test:slow src/test/integration/autosim.slow.test.ts src/test/integration/weekAdvancement.slow.test.ts src/test/integration/livingWorld.slow.test.ts src/test/integration/worldLiveness.slow.test.ts
```

**Run with a filter (e.g. /integration-autosim autosim):**

```bash
bun run test --reporter=verbose -- <filter>
```

**Run determinism check:**

```bash
bun run test --reporter=verbose src/test/engine/determinismAudit.test.ts
bun run test:slow src/test/engine/sim/determinism.slow.test.ts
```

**Run autosim integration tests:**

```bash
bun run test:slow src/test/integration/autosim.slow.test.ts src/test/integration/weekAdvancement.slow.test.ts
bun run test --reporter=verbose src/test/engine/autosim/
```

**Run week advancement tests:**

```bash
bun run test --reporter=verbose src/test/engine/weekPipeline.test.ts src/test/engine/autosim/
bun run test:slow src/test/integration/weekAdvancement.slow.test.ts src/test/integration/championshipAdvanceWeek.slow.test.ts
```

## Notes

- Multi-week simulations are `*.slow.test.ts` — excluded from `bun run test`; use `bun run test:slow <path>` (they gate nightly CI, not every PR)
- Autosim supports both sequential (week-by-week) and batch (quarter) advancement modes
- Stop conditions: roster_empty, no_pairings, bankruptcy (treasury < -500)
- Determinism check runs simulation twice with same seed and verifies identical results
- Bankruptcy detection prevents economic death spiral
- Player bout offers are auto-accepted if Hype > 100 or Purse > 200
- Test timeout is 30s (set in vitest.config.ts)
- All tests run in jsdom environment with `@/` aliased to `src/`
