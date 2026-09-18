# Combat Subsystems — Deep-Dive Reference (2026-06)

Three subsystems that govern the core fight loop: kill windows, the distance contest, and fatigue curves. Each section covers the exact formula, every tuning constant with its source location, known failure modes and edge cases, and a prioritised optimization plan.

---

## 1. Kill Windows

**Where:** `src/engine/combat/mechanics/combatDamage.ts:295–366` (`calculateKillWindow`), gated in `src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts:207–248`.

### Formula

```
threshold = 0.012                          // base
          + HP factor (0–0.004)
          + endurance factor (0–0.006)
          × location mult (LOCATION_KILL_MULT)
          + OE/AL aggression term
          + matchup bias
          + (killDesire − 5) × 0.002
          + (DEC − 10) × 0.0003
          + phase escalation (0–0.003)
          + momentum bonus (0–0.0075)
          + specialtyBonus
          + crowdKillBonus

threshold = clamp(max(0, threshold), 0, 0.04)
```

Kill is gated: `defender.hp ≤ maxHp × killWindowHpMult` must hold first (style-specific, usually ≤ 0.6–0.8). If `momentum < 0`, threshold returns 0 (momentum gate).

### Tuning constants

| Constant                        | Value                         | File:Line                                    | Note                                |
| ------------------------------- | ----------------------------- | -------------------------------------------- | ----------------------------------- |
| Base threshold                  | 0.012                         | `combatDamage.ts:321`                        | History: 0.01 → 0.005 → 0.012       |
| Cap                             | 0.04                          | `combatDamage.ts:365`                        | History: 0.08 → 0.04 → 0.025 → 0.04 |
| HP threshold 1                  | 0.3                           | `combatDamage.ts:324`                        | +0.004                              |
| HP threshold 2                  | 0.5                           | `combatDamage.ts:325`                        | +0.001                              |
| Endurance threshold (heavy)     | 0.2                           | `combatDamage.ts:328`                        | +0.006                              |
| Endurance threshold (moderate)  | `KILL_WINDOW_ENDURANCE` = 0.4 | `combatDamage.ts:329`, `constants/combat.ts` | +0.003                              |
| Endurance threshold (light)     | 0.6                           | `combatDamage.ts:330`                        | +0.001                              |
| Location mult — head            | 6.0                           | `LOCATION_KILL_MULT`                         | dominates threshold                 |
| Location mult — chest/abdomen   | 3.5                           | `LOCATION_KILL_MULT`                         |                                     |
| Location mult — limb            | 0.1                           | `LOCATION_KILL_MULT`                         | nearly unkillable                   |
| killDesire scale                | 0.002/point                   | `combatDamage.ts:343`                        | net range: −0.01..+0.01             |
| DEC scale                       | 0.0003/point                  | `combatDamage.ts:346`                        | minor                               |
| Phase escalation                | 0.0015/level                  | `combatDamage.ts:349`                        | 0 / +0.0015 / +0.003                |
| Momentum 3                      | +0.0075                       | `combatDamage.ts:352`                        |                                     |
| Momentum 2                      | +0.004                        | `combatDamage.ts:354`                        |                                     |
| Crowd kill bonus (Bloodthirsty) | +0.004                        | `constants/combat.ts` `CROWD_KILL_BONUS`     |                                     |
| `CRIT_DAMAGE_MULT`              | 1.7                           | `constants/combat.ts`                        | damage only, not threshold          |

### Cause bucket assignment (`hitExecution.ts:241`)

```
consecutiveHits ≥ 3          → CRITICAL_CHAIN
protect set + rawDamage ≥ 20 → ARMOR_FAILURE
else                         → EXECUTION
```

HP hits zero without a kill roll → `FATAL_DAMAGE` (KO, not a kill).

### Failure modes

