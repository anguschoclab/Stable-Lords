/**
 * Injury System — combat can cause injuries with mechanical effects.
 *
 * Injuries have:
 * - A name/description
 * - Stat penalties (applied during fights)
 * - Recovery time in weeks
 * - Severity level
 */
import type { Warrior, InjuryData, InjurySeverity } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { rollRange } from '@/engine/core/rng/rollRange';
import type { InjuryId } from '@/types/shared.types';

const INJURY_TABLE: Omit<InjuryData, 'id' | 'weeksRemaining'>[] = [
  // Minor (1-3 weeks)
  {
    name: 'Bruised Ribs',
    description: 'Painful but manageable.',
    severity: 'Minor',
    penalties: { CN: -1 },
  },
  {
    name: 'Sprained Wrist',
    description: 'Weapon control slightly impaired.',
    severity: 'Minor',
    penalties: { ATT: -1, DF: -1 },
  },
  {
    name: 'Black Eye',
    description: 'Vision slightly obscured.',
    severity: 'Minor',
    penalties: { DEF: -1 },
  },
  {
    name: 'Strained Shoulder',
    description: 'Swings lack full power.',
    severity: 'Minor',
    penalties: { ST: -1 },
  },
  {
    name: 'Twisted Ankle',
    description: 'Footwork compromised.',
    severity: 'Minor',
    penalties: { SP: -1 },
  },
  // Moderate (3-6 weeks)
  {
    name: 'Broken Nose',
    description: 'Hard to breathe during exertion.',
    severity: 'Moderate',
    penalties: { CN: -2, SP: -1 },
  },
  {
    name: 'Cracked Ribs',
    description: 'Every blow sends agony.',
    severity: 'Moderate',
    penalties: { CN: -2, ST: -1 },
  },
  {
    name: 'Concussion',
    description: 'Reactions slowed, judgment impaired.',
    severity: 'Moderate',
    penalties: { SP: -2, DF: -1, DEF: -1 },
  },
  {
    name: 'Deep Laceration',
    description: 'A wound that weakens with every movement.',
    severity: 'Moderate',
    penalties: { ST: -1, CN: -2 },
  },
  {
    name: 'Dislocated Shoulder',
    description: 'Arm can barely hold a weapon.',
    severity: 'Moderate',
    penalties: { ST: -2, ATT: -2 },
  },
  // Severe (6-12 weeks)
  {
    name: 'Broken Arm',
    description: 'Arm in a sling. Fighting ability devastated.',
    severity: 'Severe',
    penalties: { ST: -3, ATT: -3, PAR: -2 },
  },
  {
    name: 'Shattered Kneecap',
    description: 'Mobility severely restricted.',
    severity: 'Severe',
    penalties: { SP: -4, DEF: -3 },
  },
  {
    name: 'Skull Fracture',
    description: 'Lucky to be alive. Everything is slower.',
    severity: 'Severe',
    penalties: { SP: -3, DF: -3, CN: -2 },
  },
  {
    name: 'Severed Tendon',
    description: 'A career-threatening wound.',
    severity: 'Severe',
    penalties: { ST: -3, SP: -2, ATT: -2 },
  },
];

const SEVERITY_WEEKS: Record<InjurySeverity, [number, number]> = {
  Minor: [1, 3],
  Moderate: [3, 6],
  Severe: [6, 12],
  Critical: [12, 24],
  Permanent: [999, 999],
};

/**
 * Roll for a possible injury after a fight. Returns an Injury or null.
 *
 * @param warrior - The warrior who may be injured
 * @param outcome - The outcome of the fight
 * @param side - Which side the warrior fought on ('A' or 'D')
 * @param seed - Optional seed for RNG
 * @param rng - Optional RNG service
 * @returns An InjuryData object if injured, or null
 */
export function generateInjury(
  warrior: Warrior,
  outcome: FightOutcome,
  side: 'A' | 'D',
  seed?: number,
  rng?: IRNGService
): InjuryData | null {
  const rngService =
    rng ||
    new SeededRNGService(seed ?? (outcome.post?.fatalExchangeIndex ?? 0) + side.charCodeAt(0));
  const wasHit = side === 'A' ? (outcome.post?.hitsD ?? 0) : (outcome.post?.hitsA ?? 0);
  const lost = outcome.winner !== side && outcome.winner !== null;
  const wasKilled =
    (side === 'A' && outcome.post?.gotKillD) || (side === 'D' && outcome.post?.gotKillA);

  if (wasKilled) return null; // dead warriors don't get injured, they're dead

  // Base injury chance: 5% per hit taken, +15% if lost, +10% if KO'd
  let chance = wasHit * 0.05;
  if (lost) chance += 0.15;
  if (lost && outcome.by === 'KO') chance += 0.1;

  // CN reduces injury chance
  const cnBonus = (warrior.attributes.CN - 10) * 0.01;
  chance = Math.max(0.02, chance - cnBonus);

  if (rngService.next() >= chance) return null;

  // Determine severity based on damage taken
  let severityRoll = rngService.next();
  if (outcome.by === 'KO' && lost) severityRoll += 0.2;

  let severity: InjurySeverity;
  if (severityRoll > 0.85) severity = 'Severe';
  else if (severityRoll > 0.5) severity = 'Moderate';
  else severity = 'Minor';

  // Pick a random injury of the right severity
  const candidates = INJURY_TABLE.filter((i) => i.severity === severity);
  if (candidates.length === 0) return null;

  const template = rngService.pick(candidates);

  const [minWeeks, maxWeeks] = SEVERITY_WEEKS[severity];
  const weeks = minWeeks + Math.floor(rngService.next() * (maxWeeks - minWeeks + 1));

  return {
    ...template,
    id: rngService.uuid() as import('@/types/shared.types').InjuryId,
    weeksRemaining: weeks,
  };
}

