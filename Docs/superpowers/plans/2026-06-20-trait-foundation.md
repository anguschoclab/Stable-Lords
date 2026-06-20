# Trait Foundation (System 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the trait data foundation — add `tier`/`sign`/`styles` to the trait model, tag the existing 39 traits, add ~10 new flaws and **50 class-specific traits (5 per style)**, enforce a well-formedness contract (every trait has a tooltip), and bound trained-trait power with a max-loadout balance ceiling.

**Architecture:** Traits live in `src/engine/traits.ts` (`TRAITS: Record<string, TraitDef>`). We extend `TraitDef` with `tier`, `sign`, and an optional `styles` restriction, then add bulk content via two focused data modules (`src/engine/traitData/flaws.ts`, `src/engine/traitData/classTraits.ts`) spread into `TRAITS` to keep the main file readable. Invariant + coverage tests act as the TDD spec for the content; the existing `traitBalance.test.ts` Monte-Carlo battery is extended with a max-loadout ceiling so trained power stays meaningful, not broken.

**Tech Stack:** TypeScript, Bun (`bun`/`bunx` — never npm/node), Vitest. Run one file with `npx vitest run <path>`; typecheck with `bunx tsc --noEmit --project tsconfig.app.json`.

**Scope:** System 1 of the trait redesign (`docs/superpowers/specs/2026-06-20-trait-system-redesign-design.md`). It builds the data only. Sparse starts (System 2), the training loop (System 3), churn (System 4), NPC AI (System 5), and UI (System 7) are separate plans that consume this foundation. Conflict groups belong to System 3/4 and are not built here.

**Canon guardrail:** Per `.claude/skills/combat-balance` — traits are a balance lever. The base style harness runs trait-free and is unaffected; this plan's only balance gate is the trait-loadout ceiling (Task 7).

---

## File Structure

- **Modify** `src/engine/traits.ts` — extend `TraitDef` (`tier`/`sign`/`styles`); backfill the 39 existing traits; spread in the new data modules; add `traitsForStyle` / `traitsByTier` accessors.
- **Create** `src/engine/traitData/flaws.ts` — the new Flaw entries.
- **Create** `src/engine/traitData/classTraits.ts` — the 50 class traits.
- **Create** `src/test/engine/traits/traitInvariants.test.ts` — well-formedness + class coverage contract.
- **Create** `src/test/engine/traits/traitAccessors.test.ts` — accessor tests.
- **Modify** `src/test/engine/combat/traitBalance.test.ts` — add the max-loadout ceiling.

---

## Task 1: Extend the trait data model

**Files:**
- Modify: `src/engine/traits.ts`

- [ ] **Step 1: Add the tier/sign types and extend `TraitDef`**

In `src/engine/traits.ts`, above `interface TraitDef`, add:

```typescript
import type { FightingStyle } from '@/types/shared.types';

export type TraitTier = 'Common' | 'Notable' | 'Exceptional' | 'Signature' | 'Flaw';
export type TraitSign = 'positive' | 'negative';
```

Add three fields to `interface TraitDef` (keep existing fields):

```typescript
  /** Power-budget tier, mirroring potential's RecruitTier ladder. 'Flaw' ⇒ negative. */
  tier: TraitTier;
  /** Whether the net effect helps or hurts. Flaws are always 'negative'. */
  sign: TraitSign;
  /** If present, the trait is class-restricted: only warriors of these styles
   *  can roll/train it, and it only appears in matching trainers' pools. */
  styles?: FightingStyle[];
```

Making `tier`/`sign` required will break `tsc` until Step 2 backfills — that is the failing state.

- [ ] **Step 2: Backfill `tier` + `sign` on all 39 existing traits**

