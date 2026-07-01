import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/engine/workerProxy', () => ({
  engineProxy: {
    advanceWeek: vi.fn().mockResolvedValue({ week: 2, phase: 'planning' }),
    advanceDay: vi.fn().mockResolvedValue({ week: 1, day: 1, phase: 'planning' }),
    skipToWeekEnd: vi.fn().mockResolvedValue({ week: 2, phase: 'planning' }),
    runAutosim: vi.fn(),
  },
}));

vi.mock('@/engine/storage/opfsArchive', () => ({
  opfsArchive: {
    archiveHotState: vi.fn().mockResolvedValue(undefined),
  },
}));

import '@/test/_setup/setup';
import { useGameStore } from '@/state/createStore';
import { clearReconstructionCache, reconstructGameState } from '@/state/serialization';
import { StyleRollups } from '@/engine/stats/styleRollups';
import { engineProxy } from '@/engine/workerProxy';
import type { GameState } from '@/types/state.types';

function makeMinimalState(overrides: Partial<GameState> = {}): GameState {
  return {
    meta: { gameName: 'Test', version: 'test', createdAt: '2024-01-01' },
    treasury: 1000,
    ledger: [],
    roster: [],
    graveyard: [],
    retired: [],
    recruitPool: [],
    insightTokens: [],
    arenaHistory: [],
    player: { id: 'p1', name: 'Test', stableName: 'Test', crest: {} as any, generation: 0 },
    week: 1,
    day: 0,
    season: 'Spring',
    weather: 'Clear',
    promoters: {},
    boutOffers: {},
    rivals: [],
    gazettes: [],
    scoutReports: [],
    unacknowledgedDeaths: [],
    rosterBonus: 0,
    tournaments: [],
    isTournamentWeek: false,
    activeTournamentId: null,
    year: 1,
    popularity: 0,
    fame: 0,
    realmRankings: {},
    awards: [],
    trainers: [],
    hiringPool: [],
    trainingAssignments: [],
    seasonalGrowth: [],
    restStates: [],
    crowdMood: 'Neutral',
    moodHistory: [],
    newsletter: [],
    hallOfFame: [],
    isFTUE: false,
    ftueStep: 0,
    ftueComplete: false,
    coachDismissed: [],
    rivalries: [],
    matchHistory: [],
    ownerGrudges: [],
    phase: 'planning',
    playerChallenges: [],
    playerAvoids: [],
    bookmarks: [],
    deferredBoutLogs: [],
    ...overrides,
  } as unknown as GameState;
}

