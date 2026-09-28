import { OWNER_PERSONALITIES, META_ADAPTATIONS } from '../enumSources';
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
  age?: number; // 🎂 1.0 Hardening: Owner age for retirement
  ageRetired?: number; // Week the previous owner retired
}
