/**
 * Stable Lords — Arena Championship Constants
 * Central tuning for the arena title system: contender selection, defense
 * cadence, dormancy lifecycle, refusal/stripping, and the annual
 * champions-only Grand Championship.
 */

/** Arena title tuning. */
export const ARENA_TITLE = {
  /** Minimum venue bouts (wins + losses) before a warrior can contend for that arena's title. */
  MIN_BOUTS: 3,
  /** Weeks between scheduled title defenses (~the normal bout cadence). */
  DEFENSE_INTERVAL_WEEKS: 4,
  /** Floor on the weekly title-bout cap; the live cap scales with the arena
   *  roster (ceil(arenaCount / DEFENSE_INTERVAL_WEEKS)) so every venue can
   *  defend on cadence — see titleBoutsPerWeekCap in phases/scheduling. */
  MIN_TITLE_BOUTS_PER_WEEK: 3,
  /** Non-medical champion refusals before the crown is stripped. */
  REFUSALS_TO_STRIP: 2,
  /** Weeks a warrior who declined a title shot waits before contending again at that arena. */
  CHALLENGER_COOLDOWN_WEEKS: 8,
  /** Weeks a stripped or relinquished ex-champion waits before contending again at that arena. */
  EX_CHAMPION_COOLDOWN_WEEKS: 26,
  /** Consecutive no-contender evaluations before a title goes dormant. */
  DORMANCY_STREAK: 4,
  /** Reign-activity window for the champion fame/popularity trickle. */
  ACTIVITY_WINDOW_WEEKS: 6,
  /** Purse multiplier applied to title-bout purses vs the baseline. */
  PURSE_MULTIPLIER: 1.5,
  /** Flat hype bonus on title-bout offers. */
  HYPE_BONUS: 50,
  /** Per-week champion trickle while the reign is active. */
  CHAMPION_FAME_PER_WEEK: 2,
  CHAMPION_POPULARITY_PER_WEEK: 1,
  /** Cap on stored past reigns per arena. */
  HISTORY_CAP: 20,
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
  FIELD_CAP: 64,
  /** TournamentEntry.tierId for the champions bracket. */
  TIER_ID: 'Champions',
  NAME: 'The Grand Championship',
  PURSE: 2500,
  WINNER_FAME: 25,
  WINNER_POP: 10,
  /** Accolade title persisted on the winner. */
  TITLE: 'Grand Champion',
} as const;
