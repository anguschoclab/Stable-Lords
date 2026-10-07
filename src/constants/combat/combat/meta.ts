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
