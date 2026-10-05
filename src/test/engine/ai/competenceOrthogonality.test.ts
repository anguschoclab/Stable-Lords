/**
 * Stage B — axis orthogonality, the anti-collapse invariant.
 * Competence scales *decision quality*; personality/metaAdaptation decide
 * *what the stable wants*. The two axes must never merge:
 *   - same personality, different tier → different quality, same choices
 *   - same tier, different personality → different choices
 */
import { describe, it, expect } from 'vitest';
import { competenceQuality, blendQuality } from '@/engine/ai/competence';
import { aiRosterMax, aiRosterMin, PERSONALITY_DRAFT_WEIGHTS } from '@/constants/ai';
import { makeOwner } from '@/test/_fixtures/factories';
import type { OwnerPersonality } from '@/types/state.types';

const PERSONALITIES: OwnerPersonality[] = [
  'Aggressive',
  'Methodical',
  'Showman',
  'Pragmatic',
  'Tactician',
];

describe('competence does not change *choices*', () => {
  it('roster caps are personality-keyed only — competence cannot enter them', () => {
    // aiRosterMax/aiRosterMin take personality, not an owner: competence has
    // no slot to leak into. Assert the personality ordering is unchanged.
    expect(aiRosterMax('Aggressive')).toBe(10);
    expect(aiRosterMax('Pragmatic')).toBe(8);
    expect(aiRosterMin('Aggressive')).toBe(8);
    expect(aiRosterMin('Pragmatic')).toBe(6);
  });

  it('draft weights remain keyed by personality alone', () => {
    // The weights table is indexed by personality — a competence tier has no
    // row here. Pragmatic stays thriftier than Aggressive regardless of tier.
    expect(PERSONALITY_DRAFT_WEIGHTS.Pragmatic.priceSensitivity).toBeGreaterThan(
      PERSONALITY_DRAFT_WEIGHTS.Aggressive.priceSensitivity
    );
    expect(PERSONALITY_DRAFT_WEIGHTS.Showman.tierBonus.Prodigy).toBeGreaterThan(
      PERSONALITY_DRAFT_WEIGHTS.Pragmatic.tierBonus.Prodigy
    );
  });
});

describe('personality does not change *quality*', () => {
  it('competenceQuality is identical across personalities at the same tier', () => {
    for (const p of PERSONALITIES) {
      expect(competenceQuality(makeOwner({ personality: p, competence: 'Veteran' }))).toBe(
        competenceQuality(makeOwner({ competence: 'Veteran' }))
      );
    }
  });

  it('same personality + different tier → different blended quality', () => {
    const scoutBase = 0.6; // Pragmatic scout quality
    const novice = blendQuality(scoutBase, makeOwner({ competence: 'Novice' }));
    const master = blendQuality(scoutBase, makeOwner({ competence: 'Master' }));
    expect(master).toBeGreaterThan(novice);
  });
});
