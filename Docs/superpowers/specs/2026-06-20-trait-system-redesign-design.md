# Trait System Redesign — Master Design Spec

**Date:** 2026-06-20
**Status:** Approved design — ready for decomposition into implementation plans
**Related skill:** `.claude/skills/combat-balance` (traits are a balance lever; the
40–60% harness band and re-ratchet discipline apply).

## Summary

Traits move from a fixed-at-birth RNG roll to a **tiered, developable, identity-
deepening attribute** that also becomes the engine for **roster churn** and
**emergent NPC stable behavior**. Five interlocking systems:

1. **Trait foundation** — 4 positive tiers + a Flaw pool; data-model fields
   (`tier`, `sign`, `styles`); **~98 traits total** (≈36 generic positive + 50
   class + 12 flaws), of which 50 class traits and ~10 flaws are new.
2. **Sparse starts** — most warriors are born blank.
3. **Trait training** — a risk/reward trainer loop (random from the trainer's pool).
4. **Churn / liability** — flaw load makes a warrior a cut candidate.
5. **NPC stable AI** — personality-driven keep / train / cut, producing visibly
   different rival behavior.

Every trait ships with **tooltip text**. Magnitudes (training odds, weeks, tier
difficulty, churn thresholds) are knobs tuned via the economy/oracle sim — the
_tests and guardrails_ define "done."

---

## System 1 — Trait foundation

### 1.1 Tiering (mirrors `potential`'s RecruitTier ladder)

Tier = the effect's power budget. Positive traits occupy four tiers; negatives are
a separate **Flaw** class (sign `−`). Each trait in `src/engine/traits.ts` gains:

```ts
tier: 'Common' | 'Notable' | 'Exceptional' | 'Signature' | 'Flaw';
sign: 'positive' | 'negative';
styles?: FightingStyle[];   // present ⇒ class-restricted
```

Tier budget guide:

- **Common** — one +1, single axis.
- **Notable** — a +2 conditional, +1 dmg, or two +1s.
- **Exceptional** — a `fightPlanMod` reshape + 1–2 attribute bonuses, or strong
  conditional combat effect.
- **Signature** — big `fightPlanMod` swing + 2 attributes, or a class capstone.
- **Flaw** — a penalty (sign `−`); produced by botched training and rare bad starts.

Existing 39 traits are bucketed in **Appendix A**. The Flaw pool is expanded from 2
to ~12 so botches have variety.

### 1.2 Class-specific traits — 5 per class (50 new)

A trait with a `styles` array only generates / trains for warriors of those styles,
and the higher tiers can only be taught by a **matching-specialty or Master**
trainer. Each class gets a 5-pack spread **Common · Notable · Notable · Exceptional
· Signature**, themed to that style's win condition (see
`.claude/skills/combat-balance/references/style-identities.md`). Full effects +
tooltips in **Appendix B**. Roster:

| Class  | Common            | Notable         | Notable          | Exceptional      | Signature       |
| ------ | ----------------- | --------------- | ---------------- | ---------------- | --------------- |
| **AB** | steady_hand       | called_shot     | armor_chink      | dead_aim         | assassin        |
| **BA** | heavy_swing       | relentless      | bonebreaker      | juggernaut       | demolisher      |
| **LU** | quickdraw         | fleet_footed    | lightning_step   | blitz            | untouchable     |
| **PL** | counterlunge      | fighting_rhythm | riposte_flow     | duelist          | whirlwind       |
| **PR** | riposte_natural\* | vindicator      | parry_master     | nemesis          | retribution     |
| **PS** | counterpuncher    | opportunist     | riposte_strike   | counter_artist   | perfect_counter |
| **SL** | keen_edge         | flurry          | lacerate         | hemorrhage       | exsanguinate    |
| **ST** | crushing_blow     | opener          | executioner      | berserker_rush   | annihilator     |
| **TP** | enduring          | stonewall       | war_of_attrition | immovable_object | unbreakable     |
| **WS** | braced            | bulwark         | anchor           | fortress         | living_wall     |

