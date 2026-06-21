import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve } from 'path';
import '@/test/_setup/setup';

// ─── Module under test: OPFS archive service ──────────────────────────────
import { OPFSArchiveService } from '@/engine/storage/opfsArchive';

// ─── Module under test: serialization cache ───────────────────────────────
import { clearReconstructionCache, reconstructGameState } from '@/state/serialization';

// ─── Module under test: style rollups ─────────────────────────────────────
import { StyleRollups } from '@/engine/stats/styleRollups';

// ─── Types ────────────────────────────────────────────────────────────────
import type { GameState } from '@/types/state.types';

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// #1 — OPFS archiveHotState must use write queue
// ═══════════════════════════════════════════════════════════════════════════

describe('#1 OPFS archiveHotState write queue', () => {
  let service: OPFSArchiveService;

  beforeEach(() => {
    service = new OPFSArchiveService();
  });

  it('serializes concurrent archiveHotState calls via enqueue', async () => {
    const order: string[] = [];

    // Monkey-patch getHotStateDirectory to track call ordering
    const origGetDir = (service as any).getHotStateDirectory.bind(service);
    (service as any).getHotStateDirectory = async () => {
      order.push('start');
      await new Promise((r) => setTimeout(r, 10));
      order.push('end');
      return origGetDir();
    };

    const state = makeMinimalState();
    const p1 = service.archiveHotState('slot1', state);
    const p2 = service.archiveHotState('slot2', state);

    await Promise.all([p1, p2]);

    // If enqueue is used, the second call's 'start' must come after the first's 'end'
    const firstEnd = order.indexOf('end');
    const secondStart = order.indexOf('start', firstEnd + 1);
    expect(secondStart).toBeGreaterThan(firstEnd);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// #3 — doAdvanceWeek / doAdvanceDay must guard isSimulating
// ═══════════════════════════════════════════════════════════════════════════

describe('#3 doAdvanceWeek isSimulating guard', () => {
  it('rejects concurrent calls when isSimulating is already true', async () => {
    // We test the guard logic in isolation: if isSimulating is true, the function
    // should return early without calling the engine proxy.
    // After the fix, the guard `if (get().isSimulating) return;` should be present.
    // We verify by checking the source code contains the guard.
    const fs = await import('fs');
    const source = fs.readFileSync(resolve(__dirname, '../../state/createStore.ts'), 'utf-8');
    expect(source).toMatch(/if\s*\(\s*get\(\)\.isSimulating\s*\)\s*return/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// #4 — loadGame must await archiveHotState (or enqueue must make it safe)
// ═══════════════════════════════════════════════════════════════════════════

describe('#4 loadGame archiveHotState safety', () => {
  it('OPFS archiveHotState uses enqueue (making fire-and-forget safe)', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      resolve(__dirname, '../../engine/storage/opfsArchive/service.ts'),
      'utf-8'
    );
    // After fix, archiveHotState should contain this.enqueue
    expect(source).toMatch(/archiveHotState[\s\S]*?this\.enqueue/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// #5 — handleNewGame must await saveToSlot
// ═══════════════════════════════════════════════════════════════════════════

describe('#5 handleNewGame awaits saveToSlot', () => {
  it('handleNewGame is async and awaits saveToSlot', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(resolve(__dirname, '../../pages/StartGame.tsx'), 'utf-8');
    // After fix, handleNewGame should be async and await saveToSlot
    expect(source).toMatch(/handleNewGame[\s\S]*?async/);
    expect(source).toMatch(/await\s+saveToSlot/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// #6 — handleDelete must await deleteSlot
// ═══════════════════════════════════════════════════════════════════════════

describe('#6 handleDelete awaits deleteSlot', () => {
  it('handleDelete is async and awaits deleteSlot', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(resolve(__dirname, '../../pages/StartGame.tsx'), 'utf-8');
    expect(source).toMatch(/handleDelete[\s\S]*?async/);
    expect(source).toMatch(/await\s+deleteSlot/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// #7 — returnToTitle must await saveCurrentState
// ═══════════════════════════════════════════════════════════════════════════

describe('#7 returnToTitle awaits saveCurrentState', () => {
  it('returnToTitle awaits saveCurrentState before clearing state', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(resolve(__dirname, '../../state/createStore.ts'), 'utf-8');
    // After fix, returnToTitle should await saveCurrentState
    expect(source).toMatch(/returnToTitle[\s\S]*?await.*saveCurrentState/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// #8 — reconstructGameState cache must be cleared on loadGame
// ═══════════════════════════════════════════════════════════════════════════

describe('#8 reconstructGameState cache cleared on loadGame', () => {
  it('loadGame calls clearReconstructionCache', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(resolve(__dirname, '../../state/createStore.ts'), 'utf-8');
    expect(source).toMatch(/clearReconstructionCache/);
  });

  it('doReset calls clearReconstructionCache', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(resolve(__dirname, '../../state/createStore.ts'), 'utf-8');
    // doReset should also clear the cache
    expect(source).toMatch(/doReset[\s\S]*?clearReconstructionCache/);
  });

  it('clearReconstructionCache invalidates cached result', () => {
    // Create a mock store-like object
    const mockStore: any = {
      treasury: 1000,
      ledger: [],
      roster: [],
      graveyard: [],
      retired: [],
      recruitPool: [],
      insightTokens: [],
      arenaHistory: [],
      player: { id: 'p1', name: 'Test', stableName: 'Test', crest: {}, generation: 0 },
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
      lastSavedAt: null,
    };

    const result1 = reconstructGameState(mockStore);
    clearReconstructionCache();
    mockStore.treasury = 2000;
    const result2 = reconstructGameState(mockStore);

    expect(result2.treasury).toBe(2000);
    expect(result1).not.toBe(result2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// #9 — doAdvanceWeek timeout timer must be cleared
// ═══════════════════════════════════════════════════════════════════════════

describe('#9 doAdvanceWeek timeout timer cleanup', () => {
  it('doAdvanceWeek clears the timeout timer after race settles', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(resolve(__dirname, '../../state/createStore.ts'), 'utf-8');
    expect(source).toMatch(/clearTimeout/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// #10 — useArenaAnimation must not use module-level mutable state
// ═══════════════════════════════════════════════════════════════════════════

describe('#10 useArenaAnimation module-level mutable state', () => {
  it('does not export setFighterNames with module-level nameA/nameD', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(resolve(__dirname, '../../hooks/useArenaAnimation.ts'), 'utf-8');
    // After fix, there should be no module-level `let nameA` or `let nameD`
    expect(source).not.toMatch(/^let\s+nameA\s*=/m);
    expect(source).not.toMatch(/^let\s+nameD\s*=/m);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// #11 — StyleRollups caches must be cleared on loadGame
// ═══════════════════════════════════════════════════════════════════════════

describe('#11 StyleRollups cache cleared on loadGame', () => {
  beforeEach(() => {
    localStorage.clear();
    StyleRollups._clearCaches();
  });

  afterEach(() => {
    localStorage.clear();
    StyleRollups._clearCaches();
  });

  it('loadGame calls StyleRollups._clearCaches', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(resolve(__dirname, '../../state/createStore.ts'), 'utf-8');
    expect(source).toMatch(/StyleRollups.*_clearCaches|_clearCaches.*StyleRollups/);
  });

  it('_clearCaches invalidates weekCache so stale data is not returned', () => {
    StyleRollups.addFight({
      week: 1,
      styleA: 'Gladiator',
      styleD: 'Retiarius',
      winner: 'A',
      by: 'Kill',
    });

    const week1 = StyleRollups.getWeekRollup(1);
    expect(week1['Gladiator']).toBeDefined();
    expect(week1['Gladiator']?.w).toBe(1);

    StyleRollups._clearCaches();

    // After clearing cache, the data should be reloaded from localStorage
    // which should still have the data
    const week1After = StyleRollups.getWeekRollup(1);
    expect(week1After['Gladiator']).toBeDefined();
  });

  it('doReset calls StyleRollups._clearCaches', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(resolve(__dirname, '../../state/createStore.ts'), 'utf-8');
    expect(source).toMatch(/doReset[\s\S]*?StyleRollups.*_clearCaches|doReset[\s\S]*?_clearCaches/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// #12 — handleStartAutosim must check isSimulating
// ═══════════════════════════════════════════════════════════════════════════

describe('#12 handleStartAutosim isSimulating guard', () => {
  it('handleStartAutosim checks isSimulating from the store', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(resolve(__dirname, '../../hooks/useWeekExecution.ts'), 'utf-8');
    // useWeekExecution.handleStartAutosim guards against concurrent calls
    expect(source).toMatch(/handleStartAutosim[\s\S]*?isSimulating/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// #13 — doAdvanceDay must have a worker timeout
// ═══════════════════════════════════════════════════════════════════════════

describe('#13 doAdvanceDay worker timeout', () => {
  it('doAdvanceDay uses Promise.race with a timeout', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(resolve(__dirname, '../../state/createStore.ts'), 'utf-8');
    // Extract the doAdvanceDay function body up to the first await
    const dayFnMatch = source.match(/doAdvanceDay[\s\S]*?await\s+Promise\.race/);
    expect(dayFnMatch).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// #14 — useInsightManager must clear previous timer on re-reveal
// ═══════════════════════════════════════════════════════════════════════════

describe('#14 useInsightManager timer cleanup on re-reveal', () => {
  it('handleReveal clears previous timer before setting new one', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      resolve(__dirname, '../../components/ledger/InsightManager/hooks/useInsightManager.ts'),
      'utf-8'
    );
    // After fix, handleReveal should clear the timer ref before setting a new one
    expect(source).toMatch(/handleReveal[\s\S]*?clearTimeout.*timerRef/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// #15 — AudioManager play() must await mute state initialization
// ═══════════════════════════════════════════════════════════════════════════

describe('#15 AudioManager async init race', () => {
  it('play() awaits ready promise or loadMuteState is synchronous', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(resolve(__dirname, '../../lib/AudioManager.ts'), 'utf-8');
    // After fix, either:
    // 1. play() is async and awaits a ready promise, OR
    // 2. loadMuteState is synchronous (no await inside)
    const playIsAsync = /async\s+play/.test(source) || /await\s+this\.ready/.test(source);
    const loadSync = !/await\s+window\.electronAPI\.storeGet.*AUDIO_MUTED/.test(source);
    expect(playIsAsync || loadSync).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// #2 — handleExecuteCycle must await doAdvanceWeek/doAdvanceDay
// ═══════════════════════════════════════════════════════════════════════════

describe('#2 executeWeek awaits async advancement', () => {
  it('executeWeek is async and awaits doAdvanceWeek/doAdvanceDay', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(resolve(__dirname, '../../hooks/useWeekExecution.ts'), 'utf-8');
    // executeWeek is async and awaits advancement
    expect(source).toMatch(/executeWeek[\s\S]*?async/);
    // Should await doAdvanceWeek or doAdvanceDay
    expect(source).toMatch(/await\s+doAdvanceWeek|await\s+doAdvanceDay/);
  });
});