Add `tier:` and `sign:` to every existing entry in `TRAITS` per this mapping (from the spec's Appendix A). All are `sign: 'positive'` except the two flaws:

| tier | trait ids |
|---|---|
| `Common` | quick, agile, precise, bloodthirsty, comboartist |
| `Notable` | patient, berserker, stalwart, disciplined, feral_instinct, gutter_rat, cornered_beast, perceptive, vengeful, stoic, heavy_handed, ironlung, cold_eyed, iron_grip, paranoid |
| `Exceptional` | aggressive, disciplined_mind, cunning, sturdy, calculated, resilient |
| `Signature` | feral, merciless, evasive, brutal, blood_drunk |
| `Flaw` | fragile *(sign: 'negative')*, slow *(sign: 'negative')* |

`riposte_natural` is intentionally **omitted** here — it is reassigned to PR in Task 3 (it moves to `classTraits.ts`). Delete its existing entry in this step.

Example (each entry gains two lines):

```typescript
  quick: {
    id: 'quick',
    name: 'Quick',
    description: '+1 initiative — naturally fast on the draw.',
    effect: { iniMod: 1 },
    weight: 1.0,
    tier: 'Common',
    sign: 'positive',
  },
```

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: `0` (every trait now has `tier`/`sign`; `riposte_natural` removed).

- [ ] **Step 4: Commit**

```bash
git add "src/engine/traits.ts"
git commit -m "feat(traits): add tier/sign/styles to TraitDef; tag existing traits"
```

---

## Task 2: The well-formedness contract (TDD)

**Files:**
- Create: `src/test/engine/traits/traitInvariants.test.ts`

- [ ] **Step 1: Write the contract test**

```typescript
import { describe, it, expect } from 'vitest';
import { TRAITS } from '@/engine/traits';

const VALID_TIERS = ['Common', 'Notable', 'Exceptional', 'Signature', 'Flaw'];

describe('trait invariants', () => {
  it('every trait has a non-empty tooltip description', () => {
    const missing = Object.values(TRAITS).filter((t) => !t.description || t.description.trim().length < 5);
    expect(missing.map((t) => t.id)).toEqual([]);
  });

  it('every trait has a valid tier and matching sign', () => {
    for (const t of Object.values(TRAITS)) {
      expect(VALID_TIERS, `${t.id} tier`).toContain(t.tier);
      const expectedSign = t.tier === 'Flaw' ? 'negative' : 'positive';
      expect(t.sign, `${t.id} sign`).toBe(expectedSign);
    }
  });

  it('id matches the map key and name is present', () => {
    for (const [key, t] of Object.entries(TRAITS)) {
      expect(t.id, `key ${key}`).toBe(key);
      expect(t.name?.length ?? 0, `${t.id} name`).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run it — expect PASS**

Run: `npx vitest run src/test/engine/traits/traitInvariants.test.ts`
Expected: PASS (Task 1 tagged everything). If a description is too short, lengthen it — this is the tooltip contract.

- [ ] **Step 3: Commit**

```bash
git add "src/test/engine/traits/traitInvariants.test.ts"
git commit -m "test(traits): well-formedness + tooltip contract"
```

---

## Task 3: New flaws + reassign riposte_natural

**Files:**
- Create: `src/engine/traitData/flaws.ts`
- Modify: `src/engine/traits.ts`

- [ ] **Step 1: Create the flaw data module**

`src/engine/traitData/flaws.ts`:

```typescript
import type { TraitDef } from '@/engine/traits';

/** New negative traits — the botch/bad-start pool. Each has a tooltip. */
export const NEW_FLAWS: Record<string, TraitDef> = {
  glass_jaw:     { id: 'glass_jaw',     name: 'Glass Jaw',     description: '−2 parry — a fragile guard that buckles under pressure.',           effect: { parMod: -2 },                       weight: 0.4, tier: 'Flaw', sign: 'negative' },
  hesitant:      { id: 'hesitant',      name: 'Hesitant',      description: '−1 decisiveness — second-guesses the opening.',                     effect: { decMod: -1 },                       weight: 0.4, tier: 'Flaw', sign: 'negative' },
  short_winded:  { id: 'short_winded',  name: 'Short-Winded',  description: '×1.08 endurance cost — tires quickly.',                             effect: { enduranceMult: 1.08 },              weight: 0.4, tier: 'Flaw', sign: 'negative' },
  timid:         { id: 'timid',         name: 'Timid',         description: 'Fights cautiously — lower aggression and killing intent.',          effect: { fightPlanMod: { OE: -3, killDesire: -5 } }, weight: 0.4, tier: 'Flaw', sign: 'negative' },
  predictable:   { id: 'predictable',   name: 'Predictable',   description: '−1 riposte — easy to read, slow to counter.',                       effect: { ripMod: -1 },                       weight: 0.4, tier: 'Flaw', sign: 'negative' },
  brittle:       { id: 'brittle',       name: 'Brittle',       description: '−1 defense and tires faster — a body that takes a toll.',           effect: { defMod: -1, enduranceMult: 1.05 },  weight: 0.35, tier: 'Flaw', sign: 'negative' },
  wild:          { id: 'wild',          name: 'Wild',          description: '−1 decisiveness — wastes openings on undisciplined swings.',         effect: { decMod: -1 },                       weight: 0.35, tier: 'Flaw', sign: 'negative' },
  coward:        { id: 'coward',        name: 'Coward',        description: 'Avoids the kill — sharply lower killing intent.',                   effect: { fightPlanMod: { killDesire: -10 } }, weight: 0.3, tier: 'Flaw', sign: 'negative' },
  clumsy:        { id: 'clumsy',        name: 'Clumsy',        description: '−1 attack — heavy-footed and imprecise.',                           effect: { attMod: -1 },                       weight: 0.4, tier: 'Flaw', sign: 'negative' },
  thin_skinned:  { id: 'thin_skinned',  name: 'Thin-Skinned',  description: '−2 defense when bloodied — falls apart once hurt.',                 effect: { defModLowHp: -2 },                  weight: 0.35, tier: 'Flaw', sign: 'negative' },
};
```

- [ ] **Step 2: Spread the flaws into TRAITS and re-home riposte_natural**

At the bottom of the `TRAITS` literal in `traits.ts`, after the existing entries, spread the module (use an explicit merge so `TRAITS` stays a single `Record`). Replace `export const TRAITS: Record<string, TraitDef> = { …existing… };` so it ends:

```typescript
};

