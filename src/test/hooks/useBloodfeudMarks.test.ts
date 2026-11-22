// @vitest-environment jsdom
/**
 * useBloodfeudMarks — live feud entitlements touching the player stable in
 * both directions: marks owed TO the player (priority booking on a killer)
 * and marks rival stables hold against a player killer. Expired marks and
 * feuds between other stables are filtered; names resolve via the entity
 * index, victims via killEvents → graveyard.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBloodfeudMarks } from '@/hooks/useBloodfeudMarks';

let mockState: any;

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: (state: any) => unknown) =>
    selector ? selector(mockState) : mockState,
  useWorldState: () => mockState,
}));

const base = (over: Record<string, any> = {}) => ({
  week: 10,
  absoluteWeek: 10,
  player: { id: 'p-stable', stableName: 'My Stable' },
  roster: [{ id: 'w-own-killer', name: 'My Killer' }],
  graveyard: [{ id: 'w-victim', name: 'Fallen One' }],
  retired: [],
  rivals: [
    {
      id: 'r-stable',
      owner: { id: 'r-owner', stableName: 'Doom Stable' },
      roster: [{ id: 'w-rival-killer', name: 'Doom Blade' }],
    },
    {
      id: 'r2-stable',
      owner: { id: 'r2-owner', stableName: 'Ash Stable' },
      roster: [],
    },
  ],
  killEvents: [],
  bloodfeudMarks: [],
  ...over,
});

describe('useBloodfeudMarks', () => {
  it('returns [] when no marks exist', () => {
    mockState = base();
    const { result } = renderHook(() => useBloodfeudMarks());
    expect(result.current).toEqual([]);
  });

  it('surfaces a feud owed to the player with killer, stable, victim, expiry', () => {
    mockState = base({
      killEvents: [{ id: 'k1', killerId: 'w-rival-killer', victimId: 'w-victim', week: 9 }],
      bloodfeudMarks: [
        {
          killerWarriorId: 'w-rival-killer',
          killerStableId: 'r-stable',
          owedStableId: 'p-stable',
          expiresWeek: 13,
        },
      ],
    });
    const { result } = renderHook(() => useBloodfeudMarks());
    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({
      direction: 'owed',
      killerName: 'Doom Blade',
      opposingStableName: 'Doom Stable',
      victimName: 'Fallen One',
      weeksLeft: 3,
    });
  });

  it('surfaces a feud a rival holds against a player killer', () => {
    mockState = base({
      bloodfeudMarks: [
        {
          killerWarriorId: 'w-own-killer',
          killerStableId: 'p-stable',
          owedStableId: 'r-stable',
          expiresWeek: 12,
        },
      ],
    });
    const { result } = renderHook(() => useBloodfeudMarks());
    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({
      direction: 'hunted',
      killerName: 'My Killer',
      opposingStableName: 'Doom Stable',
      weeksLeft: 2,
    });
  });

  it('filters expired marks and feuds between other stables', () => {
    mockState = base({
      bloodfeudMarks: [
        // Expired this week.
        {
          killerWarriorId: 'w-rival-killer',
          killerStableId: 'r-stable',
          owedStableId: 'p-stable',
          expiresWeek: 10,
        },
        // Rival-vs-rival feud — not the player's business.
        {
          killerWarriorId: 'w-rival-killer',
          killerStableId: 'r-stable',
          owedStableId: 'r2-stable',
          expiresWeek: 13,
        },
      ],
    });
    const { result } = renderHook(() => useBloodfeudMarks());
    expect(result.current).toEqual([]);
  });
});
