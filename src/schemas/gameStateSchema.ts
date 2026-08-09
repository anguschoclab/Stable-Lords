/**
 * Comprehensive Zod schema for GameState validation
 * Provides strict validation for all state deserialization operations
 * to prevent insecure deserialization attacks and state corruption.
 *
 * SRP split:
 * - schemaEnums.ts: All z.enum() schemas
 * - schemaObjects.ts: All z.object() schemas for sub-entities
 * - gameStateSchema.ts: Main GameStateSchema, SaveSlotMetaSchema, and exported types
 */
import { z } from 'zod';
import { SeasonSchema, WeatherTypeSchema, CrowdMoodTypeSchema } from './schemaEnums';
import {
  NewsletterItemSchema,
  LedgerEntrySchema,
  WarriorSchema,
  FightSummarySchema,
  GazetteStorySchema,
  HallEntrySchema,
  TournamentEntrySchema,
  TrainerSchema,
  TrainingAssignmentSchema,
  SeasonalGrowthSchema,
  RivalStableDataSchema,
  ScoutReportDataSchema,
  RestStateSchema,
  RivalrySchema,
  MatchRecordSchema,
  OwnerGrudgeSchema,
  InsightTokenSchema,
  OwnerSchema,
  PromoterSchema,
  BoutOfferSchema,
  RankingEntrySchema,
  AnnualAwardSchema,
  SimulationReportSchema,
  DeferredBoutLogSchema,
  BookmarkSchema,
  ProgressionStateSchema,
} from './schemaObjects';

// Re-export all schemas for backward compatibility
export {
  FightingStyleSchema,
  SeasonSchema,
  CrowdMoodTypeSchema,
  WeatherTypeSchema,
  TrainerTierSchema,
  TrainerFocusSchema,
  TrainerSpecialtySchema,
  ScoutQualitySchema,
  WarriorStatusSchema,
  InjurySeveritySchema,
  InjuryLocationSchema,
  PromoterPersonalitySchema,
  PromoterTierSchema,
  OwnerPersonalitySchema,
  MetaAdaptationSchema,
  AttackTargetSchema,
  ProtectTargetSchema,
  OffensiveTacticSchema,
  DefensiveTacticSchema,
  ConditionTriggerTypeSchema,
  PsychStateSchema,
  DistanceRangeSchema,
  ArenaZoneSchema,
  CommitLevelSchema,
  ArenaTagSchema,
  ShieldShapeSchema,
  FieldTypeSchema,
  MetalColorSchema,
  ChargeTypeSchema,
  BeastPostureSchema,
  ArmorWeightSchema,
  WeaponTypeSchema,
  EquipmentSlotSchema,
  BoutOfferStatusSchema,
  BoutOfferResponseSchema,
  FightOutcomeBySchema,
  CombatEventTypeSchema,
  DeathCauseBucketSchema,
  AIIntentSchema,
  AnnualAwardTypeSchema,
} from './schemaEnums';
export {
  AttributesSchema,
  BaseSkillsSchema,
  LuckfactorSchema,
  DerivedStatsSchema,
  NewsletterItemSchema,
  InjuryDataSchema,
  WarriorFavoritesSchema,
  WarriorLineageSchema,
  CareerRecordSchema,
  DeathEventSchema,
  EquipmentLoadoutSchema,
  PhaseStrategySchema,
  DesperatePlanSchema,
  PlanConditionSchema,
  FightPlanSchema,
  WarriorSchema,
  CrestChargeSchema,
  CrestDataSchema,
  OwnerSchema,
  PromoterSchema,
  BoutOfferSchema,
  RankingEntrySchema,
  TournamentBoutSchema,
  TournamentEntrySchema,
  TrainingAssignmentSchema,
  SeasonalGrowthSchema,
  LedgerEntrySchema,
  AIStrategySchema,
  AIEventSchema,
  AIAgentMemorySchema,
  RivalStableDataSchema,
  ScoutReportDataSchema,
  RestStateSchema,
  RivalrySchema,
  MatchRecordSchema,
  OwnerGrudgeSchema,
  GazetteStorySchema,
  InsightTokenSchema,
  HallEntrySchema,
  CombatEventSchema,
  MinuteEventSchema,
  ExchangeLogEntrySchema,
  FightOutcomeSchema,
  fightAnalysisSchema,
  FightSummarySchema,
  SimulationReportSchema,
  AnnualAwardSchema,
  ProgressionObjectiveSchema,
  ProgressionStateSchema,
  DeferredBoutLogSchema,
  BookmarkEntityTypeSchema,
  BookmarkSchema,
  TrainerSchema,
  SurfaceModSchema,
  ArenaWeatherModSchema,
  ArenaConfigSchema,
} from './schemaObjects';

