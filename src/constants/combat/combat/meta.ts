import { WARRIOR_AGING } from '@/constants/aging';

// ─── Trainer Specialty Thresholds ───────────────────────────────────────

export const TRAINER_IRONGUARD_ENDURANCE = 0.6;
export const TRAINER_ROPEADOPE_CAP = 0.5;
export const DAMAGE_RECEIVED_MULT_FLOOR = 0.5;

// ─── Aging & Veteran Compensation ─────────────────────────────────────────────
/**
 * Age at which aging penalties begin (SP/DF loss)
 * Sourced from WARRIOR_AGING.PENALTY_START to ensure a single source of truth.
 */
export const AGING_PENALTY_START = WARRIOR_AGING.PENALTY_START;

/**
 * DEF gained per attribute-point-lost × WL/15 for veteran compensation
 * Tune via balance harness to keep aged INI styles viable without over-buffing
 */
export const VETERAN_WISDOM_FACTOR = 0.25;

// ─── Manager's Notebook debrief thresholds ────────────────────────────────
// Post-bout analysis factors (buildFightAnalysis) — tuning knobs for when a
// diagnostic note is worth surfacing to the manager.
/** Encumbrance ≥ this fraction of endurance → the loadout dragged on pacing. */
export const DEBRIEF_ENCUMBRANCE_DRAG_RATIO = 0.5;
/** INI skill edge needed before repeated initiative losses count as "out-jumped". */
export const DEBRIEF_OUT_JUMP_INI_EDGE = 3;
/** Minimum recorded initiative exchanges before judging out-jump. */
export const DEBRIEF_OUT_JUMP_MIN_EXCHANGES = 4;
/** Share of exchanges lost by the faster fighter → "out-jumped" flag. */
export const DEBRIEF_OUT_JUMP_LOSS_RATE = 0.6;
/** Minimum swing attempts before judging weapon work. */
export const DEBRIEF_WEAPON_MIN_SWINGS = 4;
/** Hit-rate floor: below this (with no crits) the weapon is flagged. */
export const DEBRIEF_WEAPON_HIT_RATE_FLOOR = 0.35;
/** XP delta that makes one fighter "the bigger student" of the bout. */
export const DEBRIEF_LEARN_XP_GAP = 2;