1. **Purely additive model — interactions are flat.** A head-shot while the defender is both exhausted and low-HP stacks all terms, but they don't multiply: `base × headMult + enduranceTerm + hpTerm` rather than `base × headMult × exhaustionScale`. The result is that the most dangerous scenario (all conditions met) tops out at ~4% anyway because of the cap, which is intentional but means the system has no multiplicative "perfect storm" — only flat accumulation. This limits narrative tension in late-fight exhausted head-shot scenarios.

2. **Limb kills are almost impossible (mult 0.1)** even with full momentum + killDesire 10. At best `~0.012 × 0.1 × 6 ≈ 0.007` after all other terms — well below 1%. This matches design intent (limb wounds exhaust/cripple; kill via head/chest) but may feel arbitrary if a player plans around it.

3. **Momentum gate is binary.** `momentum < 0 → 0`. A fighter who gets one hit in from momentum −1 still cannot kill, even if all other conditions are met. This sometimes produces jarring narration where the engine refuses a kill on a dominant hit just because the attacker was on a slight back foot at the start of the exchange.

4. **Per-bout mortality drift.** The 2026-04 tuning history shows the system oscillated between ~3.6% and ~14% as constants changed. The guard is the balance tests (`src/test/engine/balance/`) which assert 6–10% per-bout kill rate and WallOfSteel ≤75% W%. These must run after any constant changes.

### Optimization plan

**Priority 1 — Soft momentum gate (easy, low risk)**
Instead of `if (momentum < 0) return 0`, use `threshold += momentum × 0.001` (which can still go negative but is then clamped to 0 by the `max(0, ...)` at the return). This allows a dominant late-fight hit to still threaten a kill at slightly negative momentum while preserving the gating intent. Re-run balance tests to confirm <10% per-bout mortality.

**Priority 2 — Multiplicative endurance-location core (medium, needs regression)**
Replace the additive `location × (base + hpFactor + enduranceFactor + ...)` chain with a multiplicative core for the two highest-signal terms:

```
threshold = base × locMult × exhaustionMult
          + additive_flat_terms
```

where `exhaustionMult = 1 + (enduranceRatio < 0.2 ? 0.5 : enduranceRatio < 0.4 ? 0.25 : 0)`. This makes a head-shot while truly exhausted feel correctly more dangerous without blowing past the 4% cap in normal conditions. Must re-tune base downward to ~0.009 to preserve mortality target.

**Priority 3 — Expose kill-threshold telemetry in ExchangeLogEntry (low, non-breaking)**
Add `killThreshold?: number` to `ExchangeLogEntry`. This lets the simulation dashboard show "how close was that hit to a kill" for every exchange — useful for balance tuning without running the full balance suite each time.

---

## 2. Distance Contest

**Where:** `src/engine/combat/mechanics/distanceResolution.ts` — `contestDistance`, `computeReachScore`, `shiftRangeToward`, `clampRangeToMax`, `WEAPON_PREFERRED_RANGE`, `WEAPON_RANGE_MODIFIERS`, `ARENA_SIZE_PROFILES`.

### Formula

```
reachScore(fighter) = INI + (OE − 5) × 2 + motivationBonus − recoveryDebt × 2

motivationBonus = prefRange ≠ currentRange ? 2 : 0
                  (halved to 1 when pref exceeds arena maxRange — cramped arena)

winner = contestCheck(rng, reachA, reachD)   // opposed roll: higher score wins

shifted = shiftRangeToward(currentRange, winner.preferredRange)
newRange = clampRangeToMax(shifted, ctx.maxRange)

ATT modifier from range = WEAPON_RANGE_MODIFIERS[weaponId][newRange]  (flat, applied next attack check)
```

`contestCheck` is a probabilistic opposed roll (not deterministic): a 1-point reach advantage is not a guaranteed win, but a 10-point advantage is nearly certain. See `combatMath.ts`.

### Tuning constants / tables

