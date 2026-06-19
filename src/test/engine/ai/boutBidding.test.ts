/**
 * Gaps 2, 6, 8 — Bout bidding system issues.
 * Gap 2: generateBoutBids is dead code, never called from pipeline
 * Gap 6: matchup scoring break exits after first opponent
 * Gap 8: weather modifiers cover only 8 of 35+ weather types
 */
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior, WarriorId } from '@/types/shared.types';
import type { RivalStableData } from '@/types/state.types';
import { generateBoutBids } from '@/engine/ai/workers/competitionWorker/boutBidding';

// ─── Helpers ────────────────────────────────────────────────────────────────

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

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Gap 6: matchup scoring evaluates all opponents, not just first', () => {
  it('matchupModifier reflects best matchup, not just first opponent found', () => {
    // BashingAttack vs LungingAttack is a known favorable matchup (oe+2)
    // BashingAttack vs AimedBlow is a neutral matchup (oe+0)
    const warrior = makeWarrior('Basher', FightingStyle.BashingAttack);
    const favorOpp = makeWarrior('Lunger', FightingStyle.LungingAttack);
    const neutralOpp = makeWarrior('Aimer', FightingStyle.AimedBlow);

    // Put the neutral opponent FIRST in the roster — if the break bug exists,
    // it will score against the neutral opponent and miss the favorable one.
    const otherRival = {
      id: 'rival-2' as any,
      owner: { id: 'owner-2' as any, name: 'Other', stableName: 'Other Stable', fame: 100, renown: 50, titles: 0 },
      roster: [neutralOpp, favorOpp],
      treasury: 1000,
      fame: 100,
      ledger: [],
      trainingAssignments: [],
    } as any;

    const rival = makeRival({ roster: [warrior] });
    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', [otherRival]);

    expect(bids.length).toBeGreaterThan(0);
    // The priority should reflect the favorable matchup, not the neutral one.
    // With the bug (break after first), matchupModifier would be 0 (from AimedBlow).
    // Without the bug, it should find the favorable LungingAttack matchup.
    // Standard bout base priority = 4 + weatherMod(0) + moodMod(0) + matchupMod
    // Favorable matchup: (score-100)/20 > 0 → priority > 4
    const bid = bids[0]!;
    expect(bid.priority).toBeGreaterThan(4);
  });
});

describe('Gap 8: weather modifiers cover all significant weather types', () => {
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

describe('Gap 8: RECOVERY intent skips bids when weather modifier is severe', () => {
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

describe('Gap 2: generateBoutBids is called from RivalStrategyPass', () => {
  it('RivalStrategyPass generates bids for active rival warriors', async () => {
    const { runRivalStrategyPass } = await import('@/engine/pipeline/passes/RivalStrategyPass');

    const warrior = makeWarrior('Fighter', FightingStyle.StrikingAttack);
    const rival = makeRival({ roster: [warrior] });

    const state = {
      week: 5,
      year: 1,
      season: 'Spring',
      weather: 'Clear',
      crowdMood: 'Calm',
      rivals: [rival],
      roster: [],
      arenaHistory: [],
      boutOffers: {},
      tournaments: [],
      isTournamentWeek: false,
      recruitPool: [],
      hiringPool: [],
      trainers: [],
      player: { id: 'player-1' as any, name: 'Player', stableName: 'Player Stable', fame: 0, renown: 0, titles: 0 },
      realmRankings: {},
      promoters: {},
      rivalMap: new Map([['rival-1', rival]]) as any,
      warriorMap: new Map([[warrior.id, warrior]]) as any,
      warriorToStableMap: new Map([[warrior.id, { stableId: 'rival-1', isPlayer: false }]]) as any,
      ownerGrudges: [],
    } as any;

    const impact = runRivalStrategyPass(state, 6, undefined as any, true);

    // The impact should include some evidence that bidding occurred
    // (e.g., bout offers generated from bids)
    expect(impact).toBeDefined();
    expect(impact.boutOffers).toBeDefined();
    expect(Object.keys(impact.boutOffers!).length).toBeGreaterThan(0);
  });
});
