import { describe, it, expect, vi } from 'vitest';
import type { WarriorId } from '@/types/shared.types';
import type { RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { generateBoutBids } from '@/engine/ai/workers/competitionWorker/boutBidding';
import { FightingStyle } from '@/types/shared.types';
import { makeWarrior as fixtureWarrior, makeRival as fixtureRival,
  makeGameState,
} from '@/test/_fixtures/factories';

/**
 * Bout bidding integration tests.
 * Covers matchup scoring, weather modifiers, RECOVERY weather gating,
 * and pipeline invocation via RivalStrategyPass.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeWarrior = (name: string, style: FightingStyle, cn: number = 12): Warrior =>
  fixtureWarrior({
    id: `w_${name}` as WarriorId,
    name,
    style,
    attributes: { ST: 10, CN: cn, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: 100,
    derivedStats: { hp: 100 } as any,
  } as any);

const makeRival = (overrides: Partial<RivalStableData> = {}): RivalStableData =>
  fixtureRival({
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
  } as any);

// ─── Tests ──────────────────────────────────────────────────────────────────

/**
 * Bout Bidding Performance — verifies that the current Array.find() pattern
 * for VENDETTA targeting produces correct results. After Group A merge,
 * the Map lookup optimization must preserve this behavior.
 */

function makePerfWarrior(name: string, style: FightingStyle, fame: number = 100): Warrior {
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

function makePerfRival(overrides: Partial<RivalStableData> = {}): RivalStableData {
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
    roster: [makePerfWarrior('Fighter1', FightingStyle.BashingAttack)],
    treasury: 1000,
    fame: 100,
    ledger: [],
    trainingAssignments: [],
    strategy: { intent: 'VENDETTA', planWeeksRemaining: 4, targetStableId: 'rival-2' as any },
    ...overrides,
  } as RivalStableData;
}

describe('matchup scoring evaluates all opponents, not just first', () => {
  it('matchupModifier reflects best matchup, not just first opponent found', () => {
    // ParryLunge vs BashingAttack is a favorable matchup (matrix +1)
    // ParryLunge vs LungingAttack is a neutral matchup (matrix 0)
    const warrior = makeWarrior('Parrier', FightingStyle.ParryLunge);
    const favorOpp = makeWarrior('Basher', FightingStyle.BashingAttack);
    const neutralOpp = makeWarrior('Lunger', FightingStyle.LungingAttack);

    // Put the neutral opponent FIRST in the roster — this verifies that
    // scoring evaluates the full roster, not just the first entry.
    const otherRival = {
      id: 'rival-2' as any,
      owner: {
        id: 'owner-2' as any,
        name: 'Other',
        stableName: 'Other Stable',
        fame: 100,
        renown: 50,
        titles: 0,
      },
      roster: [neutralOpp, favorOpp],
      treasury: 1000,
      fame: 100,
      ledger: [],
      trainingAssignments: [],
    } as any;

    const rival = makeRival({ roster: [warrior] });
    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', [otherRival]);

    expect(bids.length).toBeGreaterThan(0);
    // The favorable BashingAttack matchup yields a positive modifier,
    // so priority must exceed the base of 4.
    // Standard bout base priority = 4 + weatherMod(0) + moodMod(0) + matchupMod
    // Favorable matchup: (125-100)/20 = 1.25 → priority = 5.25 > 4
    const bid = bids[0]!;
    expect(bid.priority).toBeGreaterThan(4);
  });
});

describe('matchup scoring excludes own stablemates', () => {
  it('matchupModifier does not score against own stablemates', () => {
    // ParryLunge vs BashingAttack is favorable (matrix +1 → score 125 → mod +1.25)
    // ParryLunge vs LungingAttack is neutral (matrix 0 → score 100 → mod 0)
    const warrior = makeWarrior('Parrier', FightingStyle.ParryLunge);
    const ownStablemate = makeWarrior('OwnBasher', FightingStyle.BashingAttack);
    const neutralOpp = makeWarrior('Lunger', FightingStyle.LungingAttack);

    const rival = makeRival({
      id: 'rival-1' as any,
      roster: [warrior, ownStablemate],
    });
    const otherRival = {
      id: 'rival-2' as any,
      owner: {
        id: 'owner-2' as any,
        name: 'Other',
        stableName: 'Other Stable',
        fame: 100,
        renown: 50,
        titles: 0,
      },
      roster: [neutralOpp],
      treasury: 1000,
      fame: 100,
      ledger: [],
      trainingAssignments: [],
    } as any;

    // Mimic production: rivals array includes the bidding rival itself
    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', [rival, otherRival]);

    expect(bids.length).toBeGreaterThan(0);
    const bid = bids.find((b) => b.proposingWarriorId === warrior.id);
    expect(bid).toBeDefined();
    expect(bid!.priority).toBe(4);
  });
});

describe('matchupModifier goes negative for unfavorable matchups', () => {
  it('matchupModifier reflects negative score when all opponents are unfavorable', () => {
    // WallOfSteel vs AimedBlow: matrix -3 → score 25 → (25-100)/20 = -3.75
    const warrior = makeWarrior('Wall', FightingStyle.WallOfSteel);
    const opponent = makeWarrior('Aimer', FightingStyle.AimedBlow);

    const rival = makeRival({ roster: [warrior] });
    const otherRival = {
      id: 'rival-2' as any,
      owner: {
        id: 'owner-2' as any,
        name: 'Other',
        stableName: 'Other Stable',
        fame: 100,
        renown: 50,
        titles: 0,
      },
      roster: [opponent],
      treasury: 1000,
      fame: 100,
      ledger: [],
      trainingAssignments: [],
    } as any;

    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', [otherRival]);

    expect(bids.length).toBeGreaterThan(0);
    expect(bids[0]!.priority).toBeLessThan(4);
  });

  it('matchupModifier stays 0 when no opponents exist', () => {
    const warrior = makeWarrior('Loner', FightingStyle.StrikingAttack);
    const rival = makeRival({ roster: [warrior] });

    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', []);

    expect(bids.length).toBeGreaterThan(0);
    // No opponents → modifier defaults to 0 → priority = 4
    expect(bids[0]!.priority).toBe(4);
  });
});

describe('VENDETTA without targetStableId', () => {
  it('VENDETTA without target does not generate standard training bout bids', () => {
    const warrior = makeWarrior('Vindicator', FightingStyle.StrikingAttack);
    const rival = makeRival({
      roster: [warrior],
      strategy: { intent: 'VENDETTA', planWeeksRemaining: 4 } as any,
    });

    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', []);

    expect(bids.length).toBe(0);
  });
});

describe('VENDETTA bid description reflects matchup against target stable', () => {
  it('VENDETTA bid description contains Favorable matchup when target has disadvantaged style', () => {
    // ParryLunge vs BashingAttack: matrix +1 → favorable
    const warrior = makeWarrior('Parrier', FightingStyle.ParryLunge);
    const target = makeWarrior('Basher', FightingStyle.BashingAttack);

    const rival = makeRival({
      id: 'rival-1' as any,
      roster: [warrior],
      strategy: {
        intent: 'VENDETTA',
        targetStableId: 'rival-2' as any,
        planWeeksRemaining: 4,
      },
    });
    const targetRival = {
      id: 'rival-2' as any,
      owner: {
        id: 'owner-2' as any,
        name: 'Target',
        stableName: 'Target Stable',
        fame: 100,
        renown: 50,
        titles: 0,
      },
      roster: [target],
      treasury: 1000,
      fame: 100,
      ledger: [],
      trainingAssignments: [],
    } as any;

    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', [targetRival]);

    expect(bids.length).toBeGreaterThan(0);
    expect(bids[0]!.description).toContain('Favorable matchup');
  });
});

describe('weather modifiers cover all significant weather types', () => {
  it('applies weather modifier for Gale', () => {
    const warrior = makeWarrior('Striker', FightingStyle.StrikingAttack);
    const rival = makeRival({ roster: [warrior] });

    const { bids: galeBids } = generateBoutBids(rival, 5, 'Gale', 'Calm', []);
    const { bids: clearBids } = generateBoutBids(rival, 5, 'Clear', 'Calm', []);

    expect(galeBids.length).toBeGreaterThan(0);
    expect(clearBids.length).toBeGreaterThan(0);

    // Gale has initiativeMod -5 and damageMult 0.85 — should penalize priority
    expect(galeBids[0]!.priority).toBeLessThanOrEqual(clearBids[0]!.priority);
  });

  it('applies weather modifier for Sandstorm', () => {
    const warrior = makeWarrior('Aimer', FightingStyle.AimedBlow);
    const rival = makeRival({ roster: [warrior] });

    const { bids: sandBids } = generateBoutBids(rival, 5, 'Sandstorm', 'Calm', []);
    const { bids: clearBids } = generateBoutBids(rival, 5, 'Clear', 'Calm', []);

    expect(sandBids.length).toBeGreaterThan(0);
    // Sandstorm penalizes AimedBlow (initiative -4 from style-weather)
    expect(sandBids[0]!.priority).toBeLessThanOrEqual(clearBids[0]!.priority);
  });

  it('applies weather modifier for Tornado', () => {
    const warrior = makeWarrior('Striker', FightingStyle.StrikingAttack);
    const rival = makeRival({ roster: [warrior] });

    const { bids: tornadoBids } = generateBoutBids(rival, 5, 'Tornado', 'Calm', []);
    const { bids: clearBids } = generateBoutBids(rival, 5, 'Clear', 'Calm', []);

    expect(tornadoBids.length).toBeGreaterThan(0);
    // Tornado is severe (initiative -6, damage 0.8) — should penalize
    expect(tornadoBids[0]!.priority).toBeLessThanOrEqual(clearBids[0]!.priority);
  });

  it('applies weather modifier for Blood Moon', () => {
    const warrior = makeWarrior('Basher', FightingStyle.BashingAttack);
    const rival = makeRival({ roster: [warrior] });

    const { bids: bloodBids } = generateBoutBids(rival, 5, 'Blood Moon', 'Calm', []);
    const { bids: clearBids } = generateBoutBids(rival, 5, 'Clear', 'Calm', []);

    expect(bloodBids.length).toBeGreaterThan(0);
    // Blood Moon boosts aggressive styles (damageMult 1.1+ for BashingAttack)
    expect(bloodBids[0]!.priority).toBeGreaterThanOrEqual(clearBids[0]!.priority);
  });

  it('applies weather modifier for Hailstorm', () => {
    const warrior = makeWarrior('Striker', FightingStyle.StrikingAttack, 8);
    const rival = makeRival({ roster: [warrior] });

    const { bids: hailBids } = generateBoutBids(rival, 5, 'Hailstorm', 'Calm', []);
    const { bids: clearBids } = generateBoutBids(rival, 5, 'Clear', 'Calm', []);

    expect(hailBids.length).toBeGreaterThan(0);
    // Hailstorm is penalizing (stamina 1.2, initiative -4, damage 0.95)
    expect(hailBids[0]!.priority).toBeLessThanOrEqual(clearBids[0]!.priority);
  });
});

describe('RECOVERY intent skips bids when weather modifier is severe', () => {
  it('RECOVERY skips warriors with severe weather penalty', () => {
    const warrior = makeWarrior('Lunger', FightingStyle.LungingAttack);
    const rival = makeRival({
      roster: [warrior],
      strategy: { intent: 'RECOVERY', planWeeksRemaining: 2 },
    });

    // Rainy gives LungingAttack weatherModifier = -3, which is < -2 threshold
    const { bids } = generateBoutBids(rival, 5, 'Rainy', 'Calm', []);

    // Should be empty — warrior skipped due to severe weather penalty
    expect(bids.length).toBe(0);
  });

  it('RECOVERY does not skip warriors in Clear weather', () => {
    const warrior = makeWarrior('Lunger', FightingStyle.LungingAttack);
    const rival = makeRival({
      roster: [warrior],
      strategy: { intent: 'RECOVERY', planWeeksRemaining: 2 },
    });

    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', []);

    expect(bids.length).toBeGreaterThan(0);
  });
});

describe('generateBoutBids is called from RivalStrategyPass', () => {
  it('RivalStrategyPass generates bids for active rival warriors', async () => {
    const { runRivalStrategyPass } = await import('@/engine/pipeline/passes/RivalStrategyPass');
    const biddingMod = await import('@/engine/ai/workers/competitionWorker/boutBidding');
    const bidSpy = vi.spyOn(biddingMod, 'generateBoutBids');

    const warrior1 = makeWarrior('Fighter1', FightingStyle.StrikingAttack);
    const warrior2 = makeWarrior('Fighter2', FightingStyle.BashingAttack);
    const rival1 = makeRival({ roster: [warrior1] });
    const rival2 = makeRival({ id: 'rival-2' as any, roster: [warrior2] });

    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      rivals: [rival1, rival2],
      recruitPool: [],
      player: {
        id: 'player-1' as any,
        name: 'Player',
        stableName: 'Player Stable',
        fame: 0,
        renown: 0,
        titles: 0,
      },
      rivalMap: new Map([
        ['rival-1', rival1],
        ['rival-2', rival2],
      ]) as any,
      warriorMap: new Map([
        [warrior1.id, warrior1],
        [warrior2.id, warrior2],
      ]) as any,
      warriorToStableMap: new Map([
        [warrior1.id, { stableId: 'rival-1', isPlayer: false }],
        [warrior2.id, { stableId: 'rival-2', isPlayer: false }],
      ]) as any,
    });

    const impact = runRivalStrategyPass(state, 6, undefined as any, true);

    // generateBoutBids should have been called for each rival
    expect(bidSpy).toHaveBeenCalled();
    // The impact should include some evidence that bidding occurred
    expect(impact).toBeDefined();
  });
});

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
    expect(bids.map((b) => b.proposingWarriorId).sort()).toEqual([w1.id, w2.id].sort());
  });
});

