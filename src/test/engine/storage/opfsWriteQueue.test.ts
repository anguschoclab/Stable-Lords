import { describe, it, expect, beforeEach } from 'vitest';
import '@/test/_setup/setup';
import { OPFSArchiveService } from '@/engine/storage/opfsArchive';
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

describe('#1/#4 OPFS archiveHotState write queue', () => {
  let service: OPFSArchiveService;

  beforeEach(() => {
    service = new OPFSArchiveService();
  });

  it('serializes concurrent archiveHotState calls via enqueue', async () => {
    const order: string[] = [];
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

    const firstEnd = order.indexOf('end');
    const secondStart = order.indexOf('start', firstEnd + 1);
    expect(secondStart).toBeGreaterThan(firstEnd);
  });
});
