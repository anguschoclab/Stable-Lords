/**
 * Zod enum schemas for GameState validation.
 * Extracted from gameStateSchema.ts for SRP separation.
 */
import { z } from 'zod';
import { FightingStyle } from '@/types/shared/fightingStyles';
import {
  SEASONS,
  WEATHER_TYPES,
  TRAINER_TIERS,
  TRAINER_FOCI,
  TRAINER_SPECIALTIES,
  SCOUT_QUALITIES,
  WARRIOR_STATUSES,
  INJURY_SEVERITIES,
  INJURY_LOCATIONS,
  PROMOTER_PERSONALITIES,
  PROMOTER_TIERS,
  OWNER_PERSONALITIES,
  META_ADAPTATIONS,
  OWNER_COMPETENCES,
  WORLD_DIFFICULTIES,
  ATTACK_TARGETS,
  PROTECT_TARGETS,
  OFFENSIVE_TACTICS,
  DEFENSIVE_TACTICS,
  CONDITION_TRIGGERS,
  DISTANCE_RANGES,
  SHIELD_SHAPES,
  FIELD_TYPES,
  METAL_COLORS,
  CHARGE_TYPES,
  BEAST_POSTURES,
  BOUT_OFFER_STATUSES,
  BOUT_OFFER_RESPONSES,
  FIGHT_OUTCOME_BY,
  DEATH_CAUSE_BUCKETS,
  AI_INTENTS,
  ANNUAL_AWARD_TYPES,
  CROWD_MOODS,
  COMBAT_EVENT_TYPES,
} from '@/types/enumSources';

// ─── Base Schemas for Primitive Types ───────────────────────────────────────

/**
 * FightingStyle enum schema
 */
export const FightingStyleSchema = z.enum(FightingStyle);

/**
 * Season enum schema
 */
export const SeasonSchema = z.enum(SEASONS);

/**
 * Canonical crowd-mood values — engine/constants derive from this tuple.
 */
const CROWD_MOOD_VALUES = CROWD_MOODS;

/**
 * CrowdMoodType enum schema
 */
export const CrowdMoodTypeSchema = z.enum(CROWD_MOOD_VALUES);

/**
 * WeatherType enum schema
 */
export const WeatherTypeSchema = z.enum(WEATHER_TYPES);

/**
 * TrainerTier enum schema
 */
export const TrainerTierSchema = z.enum(TRAINER_TIERS);

/**
 * TrainerFocus enum schema
 */
export const TrainerFocusSchema = z.enum(TRAINER_FOCI);

/**
 * TrainerSpecialty enum schema
 */
export const TrainerSpecialtySchema = z.enum(TRAINER_SPECIALTIES);

/**
 * ScoutQuality enum schema
 */
export const ScoutQualitySchema = z.enum(SCOUT_QUALITIES);

/**
 * WarriorStatus enum schema
 */
export const WarriorStatusSchema = z.enum(WARRIOR_STATUSES);

/**
 * InjurySeverity enum schema
 */
export const InjurySeveritySchema = z.enum(INJURY_SEVERITIES);

/**
 * InjuryLocation enum schema
 */
export const InjuryLocationSchema = z.enum(INJURY_LOCATIONS);

/**
 * PromoterPersonality enum schema
 */
export const PromoterPersonalitySchema = z.enum(PROMOTER_PERSONALITIES);

/**
 * PromoterTier enum schema
 */
export const PromoterTierSchema = z.enum(PROMOTER_TIERS);

/**
 * OwnerPersonality enum schema
 */
export const OwnerPersonalitySchema = z.enum(OWNER_PERSONALITIES);

/**
 * MetaAdaptation enum schema
 */
export const MetaAdaptationSchema = z.enum(META_ADAPTATIONS);

/**
 * OwnerCompetence enum schema
 */
export const OwnerCompetenceSchema = z.enum(OWNER_COMPETENCES);

/**
 * WorldDifficulty enum schema
 */
export const WorldDifficultySchema = z.enum(WORLD_DIFFICULTIES);

/**
 * AttackTarget enum schema
 */
export const AttackTargetSchema = z.enum(ATTACK_TARGETS);

/**
 * ProtectTarget enum schema
 */
export const ProtectTargetSchema = z.enum(PROTECT_TARGETS);

/**
 * OffensiveTactic enum schema
 */
export const OffensiveTacticSchema = z.enum(OFFENSIVE_TACTICS);

/**
 * DefensiveTactic enum schema
 */
export const DefensiveTacticSchema = z.enum(DEFENSIVE_TACTICS);

/**
 * ConditionTriggerType enum schema
 */
export const ConditionTriggerTypeSchema = z.enum(CONDITION_TRIGGERS);



/**
 * DistanceRange enum schema
 */
export const DistanceRangeSchema = z.enum(DISTANCE_RANGES);

/**
 * ArenaZone enum schema
 */


/**
 * ShieldShape enum schema
 */
export const ShieldShapeSchema = z.enum(SHIELD_SHAPES);

/**
 * FieldType enum schema
 */
export const FieldTypeSchema = z.enum(FIELD_TYPES);

/**
 * MetalColor enum schema
 */
export const MetalColorSchema = z.enum(METAL_COLORS);

/**
 * ChargeType enum schema
 */
export const ChargeTypeSchema = z.enum(CHARGE_TYPES);

/**
 * BeastPosture enum schema
 */
export const BeastPostureSchema = z.enum(BEAST_POSTURES);







/**
 * BoutOfferStatus enum schema
 */
export const BoutOfferStatusSchema = z.enum(BOUT_OFFER_STATUSES);

/**
 * BoutOfferResponse enum schema
 */
export const BoutOfferResponseSchema = z.enum(BOUT_OFFER_RESPONSES);

/**
 * FightOutcomeBy enum schema
 */
export const FightOutcomeBySchema = z.enum(FIGHT_OUTCOME_BY);

/**
 * CombatEventType enum schema
 */
export const CombatEventTypeSchema = z.enum(COMBAT_EVENT_TYPES);

/**
 * DeathCauseBucket enum schema
 */
export const DeathCauseBucketSchema = z.enum(DEATH_CAUSE_BUCKETS);

/**
 * AIIntent enum schema
 */
export const AIIntentSchema = z.enum(AI_INTENTS);

/**
 * AnnualAwardType enum schema
 */
export const AnnualAwardTypeSchema = z.enum(ANNUAL_AWARD_TYPES);