| Table                    | Values                                                                   | File                        |
| ------------------------ | ------------------------------------------------------------------------ | --------------------------- |
| `WEAPON_PREFERRED_RANGE` | 27 weapons → Tight/Striking/Extended                                     | `distanceResolution.ts:8`   |
| `WEAPON_RANGE_MODIFIERS` | 27 weapons × 4 ranges                                                    | `distanceResolution.ts:57`  |
| Motivation bonus         | +2 (halved to +1 in cramped for out-of-cap weapons)                      | `distanceResolution.ts:147` |
| Recovery debt penalty    | −2 per point                                                             | `distanceResolution.ts:108` |
| `ARENA_SIZE_PROFILES`    | cramped: Tight/Striking/bias+1 — standard/open: Striking/Extended/bias+0 | `distanceResolution.ts`     |

**Range ladder:** `Grapple → Tight → Striking → Extended` (indices 0–3). Shift moves one step per exchange. `clampRangeToMax` caps Extended at Striking in cramped arenas.

### Order-of-operations within a tick

1. `runApproach` calls `contestDistance` → updates `ctx.range`.
2. `resolveInitiativePhase` runs — INI formula reads `ctx.range` at its new value.
3. `resolveCombatOffenseDefense` → `performAttackCheck` applies `getWeaponRangeMod(weaponId, ctx.range)` to ATT.

So the fighter who wins the range contest immediately fights at the new range on the same tick. This means a halberd user who wins Extended on tick 5 also attacks at Extended range on tick 5, not tick 6. This is correct and intentional — range control and the attack are one unified contest.

### Failure modes

1. **Arena `maxRange` caps the range but not the ATT modifier lookup.** `WEAPON_RANGE_MODIFIERS['halberd']['Extended'] = +4` still exists. If cramped arena caps at Striking, the halberd user never reaches Extended and never gets the +4 — which is correct. But if the cap were ever loosened (e.g. a "partially cramped" arena) without updating the modifier table, the weapon could receive a bonus at a range it never reaches. Currently no risk, but the coupling should be noted.

2. **`Grapple` is unreachable from a standard start.** All bouts start at Striking (standard/open) or Tight (cramped). To reach Grapple from Striking takes two contest wins by a Grapple-preferred fighter. With `war_hammer` (preferred Tight, not Grapple), Grapple is only reachable with back-to-back wins, which takes 2 exchanges from Tight. This means the `Grapple: +4` fist bonus is extremely rare to exploit in practice.

3. **rangeModA/D are currently zeroed out** (not used for ATT). The comment in `runApproach` explains why: a flat ATT bonus from winning the range contest double-stacks with commit level and broke balance. If future tuning wants to reward the range-contest winner with a mild ATT bonus, it should be very small (±1) and subject to balance retesting.

### Optimization plan

**Priority 1 — Grapple accessibility for grapple-preferred fighters (low, behavioral)**
Add a `grapplePreferred` flag (or simply check `prefA === 'Grapple'`) and give a +1 motivation bonus on top of the standard +2 when already at Tight and trying to close to Grapple. This makes dedicated brawlers more likely to succeed at their niche without changing anything for weapon-range users.

**Priority 2 — Arena `open` differentiator (low, currently dormant)**
`open` arenas currently have the same `maxRange = 'Extended'` as `standard` and zero motivation boost. The intent is that open arenas favour long weapons. Give `open` arenas an `extendedReachBonus: 1` in `ArenaSizeProfile` and apply it as an extra motivation bonus when a fighter's preference is Extended and `currentRange = Striking` (fighting to create distance). This fulfills the Bloodsands flavour text ("long sight lines").

**Priority 3 — Dynamic weapon range modifiers for fatigue (medium)**
A fighter at <30% endurance struggles to hold reach posture. Add an `endurancePenalty` to `getWeaponRangeMod` that scales the Extended bonus down: `mod × (1 − Math.max(0, 0.3 − endRatio) × 2)`. A polearm user who is exhausted can no longer leverage their reach advantage. Requires adding `FighterState` endurance to the call site in `resolveCombatOffenseDefense`.

