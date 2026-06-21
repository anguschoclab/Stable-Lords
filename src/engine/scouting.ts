/**
 * Scouting System — gather intel on upcoming opponents.
 *
 * Scouting reveals partial information about an opponent:
 * - Style (always visible)
 * - Approximate attribute text descriptions (based on scout quality)
 * - Win/loss record
 * - Known injuries
 * - Suspected fight plan tendencies
 */
import type { InsightToken } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import {
  STYLE_DISPLAY_NAMES,
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS,
  type InsightId,
} from '@/types/shared.types';

/**
 * Scout quality type.
 */
export type ScoutQuality = 'Basic' | 'Detailed' | 'Expert';

/**
 * Defines the shape of scout report.
 */
export interface ScoutReport {
  id: string;
  warriorName: string;
  style: string;
  quality: ScoutQuality;
  week: number;
  /** Attribute ranges mapped to text descriptions */
  attributeRanges: Record<string, string>;
  record: string;
  knownInjuries: string[];
  suspectedOE?: string; // "Low" | "Medium" | "High"
  suspectedAL?: string;
  /** Traits suspected/discovered during scouting */
  suspectedTraits?: string[];
  notes: string;
}

const QUALITY_FUZZ: Record<ScoutQuality, number> = {
  Basic: 5,
  Detailed: 3,
  Expert: 1,
};

const SCOUT_COST: Record<ScoutQuality, number> = {
  Basic: 25,
  Detailed: 50,
  Expert: 100,
}; /**
    * Get scout cost.
    */

/**
 * Get scout cost.
 */
export function getScoutCost(quality: ScoutQuality): number {
  return SCOUT_COST[quality];
}

/** Converts a numerical stat into a qualitative text description */
export function getAttributeDescription(value: number): string {
  if (value <= 5) return 'Pathetic';
  if (value <= 8) return 'Weak';
  if (value <= 11) return 'Average';
  if (value <= 14) return 'Good';
  if (value <= 17) return 'Great';
  if (value <= 20) return 'Exceptional';
  return 'Monstrous';
}

/** Converts a stat range into a textual description */
export function getAttributeRangeDescription(low: number, high: number): string {
  const lowDesc = getAttributeDescription(low);
  const highDesc = getAttributeDescription(high);

  if (lowDesc === highDesc) return lowDesc;
  return `${lowDesc} to ${highDesc}`;
}

import type { IRNGService } from '@/engine/core/rng/IRNGService';

/**
 * Generate range descriptions for attributes during scouting.
 */
function generateScoutAttributeRanges(
  warrior: Warrior,
  fuzz: number,
  rng: IRNGService
): Record<string, string> {
  const attributeRanges: Record<string, string> = {};
  for (const key of ATTRIBUTE_KEYS) {
    const val = warrior.attributes[key];
    const low = Math.max(3, val - fuzz + Math.floor(rng.next() * 2));
    const high = Math.min(25, val + fuzz - Math.floor(rng.next() * 2));
    attributeRanges[key] = getAttributeRangeDescription(low, high);
  }
  return attributeRanges;
}

/**
 * Discover known injuries based on scouting quality.
 */
function discoverScoutInjuries(warrior: Warrior, quality: ScoutQuality): string[] {
  const knownInjuries: string[] = [];
  if (quality !== 'Basic') {
    for (const inj of warrior.injuries) {
      if (typeof inj === 'string') {
        knownInjuries.push(inj);
      }
    }
  }
  return knownInjuries;
}

/**
 * Identify suspected fight plan tendencies (OE/AL) for expert scouting.
 */
function getSuspectedPlanTendencies(
  warrior: Warrior,
  quality: ScoutQuality
): { suspectedOE?: string; suspectedAL?: string } {
  if (quality === 'Expert' && warrior.plan) {
    return {
      suspectedOE: warrior.plan.OE >= 7 ? 'High' : warrior.plan.OE >= 4 ? 'Medium' : 'Low',
      suspectedAL: warrior.plan.AL >= 7 ? 'High' : warrior.plan.AL >= 4 ? 'Medium' : 'Low',
    };
  }
  return {};
}

/**
 * Generate qualitative notes about the warrior based on scouting quality.
 */
function generateScoutReportNotes(warrior: Warrior, quality: ScoutQuality, record: string): string {
  const styleName = STYLE_DISPLAY_NAMES[warrior.style] ?? warrior.style;
  if (quality === 'Basic') {
    return `${warrior.name} fights as a ${styleName}. Limited information available.`;
  }
  if (quality === 'Detailed') {
    return `${warrior.name} is a ${styleName} with ${record}. ${
      warrior.fame > 3 ? 'Well-known in the arena.' : 'Relatively unknown.'
    }`;
  }
  return `${warrior.name} is an experienced ${styleName} (${record}). ${
    warrior.career.kills > 0
      ? `Known killer (${warrior.career.kills} kills).`
      : 'No kills on record.'
  }`;
}

