import { describe, it, expect } from 'vitest';
import * as stateTypes from '@/types/state.types';
import * as sharedTypes from '@/types/shared.types';

/**
 * Type-surface parity guard — megaplan I6/I9.
 *
 * When state.types.ts / shared.types.ts are split into domain shards behind
 * re-export barrels, EVERY exported name must still resolve through the
 * original module paths. Type-only members can't be asserted at runtime
 * (they're erased), so this spec pairs:
 *   1. a type-level import list below — tsc fails if any name vanishes, and
 *   2. runtime assertions for the value exports (enums, const tables).
 */

// ─── type-level parity (compile-time) ────────────────────────────────────────
import type {
  Warrior, DeathEvent, WeatherType, Season, CrowdMoodType, NewsletterItem,
  TrainerTier, TrainerFocus, Trainer, ScoutQuality, CrestData, FightSummary,
  FightOutcomeBy, PoolWarrior, RankingEntry, BoutOfferStatus, BoutOfferResponse,
  BoutOffer, PromoterPersonality, TitleStatus, ArenaReignEndReason, ArenaTitleReign,
  ArenaReignRecord, ArenaTitle, GrandChampionEntry, Promoter, OwnerPersonality,
  MetaAdaptation, Owner, TournamentBout, TournamentEntry, TrainingAssignment,
  SeasonalGrowth, LedgerEntry, AIIntent, AIStrategy, AIEventCause, AIEvent,
  OpponentDossier, CrownAssessment, AIAgentMemory, RivalStableData, ScoutReportData,
  RestState, Rivalry, MatchRecord, OwnerGrudge, GazetteStory, InsightTokenType,
  InsightToken, HallEntry, SimulationReport, AnnualAwardType, AnnualAward,
  ObjectiveId, ProgressionObjective, ProgressionStatus, ProgressionState,
  DeferredBoutLog, HouseRules, LifetimeStats, GameState, UIPrefs,
} from '@/types/state.types';
import type {
  Brand, WarriorId, StableId, PromoterId, TrainerId, FightId, TournamentId,
  BoutOfferId, InjuryId, LedgerEntryId, ScoutReportId, NewsId, GrudgeId, RivalryId,
  InsightId, HallEntryId, SimulationReportId, Attributes, BaseSkills, DerivedStats,
  AttackTarget, ProtectTarget, OffensiveTactic, DefensiveTactic, PhaseStrategy,
  DesperatePlan, FightPlan, ConditionTriggerType, PlanCondition, PsychState,
  DistanceRange, ArenaZone, CommitLevel, ArenaTag, SurfaceMod, ArenaWeatherMod,
  ArenaConfig, TrainerSpecialty,
} from '@/types/shared.types';

// Referenced so unused-import lint stays quiet and tsc resolves each name.
type _StateSurface =
  | Warrior | DeathEvent | WeatherType | Season | CrowdMoodType | NewsletterItem
  | TrainerTier | TrainerFocus | Trainer | ScoutQuality | CrestData | FightSummary
  | FightOutcomeBy | PoolWarrior | RankingEntry | BoutOfferStatus | BoutOfferResponse
  | BoutOffer | PromoterPersonality | TitleStatus | ArenaReignEndReason | ArenaTitleReign
  | ArenaReignRecord | ArenaTitle | GrandChampionEntry | Promoter | OwnerPersonality
  | MetaAdaptation | Owner | TournamentBout | TournamentEntry | TrainingAssignment
  | SeasonalGrowth | LedgerEntry | AIIntent | AIStrategy | AIEventCause | AIEvent
  | OpponentDossier | CrownAssessment | AIAgentMemory | RivalStableData | ScoutReportData
  | RestState | Rivalry | MatchRecord | OwnerGrudge | GazetteStory | InsightTokenType
  | InsightToken | HallEntry | SimulationReport | AnnualAwardType | AnnualAward
  | ObjectiveId | ProgressionObjective | ProgressionStatus | ProgressionState
  | DeferredBoutLog | HouseRules | LifetimeStats | GameState | UIPrefs;
type _SharedSurface =
  | Brand<unknown, string> | WarriorId | StableId | PromoterId | TrainerId | FightId | TournamentId
  | BoutOfferId | InjuryId | LedgerEntryId | ScoutReportId | NewsId | GrudgeId
  | RivalryId | InsightId | HallEntryId | SimulationReportId | Attributes | BaseSkills
  | DerivedStats | AttackTarget | ProtectTarget | OffensiveTactic | DefensiveTactic
  | PhaseStrategy | DesperatePlan | FightPlan | ConditionTriggerType | PlanCondition
  | PsychState | DistanceRange | ArenaZone | CommitLevel | ArenaTag | SurfaceMod
  | ArenaWeatherMod | ArenaConfig | TrainerSpecialty;
export type { _StateSurface, _SharedSurface };

// ─── runtime parity (value exports) ──────────────────────────────────────────
describe('megaplan: type module surface parity', () => {
  it('state.types exports its value members', () => {
    expect(stateTypes.CANONICAL_HOUSE_RULES).toBeDefined();
  });
  it('shared.types exports its value members', () => {
    expect(sharedTypes.FightingStyle).toBeDefined();
    expect(sharedTypes.STYLE_DISPLAY_NAMES).toBeDefined();
    expect(sharedTypes.STYLE_ABBREV).toBeDefined();
    expect(sharedTypes.ATTRIBUTE_KEYS).toBeDefined();
    expect(sharedTypes.ATTRIBUTE_LABELS).toBeDefined();
    expect(sharedTypes.ATTRIBUTE_MIN).toBeDefined();
    expect(sharedTypes.ATTRIBUTE_MAX).toBeDefined();
    expect(sharedTypes.ATTRIBUTE_TOTAL).toBeDefined();
  });
});
