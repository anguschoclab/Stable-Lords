/**
 * Fight and combat Zod schemas (bouts, tournaments, outcomes, analysis, gazette).
 */
import { z } from 'zod';
import {
  FightingStyleSchema,
  SeasonSchema,
  CrowdMoodTypeSchema,
  WeatherTypeSchema,
  BoutOfferStatusSchema,
  BoutOfferResponseSchema,
  FightOutcomeBySchema,
  CombatEventTypeSchema,
  DeathCauseBucketSchema,
  AnnualAwardTypeSchema,
} from './schemaEnums';
import { WarriorSchema, DeathEventSchema } from './warriorSchemas';

/**
 * NewsletterItem schema
 */
export const NewsletterItemSchema = z.object({
  id: z.string(),
  week: z.number(),
  title: z.string(),
  items: z.array(z.string()),
  category: z.enum(['event', 'news', 'newsletter']).optional(),
});

/**
 * InjuryData schema
 */

/**
 * BoutOffer schema
 */
export const BoutOfferSchema = z.object({
  id: z.string(),
  promoterId: z.string(),
  warriorIds: z.array(z.string()),
  boutWeek: z.number(),
  expirationWeek: z.number(),
  purse: z.number(),
  hype: z.number(),
  status: BoutOfferStatusSchema,
  responses: z.record(z.string(), BoutOfferResponseSchema),
  proposerStableId: z.string().optional(),
  conditions: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  arenaId: z.string().optional(),
  createdAbsoluteWeek: z.number().optional(),
});

/**
 * RankingEntry schema
 */

/**
 * RankingEntry schema
 */
export const RankingEntrySchema = z.object({
  overallRank: z.number(),
  classRank: z.number(),
  compositeScore: z.number(),
});

/**
 * TournamentBout schema
 */

/**
 * TournamentBout schema
 */
export const TournamentBoutSchema = z.object({
  round: z.number(),
  matchIndex: z.number(),
  warriorIdA: z.string(),
  warriorIdD: z.string(),
  stableIdA: z.string().optional(),
  stableIdD: z.string().optional(),
  winner: z.union([z.literal('A'), z.literal('D'), z.null()]).optional(),
  by: FightOutcomeBySchema.optional(),
  fightId: z.string().optional(),
});

/**
 * TournamentEntry schema
 */

/**
 * TournamentEntry schema
 */
export const TournamentEntrySchema = z.object({
  id: z.string(),
  season: SeasonSchema,
  week: z.number(),
  tierId: z.string(),
  name: z.string(),
  bracket: z.array(TournamentBoutSchema),
  participants: z.array(WarriorSchema),
  champion: z.string().optional(),
  completed: z.boolean(),
});

/**
 * TrainingAssignment schema
 */

/**
 * GazetteStory schema
 */
export const GazetteStorySchema = z.object({
  id: z.string(),
  headline: z.string(),
  body: z.string(),
  mood: CrowdMoodTypeSchema,
  tags: z.array(z.string()),
  week: z.number(),
});

/**
 * InsightToken schema
 */

/**
 * HallEntry schema
 */
export const HallEntrySchema = z.object({
  id: z.string(),
  week: z.number(),
  label: z.enum(['Fight of the Week', 'Fight of the Tournament']),
  fightId: z.string(),
});

/**
 * CombatEvent schema
 */

/**
 * CombatEvent schema
 */
