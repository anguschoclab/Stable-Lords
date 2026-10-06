import type { WeekPassSpec } from '@/engine/pipeline/pipelineStages';
import { telemetry, TelemetryEvents } from '@/engine/core/telemetry';

/**
 * Dev-only per-pass profiler: when `globalThis.__SL_PIPELINE_PROF` is truthy,
 * every pass's wall-clock ms is emitted as a `pipeline_pass_timing` telemetry
 * event — install a provider via `setTelemetryProvider` to consume them.
 * Zero-cost when off (a single flag check).
 */
export function isPipelineProfiling(): boolean {
  return Boolean((globalThis as Record<string, unknown>).__SL_PIPELINE_PROF);
}

/** Records one pass's wall-clock time and emits the telemetry metric. */
export function recordPassTiming(id: string, stage: WeekPassSpec['stage'], ms: number): void {
  telemetry.timing(TelemetryEvents.PIPELINE_PASS_TIMING, ms, { pass: id, stage });
}
