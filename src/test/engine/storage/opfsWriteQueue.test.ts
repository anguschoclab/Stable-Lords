import { describe, it, expect, beforeEach } from 'vitest';
import '@/test/_setup/setup';
import { OPFSArchiveService } from '@/engine/storage/opfsArchive';
import type { GameState } from '@/types/state.types';
import { makeGameState } from '@/test/_fixtures/factories';

function makeMinimalState(overrides: Partial<GameState> = {}): GameState {
  return makeGameState({
    meta: { gameName: 'Test', version: 'test', createdAt: '2024-01-01' },
    recruitPool: [],
    player: { id: 'p1', name: 'Test', stableName: 'Test', crest: {} as any, generation: 0 },
    rivals: [],
    activeTournamentId: null,
    crowdMood: 'Neutral',
    isFTUE: false,
    deferredBoutLogs: [],
    ...overrides,
  }) as any;
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
