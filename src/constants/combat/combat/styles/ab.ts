// ─── Aimed Blow (AB) — per-style balance knobs ───────────────────────────────
/** Aimed Blow armor bypass: max fraction of armor mitigation ignored. Balance knob. */
export const AB_ARMOR_BYPASS_MAX = 0.4;
/** Aimed Blow armor bypass: DF divisor (bypass = min(AB_ARMOR_BYPASS_MAX, DF / this)). */
export const AB_ARMOR_BYPASS_DF_DIVISOR = 50;

/** Aimed Blow shell-gap payoff: max ATT bonus when the defender's shell out-classes AB's craft. Balance knob. */
export const AB_SHELL_GAP_ATT_MAX = 2;
/** Aimed Blow shell-gap payoff: DF divisor (bonus = min(MAX, ceil((def.PAR - att.ATT) * DF / this))). */
export const AB_SHELL_GAP_DF_DIVISOR = 12;

// ─── Passive ────────────────────────────────────────────────────────────────
/** Aimed Blow passive: ATT bonus — called-shot targeted vs untargeted. Balance knob. */
export const AB_PASSIVE_ATT_TARGETED = 4;
export const AB_PASSIVE_ATT_UNTARGETED = 3;
/** Aimed Blow passive: flat parry bonus. */
export const AB_PASSIVE_PAR = 2;
/** Aimed Blow passive: crit chance — targeted vs untargeted. Balance knob. */
export const AB_PASSIVE_CRIT_TARGETED = 0.12;
export const AB_PASSIVE_CRIT_UNTARGETED = 0.06;
/** Aimed Blow passive: extra crit once the exchange count passes the late gate (targeted only). */
export const AB_PASSIVE_CRIT_LATE_ADD = 0.05;
export const AB_PASSIVE_CRIT_LATE_EXCHANGE = 8;
/** Aimed Blow passive narrative: fires for targeted plans past this exchange. */
export const AB_PASSIVE_NARRATIVE_EXCHANGE = 5;

// ─── Kill mechanic ──────────────────────────────────────────────────────────
/** Aimed Blow kill mechanic: kill bonus on a head hit / any targeted location. Balance knob. */
export const AB_KILL_HEAD_BONUS = 0.15;
export const AB_KILL_TARGETED_BONUS = 0.05;
/** Aimed Blow kill mechanic: decisiveness bonus while aimed. */
export const AB_KILL_TARGETED_DEC = 3;
/** Aimed Blow kill mechanic: kill-window HP multiplier. Balance knob. */
export const AB_KILL_WINDOW_HP_MULT = 0.8;

// ─── Tempo ──────────────────────────────────────────────────────────────────
/** Aimed Blow tempo: phase bonuses — the style is a late-fight closer. */
export const AB_TEMPO_OPENING = 0;
export const AB_TEMPO_MID = 0;
export const AB_TEMPO_LATE = 1;
/** Aimed Blow endurance burn rate (1.0 = baseline). */
export const AB_ENDURANCE_MULT = 0.95;
