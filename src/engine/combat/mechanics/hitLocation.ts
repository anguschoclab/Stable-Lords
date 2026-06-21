/**
 * Hit location system — location constants, targeting, and protection coverage.
 */

/**
 *
 */
export type HitLocation =
  | 'head'
  | 'chest'
  | 'abdomen'
  | 'right arm'
  | 'left arm'
  | 'right leg'
  | 'left leg';

export const HIT_LOCATIONS = [
  'head',
  'chest',
  'abdomen',
  'right arm',
  'left arm',
  'right leg',
  'left leg',
] as const;

// Target & Protect constants
const TARGET_HIT_CHANCE = 0.7;
const TARGET_MISS_CHANCE = 0.3;

export const LOCATION_DAMAGE_MULT: Record<HitLocation, number> = {
  head: 1.5,
  chest: 1.2,
  abdomen: 1.1,
  'right arm': 1.0,
  'left arm': 1.0,
  'right leg': 1.0,
  'left leg': 1.0,
};

export const LOCATION_KILL_MULT: Record<HitLocation, number> = {
  head: 6.0,
  chest: 3.5,
  abdomen: 3.5,
  'right arm': 0.1,
  'left arm': 0.1,
  'right leg': 0.1,
  'left leg': 0.1,
};

/**
 *
 */
export function protectCovers(protect?: string): string[] {
  if (!protect || protect === 'Any' || protect === 'none_armor' || protect === 'none_helm')
    return [];
  const p = protect.toLowerCase();

  if (p.includes('helm') || p.includes('cap') || p === 'head') return ['head'];
  if (
    p === 'leather' ||
    p === 'padded' ||
    p === 'studded_leather' ||
    p.includes('armor') ||
    p.includes('mail') ||
    p === 'body'
  )
    return ['chest', 'abdomen'];
  if (p === 'arms') return ['right arm', 'left arm'];
  if (p === 'legs') return ['right leg', 'left leg'];

  return [];
}

/**
 *
 */
export function rollHitLocation(rng: () => number, target?: string, protect?: string): HitLocation {
  const covered = protectCovers(protect);

  if (target && target !== 'Any') {
    const t = target.toLowerCase() as HitLocation;
    if ((HIT_LOCATIONS as readonly string[]).includes(t)) {
      const hitChance = covered.includes(t) ? TARGET_MISS_CHANCE : TARGET_HIT_CHANCE;
      if (rng() < hitChance) return t;
    }
  }

  if (rng() < 0.3) {
    const exposed = HIT_LOCATIONS.filter((l) => !covered.includes(l));
    if (exposed.length > 0) {
      const pick = exposed[Math.floor(rng() * exposed.length)];
      if (pick) return pick;
    }
  }

  const pick = HIT_LOCATIONS[Math.floor(rng() * HIT_LOCATIONS.length)];
  return pick ?? 'chest';
}
