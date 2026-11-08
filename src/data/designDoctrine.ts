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
  /** Slasher deftness below which the negative-parry note fires. */
  SL_DF_PARRY_INFO: 15,
  /** Slasher will below which the endurance-engine note fires. */
  SL_WL_INFO: 15,
  /** Slasher size above which the big-slasher longevity note fires. */
  SL_SZ_INFO: 11,
  /** Slasher speed above which the wasted-points note fires. */
  SL_SP_INFO: 11,
  /**
   * Piker wit below which the keystone note fires — Assur's tournament
   * pikers ran 17-21 on the 84-pt budget; even his scum piker ran ~11.
   */
  PS_WT_NOTE: 15,
  /** Striker stat minimums from Assur's guide: ST 9 / WT 11 / WL 9 / DF 11. */
  ST_MIN_ST: 9,
  ST_MIN_WT: 11,
  ST_MIN_WL: 9,
  ST_MIN_DF: 11,
  /** Sir Boyd's damage bar — ST+SZ under this and the striker hits softly. */
  ST_BOYD_DAMAGE_SUM: 21,
  /** Talon's Primal frame: WT/DF/WL bars for a Primus-quality striker. */
  ST_PRIMAL_WT: 17,
  ST_PRIMAL_DF: 15,
  ST_PRIMAL_WL: 13,
  /**
   * Parry-lunger constitution at/below which the glass-jaw note fires —
   * the armor-piercer's own graduate "clings to life by luck".
   */
  PL_CN_INFO: 6,
  /**
   * Parry-lunger speed at/above which the wasted-speed note fires —
   * canon: a PL is "not a lunger mimic"; the points belong on WT/WL/DF.
   */
  PL_SP_INFO: 10,
  /** Parry-lunger deftness below which the epee note fires — DF 15 unlocks it. */
  PL_DF_INFO: 15,
  /** Attack-god chassis praise bars: the armor-piercer spread is WT/DF-led. */
  PL_WT_GOOD: 17,
  PL_DF_GOOD: 15,
  /**
   * Piker spread (max − min attribute) at/below which the "average numbers"
   * warning fires — canon: never make average numbers into the worst style.
   */
  PS_FLAT_SPREAD: 7,
  /**
   * Wall of Steel — the Arena 93 wall corpus (Eli's Parry-Slash take, Assur's
   * Bash Bros, Dante Killatroll's Nerdy Style, She-Puppy's Berserker, and
   * Wasted Wastes). "Wastes need Will": the style burns endurance like a
   * lunger, so 15 is the consensus floor and 17/21 the aim; Dante allows 11
   * only for builds never meant for ADM.
   */
  WS_WL_WARN: 15,
  WS_WL_FLOOR: 11,
  /**
   * Scimitar strength floor — Dante: "you need to at least be able to use
   * the Scimitar" (ST 9); 11 opens the Broadsword/Quarterstaff, 13 the
   * Great Axe.
   */
  WS_ST_MIN: 9,
  WS_ST_GOOD: 11,
  /** Wit below which learning "slows to a crawl" (Eli; Dante wants 15/17/21). */
  WS_WT_INFO: 15,
  /** Deftness floor — weapon requirements plus the coordination column. */
  WS_DF_MIN: 11,
  /** Speed above which the "speed is a luxury" note fires — Assur adds 0; Eli runs a 3. */
  WS_SP_INFO: 10,
  /**
   * Size band — above 14 buys negative DEF/PAR skill points and endurance
   * cost (Dante caps 14; She-Puppy warns 15+); below 7 the wee wall hits
   * soft and can't take damage (She-Puppy's floor; Eli allows 5).
   */
  WS_SZ_HI: 14,
  WS_SZ_LO: 7,
  /** Eli's coordination floor — "at the very least" SP+DF 18 (21 = Normal). */
  WS_COORD_MIN: 18,
  /** Dante's endurance/carry bar — get ST+CN to at least 21. */
  WS_STCN_GOOD: 21,
  /**
   * Lunger constitution floor — Snorri: "try not to go any lower than 9";
   * the usual never-spend-con advice doesn't hold on a style that takes
   * hits. Only Boar's defensive variant forgives less.
   */
  LU_CN_SOFT_FLOOR: 9,
  /**
   * Lunger damage caution — Snorri: hard to roll a good damage rating under
   * size 12 without strength 13 (13 also unlocks the long spear).
   */
  LU_DAMAGE_SZ: 12,
  LU_DAMAGE_ST: 13,
  /**
   * Lunger spread (max − min attribute) at/below which the even-spread
   * praise fires — Snorri's core doctrine: a fairly even spread works
   * well; his own builds scale to ≤5 on the 70-pt budget.
   */
  LU_EVEN_SPREAD: 5,
  /**
   * Wit at/above which the diminishing-returns note fires — Snorri got
   * good bases at 12 and saw no gain past 17 on a lunger.
   */
  LU_WT_CEIL: 17,
  /** Wit at/above which the fast-learner note fires. */
  FAST_LEARNER_WT: 17,
} as const;