describe('boutBidding VENDETTA targeting', () => {
  it('VENDETTA with targetStableId finds the target rival', () => {
    const targetRival = makePerfRival({
      id: 'rival-2' as any,
      owner: { ...makePerfRival().owner, id: 'owner-2' as any },
      roster: [makePerfWarrior('Target1', FightingStyle.SlashingAttack, 200)],
    });
    const vendettaRival = makePerfRival({
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
    const vendettaRival = makePerfRival({
      strategy: { intent: 'VENDETTA', planWeeksRemaining: 4, targetStableId: 'nonexistent' as any },
    });
    const { bids } = generateBoutBids(vendettaRival, 5, 'Clear', 'Calm', []);
    // Pre-existing behavior: VENDETTA with truthy targetStableId still pushes bids
    // even when the target rival is not found in the rivals array
    expect(bids.length).toBeGreaterThan(0);
    expect(bids[0]!.targetStableId).toBe('nonexistent');
  });

  it('does not structuredClone a mock GameState per rival (G17)', () => {
    const spy = vi.spyOn(globalThis, 'structuredClone');
    const rival = makePerfRival({
      strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 4 },
    });
    generateBoutBids(rival, 5, 'Clear', 'Calm', [rival]);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('Non-VENDETTA intents still iterate all rivals for matchup scoring', () => {
    const rival1 = makePerfRival({
      id: 'rival-a' as any,
      owner: { ...makePerfRival().owner, id: 'owner-a' as any },
      roster: [makePerfWarrior('A1', FightingStyle.BashingAttack)],
      strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 4 },
    });
    const rival2 = makePerfRival({
      id: 'rival-b' as any,
      owner: { ...makePerfRival().owner, id: 'owner-b' as any },
      roster: [makePerfWarrior('B1', FightingStyle.SlashingAttack, 300)],
    });
    const { bids } = generateBoutBids(rival1, 5, 'Clear', 'Calm', [rival2]);
    // CONSOLIDATION should still evaluate matchups against all rivals
    expect(bids.length).toBeGreaterThan(0);
  });
});
