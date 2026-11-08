/**
 * V22 canon profile surfaces — physical statements (endurance, punishment,
 * carry, damage) + Expert/Advanced-Expert ratings + ambidextrous line.
 * RED until Phase-2 lands.
 */
import { describe, it, expect } from 'vitest';
import { physicalProfileLines, skillRating } from '@/data/warriorStatements';

describe('physicalProfileLines — canon overview statements', () => {
  it('Chronic Pain profile: poor endurance, cannot take a lot, very little weight, great damage', () => {
    // 9-6-18-15-9-10-17 striker per the worked example
    const lines = physicalProfileLines({
      enduranceTier: 'P',
      hp: 15,
      encumbranceClass: 'A',
      damageClass: 4,
    });
    const joined = lines.join('\n').toLowerCase();
    expect(joined).toContain('endurance');
    expect(joined).toContain('punishment');
    expect(joined).toContain('weight');
    expect(joined).toContain('damage');
  });

  it('normal physicals produce no lines (canon only flags the extremes)', () => {
    expect(
      physicalProfileLines({ enduranceTier: 'N', hp: 25, encumbranceClass: 'C', damageClass: 2 })
    ).toEqual([]);
  });
});

describe('skillRating — canon Expert / Advanced Expert', () => {
  it('16-19 → Expert; 20+ → Advanced Expert; below → none', () => {
    expect(skillRating(15)).toBeNull();
    expect(skillRating(16)).toBe('Expert');
    expect(skillRating(19)).toBe('Expert');
    expect(skillRating(20)).toBe('Advanced Expert');
  });
});
