/**
 * V23 — Drake's Dark-Arena rejection rule applied to AI recruit generation:
 * a build with WL < 7 or ST < 7 is a DOA roll — the generator must not
 * field it (reject/retry or floor-clamp, implementation choice).
 */
import { describe, it, expect } from 'vitest';
import { generateRecruitAttrs, generateAIRecruit } from '@/engine/owner/roster/recruitGenerator';
import { DA_WL_FLOOR, DA_ST_FLOOR } from '@/data/designDoctrine';
import { SeededRNG } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';
import type { RivalStableData } from '@/types/state.types';

const philosophies = [
  'Brute Force',
  'Speed Kills',
  'Iron Defense',
  'Balanced',
  'Spectacle',
  'Cunning',
  'Endurance',
  'Specialist',
];

describe('generateRecruitAttrs — DA rule', () => {
  it('never returns a recruit with WL or ST below the DA floors', () => {
    for (const philosophy of philosophies) {
      for (const style of Object.values(FightingStyle)) {
        const rng = new SeededRNG(1234);
        for (let i = 0; i < 30; i++) {
          const attrs = generateRecruitAttrs(philosophy, rng, style);
          expect(
            attrs.WL,
            `${philosophy}/${style} recruit WL ${attrs.WL} < ${DA_WL_FLOOR}`
          ).toBeGreaterThanOrEqual(DA_WL_FLOOR);
          expect(
            attrs.ST,
            `${philosophy}/${style} recruit ST ${attrs.ST} < ${DA_ST_FLOOR}`
          ).toBeGreaterThanOrEqual(DA_ST_FLOOR);
        }
      }
    }
  });

  it('still respects the 70-point total budget', () => {
    const rng = new SeededRNG(7);
    for (let i = 0; i < 50; i++) {
      const attrs = generateRecruitAttrs('Balanced', rng, FightingStyle.StrikingAttack);
      const total = Object.values(attrs).reduce((s, v) => s + v, 0);
      expect(total).toBe(70);
    }
  });
});

describe('generateAIRecruit — DA rule end to end', () => {
  it('AI recruits never carry sub-floor WL/ST', () => {
    const rival = {
      id: 'stable_test',
      name: 'Test Stable',
      philosophy: 'Cunning',
      owner: { personality: 'Pragmatic', metaAdaptation: 'Opportunist', favoredStyles: [] },
      roster: [],
    } as unknown as RivalStableData;
    for (let week = 1; week <= 40; week++) {
      const w = generateAIRecruit({ rival, week });
      if (!w) continue;
      expect(w.attributes.WL).toBeGreaterThanOrEqual(DA_WL_FLOOR);
      expect(w.attributes.ST).toBeGreaterThanOrEqual(DA_ST_FLOOR);
    }
  });
});
