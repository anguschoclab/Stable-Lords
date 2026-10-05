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
  counterPurseBump: z.number().optional(),
  titleArenaId: z.string().optional(),
  responseNotes: z.record(z.string(), z.string()).optional(),
  negotiationRound: z.number().optional(),
});

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
const TournamentBoutSchema = z.object({
  round: z.number(),
  matchIndex: z.number(),
  warriorIdA: z.string(),
  warriorIdD: z.string(),
  stableIdA: z.string().optional(),
  stableIdD: z.string().optional(),
  winner: z.union([z.literal('A'), z.literal('D'), z.null()]).optional(),
  by: FightOutcomeBySchema.optional(),
  fightId: z.string().optional(),
  isBronzeMatch: z.boolean().optional(),
});

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
 * HallEntry schema
 */
export const HallEntrySchema = z.object({
  id: z.string(),
  week: z.number(),
  label: z.enum(['Fight of the Week', 'Fight of the Tournament']),
  fightId: z.string(),
});

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
const fightAnalysisSchema = z.object({
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
  titleArenaId: z.string().optional(),
  absoluteWeek: z.number().optional(),
  weather: WeatherTypeSchema.optional(),
  contractId: z.string().optional(),
  analysis: fightAnalysisSchema.optional(),
});

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

const TitleStatusSchema = z.enum(['active', 'pendingReengagement', 'dormant']);

const ArenaReignEndReasonSchema = z.enum([
  'defeated',
  'died',
  'retired',
  'stripped',
  'relinquished',
  'displaced',
]);

const ArenaTitleReignSchema = z.object({
  warriorId: z.string(),
  startedAbsoluteWeek: z.number(),
  defenses: z.number(),
  lastActivityWeek: z.number(),
});

const ArenaReignRecordSchema = z.object({
  warriorId: z.string(),
  warriorName: z.string(),
  warriorEpithet: z.string().optional(),
  stableName: z.string().optional(),
  startedAbsoluteWeek: z.number(),
  endedAbsoluteWeek: z.number(),
  endReason: ArenaReignEndReasonSchema,
  defenses: z.number(),
});

export const ArenaTitleSchema = z.object({
  champion: ArenaTitleReignSchema.nullable(),
  status: TitleStatusSchema,
  history: z.array(ArenaReignRecordSchema),
  refusals: z.number(),
  deferrals: z.number(),
  noContenderStreak: z.number(),
  declinedContenders: z.record(z.string(), z.number()),
});

export const GrandChampionEntrySchema = z.object({
  tournamentId: z.string(),
  year: z.number(),
  warriorId: z.string(),
  warriorName: z.string(),
  warriorEpithet: z.string().optional(),
  stableName: z.string().optional(),
});
