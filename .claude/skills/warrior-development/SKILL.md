---
name: warrior-development
description: Work on warrior growth systems — training gains, skill drilling, attribute training, injuries/recovery, learning & burn, aging, potential caps, favorites/weapon mastery. Use whenever touching stat growth, src/engine/training/, src/engine/injuries/, src/engine/learning/, src/engine/aging/, potential.ts, favorites, or per-warrior progression — maps services, the learn/burn canon caps, constants files, and the traps (skillCalc is combat-balance territory; growth ticks are pipeline passes; AI asymmetry is intentional).
---

# Warrior Development Domain

Warriors grow through **weekly pipeline passes** (training ticks during week
advancement — see `week-pipeline`), not through direct mutation. This map
covers the services a growth mechanic plugs into.

## Subsystems

| Concern | Lives in | Notes |
|---------|----------|-------|
| Training gains | `src/engine/training/trainingGains/` (`attributeTraining.ts`, `skillDrilling.ts`, `traitTraining.ts`, `traitCapacity.ts`, `injuryAndRecovery.ts`) | gains vs injury trade-off; weather-sensitive risk; assignments cleared after processing each week |
| Coach & facilities | `src/engine/training/coachLogic.ts`, `burnAnalysis.ts`, `trainingImpact.ts`, `facilityUpkeep.ts` | healing bonuses scale with trainer tier/specialties; upkeep scales with level + count |
| Injuries & health | `src/engine/injuries/injurySystem.ts`, `src/engine/warrior/health.ts`, `src/engine/warrior/condition.ts` | injury rolls, recovery progression, condition state |
| Learning & burn | `src/engine/learning/learnRoll.ts`, `skillBurn.ts` | post-bout learn rolls → skill bumps; burn = over-training damage |
| Aging | `src/engine/aging/agingSystem.ts`, `veteranCompensation.ts`; `src/constants/aging/aging.ts` | decline curves + veteran compensation |
| Potential & caps | `src/engine/warrior/potential.ts`, `ATTRIBUTE_MAX = 25` (`src/types/shared/attributes.ts:40`), `src/constants/training/training.ts` (`ATTRIBUTE_TOTAL_CAP = 80`, `SKILL_MAX_DEFAULT = 20`, `SEASONAL_GAINS`) | hard caps block training; near-ceiling buffer exists |
| Favorites | `src/engine/favorites/favorites.ts`, `weaponMastery.ts` | discovered weapon affinities / bio-rhythms / learn affinities; **rhythm is always-on** (adjudicated house rule — applies whether or not discovered, BACKLOG §3) |
| Skill calc | `src/engine/warrior/skillCalc.ts`, `skillBreakpoints.ts` | raw attributes → combat skills. **Tuning this is `combat-balance` territory** — STYLE_PENALTIES / STYLE_SKILL_FLOORS have their own guardrails |

## Canon constants (do not rebalance)

`src/constants/combat/combat/learn.ts`: `LEARN_ATTEMPTS = 6`,
`LEARN_WT_FACTOR = 0.04`, `LEARN_FAVORITE_WEIGHT = 6`,
`LEARN_PER_SKILL_CAP = 20`, `LEARN_CAREER_CAP = 120`, `LEARN_SUSPECT_MIN = 3`.
The learn caps are adjudicated canon literals (house divergence register,
`docs/MEGAPLAN_BACKLOG.md` §3) — changes there are canon decisions, not tuning.

## Traps

- **AI vs player asymmetry is intentional** — `AI_TRAINING_EFFECTIVENESS` and
  friends are registered house divergences (BACKLOG §3); don't "fix" them.
- **`derivedStats.hp` is max HP**, not a health percentage — a recurring
  wrong-meaning bug class (see `combat-balance`).
- **Growth lives in passes** — a "training runs weekly" change is a
  `WeekPassSpec` edit or a new pass, not a slice action (`add-player-action`).
- **Determinism** — learn rolls and injury rolls consume seeded rng; a new
  unconditional draw shifts every downstream pick (`determinism-debug`).

## Verification

- Tests: `src/test/engine/training/` (trainingGains, coachLogic,
  facilityUpkeep, traitCapacity/traitTraining), `src/test/engine/injuries*`,
  `src/test/engine/learning/` (`learnCapAndBurn.canon.test.ts` pins the caps),
  `src/test/engine/aging/` — see the `training-coach` runner skill.
- Balance read: `bun run oracle:daily` (growth feeds meta drift);
  `scripts/style-probe.ts` for effective-skill reality before touching gains.
