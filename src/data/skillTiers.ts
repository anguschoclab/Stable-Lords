/**
 * Skill tier labels — canon skill ladder (Consortium Q&A, Rose of Shanon):
 * "When the warrior acquires 16 total skills in any area he has reached
 * 'expert'. 4 skills later at 20 total, he reaches 'advanced expert'. 6 more
 * skills later at 26 total, he reaches 'master', and 8 more skills later he
 * reaches 'advanced Master'."
 */
type SkillTierKey = 'novice' | 'adept' | 'expert' | 'advExpert' | 'master' | 'advMaster';

export const SKILL_TIER_LABELS: Record<SkillTierKey, { min: number; label: string }> = {
  novice: { min: 0, label: 'Novice' },
  adept: { min: 4, label: 'Adept' },
  expert: { min: 16, label: 'Expert' },
  advExpert: { min: 20, label: 'Advanced Expert' },
  master: { min: 26, label: 'Master' },
  advMaster: { min: 34, label: 'Advanced Master' },
};

const TIERS = [
  { min: 34, label: 'Advanced Master' },
  { min: 26, label: 'Master' },
  { min: 20, label: 'Advanced Expert' },
  { min: 16, label: 'Expert' },
  { min: 4, label: 'Adept' },
  { min: 0, label: 'Novice' },
] as const;

/** Label for a total skill count in one area. */
export function skillTierLabel(totalSkills: number): string {
  for (const t of TIERS) if (totalSkills >= t.min) return t.label;
  return 'Novice';
}
