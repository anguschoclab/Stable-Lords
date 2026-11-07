import { Warrior, ATTRIBUTE_KEYS } from '@/types/game';

/** Positive headroom (potential − current) bands for the growth narratives. */
const HEADROOM = { DEVELOPING_MAX: 5, SOLID: 15, VAST: 30 } as const;
/** Attribute count at/under ceiling that reads as "mostly maxed". */
const MOSTLY_MAXED_COUNT = 5;

/**
 * Narrative descriptors for growth headroom.
 * These hint at potential without showing numbers.
 */
export function growthNarrative(
  current: number,
  potential: number | undefined
): {
  label: string;
  color: string;
  tooltip: string;
} {
  if (potential === undefined) {
    return { label: '', color: '', tooltip: 'Growth potential unknown' };
  }
  const gap = potential - current;
  if (gap <= 0)
    return {
      label: 'Mastered',
      color: 'text-muted-foreground',
      tooltip: 'This warrior has reached their natural ceiling in this area.',
    };
  if (gap === 1)
    return {
      label: 'Nearing peak',
      color: 'text-arena-gold/70',
      tooltip: 'Little room left to grow. Training gains will be rare.',
    };
  if (gap === 2)
    return {
      label: 'Maturing',
      color: 'text-arena-gold',
      tooltip: 'Some growth remains, but progress is slowing.',
    };
  if (gap <= HEADROOM.DEVELOPING_MAX)
    return {
      label: 'Developing',
      color: 'text-primary',
      tooltip: 'Solid room for improvement through training and experience.',
    };
  return {
    label: 'Raw talent',
    color: 'text-accent drop-shadow-md',
    tooltip: 'Tremendous untapped potential. This warrior could become exceptional.',
  };
}

/** Overall narrative assessment of a warrior's growth ceiling */
export function overallGrowthNarrative(warrior: Warrior): string {
  if (!warrior.potential) return "This warrior's limits are unknown.";
  const gaps = ATTRIBUTE_KEYS.map(
    (k) => ((warrior.potential ? warrior.potential[k] : 0) || 0) - warrior.attributes[k]
  );
  const totalGap = gaps.reduce((s, g) => s + Math.max(0, g), 0);
  const maxedCount = gaps.filter((g) => g <= 0).length;

  if (maxedCount === ATTRIBUTE_KEYS.length)
    return 'A fully realized warrior — there is nothing more the arena can teach.';
  if (maxedCount >= MOSTLY_MAXED_COUNT)
    return 'Nearing the end of their growth. Focus training on what remains.';
  if (totalGap >= HEADROOM.VAST)
    return 'Brimming with untapped potential. The right training could forge a legend.';
  if (totalGap >= HEADROOM.SOLID) return 'Still growing. There are gains to be made across the board.';
  return 'Approaching their natural limits, but a few areas can still sharpen.';
}
