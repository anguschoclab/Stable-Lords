/**
 * Stable Lords — Winning Warrior Archetypes
 *
 * Assur's Arena-93 doctrine: the three basic ways to win — offensives,
 * defensives, and hybrids — and the five canonical archetype guides
 * (pure offensive, pure defensive, tank hybrid, low-will tank hybrid,
 * high-skill hybrid, riposting hybrid). Orthogonal to `StyleFamily`
 * (which describes how a style fights); this taxonomy describes how a
 * *build* wins.
 *
 * NOTE: `WinningArchetype` is deliberately distinct from
 * `engine/factories/statGeneration.ts`'s `Archetype` ('brutal'|'agile'|
 * 'cunning'|'tank'), which is a name/trait flavor axis.
 *
 * Sources: Duel2 Arena 93 — Assur's "Winning Warrior Types", "Guide to
 * Pure Offensives", "Guide to Pure Defensives", "Guide to Tank Hybrids"
 * (+ addendum), "Guide to High Skill Hybrids", "Guide to Riposting
 * Hybrids", and "What the Style?".
 */

import { FightingStyle, type Attributes } from '@/types/shared.types';

/** Assur's six canonical winning archetypes. */
export type WinningArchetype =
  | 'pureOffensive'
  | 'pureDefensive'
  | 'tankHybrid'
  | 'lowWillTankHybrid'
  | 'highSkillHybrid'
  | 'ripostingHybrid';

/** The article's three families every archetype hangs off. */
export type WinningFamily = 'offensive' | 'defensive' | 'hybrid';

/** Numeric design bars (70-pt budget) that score a build's archetype fit. */
export interface ArchetypeDesignBars {
  /** Minimum strength the guide expects. */
  stMin?: number;
  /** Minimum constitution. */
  cnMin?: number;
  /** Size ceiling — hybrids stay small; defensives prefer it. */
  szMax?: number;
  /** Minimum wit. */
  wtMin?: number;
  /** Minimum will. */
  wlMin?: number;
  /** Will ceiling — the low-will tank is defined by WL at or under this. */
  wlMax?: number;
  /** Speed guidance — hybrid/defensive doctrine keeps it low. */
  spMax?: number;
  /** Minimum deftness. */
  dfMin?: number;
  /** Advisory minimum raw riposte base (SP+DF) — the low-will-tank rule:
   *  without will-driven skills the frame needs the physical riposte. */
  minRipBase?: number;
}

/** Plan guidance the guide gives for this archetype. */
export interface ArchetypeStrategy {
  /** Canon offensive-effort band, e.g. [5,10] for tanks. */
  oeBand: [number, number];
  /** Canon activity-level band. */
  alBand: [number, number];
  /** Tactic advice adapted from the newsletter. */
  tacticNotes: string;
}

/** Per-archetype doctrine entry — the codex/review source of truth. */
export interface ArchetypeGuide {
  /** Display label, e.g. "Tank Hybrid". */
  label: string;
  /** Winning family the archetype belongs to. */
  family: WinningFamily;
  /** Manager commentary adapted from the newsletter. */
  doctrine: string;
  /** Stats the guide says to prioritize. */
  keyStats: (keyof Attributes)[];
  /** Numeric bars used for fit scoring and review notes. */
  designBars: ArchetypeDesignBars;
  /** Styles the guide recommends for the archetype. */
  recommendedStyles: FightingStyle[];
  /** Styles the guide warns about (not forbidden — notes only). */
  cautionStyles: FightingStyle[];
  /** Recommended weapon ids — resolved against equipment items. */
  weapons: string[];
  /** Armor guidance (ids + notes); respects per-style restrictedStyles. */
  armor: { ids: string[]; notes: string };
  /** Plan guidance. */
  strategy: ArchetypeStrategy;
  /** Canon caveats and worked-example commentary. */
  notes: string;
}

/**
 * Named design bars shared across review notes and AI doctrine — Assur's
 * hard numbers, all sourced to the Arena-93 articles.
 */
export const ARCHETYPE_DESIGN_BARS = {
  /** "Wit is the bare minimum at 11" — pure offensive doctrine. */
  OFFENSIVE_WT_MIN: 11,
  /** Surgeon AB viability floor — below this ST the chassis can't damage. */
  AB_ST_VIABILITY: 7,
  /** SP 10-12 is the riposting dead band — too slow to fake, not fast
   *  enough to bank on. */
  RIPOSTE_SP_DEAD_BAND: [10, 12] as const,
  /** SZ above this on a hybrid fit draws the big-hybrid note. */
  BIG_HYBRID_SZ: 13,
  /** Tank frame bars — the guide's "high strength / high hit points" rule. */
  TANK_ST_MIN: 15,
  TANK_CN_MIN: 13,
  /** "Tanks generally run high offensive effort — 5 minimum." */
  TANK_OE_FLOOR: 5,
  /** The addendum's dividing line: WL at or under this makes it a low-will tank. */
  LOW_WILL_WL_MAX: 10,
  /** Raw riposte base (SP+DF) a low-will tank wants — replaces will-driven skills. */
  MIN_RIP_BASE: 18,
} as const;

