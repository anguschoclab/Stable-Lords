import { describe, it, expect, vi } from 'vitest';

// Importing daily_oracle must never kick off its 1000-week simulation under a
// test runner — scripts guard main() behind `if (!process.env.VITEST)`
// (daily_bard.ts convention, which bun-setup.ts relies on).
vi.mock('@/scripts/simulation-harness', () => ({
  runSimulation: vi.fn(),
}));

import { runSimulation } from '@/scripts/simulation-harness';

describe('daily_oracle entrypoint', () => {
  it('does not run the simulation when imported under a test runner', async () => {
    process.env.VITEST ??= 'true';

    await import('@/scripts/daily_oracle');

    expect(runSimulation).not.toHaveBeenCalled();
  });
});
