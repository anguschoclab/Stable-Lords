# Per-Style Win Conditions — Design Spec (Phase 2 of Combat Balance)

**Date:** 2026-06-19
**Status:** Approved design — ready for implementation plan
**Predecessor:** `docs/superpowers/plans/2026-06-18-balance-decoupling.md` (Tasks 1–6, the guardrail harness this spec validates against). This is the "#2" deferred from that plan.

---

## Problem

Several fighting styles express their identity as a _penalty_ rather than a _payoff_. The clearest case: Aimed Blow carries a large negative ATT in `STYLE_PENALTIES` (`src/engine/skillCalc.ts`), and the matchup matrix was then hand-buffed to "counter the passive headwind" — the decoupling plan (Phase 1) moved that compensation into the penalty layer, but a penalty with no upside still leaves the style feeling bad to play and bottom of the win table. Total Parry is "unplayable until it isn't"; Lunging/Parry-Lunge rely on raw initiative that ages off a cliff.

The fix is not more stat tuning. It is to give each of these styles a **distinct win condition** — a conditional mechanic that _pays off_ its identity — so balance is achieved across different win axes (precision / attrition / tempo) rather than by equalizing one number. This deepens identity instead of flattening it.

## Goals

- Give AB, TP, and LU/PL each a mechanical win condition that rewards their identity.
- Keep every change in the mechanics/passive layer. **Do not touch `MATCHUP_MATRIX`** — the Phase-1 antisymmetry guardrail must stay green.
- Re-validate absolute power against the Phase-1 40–60% band after each mechanic lands.
- Preserve style distinctness: LU and PL must not collapse into the same fighter.

## Non-Goals (YAGNI)

- No Wall of Steel mechanic (separate style, separate future spec).
- No kill-window change for AB (we chose armor-bypass, not the faster-kill option).
- No new matchup-matrix entries or absolute-power tuning _in this spec_ — the penalty ratchet is a follow-on step, not part of the mechanic design.
- No changes to weapon-suitability (CW/W/M/U) or mortality canon data.

## Shared principle

Each mechanic: (1) converts identity-as-penalty into identity-as-conditional-payoff; (2) lives in the mechanics/passive layer, never the matrix; (3) is tuned against the Phase-1 absolute-power band. **All magnitudes below are starting defaults — the harness sets the finals.**

---

## Mechanic 1 — AB: Inherent called shot

**Decision:** Inherent to every AB attack (not an opt-in committed move). The accuracy cost already exists as AB's negative ATT in `STYLE_PENALTIES`; this adds the missing payoff, so AB's penalty finally buys something.

**Identity:** AB aims for the gap — fewer hits, but each landed blow punches through armor that walls and heavy armor rely on. AB becomes _the armor counter_, a lane no other style owns.

**Hooks (verified):**

- `src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts` — the landed-hit path: `rollHitLocation(rng, attTactics.target, defender.activePlan.protect)` and the damage-mitigation step.
- `src/engine/combat/mechanics/weaponArmor.ts` — `applyArmorTypeMod(damage, weaponId, armorId)` (the `ARMOR_TYPE_MULT` reduction, e.g. `plate_armor: { slash: 0.8, … }`). This is the mitigation AB partially bypasses.

**Mechanic — on a landed AB hit:**

1. **Armor bypass:** ignore a DF-scaled fraction of the armor mitigation. Default `bypass = clamp(attacker.DF / 50, 0, 0.4)` → a DF-15 AB bypasses ~30% of the armor's damage reduction. Applied by interpolating between the mitigated and unmitigated damage: `effective = mitigated + bypass * (raw − mitigated)`.
2. **Location severity:** shift the `rollHitLocation` result one step toward higher-value locations (precision targeting).

**Scaling rationale:** bypass scales with **DF** (Deftness), AB's archetype-defining stat (Cunning: WT/DF) — so the payoff tracks the attribute that _is_ the style's identity.

**Anti-flatten:** AB stays low-accuracy / high-consequence. It whiffs more than other styles (unchanged) but its landed blows are uniquely armor-piercing. No other style gains this.

---

## Mechanic 2 — TP: Fatigue-exploit counter

**Decision:** The opponent's exhaustion feeds TP's **counter/riposte** (not survivability, not a split). A survivability-only payoff would make TP unkillable but unable to win (pushing to decisions/draws); the counter payoff gives TP an actual win condition — it converts the opponent's aggression into their death.

