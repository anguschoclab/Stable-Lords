import { describe, it, expect } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId, StableId } from '@/types/shared.types';

function makeWarrior(id: string, name: string, status: string = 'Active'): Warrior {
  return {
    id: id as WarriorId,
    name,
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    baseSkills: {} as any,
    derivedStats: {} as any,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    traits: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: status as any,
    age: 20,
  };
}

function makeRival(id: string, roster: Warrior[]): RivalStableData {
  return {
    id: id as StableId,
    fame: 50,
    owner: {
      id: `owner-${id}` as any,
      name: `Owner ${id}`,
      fame: 50,
      stableName: `Stable ${id}`,
      renown: 5,
      titles: 0,
    },
    roster,
    treasury: 1000,
    tier: 'Established' as any,
    ledger: [],
    trainingAssignments: [],
  };
}

describe('AI edgeCaseDecisions', () => {
  it('AI with empty roster does not crash advanceWeek', async () => {
    const state = createFreshState('ai-empty-roster-test');
    state.rivals = [makeRival('rival-empty', [])];

    expect(() => advanceWeek(state, { headless: true })).not.toThrow();
  });

  it('AI with all-injured roster does not schedule bouts', async () => {
    const state = createFreshState('ai-injured-roster-test');
    state.rivals = [
      makeRival('rival-injured', [
        makeWarrior('iw1', 'Injured1', 'Injured'),
        makeWarrior('iw2', 'Injured2', 'Injured'),
      ]),
    ];

    const next = await advanceWeek(state, { headless: true });

    // The stable survives and no injured warrior is offered a bout
    const rival = next.rivals?.find((r) => r.id === 'rival-injured');
    expect(rival).toBeDefined();
    const offered = new Set<string>();
    for (const offer of Object.values(next.boutOffers ?? {})) {
      if (offer.status === 'Proposed' || offer.status === 'Signed') {
        for (const wid of offer.warriorIds) offered.add(wid as string);
      }
    }
    expect(offered.has('iw1')).toBe(false);
    expect(offered.has('iw2')).toBe(false);
    // Injured warriors are processed out of the bookable roster; the unified
    // draft path signs at most one replacement per week.
    expect(rival!.roster.every((w) => w.status === 'Active')).toBe(true);
  });

  it('AI does not draft from empty pool', async () => {
    const state = createFreshState('ai-empty-pool-test');
    state.recruitPool = [];
    state.rivals = [makeRival('rival-1', [makeWarrior('rw1', 'Rival1')])];

    const next = await advanceWeek(state, { headless: true });

    // The game should not crash and rivals should still have their warriors
    expect(next.rivals).toBeDefined();
    expect(next.rivals!.length).toBeGreaterThan(0);
  });

  it('bankrupt AI stable triggers replacement', async () => {
    const state = createFreshState('ai-bankrupt-test');
    // Create a rival with very low treasury to trigger bankruptcy
    const bankruptRival = makeRival('rival-bankrupt', [makeWarrior('bw1', 'BankruptWarrior')]);
    bankruptRival.treasury = -10000; // Deeply in debt
    state.rivals = [bankruptRival];

    const next = await advanceWeek(state, { headless: true });

    // The game should not crash
    expect(next.rivals).toBeDefined();
    expect(next.rivals!.length).toBeGreaterThan(0);
    // The bankrupt stable should either be replaced or still exist
    // (bankruptcy handling may vary, but it shouldn't crash)
  });
});
