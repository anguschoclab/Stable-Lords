import { describe, it, expect } from 'vitest';
import { reviewWarriorDesign } from '@/engine/warrior/designReview';
import { FightingStyle } from '@/types/shared.types';
import type { Attributes } from '@/types/warrior.types';

const attrs = (over: Partial<Attributes> = {}): Attributes => ({
  ST: 10,
  CN: 10,
  SZ: 10,
  WT: 10,
  WL: 10,
  SP: 10,
  DF: 10,
  ...over,
});

describe('tourney design axis — the 21-wit / small-size doctrine', () => {
  it('emits a tourney-axis item for every design', () => {
    const items = reviewWarriorDesign(attrs(), FightingStyle.StrikingAttack);
    expect(items.some((i) => i.axis === 'tourney')).toBe(true);
  });

  it('flags 21 WT + small size as a stud tourney prospect', () => {
    const items = reviewWarriorDesign(attrs({ WT: 21, SZ: 4 }), FightingStyle.StrikingAttack);
    const tourney = items.filter((i) => i.axis === 'tourney');
    expect(tourney.some((i) => i.verdict === 'good')).toBe(true);
  });

  it('treats 17 WT as viable-but-capped (Rookies/Apprentices ceiling)', () => {
    const items = reviewWarriorDesign(attrs({ WT: 17 }), FightingStyle.StrikingAttack);
    const tourney = items.filter((i) => i.axis === 'tourney');
    expect(tourney.length).toBeGreaterThan(0);
    expect(tourney.every((i) => i.verdict !== 'warn')).toBe(true);
  });

  it('warns when low WT fights uphill in Initiates+ classes', () => {
    const items = reviewWarriorDesign(attrs({ WT: 9 }), FightingStyle.StrikingAttack);
    const tourney = items.filter((i) => i.axis === 'tourney');
    expect(tourney.some((i) => i.verdict === 'warn')).toBe(true);
  });

  it('recognizes scum/AB rookie-tourney setups', () => {
    const items = reviewWarriorDesign(
      attrs({ WT: 13, CN: 17, WL: 17 }),
      FightingStyle.TotalParry
    );
    const tourney = items.filter((i) => i.axis === 'tourney');
    expect(tourney.length).toBeGreaterThan(0);
    expect(tourney.every((i) => i.verdict !== 'warn')).toBe(true);
  });
});