/**
 * Canonical per-style minimum-stat floors — Arena 93 design articles
 * ("minimum recommended attributes" tables + Drake's DA rejection rule).
 * A recruit below a style's floor is a DOA build: the Arena-93 managers
 * would send it to the Dark Arena rather than waste a roster slot.
 *
 * Filled in Phase 2 of MEGAPLAN V23 — the placeholder row exists so spec
 * imports compile while the table is authored.
 */
export const STYLE_DESIGN_MINIMUMS: Partial<
  Record<FightingStyle, Partial<Record<keyof Attributes, number>>>
> = {
  // Sources: Assur's striker guide (ST row pinned to canon 9/11/9/11);
  // other rows derive each style's article minimums onto the 70-pt budget —
  // a recruit below its floor is the article's "send it to the DA" build.
  [FightingStyle.AimedBlow]: { WT: 15, WL: 11, DF: 15 },
  [FightingStyle.BashingAttack]: { ST: 11, WT: 11, WL: 11, DF: 9 },
  [FightingStyle.LungingAttack]: { ST: 9, CN: 9, WT: 12, WL: 12, DF: 11 },
  [FightingStyle.ParryLunge]: { ST: 9, WT: 11, WL: 11, DF: 11 },
  [FightingStyle.ParryStrike]: { WT: 11, WL: 11, DF: 9 },
  [FightingStyle.ParryRiposte]: { WT: 11, WL: 11, DF: 11 },
  [FightingStyle.SlashingAttack]: { ST: 9, WT: 11, WL: 13, DF: 11 },
  [FightingStyle.StrikingAttack]: { ST: 9, WT: 11, WL: 9, DF: 11 },
  [FightingStyle.TotalParry]: { WT: 11, WL: 15 },
  [FightingStyle.WallOfSteel]: { WT: 11, WL: 13, DF: 11 },
};

/**
 * Drake's Dark-Arena rejection rule: a build with WL < 7 or ST < 7 is not
 * worth fielding on Noblish Island regardless of style.
 */
export const DA_WL_FLOOR = 7;
export const DA_ST_FLOOR = 7;

/**
 * V24 canon (Consortium Q&A): low-burn builds (very low SP — a warrior who
 * can't sustain an activity burn) belong on the patient/defensive styles
 * that tolerate the slow pace: PR, PS, AB, TP, ST.
 */
export const LOW_BURN_STYLES: FightingStyle[] = [
  FightingStyle.ParryRiposte,
  FightingStyle.ParryStrike,
  FightingStyle.AimedBlow,
  FightingStyle.TotalParry,
  FightingStyle.StrikingAttack,
];

/**
 * Speed ceiling that marks a "low-burn" build (Consortium): a SP this low
 * can't sustain an offensive activity burn — the fighter must win on
 * patience, parry, or aimed precision instead.
 */
export const LOW_BURN_SP_MAX = 5;
