/**
 * Bout Bidding Performance — verifies that the current Array.find() pattern
 * for VENDETTA targeting produces correct results. After Group A merge,
 * the Map lookup optimization must preserve this behavior.
 */
import { describe, it, expect } from 'vitest';
import { generateBoutBids } from '@/engine/ai/workers/competitionWorker/boutBidding';
import type { RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle, type WarriorId } from '@/types/shared.types';

function makeWarrior(name: string, style: FightingStyle, fame: number = 100): Warrior {
  return {
    id: `w_${name}` as WarriorId,
    name,
    style,
    attributes: { ST: 10, CN: 12, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    traits: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    derivedStats: { hp: 100 } as any,
  } as Warrior;
}

function makeRival(overrides: Partial<RivalStableData> = {}): RivalStableData {
  return {
    id: 'rival-1' as any,
    owner: {
      id: 'owner-1' as any,
      name: 'Owner',
      stableName: 'Stable',
      fame: 100,
      renown: 50,
      titles: 0,
      personality: 'Aggressive',
    },
    roster: [makeWarrior('Fighter1', FightingStyle.BashingAttack)],
    treasury: 1000,
    fame: 100,
    ledger: [],
    trainingAssignments: [],
    strategy: { intent: 'VENDETTA', planWeeksRemaining: 4, targetStableId: 'rival-2' as any },
    ...overrides,
  } as RivalStableData;
}

describe('boutBidding VENDETTA targeting', () => {
  it('VENDETTA with targetStableId finds the target rival', () => {
    const targetRival = makeRival({
      id: 'rival-2' as any,
      owner: { ...makeRival().owner, id: 'owner-2' as any },
      roster: [makeWarrior('Target1', FightingStyle.SlashingAttack, 200)],
    });
    const vendettaRival = makeRival({
      strategy: { intent: 'VENDETTA', planWeeksRemaining: 4, targetStableId: 'rival-2' as any },
    });

    const { bids } = generateBoutBids(vendettaRival, 5, 'Clear', 'Calm', [targetRival]);
    // VENDETTA should generate bids targeting the rival's stable
    expect(bids.length).toBeGreaterThan(0);
    // All bids should target the vendetta target stable
    for (const bid of bids) {
      expect(bid.targetStableId).toBe('rival-2');
    }
  });

  it('VENDETTA with missing targetStableId still produces bids (pre-existing behavior)', () => {
    const vendettaRival = makeRival({
      strategy: { intent: 'VENDETTA', planWeeksRemaining: 4, targetStableId: 'nonexistent' as any },
    });
    const { bids } = generateBoutBids(vendettaRival, 5, 'Clear', 'Calm', []);
    // Pre-existing behavior: VENDETTA with truthy targetStableId still pushes bids
    // even when the target rival is not found in the rivals array
    expect(bids.length).toBeGreaterThan(0);
    expect(bids[0]!.targetStableId).toBe('nonexistent');
  });

  it('Non-VENDETTA intents still iterate all rivals for matchup scoring', () => {
    const rival1 = makeRival({
      id: 'rival-a' as any,
      owner: { ...makeRival().owner, id: 'owner-a' as any },
      roster: [makeWarrior('A1', FightingStyle.BashingAttack)],
      strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 4 },
    });
    const rival2 = makeRival({
      id: 'rival-b' as any,
      owner: { ...makeRival().owner, id: 'owner-b' as any },
      roster: [makeWarrior('B1', FightingStyle.SlashingAttack, 300)],
    });
    const { bids } = generateBoutBids(rival1, 5, 'Clear', 'Calm', [rival2]);
    // CONSOLIDATION should still evaluate matchups against all rivals
    expect(bids.length).toBeGreaterThan(0);
  });
});
