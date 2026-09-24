import { describe, it, expect } from 'vitest';
import {
  deriveHeadToHead,
  getOpponentIntel,
  summarizeIntel,
} from '@/engine/advisor/intelAdvisor';
import { makeFightSummary, makeGameState } from '@/test/_fixtures/factories';
import type { InsightToken } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';

let tokenSeq = 0;
const mkToken = (over: Partial<InsightToken> = {}): InsightToken => ({
  id: `tok_${++tokenSeq}` as InsightToken['id'],
  type: 'Weapon',
  warriorId: 'opp1' as WarriorId,
  warriorName: 'Opp One',
  detail: 'Heavy two-hander',
  discoveredWeek: 3,
  ...over,
});

describe('deriveHeadToHead', () => {
  it('tallies wins/losses between two warriors from arenaHistory regardless of side', () => {
    const state = makeGameState({
      arenaHistory: [
        // w1 wins as side A
        makeFightSummary({ warriorIdA: 'w1' as WarriorId, warriorIdD: 'opp1' as WarriorId, winner: 'A' }),
        // w1 loses twice (as D and as A)
        makeFightSummary({ warriorIdA: 'w1' as WarriorId, warriorIdD: 'opp1' as WarriorId, winner: 'D' }),
        makeFightSummary({ warriorIdA: 'opp1' as WarriorId, warriorIdD: 'w1' as WarriorId, winner: 'A' }),
        // Unrelated fight — ignored
        makeFightSummary({ warriorIdA: 'x1' as WarriorId, warriorIdD: 'x2' as WarriorId, winner: 'A' }),
        // Unresolved — excluded
        makeFightSummary({ warriorIdA: 'w1' as WarriorId, warriorIdD: 'opp1' as WarriorId, winner: null }),
      ],
    });

    const h2h = deriveHeadToHead(state, 'w1' as WarriorId, 'opp1' as WarriorId);
    expect(h2h).toEqual({ wins: 1, losses: 2, meetings: 3 });
  });

  it('returns zeroed record when the pair never met', () => {
    const state = makeGameState({ arenaHistory: [] });
    expect(deriveHeadToHead(state, 'w1' as WarriorId, 'opp1' as WarriorId)).toEqual({
      wins: 0,
      losses: 0,
      meetings: 0,
    });
  });
});

describe('getOpponentIntel', () => {
  it('filters tokens to the opponent and dedupes per type keeping the freshest week', () => {
    const tokens: InsightToken[] = [
      mkToken({ type: 'Weapon', detail: 'Old read', discoveredWeek: 1 }),
      mkToken({ type: 'Weapon', detail: 'Fresh read', discoveredWeek: 5 }),
      mkToken({ type: 'Tactic', detail: 'Charges early', discoveredWeek: 4 }),
      mkToken({ warriorId: 'other' as WarriorId, warriorName: 'Other', detail: 'Not ours' }),
    ];
    const state = makeGameState({ insightTokens: tokens });

    const intel = getOpponentIntel(state, 'opp1' as WarriorId);
    expect(intel).toHaveLength(2);
    expect(intel.find((t) => t.type === 'Weapon')?.detail).toBe('Fresh read');
    expect(intel.find((t) => t.type === 'Tactic')?.detail).toBe('Charges early');
  });
});

describe('summarizeIntel', () => {
  it('renders one readable line per token', () => {
    const lines = summarizeIntel([
      mkToken({ type: 'Rhythm', detail: 'Slow starter' }),
    ]);
    expect(lines[0]).toContain('Rhythm');
    expect(lines[0]).toContain('Slow starter');
  });
});
