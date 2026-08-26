/**
 * Zod enum schemas for GameState validation.
 * Extracted from gameStateSchema.ts for SRP separation.
 */
import { z } from 'zod';

// ─── Base Schemas for Primitive Types ───────────────────────────────────────

/**
 * FightingStyle enum schema
 */
export const FightingStyleSchema = z.enum([
  'AIMED BLOW',
  'BASHING ATTACK',
  'LUNGING ATTACK',
  'PARRY-LUNGE',
  'PARRY-RIPOSTE',
  'PARRY-STRIKE',
  'SLASHING ATTACK',
  'STRIKING ATTACK',
  'TOTAL PARRY',
  'WALL OF STEEL',
]);

/**
 * Season enum schema
 */
export const SeasonSchema = z.enum(['Spring', 'Summer', 'Fall', 'Winter']);

/**
 * CrowdMoodType enum schema
 */
export const CrowdMoodTypeSchema = z.enum([
  'Calm',
  'Bloodthirsty',
  'Theatrical',
  'Solemn',
  'Festive',
]);

/**
 * WeatherType enum schema
 */
export const WeatherTypeSchema = z.enum([
  'Clear',
  'Crimson Snow',
  'Rainy',
  'Sweltering',
  'Breezy',
  'Overcast',
  'Blazing Sun',
  'Gale',
  'Blood Moon',
  'Weeping Skies',
  'Eclipse of Chaos',
  'Eclipse',
  'Whispering Winds',
  'Sandstorm',
  'Zephyr',
  'Tornado',
  'Blizzard',
  'Dense Fog',
  'Mist',
  'Glittering Frost',
  'Thunderstorm',
  'Gravity Anomaly',
  'Ashfall',
  'Eldritch Eclipse',
  'Prismatic Rain',
  'Moonlight Duel',
  'Acid Rain',
  'Mana Surge',
  'Rainbow',
  'Astral Dust',
  'Scorching Wind',
  'Spooky Night',
  'Meteor Shower',
  'Solar Flare',
  'Wild Magic',
  'Abyssal Gloom',
  'Cursed Miasma',
  'Hailstorm',
  'Arcane Storm',
  'Blood Rain',
  'Locust Swarm',
  'Aurora Borealis',
  'Chaotic Winds',
  'Aether Storm',
  'Mirage',
  'Ember Rain',
  'Wildfire Smoke',
  'Blood Fog',
  'Shimmering Heat',
  'Crystal Rain',
  'Rain of Frogs',
  'Winds of Chaos',
  'Chaos Storm',
  'Chaos Squall',
  'Diamond Rain',
  'Cosmic Anomaly',
  'Abyssal Tempest',
  'Temporal Rift',
  'Stardust Gale',
  'Mana Storm',
  'Shattered Skies',
]);

/**
 * TrainerTier enum schema
 */
export const TrainerTierSchema = z.enum(['Novice', 'Seasoned', 'Master']);

/**
 * TrainerFocus enum schema
 */
export const TrainerFocusSchema = z.enum(['Aggression', 'Defense', 'Endurance', 'Mind', 'Healing']);

/**
 * TrainerSpecialty enum schema
 */
export const TrainerSpecialtySchema = z.enum([
  'KillerInstinct',
  'IronConditioning',
  'CounterFighter',
  'Footwork',
  'IronGuard',
  'Finisher',
  'RopeADope',
]);

/**
 * ScoutQuality enum schema
 */
export const ScoutQualitySchema = z.enum(['Basic', 'Detailed', 'Expert']);

/**
 * WarriorStatus enum schema
 */
export const WarriorStatusSchema = z.enum(['Active', 'Dead', 'Retired']);

/**
 * InjurySeverity enum schema
 */
export const InjurySeveritySchema = z.enum([
  'Minor',
  'Moderate',
  'Severe',
  'Critical',
  'Permanent',
]);

/**
 * InjuryLocation enum schema
 */
export const InjuryLocationSchema = z.enum([
  'Head',
  'Chest',
  'Abdomen',
  'Right Arm',
  'Left Arm',
  'Right Leg',
  'Left Leg',
  'General',
]);

/**
 * PromoterPersonality enum schema
 */
export const PromoterPersonalitySchema = z.enum([
  'Greedy',
  'Honorable',
  'Sadistic',
  'Flashy',
  'Corporate',
]);

/**
 * PromoterTier enum schema
 */
export const PromoterTierSchema = z.enum(['Local', 'Regional', 'National', 'Legendary']);

/**
 * OwnerPersonality enum schema
 */
export const OwnerPersonalitySchema = z.enum([
  'Aggressive',
  'Methodical',
  'Showman',
  'Pragmatic',
  'Tactician',
]);

/**
 * MetaAdaptation enum schema
 */
export const MetaAdaptationSchema = z.enum([
  'MetaChaser',
  'Traditionalist',
  'Opportunist',
  'Innovator',
]);

/**
 * AttackTarget enum schema
 */
export const AttackTargetSchema = z.enum([
  'Head',
  'Chest',
  'Abdomen',
  'Right Arm',
  'Left Arm',
  'Right Leg',
  'Left Leg',
  'Any',
]);

/**
 * ProtectTarget enum schema
 */
export const ProtectTargetSchema = z.enum(['Head', 'Body', 'Arms', 'Legs', 'Any']);

