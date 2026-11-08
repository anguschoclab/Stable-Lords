// ─── Parry-Lunge (PL) — per-style balance knobs ─────────────────────────────
/** Parry-Lunge momentum-riposte damage coefficient (damage = momentum × this). Balance knob. */
export const PL_MOMENTUM_RIPOSTE_DMG_COEFF = 0.5;

// ─── Passive ────────────────────────────────────────────────────────────────
/** Parry-Lunge passive: counter-ready ATT vs base ATT, and the counter INI bonus. */
export const PL_PASSIVE_COUNTER_ATT = 2;
export const PL_PASSIVE_ATT = 1;
export const PL_PASSIVE_COUNTER_INI = 2;
/** Parry-Lunge passive: flat parry bonus (mastery adds on top). */
export const PL_PASSIVE_PAR = 2;

// ─── Kill mechanic ──────────────────────────────────────────────────────────
/** Parry-Lunge kill mechanic: kill-window HP multiplier. */
export const PL_KILL_WINDOW_HP_MULT = 0.45;

// ─── Tempo ──────────────────────────────────────────────────────────────────
/** Parry-Lunge tempo: phase bonuses — peaks mid-fight once counters line up. */
export const PL_TEMPO_OPENING = 0;
export const PL_TEMPO_MID = 2;
export const PL_TEMPO_LATE = 0;
/** Parry-Lunge endurance burn rate (1.0 = baseline). */
export const PL_ENDURANCE_MULT = 0.99;
