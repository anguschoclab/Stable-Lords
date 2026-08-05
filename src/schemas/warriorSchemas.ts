/**
 * Warrior-related Zod schemas (attributes, skills, injuries, equipment, plans, rivalries).
 */
import { z } from 'zod';
import { FightingStyleSchema, SeasonSchema, CrowdMoodTypeSchema, WeatherTypeSchema, TrainerTierSchema, TrainerFocusSchema, TrainerSpecialtySchema, ScoutQualitySchema, WarriorStatusSchema, InjurySeveritySchema, InjuryLocationSchema, PromoterPersonalitySchema, PromoterTierSchema, OwnerPersonalitySchema, MetaAdaptationSchema, AttackTargetSchema, ProtectTargetSchema, OffensiveTacticSchema, DefensiveTacticSchema, ConditionTriggerTypeSchema, PsychStateSchema, DistanceRangeSchema, ArenaZoneSchema, CommitLevelSchema, ArenaTagSchema, ShieldShapeSchema, FieldTypeSchema, MetalColorSchema, ChargeTypeSchema, BeastPostureSchema, ArmorWeightSchema, WeaponTypeSchema, EquipmentSlotSchema, BoutOfferStatusSchema, BoutOfferResponseSchema, FightOutcomeBySchema, CombatEventTypeSchema, DeathCauseBucketSchema, AIIntentSchema, AnnualAwardTypeSchema } from './schemaEnums';


/**
 * Attributes schema with range validation (3-25)
 */
export const AttributesSchema = z.object({
  ST: z.number().min(3).max(25),
  CN: z.number().min(3).max(25),
  SZ: z.number().min(3).max(25),
  WT: z.number().min(3).max(25),
  WL: z.number().min(3).max(25),
  SP: z.number().min(3).max(25),
  DF: z.number().min(3).max(25),
});

/**
 * BaseSkills schema (non-negative)
 */

/**
 * BaseSkills schema (non-negative)
 */
export const BaseSkillsSchema = z.object({
  ATT: z.number().min(0),
  PAR: z.number().min(0),
  DEF: z.number().min(0),
  INI: z.number().min(0),
  RIP: z.number().min(0),
  DEC: z.number().min(0),
});

/**
 * Luckfactor schema (allows negative ±4 deltas)
 */

/**
 * Luckfactor schema (allows negative ±4 deltas)
 */
export const LuckfactorSchema = z.object({
  ATT: z.number(),
  PAR: z.number(),
  DEF: z.number(),
  INI: z.number(),
  RIP: z.number(),
  DEC: z.number(),
});

/**
 * DerivedStats schema
 */

/**
 * DerivedStats schema
 */
export const DerivedStatsSchema = z.object({
  hp: z.number(),
  endurance: z.number(),
  damage: z.number(),
  encumbrance: z.number(),
});

/**
 * NewsletterItem schema
 */

/**
 * InjuryData schema
 */
export const InjuryDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  severity: InjurySeveritySchema,
  location: InjuryLocationSchema.optional(),
  weeksRemaining: z.number(),
  penalties: z.record(z.string(), z.number()),
  permanent: z.boolean().optional(),
});

/**
 * WarriorFavorites schema
 */

/**
 * WarriorFavorites schema
 */
export const WarriorFavoritesSchema = z.object({
  weaponId: z.string(),
  rhythm: z.object({
    oe: z.number(),
    al: z.number(),
  }),
  discovered: z.object({
    weapon: z.boolean(),
    rhythm: z.boolean(),
    weaponHints: z.number(),
    rhythmHints: z.number(),
  }),
});

/**
 * WarriorLineage schema
 */

/**
 * WarriorLineage schema
 */
export const WarriorLineageSchema = z.object({
  parentId: z.string().optional(),
  stableId: z.string().optional(),
  generation: z.number(),
  pedigree: z.enum(['Commoner', 'Second Generation', 'Legacy', 'Noble Blood', 'Exiled Legend']),
  mentorName: z.string().optional(),
});

/**
 * CareerRecord schema
 */

/**
 * CareerRecord schema
 */
export const CareerRecordSchema = z.object({
  wins: z.number(),
  losses: z.number(),
  kills: z.number(),
  fame: z.number().optional(),
  medals: z
    .object({
      gold: z.number(),
      silver: z.number(),
      bronze: z.number(),
    })
    .optional(),
  byArena: z
    .record(z.string(), z.object({ wins: z.number(), losses: z.number(), kills: z.number() }))
    .optional(),
});

/**
 * DeathEvent schema
 */

/**
 * DeathEvent schema
 */
export const DeathEventSchema = z.object({
  boutId: z.string(),
  killerId: z.string(),
  deathSummary: z.string(),
  memorialTags: z.array(z.string()),
});

/**
 * EquipmentLoadout schema
 */

/**
 * EquipmentLoadout schema
 */
export const EquipmentLoadoutSchema = z.object({
  weapon: z.string(),
  armor: z.string(),
  shield: z.string(),
  helm: z.string(),
});

/**
 * PhaseStrategy schema
 */

/**
 * PhaseStrategy schema
 */
export const PhaseStrategySchema = z.object({
  OE: z.number(),
  AL: z.number(),
  killDesire: z.number(),
  offensiveTactic: OffensiveTacticSchema.optional(),
  defensiveTactic: DefensiveTacticSchema.optional(),
  target: AttackTargetSchema.optional(),
  aggressionBias: z.number().optional(),
});

/**
 * DesperatePlan schema
 */

/**
 * DesperatePlan schema
 */
