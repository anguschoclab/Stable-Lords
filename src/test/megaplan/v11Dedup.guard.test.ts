import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * MEGAPLAN-V12 duplication-consolidation spec (test-first, skipped until
 * Phase 5):
 *
 * 1. A shared offseason-event helper exists so the chaosHandlers /
 *    socialHandlers / buffHandlers / injuryHandlers cluster stops carrying
 *    ~20–32 duplicated lines of `withChosenWarrior` scaffolding per pair.
 * 2. A shared standings/record-table primitive exists for the
 *    GazetteLeaderboards / TreasuryOverview / HallOfWarriors / ArenaHub /
 *    arenaDetail RecordTable JSX cluster.
 * 3. prod↔prod dup-scan cluster count ratchets below the V11 baseline (74).
 *    Runs the repo's own scanner in a subprocess (orphanScan.guard precedent).
 */

const REPO = path.resolve(__dirname, '../../..');
const REPORT = path.join(REPO, 'scripts/out/dup-scan.json');

// Post-consolidation ceiling. Baseline was 74 prod↔prod clusters at
// pre-megaplan-v11-r2; the Phase-5 pass must drive this below the ceiling.
const PROD_CLUSTER_CEILING = 50;

describe('megaplan V11: duplicate consolidation', () => {
describe.skip('MEGAPLAN-V12', () => {
  it('a shared offseason-event runner/helper exists', () => {
    const hits = [
      'src/engine/pipeline/offseasonEvents/runEvent.ts',
      'src/engine/pipeline/offseasonEvents/shared.ts',
      'src/engine/pipeline/offseasonEvents/helpers.ts',
    ].some((p) => {
      try {
        return readFileSync(path.join(REPO, p), 'utf8').length > 0;
      } catch {
        return false;
      }
    });
    expect(hits, 'no shared offseason-event helper module found').toBe(true);
  });

  it('a shared standings/record-table primitive exists under components/', () => {
    const candidates = [
      'src/components/ui/StandingsTable.tsx',
      'src/components/ui/standingsTable.tsx',
      'src/components/ledger/StandingsTable.tsx',
      'src/components/world/StandingsTable.tsx',
    ];
    const found = candidates.some((p) => {
      try {
        return readFileSync(path.join(REPO, p), 'utf8').length > 0;
      } catch {
        return false;
      }
    });
    expect(found, 'no shared standings-table primitive found').toBe(true);
  });

  it(`prod↔prod dup clusters ratchet to ≤ ${PROD_CLUSTER_CEILING}`, () => {
    execFileSync('node', [path.join(REPO, 'scripts/dup-scan.mjs')], {
      cwd: REPO,
      stdio: 'pipe',
    });
    const report = JSON.parse(readFileSync(REPORT, 'utf8')) as {
      clusters: { pair: [string, string] }[];
    };
    const prod = report.clusters.filter((c) =>
      c.pair.every((p) => !p.includes('/test/'))
    );
    expect(
      prod.length,
      `${prod.length} prod↔prod dup clusters remain (ceiling ${PROD_CLUSTER_CEILING}):\n` +
        prod.map((c) => `  ${c.pair.join(' ↔ ')}`).join('\n')
    ).toBeLessThanOrEqual(PROD_CLUSTER_CEILING);
  });
});
});
