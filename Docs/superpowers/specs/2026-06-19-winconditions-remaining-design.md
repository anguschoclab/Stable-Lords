# Per-Style Win Conditions, Remaining Six — Design Spec (Phase 2b)

**Date:** 2026-06-19
**Status:** Approved design — ready for implementation plan
**Predecessors:**

- `docs/superpowers/plans/2026-06-18-balance-decoupling.md` — Phase 1, the guardrail harness this spec validates against (40–60% band, antisymmetric matrix).
- `docs/superpowers/specs/2026-06-19-winconditions-design.md` — Phase 2a (AB, TP, LU, PL). **WS in this spec depends on 2a's LU/PL momentum mechanic existing.**

This spec covers the remaining six styles: **PR, PS, WS, BA, ST, SL.** Together with 2a, all ten styles now have a distinct win condition.

---

## Problem & principle

Phase 1 decoupled absolute power (`STYLE_PENALTIES`) from the matchup matrix and locked both with guardrail tests. Phase 2a gave four styles a conditional win condition so their identity _pays off_ instead of being expressed as a pure penalty. This spec finishes the set.

For the already-strong styles (BA, ST), the win condition is about **sharpening distinct identity, not adding power** — the post-mechanic penalty re-ratchet (Phase 1, Task 3) pulls their level back into the 40–60% band, so a new mechanic deepens _how_ they win without inflating _how often_.

**Shared rules (unchanged from 2a):** conditional payoff, mechanics/passive layer only, **never touch `MATCHUP_MATRIX`**, re-validate against the 40–60% band. All magnitudes are starting defaults — the harness sets finals.

## Non-Goals (YAGNI)

- No matchup-matrix edits; no absolute-power tuning _as part of mechanic design_ (the ratchet is a separate validated step).
- No changes to weapon-suitability (CW/W/M/U) or mortality canon data.
- No knockdown/stagger system (considered for WS/BA, not chosen).
- No AB/TP/LU/PL changes here (those are Phase 2a).

---

## Mechanic 1 — PR: Riposte master (counter-on-parry + punish-commitment + light chain)

**Decision:** a blend — primarily counter-on-parry (frequency) and punish-commitment (damage), with a small compounding chain.

**Identity:** the riposte king who beats brawlers. Distinct from PL (tempo-driven riposte) and TP (fatigue-driven counter): PR is keyed to the **opponent's commitment**.

**Hooks (verified):**

- `src/engine/combat/resolution/exchangeHelpers/checks/riposteCheck.ts` + `…/execution/riposteExecution.ts` — riposte trigger and damage.
- `src/engine/combat/resolution/resolution.ts` — the existing `attCommit: CommitResult` (commitment level from `runCommit`: Cautious / Standard / Full / Desperate).

**Mechanic (PR only):**

1. **Counter-on-parry:** a successful parry raises PR's riposte trigger chance (default: +25% relative to base riposte chance that exchange).
2. **Punish-commitment:** riposte damage scales with the attacker's commitment level — default `+0` Cautious, `+1` Standard, `+2` Full, `+3` Desperate. Over-committing into a PR is punished hardest.
3. **Light chain:** consecutive successful ripostes add a small compounding bonus via a new `riposteStreak` counter on PR's `FighterState`, capped (default `+0.5` damage per streak, cap +1.5; resets on a missed riposte or on taking a clean hit).

**Anti-flatten:** a disciplined, low-commitment opponent starves PR of its payoff — that is the counterplay. PR stays weak on raw offense; it wins by converting the opponent's aggression.

---

## Mechanic 2 — PS: Parry → counterstrike window

**Decision:** a successful parry primes a boosted strike on the _next_ beat (literally the style name).

**Identity:** defend, then strike back hard. Distinct from PR's _immediate_ riposte — PS's payoff is its _following_ action, a defense-into-offense rhythm.

**Hooks (verified):**

- `src/engine/combat/resolution/resolution.ts` — the parry-resolution path; set a new `counterstrikePrimed` flag on the PS `FighterState`.
- `src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts` — consume the flag on PS's next attack (ATT/damage bonus), then clear it.

