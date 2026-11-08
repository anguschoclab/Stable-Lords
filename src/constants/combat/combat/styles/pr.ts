import type { CommitLevel } from '@/types/shared.types';

// ─── Parry-Riposte (PR) — per-style balance knobs ───────────────────────────
/** Parry-Riposte counter-on-parry: riposte-chance bonus after a successful parry. Balance knob. */
export const PR_COUNTER_ON_PARRY = 4;
/** Parry-Riposte punish-commitment: riposte damage bonus by the attacker's commitment level. */
export const PR_COMMIT_PUNISH: Record<CommitLevel, number> = {
  Cautious: 0,
  Standard: 1,
  Full: 2,
};
/** Parry-Riposte light chain: riposte damage per consecutive prior riposte, and its cap. */
export const PR_CHAIN_STEP = 0.5;
export const PR_CHAIN_CAP = 1.5;

/** Parry-Riposte low-KD shell: a defender at or below this kill desire passes
 *  up riposte opportunities — canon (Blackhawk, Arena 93): "more often than
 *  not made him pass up attack, via riposte, opportunities" at KD 2 vs KD 5. */
export const PR_LOW_KD_THRESHOLD = 3;
/** Skill-check penalty applied to a low-KD Parry-Riposte defender's riposte
 *  check (both whiff-riposte and post-parry riposte call sites). Balance knob. */
export const PR_LOW_KD_RIPOSTE_PENALTY = 2;

// ─── Passive ────────────────────────────────────────────────────────────────
/** Parry-Riposte passive: opening-phase ATT drag — the style gives up the first exchange. */
export const PR_PASSIVE_OPENING_ATT = -1;
/** Parry-Riposte passive: flat parry and base riposte bonuses. */
export const PR_PASSIVE_PAR = 4;
export const PR_PASSIVE_RIP = 2;
/** Parry-Riposte passive: extra riposte once prior ripostes reach the streak. */
export const PR_PASSIVE_RIP_STREAK_ADD = 1;
export const PR_PASSIVE_RIP_STREAK_COUNT = 2;
/** Parry-Riposte passive narrative: fires at this many ripostes. */
export const PR_PASSIVE_NARRATIVE_RIPOSTES = 3;

// ─── Kill mechanic ──────────────────────────────────────────────────────────
/** Parry-Riposte kill mechanic: modest kill bonus and decise edge. */
export const PR_KILL_BONUS = 0.03;
export const PR_KILL_DEC = 2;
/** Parry-Riposte kill mechanic: kill-window HP multiplier. */
export const PR_KILL_WINDOW_HP_MULT = 0.4;

// ─── Anti-synergy ───────────────────────────────────────────────────────────
/** Parry-Riposte anti-synergy: finesse frame — weak bash, dulled decise. */
export const PR_ANTISYNERGY_BASH_MULT = 0.5;
export const PR_ANTISYNERGY_DECISE_MULT = 0.7;