export const WINNING_ARCHETYPES: Record<WinningArchetype, ArchetypeGuide> = {
  pureOffensive: {
    label: 'Pure Offensive',
    family: 'offensive',
    doctrine:
      'Win by attacking — the offensive kills, maims, or wears the opponent ' +
      'down before minute three. Strength, wit, and deftness carry the build; ' +
      'constitution and armor are deliberately thin because the fight should ' +
      'be over before they matter.',
    keyStats: ['ST', 'WT', 'DF'],
    designBars: { stMin: 11, wtMin: 11, dfMin: 11 },
    recommendedStyles: [
      FightingStyle.LungingAttack,
      FightingStyle.StrikingAttack,
      FightingStyle.BashingAttack,
      FightingStyle.SlashingAttack,
      FightingStyle.AimedBlow,
    ],
    cautionStyles: [FightingStyle.WallOfSteel],
    weapons: ['maul', 'broadsword', 'battle_axe', 'war_flail', 'greatsword'],
    armor: {
      ids: ['leather', 'padded', 'none_armor'],
      notes:
        'Light or nothing — the build concedes mitigation for tempo. Leather ' +
        'at most; padded or bare when the frame is fast.',
    },
    strategy: {
      oeBand: [7, 10],
      alBand: [7, 10],
      tacticNotes:
        'Match the style — Bash for bashers, Lunge for lungers, Slash for ' +
        'slashers, Decise for strikers. KD high; the offensive sells out early.',
    },
    notes:
      'Wit 11 is the bare minimum — below it the build cannot learn its way ' +
      'out of a bad matchup. Wit 15+ is where the great ones start.',
  },
  pureDefensive: {
    label: 'Pure Defensive',
    family: 'defensive',
    doctrine:
      'Win by refusing to lose — iron hit points and plate let the opponent ' +
      'exhaust themselves, then the defensive finishes or survives to the ' +
      'judge. Constitution and will are the whole build.',
    keyStats: ['CN', 'WL', 'ST'],
    designBars: { cnMin: 13, wlMin: 15, szMax: 12, spMax: 8 },
    recommendedStyles: [
      FightingStyle.TotalParry,
      FightingStyle.ParryStrike,
      FightingStyle.ParryRiposte,
    ],
    cautionStyles: [FightingStyle.WallOfSteel],
    weapons: ['quarterstaff', 'short_spear', 'scimitar'],
    armor: {
      ids: ['plate_armor', 'plate_mail', 'chain_mail'],
      notes:
        'APA/F is the norm — the heaviest protection the frame can carry. ' +
        'Recommended styles are all plate-legal.',
    },
    strategy: {
      oeBand: [1, 5],
      alBand: [1, 5],
      tacticNotes:
        'Parry or nothing — Responsiveness where suited. KD stays low; a ' +
        'defensive who swings wildly is a bad tank.',
    },
    notes:
      'The scum profile: will does the endurance work, constitution does the ' +
      'hit-point work, and armor does the rest. Patience wins.',
  },
  tankHybrid: {
    label: 'Tank Hybrid',
    family: 'hybrid',
    doctrine:
      'The tank wins by hitting like an offensive while being built like a ' +
      'defensive — heavy armor, real hit points, enough physical prowess to ' +
      'punish. Strength and constitution are the frame; will is the usual ' +
      'flex point.',
    keyStats: ['ST', 'CN', 'WL'],
    designBars: { stMin: 15, cnMin: 13, szMax: 12, wlMin: 7, spMax: 10 },
    recommendedStyles: [
      FightingStyle.WallOfSteel,
      FightingStyle.BashingAttack,
      FightingStyle.TotalParry,
    ],
    cautionStyles: [
      FightingStyle.LungingAttack,
      FightingStyle.StrikingAttack,
      FightingStyle.SlashingAttack,
    ],
    weapons: ['maul', 'battle_axe', 'broadsword', 'long_spear'],
    armor: {
      ids: ['plate_armor', 'plate_mail', 'chain_mail'],
      notes:
        'APA/F is the norm — the heaviest legal plate. Lungers, strikers, and ' +
        'slashers cannot wear it, which is part of why the guide warns ' +
        'against tanking on those styles.',
    },
    strategy: {
      oeBand: [5, 10],
      alBand: [1, 5],
      tacticNotes:
        'Offensive effort stays high — 5 is the floor, 7-8 typical. Activity ' +
        'is the savings; the tank wins exchanges, not footraces.',
    },
    notes:
      'Low speed and low deftness are the classic tells — the physicals do ' +
      'the work. High will makes the sturdier version; see the addendum ' +
      'archetype for the WL≤10 line.',
  },
  lowWillTankHybrid: {
    label: 'Low-Will Tank',
    family: 'hybrid',
    doctrine:
      'The addendum tank: will spent elsewhere buys a faster, harder frame, ' +
      'but the build must replace will-driven skills with raw physical ' +
      'riposte — SP+DF carries what WL would have.',
    keyStats: ['ST', 'CN', 'SP', 'DF'],
    designBars: {
      stMin: 15,
      cnMin: 13,
      szMax: 12,
      wlMax: 10,
      minRipBase: 18,
    },
    recommendedStyles: [FightingStyle.WallOfSteel, FightingStyle.BashingAttack],
    cautionStyles: [FightingStyle.LungingAttack, FightingStyle.StrikingAttack],
    weapons: ['broadsword', 'battle_axe', 'scimitar'],
    armor: {
      ids: ['plate_armor', 'plate_mail', 'chain_mail'],
      notes: 'Same APA/F doctrine as the high-will tank — plate is the point.',
    },
    strategy: {
      oeBand: [5, 10],
      alBand: [1, 5],
      tacticNotes:
        'Same tank tempo — OE 5+, AL conservative. Riposte is already in the ' +
        'physicals; the tactic slot stays optional.',
    },
    notes:
      'The worked line: 21-15-6-11-7-13-11 runs as a wall-of-steel flagship. ' +
      'Without the SP+DF base, a low-will tank is just a slow defensive.',
  },
  highSkillHybrid: {
    label: 'High-Skill Hybrid',
    family: 'hybrid',
    doctrine:
      'The skills build — wit and deftness buy attack, defense, and riposte ' +
      'skills that let a lighter frame play both sides of the exchange. The ' +
      'hybrid wins by out-fighting, not out-lasting.',
    keyStats: ['WT', 'DF', 'WL'],
    designBars: { wtMin: 13, dfMin: 11, szMax: 12, spMax: 12 },
    recommendedStyles: [
      FightingStyle.LungingAttack,
      FightingStyle.WallOfSteel,
      FightingStyle.ParryLunge,
      FightingStyle.ParryRiposte,
      FightingStyle.ParryStrike,
    ],
    cautionStyles: [
      FightingStyle.StrikingAttack,
      FightingStyle.SlashingAttack,
      FightingStyle.BashingAttack,
    ],
    weapons: ['scimitar', 'longsword', 'war_flail', 'short_spear'],
    armor: {
      ids: ['scale_mail', 'studded_leather', 'leather'],
      notes:
        'Moderate armor — enough to survive a mistake, light enough that the ' +
        'skills do the real work. NEVER over-encumbered.',
    },
    strategy: {
      oeBand: [4, 8],
      alBand: [4, 8],
      tacticNotes:
        'Balanced tempo with matchup swings — run hot into defensives, ' +
        'cool into offensives. Skills, not stats, carry the plan.',
    },
    notes:
      'Wit is the engine — 13+ to learn, 15+ to dominate. The archetype is ' +
      'the usual home of the small, quick, clever build.',
  },
  ripostingHybrid: {
    label: 'Riposting Hybrid',
    family: 'hybrid',
    doctrine:
      'The riposte build turns defense into offense — parry the blow, answer ' +
      'with the counter. Deftness and speed set the riposte base; wit keeps ' +
      'the skills growing.',
    keyStats: ['DF', 'SP', 'WT'],
    designBars: { dfMin: 13, wtMin: 11, szMax: 12, minRipBase: 18 },
    recommendedStyles: [
      FightingStyle.ParryRiposte,
      FightingStyle.ParryStrike,
      FightingStyle.ParryLunge,
      FightingStyle.WallOfSteel,
    ],
    cautionStyles: [FightingStyle.AimedBlow, FightingStyle.LungingAttack],
    weapons: ['scimitar', 'longsword', 'quarterstaff'],
    armor: {
      ids: ['chain_mail', 'scale_mail', 'leather'],
      notes:
        'Moderate protection — the riposting hybrid lives on its counters ' +
        'more than its plate. Encumbrance eats the endurance the archetype ' +
        'needs.',
    },
    strategy: {
      oeBand: [3, 7],
      alBand: [3, 7],
      tacticNotes:
        'Riposte tactic where suited — it is easy to fake on the right ' +
        'styles. OE mid: enough to threaten, low enough to keep answering.',
    },
    notes:
      'Speed 10-12 is the dead band — slow ripostes never land, and the ' +
      'build gave up the speed it needed to matter.',
  },
};

