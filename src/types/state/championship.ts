import type { FightId, PromoterId, WarriorId } from '../shared.types';
import type { FightingStyle } from '../warrior.types';
import type { PromoterPersonality } from './rankings';




/**
 * Lifecycle status of an arena title.
 * - active: champion is locked to title bouts (ordinary offers are suppressed,
 *   and any non-title pairing is voided at the pairing choke point).
 * - pendingReengagement: a contender emerged while dormant — no NEW ordinary
 *   offers are generated, but already-signed ones resolve before the title
 *   goes active again.
 * - dormant: no eligible contender — the champion may book ordinary bouts.
 */
export type TitleStatus = 'active' | 'pendingReengagement' | 'dormant';



/**
 * How a reign ended. `displaced` = the champion's stable folded and the
 * warrior left as a free agent — distinct from `retired`, which means the
 * warrior actually hung up the blade.
 */
export type ArenaReignEndReason =
  | 'defeated'
  | 'died'
  | 'retired'
  | 'stripped'
  | 'relinquished'
  | 'displaced';



/**
 * The live reign. Only warrior + timing are persisted — the owning stable is
 * derived from the warrior at render time so poaches/transfers can't drift.
 */
export interface ArenaTitleReign {
  warriorId: WarriorId;
  startedAbsoluteWeek: number;
  defenses: number;
  lastActivityWeek: number;
}



/** A completed reign — stableName is stamped at end time as a historical fact. */
export interface ArenaReignRecord {
  warriorId: WarriorId;
  warriorName: string;
  /** Epithet held when the reign ended — stamped as a historical fact like warriorName. */
  warriorEpithet?: string;
  stableName?: string;
  startedAbsoluteWeek: number;
  endedAbsoluteWeek: number;
  endReason: ArenaReignEndReason;
  defenses: number;
}



/**
 * Per-arena championship state.
 */
export interface ArenaTitle {
  champion: ArenaTitleReign | null;
  status: TitleStatus;
  /** Past reigns, most recent last, capped at HISTORY_CAP. */
  history: ArenaReignRecord[];
  /** Champion's non-medical refusal count — stripped at REFUSALS_TO_STRIP. */
  refusals: number;
  /** Informational count of defense scheduling slides (booking conflicts). */
  deferrals: number;
  /** Consecutive evaluations with no eligible contender — drives dormancy. */
  noContenderStreak: number;
  /** warriorId → absoluteWeek when their contender cooldown expires.
   *  Covers declined title shots (CHALLENGER_COOLDOWN_WEEKS) and
   *  stripped/relinquished ex-champions (EX_CHAMPION_COOLDOWN_WEEKS). */
  declinedContenders: Record<string, number>;
}



/** Winner record for the annual champions-only Grand Championship. */
export interface GrandChampionEntry {
  tournamentId: string;
  year: number;
  warriorId: WarriorId;
  warriorName: string;
  /** Epithet held at crowning — historical snapshot, not a live read. */
  warriorEpithet?: string;
  stableName?: string;
}



/**
 * Defines the shape of promoter.
 */
export interface Promoter {
  id: PromoterId;
  name: string;
  age: number;
  personality: PromoterPersonality;
  tier: 'Local' | 'Regional' | 'National' | 'Legendary';
  capacity: number; // Max bouts per week
  biases: FightingStyle[];
  arenaPool?: string[];
  history: {
    totalPursePaid: number;
    notableBouts: FightId[];
    mentorId?: PromoterId;
    legacyFame: number;
  };
}