export const DesperatePlanSchema = z.object({
  OE: z.number(),
  AL: z.number(),
  killDesire: z.number().optional(),
  offensiveTactic: OffensiveTacticSchema.optional(),
  defensiveTactic: DefensiveTacticSchema.optional(),
  target: AttackTargetSchema.optional(),
  protect: ProtectTargetSchema.optional(),
});

/**
 * PlanCondition schema
 */

/**
 * PlanCondition schema
 */
export const PlanConditionSchema = z.object({
  trigger: z.object({
    type: ConditionTriggerTypeSchema,
    value: z.union([z.number(), z.string()]),
  }),
  override: z.object({
    OE: z.number().optional(),
    AL: z.number().optional(),
    killDesire: z.number().optional(),
    offensiveTactic: OffensiveTacticSchema.optional(),
    defensiveTactic: DefensiveTacticSchema.optional(),
  }),
  label: z.string().optional(),
});

/**
 * FightPlan schema
 */

/**
 * FightPlan schema
 */
export const FightPlanSchema = z.object({
  style: FightingStyleSchema,
  OE: z.number(),
  AL: z.number(),
  killDesire: z.number().optional(),
  aggressionBias: z.number().optional(),
  openingMove: z.enum(['Safe', 'Aggressive', 'Measured']).optional(),
  fallbackCondition: z.enum(['FLEE', 'TURTLE', 'BERZERK', 'None']).optional(),
  target: AttackTargetSchema.optional(),
  protect: ProtectTargetSchema.optional(),
  offensiveTactic: OffensiveTacticSchema.optional(),
  defensiveTactic: DefensiveTacticSchema.optional(),
  equipment: EquipmentLoadoutSchema.optional(),
  desperatePlan: DesperatePlanSchema.optional(),
  phases: z
    .object({
      opening: PhaseStrategySchema.optional(),
      mid: PhaseStrategySchema.optional(),
      late: PhaseStrategySchema.optional(),
    })
    .optional(),
  conditions: z.array(PlanConditionSchema).optional(),
  feintTendency: z.number().optional(),
  rangePreference: DistanceRangeSchema.optional(),
  ownerPersonality: OwnerPersonalitySchema.optional(),
});

/**
 * Warrior schema
 */

/**
 * Warrior schema
 */
export const WarriorSchema = z.object({
  id: z.string(), // WarriorId branded type - runtime string
  name: z.string(),
  style: FightingStyleSchema,
  attributes: AttributesSchema,
  potential: z.record(z.string(), z.number()).optional(),
  baseSkills: BaseSkillsSchema.optional(),
  luckfactor: LuckfactorSchema.optional(),
  derivedStats: DerivedStatsSchema.optional(),
  fame: z.number(),
  popularity: z.number(),
  titles: z.array(z.string()),
  injuries: z.array(InjuryDataSchema),
  flair: z.array(z.string()),
  career: CareerRecordSchema,
  champion: z.boolean(),
  plan: FightPlanSchema.optional(),
  equipment: EquipmentLoadoutSchema.optional(),
  status: WarriorStatusSchema,
  age: z.number().optional(),
  fatigue: z.number().optional(),
  seasonPoints: z.number().optional(),
  xp: z.number().optional(),
  potentialRevealed: z.record(z.string(), z.boolean()).optional(),
  skillDrills: z.record(z.string(), z.number()).optional(),
  deathWeek: z.number().optional(),
  deathCause: z.string().optional(),
  deathEvent: DeathEventSchema.optional(),
  killedBy: z.string().optional(),
  retiredWeek: z.number().optional(),
  lastBoutWeek: z.number().optional(),
  stableId: z.string().optional(), // StableId branded type - runtime string
  favorites: WarriorFavoritesSchema.optional(),
  isDead: z.boolean().optional(),
  dateOfDeath: z.string().optional(),
  causeOfDeath: z.string().optional(),
  yearlySnapshots: z.record(z.string(), CareerRecordSchema).optional(),
  awards: z.array(z.any()).optional(), // AnnualAward - using any for circular reference
  traits: z.array(z.string()),
  trainability: z.number().optional(),
  lore: z.string().optional(),
  origin: z.string().optional(),
  lineage: WarriorLineageSchema.optional(),
  isStarInvestment: z.boolean().optional(),
});

/**
 * CrestCharge schema
 */

/**
 * RestState schema
 */
export const RestStateSchema = z.object({
  warriorId: z.string(),
  restUntilWeek: z.number(),
});

/**
 * Rivalry schema
 */

/**
 * Rivalry schema
 */
export const RivalrySchema = z.object({
  id: z.string(),
  stableIdA: z.string(),
  stableIdB: z.string(),
  intensity: z.number(),
  reason: z.string(),
  startWeek: z.number(),
});

/**
 * MatchRecord schema
 */

/**
 * MatchRecord schema
 */
export const MatchRecordSchema = z.object({
  week: z.number(),
  playerWarriorId: z.string(),
  opponentWarriorId: z.string(),
  opponentStableId: z.string(),
});

/**
 * OwnerGrudge schema
 */

/**
 * InsightToken schema
 */
export const InsightTokenSchema = z.object({
  id: z.string(),
  type: z.enum(['Weapon', 'Rhythm', 'Style', 'Attribute', 'Tactic', 'Trait']),
  warriorId: z.string(),
  warriorName: z.string(),
  detail: z.string(),
  targetKey: z.string().optional(),
  origin: z.string().optional(),
  discoveredWeek: z.number(),
});

/**
 * HallEntry schema
 */
