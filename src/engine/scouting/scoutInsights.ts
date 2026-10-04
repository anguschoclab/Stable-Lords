/**
 * Scout Insight Token Creation — extracted from scouting.ts for SRP separation.
 * Creates InsightToken objects discovered during scouting at various quality levels.
 */
import type { InsightToken } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, type InsightId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

/** Scout quality level — controls how much information is revealed. */
export type ScoutQuality = 'Basic' | 'Detailed' | 'Expert';

/** Create the always-present Style insight token. */
export function createStyleInsight(
  warrior: Warrior,
  styleName: string,
  week: number,
  rng: IRNGService
): InsightToken {
  return {
    id: rng.uuid() as InsightId,
    type: 'Style',
    warriorId: warrior.id,
    warriorName: warrior.name,
    detail: `Identified as ${styleName}`,
    discoveredWeek: week,
  };
}

/** Create attribute insight tokens for Detailed/Expert scouting (0 for Basic). */
export function createAttributeInsights(
  warrior: Warrior,
  quality: ScoutQuality,
  week: number,
  rng: IRNGService
): InsightToken[] {
  if (quality !== 'Detailed' && quality !== 'Expert') return [];

  const attrsToReveal = [...ATTRIBUTE_KEYS]
    .sort(() => 0.5 - rng.next())
    .slice(0, quality === 'Expert' ? 4 : 2);

  return attrsToReveal.map((attr) => ({
    id: rng.uuid() as InsightId,
    type: 'Attribute',
    warriorId: warrior.id,
    warriorName: warrior.name,
    targetKey: attr,
    detail: `Discovered exact ${ATTRIBUTE_LABELS[attr] ?? attr}`,
    discoveredWeek: week,
  }));
}

/**
 *
 */
export interface CreateTacticInsightArgs {
  warrior: Warrior;
  quality: ScoutQuality;
  suspectedOE: string | undefined;
  suspectedAL: string | undefined;
  week: number;
  rng: IRNGService;
}

/** Create a tactic insight token for Expert scouting (null if not Expert or no plan). */
export function createTacticInsight(args: CreateTacticInsightArgs): InsightToken | null {
  const { warrior, quality, suspectedOE, suspectedAL, week } = args;
  const { rng } = args;
  if (quality !== 'Expert' || !warrior.plan) return null;

  return {
    id: rng.uuid() as InsightId,
    type: 'Tactic',
    warriorId: warrior.id,
    warriorName: warrior.name,
    detail: `Suspected OE: ${suspectedOE}, AL: ${suspectedAL}`,
    discoveredWeek: week,
  };
}

/** Create trait insight tokens from discovered traits. */
export function createTraitInsights(
  suspectedTraits: string[],
  warrior: Warrior,
  week: number,
  rng: IRNGService
): InsightToken[] {
  return suspectedTraits.map((trait) => ({
    id: rng.uuid() as InsightId,
    type: 'Trait',
    warriorId: warrior.id,
    warriorName: warrior.name,
    detail: `Suspected trait: ${trait}`,
    discoveredWeek: week,
  }));
}

/**
 *
 */
export interface GenerateScoutInsightsArgs {
  warrior: Warrior;
  quality: ScoutQuality;
  week: number;
  rng: IRNGService;
  styleName: string;
  suspectedOE?: string;
  suspectedAL?: string;
  suspectedTraits?: string[];
}

/**
 * Generate insight tokens discovered during scouting.
 * @param args.warrior - The warrior being scouted.
 * @param args.quality - Scout quality level (Basic/Detailed/Expert).
 * @param args.week - Current game week.
 * @param args.rng - RNG service.
 * @param args.styleName - Display name of the warrior's fighting style.
 * @param args.suspectedOE - Suspected offensive eagerness level.
 * @param args.suspectedAL - Suspected activity level.
 * @param args.suspectedTraits - Traits discovered during expert scouting.
 * @returns Array of new insight tokens.
 */
export function generateScoutInsights(args: GenerateScoutInsightsArgs): InsightToken[] {
  const { warrior, quality, week, rng, styleName } = args;
  const { suspectedOE, suspectedAL, suspectedTraits } = args;
  const tactic = createTacticInsight({ warrior: warrior, quality: quality, suspectedOE: suspectedOE, suspectedAL: suspectedAL, week: week, rng: rng });
  return [
    createStyleInsight(warrior, styleName, week, rng),
    ...createAttributeInsights(warrior, quality, week, rng),
    ...(tactic ? [tactic] : []),
    ...createTraitInsights(suspectedTraits ?? [], warrior, week, rng),
  ];
}