/**
 * OffensiveTactic enum schema
 */
export const OffensiveTacticSchema = z.enum(['Lunge', 'Slash', 'Bash', 'Decisiveness', 'none']);

/**
 * DefensiveTactic enum schema
 */
export const DefensiveTacticSchema = z.enum([
  'Dodge',
  'Parry',
  'Riposte',
  'Responsiveness',
  'none',
]);

/**
 * ConditionTriggerType enum schema
 */
export const ConditionTriggerTypeSchema = z.enum([
  'HP_BELOW',
  'HP_ABOVE',
  'MOMENTUM_LEAD',
  'MOMENTUM_DEFICIT',
  'PHASE_IS',
  'ENDURANCE_BELOW',
]);

/**
 * PsychState enum schema
 */
export const PsychStateSchema = z.enum([
  'Neutral',
  'InTheZone',
  'Rattled',
  'Desperate',
  'Cruising',
  'FatiguePanic',
]);

/**
 * DistanceRange enum schema
 */
export const DistanceRangeSchema = z.enum(['Grapple', 'Tight', 'Striking', 'Extended']);

/**
 * ArenaZone enum schema
 */
export const ArenaZoneSchema = z.enum(['Center', 'Edge', 'Corner', 'Obstacle']);

/**
 * CommitLevel enum schema
 */
export const CommitLevelSchema = z.enum(['Cautious', 'Standard', 'Full']);

/**
 * ArenaTag enum schema
 */
export const ArenaTagSchema = z.enum([
  'outdoor',
  'indoor',
  'elevated',
  'water',
  'cramped',
  'open',
  'premium',
]);

/**
 * ShieldShape enum schema
 */
export const ShieldShapeSchema = z.enum(['heater', 'french', 'swiss', 'spanish', 'lozenge']);

/**
 * FieldType enum schema
 */
export const FieldTypeSchema = z.enum([
  'solid',
  'fess',
  'pale',
  'bend',
  'chevron',
  'cross',
  'saltire',
  'per-pale',
  'per-fess',
  'gyronny',
  'bend-sinister',
  'pale-environ',
  'chevron-inverted',
  'quarterly',
]);

/**
 * MetalColor enum schema
 */
export const MetalColorSchema = z.enum(['gold', 'silver']);

/**
 * ChargeType enum schema
 */
export const ChargeTypeSchema = z.enum([
  'beast',
  'weapon',
  'symbol',
  'nature',
  'celestial',
  'mythical',
]);

/**
 * BeastPosture enum schema
 */
export const BeastPostureSchema = z.enum([
  'rampant',
  'passant',
  'sejant',
  'couchant',
  'statant',
  'forcene',
]);

/**
 * ArmorWeight enum schema
 */
export const ArmorWeightSchema = z.enum(['None', 'Light', 'Medium', 'Heavy', 'Ultra-Heavy']);

/**
 * WeaponType enum schema
 */
export const WeaponTypeSchema = z.enum(['slashing', 'bashing', 'piercing', 'fist']);

/**
 * EquipmentSlot enum schema
 */
export const EquipmentSlotSchema = z.enum(['weapon', 'armor', 'shield', 'helm']);

/**
 * BoutOfferStatus enum schema
 */
export const BoutOfferStatusSchema = z.enum([
  'Proposed',
  'Signed',
  'Rejected',
  'Canceled',
  'Expired',
]);

/**
 * BoutOfferResponse enum schema
 */
export const BoutOfferResponseSchema = z.enum(['Pending', 'Accepted', 'Declined']);

/**
 * FightOutcomeBy enum schema
 */
export const FightOutcomeBySchema = z.enum([
  'Kill',
  'KO',
  'Exhaustion',
  'Stoppage',
  'Draw',
  'Decision',
  'Yield',
  'null',
]);

/**
 * CombatEventType enum schema
 */
export const CombatEventTypeSchema = z.enum([
  'INITIATIVE',
  'ATTACK',
  'DEFENSE',
  'HIT',
  'CONTEST',
  'ENDURANCE',
  'FATIGUE',
  'STATE_CHANGE',
  'BOUT_END',
  'PASSIVE',
  'INSIGHT',
  'MOMENTUM_SHIFT',
  'RANGE_SHIFT',
  'FEINT_SUCCESS',
  'FEINT_FAIL',
  'ZONE_SHIFT',
]);

/**
 * DeathCauseBucket enum schema
 */
export const DeathCauseBucketSchema = z.enum([
  'FATAL_DAMAGE',
  'EXECUTION',
  'CRITICAL_CHAIN',
  'FATIGUE_COLLAPSE',
  'ARMOR_FAILURE',
  'RIVALRY_FINISH',
]);

/**
 * AIIntent enum schema
 */
export const AIIntentSchema = z.enum([
  'EXPANSION',
  'CONSOLIDATION',
  'VENDETTA',
  'RECOVERY',
  'SURVIVAL',
  'WEALTH_ACCUMULATION',
  'AGGRESSIVE_EXPANSION',
  'ROSTER_DIVERSITY',
]);

/**
 * AnnualAwardType enum schema
 */
export const AnnualAwardTypeSchema = z.enum([
  'WARRIOR_OF_YEAR',
  'KILLER_OF_YEAR',
  'STABLE_OF_YEAR',
  'CLASS_MVP',
  'TOURNAMENT_RANK',
]);
