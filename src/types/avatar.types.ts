import type { FightingStyle } from './shared.types';

/**
 * Avatar entity type.
 */
export type AvatarEntityType = 'warrior' | 'trainer' | 'poolWarrior' | 'owner' | 'promoter';

/**
 * Gender presentation for portrait generation.
 */
export type AvatarGender = 'masc' | 'fem' | 'neutral';

/**
 * Avatar age group derived from entity age.
 */
export type AvatarAgeGroup = 'young' | 'adult' | 'middle' | 'elder';

/**
 * Avatar layer category. Order here is the default back-to-front draw order.
 */
export type AvatarLayerCategory =
  | 'shoulders'
  | 'clothing'
  | 'base'
  | 'skinTone'
  | 'eyes'
  | 'mouth'
  | 'facialHair'
  | 'hair'
  | 'markings'
  | 'accessories';

/**
 * Defines one composited sprite layer.
 */
export interface AvatarLayer {
  category: AvatarLayerCategory;
  /** Relative URL under public/avatars/layers/. */
  src: string;
  /** Optional hex color tint applied at render time. */
  tint?: string;
  /** Optional pixel offset for per-layer positioning. */
  offset?: { x: number; y: number };
  /** Render z-index (higher = in front). */
  z: number;
}

/**
 * Persisted snapshot of a generated portrait.
 */
export interface AvatarData {
  /** Deterministic seed used to generate this avatar. */
  seed: number;
  entityType: AvatarEntityType;
  gender: AvatarGender;
  ageGroup: AvatarAgeGroup;
  /** Stable crest primary color used for gear tints. */
  primaryColor: string;
  secondaryColor?: string;
  layers: AvatarLayer[];
  /** Week the portrait was generated; helps decide when to invalidate. */
  generatedAtWeek?: number;
  /** Narrative label, e.g. "Scarred Veteran of the Arena". */
  description?: string;
}

/**
 * Input config for generating an avatar.
 */
export interface AvatarConfig {
  entityId: string;
  entityType: AvatarEntityType;
  /** Deterministic seed; omit to derive from entity identity. */
  seed?: number;
  name: string;
  gender?: AvatarGender;
  age?: number;
  /** Fighting style for thematic clothing. */
  style?: FightingStyle;
  /** Stable colors for gear tinting. */
  primaryColor?: string;
  secondaryColor?: string;
  /** Career / combat metrics that drive scars and wear. */
  kills?: number;
  fame?: number;
  injuries?: string[];
  /** Explicit overrides for special entities. */
  forcedAgeGroup?: AvatarAgeGroup;
  forcedGender?: AvatarGender;
}

/**
 * Catalog entry parsed from the asset manifest.
 */
export interface AvatarCatalogEntry {
  src: string;
  category: AvatarLayerCategory;
  tags: string[];
}

/**
 * Full avatar asset catalog.
 */
export interface AvatarCatalog {
  categories: Record<AvatarLayerCategory, AvatarCatalogEntry[]>;
}
