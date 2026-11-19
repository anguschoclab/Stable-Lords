import { describe, it, expect } from 'vitest';
import { TRAITS } from '@/engine/traits';

/**
 * V29 trait-registry guards (PR #1079 flaw-trait additions).
 *
 * Pins the post-merge union end-state: #1079 adds two new Flaw traits
 * (orphan_despair, orphan_paranoia) whose effect keys are all inside the
 * TraitEffect whitelist. The registry's import-time drift assert already
 * enforces LEGACY_TRAIT_ORDER membership — this guard pins the defs and
 * the post-union count.
 *
 * Expected union: 184 + 2 = 186.
 */
const V29_ADDED: { id: string; tier: string; effect: Record<string, unknown> }[] = [
  { id: 'orphan_despair', tier: 'Flaw', effect: { defModLowHp: -1, parModLate: -1 } },
  { id: 'orphan_paranoia', tier: 'Flaw', effect: { attMod: -1, fightPlanMod: { OE: -2 } } },
];

describe('MEGAPLAN-V29: #1079 flaw traits', () => {
  for (const spec of V29_ADDED) {
    it(`${spec.id} is registered ${spec.tier}/negative with its curated effect (MEGAPLAN-V29)`, () => {
      const t = TRAITS[spec.id];
      expect(t, `${spec.id} missing from TRAITS`).toBeDefined();
      expect(t!.tier).toBe(spec.tier);
      expect(t!.sign).toBe('negative');
      expect(t!.effect).toEqual(spec.effect);
    });
  }

  it('post-merge trait count is 186 (MEGAPLAN-V29)', () => {
    expect(Object.keys(TRAITS).length).toBe(186);
  });
});
