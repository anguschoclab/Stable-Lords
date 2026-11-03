import { describe, it, expect } from 'vitest';
import { TRAITS } from '@/engine/traits';

/**
 * V21 trait-registry guards (PRs #1070/#1071/#1073/#1075).
 *
 * Live ratchets pinning the post-merge end-state. Adjudication (FINDINGS
 * §1): six traits survive; three `_2`-suffixed defs were REJECTED as
 * dedup-collision workarounds (display-name collisions with existing
 * traits).
 *
 * Expected union: 178 + 6 = 184.
 */
const SURVIVING: { id: string; tier: string; effect: Record<string, unknown>; weight: number }[] = [
  // #1070
  { id: 'street_rat', tier: 'Common', effect: { iniMod: 1, defMod: -1 }, weight: 0.8 },
  // #1071
  { id: 'gut_survivor', tier: 'Common', effect: { enduranceMult: 0.98 }, weight: 0.6 },
  { id: 'ash_breather', tier: 'Common', effect: { enduranceMult: 0.97 }, weight: 0.6 },
  // #1075
  { id: 'orphan_iron_will', tier: 'Exceptional', effect: { defModEarly: 1, attModLate: 1 }, weight: 0.3 },
  { id: 'gutter_shadow_striker', tier: 'Notable', effect: { iniModEarly: 1, attModEarly: 1 }, weight: 0.4 },
  // #1073
  { id: 'orphan_shadow_fury', tier: 'Notable', effect: { attModLate: 1, dmgBonus: 1 }, weight: 0.5 },
];

const REJECTED = ['orphan_survivor_guilt_2', 'shadow_fighter_2', 'gutter_phantom_two'] as const;

const TRAIT_EFFECT_KEYS = new Set([
  'attMod', 'parMod', 'defMod', 'iniMod', 'ripMod', 'decMod', 'dmgBonus', 'enduranceMult',
  'attModLowHp', 'defModLowHp', 'parModHighHp', 'defModEarly', 'iniModEarly', 'attModEarly',
  'defModLate', 'attModLate', 'parModLate', 'iniModFresh', 'killWindowBonus',
  'attModConsecutiveHits', 'disarmResist', 'unarmedDmgBonus', 'fightPlanMod', 'attrBonus',
]);

describe('MEGAPLAN-V7: V21 narrative traits', () => {
  for (const spec of SURVIVING) {
    it(`${spec.id} is registered ${spec.tier}/positive with its curated effect (MEGAPLAN-V7)`, () => {
      const t = TRAITS[spec.id];
      expect(t, `${spec.id} missing from TRAITS`).toBeDefined();
      expect(t!.tier).toBe(spec.tier);
      expect(t!.sign).toBe('positive');
      expect(t!.effect).toEqual(spec.effect);
      expect(t!.weight).toBe(spec.weight);
    });
  }

  it('rejected _2-suffixed collision traits are absent (MEGAPLAN-V7)', () => {
    for (const id of REJECTED) {
      expect(TRAITS[id], `${id} should have been rejected at merge`).toBeUndefined();
    }
  });

  it('post-merge trait count is 186 (MEGAPLAN-V7)', () => {
    expect(Object.keys(TRAITS).length).toBe(186);
  });
});

describe('trait effect-key whitelist (live guard)', () => {
  it('every registered trait effect uses only TraitEffect keys', () => {
    const violations: string[] = [];
    for (const [id, def] of Object.entries(TRAITS)) {
      for (const key of Object.keys(def.effect ?? {})) {
        if (!TRAIT_EFFECT_KEYS.has(key)) violations.push(`${id}.${key}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
