import {
  FightingStyle,
  STYLE_DISPLAY_NAMES,
  STYLE_ABBREV,
  type Attributes,
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS,
  ATTRIBUTE_MIN,
  ATTRIBUTE_MAX,
  ATTRIBUTE_TOTAL,
  type BaseSkills,
  type DerivedStats,
  type Gear,
  type FightPlan,
  type DeathEvent,
  type WarriorId,
  type StableId,
  type InjuryId,
} from './shared.types';
import type { AnnualAward } from './state.types';/**
 * Defines the shape of tag badge props.
 */


// ─── UI Prop Types ──────────────────────────────────────────────────────────

export interface TagBadgeProps {
  tag: string;
  type: 'flair' | 'title' | 'injury';
  className?: string;
}/**
 * Defines the shape of stat badge props.
 */


export interface StatBadgeProps {
  styleName: FightingStyle;
  career?: CareerRecord;
  variant?: 'outline' | 'default' | 'secondary' | 'destructive';
  showFullName?: boolean;
  className?: string;
}/**
 * Defines the shape of warrior name tag props.
 */


export interface WarriorNameTagProps {
  id?: string;
  name: string;
  isChampion?: boolean;
  injuryCount?: number;
  useCrown?: boolean;
  isDead?: boolean;
}/**
 * Defines the shape of career record.
 */


// ─── Warrior ────────────────────────────────────────────────────────────────

export interface CareerRecord {
  wins: number;
  losses: number;
  kills: number;
  fame?: number; // 📸 Snapshot fame at year start
  medals?: {
    gold: number;
    silver: number;
    bronze: number;
  };
}/**
 * Warrior status type.
 */


export type WarriorStatus = 'Active' | 'Dead' | 'Retired';

/** Injury severity tiers (per Design Bible §Injuries) */
export type InjurySeverity = 'Minor' | 'Moderate' | 'Severe' | 'Critical' | 'Permanent';

/** Recovery time ranges by severity (in weeks) */
export const INJURY_SEVERITY_WEEKS: Record<InjurySeverity, { min: number; max: number }> = {
  Minor: { min: 1, max: 2 },
  Moderate: { min: 2, max: 4 },
  Severe: { min: 4, max: 8 },
  Critical: { min: 8, max: 16 },
  Permanent: { min: Infinity, max: Infinity },
};

/** Body locations that can sustain injuries */
export type InjuryLocation =
  | 'Head'
  | 'Chest'
  | 'Abdomen'
  | 'Right Arm'
  | 'Left Arm'
  | 'Right Leg'
  | 'Left Leg'
  | 'General';/**
 * Defines the shape of injury data.
 */


export interface InjuryData {
  id: InjuryId;
  name: string;
  description: string;
  severity: InjurySeverity;
  location?: InjuryLocation;
  weeksRemaining: number;
  penalties: Partial<Record<keyof Attributes | keyof BaseSkills, number>>;
  permanent?: boolean;
}/**
 * Attribute potential type.
 */


export type AttributePotential = Record<keyof Attributes, number>;/**
 * Defines the shape of warrior favorites.
 */


export interface WarriorFavorites {
  weaponId: string;
  rhythm: { oe: number; al: number };
  discovered: {
    weapon: boolean;
    rhythm: boolean;
    weaponHints: number;
    rhythmHints: number;
  };
}/**
 * Defines the shape of warrior lineage.
 */


export interface WarriorLineage {
  parentId?: WarriorId;
  stableId?: StableId;
  generation: number;
  pedigree: 'Commoner' | 'Second Generation' | 'Legacy' | 'Noble Blood' | 'Exiled Legend';
  mentorName?: string;
}/**
 * Defines the shape of warrior.
 */


export interface Warrior {
  id: WarriorId;
  name: string;
  style: FightingStyle;
  attributes: Attributes;
  potential?: AttributePotential;
  baseSkills?: BaseSkills;
  derivedStats?: DerivedStats;
  fame: number;
  popularity: number;
  titles: string[];
  injuries: InjuryData[];
  flair: string[];
  career: CareerRecord;
  champion: boolean;
  plan?: FightPlan;
  gear?: Gear;
  equipment?: {
    weapon: string;
    armor: string;
    shield: string;
    helm: string;
  };
  status: WarriorStatus;
  age?: number;
  fatigue?: number;
  seasonPoints?: number;
  xp?: number;
  potentialRevealed?: Partial<Record<keyof Attributes, boolean>>;
  /** Skill drilling bonuses — additive flat modifiers on top of attribute-derived baseSkills. Capped at SKILL_DRILL_CAP per skill. */
  skillDrills?: Partial<Record<keyof BaseSkills, number>>;
  deathWeek?: number;
  deathCause?: string;
  deathEvent?: DeathEvent;
  killedBy?: string;
  retiredWeek?: number;
  lastBoutWeek?: number;
  stableId?: StableId;
  favorites?: WarriorFavorites;
  isDead?: boolean;
  dateOfDeath?: string;
  causeOfDeath?: string;
  yearlySnapshots?: Record<number, CareerRecord>;
  awards?: AnnualAward[];
  traits: string[];
  lore?: string;
  origin?: string;
  lineage?: WarriorLineage;
  isStarInvestment?: boolean;
}

// Re-exports for convenience
export {
  FightingStyle,
  STYLE_DISPLAY_NAMES,
  STYLE_ABBREV,
  type Attributes,
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS,
  ATTRIBUTE_MIN,
  ATTRIBUTE_MAX,
  ATTRIBUTE_TOTAL,
  type BaseSkills,
  type DerivedStats,
  type Gear,
  type FightPlan,
  type DeathEvent,
};
