---
name: combat-domain
description: Orientation map for the Stable Lords combat & bout engine — fight resolution, the exchange loop, bout lifecycle, narration, weather, and the boundary with combat-balance. Use whenever touching src/engine/combat, src/engine/bout, src/engine/simulate, fight plans/tactics, or a bug that needs the lifecycle map rather than tuning advice — where resolveBout/processWeekBouts sit, how an exchange flows (approach→feint→commit→recovery), which mechanics file owns what, and the two traps (balance tuning belongs to combat-balance; narrators must stay on the isolated narration rng).
---

# Combat & Bout Domain Map

Two levels: **one fight** (`simulateFight` → `FightOutcome`) and **the bout
lifecycle** (weekly offers → pairings → resolution → world mutation). Balance
tuning is deliberately out of scope here — see `combat-balance`.

## One fight

- Entry: `simulateFight(args)` — `src/engine/simulate/simulateFight.ts`.
  `prepareBout` builds `FighterState`s + `ResolutionContext`, then the
  **exchange loop** in `src/engine/combat/resolution/resolution.ts` runs
  phases until a terminal outcome. Siblings: `simulationLoop/` driver,
  `initialization.ts`, `narrative.ts`, `postFight.ts`.
- Exchange sub-phases (`resolution/exchangeSubPhases.ts`):
  `runApproach → runFeint → runCommit → runRecovery`, orchestrated by
  `resolution.ts` with `phaseResolvers.ts` (initiative + offense/defense
  resolution), `exchangePrep.ts` (setup), `offenseDefense/` and
  `exchangeHelpers/` (endurance costs).
- Per-style mechanics live one-per-file in `resolution/`: `guardBreak.ts`,
  `bleed.ts`, `counterstrike.ts`, `disarm.ts`, `strikingAttack.ts`,
  `styleRiposteBonus.ts`, `tacticCounter.ts`, `decoyShift.ts`,
  `offhandAttack.ts`, `aimedBlow.ts`, `psychState.ts`, `specialtyMods.ts`,
  `tactics.ts` (`resolveEffectiveTactics`, `applyAggressionBias`).
  Style passives: `src/engine/stylePassives/` (`STYLES` registry in
  `index.ts`, one `strategies/<style>.ts` per style).
- Shared mechanics in `src/engine/combat/mechanics/`: `damageCalc.ts`,
  `weaponArmor.ts`, `deathRolls.ts` (`rollInfirmaryOutcome`), `hitLocation.ts`,
  `combatFatigue.ts`, `conditionEngine.ts`, `distanceResolution.ts`,
  `downedFighterEnd.ts`, `arenaEvents.ts` (mid-bout arena event ticks),
  `tacticResolution.ts`, `willChecks.ts`, `weaponStats.ts`,
  `weatherEffects/` (+ `weatherOpeningLines.ts`).
- Constants: `src/constants/combat/` — barrel `combat.ts` re-exports
  `combat/{global,balance,matchup,meta}.ts` + `styles/<code>.ts` per-style
  knobs and `planConditions.ts`. **No bare numbers in logic.**

## Bout lifecycle (weekly)

- `generatePairings` — `src/engine/bout/core/pairings.ts`.
- `resolveBout` / `processWeekBouts` (→ `BoutResult`, `BoutImpact`,
  `WeekBoutSummary`) — `src/engine/bout/services/boutProcessorService.ts`
  (+ `boutResolution.ts`, `WeekFinalizationService.ts`, `WeekStatsService.ts`).
- Supporting: `fighterState.ts`, `decisionLogic.ts`, `planDefaults.ts`,
  `crowdMood.ts`, `injuryHandler.ts`, `mortalityHandler.ts`, `fame.ts`,
  `offerCleanup.ts`, `mutations/contractMutations.ts` (offer responses),
  `challengePlans.ts`.
- Fight plans: `src/engine/combat/planConditionUtils.ts` +
  `src/constants/combat/planConditions.ts` — AI/player plan conditions.

## Narration

`src/engine/combat/narrative/narrateEvents.ts` +
`src/engine/narrative/combatNarrators.ts` render `CombatEvent`s into text
against `src/data/narrative/*.json` pools (see `narrative-templates`).
**Narrators draw from an isolated narration rng** — the
`narrated === headless` gate depends on it; never let narration consume the
mechanical stream (`determinism-debug` §4).

## Weather

`src/engine/combat/mechanics/weatherEffects/` (`table.ts`) driven by
`src/constants/arena/weatherStats.ts`. Known trap: display-token vs
`staminaMult` semantics inconsistency on 'Chaos Storm' (V21-B3,
`docs/MEGAPLAN_BACKLOG.md`) — check conventions before adding a stat line.

## The boundary

- **Balance/tuning** (win rates, STYLE_PENALTIES, matchup matrix, passives
  magnitude) → `combat-balance` — two-surface rule + mandatory re-ratchet.
- **Mechanics/lifecycle** (a new phase, a bout-type outcome, kill/KO flow,
  crowd mood, weather effect) → this map + `week-pipeline` for weekly wiring.
- Canon is off-limits (weapon-suitability CW/W/M/U, mortality data, learn
  caps) — adjudicated divergences in `docs/MEGAPLAN_BACKLOG.md` §3.

## Verify

```bash
bun run test --reporter=verbose src/test/engine/combat/ src/test/engine/bout/
```

(see `combat-sim` for the full runner map incl. slow-tier hardening/balance).
Empirical check before believing a behavior claim: seeded `simulateFight`
harness — production callers pass args the way `simulateFight` declares them,
and A/D position matters (see `verify-implementation`).
