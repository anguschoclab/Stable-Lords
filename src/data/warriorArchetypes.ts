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
 *
 * V25 Phase-1 scaffold — types + inert stubs so the spec batch compiles;
 * real doctrine lands in Phase 2.
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
  /** Speed guidance — hybrid/defensive doctrine keeps it low. */
  spMax?: number;
  /** Minimum deftness. */
  dfMin?: number;
  /** Advisory minimum raw riposte base (Assur's low-will-tank rule). */
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

/** V25 Phase-1 scaffold — doctrine fields land in Phase 2. */
export const WINNING_ARCHETYPES: Record<WinningArchetype, ArchetypeGuide> = {} as Record<
  WinningArchetype,
  ArchetypeGuide
>;

/** Style → archetype fit map, keyed by the enum. Lands in Phase 2. */
export const STYLE_ARCHETYPE_FIT: Record<FightingStyle, WinningArchetype[]> = {} as Record<
  FightingStyle,
  WinningArchetype[]
>;

/** Tunable bars for archetype-fit scoring — Phase 2. */
export const ARCHETYPE_DESIGN_BARS = {} as const;

/** A scored archetype-fit result. */
export interface ArchetypeFit {
  archetype: WinningArchetype;
  /** 0-100 fit score — the build's proximity to the guide's bars. */
  score: number;
}

/**
 * Score a build's fit against each winning archetype — returns the ranked
 * fits (best first). Pure; consumed by Design Review and AI doctrine.
 * V25 Phase-1 scaffold returns no fits.
 */
export function classifyArchetype(
  _attrs: Attributes,
  _style: FightingStyle
): ArchetypeFit[] {
  return [];
}
