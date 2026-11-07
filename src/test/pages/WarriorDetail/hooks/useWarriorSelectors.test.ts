// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useArenaCrowns } from '@/pages/WarriorDetail/hooks/useWarriorSelectors';
import { makeArenaTitle } from '@/test/_fixtures/arenaTitle';
import { getArenaById } from '@/data/arenas';
import type { ArenaReignRecord, ArenaTitle } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';

const pastReign = (warriorId: string): ArenaReignRecord => ({
  warriorId: warriorId as WarriorId,
  warriorName: 'Test Warrior',
  startedAbsoluteWeek: 1,
  endedAbsoluteWeek: 4,
  endReason: 'defeated',
  defenses: 1,
});

describe('useArenaCrowns — arena ids resolve to display names', () => {
  it('returns empty lists for an empty warrior id', () => {
    const { result } = renderHook(() => useArenaCrowns('', {}));
    expect(result.current).toEqual({ current: [], past: [] });
  });

  it('resolves current crowns to arena names', () => {
    const arenaChampions: Record<string, ArenaTitle> = {
      bloodsands_arena: makeArenaTitle('w1'),
      standard_arena: makeArenaTitle('w2'),
    };
    const { result } = renderHook(() => useArenaCrowns('w1', arenaChampions));
    expect(result.current.current).toEqual([getArenaById('bloodsands_arena').name]);
    expect(result.current.past).toEqual([]);
  });

  it('falls back to the raw id for an unregistered arena', () => {
    const arenaChampions: Record<string, ArenaTitle> = {
      pit_of_kings: makeArenaTitle('w1'),
    };
    const { result } = renderHook(() => useArenaCrowns('w1', arenaChampions));
    expect(result.current.current).toEqual(['pit_of_kings']);
  });

  it('resolves past reigns to arena names', () => {
    const arenaChampions: Record<string, ArenaTitle> = {
      bloodsands_arena: makeArenaTitle(null, { history: [pastReign('w1')] }),
    };
    const { result } = renderHook(() => useArenaCrowns('w1', arenaChampions));
    expect(result.current.current).toEqual([]);
    expect(result.current.past).toEqual([getArenaById('bloodsands_arena').name]);
  });
});
