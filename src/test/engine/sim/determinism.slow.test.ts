import { describe, it, expect, vi, afterEach } from 'vitest';
import { runSimulation } from '#scripts/simulation-harness';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import { createHash } from 'crypto';

vi.mock('@/engine/storage/opfsArchive', () => ({ ...__SHARED_MOCKS.opfsArchive }));

function resetIds() {
  let n = 0;
  setMockIdGenerator(() => `id_${++n}`);
}

function rivalsHash(state: { rivals: unknown }): string {
  return createHash('sha256').update(JSON.stringify(state.rivals)).digest('hex');
}

describe('harness determinism (I.2)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('two runs, one seed → identical SimPulse sequence and rivals hash', async () => {
    const FIXED_ISO = '2026-04-11T09:00:00.000Z';
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(FIXED_ISO);

    resetIds();
    engineEventBus.clear();
    const a = await runSimulation({ weeks: 8, seed: 777, logFrequency: 1, ignoreBankruptcy: true });

    resetIds();
    engineEventBus.clear();
    const b = await runSimulation({ weeks: 8, seed: 777, logFrequency: 1, ignoreBankruptcy: true });

    expect(JSON.stringify(a.pulses)).toBe(JSON.stringify(b.pulses));
    expect(rivalsHash(a.finalState)).toBe(rivalsHash(b.finalState));
  }, 240000);
});
