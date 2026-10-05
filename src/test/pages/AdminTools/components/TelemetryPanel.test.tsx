// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TelemetryPanel } from '@/pages/AdminTools/components/TelemetryPanel';
import '@/test/_setup/setup';

/**
 * V2-13 / V2-14 — dead engine instrumentation wired into the admin data
 * report. `getEngineEpoch`, `engineQueueDepth` (runtime session) and
 * `getPendingArchiveRetries` (opfs archiver) must surface as real rows in the
 * TelemetryPanel report — the values are read from the engine modules, not
 * passed as props.
 */
vi.mock('@/engine/runtime/session', () => ({
  getEngineEpoch: () => 3,
  engineQueueDepth: () => 1,
}));
vi.mock('@/engine/pipeline/adapters/opfsArchiver', () => ({
  getPendingArchiveRetries: () => [{ id: 'log_1' }, { id: 'log_2' }],
}));

describe('TelemetryPanel — engine telemetry rows (V2-13/V2-14)', () => {
  const props = {
    week: 5,
    season: 'Spring',
    treasury: 1200,
    fame: 40,
    rosterSize: 4,
    player: {},
  };

  it('reports the engine session epoch and queue depth', () => {
    const { container } = render(<TelemetryPanel {...props} />);
    const report = container.querySelector('pre')!.textContent ?? '';
    expect(report).toContain('"epoch"');
    expect(report).toContain('"queueDepth"');
    expect(report).toContain('"epoch": 3');
    expect(report).toContain('"queueDepth": 1');
  });

  it('reports pending archive retries', () => {
    const { container } = render(<TelemetryPanel {...props} />);
    const report = container.querySelector('pre')!.textContent ?? '';
    expect(report).toContain('"archiveRetriesPending"');
    expect(report).toContain('"archiveRetriesPending": 2');
  });
});