// Merge bulk data modules.
import { NEW_FLAWS } from '@/engine/traitData/flaws';
Object.assign(TRAITS, NEW_FLAWS);
```

> If top-of-file imports are required by lint, move the `import` up and keep only the `Object.assign` here.

`riposte_natural` was deleted in Task 1 Step 2; it returns as a class trait in Task 4.

- [ ] **Step 3: Verify the contract still holds**

Run: `npx vitest run src/test/engine/traits/traitInvariants.test.ts`
Expected: PASS (flaws are well-formed, `sign: 'negative'`, tooltips present).
Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.

- [ ] **Step 4: Commit**

```bash
git add "src/engine/traitData/flaws.ts" "src/engine/traits.ts"
git commit -m "feat(traits): add 10 flaws; reassign riposte_natural to class pool"
```

---

## Task 4: The 50 class traits (TDD via coverage test)

**Files:**
- Create: `src/engine/traitData/classTraits.ts`
- Modify: `src/engine/traits.ts`
- Modify: `src/test/engine/traits/traitInvariants.test.ts`

- [ ] **Step 1: Add the class-coverage test (expect FAIL)**

Append to `src/test/engine/traits/traitInvariants.test.ts`:

```typescript
import { FightingStyle } from '@/types/shared.types';

describe('class-trait coverage', () => {
  const byStyle = (style: FightingStyle) =>
    Object.values(TRAITS).filter((t) => t.styles?.includes(style));

  it('every style has at least 5 class-specific traits', () => {
    for (const style of Object.values(FightingStyle)) {
      expect(byStyle(style).length, `${style} class traits`).toBeGreaterThanOrEqual(5);
    }
  });

  it('class traits are styles-restricted and positive', () => {
    for (const t of Object.values(TRAITS)) {
      if (t.styles && t.styles.length > 0) {
        expect(t.sign, `${t.id}`).toBe('positive');
        expect(t.tier, `${t.id}`).not.toBe('Flaw');
      }
    }
  });
});
```

Run: `npx vitest run src/test/engine/traits/traitInvariants.test.ts -t "class"`
Expected: FAIL — no class traits exist yet.

- [ ] **Step 2: Create the class-trait data module**

`src/engine/traitData/classTraits.ts`. Each entry follows this template (shown for AB; transcribe the full table below):

```typescript
import { FightingStyle } from '@/types/shared.types';
import type { TraitDef } from '@/engine/traits';

const S = FightingStyle;

