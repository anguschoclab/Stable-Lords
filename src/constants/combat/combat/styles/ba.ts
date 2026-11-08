// ─── Bashing Attack (BA) — per-style balance knobs ──────────────────────────
/** Parry/dodge penalty added to a defender per landed Bashing Attack hit. Balance knob. */
export const BA_PARDEGRADE_PER_HIT = 0.5;
/** Maximum accumulated guard-break penalty a defender can suffer in one fight. */
export const BA_PARDEGRADE_CAP = 3;

// ─── Passive ────────────────────────────────────────────────────────────────
/** Bashing Attack passive: momentum damage — min(baseCap + mastery bonus, hits/div). */
export const BA_PASSIVE_MOMENTUM_DMG_CAP = 2;
export const BA_PASSIVE_MOMENTUM_DMG_DIV = 2;
/** Bashing Attack passive: ATT bonus once consecutive hits reach the streak. */
export const BA_PASSIVE_STREAK_ATT = 2;
export const BA_PASSIVE_STREAK_HITS = 4;
/** Bashing Attack passive: shell-crack bonuses vs Total Parry (damage, attack, narrative hits). */
export const BA_PASSIVE_VS_TP_DMG = 1;
export const BA_PASSIVE_VS_TP_ATT = 1;
export const BA_PASSIVE_VS_TP_NARRATIVE_HITS = 2;

// ─── Kill mechanic ──────────────────────────────────────────────────────────
/** Bashing Attack kill mechanic: momentum cap and per-momentum kill bonus. */
export const BA_KILL_MOMENTUM_CAP = 3;
export const BA_KILL_MOMENTUM_COEFF = 0.04;
/** Bashing Attack kill mechanic: hits that extend the window, and the HP multipliers. */
export const BA_KILL_EXTENDED_HITS = 3;
export const BA_KILL_WINDOW_HP_MULT_EXTENDED = 0.5;
export const BA_KILL_WINDOW_HP_MULT = 0.4;

// ─── Anti-synergy ───────────────────────────────────────────────────────────
/** Bashing Attack anti-synergy: heavy frame — weak lunge, dodge and riposte. */
export const BA_ANTISYNERGY_LUNGE_MULT = 0.7;
export const BA_ANTISYNERGY_DODGE_MULT = 0.7;
export const BA_ANTISYNERGY_RIPOSTE_MULT = 0.7;
