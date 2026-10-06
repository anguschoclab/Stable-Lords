import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  telemetry,
  TelemetryEvents,
  setTelemetryProvider,
  resetTelemetryProvider,
  isTelemetryEnabled,
  type TelemetryProvider,
} from '@/engine/core/telemetry';

function makeProvider(): TelemetryProvider & {
  timings: Array<{ name: string; ms: number; tags?: Record<string, string> }>;
  counters: Array<{ name: string; tags?: Record<string, string> }>;
  gauges: Array<{ name: string; value: number; tags?: Record<string, string> }>;
} {
  const calls = {
    timings: [] as Array<{ name: string; ms: number; tags?: Record<string, string> }>,
    counters: [] as Array<{ name: string; tags?: Record<string, string> }>,
    gauges: [] as Array<{ name: string; value: number; tags?: Record<string, string> }>,
  };
  return {
    ...calls,
    timing: (name, ms, tags) => void calls.timings.push({ name, ms, tags }),
    increment: (name, tags) => void calls.counters.push({ name, tags }),
    gauge: (name, value, tags) => void calls.gauges.push({ name, value, tags }),
  };
}

describe('telemetry provider', () => {
  afterEach(() => {
    resetTelemetryProvider();
    vi.restoreAllMocks();
  });

  it('is disabled by default and accepts calls on the noop provider', () => {
    resetTelemetryProvider();
    expect(isTelemetryEnabled()).toBe(false);
    // Must not throw with no provider installed.
    expect(() => {
      telemetry.timing(TelemetryEvents.ADVANCE_WEEK, 1);
      telemetry.increment(TelemetryEvents.ADVANCE_QUARTER_SUCCESS);
      telemetry.gauge(TelemetryEvents.ENGINE_JOB_QUEUE_DEPTH, 2);
    }).not.toThrow();
  });

  it('routes timing/increment/gauge to an installed provider', () => {
    const provider = makeProvider();
    setTelemetryProvider(provider);

    expect(isTelemetryEnabled()).toBe(true);

    telemetry.timing(TelemetryEvents.ADVANCE_WEEK, 12.5, { headless: 'true' });
    telemetry.increment(TelemetryEvents.STOP_CONDITION_TRIGGERED, { reason: 'roster_empty' });
    telemetry.gauge(TelemetryEvents.SERIALIZATION_PAYLOAD_BYTES, 4096);

    expect(provider.timings).toEqual([
      { name: TelemetryEvents.ADVANCE_WEEK, ms: 12.5, tags: { headless: 'true' } },
    ]);
    expect(provider.counters).toEqual([
      { name: TelemetryEvents.STOP_CONDITION_TRIGGERED, tags: { reason: 'roster_empty' } },
    ]);
    expect(provider.gauges).toEqual([
      { name: TelemetryEvents.SERIALIZATION_PAYLOAD_BYTES, value: 4096, tags: undefined },
    ]);
  });

  it('resetTelemetryProvider restores the noop provider', () => {
    const provider = makeProvider();
    setTelemetryProvider(provider);
    telemetry.increment(TelemetryEvents.ADVANCE_YEAR_SUCCESS);
    expect(provider.counters).toHaveLength(1);

    resetTelemetryProvider();
    expect(isTelemetryEnabled()).toBe(false);

    telemetry.increment(TelemetryEvents.ADVANCE_YEAR_SUCCESS);
    expect(provider.counters).toHaveLength(1);
  });

  it('replacing the provider switches the sink', () => {
    const first = makeProvider();
    const second = makeProvider();
    setTelemetryProvider(first);
    telemetry.increment(TelemetryEvents.ADVANCE_QUARTER_SUCCESS);
    setTelemetryProvider(second);
    telemetry.increment(TelemetryEvents.ADVANCE_YEAR_SUCCESS);

    expect(first.counters).toHaveLength(1);
    expect(second.counters).toHaveLength(1);
    expect(second.counters[0]?.name).toBe(TelemetryEvents.ADVANCE_YEAR_SUCCESS);
  });
});