export const CombatEventSchema = z.object({
  type: CombatEventTypeSchema,
  actor: z.enum(['A', 'D']),
  target: z.enum(['A', 'D']).optional(),
  value: z.number().optional(),
  location: z.string().optional(),
  result: z.union([z.string(), z.boolean()]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * MinuteEvent schema
 */

/**
 * MinuteEvent schema
 */
export const MinuteEventSchema = z.object({
  minute: z.number(),
  text: z.string(),
  phase: z.enum(['OPENING', 'MID', 'LATE']).optional(),
  offTacticA: z.string().optional(),
  defTacticA: z.string().optional(),
  offTacticD: z.string().optional(),
  defTacticD: z.string().optional(),
  protectA: z.string().optional(),
  protectD: z.string().optional(),
  events: z.array(CombatEventSchema).optional(),
});

/**
 * ExchangeLogEntry schema
 */

/**
 * ExchangeLogEntry schema
 */
export const ExchangeLogEntrySchema = z.object({
  exchangeIndex: z.number(),
  minute: z.number(),
  phase: z.enum(['OPENING', 'MID', 'LATE']).optional(),
  attackerId: z.string().optional(),
  defenderId: z.string().optional(),
  iniWinner: z.enum(['A', 'D']).optional(),
  attResult: z.enum(['hit', 'miss', 'crit', 'fumble']).optional(),
  parResult: z.union([z.literal('success'), z.literal('fail'), z.null()]).optional(),
  defResult: z.union([z.literal('dodge'), z.literal('fail'), z.null()]).optional(),
  ripResult: z.union([z.literal('hit'), z.literal('miss'), z.null()]).optional(),
  damage: z.number().optional(),
  hitLocation: z.string().optional(),
  endDeltas: z.object({ a: z.number(), d: z.number() }).optional(),
  killWindow: z.boolean().optional(),
  executionFlag: z.boolean().optional(),
  reasonCodes: z.array(z.string()).optional(),
});

/**
 * FightOutcome schema
 */

/**
 * FightOutcome schema
 */
export const FightOutcomeSchema = z.object({
  winner: z.union([z.literal('A'), z.literal('D'), z.null()]),
  by: FightOutcomeBySchema,
  minutes: z.number(),
  log: z.array(MinuteEventSchema),
  exchangeLog: z.array(ExchangeLogEntrySchema).optional(),
  post: z
    .object({
      xpA: z.number(),
      xpD: z.number(),
      hitsA: z.number().optional(),
      hitsD: z.number().optional(),
      gotKillA: z.boolean().optional(),
      gotKillD: z.boolean().optional(),
      causeBucket: DeathCauseBucketSchema.optional(),
      fatalHitLocation: z.string().optional(),
      fatalExchangeIndex: z.number().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * AnalysisFactor schema
 */

/**
 * AnalysisFactor schema
 */
const analysisFactorSchema = z.object({
  label: z.string(),
  detail: z.string(),
  favored: z.enum(['A', 'D']).nullable(),
  weight: z.number(),
});

/**
 * FightAnalysis schema
 */

/**
 * FightAnalysis schema
 */
export const fightAnalysisSchema = z.object({
  styleMatchup: z.object({ styleA: z.string(), styleD: z.string(), edge: z.number() }),
  decisiveExchange: z.object({
    index: z.number().nullable(),
    minute: z.number().nullable(),
    reasonCodes: z.array(z.string()),
    summary: z.string(),
  }),
  fatigue: z.object({
    fatiguedSide: z.enum(['A', 'D']).nullable(),
    crossoverExchange: z.number().nullable(),
  }),
  tale: z.object({
    hitsA: z.number(),
    hitsD: z.number(),
    damageA: z.number(),
    damageD: z.number(),
    ripostesA: z.number(),
    ripostesD: z.number(),
  }),
  factors: z.array(analysisFactorSchema),
});

/**
 * FightSummary schema
 */

/**
 * FightSummary schema
 */
export const FightSummarySchema = z.object({
  id: z.string(),
  week: z.number(),
  phase: z.enum(['planning', 'resolution']).optional(),
  pendingResolutionData: z
    .object({
      gazette: z.array(NewsletterItemSchema),
      injuries: z.array(z.string()),
      deaths: z.array(z.string()),
      bouts: z.array(z.any()), // BoutResult - using any
      promotions: z.array(z.string()),
    })
    .optional(),
  tournamentId: z.string().nullable().optional(),
  title: z.string(),
  warriorIdA: z.string(),
  warriorIdD: z.string(),
  stableIdA: z.string().optional(),
  stableIdD: z.string().optional(),
  winner: z.union([z.literal('A'), z.literal('D'), z.null()]),
  by: FightOutcomeBySchema,
  styleA: z.string(),
  styleD: z.string(),
  flashyTags: z.array(z.string()).optional(),
  fameDeltaA: z.number().optional(),
  fameDeltaD: z.number().optional(),
  popularityDeltaA: z.number().optional(),
  popularityDeltaD: z.number().optional(),
  fameA: z.number().optional(),
  fameD: z.number().optional(),
  transcript: z.array(z.string()).optional(),
  createdAt: z.string(),
  isDeathEvent: z.boolean().optional(),
  deathEventData: DeathEventSchema.optional(),
  isRivalry: z.boolean().optional(),
  arenaId: z.string().optional(),
  weather: WeatherTypeSchema.optional(),
  analysis: fightAnalysisSchema.optional(),
});

/**
 * SimulationReport schema
 */

/**
 * SimulationReport schema
 */
export const SimulationReportSchema = z.object({
  id: z.string(),
  week: z.number(),
  treasuryChange: z.number(),
  trainingGains: z.array(
    z.object({
      warriorId: z.string(),
      warriorName: z.string(),
      attr: z.enum(['ST', 'CN', 'SZ', 'WT', 'WL', 'SP', 'DF']),
      gain: z.number(),
    })
  ),
  agingEvents: z.array(z.string()),
  healthEvents: z.array(z.string()),
  bouts: z.array(FightSummarySchema).optional(),
});

/**
 * AnnualAward schema
 */

/**
 * AnnualAward schema
 */
export const AnnualAwardSchema = z.object({
  year: z.number(),
  type: AnnualAwardTypeSchema,
  warriorId: z.string().optional(),
  warriorName: z.string().optional(),
  stableId: z.string().optional(),
  stableName: z.string().optional(),
  style: FightingStyleSchema.optional(),
  value: z.number(),
  reason: z.string(),
});
