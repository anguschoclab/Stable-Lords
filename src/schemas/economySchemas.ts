/**
 * Economy, progression, and miscellaneous Zod schemas (owners, AI, training, ledger, arena config).
 */
import { z } from 'zod';
import { FightingStyleSchema, SeasonSchema, WeatherTypeSchema, TrainerTierSchema, TrainerFocusSchema, TrainerSpecialtySchema, ScoutQualitySchema, PromoterPersonalitySchema, PromoterTierSchema, OwnerPersonalitySchema, MetaAdaptationSchema, ArenaZoneSchema, ArenaTagSchema, ShieldShapeSchema, FieldTypeSchema, MetalColorSchema, ChargeTypeSchema, BeastPostureSchema, AIIntentSchema } from './schemaEnums';
import { WarriorSchema } from './warriorSchemas';

/**
 * CrestCharge schema
 */
export const CrestChargeSchema = z.object({
  type: ChargeTypeSchema,
  name: z.string(),
  posture: BeastPostureSchema.optional(),
  count: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

/**
 * CrestData schema
 */

/**
 * CrestData schema
 */
export const CrestDataSchema = z.object({
  shieldShape: ShieldShapeSchema,
  fieldType: FieldTypeSchema,
  primaryColor: z.string(),
  secondaryColor: z.string().optional(),
  metalColor: MetalColorSchema,
  charge: CrestChargeSchema,
  generation: z.number(),
  parentCrest: z.any().optional(), // Recursive - using any
});

/**
 * Owner schema
 */

/**
 * Owner schema
 */
export const OwnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  stableName: z.string(),
  fame: z.number(),
  renown: z.number(),
  titles: z.number(),
  personality: OwnerPersonalitySchema.optional(),
  metaAdaptation: MetaAdaptationSchema.optional(),
  favoredStyles: z.array(FightingStyleSchema).optional(),
  generation: z.number().optional(),
  crest: CrestDataSchema.optional(),
  backstoryId: z.string().optional(),
  foundedByWarriorId: z.string().optional(),
  age: z.number().optional(),
  ageRetired: z.number().optional(),
});

/**
 * Promoter schema
 */

/**
 * Promoter schema
 */
export const PromoterSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number(),
  personality: PromoterPersonalitySchema,
  tier: PromoterTierSchema,
  capacity: z.number(),
  biases: z.array(FightingStyleSchema),
  history: z.object({
    totalPursePaid: z.number(),
    notableBouts: z.array(z.string()),
    mentorId: z.string().optional(),
    legacyFame: z.number(),
  }),
});

/**
 * BoutOffer schema
 */

/**
 * TrainingAssignment schema
 */
export const TrainingAssignmentSchema = z.object({
  warriorId: z.string(),
  type: z.enum(['attribute', 'recovery', 'skillDrill', 'trait']),
  attribute: z.enum(['ST', 'CN', 'SZ', 'WT', 'WL', 'SP', 'DF']).optional(),
  skill: z.enum(['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC']).optional(),
  trainerId: z.string().optional(),
  weeksRemaining: z.number().optional(),
});

/**
 * SeasonalGrowth schema
 */

/**
 * SeasonalGrowth schema
 */
export const SeasonalGrowthSchema = z.object({
  warriorId: z.string(),
  season: SeasonSchema,
  gains: z.record(z.string(), z.number()),
});

/**
 * LedgerEntry schema
 */

/**
 * LedgerEntry schema
 */
export const LedgerEntrySchema = z.object({
  id: z.string(),
  week: z.number(),
  label: z.string(),
  amount: z.number(),
  category: z.enum(['fight', 'training', 'recruit', 'trainer', 'upkeep', 'prize', 'other']),
});

/**
 * AIStrategy schema
 */

/**
 * AIStrategy schema
 */
export const AIStrategySchema = z.object({
  intent: AIIntentSchema,
  targetStableId: z.string().optional(),
  planWeeksRemaining: z.number(),
});

/**
 * AIEvent schema
 */

/**
 * AIEvent schema
 */
export const AIEventSchema = z.object({
  id: z.string(),
  week: z.number(),
  type: z.enum(['STRATEGY', 'FINANCE', 'ROSTER', 'STAFF']),
  description: z.string(),
  riskTier: z.enum(['Low', 'Medium', 'High']),
});

/**
 * AIAgentMemory schema
 */

/**
 * AIAgentMemory schema
 */
export const AIAgentMemorySchema = z.object({
  lastTreasury: z.number(),
  burnRate: z.number(),
  metaAwareness: z.record(z.string(), z.number()),
  knownRivals: z.array(z.string()),
  currentIntent: AIIntentSchema.optional(),
  seasonRecord: z
    .object({
      wins: z.number(),
      losses: z.number(),
      kills: z.number(),
      rosterSizeAtSeasonStart: z.number(),
    })
    .optional(),
});

/**
 * RivalStableData schema
 */

/**
 * RivalStableData schema
 */
