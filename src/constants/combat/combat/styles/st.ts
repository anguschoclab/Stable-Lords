// ─── Striking Attack (ST) — per-style balance knobs ─────────────────────────
/** Striking Attack front-load: damage multiplier at exchange 0, decaying to 1.0 over the window. */
export const ST_FRONTLOAD_START = 1.3;
export const ST_FRONTLOAD_WINDOW = 6;
/** Striking Attack crit specialist: added crit chance and added crit-damage multiplier. */
export const ST_CRIT_CHANCE_BONUS = 0.1;
export const ST_CRIT_DAMAGE_BONUS = 0.2;
/** Striking Attack execute: bonus damage when the target's HP ratio is below the threshold. */
export const ST_EXECUTE_HP_THRESHOLD = 0.3;
export const ST_EXECUTE_BONUS = 2;
/**
 * Striking Attack shell pressure — Arena-93 canon ("keep swinging": sustained
 * decisive pressure hammers a Parry shell down; the marathon is the strikers'
 * own anti-scum sheet). Flat attack-check edge when the defender's resolved
 * defensive tactic is Parry. Zero vs Dodge/none: there is no shell to crack,
 * so fragile non-parrying styles (AB) see no benefit.
 */
export const ST_PARRY_PIERCE = 3;

// ─── Passive ────────────────────────────────────────────────────────────────
/** Striking Attack passive: ATT and damage bonuses once blood is drawn, and the hits gate. */
export const ST_PASSIVE_ATT = 1;
export const ST_PASSIVE_DMG = 1;
export const ST_PASSIVE_HITS = 1;

// ─── Kill mechanic ──────────────────────────────────────────────────────────
/** Striking Attack kill mechanic: kill bonus and decise edge. */
export const ST_KILL_BONUS = 0.07;
export const ST_KILL_DEC = 2;
/** Striking Attack kill mechanic: hits that extend the window, and the HP multiplier. */
export const ST_KILL_EXTENDED_HITS = 2;
export const ST_KILL_WINDOW_HP_MULT = 0.4;

// ─── Anti-synergy ───────────────────────────────────────────────────────────
/** Striking Attack anti-synergy: pure offense — riposte sits poorly. */
export const ST_ANTISYNERGY_RIPOSTE_MULT = 0.6;