/**
 * Ticks all injuries down by 1 week, and removes healed ones.
 *
 * @param injuries - The current array of injuries
 * @returns Object containing the new active injuries and a list of healed injury names
 */
export function tickInjuries(injuries: InjuryData[]): { active: InjuryData[]; healed: string[] } {
  const healed: string[] = [];
  const active: InjuryData[] = [];

  for (const inj of injuries) {
    const remaining = inj.weeksRemaining - 1;
    if (remaining <= 0) {
      healed.push(inj.name);
    } else {
      active.push({ ...inj, weeksRemaining: remaining });
    }
  }

  return { active, healed };
}

/**
 * Aggregates total stat penalties from all active injuries.
 *
 * @param injuries - The array of active injuries
 * @returns A record of stat keys and their cumulative negative modifiers
 */
export function getInjuryPenalties(injuries: InjuryData[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const inj of injuries) {
    for (const [stat, penalty] of Object.entries(inj.penalties)) {
      totals[stat] = (totals[stat] ?? 0) + (penalty ?? 0);
    }
  }
  return totals;
}

/**
 * Checks if a warrior is too severely injured to participate in a fight.
 *
 * @param injuries - The array of active injuries
 * @returns True if the warrior has a severe injury with more than 2 weeks remaining
 */
export function isTooInjuredToFight(injuries: InjuryData[]): boolean {
  return injuries.some(
    (i) =>
      (i.severity === 'Severe' || i.severity === 'Critical' || i.severity === 'Permanent') &&
      i.weeksRemaining > 2
  );
}

// ─── Offseason Injury Templates ─────────────────────────────────────────────

/** Static definition for an offseason injury (RNG applied at creation). */
export interface OffseasonInjuryTemplate {
  name: string;
  description: string;
  severity: InjuryData['severity'];
  weeksBase: number;
  weeksRange: number;
  penalties: InjuryData['penalties'];
}

/** Keyed offseason injury definitions used by the seasonal/event pipeline. */
export const OFFSEASON_INJURY_TEMPLATES = {
  bruisedRibs: {
    name: 'Bruised Ribs',
    description: 'Painful but manageable.',
    severity: 'Minor',
    weeksBase: 1,
    weeksRange: 2,
    penalties: { CN: -1 },
  },
  campFever: {
    name: 'Camp Fever',
    description: 'Leaves the victim weak and fatigued.',
    severity: 'Minor',
    weeksBase: 2,
    weeksRange: 2,
    penalties: { CN: -2, ST: -1 },
  },
  biteWound: {
    name: 'Bite Wound',
    description: 'A nasty bite from a wild beast.',
    severity: 'Minor',
    weeksBase: 1,
    weeksRange: 2,
    penalties: { CN: -1 },
  },
  arcaneBurns: {
    name: 'Arcane Burns',
    description: 'Singed by erratic magic.',
    severity: 'Minor',
    weeksBase: 1,
    weeksRange: 2,
    penalties: { SP: -1, CN: -1 },
  },
  goblinScratch: {
    name: 'Goblin Scratch',
    description: 'Nasty scratch from a tiny spear.',
    severity: 'Minor',
    weeksBase: 1,
    weeksRange: 2,
    penalties: { CN: -1 },
  },
  bustedKnuckles: {
    name: 'Busted Knuckles',
    description: 'A messy wound from a bare-knuckle pit fight.',
    severity: 'Minor',
    weeksBase: 1,
    weeksRange: 3,
    penalties: { SP: -1, CN: -1 },
  },
  tavernBruises: {
    name: 'Tavern Bruises',
    description: 'Scrapes and bruises from a sudden tavern brawl.',
    severity: 'Minor',
    weeksBase: 1,
    weeksRange: 1,
    penalties: { SP: -1 },
  },
  soulRot: {
    name: 'Soul Rot',
    description: 'A lingering supernatural curse.',
    severity: 'Moderate',
    weeksBase: 3,
    weeksRange: 2,
    penalties: { CN: -2, WL: -2 },
  },
  alchemicalSickness: {
    name: 'Alchemical Sickness',
    description: 'Nausea, cold sweats, and strange bodily humming.',
    severity: 'Minor',
    weeksBase: 1,
    weeksRange: 2,
    penalties: { SP: -1, CN: -1 },
  },
} as const;

export type OffseasonInjuryKey = keyof typeof OFFSEASON_INJURY_TEMPLATES;

/**
 * Creates an InjuryData from a keyed offseason template.
 * Consumes one `uuid('injury')` then one `rng.next()` for weeks — preserving
 * deterministic order.
 */
export function createOffseasonInjury(
  rng: IRNGService,
  templateKey: OffseasonInjuryKey
): InjuryData {
  const tpl = OFFSEASON_INJURY_TEMPLATES[templateKey];
  return {
    id: rng.uuid('injury') as InjuryId,
    name: tpl.name,
    description: tpl.description,
    severity: tpl.severity,
    weeksRemaining: rollRange(rng, tpl.weeksBase, tpl.weeksRange),
    penalties: tpl.penalties,
  };
}
