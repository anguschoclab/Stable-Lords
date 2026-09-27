import { describe, it, expect } from 'vitest';
import { selectArenaForMatchup } from '@/engine/matchmaking/arenaFit';
import { SeededRNGService } from '@/utils/random';
import { makeWarrior } from '@/test/_fixtures/factories';
import { ARENA_SELECTION } from '@/constants/arena';
import type { WarriorId } from '@/types/shared.types';

const withRecord = (id: string, byArena: Record<string, { wins: number; losses: number; kills: number }>) => {
  const w = makeWarrior({ id: id as WarriorId });
  w.career.byArena = byArena;
  return w;
};

const countPicks = (a: ReturnType<typeof withRecord>, b: ReturnType<typeof withRecord>, n = 300) => {
  const rng = new SeededRNGService(42);
  const counts: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    const pick = selectArenaForMatchup(a, b, rng);
    counts[pick] = (counts[pick] ?? 0) + 1;
  }
  return counts;
};

describe('record-book venue stickiness', () => {
  it('pulls most bookings to the favored warrior home venue', () => {
    const a = withRecord('a', {
      the_meat_grinder: { wins: 2, losses: 1, kills: 0 },
      iron_forge: { wins: 1, losses: 0, kills: 0 },
    });
    const b = makeWarrior({ id: 'b' as WarriorId });
    const counts = countPicks(a, b);
    expect(counts['the_meat_grinder'] ?? 0).toBeGreaterThan(200);
  });

  it('the non-favored warrior home venue also pulls bookings', () => {
    const a = makeWarrior({ id: 'a' as WarriorId });
    const b = withRecord('b', { underpit_arena: { wins: 3, losses: 0, kills: 0 } });
    const counts = countPicks(a, b);
    expect(counts['underpit_arena'] ?? 0).toBeGreaterThan(200);
  });

  it('deeper record wins the tie between two home venues', () => {
    const a = withRecord('a', { the_meat_grinder: { wins: 4, losses: 0, kills: 0 } });
    const b = withRecord('b', { underpit_arena: { wins: 1, losses: 1, kills: 0 } });
    const counts = countPicks(a, b);
    expect(counts['the_meat_grinder'] ?? 0).toBeGreaterThan(
      (counts['underpit_arena'] ?? 0) + 50
    );
  });

  it('never homes in on a championship-excluded venue', () => {
    const a = withRecord('a', { bloodsands_arena: { wins: 5, losses: 0, kills: 0 } });
    const b = makeWarrior({ id: 'b' as WarriorId });
    const counts = countPicks(a, b);
    for (const excluded of ARENA_SELECTION.EXCLUDED_ARENA_IDS) {
      expect(counts[excluded] ?? 0).toBe(0);
    }
  });

  it('warriors with no record draw from the open circuit', () => {
    const a = makeWarrior({ id: 'a' as WarriorId });
    const b = makeWarrior({ id: 'b' as WarriorId });
    const counts = countPicks(a, b, 200);
    expect(Object.keys(counts).length).toBeGreaterThan(5);
  });
});
