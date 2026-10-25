import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Skill-doc path guard — megaplan wiring ratchet.
 *
 * Runs scripts/skill-path-scan.mjs (zero-dep, ~seconds) and asserts every
 * repo path referenced in .claude/skills SKILL.md files still exists. Skill
 * docs name test files and scripts that rot silently as the suite
 * reorganizes; the ratchet keeps doc commands runnable.
 * Isolation: subprocess — the scanner has no module-registry side effects.
 */
const REPO = path.resolve(__dirname, '../../..');
const REPORT = path.join(REPO, 'scripts/out/skill-path-scan.json');

interface ScanReport {
  skills: { skill: string; refs: number; unresolved: string[] }[];
  missing: { skill: string; path: string }[];
}

function runScan(): ScanReport {
  // Non-zero exit means unresolved paths — expected on failure; the report
  // is written before exit, so read it for the readable diff either way.
  try {
    execFileSync('node', [path.join(REPO, 'scripts/skill-path-scan.mjs')], {
      cwd: REPO,
      stdio: 'pipe',
    });
  } catch {
    /* report still written */
  }
  return JSON.parse(readFileSync(REPORT, 'utf8'));
}

describe('megaplan: skill-doc path guard', () => {
  let report: ScanReport;
  beforeAll(() => {
    report = runScan();
  });

  it('all skill-doc path references resolve', () => {
    expect(report.missing).toEqual([]);
  });
});
