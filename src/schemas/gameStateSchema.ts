/**
 * Comprehensive Zod schema for GameState validation
 * Provides strict validation for all state deserialization operations
 * to prevent insecure deserialization attacks and state corruption.
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
  'Rainy',
  'Sweltering',
  'Breezy',
  'Overcast',
  'Blazing Sun',
  'Gale',
  'Blood Moon',
  'Eclipse',
  'Sandstorm',
  'Zephyr',
  'Tornado',
  'Blizzard',
  'Dense Fog',
  'Mist',
  'Thunderstorm',
  'Gravity Anomaly',
  'Ashfall',
  'Acid Rain',
  'Mana Surge',
  'Rainbow',
  'Scorching Wind',
  'Spooky Night',
  'Meteor Shower',
  'Solar Flare',
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
  'Chaos Storm',
  'Chaos Squall',
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

// ─── Complex Type Schemas ─────────────────────────────────────────────────────

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
export const DerivedStatsSchema = z.object({
  hp: z.number(),
  endurance: z.number(),
  damage: z.number(),
  encumbrance: z.number(),
});

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
export const DeathEventSchema = z.object({
  boutId: z.string(),
  killerId: z.string(),
  deathSummary: z.string(),
  memorialTags: z.array(z.string()),
});

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
export const CrestChargeSchema = z.object({
  type: ChargeTypeSchema,
  name: z.string(),
  posture: BeastPostureSchema.optional(),
  count: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

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
export const SeasonalGrowthSchema = z.object({
  warriorId: z.string(),
  season: SeasonSchema,
  gains: z.record(z.string(), z.number()),
});

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
export const AIStrategySchema = z.object({
  intent: AIIntentSchema,
  targetStableId: z.string().optional(),
  planWeeksRemaining: z.number(),
});

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
export const RestStateSchema = z.object({
  warriorId: z.string(),
  restUntilWeek: z.number(),
});

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
export const MatchRecordSchema = z.object({
  week: z.number(),
  playerWarriorId: z.string(),
  opponentWarriorId: z.string(),
  opponentStableId: z.string(),
});

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
export const HallEntrySchema = z.object({
  id: z.string(),
  week: z.number(),
  label: z.enum(['Fight of the Week', 'Fight of the Tournament']),
  fightId: z.string(),
});

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
const analysisFactorSchema = z.object({
  label: z.string(),
  detail: z.string(),
  favored: z.enum(['A', 'D']).nullable(),
  weight: z.number(),
});

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
export const DeferredBoutLogSchema = z.object({
  year: z.number(),
  season: z.number(),
  boutId: z.string(),
  transcript: z.array(z.string()),
});

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
export const SurfaceModSchema = z.object({
  initiativeMod: z.number(),
  enduranceMult: z.number(),
  riposteMod: z.number(),
});

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
/**
 *
 */
export type ValidatedSaveSlotMeta = z.infer<typeof SaveSlotMetaSchema>;