export const RivalStableDataSchema = z.object({
  id: z.string(),
  owner: OwnerSchema,
  fame: z.number(),
  roster: z.array(WarriorSchema),
  trainers: z.array(z.any()).optional(), // Trainer - using any for simplicity
  treasury: z.number(),
  strategy: AIStrategySchema.optional(),
  agentMemory: AIAgentMemorySchema.optional(),
  actionHistory: z.array(AIEventSchema).optional(),
  motto: z.string().optional(),
  origin: z.string().optional(),
  philosophy: z.string().optional(),
  tier: z.enum(['Minor', 'Established', 'Major', 'Legendary']).optional(),
  crest: CrestDataSchema.optional(),
  seasonalGrowth: z.array(SeasonalGrowthSchema).optional(),
  ledger: z.array(LedgerEntrySchema),
  trainingAssignments: z.array(TrainingAssignmentSchema),
});

/**
 * ScoutReportData schema
 */

/**
 * ScoutReportData schema
 */
export const ScoutReportDataSchema = z.object({
  id: z.string(),
  warriorName: z.string(),
  style: z.string(),
  quality: ScoutQualitySchema,
  week: z.number(),
  attributeRanges: z.record(z.string(), z.string()),
  record: z.string(),
  knownInjuries: z.array(z.string()),
  suspectedOE: z.string().optional(),
  suspectedAL: z.string().optional(),
  notes: z.string(),
});

/**
 * RestState schema
 */

/**
 * OwnerGrudge schema
 */
export const OwnerGrudgeSchema = z.object({
  id: z.string(),
  ownerIdA: z.string(),
  ownerIdB: z.string(),
  intensity: z.number(),
  reason: z.string(),
  startWeek: z.number(),
  lastEscalation: z.number(),
});

/**
 * GazetteStory schema
 */

export const ProgressionObjectiveSchema = z.object({
  id: z.enum([
    'TOP_10_STABLE',
    'TOP_3_STABLE',
    'FIRST_TOURNAMENT_WIN',
    'HALL_OF_FAMER',
    'REALM_CHAMPION',
  ]),
  label: z.string(),
  description: z.string(),
  completed: z.boolean(),
  completedWeek: z.number().optional(),
  completedYear: z.number().optional(),
});

export const ProgressionStateSchema = z.object({
  status: z.enum(['active', 'won', 'continued']),
  stableStanding: z.number(),
  totalStables: z.number(),
  objectives: z.array(ProgressionObjectiveSchema),
  wonYear: z.number().optional(),
  wonWeek: z.number().optional(),
  acknowledgedWin: z.boolean().optional(),
});

/**
 * DeferredBoutLog schema
 */

/**
 * DeferredBoutLog schema
 */
export const DeferredBoutLogSchema = z.object({
  year: z.number(),
  season: z.number(),
  boutId: z.string(),
  transcript: z.array(z.string()),
});

/**
 * Bookmark schema
 */

/**
 * Bookmark schema
 */
export const BookmarkEntityTypeSchema = z.enum([
  'warrior',
  'rival',
  'promoter',
  'trainer',
  'tournament',
  'boutOffer',
  'scoutReport',
]);

export const BookmarkSchema = z.object({
  entityType: BookmarkEntityTypeSchema,
  entityId: z.string(),
  createdAt: z.string(),
});

/**
 * Trainer schema
 */

/**
 * Trainer schema
 */
export const TrainerSchema = z.object({
  id: z.string(),
  name: z.string(),
  tier: TrainerTierSchema,
  focus: TrainerFocusSchema,
  fame: z.number(),
  age: z.number(),
  contractWeeksLeft: z.number(),
  retiredFromWarrior: z.string().optional(),
  retiredFromStyle: FightingStyleSchema.optional(),
  styleBonusStyle: FightingStyleSchema.optional(),
  legacyWins: z.number().optional(),
  legacyKills: z.number().optional(),
  specialty: TrainerSpecialtySchema.optional(),
});

/**
 * SurfaceMod schema
 */

/**
 * SurfaceMod schema
 */
export const SurfaceModSchema = z.object({
  initiativeMod: z.number(),
  enduranceMult: z.number(),
  riposteMod: z.number(),
});

/**
 * ArenaWeatherMod schema
 */

/**
 * ArenaWeatherMod schema
 */
export const ArenaWeatherModSchema = z.object({
  weatherType: WeatherTypeSchema,
  zoneDef: z.record(ArenaZoneSchema, z.number()).optional(),
  surfaceMod: SurfaceModSchema.optional(),
});

/**
 * ArenaConfig schema
 */

/**
 * ArenaConfig schema
 */
export const ArenaConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  tags: z.array(ArenaTagSchema),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  size: z.union([z.literal('cramped'), z.literal('standard'), z.literal('open')]),
  description: z.string(),
  zoneDef: z.record(ArenaZoneSchema, z.number()),
  surfaceMod: SurfaceModSchema,
  weatherMods: z.array(ArenaWeatherModSchema).optional(),
  startingZone: ArenaZoneSchema.optional(),
});