/**
 * Discover traits based on scouting quality.
 * Expert scouting has 60% chance to reveal 1 trait, 20% chance to reveal 2 traits.
 */
function discoverScoutTraits(warrior: Warrior, quality: ScoutQuality, rng: IRNGService): string[] {
  if (quality !== 'Expert' || !warrior.traits || warrior.traits.length === 0) {
    return [];
  }

  const suspectedTraits: string[] = [];
  const traitRevealRoll = rng.next();

  if (traitRevealRoll < 0.65) {
    // Reveal 1 trait
    suspectedTraits.push(rng.pick(warrior.traits));
  } else if (traitRevealRoll < 0.9) {
    // Slightly increased discovery weight for traits
    // Reveal 2 traits (if warrior has 2+)
    if (warrior.traits.length >= 2) {
      const shuffled = [...warrior.traits].sort(() => 0.5 - rng.next());
      suspectedTraits.push(...shuffled.slice(0, 2));
    } else {
      suspectedTraits.push(...warrior.traits);
    }
  }

  return suspectedTraits;
}

/**
 * Generate insight tokens discovered during scouting.
 * @param warrior - The warrior being scouted.
 * @param quality - Scout quality level (Basic/Detailed/Expert).
 * @param week - Current game week.
 * @param rng - RNG service.
 * @param styleName - Display name of the warrior's fighting style.
 * @param suspectedOE - Suspected offensive eagerness level.
 * @param suspectedAL - Suspected activity level.
 * @param suspectedTraits - Traits discovered during expert scouting.
 * @returns Array of new insight tokens.
 */
function generateScoutInsights(
  warrior: Warrior,
  quality: ScoutQuality,
  week: number,
  rng: IRNGService,
  styleName: string,
  suspectedOE?: string,
  suspectedAL?: string,
  suspectedTraits?: string[]
): InsightToken[] {
  const newInsights: InsightToken[] = [];

  // Basic scouting reveals Style
  newInsights.push({
    id: rng.uuid() as InsightId,
    type: 'Style',
    warriorId: warrior.id,
    warriorName: warrior.name,
    detail: `Identified as ${styleName}`,
    discoveredWeek: week,
  });

  // Detailed/Expert scouting reveals random attributes
  if (quality === 'Detailed' || quality === 'Expert') {
    const attrsToReveal = [...ATTRIBUTE_KEYS]
      .sort(() => 0.5 - rng.next())
      .slice(0, quality === 'Expert' ? 4 : 2);
    attrsToReveal.forEach((attr) => {
      newInsights.push({
        id: rng.uuid() as InsightId,
        type: 'Attribute',
        warriorId: warrior.id,
        warriorName: warrior.name,
        targetKey: attr,
        detail: `Discovered exact ${ATTRIBUTE_LABELS[attr] ?? attr}`,
        discoveredWeek: week,
      });
    });
  }

  // Expert scouting reveals Tactics
  if (quality === 'Expert' && warrior.plan) {
    newInsights.push({
      id: rng.uuid() as InsightId,
      type: 'Tactic',
      warriorId: warrior.id,
      warriorName: warrior.name,
      detail: `Suspected OE: ${suspectedOE}, AL: ${suspectedAL}`,
      discoveredWeek: week,
    });
  }

  // Expert scouting reveals Traits
  if (quality === 'Expert' && suspectedTraits && suspectedTraits.length > 0) {
    suspectedTraits.forEach((trait) => {
      newInsights.push({
        id: rng.uuid() as InsightId,
        type: 'Trait',
        warriorId: warrior.id,
        warriorName: warrior.name,
        detail: `Suspected trait: ${trait}`,
        discoveredWeek: week,
      });
    });
  }

  return newInsights;
}

/** Generate a scout report for a warrior */
export function generateScoutReport(
  warrior: Warrior,
  quality: ScoutQuality,
  week: number,
  rng: IRNGService
): { report: ScoutReport; newInsights: InsightToken[] } {
  const fuzz = QUALITY_FUZZ[quality];

  const attributeRanges = generateScoutAttributeRanges(warrior, fuzz, rng);
  const record = `${warrior.career.wins}W-${warrior.career.losses}L`;
  const knownInjuries = discoverScoutInjuries(warrior, quality);
  const { suspectedOE, suspectedAL } = getSuspectedPlanTendencies(warrior, quality);
  const suspectedTraits = discoverScoutTraits(warrior, quality, rng);
  const notes = generateScoutReportNotes(warrior, quality, record);
  const styleName = STYLE_DISPLAY_NAMES[warrior.style] ?? warrior.style;

  const newInsights = generateScoutInsights(
    warrior,
    quality,
    week,
    rng,
    styleName,
    suspectedOE,
    suspectedAL,
    suspectedTraits
  );

  return {
    report: {
      id: rng.uuid(),
      warriorName: warrior.name,
      style: warrior.style,
      quality,
      week,
      attributeRanges,
      record,
      knownInjuries,
      suspectedOE,
      suspectedAL,
      suspectedTraits,
      notes,
    },
    newInsights,
  };
}