(\*`riposte_natural` reassigned from the generic pool to PR.) **First version** uses
existing `TraitEffect` fields, themed + style-restricted (no new combat hooks).
Mechanic-amplifying variants (e.g. `executioner` widening ST's execute, `hemorrhage`
adding SL bleed stacks) are a noted follow-on requiring new `TraitEffect` fields.

### 1.3 Balance guardrail

The base style harness (`balance.test.ts`) runs trait-free, so this feature is
**orthogonal** to the 40–60% band. Trained traits add real player power, so extend
`src/test/engine/combat/traitBalance.test.ts`: a max loadout (3 traits incl. a
class Signature, on its own style) must not exceed a **~70–75% win-rate ceiling**
versus an untraited peer. Bounds progression so it is meaningful, not broken.

---

## System 2 — Sparse starts

Rewrite `generateTraits` (consumed at `src/engine/factories/warriorFactory.ts:43`):

- **~68%** start with **0 traits**.
- **~25%** start with **1** trait, drawn from **Common / Notable only** (never
  Exceptional/Signature — those are earned), archetype- and style-weighted.
- **~7%** are born with a single **Flaw**.
- Never exceed 1 trait at birth (the 3-slot cap is reached through play).

Traits become something you _develop_. Existing archetype synergy weighting stays.

---

## System 3 — Trait training (risk/reward)

A new **Trait Training** assignment alongside attribute training: occupies a
warrior's training slot with a trainer for **N weeks** (~4–8 — a real commitment).
Pure logic lives in a new `src/engine/training/traitTraining.ts`, unit-tested.

### 3.1 Trainer ceiling and pool

The trainer's **tier gates the max trait tier**:

| Trainer tier   | Max trait tier reachable |
| -------------- | ------------------------ |
| Novice (1)     | Common                   |
| Apprentice (2) | Common–Notable           |
| Skilled (3)    | Notable                  |
| Expert (4)     | Exceptional              |
| Master (5)     | Signature                |

The **pool** of traits a session can yield = traits of tier ≤ the ceiling, themed
to the trainer's specialty/archetype, plus any **class trait** of the warrior's
style (high-tier class traits only from a matching-specialty or Master trainer).
The result is **random from this pool** (archetype-weighted toward the warrior) —
personality _emerges_; the player does not pick the specific trait.

### 3.2 Outcome roll (on completion)

```
successChance = BASE + trainerTier·k + aptitude − tierDifficulty
aptitude = synergyBonus            // target synergistic with warrior archetype
         + (WT + WL) / mindScale   // mental attributes
         + youthBonus(age)         // younger learn faster
         + trainability            // hidden per-warrior roll at birth (like potential)
```

Three outcomes:

- **Success** → gain a random positive trait from the pool (tier ≤ ceiling, weighted
  toward lower tiers; Signature is rare).
- **No result** → weeks spent, nothing gained.
- **Botch** → gain a **Flaw** (random from the Flaw pool). Botch probability rises
  with low aptitude and high target tiers.

`trainability` is a hidden `Warrior` field (0–1) rolled at recruitment, surfaced via
scouting like potential.

### 3.3 Conflicts and caps (see System 4) gate the result

If the rolled trait would exceed the cap or conflict with an existing trait, the
session resolves as **no result** (weeks spent). Botched flaws still apply if a slot
is free.

---

## System 4 — Caps, conflicts, permanence

- **Hard cap: 3 trait slots total.** Any combination of positives and flaws.
  Slots are scarce: a botched flaw permanently consumes one — this scarcity _is_ the
  churn pressure.
- **Max 1 personality trait** (a `fightPlanMod` trait) per warrior — two big OE/AL
  reshapes produce incoherent fighters. The other slots are combat/class traits.
- **Conflict groups** block contradictory pairs (`quick`/`slow`, `agile`/`fragile`,
  `aggressive`/`evasive`, etc.). A rolled conflict ⇒ no result.
- **Permanent.** No removal or rehab — every training decision is high-stakes,
  matching the permadeath tone. A flaw-loaded warrior is a permanent liability.

---

## System 5 — Churn / liability

A **liability score** per warrior:

