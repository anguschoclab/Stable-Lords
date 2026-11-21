import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * jscpd ratchet — V30 clone-count ceiling.
 *
 * Runs the real `dupes` scan and asserts the total clone count never exceeds
 * the ratchet baseline. Distinct from dup-scan.guard's 8-line pair ratchet:
 * jscpd's 10-line/100-token surface catches the semantic boilerplate clusters
 * this campaign drains (scanner boilerplate, arg bags, parallel emitters).
 *
 * Baseline history:
 *   - pre-campaign (V30 Phase 0): 106 clones / 0.57% duplicated lines
 *   - post-campaign (V30 Phase 6): 96 clones / 0.50% — scanLib extraction +
 *     test-helper drains + dead-code removal netted −10 clones
 */
const REPO = path.resolve(__dirname, '../../..');
const REPORT = path.join(REPO, 'scripts/out/jscpd/jscpd-report.json');

const CLONE_COUNT_BASELINE = 96;

describe('jscpd ratchet (V30)', () => {
  it('total clone count stays at or below the ratchet baseline', () => {
    execFileSync('bun', ['run', 'dupes'], { cwd: REPO, stdio: 'pipe', timeout: 300_000 });
    const report = JSON.parse(readFileSync(REPORT, 'utf8')) as {
      statistics: { total: { clones: number } };
    };
    const clones = report.statistics.total.clones;
    expect(
      clones,
      `jscpd found ${clones} clones (> baseline ${CLONE_COUNT_BASELINE}) — dedupe or tighten the constant deliberately`
    ).toBeLessThanOrEqual(CLONE_COUNT_BASELINE);
  }, 300_000);
});