export const CLASS_TRAITS: Record<string, TraitDef> = {
  // ── Aimed Blow (precision) ──
  steady_hand: { id: 'steady_hand', name: 'Steady Hand', description: '+1 decisiveness — never rushes the shot.', effect: { decMod: 1 }, weight: 0.7, tier: 'Common', sign: 'positive', styles: [S.AimedBlow] },
  called_shot: { id: 'called_shot', name: 'Called Shot', description: '+1 damage — picks the gap and drives through it.', effect: { dmgBonus: 1 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.AimedBlow] },
  armor_chink: { id: 'armor_chink', name: 'Armor Chink', description: '+1 damage — finds the seam in any plate.', effect: { dmgBonus: 1 }, weight: 0.6, tier: 'Notable', sign: 'positive', styles: [S.AimedBlow] },
  dead_aim:    { id: 'dead_aim',    name: 'Dead Aim',    description: '+1 damage, +1 decisiveness — ruthless precision.', effect: { dmgBonus: 1, decMod: 1 }, weight: 0.45, tier: 'Exceptional', sign: 'positive', styles: [S.AimedBlow] },
  assassin:    { id: 'assassin',    name: 'Assassin',    description: '+1 damage, +1 decisiveness, opens the kill window sooner.', effect: { dmgBonus: 1, decMod: 1, killWindowBonus: 0.01 }, weight: 0.3, tier: 'Signature', sign: 'positive', styles: [S.AimedBlow] },
  // …transcribe the remaining 9 classes from the table in Step 3…
};
```

- [ ] **Step 3: Transcribe the full 50-trait data table**

Each row → one `TraitDef` in `CLASS_TRAITS` exactly like the AB template (id, name, description=tooltip, effect, `weight` per tier, tier, `sign: 'positive'`, `styles: [S.<Style>]`). Suggested weights by tier: Common 0.7, Notable 0.6, Exceptional 0.45, Signature 0.3.

**BA — Bashing (`S.BashingAttack`)**
| id | name | tier | effect | tooltip |
|---|---|---|---|---|
| heavy_swing | Heavy Swing | Common | `{ dmgBonus: 1 }` | +1 damage — every blow lands with weight. |
| relentless | Relentless | Notable | `{ attModLate: 1 }` | +1 attack in the late rounds — never lets up. |
| bonebreaker | Bonebreaker | Notable | `{ dmgBonus: 1, attModLate: 1 }` | +1 damage, +1 late attack — wears the guard down. |
| juggernaut | Juggernaut | Exceptional | `{ dmgBonus: 1, enduranceMult: 0.95 }` | +1 damage, tireless — an unstoppable advance. |
| demolisher | Demolisher | Signature | `{ dmgBonus: 2, attModLate: 1 }` | +2 damage, +1 late attack — shatters any defense. |

**LU — Lunging (`S.LungingAttack`)**
| id | name | tier | effect | tooltip |
|---|---|---|---|---|
| quickdraw | Quickdraw | Common | `{ iniMod: 1 }` | +1 initiative — first to the strike. |
| fleet_footed | Fleet-Footed | Notable | `{ iniModFresh: 2 }` | +2 initiative while fresh — explosive early. |
| lightning_step | Lightning Step | Notable | `{ iniMod: 1, iniModFresh: 1 }` | +1 initiative, +1 more while fresh. |
| blitz | Blitz | Exceptional | `{ iniMod: 1, attModConsecutiveHits: 1 }` | +1 initiative, +1 attack on a streak — overwhelms. |
| untouchable | Untouchable | Signature | `{ iniMod: 2, defMod: 1 }` | +2 initiative, +1 defense — too fast to pin. |

**PL — Parry-Lunge (`S.ParryLunge`)**
| id | name | tier | effect | tooltip |
|---|---|---|---|---|
| counterlunge | Counterlunge | Common | `{ ripMod: 1 }` | +1 riposte — punishes the over-extension. |
| fighting_rhythm | Fighting Rhythm | Notable | `{ attModConsecutiveHits: 1 }` | +1 attack on a hit-streak — finds the beat. |
| riposte_flow | Riposte Flow | Notable | `{ ripMod: 1, attModConsecutiveHits: 1 }` | +1 riposte, +1 streak attack. |
| duelist | Duelist | Exceptional | `{ ripMod: 1, dmgBonus: 1 }` | +1 riposte, +1 damage — a clinical counter-fighter. |
| whirlwind | Whirlwind | Signature | `{ ripMod: 2, attModConsecutiveHits: 1 }` | +2 riposte, +1 streak attack — relentless counters. |

**PR — Parry-Riposte (`S.ParryRiposte`)**
| id | name | tier | effect | tooltip |
|---|---|---|---|---|
| riposte_natural | Natural Riposte | Common | `{ ripMod: 1 }` | +1 riposte — counters come naturally. |
| vindicator | Vindicator | Notable | `{ ripMod: 1, dmgBonus: 1 }` | +1 riposte, +1 damage — makes them pay. |
| parry_master | Parry Master | Notable | `{ parMod: 1, ripMod: 1 }` | +1 parry, +1 riposte — a wall that bites back. |
| nemesis | Nemesis | Exceptional | `{ ripMod: 2, dmgBonus: 1 }` | +2 riposte, +1 damage — the brawler's bane. |
| retribution | Retribution | Signature | `{ ripMod: 2, dmgBonus: 1, decMod: 1 }` | +2 riposte, +1 damage, +1 decisiveness. |

**PS — Parry-Strike (`S.ParryStrike`)**
| id | name | tier | effect | tooltip |
|---|---|---|---|---|
| counterpuncher | Counterpuncher | Common | `{ attModConsecutiveHits: 1 }` | +1 attack on a hit-streak — builds off the counter. |
| opportunist | Opportunist | Notable | `{ parModHighHp: 1, attModConsecutiveHits: 1 }` | +1 parry while strong, +1 streak attack. |
| riposte_strike | Riposte Strike | Notable | `{ ripMod: 1, attModConsecutiveHits: 1 }` | +1 riposte, +1 streak attack. |
| counter_artist | Counter Artist | Exceptional | `{ parMod: 1, attModConsecutiveHits: 2 }` | +1 parry, +2 streak attack — defend, then punish. |
| perfect_counter | Perfect Counter | Signature | `{ parMod: 1, ripMod: 1, attModConsecutiveHits: 2 }` | +1 parry, +1 riposte, +2 streak attack. |

**SL — Slashing (`S.SlashingAttack`)**
| id | name | tier | effect | tooltip |
|---|---|---|---|---|
| keen_edge | Keen Edge | Common | `{ dmgBonus: 1 }` | +1 damage — a blade kept razor-sharp. |
| flurry | Flurry | Notable | `{ attModConsecutiveHits: 1 }` | +1 attack on a streak — a storm of cuts. |
| lacerate | Lacerate | Notable | `{ dmgBonus: 1, attModConsecutiveHits: 1 }` | +1 damage, +1 streak attack — cuts that keep coming. |
| hemorrhage | Hemorrhage | Exceptional | `{ dmgBonus: 1, attModConsecutiveHits: 2 }` | +1 damage, +2 streak attack — relentless bleeding. |
| exsanguinate | Exsanguinate | Signature | `{ dmgBonus: 2, attModConsecutiveHits: 1 }` | +2 damage, +1 streak attack — bleeds them dry. |

**ST — Striking (`S.StrikingAttack`)**
| id | name | tier | effect | tooltip |
|---|---|---|---|---|
| crushing_blow | Crushing Blow | Common | `{ dmgBonus: 1 }` | +1 damage — explosive power behind each strike. |
| opener | Opener | Notable | `{ attMod: 1 }` | +1 attack — sets a ferocious early pace. |
| executioner | Executioner | Notable | `{ attModLowHp: 2 }` | +2 attack against a wounded foe — smells blood. |
| berserker_rush | Berserker Rush | Exceptional | `{ attModLowHp: 2, dmgBonus: 1 }` | +2 attack when they bleed, +1 damage. |
| annihilator | Annihilator | Signature | `{ attModLowHp: 3, dmgBonus: 1, killWindowBonus: 0.01 }` | +3 attack vs the wounded, +1 damage, faster kills. |

**TP — Total Parry (`S.TotalParry`)**
| id | name | tier | effect | tooltip |
|---|---|---|---|---|
| enduring | Enduring | Common | `{ enduranceMult: 0.92 }` | Tireless — outlasts the aggressor. |
| stonewall | Stonewall | Notable | `{ defModLate: 2 }` | +2 defense in the late rounds — the wall holds. |
| war_of_attrition | War of Attrition | Notable | `{ defModLate: 2, enduranceMult: 0.95 }` | +2 late defense, tireless — wins the long fight. |
| immovable_object | Immovable Object | Exceptional | `{ defModLate: 2, parModLate: 1 }` | +2 late defense, +1 late parry — cannot be moved. |
| unbreakable | Unbreakable | Signature | `{ defModLate: 2, parModLate: 2, enduranceMult: 0.95 }` | +2 late defense, +2 late parry, tireless. |

**WS — Wall of Steel (`S.WallOfSteel`)**
| id | name | tier | effect | tooltip |
|---|---|---|---|---|
| braced | Braced | Common | `{ parMod: 1 }` | +1 parry — set and ready. |
| bulwark | Bulwark | Notable | `{ parMod: 1, defMod: 1 }` | +1 parry, +1 defense — a living barricade. |
| anchor | Anchor | Notable | `{ parMod: 2 }` | +2 parry — rooted and unyielding. |
| fortress | Fortress | Exceptional | `{ parMod: 2, defMod: 1 }` | +2 parry, +1 defense — nothing gets through. |
| living_wall | Living Wall | Signature | `{ parMod: 2, defMod: 2 }` | +2 parry, +2 defense — the wall that walks. |

> Note: `parModHighHp` (used by PS `opportunist`) and `attMod` opening-weighting (`opener`) exist as `TraitEffect` fields — confirm with `grep -n "parModHighHp\|attMod" src/engine/traits.ts`. If `parModHighHp` is missing, substitute `{ parMod: 1, attModConsecutiveHits: 1 }` for `opportunist` (still Notable budget).

- [ ] **Step 4: Spread the class traits into TRAITS**

In `traits.ts`, next to the flaws merge, add:

```typescript
import { CLASS_TRAITS } from '@/engine/traitData/classTraits';
Object.assign(TRAITS, CLASS_TRAITS);
```

- [ ] **Step 5: Run coverage + invariants — expect PASS**

Run: `npx vitest run src/test/engine/traits/traitInvariants.test.ts`
Expected: PASS — every style has ≥5 class traits; all are positive, styles-restricted, tooltipped.
Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.

- [ ] **Step 6: Commit**

```bash
git add "src/engine/traitData/classTraits.ts" "src/engine/traits.ts" "src/test/engine/traits/traitInvariants.test.ts"
git commit -m "feat(traits): add 50 class-specific traits (5 per style) + coverage test"
```

---

## Task 5: Accessors

**Files:**
- Modify: `src/engine/traits.ts`
- Create: `src/test/engine/traits/traitAccessors.test.ts`

- [ ] **Step 1: Write the failing accessor test**

`src/test/engine/traits/traitAccessors.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import { traitsForStyle, traitsByTier } from '@/engine/traits';

