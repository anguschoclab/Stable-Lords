<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN V22 DEFERRED — Noblish Island Canon Integration

Work deliberately deferred out of V22. Each item is ledger-registered and
needs its own pass — most are structural changes or design decisions, not
fixes. Findings: `MEGAPLAN_V22_FINDINGS.md` · Plan: `MEGAPLAN_V22_PLAN.md` ·
Ledger: `MEGAPLAN_V22_LEDGER.md` · Restore tag: `pre-megaplan-v22`.

> **V23 update:** D1 (dual-wield) and D2 (trains-burn) were pulled into the
> V23 Arena-93 pass and landed (commits `46e26119`, `c967fbb9`). Entries
> below are kept for history; §3 watch items re-baselined under V23
> mechanics (world-diag 1000wk seed 12345).

## §1 Structural items (own implementation pass each)

### D1 — Off-hand / dual-wield combat (finding C14) — ✅ LANDED V23

- **Canon:** SP+DF>31 → "Very High Coordination"; +either>14 → "weapon in
  each hand" profile line and a free off-hand shot in combat.
- **State:** `computeCoordination` tiers exist (off-by-one at 16; extra
  non-canon tiers 28/40) and render on the dossier; the off-hand mechanic
  and its profile statement are missing; dual-wield data dead.
- **Done ahead of the model:** `Warrior.handedness` persisted + rolled at
  all 6 creation sites; ambidextrous +1 ATT baked into base skills;
  `dualWieldReqAmbi` confirmed live in `checkWeaponRequirements` — but only
  consumed when `wield: 'dual'` is explicitly passed, and no caller does.
- **Needs:** a loadout model (`wield: 'single' | 'dual'`, off-hand weapon
  slot), the off-hand attack path in resolution (VHC gate → free off-hand
  shot), equipment requirement wiring through `checkWeaponRequirements`'s
  ambidextrous option, balance ratchet.
- **Entry points:** `src/engine/equipment/weaponRequirements.ts`,
  `src/engine/combat/resolution/`, `src/engine/factories/warriorFactory.ts`
  (handedness already rolled), `src/types/warrior.types.ts`.
- **V23 landed:** `EquipmentLoadout.offhand` + `validateLoadout` legal
  states (weapon / weapon+shield / two weapons — `DUAL_WITH_SHIELD` +
  `TWO_HANDED_WITH_OFFHAND` blocks), `tryOffhandAttack` VHC gate +
  `OFFHAND_ATTACK` event wired into `runAttackExchange`, off-hand counted
  in `getLoadoutWeight` (backup stays uncounted), off-hand arm-drop via
  the side-gated disarm, item-declared parry-side mods baked in fighter
  state. Commit `46e26119`; specs `dualWield.test.ts` +
  `loadout.validation.test.ts` (14/14 green).

### D2 — Trains-burn-skills economy (finding E2) — ✅ LANDED V23

- **Canon:** stat trains burn future skill learns; ST 7–14 and CN trains
  are free.
- **State:** no shared skills/trains budget exists — stat training is
  strictly upside (costs only the lost bout). Implementing it inverts the
  current "skills first" player doctrine.
- **Needs:** a design decision first (does the inversion serve this game?),
  then a training-budget model + world calibration.
- **Entry points:** `src/engine/training/`, training-gain pipeline passes.
- **V23 landed:** generic breakpoint-delta burn — `breakpointBurns` counts
  `bp(table,new) − bp(table,old)` per skill table; ST≤14 and CN freedom
  emerge from the tables (no special-casing). `burnedSkills` ledger on
  Warrior; `effectiveLearnCap` gates the bout learn pool — a fully-burned
  skill is never taught. Wired into `applyAttributeGain` + advisor copy.
  Commit `c967fbb9`; spec `trainsBurn.test.ts` (11/11 green).

### D3 — Pagan literal damage model (finding C15)