```
liability = Σ flawWeight(tier) − value(positive traits, skills, fame)
```

A warrior with **2+ flaws** (i.e. most of 3 slots wasted) reads as a cut candidate.

- **Player:** the roster surfaces a **liability badge / "consider releasing"** hint
  with the reason (which flaws). A signal, not a forced action — the player keeps
  agency.
- **NPC:** rival stables run a periodic roster review and auto-cut warriors above
  their personality threshold (System 6), freeing slots → recruiting → churn.

This raises baseline roster turnover (a stated goal): risky training that botches
produces liabilities that get cut, feeding recruitment demand.

---

## System 6 — NPC stable AI (the emergent layer)

Each rival stable's personality maps to **trait-policy knobs**, so rivals behave
visibly differently. Hooks into the existing rival-stable AI strategist/personality
(confirm the exact structure during planning):

| Personality               | cut threshold        | training appetite | risk tolerance           | targets                  |
| ------------------------- | -------------------- | ----------------- | ------------------------ | ------------------------ |
| **Ruthless / win-now**    | low (cut fast)       | high              | bold (high-tier gambles) | Signature & class traits |
| **Loyal / developmental** | high (keep, develop) | medium            | cautious                 | safe Notables            |
| **Frugal**                | medium               | low (saves money) | low                      | rarely trains            |
| **Prestige-chaser**       | low                  | very high         | bold                     | Signature stars          |

Each week/season, an NPC stable: (a) evaluates each warrior's liability vs its cut
threshold and releases the worst; (b) per its training appetite + risk tolerance,
assigns trait training to promising warriors targeting its preferred tiers. Emergent
result: ruthless stables churn fast and field clean fighters; frugal/loyal stables
carry flawed veterans; prestige stables mint occasional Signature stars _and_ more
botch-flawed cuts. The player perceives rivals as having distinct philosophies.

---

## System 7 — Tooltips & surfacing (UI)

**Contract:** every trait (all 62) MUST have a player-readable `description` —
plain-language mechanical effect + short flavor (the existing field; the roster
appendix supplies one per trait so none is missing). A schema/test asserts no trait
has an empty description.

A reusable **`TraitBadge` / trait-tooltip** component renders: trait name, **tier
color** (Common→Signature gradient, Flaw in a warning color, like potential grades),
a **class tag** if `styles`-restricted, and the description on hover/tap. Used
everywhere traits appear: warrior detail, the trainer/training screen (showing the
trainer's pool + ceiling + the warrior's aptitude estimate and success/botch odds),
and the roster liability badge.

---

## Decomposition & build order

One system per implementation plan, in dependency order:

1. **Trait foundation** — data-model fields, the 50 class traits + expanded flaws
   (Appendices A/B), description contract, balance-guardrail extension. _Everything
   depends on this._
2. **Sparse starts** — `generateTraits` rewrite.
3. **Trait training** — `traitTraining.ts` + the training-assignment mode + trainer
   ceiling/pool.
4. **Churn / liability** — liability scoring + player-facing badge.
5. **NPC stable AI** — personality → trait policy in the rival AI.

