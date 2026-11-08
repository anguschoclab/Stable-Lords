// ─── Total Parry (TP) — per-style balance knobs ─────────────────────────────
/** Total Parry fatigue-exploit: endurance ratio below which the severe tier applies. */
export const TP_FATIGUE_SEVERE_RATIO = 0.25;
/** Total Parry fatigue-exploit: endurance ratio below which the moderate tier applies. */
export const TP_FATIGUE_MODERATE_RATIO = 0.5;
/** Total Parry fatigue-exploit: severe-tier riposte bonus. */
export const TP_FATIGUE_SEVERE_RIP = 2;
/** Total Parry fatigue-exploit: severe-tier damage bonus. */
export const TP_FATIGUE_SEVERE_DMG = 1;
/** Total Parry fatigue-exploit: moderate-tier riposte bonus. */
export const TP_FATIGUE_MODERATE_RIP = 1;
/** Total Parry fatigue-exploit: moderate-tier damage bonus. */
export const TP_FATIGUE_MODERATE_DMG = 1;

// ─── Passive ────────────────────────────────────────────────────────────────
/** Total Parry passive: the style attacks poorly on purpose. */
export const TP_PASSIVE_ATT = -1;
/** Total Parry passive: flat parry (mastery adds late) and INI bonuses. */
export const TP_PASSIVE_PAR = 1;
export const TP_PASSIVE_INI = 1;
/** Total Parry passive narrative: late phase with endurance to spare. */
export const TP_PASSIVE_NARRATIVE_END_RATIO = 0.5;

// ─── Kill mechanic ──────────────────────────────────────────────────────────
/** Total Parry kill mechanic: phase-scaled kill bonuses — punishes early, patient late. */
export const TP_KILL_LATE_BONUS = 0;
export const TP_KILL_MID_BONUS = -0.02;
export const TP_KILL_OPENING_BONUS = -0.05;
/** Total Parry kill mechanic: late vs early decisiveness. */
export const TP_KILL_LATE_DEC = 1;
export const TP_KILL_EARLY_DEC = -1;
/** Total Parry kill mechanic: kill-window HP multiplier. */
export const TP_KILL_WINDOW_HP_MULT = 0.35;

// ─── Anti-synergy ───────────────────────────────────────────────────────────
/** Total Parry anti-synergy: the shell can't carry offense — slash worse than lunge/bash. */
export const TP_ANTISYNERGY_SLASH_MULT = 0.5;
export const TP_ANTISYNERGY_OFF_MULT = 0.4;