/**
 * Style → winning-archetype fit. Orthogonal to StyleFamily: a style's
 * family says how it fights; this says which winning builds it can
 * express. Multi-fit styles are the flexible chassis — the lunger's
 * four-way fit is why Assur calls it the ultimate hybrid style.
 */
export const STYLE_ARCHETYPE_FIT: Record<FightingStyle, WinningArchetype[]> = {
  [FightingStyle.LungingAttack]: [
    'pureOffensive',
    'tankHybrid',
    'highSkillHybrid',
    'ripostingHybrid',
  ],
  [FightingStyle.AimedBlow]: [
    'pureOffensive',
    'highSkillHybrid',
    'ripostingHybrid',
  ],
  [FightingStyle.BashingAttack]: [
    'pureOffensive',
    'tankHybrid',
    'lowWillTankHybrid',
  ],
  [FightingStyle.SlashingAttack]: ['pureOffensive', 'highSkillHybrid'],
  [FightingStyle.StrikingAttack]: ['pureOffensive', 'highSkillHybrid'],
  [FightingStyle.ParryLunge]: [
    'ripostingHybrid',
    'highSkillHybrid',
    'tankHybrid',
  ],
  [FightingStyle.ParryRiposte]: [
    'ripostingHybrid',
    'highSkillHybrid',
    'pureDefensive',
  ],
  [FightingStyle.ParryStrike]: [
    'pureDefensive',
    'ripostingHybrid',
    'highSkillHybrid',
  ],
  [FightingStyle.WallOfSteel]: [
    'tankHybrid',
    'lowWillTankHybrid',
    'ripostingHybrid',
    'pureDefensive',
  ],
  [FightingStyle.TotalParry]: [
    'pureDefensive',
    'tankHybrid',
    'ripostingHybrid',
  ],
};

