/**
 * Defines the shape of strike category.
 */
export interface StrikeCategory {
  glancing: string[];
  solid: string[];
  mastery: string[];
  critical_human: string[];
  critical_supernatural: string[];
  fatal: string[];
}

/**
 * Defines the shape of strikes collection.
 */
export interface StrikesCollection {
  generic: string[];
  slashing: StrikeCategory;
  bashing: StrikeCategory;
  piercing: StrikeCategory;
  fist: StrikeCategory;
}

// ─── Play-by-Play Narratives ─────────────────────────────────────────────
