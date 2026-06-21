# Hook Map — where a per-style mechanic plugs in

Line numbers drift; trust the **symbols** and confirm with `grep`. Memory note:
if a symbol here no longer exists, the engine moved — re-ground before editing.

## The two balance layers

| What                                 | File                             | Symbol                                                                                                                                                                                                                               |
| ------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Absolute power (per-style level)     | `src/engine/skillCalc.ts`        | `STYLE_PENALTIES` — `[ATT,PAR,DEF,INI,RIP,DEC]` per style; applied in `computeWarriorStats`                                                                                                                                          |
| Matchup matrix (rock-paper-scissors) | `src/constants/combat/combat.ts` | `MATCHUP_MATRIX`, `getMatchupBonus(att, def)`, `findAntisymmetryViolations(tol)`, `STYLE_ORDER`                                                                                                                                      |
| All tunable magnitudes               | `src/constants/combat/combat.ts` | constants live here (e.g. `ABSOLUTE_POWER_LOW/HIGH`, `MIRROR_MATCH_BAND`, `BA_PARDEGRADE_*`, `SL_BLEED_*`, `ST_*`, `PR_*`, `PS_COUNTERSTRIKE_ATT`, `WS_ATTRITION_FLOOR`, `LU_MOMENTUM_DMG_COEFF`, `CRIT_DAMAGE_MULT`, `KNOCKDOWN_*`) |

`getMatchupBonus` is also consumed by `src/engine/matchmaking/schedulingAssistant.ts`
and `src/engine/narrative/fightAnalysis.ts` — changing the matrix can break their
tests. Run the full suite.

## The validation harness

| What                                                           | File                                                                                           |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Guardrail tests (antisymmetry, mirror, 40–60% band, kill-rate) | `src/test/engine/economy/balance.test.ts`                                                      |
| Live headless sim                                              | `src/scripts/simulation-harness.ts`, `src/scripts/daily_oracle.ts` → `Daily_Balance_Report.md` |
| Per-style rollups                                              | `src/engine/stats/styleRollups.ts`, `simulationMetrics.ts`                                     |

The balance test builds `styleWins`/`styleFights`/`matchupWins` once with identical
`STD_ATTRS`. The mirror cell `matchupWins[s][s]/FIGHTS_PER_MATCHUP` is A-side bias;
`styleWins[s]/styleFights[s]` is absolute power.

## FighterState (per-fight mutable object)

- **Type:** `src/engine/combat/resolution/types.ts` → `interface FighterState`.
- **Built/initialised:** `src/engine/bout/fighterState.ts` (the returned object literal — add your field's default here too).
- **Precedents:** `momentum` (−3..3, tempo), `survivalStrike` (one-exchange flag),
  `counterstrikePrimed` (PS), `parDegrade` (BA), `riposteStreak` (PR), `bleedStacks` (SL).

## The damage pipeline — `executeHit`

`src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts`, function
`executeHit` (the **landed-hit** path; called from `resolution.ts` only when the
defender's defense fails). Order of the pipeline, with the style hooks already in place:

1. `rollHitLocation(...)` → **AB** shifts location one step toward higher severity.
2. `computeHitDamage(...)` → `preArmor`. **LU** adds momentum damage via
   `getMomentumDamageBonus(...)`; **BA** accumulates `parDegrade` on the defender
   via `accumulateGuardBreak`; **WS** adds `getWsAttritionBonus`; **SL** applies
   bleed via `accumulateBleed`.
3. `applyArmorTypeMod(...)` → `postArmor`. **AB** bypasses a DF-scaled fraction of
   mitigation (`AB_ARMOR_BYPASS_*`).
4. weather / commit multipliers. **ST** front-load (`getFrontloadMult(style,
ctx.exchange)`) and **ST** execute (`getExecuteBonus`) apply here, before crit.
5. **Crit:** `effectiveCritChance = attPassive.critChance + getStCritChanceBonus(...)`;
   damage `× (CRIT_DAMAGE_MULT + getStCritDamageBonus(...))`.
6. `defender.hp -= damage`.
7. **Knockdown:** fires only if the defender _survives_ (`hp > 0`),
   `hpRatioAfterHit < KNOCKDOWN_HP_RATIO` (0.4), and `damageRatio >=
KNOCKDOWN_DAMAGE_RATIO` (0.12). Note: anything that makes a style lethal enough
   to _kill_ a low-HP defender removes its knockdowns (this broke a narration test).

Pure helpers used here live in `src/engine/combat/resolution/`: `tempoMechanics.ts`
(LU/WS), `guardBreak.ts` (BA), `strikingAttack.ts` (ST), `bleed.ts` (SL).

## Riposte bonuses — `styleRiposteBonus`

`src/engine/combat/resolution/resolution.ts`, **exported** `styleRiposteBonus(def,
att, opts?)` returns `{ ripBonus, dmgBonus }`. It centralises per-style riposte
math (unit-test it directly):

- **TP** fatigue-exploit: scales with `att.endurance / att.maxEndurance`.
- **PL** momentum-riposte: `def.momentum`, **negated when `att.style === WallOfSteel`**.
- **PR** riposte-master: `opts.afterParry` (counter-on-parry), `opts.attCommitLevel`
  (punish-commitment ladder), `opts.riposteStreak` (light chain).

Called at two sites in `resolution.ts`: the **whiff** path (`resolveWhiffRiposte`,
`afterParry:false`) and the **parry** path (`resolveContestedDefense`,
`afterParry:true`). `def.riposteStreak` is updated (PR-gated) at both.

## Other wiring sites in `resolution.ts`

| Hook                   | Where                                                                                                                | Used by                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Per-exchange tick      | `resolveExchange(ctx, fA, fD)` — just before `return events`                                                         | **SL** bleed `tickBleed` (damage both fighters, decay, push a `cause:'BLEED'` event) |
| Attack check (ATT sum) | the `performAttackCheck(...)` call site                                                                              | **PS** counterstrike ATT (consumed + flag cleared here, on the attempt)              |
| Parry-success branch   | `resolveContestedDefense`, `if (defCheck.success) … if (!isDodge)`                                                   | **PS** sets `counterstrikePrimed`; momentum step lives here too                      |
| Defense penalty        | `extraDefPenalty` expression → `performDefenseCheck` (subtracted from **both** parry and dodge in `defenseCheck.ts`) | **BA** folds `def.parDegrade` here                                                   |
| Commit level           | `runCommit` → `CommitResult.level` (`exchangeSubPhases.ts`); threaded onto `OffenseDefenseCtx.attCommit`             | **PR** punish-commitment                                                             |
| Tempo counter          | `momentum` feeds INI `× 2`; steps on parry/whiff (clamped −3..3)                                                     | LU/PL payoffs read it                                                                |

## The main fight loop

`src/engine/simulate/simulationLoop.ts` calls `resolveExchange` per exchange and
reads `fA.hp`/`fD.hp` after — so a bleed/DoT tick that drives HP to 0 ends the
fight via this check (no extra death handling needed in `resolveExchange`).

## CombatEvent shape (for new events)

`src/types/combat.types.ts` → `CombatEvent`: `{ type, actor:'A'|'D', target?,
value?, location?: string, result?, metadata? }`. `location` is a free string;
follow the `metadata.cause` convention (`'SURVIVAL_STRIKE'`, `'FATAL_DAMAGE'`,
`'BLEED'`).
