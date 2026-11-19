---
name: stable-management
description: Work on stable management systems — treasury/ledger, roster, trainers & facilities, promoters & bout offers, scouting/draft recruitment, rival stables. Use whenever changing anything that affects a stable's money, roster size, fame/reputation, facilities, or staffing — maps every subsystem, the slice vs pipeline-vs-worker split, the constants files, and the traps (weekly money flow lives in pipeline passes not the economy slice; bankruptcy/rescue rules in engine constants).
---

# Stable Management Domain

The player's stable is split across **store slices** (synchronous state the UI
mutates) and **engine subsystems** (the weekly economy the pipeline ticks).
Changing a money/roster mechanic means knowing which side owns it.

## State & money flow

- **Slice side:** `economySlice` (`src/state/slices/economySlice.ts`) holds
  `treasury`, `ledger[]`, `fame`, `popularity`, `promoters`, `boutOffers`,
  `realmRankings`, `awards`, `rosterBonus`. `addFunds`/`deductFunds` are the
  only canonical ledger writes — `deductFunds` refuses via `canTransact`
  (`src/engine/economy/utils.ts`) so overdrafts bounce instead of corrupting.
- **Engine side:** `src/engine/economy/` — `weeklyBreakdown.ts` computes the
  income/expense breakdown (UI must bind to it, never hand-sum), `utils.ts`
  transaction guards.
- **Weekly tick:** money actually moves in pipeline passes — `EconomyPass` and
  friends under `src/engine/pipeline/passes/` (see `week-pipeline`). The slice
  records results; the passes _decide_ them. New "every week" economy logic is
  a pass, not a slice action.
- **Constants:** `src/constants/economy/economy.ts` — `STARTING_TREASURY` (500),
  `FIGHT_PURSE`, `WIN_BONUS`, `FAME_DIVIDEND`, `WARRIOR_UPKEEP_BASE`,
  `FAME_UPKEEP_MULTIPLIER`, `TRAINING_COST`, `SCOUT_COST`,
  `BANKRUPTCY_THRESHOLD` (−500), `BANKRUPTCY_GRACE_WEEKS` (13),
  `MIN_BANKRUPTCY_ROSTER`, `DEBT_FLOOR`. Plus `roster.ts` sibling.

## Subsystems

| Domain                 | Lives in                                                                                                                                                                                                                                     | Notes                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Roster & warriors      | `rosterSlice` (`src/state/slices/rosterSlice/`); `src/engine/warrior/` (`skillCalc`, `potential`, `progression`, `retirement`, `health`, `warriorValue`)                                                                                     | roster moves are slice actions; lifecycle rules are engine                                                   |
| Stable identity        | `src/engine/stable/stableReputation.ts`                                                                                                                                                                                                      | reputation math                                                                                              |
| Trainers & facilities  | `src/engine/trainers/` (`trainers.ts`, `trainerSpecialties.ts`, `trainerAging.ts`), `src/engine/training/facilityUpkeep.ts`, `src/engine/training/coachLogic.ts`                                                                             | upkeep scales with facility level + trainer count; `src/constants/training/`                                 |
| Promoters & offers     | `src/engine/promoters/` (`offerMatchmaking`, `hypeCalculator`, `promoterGenerator`, `promoterHistory`, `warriorFilters`), `src/engine/pipeline/passes/PromoterPass.ts`                                                                       | offer lifecycle → `bout/mutations/contractMutations.ts` (accept/decline/counter; void-decline tags)          |
| Recruitment & scouting | `src/engine/recruitment/` (`draftService.ts`, `signWarrior.ts`, `recruitScouting.ts`), `src/engine/scouting/`                                                                                                                                | pool cap 36, weekly partial refresh, meta-aware style bias, legacy bloodlines, `src/constants/recruitment/`  |
| Rivals & AI            | `src/engine/rivals/` (`rivalStableFactory`, `rivalWarriorFactory`, `rivalTrainerFactory`), `src/engine/ai/` (`intentEngine/`, `workers/`, `stableManager.ts`, `bankruptcyService.ts`, `expansionService.ts`, `seasonalRetirementService.ts`) | 7 intents; skeptical-memory + hierarchical delegation; `src/constants/world.ts` rival population floors/caps |
| Owner flavor           | `src/engine/owner/` (grudges, philosophy, narrative, roster)                                                                                                                                                                                 | owner persona feeding AI decisions                                                                           |

## Player actions touching this domain

Slice actions per `add-player-action`: offer responses (`respondToBoutOffer`),
challenge/avoid marks (`playerActions`), naming. Anything that must resolve
_every week_ belongs in a pipeline pass, not an action.

## Verification

- `bun run oracle:daily` — the 1000-week economy/balance report
  (`docs/reports/daily-balance-report.md`) tracks treasury inflation,
  bankruptcy churn, upkeep drift. Watch the floors: treasury >100k inflating →
  raise `WARRIOR_UPKEEP_BASE` or lower `FIGHT_PURSE` (per `economy-balance`).
- Tests: `src/test/engine/economy/` (incl. `balance.slow.test.ts`),
  `src/test/engine/ai/` (see `ai-agent` skill), `src/test/engine/recruitment*`,
  `src/test/engine/scouting*`, `src/test/engine/draftService*`.
- Intentional AI/player asymmetries (`AI_TRAINING_EFFECTIVENESS` etc.) are
  adjudicated house rules — `docs/MEGAPLAN_BACKLOG.md` §3; don't "fix" them.
