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
    [43, 'Advanced Master'],
    [44, 'Grandmaster'],
    [55, 'Grandmaster'],
    [56, 'Archmaster'],
    [80, 'Archmaster'],
  ])('%d total skills → %s', (n, label) => {
    expect(skillTierLabel(n)).toBe(label);
  });

  it('the six canon rungs are declared', () => {
    // V31 (Terrablood skill chart): the archive extends the Q&A ladder —
    // Grandmaster at 44, Archmaster at 56 (DN-M4, user-adjudicated).
    expect(SKILL_TIER_LABELS.expert.min).toBe(16);
    expect(SKILL_TIER_LABELS.advExpert.min).toBe(20);
    expect(SKILL_TIER_LABELS.master.min).toBe(26);
    expect(SKILL_TIER_LABELS.advMaster.min).toBe(34);
    expect(SKILL_TIER_LABELS.grandmaster.min).toBe(44);
    expect(SKILL_TIER_LABELS.archmaster.min).toBe(56);
  });
});