// ─── Main GameState Schema ─────────────────────────────────────────────────────

/**
 * Complete GameState schema with strict validation
 * Uses .strict() to reject unknown fields
 * Uses .passthrough() for Map fields that are stripped before serialization
 */
export const GameStateSchema = z
  .object({
    meta: z
      .object({
        gameName: z.string(),
        version: z.string(),
        createdAt: z.string(),
      })
      .strict(),
    pendingResolutionData: z
      .object({
        gazette: z.array(NewsletterItemSchema),
        injuries: z.array(z.string()),
        deaths: z.array(z.string()),
        bouts: z.array(z.any()), // BoutResult - using any
        promotions: z.array(z.string()),
      })
      .optional(),
    lastWeekBoutDisplay: z
      .object({
        results: z.array(z.any()), // BoutResult - using any
        deathNames: z.array(z.string()),
        injuryNames: z.array(z.string()),
      })
      .optional(),
    ftueComplete: z.boolean(),
    ftueStep: z.number().optional(),
    coachDismissed: z.array(z.string()),
    player: OwnerSchema,
    fame: z.number(),
    popularity: z.number(),
    treasury: z.number(),
    ledger: z.array(LedgerEntrySchema),
    week: z.number(),
    year: z.number(),
    phase: z.enum(['planning', 'resolution']),
    season: SeasonSchema,
    weather: WeatherTypeSchema,
    roster: z.array(WarriorSchema),
    graveyard: z.array(WarriorSchema),
    retired: z.array(WarriorSchema),
    arenaHistory: z.array(FightSummarySchema),
    newsletter: z.array(NewsletterItemSchema),
    gazettes: z.array(GazetteStorySchema),
    hallOfFame: z.array(HallEntrySchema),
    crowdMood: CrowdMoodTypeSchema,
    tournaments: z.array(TournamentEntrySchema),
    trainers: z.array(TrainerSchema),
    hiringPool: z.array(TrainerSchema),
    trainingAssignments: z.array(TrainingAssignmentSchema),
    seasonalGrowth: z.array(SeasonalGrowthSchema),
    rivals: z.array(RivalStableDataSchema),
    scoutReports: z.array(ScoutReportDataSchema),
    restStates: z.array(RestStateSchema),
    rivalries: z.array(RivalrySchema),
    matchHistory: z.array(MatchRecordSchema),
    playerChallenges: z.array(z.string()),
    playerAvoids: z.array(z.string()),
    recruitPool: z.array(z.any()), // PoolWarrior - using any
    rosterBonus: z.number(),
    ownerGrudges: z.array(OwnerGrudgeSchema),
    insightTokens: z.array(InsightTokenSchema),
    moodHistory: z.array(z.object({ week: z.number(), mood: CrowdMoodTypeSchema })),
    isFTUE: z.boolean(),
    unacknowledgedDeaths: z.array(z.string()),
    day: z.number(),
    isTournamentWeek: z.boolean(),
    activeTournamentId: z.string().optional(),
    promoters: z.record(z.string(), PromoterSchema),
    boutOffers: z.record(z.string(), BoutOfferSchema),
    realmRankings: z.record(z.string(), RankingEntrySchema),
    awards: z.array(AnnualAwardSchema),
    lastSimulationReport: SimulationReportSchema.optional(),
    cachedMetaDrift: z.any().optional(), // Passthrough for computed field
    warriorMap: z.any().optional(), // Passthrough for Map field
    warriorToStableMap: z.any().optional(), // Passthrough for Map field
    rivalMap: z.any().optional(), // Passthrough for Map field
    warriorToOfferIds: z.any().optional(), // Passthrough for Map field
    deferredBoutLogs: z.array(DeferredBoutLogSchema).optional(),
    bookmarks: z.array(BookmarkSchema),
    progression: ProgressionStateSchema.optional(),
  })
  .strict();

// ─── Supporting Schemas ───────────────────────────────────────────────────────

/**
 * SaveSlotMeta schema for metadata validation
 */
export const SaveSlotMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  week: z.number(),
  year: z.number(),
  timestamp: z.string(),
  version: z.string(),
});

/**
 * Export type for inferred GameState type
 */
export type ValidatedGameState = z.infer<typeof GameStateSchema>;
/** Inferred type for SaveSlotMeta validation. */
export type ValidatedSaveSlotMeta = z.infer<typeof SaveSlotMetaSchema>;