**Mechanic (PS only):** on a successful parry, set `counterstrikePrimed = true`. On PS's next attack, apply a bonus (default `+2 ATT, +1 damage`) and clear the flag. The window lasts one exchange — miss the follow-up beat and it lapses.

**Anti-flatten:** PS still can't out-trade aggressors blow-for-blow; it must defend first to earn its offense. Rushing it denies nothing, but a feint-heavy opponent that bypasses the parry denies the counterstrike.

---

## Mechanic 3 — WS: Immovable (tempo-immune) ⚠️ depends on Phase 2a

**Decision:** WS negates the LU/PL initiative-snowball payoff directed at it, and grinds via steady attrition.

**Identity:** the brick that breaks tempo. Creates clean rock-paper-scissors: LU/PL snowball, WS is immune to the snowball.

**Hard dependency:** the LU/PL `momentum` damage/riposte payoff from **Phase 2a, Mechanic 3** must exist first — WS's mechanic gates _that_ payoff. If 2a is not implemented, this mechanic has nothing to negate; sequence 2a before WS.

**Hooks:**

- `src/engine/combat/resolution/resolution.ts` — at the site where the 2a LU/PL momentum→damage/riposte bonus is applied, gate it off when `defender.style === WallOfSteel`.
- Steady-attrition floor: a small flat damage/pressure bonus on WS landed hits (default `+0.5` damage) so being immovable still closes fights rather than stalling to decisions.

**Mechanic (WS only):** incoming LU/PL momentum payoff is set to 0 against WS; WS gains the small attrition floor on its own hits.

**Anti-flatten:** WS stays the slowest style (lowest INI, unchanged). It does not gain tempo — it _denies_ tempo. Fast styles must beat it on raw damage, not by snowballing initiative.

---

## Mechanic 4 — BA: Guard-break / battering

**Decision:** sustained BA attacks erode the opponent's guard.

**Identity:** relentless force — the counter to defensive walls (TP/WS/PS).

**Hooks:**

- `src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts` — on a landed BA hit, accumulate a `parDegrade` on the _defender's_ `FighterState`.
- The PAR/DEF assembly in `resolution.ts` — subtract `parDegrade` from the defender's effective parry/defense.

**Mechanic (BA only):** each landed BA hit adds to the defender's `parDegrade` (default `+0.5` per hit, cap `−3` total PAR/DEF). Erosion persists for the fight. Represents a guard battered down by repeated heavy blows.

**Anti-flatten:** BA still must _land_ hits to erode (defensive styles that avoid hits delay it); the cap prevents runaway. The penalty re-ratchet keeps BA's overall win rate in band — this changes BA from "high flat ATT" to "grinds down guards," a more legible identity.

---

## Mechanic 5 — ST: All-in threat (front-load + crit + execute)

**Decision:** the combo — front-loaded damage, elevated crit, and bonus vs wounded targets.

**Identity:** the glass cannon. Terrifying early, crits, finishes the hurt; fades in a grind — natural prey to TP (outlast) and WS (immovable). High variance.

**Hooks (verified):**

- `src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts` — existing crit path (`attPassive.critChance`, `rng() < critChance`, `metadata.crit`); the damage calc.
- Exchange index / target HP available in the resolution context.

**Mechanic (ST only):**

1. **Front-load:** a damage multiplier that decays with exchange count (default `×1.3` exchange 1, fading to `×1.0` by exchange ~6).
2. **Crit specialist:** raise ST's `critChance` and crit damage (default `+`a flat critChance bump; crit multiplier already exists in-engine).
3. **Execute:** bonus damage vs low-HP targets (default `+2` damage when target HP < 30% max).

**Anti-flatten:** ST is high-variance and front-loaded — outlasting it (TP) or denying its tempo (WS) is the counterplay. The ratchet keeps its win _rate_ in band while making its win _shape_ a burst threat rather than steady dominance.

---

## Mechanic 6 — SL: Bleed + flurry ⚠️ new subsystem

**Decision:** stacking bleed applied via a multi-hit flurry.

