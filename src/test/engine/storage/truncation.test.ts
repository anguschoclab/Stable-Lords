import { describe, it, expect } from 'vitest';
import { truncateState } from '@/engine/storage/truncation';
import { type GameState, type FightSummary } from '@/types/game';

describe('truncateState', () => {
  const createMockState = (overrides?: Partial<GameState>): GameState => {
    return {
      ...overrides,
    } as GameState;
  };

  it('handles empty state and undefined arrays gracefully', () => {
    const state = createMockState();
    const truncated = truncateState(state);

    expect(truncated.arenaHistory).toEqual([]);
    expect(truncated.newsletter).toEqual([]);
    expect(truncated.ledger).toEqual([]);
    expect(truncated.matchHistory).toEqual([]);
    expect(truncated.moodHistory).toEqual([]);
  });

  it('truncates arrays to their respective limits', () => {
    const makeArray = (size: number) => Array.from({ length: size }, (_, i) => ({ id: i }));

    const state = createMockState({
      arenaHistory: makeArray(505) as any,
      newsletter: makeArray(105) as any,
      ledger: makeArray(505) as any,
      matchHistory: makeArray(505) as any,
      moodHistory: makeArray(55) as any,
      graveyard: makeArray(205) as any,
      retired: makeArray(205) as any,
      // Entries carry `completed` — unfinished tournaments are exempt from the
      // cap (an evicted in-flight bracket could never resolve).
      tournaments: makeArray(105).map((t) => ({ ...t, completed: true })) as any,
      scoutReports: makeArray(105) as any,
      hallOfFame: makeArray(105) as any,
      rivalries: makeArray(105) as any,
      ownerGrudges: makeArray(105) as any,
      seasonalGrowth: makeArray(505) as any,
      insightTokens: makeArray(505) as any,
      playerChallenges: makeArray(105) as any,
      playerAvoids: makeArray(105) as any,
      trainingAssignments: makeArray(205) as any,
      gazettes: makeArray(55) as any,
      coachDismissed: makeArray(105) as any,
      restStates: makeArray(505) as any,
      hiringPool: makeArray(25) as any,
      recruitPool: makeArray(310) as any,
      trainers: makeArray(55) as any,
      rivals: makeArray(55) as any,
    });

    const truncated = truncateState(state);

    expect(truncated.arenaHistory.length).toBe(500);
    expect(truncated.newsletter.length).toBe(100);
    expect(truncated.ledger.length).toBe(500);
    expect(truncated.matchHistory.length).toBe(500);
    expect(truncated.moodHistory.length).toBe(50);
    expect(truncated.graveyard.length).toBe(200);
    expect(truncated.retired.length).toBe(200);
    expect(truncated.tournaments.length).toBe(100);
    expect(truncated.scoutReports.length).toBe(100);
    expect(truncated.hallOfFame.length).toBe(100);
    expect(truncated.rivalries.length).toBe(100);
    expect(truncated.ownerGrudges.length).toBe(100);
    expect(truncated.seasonalGrowth.length).toBe(500);
    expect(truncated.insightTokens.length).toBe(500);
    expect(truncated.playerChallenges.length).toBe(100);
    expect(truncated.playerAvoids.length).toBe(100);
    expect(truncated.trainingAssignments.length).toBe(200);
    expect(truncated.gazettes.length).toBe(50);
    expect(truncated.coachDismissed.length).toBe(100);
    expect(truncated.restStates.length).toBe(500);
    expect(truncated.hiringPool.length).toBe(20);
    // Megaplan: the recruit pool cap scales with world population
    // (WORLD_RIVAL_HARD_CAP × RECRUIT_POOL_PER_STABLE × 3 = 300).
    expect(truncated.recruitPool.length).toBe(300);
    expect(truncated.trainers.length).toBe(50);
    // Megaplan: live rival stables are no longer truncated — the world must
    // hold its population floor; only per-rival internals are capped.
    expect(truncated.rivals.length).toBe(55);
  });

  it('removes transcripts from arenaHistory for flights older than the last 20', () => {
    // We create 30 fights.
    // Fights index 0-9 are older (will lose transcript).
    // Fights index 10-29 are the most recent 20 (will keep transcript).
    const arenaHistory = Array.from({ length: 30 }, (_, i) => ({
      id: `fight-${i}`,
      transcript: [`line 1 of fight ${i}`, `line 2 of fight ${i}`],
    })) as any as FightSummary[];

    const state = createMockState({ arenaHistory });
    const truncated = truncateState(state);

    expect(truncated.arenaHistory.length).toBe(30);

    // Check first 10 (older fights)
    for (let i = 0; i < 10; i++) {
      expect(truncated.arenaHistory[i]!.transcript).toBeUndefined();
      expect(truncated.arenaHistory[i]!.id).toBe(`fight-${i}`);
    }

    // Check last 20 (recent fights)
    for (let i = 10; i < 30; i++) {
      expect(truncated.arenaHistory[i]!.transcript).toBeDefined();
      expect(truncated.arenaHistory[i]!.transcript?.length).toBe(2);
      expect(truncated.arenaHistory[i]!.id).toBe(`fight-${i}`);
    }
  });

  it('slices keeping the most recent items (tail of the array)', () => {
    const makeArray = (size: number) => Array.from({ length: size }, (_, i) => ({ id: i }));
    // 105 items, ids 0 to 104
    const state = createMockState({ newsletter: makeArray(105) as any });
    const truncated = truncateState(state);

    expect(truncated.newsletter.length).toBe(100);
    // It should keep the *last* 100 items, so ids 5 to 104
    expect(truncated.newsletter[0]).toMatchObject({ id: 5 });
    expect(truncated.newsletter[99]).toMatchObject({ id: 104 });
  });

  it('never evicts an unfinished tournament — the cap applies to the completed tail', () => {
    // In-flight bracket pinned at the head of a >cap history: a plain
    // slice(-100) would drop it and the bracket could never resolve.
    const pending = [
      { id: 't-old-in-flight', completed: false },
      { id: 't-new-in-flight', completed: false },
    ];
    const completed = Array.from({ length: 105 }, (_, i) => ({
      id: `t-done-${i}`,
      completed: true,
    }));
    const state = createMockState({
      tournaments: [pending[0], ...completed, pending[1]] as any,
    });

    const truncated = truncateState(state);

    const keptIds = truncated.tournaments!.map((t) => t.id);
    expect(keptIds).toContain('t-old-in-flight');
    expect(keptIds).toContain('t-new-in-flight');
    expect(truncated.tournaments!.filter((t) => t.completed)).toHaveLength(100);
    // Order preserved — pending entries keep their positions, not re-sorted.
    expect(keptIds[0]).toBe('t-old-in-flight');
    expect(keptIds[keptIds.length - 1]).toBe('t-new-in-flight');
  });
});