UI (System 7) lands incrementally with each system (the badge with #1, the training
screen with #3, the liability badge with #4).

---

## Appendix A — Existing 39 traits, bucketed

| Tier                | Traits                                                                                                                                                                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Common**          | quick, agile, precise, riposte_natural→(reassigned PR), bloodthirsty, comboartist                                                                                                                                                                                           |
| **Notable**         | patient, berserker, stalwart, disciplined, feral_instinct, gutter_rat, cornered_beast, perceptive, vengeful, stoic, heavy_handed, ironlung, cold_eyed; _volatile:_ iron_grip, paranoid                                                                                      |
| **Exceptional**     | aggressive, disciplined_mind, cunning, sturdy, calculated, resilient                                                                                                                                                                                                        |
| **Signature**       | feral, merciless, evasive, brutal, blood_drunk                                                                                                                                                                                                                              |
| **Flaw (existing)** | fragile (−2 def), slow (−1 ini)                                                                                                                                                                                                                                             |
| **Flaw (new)**      | glass_jaw (−2 par), hesitant (−1 dec), short_winded (×1.08 end), timid (`fightPlanMod` OE−3/kd−5), predictable (−rip, −feint), brittle (−1 def, −endurance), wild (−dec, erratic AL), coward (`fightPlanMod` killDesire−10), clumsy (−1 att), thin_skinned (defModLowHp −2) |

Each retains its existing `description` (tooltip). New flaws get tooltips in
implementation (effect + flavor).

## Appendix B — 50 class traits (effects + tooltips)

Effects use existing `TraitEffect` fields, themed and `styles`-restricted. Tooltip =
plain effect + flavor. The implementation plan for System 1 enumerates the full
`TraitEffect` for each; the design intent per class:

- **AB (precision):** steady_hand `decMod+1`; called_shot `dmgBonus+1`; armor_chink
  `dmgBonus+1` (vs armor flavor); dead_aim `dmgBonus+1, decMod+1`; assassin
  `dmgBonus+1, killWindowBonus+0.01, decMod+1`.
- **BA (guard-break):** heavy_swing `dmgBonus+1`; relentless `attModLate+1`;
  bonebreaker `dmgBonus+1, attModLate+1`; juggernaut `dmgBonus+1, enduranceMult 0.95`;
  demolisher `dmgBonus+2, attModLate+1`.
- **LU (tempo):** quickdraw `iniMod+1`; fleet_footed `iniModFresh+2`; lightning_step
  `iniMod+1, iniModFresh+1`; blitz `iniMod+1, attModConsecutiveHits+1`; untouchable
  `iniMod+2, defMod+1`.
- **PL (reactive tempo):** counterlunge `ripMod+1`; fighting_rhythm
  `attModConsecutiveHits+1`; riposte_flow `ripMod+1, attModConsecutiveHits+1`;
  duelist `ripMod+1, dmgBonus+1`; whirlwind `ripMod+2, attModConsecutiveHits+1`.
- **PR (counter):** riposte_natural `ripMod+1`; vindicator `ripMod+1, dmgBonus+1`;
  parry_master `parMod+1, ripMod+1`; nemesis `ripMod+2, dmgBonus+1`; retribution
  `ripMod+2, dmgBonus+1, decMod+1`.
- **PS (defend→strike):** counterpuncher `attModConsecutiveHits+1`; opportunist
  `attModHighHp-style via parModHighHp+1, attModConsecutiveHits+1`; riposte_strike
  `ripMod+1, attModConsecutiveHits+1`; counter_artist `parMod+1,
attModConsecutiveHits+2`; perfect_counter `parMod+1, ripMod+1,
attModConsecutiveHits+2`.
- **SL (bleed):** keen_edge `dmgBonus+1`; flurry `attModConsecutiveHits+1`; lacerate
  `dmgBonus+1, attModConsecutiveHits+1`; hemorrhage `dmgBonus+1,
attModConsecutiveHits+2`; exsanguinate `dmgBonus+2, attModConsecutiveHits+1`.
- **ST (burst):** crushing_blow `dmgBonus+1`; opener `attMod+1` (opening-weighted);
  executioner `attModLowHp+2`; berserker_rush `attModLowHp+2, dmgBonus+1`;
  annihilator `attModLowHp+3, dmgBonus+1, killWindowBonus+0.01`.
- **TP (outlast):** enduring `enduranceMult 0.92`; stonewall `defModLate+2`;
  war_of_attrition `defModLate+2, enduranceMult 0.95`; immovable_object
  `defModLate+2, parModLate+1`; unbreakable `defModLate+2, parModLate+2,
enduranceMult 0.95`.
- **WS (wall):** braced `parMod+1`; bulwark `parMod+1, defMod+1`; anchor `parMod+2`;
  fortress `parMod+2, defMod+1`; living_wall `parMod+2, defMod+2`.

These are starting values; the System 1 plan tunes them against the trait-balance
ceiling. Personality (`fightPlanMod`) class traits are intentionally avoided here so
each class trait stacks cleanly under the 1-personality-trait rule.
