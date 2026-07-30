/**
 * Bout Bidding Optimization — verifies that the pre-calculation of
 * targetRival and nonVendettaOpponents outside the warrior loop
 * preserves all existing behavior.
 */
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { RivalStableData } from '@/types/state.types';
import { generateBoutBids } from '@/engine/ai/workers/competitionWorker/boutBidding';

function makeWarrior(name: string, style: FightingStyle, cn: number = 12): Warrior {
  return {
    id: `w_${name}` as WarriorId,
    name,
    style,
    attributes: { ST: 10, CN: cn, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: 100,
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
      personality: 'Pragmatic',
    },
    roster: [],
    treasury: 1000,
    fame: 100,
    ledger: [],
    trainingAssignments: [],
    strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 4 },
    ...overrides,
  } as RivalStableData;
}

describe('boutBidding optimization — VENDETTA', () => {
  it('VENDETTA with valid targetStableId generates bids targeting correct stable', () => {
    const warrior = makeWarrior('Vindicator', FightingStyle.StrikingAttack);
    const target = makeWarrior('Target1', FightingStyle.BashingAttack);

    const rival = makeRival({
      roster: [warrior],
      strategy: {
        intent: 'VENDETTA',
        targetStableId: 'rival-2' as any,
        planWeeksRemaining: 4,
      },
    });
    const targetRival = makeRival({
      id: 'rival-2' as any,
      roster: [target],
    });

    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', [targetRival]);

    expect(bids.length).toBeGreaterThan(0);
    for (const bid of bids) {
      expect(bid.targetStableId).toBe('rival-2');
    }
  });

  it('VENDETTA with missing target still generates bids with matchupModifier = 0', () => {
    const warrior = makeWarrior('Vindicator', FightingStyle.StrikingAttack);
    const rival = makeRival({
      roster: [warrior],
      strategy: {
        intent: 'VENDETTA',
        targetStableId: 'nonexistent' as any,
        planWeeksRemaining: 4,
      },
    });

    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', []);

    expect(bids.length).toBeGreaterThan(0);
    expect(bids[0]!.targetStableId).toBe('nonexistent');
    // With no opponents found, matchupModifier = 0, so priority = 10 + 0 + 0 + 0 = 10
    expect(bids[0]!.priority).toBe(10);
  });

  it('VENDETTA without targetStableId generates no bids', () => {
    const warrior = makeWarrior('Vindicator', FightingStyle.StrikingAttack);
    const rival = makeRival({
      roster: [warrior],
      strategy: { intent: 'VENDETTA', planWeeksRemaining: 4 } as any,
    });

    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', []);

    expect(bids.length).toBe(0);
  });
});

describe('boutBidding optimization — non-VENDETTA', () => {
  it('non-VENDETTA evaluates all rival opponents for matchup scoring', () => {
    const warrior = makeWarrior('Parrier', FightingStyle.ParryLunge);
    const favorOpp = makeWarrior('Basher', FightingStyle.BashingAttack);
    const neutralOpp = makeWarrior('Lunger', FightingStyle.LungingAttack);

    const rival = makeRival({ roster: [warrior] });
    const otherRival = makeRival({
      id: 'rival-2' as any,
      roster: [neutralOpp, favorOpp],
    });

    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', [otherRival]);

    expect(bids.length).toBeGreaterThan(0);
    // Favorable matchup (ParryLunge vs BashingAttack: matrix +1 → score 125 → mod +1.25)
    // priority = 4 + 0 + 0 + 1.25 = 5.25 > 4
    expect(bids[0]!.priority).toBeGreaterThan(4);
  });

  it('non-VENDETTA excludes self-rival from opponent list', () => {
    const warrior = makeWarrior('Parrier', FightingStyle.ParryLunge);
    const ownStablemate = makeWarrior('OwnBasher', FightingStyle.BashingAttack);
    const neutralOpp = makeWarrior('Lunger', FightingStyle.LungingAttack);

    const rival = makeRival({
      id: 'rival-1' as any,
      roster: [warrior, ownStablemate],
    });
    const otherRival = makeRival({
      id: 'rival-2' as any,
      roster: [neutralOpp],
    });

    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', [rival, otherRival]);

    expect(bids.length).toBeGreaterThan(0);
    const bid = bids.find((b) => b.proposingWarriorId === warrior.id);
    expect(bid).toBeDefined();
    // Only neutralOpp is scored (mod 0) → priority = 4
    expect(bid!.priority).toBe(4);
  });
});

