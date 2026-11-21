/**
 * V31 canon-claims coverage ratchet — every row in the Terrablood claims
 * register must carry a legal verdict + a resolved status. Slow tier: the
 * scanner execs a subprocess.
 */
// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(__dirname, '../../..');
const REPORT = path.join(REPO, 'scripts/out/canon-claims-scan.json');
const SCANNER = path.join(REPO, 'scripts/canon-claims-scan.mjs');

let report: { totalClaims: number; violations: string[]; warnings: string[] };

beforeAll(() => {
  try {
    execFileSync('node', [SCANNER], { cwd: REPO, stdio: 'pipe' });
  } catch {
    // Non-zero exit is expected when violations exist — the report on disk
    // is the readable failure surface.
  }
  report = JSON.parse(readFileSync(REPORT, 'utf8'));
});

describe('canon claims register', () => {
  it('scanner emitted a report', () => {
    expect(existsSync(REPORT)).toBe(true);
    expect(report.totalClaims).toBeGreaterThan(0);
  });

  it('every claim row is resolved or adjudicated', () => {
    expect(report.violations, `unresolved canon claims:\n${report.violations.join('\n')}`).toEqual(
      []
    );
  });

  it('every claim row cites file:line evidence', () => {
    expect(report.warnings, `evidence-free canon claims:\n${report.warnings.join('\n')}`).toEqual(
      []
    );
  });
});
