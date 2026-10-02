/**
 * World Population Constants — single source of truth for the living rival
 * world (megaplan: floor 90, organic growth to 150+, hard cap 200).
 *
 * Every population, expansion, starvation, free-agent, and AI-economy knob
 * lives here so world-scale tuning never buries a literal inside a pass.
 */

// ─── Population bounds ──────────────────────────────────────────────────────

/** Seeded world size and post-churn refill floor. Never refill below this. */
export const WORLD_RIVAL_FLOOR = 90;

/** Above this, organic licensing stops and bankruptcy pressure rises. */
export const WORLD_RIVAL_SOFT_CAP = 160;

/** Absolute ceiling (performance); legacy founders queue past it. */
export const WORLD_RIVAL_HARD_CAP = 200;

// ─── Seasonal churn / expansion ─────────────────────────────────────────────

/** Max stables added per seasonal churn across all sources (ramp limit). */
export const EXPANSION_MAX_PER_CHURN = 10;

/** Per-churn chance of organic licensing when the world economy is healthy
 *  and the count sits between floor and soft cap. */
export const ORGANIC_LICENSE_CHANCE = 0.5;

/** Organic licensing batch size bounds (rolled per churn when it fires). */
export const ORGANIC_LICENSE_BATCH_MIN = 2;
export const ORGANIC_LICENSE_BATCH_MAX = 4;

/** Chance a caliber retiree elects to found a stable (replaces the 0.25 roll). */
export const LEGACY_FOUND_CHANCE = 0.75;

/** Re-mint attempts when a generated stable collides with live ids/names. */
export const EXPANSION_MINT_ATTEMPTS = 8;

/** Bankruptcy gate multiplier when the world is above the soft cap —
 *  pressure rises gently so overpopulation ebb happens through failures. */
export const BANKRUPTCY_PRESSURE_ABOVE_SOFT_CAP = 1.25;

// ─── Starvation fold ────────────────────────────────────────────────────────

/** Weeks below aiRosterMin with no affordable recruit before a stable folds. */
export const STABLE_STARVATION_WEEKS = 8;

// ─── Recruit supply ─────────────────────────────────────────────────────────

/** Recruit pool depth per living rival stable. */
export const RECRUIT_POOL_PER_STABLE = 0.5;

/** Absolute floor on the shared recruit pool. */
export const RECRUIT_POOL_MIN = 20;

/** Promoter count per rival stable (30 promoters at 45 stables today). */
export const PROMOTERS_PER_STABLE = 2 / 3;

/** Absolute floor on seeded promoter count. */
export const PROMOTER_COUNT_MIN = 30;

// ─── Free agents ────────────────────────────────────────────────────────────

/** Weeks a released/displaced veteran stays on the free-agent list. */
export const FREE_AGENT_SHELF_WEEKS = 26;

// ─── Legacy founders ────────────────────────────────────────────────────────

/** Fame at which a retiree is Hall-of-Fame caliber for founding purposes.
 *  Calibrated to the fame economy (+1/win, +3/kill, +20-50/award): reachable
 *  only by decorated veterans, not ordinary careers (~90 fame ceiling). */
export const LEGACY_FOUNDER_FAME_HOF = 150;

/** Lower fame bound that still counts toward founder caliber with a record. */
export const LEGACY_FOUNDER_FAME_MIN = 90;

/** Career wins that mark a retiree as founder caliber (elite tail of the
 *  observed career distribution — most warriors retire under 15 wins). */
export const LEGACY_FOUNDER_WINS_MIN = 16;

/** Career kills that mark a retiree as founder caliber. */
export const LEGACY_FOUNDER_KILLS_MIN = 4;

/** Chance a qualifying retiree converts to a hiring-pool trainer instead of
 *  (or alongside eligibility for) founding — moved from WarriorPass literal. */
export const LEGACY_FOUNDER_TRAINER_CHANCE = 0.1;

// ─── AI recruitment ─────────────────────────────────────────────────────────

/** Liquid reserve a stable keeps when signing recruits. */
export const AI_RECRUIT_SIGNING_RESERVE = 150;

/** Max recruits a stable may sign per week. */
export const AI_RECRUITS_PER_WEEK_MAX = 2;

/** Signing fee for a generated (non-pool) fallback recruit — deliberately
 *  cheaper than pool signings so poor stables can still refill. */
export const AI_GENERATED_RECRUIT_COST = 60;

/** Recruits an academy stable gets first look at per intake. */
export const AI_ACADEMY_BONUS_RECRUITS = 2;

/** Seed base for the weekly AI draft-order rotation. */
export const AI_DRAFT_ROTATION_SEED = 7919;

// ─── AI gear policy ─────────────────────────────────────────────────────────

/** Gold per AI gear upgrade. */
export const AI_GEAR_COST = 150;

/** Treasury above which a champion always gets gear consideration. */
export const AI_GEAR_CHAMPION_TREASURY_GATE = 800;

/** Treasury above which EXPANSION/VENDETTA stables gear a second warrior. */
export const AI_GEAR_EXPANSION_TREASURY_GATE = 1000;

// ─── Arena titles ───────────────────────────────────────────────────────────
// Weekly title-bout cap lives in ARENA_TITLE (MIN_TITLE_BOUTS_PER_WEEK floor,
// scaled by arena count in arenaChampionship/phases/scheduling.ts).