---

## 3. Fatigue Curves

**Where:** `src/engine/combat/mechanics/combatFatigue.ts` — `enduranceCost`, `fatiguePenalty`.  
**Applied in:** `src/engine/combat/resolution/exchangeHelpers/mechanics/enduranceCosts.ts` — `applyEnduranceCosts`.

### Formula

```
baseCost = OE × 0.18 + AL × 0.09
weatherCost = baseCost × weatherEffect.staminaMult

// Attacker pays full cost (× style/weapon/encumbrance/arena/psych/trait mults)
// Defender pays DEFENDER_ENDURANCE_DISCOUNT = 0.6 of it (minimum 1)

fatiguePenalty(endurance, maxEndurance):
  ratio = endurance / maxEndurance
  if ratio ≤ 0.25 → −8
  elif ratio ≤ 0.45 → −4
  else → 0
```

The penalty applies to all skill rolls (ATT, PAR, DEF, INI, DEC) via the `fatiguePenalty` term summed into the final skill totals each exchange.

### Tuning constants

| Constant                   | Value | File:Line                                         | Note                                             |
| -------------------------- | ----- | ------------------------------------------------- | ------------------------------------------------ |
| OE scaling                 | 0.18  | `combatFatigue.ts:14`                             | History: was 0.1 (floor truncated to 0 for OE≤9) |
| AL scaling                 | 0.09  | `combatFatigue.ts:15`                             |                                                  |
| Fatigue moderate threshold | 0.45  | `combatFatigue.ts:19`                             | ratio ≤ this → −4                                |
| Fatigue heavy threshold    | 0.25  | `combatFatigue.ts:20`                             | ratio ≤ this → −8                                |
| Moderate penalty           | −4    | `combatFatigue.ts:23`                             |                                                  |
| Heavy penalty              | −8    | `combatFatigue.ts:24`                             |                                                  |
| Defender discount          | 0.6   | `enduranceCosts.ts` `DEFENDER_ENDURANCE_DISCOUNT` |                                                  |
| Mudpit enduranceMult       | 1.15  | `arenas.ts:135`                                   | surface mod                                      |
| Bloodsands enduranceMult   | 1.0   | `arenas.ts:157`                                   | zeroed for tournament neutrality                 |
| Underpit enduranceMult     | 1.05  | `arenas.ts:166`                                   |                                                  |

**Typical drain rate** (OE=7, AL=7, standard arena, no weather, no mults):
`baseCost = 7×0.18 + 7×0.09 = 1.26 + 0.63 = 1.89 per exchange`.
A warrior with `maxEndurance = 25` (typical baseline) hits the 45% threshold at `endurance ≈ 11.25`, which takes ~`(25−11.25)/1.89 ≈ 7.3 exchanges`. This aligns with the design target: "mid-game (exchanges 7–10) for a moderately aggressive fighter."

### Failure modes

1. **Two-cliff step function creates strategy discontinuity.** The penalty jumps from 0 → −4 at 45% and −4 → −8 at 25% with no gradient between. A fighter who hits 45% on exchange 7 suddenly loses 4 from every roll. This creates a detectable breakpoint that aggressive players can exploit: if you can kill before exchange 7, you don't care about fatigue at all. The alternative (smooth ramp) would give subtler, harder-to-exploit degradation.

2. **Defender discount is flat 0.6 regardless of tactic.** A Total-Parry fighter who turtles all game should arguably pay more to maintain their parries than a fighter who mainly dodges. Currently both pay 60% of attacker cost. The discount doesn't distinguish between active-defence tactics (Parry/Riposte, which are physically demanding) and passive ones (Responsiveness, which isn't).

3. **Fatigue opens kill windows but is NOT tracked in `ExchangeLogEntry`.** `endDeltas` are meant to capture per-exchange drain but the switch case for `ENDURANCE` is absent in `buildExchangeLogEntry`. Telemetry cannot correlate exhaustion with kill timing. (Task 3 above added KNOCKDOWN/RECOVERY/MOMENTUM_SHIFT; ENDURANCE/endDeltas is a follow-up.)

