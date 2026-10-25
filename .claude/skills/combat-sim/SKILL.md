---
name: combat-sim
description: Run the Stable Lords combat test suite (resolution, damage, fatigue, simulation, determinism) via bun test (Vitest).
disable-model-invocation: true
---

# combat-sim

Runs the Stable Lords combat test suite via `bun test` (Vitest).

## Usage

```
/combat-sim [filter]
```

## Test Groups

| Filter keyword | What it targets                                                         |
| -------------- | ----------------------------------------------------------------------- |
| (none)         | All combat-related tests                                                |
| `resolution`   | src/test/engine/combat/resolution.test.ts + resolution/ dir             |
| `damage`       | src/test/engine/combat/mechanics/combatDamage.test.ts + damageCalc.test.ts |
| `fatigue`      | src/test/engine/combat/mechanics/combatFatigue.test.ts                  |
| `distance`     | src/test/engine/combat/distanceResolution.test.ts                       |
| `exchange`     | src/test/engine/combat/exchangeSubPhases.test.ts                        |
| `math`         | src/test/engine/combat/mechanics/combatMath.test.ts                     |
| `determinism`  | src/test/engine/determinismAudit.test.ts + combat/resolutionDeterminism.test.ts |
| `bout`         | src/test/engine/bout/boutProcessor.test.ts + boutProcessorService.test.ts |
| `simulate`     | src/test/engine/combat/simulate.test.ts (+ simulate/ dir, simulateHelpers) |
| `balance`      | src/test/engine/balance/traitNoise.test.ts + constants/balanceConstantBounds.test.ts + combat/styleMatchupSymmetry.test.ts + combat/traitMultiplierStacking.test.ts |
| `hardening`    | src/test/engine/combat/simulation_hardening.slow.test.ts (SLOW tier)    |
| `narrator`     | src/test/engine/narrative/combatNarrators.test.ts + combat/narrator.test.ts |
| `factory`      | src/test/engine/factories/ (warriorFactory, gameStateFactory — no combatFactory) |

## Commands

**Run all combat tests (fast tier):**

```bash
bun run test --reporter=verbose src/test/engine/combat/ src/test/engine/bout/boutProcessor.test.ts src/test/engine/bout/boutProcessorService.test.ts src/test/engine/determinismAudit.test.ts src/test/engine/narrative/combatNarrators.test.ts
```

**Run with a filter (e.g. /combat-sim resolution):**

```bash
bun run test --reporter=verbose -- <filter>
```

**Run balance checks (fast tier):**

```bash
bun run test --reporter=verbose src/test/engine/balance/traitNoise.test.ts src/test/constants/balanceConstantBounds.test.ts src/test/engine/combat/styleMatchupSymmetry.test.ts src/test/engine/combat/traitMultiplierStacking.test.ts
```

**Run hardening + slow balance (slow tier, nightly CI gate):**

```bash
bun run test:slow src/test/engine/combat/simulation_hardening.slow.test.ts src/test/engine/combat/styleWinConditions.slow.test.ts src/test/engine/combat/traitBalance.slow.test.ts src/test/engine/economy/balance.slow.test.ts
```

**Run determinism check only:**

```bash
bun run test --reporter=verbose src/test/engine/determinismAudit.test.ts src/test/engine/combat/resolutionDeterminism.test.ts
```

## Notes

- Test timeout is 30s (set in vitest.config.ts)
- `*.slow.test.ts` files are excluded from `bun run test` — use `bun run test:slow <path>` (vitest.config.slow.ts) for simulation_hardening, styleWinConditions, traitBalance, and economy/balance
- All tests run in jsdom environment with `@/` aliased to `src/`
- If a test involves RNG, check determinismAudit.test.ts first — non-deterministic failures there indicate a seeding regression
- Combat mechanics live under src/test/engine/combat/mechanics/; bout lifecycle under src/test/engine/bout/
