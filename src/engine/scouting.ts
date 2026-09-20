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
import { STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { narrativeContent } from '@/data/narrative';
import type { PersonaDescriptor, PersonaGood } from '@/types/narrative.types';
import { generateScoutInsights, type ScoutQuality } from './scoutInsights';

// Re-export ScoutQuality for backward compatibility
export type { ScoutQuality };

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
};

/**
 * Get scout cost.
 */
export function getScoutCost(quality: ScoutQuality): number {
  return SCOUT_COST[quality];
}

/** Converts a numerical stat into a qualitative text description */
function getAttributeDescription(value: number): string {
  if (value <= 5) return 'Pathetic';
  if (value <= 8) return 'Weak';
  if (value <= 11) return 'Average';
  if (value <= 14) return 'Good';
  if (value <= 17) return 'Great';
  if (value <= 20) return 'Exceptional';
  return 'Monstrous';
}

/** Converts a stat range into a textual description */
function getAttributeRangeDescription(low: number, high: number): string {
  const lowDesc = getAttributeDescription(low);
  const highDesc = getAttributeDescription(high);

  if (lowDesc === highDesc) return lowDesc;
  return `${lowDesc} to ${highDesc}`;
}

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

/** Base-skill key → persona table key (DEC reads as endurance usage). */
const SKILL_TO_PERSONA = {
  ATT: 'attack',
  PAR: 'parry',
  DEF: 'defense',
  INI: 'initiative',
  RIP: 'riposte',
  DEC: 'endurance',
} as const satisfies Record<string, keyof PersonaGood>;

/**
 * 'good' descriptors are threshold ladders — take the highest `min` the
 * skill clears. 'bad' descriptors are ceiling bands — take the lowest `min`
 * at or above the skill (min doubles as the band's upper bound).
 */
function personaGoodText(skillKey: string, value: number): string | null {
  const table = narrativeContent.persona.good[skillKey as keyof PersonaGood];
  if (!table) return null;
  const pick = (entries: PersonaDescriptor[]) => {
    let best: PersonaDescriptor | null = null;
    for (const e of entries) {
      if (value >= e.min && (!best || e.min > best.min)) best = e;
    }
    return best?.text ?? null;
  };
  return pick(table.high) ?? pick(table.low);
}

function personaBadText(skillKey: string, value: number): string | null {
  const table = narrativeContent.persona.bad[skillKey as keyof typeof narrativeContent.persona.bad];
  if (!table) return null;
  let best: PersonaDescriptor | null = null;
  for (const e of [...table.high, ...table.low]) {
    if (value <= e.min && (!best || e.min < best.min)) best = e;
  }
  return best?.text ?? null;
}

/**
 * Expert scouts file a persona read: the warrior's standout strength and
 * (when it's initiative or attack) their most glaring weakness.
 */
function personaReportLines(warrior: Warrior): string[] {
  const skills = warrior.baseSkills;
  if (!skills) return [];
  const entries = Object.entries(SKILL_TO_PERSONA).map(([key, personaKey]) => ({
    personaKey,
    value: skills[key as keyof typeof skills] ?? 0,
  }));
  const strongest = entries.reduce((a, b) => (b.value > a.value ? b : a));
  const weakest = entries.reduce((a, b) => (b.value < a.value ? b : a));

  const lines: string[] = [];
  const good = personaGoodText(strongest.personaKey, strongest.value);
  if (good) lines.push(good + '.');
  const bad = personaBadText(weakest.personaKey, weakest.value);
  if (bad && weakest !== strongest) lines.push(bad + '.');
  return lines;
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
  const persona = personaReportLines(warrior);
  return `${warrior.name} is an experienced ${styleName} (${record}). ${
    warrior.career.kills > 0
      ? `Known killer (${warrior.career.kills} kills).`
      : 'No kills on record.'
  }${persona.length > 0 ? ` ${persona.join(' ')}` : ''}`;
}

/**
 * Discover traits based on scouting quality.
 * Expert scouting has 60% chance to reveal 1 trait, 20% chance to reveal 2 traits.
 */
// Scouting Integration: Updates scouting.ts so new traits appear in scout reports with appropriate discovery weights. No manual wiring needed due to dynamic nature.
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

