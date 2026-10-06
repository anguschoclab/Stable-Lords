import { describe, it, expect, vi, afterEach } from 'vitest';
import { impactsAffectWeekCaches } from '@/engine/pipeline/services/weekPipeline/caches';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeWarrior } from '@/test/_fixtures/factories';
import {
  setTelemetryProvider,
  resetTelemetryProvider,
  TelemetryEvents,
  type TelemetryProvider,
} from '@/engine/core/telemetry';
import type { StateImpact } from '@/engine/impacts/types';
import type { WarriorId } from '@/types/shared.types';

describe('impactsAffectWeekCaches', () => {
  it('returns false for empty / non-cache impacts', () => {
    expect(impactsAffectWeekCaches([])).toBe(false);
    expect(impactsAffectWeekCaches([{}])).toBe(false);
    expect(
      impactsAffectWeekCaches([
        { treasuryDelta: -50, newsletterItems: [], week: 2, gazettes: [] },
      ] as StateImpact[])
    ).toBe(false);
  });

  it('returns true for roster- or rival-touching impacts', () => {
    expect(
      impactsAffectWeekCaches([{ rosterUpdates: new Map() }] as StateImpact[])
    ).toBe(true);
    expect(
      impactsAffectWeekCaches([{ treasuryDelta: 1 }, { rivalries: [] }] as StateImpact[])
    ).toBe(true);
    expect(
      impactsAffectWeekCaches([{ rivalWarriorPatches: new Map() }] as StateImpact[])
    ).toBe(true);
  });
});

describe('cache rebuild elision', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetTelemetryProvider();
  });

  it('an elided rebuild still leaves warriorMap pointing at live objects', async () => {
    // State with a healthy roster: rebuilds happen only at boundaries whose
    // impacts touched cached keys — fewer than the unconditional 5
    // (initial + bout + core + world + content) the pipeline used to pay.
    let rebuilds = 0;
    const provider: TelemetryProvider = {
      timing: () => {},
      gauge: () => {},
      increment: (name) => {
        if (name === TelemetryEvents.WEEK_CACHE_REBUILDS) rebuilds++;
      },
    };
    setTelemetryProvider(provider);

    const state = createFreshState('cache-elision');
    const w = makeWarrior({ id: 'w-live' as WarriorId, status: 'Active' });
    state.roster = [w];

    const next = await advanceWeek(state, { headless: true });

    expect(rebuilds).toBeGreaterThanOrEqual(1);
    expect(rebuilds).toBeLessThan(5);

    // The surviving map must resolve the live roster identity, not a stale one.
    const rosterWarrior = next.roster.find((x) => x.id === 'w-live');
    expect(next.warriorMap?.get('w-live' as WarriorId)).toBe(rosterWarrior);
  });
});
