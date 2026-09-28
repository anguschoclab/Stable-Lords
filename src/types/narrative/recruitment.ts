
/**
 * Defines the shape of tier config.
 */
export interface TierConfig {
  points: number[];
  cost: number;
  stars: number;
}


/**
 * Defines the shape of recruitment.
 */
export interface Recruitment {
  names: string[];
  rival_stable_names: string[];
  tiers: Record<string, TierConfig>;
  origin: string[];
  style_blurbs: Record<string, string[]>;
}

// ─── Meta ─────────────────────────────────────────────────────────────────
