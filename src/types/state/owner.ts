import {
  OWNER_PERSONALITIES,
  META_ADAPTATIONS,
  OWNER_COMPETENCES,
  WORLD_DIFFICULTIES,
} from '../enumSources';
import type { CrestData } from '../crest.types';
import type { StableId, WarriorId } from '../shared.types';
import type { FightingStyle } from '../warrior.types';

/**
 * Owner personality type.
 */
export type OwnerPersonality = (typeof OWNER_PERSONALITIES)[number];

/**
 * Meta adaptation type.
 */
export type MetaAdaptation = (typeof META_ADAPTATIONS)[number];

/**
 * Owner competence — the quality axis (Novice → Master). Scales the error
 * term in AI decision scoring; never changes what the stable wants.
 */
export type OwnerCompetence = (typeof OWNER_COMPETENCES)[number];

/**
 * World-generation difficulty (Stage E) — picked at world creation, skews
 * the minted stablemaster competence field.
 */
export type WorldDifficulty = (typeof WORLD_DIFFICULTIES)[number];

/**
 * World-creation options persisted on GameState (Stage E). Read once at
 * world seeding — mid-game refills ignore it.
 */
export interface WorldOptions {
  difficulty?: WorldDifficulty;
}

/**
 * Defines the shape of owner.
 */
export interface Owner {
  id: StableId;
  name: string;
  stableName: string;
  fame: number;
  renown: number;
  titles: number;
  personality?: OwnerPersonality;
  metaAdaptation?: MetaAdaptation;
  favoredStyles?: FightingStyle[];
  generation?: number; // 🛡️ Crest lineage depth (0 = original founder)
  crest?: CrestData; // 🛡️ Heraldic crest for the stable
  backstoryId?: import('@/data/backstories').BackstoryId;
  foundedByWarriorId?: WarriorId; // Lineage breadcrumb for legacy founders
  foundedByWarriorName?: string; // Cached display name — founder warriors leave state
  /** Stable the founder fought for, when the new stable descends from one. */
  parentStableId?: StableId;
  age?: number; // 🎂 1.0 Hardening: Owner age for retirement
  ageRetired?: number; // Week the previous owner retired
  /** Management skill tier — scales AI decision noise (Stage B). */
  competence?: OwnerCompetence;
}
