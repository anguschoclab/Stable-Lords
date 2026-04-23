---
name: combat-sim
description: Run targeted combat engine tests for Stable Lords. Accepts an optional filter to scope to a specific subsystem.
disable-model-invocation: true
---

# combat-sim

Runs the Stable Lords combat test suite via `bun test` (Vitest).

## Usage

```
/combat-sim [filter]
```

## Test Groups

| Filter keyword | What it targets |
|----------------|----------------|
| (none) | All combat-related tests |
| `resolution` | src/test/engine/combat/resolution.test.ts |
| `damage` | src/test/engine/combatDamage.test.ts |
| `fatigue` | src/test/engine/combatFatigue.test.ts |
| `distance` | src/test/engine/combat/distanceResolution.test.ts |
| `exchange` | src/test/engine/combat/exchangeSubPhases.test.ts |
| `math` | src/test/engine/combat/combatMath.test.ts |
| `determinism` | src/test/engine/determinism.test.ts |
| `bout` | src/test/engine/boutProcessor.test.ts |
| `simulate` | src/test/simulate.test.ts |
| `balance` | src/test/balance.test.ts |
| `hardening` | src/test/simulation_hardening.test.ts |
| `narrator` | src/test/engine/narrative/combatNarrator.test.ts + boutNarrator.test.ts |
| `factory` | src/test/engine/factories/combatFactory.test.ts |

## Commands

**Run all combat tests:**
```bash
bun run test --reporter=verbose src/test/combat.test.ts src/test/simulate.test.ts src/test/engine/combat/ src/test/engine/combatDamage.test.ts src/test/engine/combatFatigue.test.ts src/test/engine/boutProcessor.test.ts src/test/engine/determinism.test.ts
```

**Run with a filter (e.g. /combat-sim resolution):**
```bash
bun run test --reporter=verbose -- <filter>
```

**Run balance + hardening (regression check):**
```bash
bun run test --reporter=verbose src/test/balance.test.ts src/test/simulation_hardening.test.ts
```

**Run determinism check only:**
```bash
bun run test --reporter=verbose src/test/engine/determinism.test.ts
```

## Notes

- Test timeout is 30s (set in vitest.config.ts) — simulation_hardening.test.ts may be slow
- All tests run in jsdom environment with `@/` aliased to `src/`
- If a test involves RNG, check determinism.test.ts first — non-deterministic failures there indicate a seeding regression
