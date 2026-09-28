import type { WeekPassSpec } from '@/engine/pipeline/pipelineStages';
import { telemetry, TelemetryEvents } from '@/engine/core/telemetry';

/**
 * Dev-only per-pass profiler: when `globalThis.__SL_PIPELINE_PROF` is truthy,
 * every pass's wall-clock ms is recorded and exposed via
 * `getLastPipelineProfile()`. Zero-cost when off (a single flag check).
 */
export function isPipelineProfiling(): boolean {
  return Boolean((globalThis as Record<string, unknown>).__SL_PIPELINE_PROF);
}

/** One pass's wall-clock time within a profiled week. */
export interface PipelinePassTiming {
  id: string;
  stage: WeekPassSpec['stage'];
  ms: number;
}

let lastPipelineProfile: PipelinePassTiming[] | null = null;

/** Returns the most recent profiled week, or null when profiling is off. */
export function getLastPipelineProfile(): PipelinePassTiming[] | null {
  return lastPipelineProfile;
}

/** Starts collecting pass timings for the week now beginning. */
export function beginPipelineProfile(): void {
  lastPipelineProfile = [];
}

/** Records one pass's wall-clock time and emits the telemetry metric. */
export function recordPassTiming(id: string, stage: WeekPassSpec['stage'], ms: number): void {
  lastPipelineProfile?.push({ id, stage, ms });
  telemetry.timing(TelemetryEvents.PIPELINE_PASS_TIMING, ms, { pass: id });
}
