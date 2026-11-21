import { describe, it, expect } from 'vitest';
// V30-W8: autosim's player-side offer acceptance must run the SAME
// evaluateBoutOffer ruleset AI stables use — not a hype/purse heuristic.
import { processPlayerOffers } from '@/engine/autosim/autosim';
import { makeAutosimOffer, makeSimmableState } from '@/test/_fixtures/autosimCouncil';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { InjuryData } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';

const severe: InjuryData = {
  id: 'i1' as InjuryData['id'],
  name: 'Fractured Rib',
  description: 'severe',
  severity: 'Severe',
  weeksRemaining: 3,
  penalties: {},
} as InjuryData;

describe('processPlayerOffers — evaluateBoutOffer ruleset (V30)', () => {
  it('declines an offer on a warrior with a blocking injury even when hype > 100', () => {
    const injured = makeWarrior({ id: 'w1' as WarriorId, injuries: [severe] });
    const offer = makeAutosimOffer('o1', ['w1', 'r1-w'], { hype: 150, purse: 0 });
    const state = makeSimmableState({
      roster: [injured],
      boutOffers: { o1: offer },
      warriorToOfferIds: undefined,
    });
    const out = processPlayerOffers(state);
    const updated = out.boutOffers['o1' as keyof typeof out.boutOffers] ?? out.boutOffers.o1;
    expect(updated.responses['w1' as WarriorId]).not.toBe('Accepted');
  });

  it('accepts a clean offer the evaluator approves', () => {
    const healthy = makeWarrior({ id: 'w1' as WarriorId, injuries: [] });
    const offer = makeAutosimOffer('o2', ['w1', 'r1-w'], { hype: 50, purse: 50 });
    const state = makeSimmableState({
      roster: [healthy],
      boutOffers: { o2: offer },
      warriorToOfferIds: undefined,
    });
    const out = processPlayerOffers(state);
    const updated = out.boutOffers['o2' as keyof typeof out.boutOffers] ?? out.boutOffers.o2;
    expect(updated.responses['w1' as WarriorId]).toBe('Accepted');
  });
});