**Identity:** the wall outlasts, then punishes exhaustion. Makes TP a true counter-pick to high-OE rushers (BA/ST) who burn stamina, rather than a stat-buffed striker.

**Hooks (verified):**

- `src/engine/combat/resolution/resolution.ts` — `resolveWhiffRiposte` (the defender-riposte-on-whiff path) calling `performRiposteCheck` / `executeRiposte`, with access to the opponent's live `endurance` (fighter state exposes `fA.endurance` / `fD.endurance`).
- Endurance model: `src/engine/combat/mechanics/combatFatigue.ts` (`enduranceCost`, `fatiguePenalty`).

**Mechanic (TP only):** scale TP's riposte chance and counter damage by the opponent's endurance depletion. Default — **stepped**:

- opponent endurance below 50% of max → riposte chance ×1.25, counter damage +1;
- below 25% → riposte chance ×1.5, counter damage +2.

Gated to `style === TotalParry` so it does not leak to other defensive styles.

**Anti-flatten:** TP still cannot out-DPS anyone early. It wins only by surviving into the opponent's exhaustion. A low-OE, stamina-disciplined opponent denies TP its payoff — that is the intended counterplay.

---

## Mechanic 3 — LU / PL: Decaying first-strike pressure (split)

**Decision:** Reuse the existing `momentum` field; LU and PL get **different payoff flavors** so they stay distinct.

**Identity:** terrifying while ahead on tempo; fades if stalled. The decay is _already built in_ — `momentum` is clamped `[-3, 3]`, feeds INI (`momentum * 2`, `resolution.ts:110/129`), and steps down on a lost parry/initiative (`def.momentum = min(3, +1)`, `att.momentum = max(-3, −1)`, `resolution.ts:299–300`). We add a new payoff axis off the _same_ counter — no new decay logic, no INI double-dip.

**Hooks (verified):**

- `src/engine/combat/resolution/resolution.ts` — the damage assembly (LU) and the riposte path (PL), both keyed off `fA.momentum` / `fD.momentum`.

**Mechanic:**

- **LU** (pure aggression): positive momentum adds **first-strike damage pressure** on a landed hit. Default `+momentum * 0.5` damage (so a capped +3 momentum = +1.5 damage). Collapses the moment they lose initiative (momentum steps down).
- **PL** (parry identity): positive momentum instead feeds **riposte chance / damage**, not raw attack damage — keeps PL from becoming a second LU.

**Anti-flatten:** no new counter is introduced; the opponent's counterplay is the existing momentum decay — break their initiative and the bonus bleeds off. LU = aggressive tempo, PL = reactive tempo.

---

## Validation & dependencies

1. **Absolute-power re-ratchet (required follow-on).** These mechanics shift absolute power. After they land, re-run the Phase-1 Task-3 loop: adjust `STYLE_PENALTIES` until every style returns to the **40–60% band** in `src/test/engine/economy/balance.test.ts`. The matrix is untouched, so `findAntisymmetryViolations` stays green.
2. **New targeted tests:**
   - AB: unit test that a landed AB hit vs an armored target deals more post-mitigation damage than a non-AB style with identical stats; and that bypass scales with DF.
   - TP: harness test that TP's win rate vs a **high-OE** opponent exceeds its win rate vs a **low-OE** opponent (the fatigue-exploit signature).
   - LU/PL: unit tests that positive momentum raises LU's hit damage and PL's riposte chance/damage; and that zero/negative momentum yields no bonus.
   - Directional guardrail: AB↔heavy-armor and TP↔aggressor matchup win-rates move in the intended direction versus the pre-change baseline.
3. **Phase-1 guardrails must remain green** throughout: antisymmetric matrix, mirror band, 40–60% absolute-power band.

## Build order (for the plan)

Independent mechanics; recommended order by impact and isolation:

1. **AB** (highest impact — bottom of the win table and worst mirror bias) → re-ratchet → validate.
2. **TP** → re-ratchet → validate.
3. **LU/PL** (shared momentum hook, split payoff) → re-ratchet → validate.

Each mechanic is a self-contained slice: mechanic code + unit tests + penalty re-ratchet + harness green.

## Open knobs (tuned in implementation, not design)

- AB `bypass` divisor (default 50) and cap (default 0.4); severity-shift size.
- TP endurance thresholds (50% / 25%) and multipliers (×1.25/×1.5, +1/+2).
- LU damage coefficient (default 0.5); PL riposte coefficients.
- Final `STYLE_PENALTIES` values after each re-ratchet.

These are deliberately left to the harness — the _tests_ define done; no win rate is hard-coded.
