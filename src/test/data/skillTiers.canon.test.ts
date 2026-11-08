/**
 * V24 canon — the Consortium/Rose of Shanon skill ladder (Arena 93):
 * Expert 16 · Adv. Expert 20 · Master 26 · Adv. Master 34.
 */
import { describe, it, expect } from 'vitest';
import { skillTierLabel, SKILL_TIER_LABELS } from '@/data/skillTiers';

describe('canon skill tier ladder', () => {
  it.each([
    [15, 'Adept'],
    [16, 'Expert'],
    [19, 'Expert'],
    [20, 'Advanced Expert'],
    [25, 'Advanced Expert'],
    [26, 'Master'],
    [33, 'Master'],
    [34, 'Advanced Master'],
    [40, 'Advanced Master'],
  ])('%d total skills → %s', (n, label) => {
    expect(skillTierLabel(n)).toBe(label);
  });

  it('the four canon rungs are declared', () => {
    expect(SKILL_TIER_LABELS.expert.min).toBe(16);
    expect(SKILL_TIER_LABELS.advExpert.min).toBe(20);
    expect(SKILL_TIER_LABELS.master.min).toBe(26);
    expect(SKILL_TIER_LABELS.advMaster.min).toBe(34);
  });
});
