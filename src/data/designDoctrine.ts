/**
 * Stable Lords — Warrior Design Doctrine
 *
 * Design heuristics ported from the Arena 93 newsletters — the five design
 * axes managers weigh when building a warrior: fighting style, longevity,
 * weapon suitability, physical capabilities, and trainability. Feeds the
 * Warrior Builder's Design Review panel, the Style Archives family labels,
 * and the Help codex.
 *
 * Source: Duel2 Arena 93 — "How to Build a Better Warrior (version Y2K)",
 * Neon Necromancer.
 */

import { FightingStyle, type Attributes } from '@/types/shared.types';

/**
 * The article's three style families: offensive (LU/SL/ST/AB/BA) trade
 * defense for attack, defensive (TP/PR/PS) trade attack for parry, and
 * mixed (WS/PL) use offense and defense with equal effectiveness.
 */
export type StyleFamily = 'offensive' | 'defensive' | 'mixed';

/** Style → family map, keyed by the enum so a new style fails typecheck. */
export const STYLE_FAMILY: Record<FightingStyle, StyleFamily> = {
  [FightingStyle.AimedBlow]: 'offensive',
  [FightingStyle.BashingAttack]: 'offensive',
  [FightingStyle.LungingAttack]: 'offensive',
  [FightingStyle.SlashingAttack]: 'offensive',
  [FightingStyle.StrikingAttack]: 'offensive',
  [FightingStyle.ParryRiposte]: 'defensive',
  [FightingStyle.ParryStrike]: 'defensive',
  [FightingStyle.TotalParry]: 'defensive',
  [FightingStyle.ParryLunge]: 'mixed',
  [FightingStyle.WallOfSteel]: 'mixed',
};

/**
 * Defines the shape of style family guide.
 */
export interface StyleFamilyGuide {
  /** Display label, e.g. "Offensive". */
  label: string;
  /** Attributes the article names as the family's key stats. */
  keyAttributes: (keyof Attributes)[];
  /** Manager commentary adapted from the newsletter. */
  doctrine: string;
}

/** Design doctrine per style family — the archives' source of truth. */
export const FAMILY_GUIDE: Record<StyleFamily, StyleFamilyGuide> = {
  offensive: {
    label: 'Offensive',
    keyAttributes: ['WL', 'ST'],
    doctrine:
      'Lots of attack ability and little defense (except lungers). Will drives endurance and attack skills; strength drives damage capability and attack skills. High wit and deftness are desirable — both give a lot of skills, particularly attack.',
  },
  defensive: {
    label: 'Defensive',
    keyAttributes: ['WL', 'CN'],
    doctrine:
      'Lots of defensive ability — particularly parry — but poor attack. Will covers damage-taking and parry skills; constitution covers damage-taking. Extra wit and deftness remain highly desirable for the extra skills.',
  },
  mixed: {
    label: 'Mixed',
    keyAttributes: ['WL'],
    doctrine:
      'Good attack and good defense — among the most formidable warriors in the game. Will is key, plus whatever reaches good skill cut-offs, because mixed styles use defensive and offensive skills with equal effectiveness.',
  },
};

/**
 * Tunable bars for the Design Review panel — advisory heuristics, not
 * combat balance constants.
 */
export const DESIGN_REVIEW_THRESHOLDS = {
  /** Will bar for a 'good' style-fit rating (will keys every family). */
  KEY_ATTR_GOOD: 14,
  /** Will bar for an 'ok' rating; also the secondary-attr bar for 'good'. */
  KEY_ATTR_OK: 11,
  /** Secondary-attr floor for an 'ok' rating. */
  KEY_ATTR_SECONDARY_OK: 7,
  /** HP at which damage-taking counts as 'good'. */
  HP_GOOD: 30,
  /**
   * Total trainable-stat deficit (ST/WT/DF) that puts a weapon 'in reach' —
   * the article's "couple stat trains".
   */
  WEAPON_DEFICIT_IN_REACH: 2,
  /** Aimed-blow deftness below this triggers the canon warning. */
  AB_DF_WARN: 15,
  /** Canon aimed-blow deftness aim: "never below 21" on the 84-pt budget. */
  AB_DF_CANON: 21,
  /** Total-parry wit at/above which the scum-spending note fires. */
  TP_SCUM_WT_INFO: 17,
  /** Wit at/above which the fast-learner note fires. */
  FAST_LEARNER_WT: 17,
} as const;