**Identity:** flexibility resolved into a damage-over-time axis no other style has — sustained cuts that reward staying engaged.

**New subsystem (does not exist today):** there is no status/DoT/tick system in the combat engine (verified — no `bleed`/`status`/`tick` in `src/engine/combat`). This spec introduces a deliberately lightweight one:

- A `bleedStacks: number` field on `FighterState`.
- A per-exchange bleed tick in the exchange loop (`resolution.ts`): apply `bleedStacks * BLEED_TICK` damage at exchange end, then decay stacks (default tick `1` damage/stack, decay `−1` stack/exchange, cap `5` stacks).

**Hooks:**

- `src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts` — SL landed hits add bleed stacks to the defender.
- `src/engine/combat/resolution/resolution.ts` — the new end-of-exchange bleed tick + decay, applied to both fighters generically (so the subsystem is reusable, not SL-special-cased in the loop).
- **Flurry:** SL's attack splits into multiple smaller strikes (default: 2 strikes at reduced per-hit damage), each able to apply a bleed stack — so SL stacks bleed faster than a single-hit style.

**Anti-flatten:** bleed rewards _sustained_ engagement; a style that ends fights fast (ST) or avoids hits (defensive walls) limits SL's DoT. The flurry trades burst for attrition — distinct from every other style.

**Scope note:** SL is the heaviest task. The bleed subsystem is built generically (a reusable `bleedStacks` + tick) so future effects (poison, etc.) can reuse it — but YAGNI: only bleed is implemented now.

---

## Validation & dependencies

1. **Per-mechanic re-ratchet (required).** After each mechanic lands, re-run Phase 1 Task 3: adjust `STYLE_PENALTIES` until every style is back in the **40–60% band** (`src/test/engine/economy/balance.test.ts`). Critical for BA/ST to prevent power creep. Matrix untouched → `findAntisymmetryViolations` stays green.
2. **New targeted tests:**
   - PR: riposte damage rises with attacker commitment level; counter-on-parry raises riposte frequency; chain caps correctly.
   - PS: a parry primes the flag; the next PS attack consumes the bonus and clears it; the window lapses after one exchange.
   - WS: an LU/PL momentum payoff is zeroed when the defender is WS; WS's attrition floor applies.
   - BA: `parDegrade` accumulates and caps; defender effective PAR/DEF drops accordingly.
   - ST: front-load multiplier decays by exchange; execute bonus triggers below 30% HP; critChance raised.
   - SL: bleed stacks apply on hit, tick at exchange end, decay, and cap; flurry produces multiple strikes.
   - Directional guardrails: BA↔defensive-walls, ST↔TP/WS, SL↔fast-enders move in the intended direction vs baseline.
3. **Phase-1 guardrails green throughout:** antisymmetric matrix, mirror band, 40–60% band.

## Build order (for the plan)

Isolated → complex, each a self-contained slice (mechanic + unit tests + penalty re-ratchet + harness green):

1. **PS** — parry→strike flag (smallest, self-contained).
2. **BA** — `parDegrade` accumulator.
3. **WS** — gate the 2a momentum payoff (**after Phase 2a is implemented**).
4. **PR** — commit-read + riposte frequency + chain counter.
5. **ST** — front-load + crit + execute (touches damage calc on three axes).
6. **SL** — new bleed subsystem + flurry (heaviest; last).

## Open knobs (tuned in implementation, not design)

- PR: counter-on-parry % (25), commitment damage ladder (0/1/2/3), chain step/cap (0.5/1.5).
- PS: counterstrike bonus (+2 ATT/+1 dmg), window length (1 exchange).
- WS: attrition floor (+0.5 dmg).
- BA: `parDegrade` per hit (0.5) and cap (−3).
- ST: front-load mult/decay (1.3→1.0 by exch 6), critChance bump, execute threshold/bonus (30% / +2).
- SL: bleed tick (1), decay (−1), cap (5), flurry strike count (2).
- Final `STYLE_PENALTIES` after each re-ratchet.

The _tests_ define done; no win rate is hard-coded.