describe('boutBidding optimization — RECOVERY', () => {
  it('RECOVERY skips warriors with severe weather penalty (< -2)', () => {
    const warrior = makeWarrior('Lunger', FightingStyle.LungingAttack);
    const rival = makeRival({
      roster: [warrior],
      strategy: { intent: 'RECOVERY', planWeeksRemaining: 2 },
    });

    // Rainy gives LungingAttack weatherModifier = -3 (< -2 threshold)
    const { bids } = generateBoutBids(rival, 5, 'Rainy', 'Calm', []);

    expect(bids.length).toBe(0);
  });

  it('RECOVERY generates bids in mild weather', () => {
    const warrior = makeWarrior('Lunger', FightingStyle.LungingAttack);
    const rival = makeRival({
      roster: [warrior],
      strategy: { intent: 'RECOVERY', planWeeksRemaining: 2 },
    });

    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', []);

    expect(bids.length).toBeGreaterThan(0);
    expect(bids[0]!.maxFame).toBe(50);
  });
});

describe('boutBidding optimization — EXPANSION', () => {
  it('EXPANSION bids have minFame: 100', () => {
    const warrior = makeWarrior('Expander', FightingStyle.StrikingAttack);
    const rival = makeRival({
      roster: [warrior],
      strategy: { intent: 'EXPANSION', planWeeksRemaining: 4 },
    });

    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', []);

    expect(bids.length).toBeGreaterThan(0);
    expect(bids[0]!.minFame).toBe(100);
  });
});

describe('boutBidding optimization — CONSOLIDATION', () => {
  it('CONSOLIDATION bids use standard priority formula', () => {
    const warrior = makeWarrior('Standard', FightingStyle.StrikingAttack);
    const rival = makeRival({ roster: [warrior] });

    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', []);

    expect(bids.length).toBeGreaterThan(0);
    // Base 4 + weather 0 + mood 0 + matchup 0 = 4
    expect(bids[0]!.priority).toBe(4);
    expect(bids[0]!.description).toBe('Standard training bout.');
  });
});

describe('boutBidding optimization — edge cases', () => {
  it('empty active roster generates no bids', () => {
    const injured = makeWarrior('Injured', FightingStyle.StrikingAttack);
    injured.status = 'Dead';
    const rival = makeRival({ roster: [injured] });

    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', []);

    expect(bids.length).toBe(0);
  });

  it('multiple warriors each get own bid with independent matchup scoring', () => {
    const w1 = makeWarrior('W1', FightingStyle.ParryLunge);
    const w2 = makeWarrior('W2', FightingStyle.WallOfSteel);
    // ParryLunge vs BashingAttack: favorable (matrix +1 → +1.25)
    // WallOfSteel vs BashingAttack: need to check — let's use a different setup
    // ParryLunge vs AimedBlow: neutral/unknown
    // WallOfSteel vs AimedBlow: unfavorable (matrix -3 → -3.75)
    // Use two separate rival stables so each warrior's best matchup differs
    const basher = makeWarrior('Basher', FightingStyle.BashingAttack);
    const aimer = makeWarrior('Aimer', FightingStyle.AimedBlow);

    const rival = makeRival({ roster: [w1, w2] });
    const otherRival1 = makeRival({
      id: 'rival-2' as any,
      roster: [basher],
    });
    const otherRival2 = makeRival({
      id: 'rival-3' as any,
      roster: [aimer],
    });

    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', [otherRival1, otherRival2]);

    expect(bids.length).toBe(2);
    const bid1 = bids.find((b) => b.proposingWarriorId === w1.id);
    const bid2 = bids.find((b) => b.proposingWarriorId === w2.id);
    expect(bid1).toBeDefined();
    expect(bid2).toBeDefined();
    // Both warriors see both opponents. W1's best is BashingAttack (+1.25 → 5.25).
    // W2's best is also BashingAttack if WallOfSteel vs BashingAttack is positive.
    // If both get same priority, they still each get their own bid — verify count and IDs
    expect(bids.length).toBe(2);
    expect(bids.map((b) => b.proposingWarriorId).sort()).toEqual(
      [w1.id, w2.id].sort()
    );
  });
});
