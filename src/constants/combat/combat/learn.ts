/**
 * Per-fight skill learning constants — the Arena-93 "skills learned per
 * fight" doctrine scaled to this engine's 1–20 skill ladder.
 *
 * Canon (Pagan, Noblish Island): a warrior learns 0–6 skills per bout, drawn
 * from a pool weighted by their own style's priorities plus the opponent's.
 * Wit is the gate — bright warriors learn more per fight. Here each bout
 * rolls LEARN_ATTEMPTS Bernoulli trials at WT × LEARN_WT_FACTOR, so expected
 * learns/fight ≈ WT×0.04×6 → WT5≈1.2, WT10≈2.4, WT15≈3.6, WT21≈5.0
 * (generous canon flavor; the Consortium pegs ~1.75 at WT15 — we run hotter
 * because learns are the headline mechanic of this port).
 */

/** Learn attempts rolled per fighter per bout. */
export const LEARN_ATTEMPTS = 6;

/** Per-attempt success factor multiplied by the learner's WT. */
export const LEARN_WT_FACTOR = 0.04;

/** Extra pool weight on the warrior's hidden favorite learn (canon: the
 *  aptitude makes that skill far likelier to stick). */
export const LEARN_FAVORITE_WEIGHT = 6;

/** Max learns accumulated in a single skill — the arena stops teaching what
 *  is already mastered. Rose of Shanon canon: "about 20 skills in each
 *  area before learning stops" — the compressed 6-ladder was a V24
 *  deferred compromise, widened to the canon literal here. */
export const LEARN_PER_SKILL_CAP = 20;

/** Max total learns across a career — keeps veterans bounded. Canon bounds
 *  per-area learning, not careers: 6 areas × 20 lets a lifetime learner
 *  max every skill track. */
export const LEARN_CAREER_CAP = 120;

/** Deduction threshold: the learn ledger must show at least this many learns
 *  in a skill before it reads as the suspected favorite learn (Pagan's
 *  charting method for the third affinity). */
export const LEARN_SUSPECT_MIN = 3;

/** Canon skill display names — transcripts, newsletters, dossier copy. */
export const LEARN_SKILL_NAMES: Record<string, string> = {
  ATT: 'Attack',
  PAR: 'Parry',
  DEF: 'Defense',
  INI: 'Initiative',
  RIP: 'Riposte',
  DEC: 'Decisiveness',
};