describe('trait accessors', () => {
  it('traitsForStyle returns only that style\'s class traits', () => {
    const ab = traitsForStyle(FightingStyle.AimedBlow);
    expect(ab.length).toBeGreaterThanOrEqual(5);
    expect(ab.every((t) => t.styles?.includes(FightingStyle.AimedBlow))).toBe(true);
    // a Wall-of-Steel trait must not appear
    expect(ab.some((t) => t.id === 'living_wall')).toBe(false);
  });

  it('traitsByTier filters by tier', () => {
    const flaws = traitsByTier('Flaw');
    expect(flaws.length).toBeGreaterThanOrEqual(10);
    expect(flaws.every((t) => t.sign === 'negative')).toBe(true);
  });
});
```

Run: `npx vitest run src/test/engine/traits/traitAccessors.test.ts`
Expected: FAIL — accessors not exported.

- [ ] **Step 2: Implement the accessors**

In `src/engine/traits.ts` (after `TRAITS` and the merges), add:

```typescript
import type { FightingStyle } from '@/types/shared.types';

/** Class traits available to a given fighting style. */
export function traitsForStyle(style: FightingStyle): TraitDef[] {
  return Object.values(TRAITS).filter((t) => t.styles?.includes(style));
}

/** All traits of a given tier. */
export function traitsByTier(tier: TraitTier): TraitDef[] {
  return Object.values(TRAITS).filter((t) => t.tier === tier);
}
```

(The `FightingStyle` type import added in Task 1 may already cover this — avoid a duplicate import.)

- [ ] **Step 3: Run — expect PASS + typecheck**

Run: `npx vitest run src/test/engine/traits/traitAccessors.test.ts` → PASS.
Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.

- [ ] **Step 4: Commit**

```bash
git add "src/engine/traits.ts" "src/test/engine/traits/traitAccessors.test.ts"
git commit -m "feat(traits): add traitsForStyle / traitsByTier accessors"
```

---

## Task 6: Bound trained power — max-loadout ceiling

**Files:**
- Modify: `src/test/engine/combat/traitBalance.test.ts`

The existing battery mirror-matches a traited warrior against a baseline using
`buildWarrior(traits, style)`. Add a test for the strongest realistic trained
loadout: a class Signature + two strong same-style traits on its own style.

- [ ] **Step 1: Add the ceiling test**

Append a `describe` to `src/test/engine/combat/traitBalance.test.ts` (reuse the file's existing `buildWarrior`, `simulateFight`, `defaultPlanForWarrior`, `SAMPLE_SIZE`):

```typescript
describe('Trained-loadout ceiling', () => {
  it('a max class-trait loadout does not exceed a ~75% win rate vs an untraited peer', () => {
    // Strongest realistic build: WS Signature + two WS class traits, on Wall of Steel.
    const loadout = ['living_wall', 'fortress', 'anchor'];
    const traited = buildWarrior(loadout, FightingStyle.WallOfSteel);
    const baseline = buildWarrior([], FightingStyle.WallOfSteel);
    let wins = 0;
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      const o = simulateFight(
        defaultPlanForWarrior(traited),
        defaultPlanForWarrior(baseline),
        traited,
        baseline,
        i * 7919 + 3
      );
      if (o.winner === 'A') wins++;
    }
    const rate = wins / SAMPLE_SIZE;
    expect(rate, `max-loadout win rate ${(rate * 100).toFixed(1)}%`).toBeLessThanOrEqual(0.75);
    // sanity: the loadout should actually help (not a no-op)
    expect(rate, `max-loadout win rate ${(rate * 100).toFixed(1)}%`).toBeGreaterThan(0.55);
  });
});
```

> If the file does not already import `defaultPlanForWarrior` / `FightingStyle`, add them (both are used elsewhere in the file per the header import block).

- [ ] **Step 2: Run it**

Run: `npx vitest run src/test/engine/combat/traitBalance.test.ts -t "ceiling"`
Expected: PASS. If the loadout exceeds 0.75, the class-trait magnitudes are too strong — reduce the Signature/Notable effect values in `classTraits.ts` (e.g. `living_wall` `parMod:2,defMod:2` → `parMod:2,defMod:1`) and re-run. If it is ≤0.55 (no effect), the loadout is too weak — nudge up. The *test* defines the bound.

- [ ] **Step 3: Full suite + typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`
Run: `npx vitest run 2>&1 | tail -4`
Expected: all green. The base style harness (`balance.test.ts`) is unaffected — it runs trait-free.

