/**
 * Stable Lords — Arena Championship Constants
 * Central tuning for the arena title system: contender selection, defense
 * cadence, dormancy lifecycle, refusal/stripping, and the annual
 * champions-only Grand Championship.
 */

/** Arena title tuning. */
export const ARENA_TITLE = {
  /** Weeks between scheduled title defenses (~the normal bout cadence). */
  DEFENSE_INTERVAL_WEEKS: 4,
  /** Consecutive no-contender evaluations before a title goes dormant. */
  DORMANCY_DEFERRALS: 6,
  /** Weeks a warrior who declined a title shot waits before contending again at that arena. */
  CHALLENGER_COOLDOWN_WEEKS: 8,
  /** Weeks a stripped or relinquished ex-champion waits before contending again at that arena. */
  EX_CHAMPION_COOLDOWN_WEEKS: 26,
  /** Non-medical champion refusals before the crown is stripped. */
  REFUSALS_TO_STRIP: 2,
  /** Cap on stored past reigns per arena. */
  HISTORY_CAP: 10,
  /** Champion perk deltas applied when a reign starts. */
  CHAMPION_FAME: 5,
  CHAMPION_POP: 10,
} as const;

/** Synthetic PromoterId that owns all title offers ("The Arena Commission"). */
export const ARENA_COMMISSION_ID = 'arena-commission';

/** Annual champions-only tournament tuning. */
export const CHAMPIONS_TOURNEY = {
  /** Display week (of 52) the Grand Championship occupies — last tournament of the year. */
  WEEK: 52,
  /** Minimum living champions to run the bracket; below this it is cancelled with a newsletter. */
  MIN_FIELD: 4,
  /** Bracket cap. */
  MAX_FIELD: 64,
  /** TournamentEntry.tierId for the champions bracket. */
  TIER_ID: 'Champions',
  PURSE: 2500,
  FAME: 25,
  POP: 10,
} as const;
