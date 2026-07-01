import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInsightManager } from '@/components/ledger/InsightManager/hooks/useInsightManager';
import type { InsightToken, Warrior } from '@/types/state.types';

function makeToken(id: string, type: string = 'Weapon'): InsightToken {
  return { id, type, week: 1 } as unknown as InsightToken;
}

function makeWarrior(id: string, name: string): Warrior {
  return {
    id,
    name,
    style: 'StrikingAttack',
    attributes: {},
    baseSkills: {},
    derivedStats: {},
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    traits: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 20,
    favorites: { weaponId: 'Gladius', rhythm: { oe: 5, al: 5 } },
  } as unknown as Warrior;
}

describe('#14 useInsightManager timer cleanup on re-reveal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handleReveal clears the previous timer before setting a new one', () => {
    const consumeInsightToken = vi.fn();
    const tokens = [makeToken('t1')];
    const roster = [makeWarrior('w1', 'Alice')];

    const { result } = renderHook(() =>
      useInsightManager({ consumeInsightToken, insightTokens: tokens, roster })
    );

    // Select token and warrior
    act(() => {
      result.current.setSelectedTokenId('t1');
      result.current.setSelectedWarriorId('w1');
    });

    // First reveal — sets a 2s timer
    act(() => {
      result.current.handleReveal();
    });
    expect(result.current.isRevealing).toBe(true);

    // Second reveal before timer fires — should clear the first timer
    // and set a new one
    act(() => {
      result.current.handleReveal();
    });
    expect(result.current.isRevealing).toBe(true);

    // Advance time past the second timer (2s)
    // If the first timer was NOT cleared, consumeInsightToken would be called
    // twice (once at 2s from the first, once at 2s from the second).
    // With proper cleanup, it should only be called once.
    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(consumeInsightToken).toHaveBeenCalledTimes(1);
    expect(result.current.isRevealing).toBe(false);
  });

  it('cleanup on unmount clears the timer', () => {
    const consumeInsightToken = vi.fn();
    const tokens = [makeToken('t1')];
    const roster = [makeWarrior('w1', 'Alice')];

    const { result, unmount } = renderHook(() =>
      useInsightManager({ consumeInsightToken, insightTokens: tokens, roster })
    );

    act(() => {
      result.current.setSelectedTokenId('t1');
      result.current.setSelectedWarriorId('w1');
    });

    act(() => {
      result.current.handleReveal();
    });

    // Unmount before timer fires
    unmount();

    // Advance time — timer should have been cleared on unmount
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // consumeInsightToken should NOT have been called because timer was cleared
    expect(consumeInsightToken).not.toHaveBeenCalled();
  });
});