/** A scored archetype-fit result. */
export interface ArchetypeFit {
  archetype: WinningArchetype;
  /** 0-100 fit score — the build's proximity to the guide's bars. */
  score: number;
}

/** How much a single bar is satisfied: 1 when met, partial credit below. */
function barRatio(attrs: Attributes, bars: ArchetypeDesignBars): number {
  const ratios: number[] = [];
  const min = (v: number, floor: number) => Math.min(v / floor, 1);
  const max = (v: number, ceil: number) => Math.min(ceil / v, 1);
  if (bars.stMin !== undefined) ratios.push(min(attrs.ST, bars.stMin));
  if (bars.cnMin !== undefined) ratios.push(min(attrs.CN, bars.cnMin));
  if (bars.szMax !== undefined) ratios.push(max(attrs.SZ, bars.szMax));
  if (bars.wtMin !== undefined) ratios.push(min(attrs.WT, bars.wtMin));
  if (bars.wlMin !== undefined) ratios.push(min(attrs.WL, bars.wlMin));
  if (bars.wlMax !== undefined) ratios.push(max(attrs.WL, bars.wlMax));
  if (bars.spMax !== undefined) ratios.push(max(attrs.SP, bars.spMax));
  if (bars.dfMin !== undefined) ratios.push(min(attrs.DF, bars.dfMin));
  if (bars.minRipBase !== undefined)
    ratios.push(min(attrs.SP + attrs.DF, bars.minRipBase));
  return ratios.length === 0 ? 0 : ratios.reduce((a, b) => a + b, 0) / ratios.length;
}

/** Style-fit weight: recommended styles express the archetype fully. */
function styleFit(style: FightingStyle, guide: ArchetypeGuide): number {
  if (guide.recommendedStyles.includes(style)) return 1;
  if (guide.cautionStyles.includes(style)) return 0.6;
  return 0.3;
}

/**
 * Score a build's fit against each winning archetype — returns all six
 * fits ranked best-first. Pure and deterministic; consumed by Design
 * Review, Style Archives, and AI doctrine.
 */
export function classifyArchetype(
  attrs: Attributes,
  style: FightingStyle
): ArchetypeFit[] {
  const fits = (
    Object.entries(WINNING_ARCHETYPES) as [WinningArchetype, ArchetypeGuide][]
  ).map(([archetype, guide]) => ({
    archetype,
    score: Math.round(
      (0.7 * barRatio(attrs, guide.designBars) + 0.3 * styleFit(style, guide)) * 100
    ) / 1,
  }));
  return fits.sort((a, b) => b.score - a.score);
}
