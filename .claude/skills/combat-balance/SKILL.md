---
name: combat-balance
description: >-
  Methodology and exact code map for changing combat balance or fighting-style
  mechanics in the Stable Lords engine. Use this whenever the task touches
  fighting styles, win conditions, the matchup matrix, STYLE_PENALTIES, style
  passives, weapon/favorite effects, the balance harness, or adding / tuning /
  nerfing / buffing any per-style combat mechanic — even when the user only says
  "rebalance X", "make style Y stronger", "why is Z overpowered", "add a mechanic
  to <style>", or is editing src/engine/combat, src/engine/skillCalc.ts, or
  src/constants/combat. Reach for it before writing any combat-engine change so
  the two balance layers stay decoupled and the guardrail harness stays green.
---

# Stable Lords — Combat Balance

This engine reached a stable state by separating two concerns that used to be
tangled. Almost every balance mistake here comes from re-tangling them, or from
skipping the regression gate. This skill keeps you on the rails.

**Tooling:** Bun, not npm/node. Run one test file with `npx vitest run <path>`;
typecheck with `bunx tsc --noEmit --project tsconfig.app.json`. Wrap paths with
spaces in double quotes.

## The one idea: two orthogonal layers

| Concern | Lives in | Means |
|---|---|---|
| **Absolute power** — is a style globally over/under-tuned? | `STYLE_PENALTIES` in `src/engine/skillCalc.ts` (`[ATT,PAR,DEF,INI,RIP,DEC]` per style) | how strong a style is *on average* |
| **Matchup identity** — who counters whom? | `MATCHUP_MATRIX` in `src/constants/combat/combat.ts` | the rock-paper-scissors edges |

The matrix is kept **near-antisymmetric** (if A beats B by +x, B is −x vs A). Its
job is *only* relative matchups. The moment you encode "style X is weak" by making
its whole matrix row negative, you have smuggled absolute power into the wrong
layer — and every later matchup tune fights that distortion. Fix *power* in
`STYLE_PENALTIES`; fix *matchups* in the matrix. Never cross them.

A guardrail enforces this: `findAntisymmetryViolations()` in `combat.ts` fails the
build if any matrix pair sums outside ±1. If you change the matrix and it trips,
you put power in the wrong place.

## The guardrail harness is the definition of "balanced"

`src/test/engine/economy/balance.test.ts` runs ~10k headless fights with identical
attributes per style, then asserts:

- **Antisymmetry** — matrix carries no absolute-power bias (tolerance 1).
- **Mirror-match band** — each style's self-match ≈ 50% (catches engine A/D bias).
- **Absolute-power band** — every style's overall win rate in **[0.40, 0.60]**.
- **Kill-rate** — global kills in ~[4.5%, 16%].

These bands are tunable constants in `combat.ts` (`ABSOLUTE_POWER_LOW/HIGH`,
`MIRROR_MATCH_BAND`, `MATRIX_ANTISYMMETRY_TOLERANCE`). "Balanced" is not a vibe —
it is this file passing. There is also a live `src/scripts/simulation-harness.ts`
+ daily balance report; prefer measuring over guessing.

## Identity is *shape*, not *level*

When you buff or nerf a style, change its **level** (how often it wins) via the
re-ratchet — never flip its **shape** (its relative skill profile). The
`STYLE_PENALTIES` comments encode each style's identity ordering: PR keeps RIP as
its least-penalised skill, ST stays ATT-led, TP stays PAR-heavy, WS stays the
slowest (INI low), SL keeps INI. Preserve those orderings. See
`references/style-identities.md` for the full table and each style's win condition.

## Win conditions: payoff, not penalty (anti-flatten)

A weak style whose identity is expressed as a raw penalty feels bad and drags its
matrix row. The fix that *deepens* variety instead of flattening it: give the
style a **conditional payoff** — a mechanic that rewards its identity under the
right conditions. Each style then wins on a *different axis* (precision / attrition
/ tempo / counter / DPS / DoT), so balance is a Pareto frontier of viable
strategies, not one number equalized ten ways. Every style already has such a
mechanic; `references/style-identities.md` lists them.

## The standard shape of a per-style mechanic change

Follow this exact sequence — it is how all ten current mechanics were built, and
it keeps changes small, testable, and reversible:

1. **Ground first.** Read the real hook before writing. `references/hook-map.md`
   has the file/symbol map; confirm line numbers with `grep` (they drift).
2. **Constant** for every magnitude → `src/constants/combat/combat.ts`. No bare
   numbers in logic; magnitudes are knobs the harness tunes.
3. **Pure helper** in `src/engine/combat/resolution/` (e.g. `guardBreak.ts`,
   `bleed.ts`, `strikingAttack.ts`). Style-gated, returns the no-op value for
   other styles. Unit-test it in isolation — this is your TDD core.
4. **State field** (only if the mechanic spans exchanges) on `FighterState`
   (`src/engine/combat/resolution/types.ts`) + initialise in
   `src/engine/bout/fighterState.ts`. The `survivalStrike` field is the precedent
   for a one-exchange flag.
5. **Wire** the helper at the real hook (damage in `hitExecution.ts`, riposte in
   `styleRiposteBonus`, per-exchange tick before `resolveExchange` returns, ATT at
   the `performAttackCheck` site, defense penalty via `extraDefPenalty`).
6. **Integration test** with `simulateFight` asserting a directional floor (e.g.
   "BA favored vs TP"), not an exact rate.
7. **Re-ratchet** (mandatory). The mechanic shifts power, so adjust only the
   affected style's `STYLE_PENALTIES` row until the absolute-power band passes
   again. The matrix stays untouched, so antisymmetry stays green. For
   already-strong styles (BA, ST) this is the anti-power-creep step — do not skip
   it.

## Verification discipline — the gate that gets skipped

The recurring failure mode in this codebase is shipping with only the *targeted*
tests green. It bit us twice: symmetrizing the matrix silently broke
`schedulingAssistant.test.ts` (it asserts on matrix-derived scores), and ST's
lethality broke a knockdown-narration test (heavy hits now *kill* low-HP
defenders instead of knocking them down). Both would have been caught by the full
suite.

So, before calling any balance change done:

- Run the **whole** suite: `npx vitest run` (not just your new file). Other code
  consumes `getMatchupBonus`, damage magnitudes, and HP timing.
- `bunx tsc --noEmit --project tsconfig.app.json` → 0 errors.
- Confirm all four harness guardrails pass, and that **all ten** styles are in the
  40–60% band (not just the one you touched).
- **Independently measure** any win-rate claim with a throwaway `bunx tsx` script
  over `simulateFight` rather than trusting a number — seeds and positions matter
  (e.g. PS-vs-BA reads ~20% as A-side, which is why its test floor is 15%, not 30%).

## Off-limits (canon)

Do **not** rebalance the weapon-vs-style suitability matrix (CW/W/M/U) or mortality
data — these are intentional Terrablood canon, even where they look "unfair." Work
in the tunable layers only: `STYLE_PENALTIES`, `MATCHUP_MATRIX`, style
passives/helpers, aging, favorites, traits. When unsure whether something is canon,
check the project memory notes (`combat-balance-canon`, `terrablood-weapon-tables`).

## References

- `references/hook-map.md` — exact files/symbols for every place a mechanic plugs
  in (damage pipeline, riposte, exchange tick, attack check, defense penalty,
  FighterState fields, constants, the harness). Read this before wiring anything.
- `references/style-identities.md` — the ten styles: identity, current win
  condition, and the `STYLE_PENALTIES` shape to preserve when re-ratcheting.