- **Canon:** damage = ST + class-variance + weapon-variance; armor soak =
  weight + 12 + type-bonus; damage ≤1 → bounce (min 1).
- **State:** current model is `(class+4)×loc×variance +heft` with type-mod +
  flat mitigation — same shape, different parameters. Min-1 bounce and
  glancing lines exist. The fixed-threshold secondary-damage channel
  landed (`DAMAGE_HARD_HIT` = 15, commit `bd02209c`).
- **Needs:** a soak rework pass — swap soak constants to the literal Pagan
  model and re-verify damage/KO/kill distributions end-to-end.
- **Entry points:** `src/engine/combat/mechanics/damageCalc.ts`,
  `src/engine/combat/resolution/weaponArmor.ts`.

### D4 — ADM / graduation tier (finding E5)

- **Canon:** basic caps 3–21, ADM caps 3–25; WL>21 grants INI bonus;
  graduation is a separate advancement tier.
- **State:** 3–25 throughout, no ADM tier, WL>21 grants nothing.
- **Needs:** this is a feature (new tier + graduation flow), not a fix.
- **Entry points:** attribute caps in `skillCalc.ts`/training passes,
  new graduation pipeline.

## §2 Adjudicated-keep (documented divergences, no action unless revisited)

- **Rolled-base+14 creation (D1)** — flat 70-pt allocation + editable SZ
  stays; documented house rule.
- **Rhythm always-on (F10)** — the `discovered` gate stays: it's a
  spec-pinned knowledge-reward design (learn the rhythm, then fight at
  it). Canon has no discovery layer; this is the project's own mechanic.
- **Encumbrance top-end (C12)** — `ENC_TABLE` (Terrablood class chart)
  stays the class-letter source; the article formula `ST+min(ST,CN)−6` is
  an alternative canon source that *disagrees on cells* (ST10/CN10 →
  B-band vs table A) — no consistent merger exists. Swapping the capacity
  number to the formula reshapes every warrior's `encumbrancePenalty`:
  its own ratchet pass if encumbrance economics are revisited. Divergent
  cell: 25/25 → 36 vs 44.
- **Numeric skills shown** — canon hides them; the dossier shows numbers.
  Deliberate product choice.

## §3 Watch items — V23 re-baseline (world-diag 1000wk seed 12345, V23 mechanics)

- **TP world dominance — 62.9%** (was 61.9% V22 — slow climb, not a spike).
  Same emergent flywheel: walls survive → drill accrual (4.1 drills/fight,
  66.1 avg career fights vs ~12–30 elsewhere) → veteran dominance
  (68.6% at 26+, 74.4% vs greener), pop share 6.7→10.5% by era. V23 pulled
  the combat levers to their FLAT-safe limits (PAR -2→-3, DEF -15→-16,
  BA/SL floors up) — snap proxy read ~69%. The registered lever stands:
  damp drill accrual or TP development, NOT combat numbers.
- **World kill 6.68% weekly / 5.81% tournament** (was 6.65% — flat). Still
  under the ~8% design floor; `KILL_WINDOW.SCALE` bumped 1.1→1.18 for the
  certified fixture (FLAT back to 9.3%). Watch whether the world floor
  responds on the next world run.
- **LU 42.7%** — new bottom-of-band watch (lowest overall rate; weak vs
  TP 16.1% in matrix). Floor candidates if it dips under 40.
- **PR 55.8%** — second-highest, approaching the band edge (snap proxy
  read 58–60%); small penalty nudge (-1 PAR) already applied for V23.

## §4 Environment notes

- Slow-suite flakes observed under concurrent load: `killDeathDivergence`
  (605s > 600s timeout), perf 160-stable ceiling, autosim timing,
  worldLiveness gradient — each passes standalone; re-run clean before
  assuming a regression.
- `docs/ORPHAN_REPORT.md` is regenerated by the scan; treat as a report
  artifact, not source.
