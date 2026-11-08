// ─── Lunging Attack (LU) — per-style balance knobs ──────────────────────────
/** Damage per momentum point for Lunging Attack's first-strike pressure. Balance knob. */
export const LU_MOMENTUM_DMG_COEFF = 0.5;

// ─── Passive ────────────────────────────────────────────────────────────────
/** Lunging Attack passive: attack drag after the opener fades — late phase vs mid. */
export const LU_PASSIVE_LATE_ATT = -2;
export const LU_PASSIVE_MID_ATT = -1;

// ─── Kill mechanic ──────────────────────────────────────────────────────────
/** Lunging Attack kill mechanic: opening-phase kill bonus and decise edge. */
export const LU_KILL_OPENING_BONUS = 0.08;
export const LU_KILL_OPENING_DEC = 2;
/** Lunging Attack kill mechanic: kill-window HP multiplier. */
export const LU_KILL_WINDOW_HP_MULT = 0.45;

// ─── Anti-synergy ───────────────────────────────────────────────────────────
/** Lunging Attack anti-synergy: overextended frame — weak bash and parry. */
export const LU_ANTISYNERGY_BASH_MULT = 0.5;
export const LU_ANTISYNERGY_PARRY_MULT = 0.6;

// ─── Tempo ──────────────────────────────────────────────────────────────────
/** Lunging Attack tempo: phase bonuses — spikes the opener, fades late. */
export const LU_TEMPO_OPENING = 1;
export const LU_TEMPO_MID = 0;
export const LU_TEMPO_LATE = -1;
/** Lunging Attack endurance burn rate (1.0 = baseline). */
export const LU_ENDURANCE_MULT = 1.05;
