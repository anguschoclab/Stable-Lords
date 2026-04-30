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

| Filter keyword | What it targets |
|----------------|----------------|
| (none) | Full integration test suite (13-week season smoke) |
| determinism | Determinism check (same seed = same result) |
| long | Long simulation (100 weeks) |
| autosim | src/test/integration/autosim.test.ts |
| week | src/test/integration/weekAdvancement.test.ts |
| smoke | scripts/season_smoke.ts (season smoke test) |

## Commands

**Run full integration test (13 weeks):**
```bash
bun scripts/season_smoke.ts
```

**Run with a filter (e.g. /integration-autosim autosim):**
```bash
bun run test --reporter=verbose -- <filter>
```

**Run determinism check:**
```bash
bun run test --reporter=verbose src/test/engine/determinism.test.ts
```

**Run autosim integration tests:**
```bash
bun run test --reporter=verbose src/test/integration/autosim.test.ts src/test/integration/weekAdvancement.test.ts
```

**Run week advancement tests:**
```bash
bun run test --reporter=verbose src/test/advanceWeek.test.ts src/test/engine/weekPipeline.test.ts
```

## Notes

- Season smoke test validates simulation integrity over 13 weeks and determinism
- Autosim supports both sequential (week-by-week) and batch (quarter) advancement modes
- Stop conditions: roster_empty, no_pairings, bankruptcy (treasury < -500)
- Determinism check runs simulation twice with same seed and verifies identical results
- Bankruptcy detection prevents economic death spiral
- Player bout offers are auto-accepted if Hype > 100 or Purse > 200
- Test timeout is 30s (set in vitest.config.ts)
- All tests run in jsdom environment with `@/` aliased to `src/`