- [ ] **Step 4: Commit**

```bash
git add "src/test/engine/combat/traitBalance.test.ts"
git commit -m "test(traits): bound max trained-loadout win rate at ~75%"
```

---

## Self-Review Notes (for the implementer)

- **Tests are the content spec.** The invariant test forbids empty tooltips; the coverage test forces ≥5 class traits per style; the ceiling test bounds power. Fill data until they pass — don't hand-verify 98 entries.
- **Bulk data lives in `traitData/`** so `traits.ts` stays readable. `Object.assign(TRAITS, …)` keeps one runtime map; consumers (`generateTraits`, future training) see all traits uniformly.
- **`styles` is the only gate added here.** Generation/training *consumption* of `styles` is Systems 2/3 — this plan just defines the data and the accessors.
- **Magnitudes are knobs.** Class-trait effect values are starting points; Task 6's ceiling (and later the live oracle sim) tune them. Keep the tier ordering (Signature ≥ Notable ≥ Common budget) intact.
- **No new combat hooks.** Every effect uses existing `TraitEffect` fields, so no `hitExecution`/`resolution` changes are needed — the mechanic-amplifier class traits are a deliberate future follow-on.

## Verification (done by reviewer after implementation)

1. `npx vitest run src/test/engine/traits/` → invariants + coverage + accessors green.
2. `grep -c "styles:" src/engine/traitData/classTraits.ts` → 50.
3. Every `FightingStyle` returns ≥5 from `traitsForStyle`; every trait has a non-empty `description`.
4. `npx vitest run src/test/engine/combat/traitBalance.test.ts` → green, including the ≤75% ceiling.
5. `bunx tsc --noEmit --project tsconfig.app.json` → 0; full `npx vitest run` green; `balance.test.ts` unaffected.