4. **Dead-system history.** Pre-2026-04 the values were 0.1/0.05, which at OE=7/AL=7 produced `0.7+0.35 = 1.05`, and `Math.floor(1.05) = 1` — borderline. At OE≤9 the integer flooring zeroed fatigue for any sub-aggressive fighter, meaning Total Parry with OE=3 never tired: `3×0.1 + 3×0.05 = 0.45 → 0`. The current scaling (0.18/0.09) was specifically chosen to avoid this by keeping the raw fractional cost and rounding only once at the end.

### Optimization plan

**Priority 1 — Smooth fatigue ramp (medium, behaviour change)**
Replace the two-cliff step function with a continuous penalty:

```
if ratio ≤ 0.45:
  penalty = Math.round(-4 - max(0, (0.45 - ratio) / 0.20) × 4)
  // −4 at 0.45, linearly −8 at 0.25, stays −8 below 0.25
```

This keeps the same terminal values but removes the strategy discontinuity. Fighters feel themselves slowing down gradually rather than falling off a cliff. Must regression-test mortality (exhaustion is a kill-window amplifier; gentler fatigue may slightly reduce per-bout kill rate).

**Priority 2 — Tactic-aware defender discount (low, tuning)**
Give active defence tactics (Parry, Riposte) a lower discount (0.5 of attacker cost, up from 0.6) and passive/movement tactics (Dodge, Responsiveness) a slightly higher one (0.65). Implement via a `defenderTacticMult` lookup in `applyEnduranceCosts` using `resCtx`'s tactic state. Net effect: parry-heavy styles tire faster in prolonged fights, creating a meaningful trade-off vs. dodge-heavy styles.

**Priority 3 — ENDURANCE event in ExchangeLogEntry (low, telemetry)**
Add `endDeltas?: { a: number; d: number }` population to `buildExchangeLogEntry` by handling the `ENDURANCE` event type. Currently `enduranceCosts.ts` emits `ENDURANCE` events; `logging.ts` silently ignores them. Adding the case is two lines.

**Priority 4 — Arena enduranceMult for cramped/open (medium, already wired)**
The `surfaceMod.enduranceMult` already exists and is applied. However, the `size: 'cramped'` / `'open'` distinction currently has identical `enduranceMult` for standard and open (both 1.0 in seed data). Consider lowering the Bloodsands multiplier to 0.9 (open arena, room to breathe) and raising Underpit to 1.1 (in addition to the current 1.05 surface mod, total effect: arena×surface). This requires updating `BLOODSANDS_ARENA.surfaceMod.enduranceMult` and balance retesting.

---

## Cross-subsystem interactions

| Interaction                          | Effect                                                                                                                                                                                                                                                                           |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Long-weapon fighter in cramped arena | Starts at Tight; Extended unreachable; weapon ATT penalty applies every exchange; motivation halved → rarely escapes Tight/Striking                                                                                                                                              |
| High-momentum + exhausted defender   | Momentum ≥ 2 (+0.004 threshold) + endurance <20% (+0.006) → ~0.022 before HP/location. Multiplied by head location × 6 = 0.132 → still capped at 4%. Cap absorbs the storm.                                                                                                      |
| Fatigue cliff + kill window          | Fighter who crosses the 45% endurance threshold loses −4 to DEF/PAR, making them easier to hit → more HP drain → more hits → HP drops → kill window opens. Fatigue is an indirect kill enabler, not a direct one.                                                                |
| Arena zone push + cramped bias       | In Underpit (cramped), a hit pushes Center → Corner in one step (zoneStepBias=1). Cornered fighter faces −5 DEF, which increases hit rate, which increases HP drain and kill-window probability. Cramped arenas are genuinely more dangerous for the fighter who gets hit first. |
