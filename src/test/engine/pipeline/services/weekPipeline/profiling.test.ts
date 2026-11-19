import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isPipelineProfiling, recordPassTiming } from '@/engine/pipeline/services/weekPipeline/profiling';
import { telemetry, TelemetryEvents } from '@/engine/core/telemetry';

describe('weekPipeline/profiling', () => {
  beforeEach(() => {
    vi.spyOn(telemetry, 'timing').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as any).__SL_PIPELINE_PROF;
  });

  describe('isPipelineProfiling', () => {
    it('returns false when globalThis.__SL_PIPELINE_PROF is undefined', () => {
      expect(isPipelineProfiling()).toBe(false);
    });

    it('returns true when globalThis.__SL_PIPELINE_PROF is truthy', () => {
      (globalThis as any).__SL_PIPELINE_PROF = true;
      expect(isPipelineProfiling()).toBe(true);
    });
  });

  describe('recordPassTiming', () => {
    it('emits telemetry timing event with correct arguments', () => {
      recordPassTiming('testPass', 'world', 42);
      expect(telemetry.timing).toHaveBeenCalledWith(TelemetryEvents.PIPELINE_PASS_TIMING, 42, {
        pass: 'testPass',
        stage: 'world',
      });
    });
  });
});
