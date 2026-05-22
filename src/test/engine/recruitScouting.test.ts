import { describe, it, expect } from 'vitest';
import { revealRecruitPotential } from '@/engine/recruitScouting';

describe('revealRecruitPotential', () => {
  const mockPotential = { ST: 15, CN: 12, SZ: 10, WT: 14, WL: 13, SP: 16, DF: 11 };

  it('returns empty result when potential is undefined', () => {
    const result = revealRecruitPotential('rec1', 1, undefined);
    expect(result.recruitId).toBe('rec1');
    expect(result.week).toBe(1);
    expect(result.revealed).toEqual({});
    expect(result.summary).toBe("Scouts couldn't get close enough for specifics.");
  });

  it('is deterministic for the same recruitId and week', () => {
    const result1 = revealRecruitPotential('rec1', 1, mockPotential);
    const result2 = revealRecruitPotential('rec1', 1, mockPotential);

    expect(result1.revealed).toEqual(result2.revealed);
    expect(result1.summary).toBe(result2.summary);
  });

  it('returns different results for different recruitIds', () => {
    const result1 = revealRecruitPotential('rec1', 1, mockPotential);
    const result2 = revealRecruitPotential('rec2', 1, mockPotential);

    // While it's theoretically possible for them to match randomly,
    // we chose specific seeds in manual testing that differ.
    // rec1 week 1 reveals DF, WT, ST
    // rec2 week 1 reveals SP, WT
    expect(result1.revealed).not.toEqual(result2.revealed);
  });

  it('returns different results for different weeks', () => {
    const result1 = revealRecruitPotential('rec1', 1, mockPotential);
    const result2 = revealRecruitPotential('rec1', 2, mockPotential);

    // rec1 week 1 reveals DF, WT, ST
    // rec1 week 2 reveals ST, WT, CN
    expect(result1.revealed).not.toEqual(result2.revealed);
  });

  it('reveals exactly 2 or 3 attributes', () => {
    const result = revealRecruitPotential('rec3', 5, mockPotential);
    const revealedCount = Object.keys(result.revealed).length;

    expect(revealedCount).toBeGreaterThanOrEqual(2);
    expect(revealedCount).toBeLessThanOrEqual(3);

    // Ensure the attributes in the revealed object exist in the mockPotential
    for (const key of Object.keys(result.revealed)) {
      expect(mockPotential).toHaveProperty(key);
      expect(result.revealed[key as keyof typeof mockPotential]).toBe(mockPotential[key as keyof typeof mockPotential]);
    }
  });

  it('correctly identifies the highest attribute in the summary', () => {
    // rec1 week 1 reveals DF (11), WT (14), ST (15)
    // The highest is ST (15)
    const result = revealRecruitPotential('rec1', 1, mockPotential);
    expect(result.summary).toContain('ST ceiling of 15');

    // Check the exact format with the extra count
    const revealedCount = Object.keys(result.revealed).length;
    if (revealedCount > 1) {
      expect(result.summary).toContain(`(+${revealedCount - 1} more noted)`);
    }
  });
});
