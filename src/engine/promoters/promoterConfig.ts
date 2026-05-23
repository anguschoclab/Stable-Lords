/**
 * Promoter Configuration
 * Tier multipliers, rank requirements, and capacity settings for promoters.
 */

/** Tier-based purse multipliers */
export const TIER_MULTIPLIERS = {
  Local: 1.0,
  Regional: 1.8,
  National: 3.5,
  Legendary: 8.0,
} as const;

/** Tier-based rank requirements (lower = more exclusive) */
export const RANK_REQUIREMENTS = {
  Local: 999,
  Regional: 200,
  National: 80,
  Legendary: 20,
} as const;

/** Personality-based skill gap thresholds for matching */
export const PERSONALITY_GAP_THRESHOLDS = {
  Greedy: 0.35, // Prefer bigger mismatches (crowd-pleasing blowouts)
  Honorable: 0.1, // Tight skill parity (<10% vs default 25%)
  Sadistic: 0.25, // Default
  Flashy: 0.25, // Default
  Corporate: 0.2, // Stable, predictable matches
} as const;
