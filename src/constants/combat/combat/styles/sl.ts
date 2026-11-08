// ─── Slashing Attack (SL) — per-style balance knobs ─────────────────────────
/** Slashing Attack flurry: bleed stacks applied per landed SL hit. Balance knob. */
export const SL_BLEED_STACKS_PER_HIT = 2;
/** Maximum bleed stacks a fighter can carry. */
export const SL_BLEED_CAP = 5;
/** Damage per bleed stack per exchange tick. */
export const SL_BLEED_TICK_DMG = 1;
/** Bleed stacks shed per exchange (natural clotting). */
export const SL_BLEED_DECAY = 1;

// ─── Passive ────────────────────────────────────────────────────────────────
/** Slashing Attack passive: flurry damage bonus and the hits threshold. */
export const SL_PASSIVE_FLURRY_DMG = 1;
export const SL_PASSIVE_FLURRY_HITS = 4;
/** Slashing Attack passive: flat parry bonus, and ATT outside the late phase. */
export const SL_PASSIVE_PAR = 1;
export const SL_PASSIVE_ATT = 1;

// ─── Kill mechanic ──────────────────────────────────────────────────────────
/** Slashing Attack kill mechanic: flurry kill bonus at the hits threshold. */
export const SL_KILL_FLURRY_BONUS = 0.06;
/** Slashing Attack kill mechanic: hits that extend the window, and the HP multipliers. */
export const SL_KILL_EXTENDED_HITS = 5;
export const SL_KILL_WINDOW_HP_MULT_EXTENDED = 0.5;
export const SL_KILL_WINDOW_HP_MULT = 0.4;

// ─── Anti-synergy ───────────────────────────────────────────────────────────
/** Slashing Attack anti-synergy: edge over mass — weak bash and parry. */
export const SL_ANTISYNERGY_BASH_MULT = 0.5;
export const SL_ANTISYNERGY_PARRY_MULT = 0.6;

// ─── Tempo ──────────────────────────────────────────────────────────────────
/** Slashing Attack tempo: phase bonuses — front-loaded flurry style. */
export const SL_TEMPO_OPENING = 1;
export const SL_TEMPO_MID = 0;
export const SL_TEMPO_LATE = 0;
/** Canon burn: slashers "burn endurance very quickly" — the fastest burner. */
export const SL_ENDURANCE_MULT = 1.05;
