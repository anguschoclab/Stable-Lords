# combat-engine-reviewer journal

## 2026-02 sweep — exchange-resolution audit (main @ f6c44c141)

### Scope model vs. spec
The agent's invariant sheet (`hp < 0.3*maxHp AND endurance < 20` kill gate,
parry-only riposte) is the *original* Duel2 simplification. The current canon
is richer and **documented in-code** — treat these as deliberate, not bugs:

- Kill window = vital-loc gate + per-style `killWindowHpMult` (0.35–0.8) HP
  gate + graduated endurance bands in `calculateKillWindow`
  (`mechanics/damageCalc.ts`); constants + rationale in
  `constants/combat/combat/global.ts` (`KILL_WINDOW`, `DEATH_ROLL`).
- Riposte checks fire after parry (`handleSuccessfulDefense`), after dodge
  (`handleSuccessfulDodge`, `DODGE_RIPOSTE_MOD`), and on attacker whiff
  (`resolveWhiffRiposte`, `WHIFF_RIPOSTE_DEF_PENALTY`) — all canon-cited
  (Blackhawk, Arena 93) in `offenseDefense/defense.ts`.
- RNG is three seeded streams: bout `ctx.rng`, `disarmRng`, narration rng —
  all XOR-derived from one seed (`simulate/simulateFight.ts` ~L54–60).
  `crypto.getRandomValues` only when a bout is run with no seed at all.
- Bout end after hp≤0 falls through to `emitDownedBoutEnd`
  (`mechanics/downedFighterEnd.ts`) — the single catch-all invoked once per
  exchange tail with a caller-supplied cause.

### Findings this pass
- **Riposte / off-hand KO cause misattribution** (reported, not fixed):
  `executeRiposte` and `tryOffhandAttack` can drop hp≤0 with no BOUT_END;
  the exchange-tail `emitDownedBoutEnd(fA,fD,events,'BLEED')` catches it, so
  `causeBucket='BLEED'` and `fatalHitLocation` is lost. Edge case: if the
  victim also hit end≤0 the same exchange, `checkExhaustionStoppage` runs
  first and emits 'Stoppage', masking the KO entirely. Fix needs a true
  cause (or in-path BOUT_END like `handleSurvivalStrike`'s 'SURVIVAL_STRIKE')
  — touches the event stream, so left for a deliberate change.
- **Fixed**: stale JSDoc in `exchangeSubPhases.ts` — Full commit documented
  `+2 ATT`; code intentionally `attBonus: 1` since dc46a07e. Comment corrected.
- Minor note: `generateInjury` unseeded fallback
  (`fatalExchangeIndex + charCode`) is degenerate; production always passes
  `boutSeed` via `handleInjuries` — no action.

### Verified clean
- Exchange order: approach → initiative (contestCheck, opening-clash loop on
  ex 0) → feint → commit → attack check → dodge/parry → damage (armor+flat
  mitigation+protect/shield) → endurance drain both fighters (each fighter's
  own encumbrance/weapon mult on their own drain) → kill window.
- Passives: `getStylePassive` returns fresh objects (`...EMPTY_PASSIVE`
  spread) — the `parBonus += getWallHarmonyBonus` mutation in
  `resolveStylePassives` is per-exchange safe; one passive field per check,
  no cross-fighter stacking.
- Doomed path: defense check skipped (canon "run down their hp"), crit
  suppressed, vitals-only hit locations; attack check still rolls to keep
  the stream's shape.
- Doomed/survival-strike `Math.max(0,…)` floors: off-hand clamps hp at 0;
  main hits do not clamp (needed for `hp < 0` gates) — consistent.
