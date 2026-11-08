// ─── Parry-Strike (PS) — per-style balance knobs ────────────────────────────
/** Flat ATT bonus on a Parry-Strike fighter's next attack after a successful parry. Balance knob. */
export const PS_COUNTERSTRIKE_ATT = 2;

// ─── Passive ────────────────────────────────────────────────────────────────
/** Parry-Strike passive: flat parry, base ATT, and the counter-ready ATT add. */
export const PS_PASSIVE_PAR = 3;
export const PS_PASSIVE_ATT = 1;
export const PS_PASSIVE_COUNTER_ATT = 2;

// ─── Kill mechanic ──────────────────────────────────────────────────────────
/** Parry-Strike kill mechanic: kill-window HP multiplier. */
export const PS_KILL_WINDOW_HP_MULT = 0.45;

// ─── Anti-synergy ───────────────────────────────────────────────────────────
/** Parry-Strike anti-synergy: the style doesn't carry bashing weight. */
export const PS_ANTISYNERGY_BASH_MULT = 0.6;

// ─── Tempo ──────────────────────────────────────────────────────────────────
/** Parry-Strike tempo: flat across phases — the style is phase-neutral. */
export const PS_TEMPO_OPENING = 0;
export const PS_TEMPO_MID = 0;
export const PS_TEMPO_LATE = 0;
/** Parry-Strike endurance burn rate (1.0 = baseline). */
export const PS_ENDURANCE_MULT = 0.93;
