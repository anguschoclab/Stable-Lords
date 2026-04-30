---
name: training-coach
description: Run training system tests for attribute/skill gains, injury risks, facility upgrades, and coach bonuses.
disable-model-invocation: true
---

# training-coach

Tests the training system including training gains, injury risks, coach logic, facility upkeep, and seasonal growth mechanics.

## Usage

```
/training-coach [filter]
```

## Test Groups

| Filter keyword | What it targets |
|----------------|----------------|
| (none) | All training system tests |
| gains | src/test/engine/training/trainingGains.test.ts |
| injuries | src/test/engine/injuries.test.ts |
| facility | src/test/engine/training/facilityUpkeep.test.ts |
| coach | src/test/engine/training/coachLogic.test.ts |
| training | src/test/engine/training.test.ts |
| trainers | src/test/engine/trainers.test.ts |
| trainerSpecialties | src/test/engine/trainerSpecialties.test.ts |

## Commands

**Run all training tests:**
```bash
bun run test --reporter=verbose src/test/engine/training/ src/test/engine/training.test.ts src/test/engine/trainers.test.ts src/test/engine/trainerSpecialties.test.ts src/test/engine/injuries.test.ts
```

**Run with a filter (e.g. /training-coach gains):**
```bash
bun run test --reporter=verbose -- <filter>
```

**Run training gains tests:**
```bash
bun run test --reporter=verbose src/test/engine/training/trainingGains.test.ts
```

**Run coach logic tests:**
```bash
bun run test --reporter=verbose src/test/engine/training/coachLogic.test.ts
```

**Run facility upkeep tests:**
```bash
bun run test --reporter=verbose src/test/engine/training/facilityUpkeep.test.ts
```

**Run injury tests:**
```bash
bun run test --reporter=verbose src/test/engine/injuries.test.ts
```

## Notes

- Training gains system handles attribute training, skill drilling, and recovery modes
- Injury risk varies by training type and weather conditions (rainy increases risk)
- Coach logic provides healing bonuses based on trainer tier and specialties
- Facility upkeep costs scale with facility level and trainer count
- Seasonal growth tracks attribute/skill gains over a season for progression
- Training can be blocked by hard caps (max attribute values reached)
- Training assignments are cleared after processing each week
- Test timeout is 30s (set in vitest.config.ts)