describe('store guards — behavioral tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.getState().setSimulating(false);
    useGameStore.setState((s) => {
      s.atTitleScreen = true;
      s.activeSlotId = null;
      s.week = 1;
      s.treasury = 1000;
    });
    clearReconstructionCache();
    StyleRollups._clearCaches();
  });

  // #3 — doAdvanceWeek/doAdvanceDay must guard isSimulating
  describe('#3 doAdvanceWeek isSimulating guard', () => {
    it('returns early without calling engineProxy when isSimulating is true', async () => {
      useGameStore.getState().setSimulating(true);
      const weekBefore = useGameStore.getState().week;
      await useGameStore.getState().doAdvanceWeek();
      expect(engineProxy.advanceWeek).not.toHaveBeenCalled();
      expect(useGameStore.getState().week).toBe(weekBefore);
    });

    it('returns early without calling engineProxy when isSimulating is true (doAdvanceDay)', async () => {
      useGameStore.getState().setSimulating(true);
      await useGameStore.getState().doAdvanceDay();
      expect(engineProxy.advanceDay).not.toHaveBeenCalled();
    });
  });

  // #7 — returnToTitle must await saveCurrentState before clearing
  describe('#7 returnToTitle awaits saveCurrentState', () => {
    it('sets atTitleScreen=true and clears activeSlotId after save completes', async () => {
      useGameStore.setState((s) => {
        s.activeSlotId = 'test-slot';
        s.atTitleScreen = false;
      });
      await useGameStore.getState().returnToTitle();
      expect(useGameStore.getState().atTitleScreen).toBe(true);
      expect(useGameStore.getState().activeSlotId).toBe(null);
    });
  });

  // #8a + #8b — loadGame and doReset invalidate the reconstruction cache
  describe('#8a/#8b reconstruction cache invalidation', () => {
    it('loadGame invalidates the reconstruction cache so stale data is not returned', () => {
      const storeState = useGameStore.getState();
      reconstructGameState(storeState);
      const state = makeMinimalState({ week: 5, treasury: 2000 });
      useGameStore.getState().loadGame('test-slot', state);
      const result = reconstructGameState(useGameStore.getState());
      expect(result.week).toBe(5);
      expect(result.treasury).toBe(2000);
    });

    it('doReset invalidates the reconstruction cache', () => {
      const storeState = useGameStore.getState();
      reconstructGameState(storeState);
      useGameStore.getState().doReset();
      const result = reconstructGameState(useGameStore.getState());
      expect(result.week).toBe(1);
    });
  });

  // #9 — doAdvanceWeek clears timeout timer after race settles
  describe('#9 doAdvanceWeek timeout cleanup', () => {
    it('does not leave dangling timers after successful advancement', async () => {
      vi.useFakeTimers();
      const state = makeMinimalState({ week: 1 });
      useGameStore.getState().loadGame('test-slot', state);
      const promise = useGameStore.getState().doAdvanceWeek();
      await vi.runAllTimersAsync();
      await promise;
      vi.useRealTimers();
      expect(useGameStore.getState().isSimulating).toBe(false);
    });
  });

  // #11a + #11b — loadGame and doReset clear StyleRollups caches
  describe('#11a/#11b StyleRollups cache invalidation', () => {
    it('loadGame clears StyleRollups weekCache so stale data is not returned', () => {
      localStorage.clear();
      StyleRollups._clearCaches();
      StyleRollups.addFight({
        week: 99,
        styleA: 'Gladiator',
        styleD: 'Retiarius',
        winner: 'A',
        by: 'Kill',
      });
      const week99 = StyleRollups.getWeekRollup(99);
      expect(week99['Gladiator']).toBeDefined();
      // loadGame clears caches; also clear localStorage so data is truly gone
      localStorage.clear();
      const state = makeMinimalState({ week: 5 });
      useGameStore.getState().loadGame('test-slot', state);
      const week99After = StyleRollups.getWeekRollup(99);
      expect(week99After['Gladiator']).toBeUndefined();
    });

    it('doReset clears StyleRollups caches', () => {
      localStorage.clear();
      StyleRollups._clearCaches();
      StyleRollups.addFight({
        week: 99,
        styleA: 'Gladiator',
        styleD: 'Retiarius',
        winner: 'A',
        by: 'Kill',
      });
      const week99 = StyleRollups.getWeekRollup(99);
      expect(week99['Gladiator']).toBeDefined();
      localStorage.clear();
      useGameStore.getState().doReset();
      const week99After = StyleRollups.getWeekRollup(99);
      expect(week99After['Gladiator']).toBeUndefined();
    });
  });

  // #13 — doAdvanceDay must have a worker timeout (Promise.race)
  describe('#13 doAdvanceDay worker timeout', () => {
    it('resets isSimulating when worker stalls beyond 15s timeout', async () => {
      vi.useFakeTimers();
      vi.mocked(engineProxy.advanceDay).mockImplementation(
        () => new Promise(() => {})
      );
      const state = makeMinimalState({ week: 1 });
      useGameStore.getState().loadGame('test-slot', state);
      const promise = useGameStore.getState().doAdvanceDay();
      vi.advanceTimersByTime(16000);
      await promise;
      // The timeout fires and isSimulating is reset even on failure
      expect(useGameStore.getState().isSimulating).toBe(false);
      vi.useRealTimers();
      vi.mocked(engineProxy.advanceDay).mockResolvedValue({ week: 1, day: 1, phase: 'planning' } as any);
    });
  });
});
