/**
 * Terminology compliance tests.
 * Ensures no sci-fi/military jargon or underscored display text leaks into user-facing UI.
 * These tests grep the source .tsx files for banned patterns.
 */
import { execSync } from 'child_process';
import { describe, it, expect } from 'vitest';

const srcDir = 'src';

// Files/dirs exempt from display-text rules (debug tools, engine internals)
const EXEMPT = [
  'AdminTools/',
  'TelemetryDashboard',
  'ErrorBoundary',
  'debug/',
  '.test.',
  'routeTree.gen.ts',
];

function exemptFilter(lines: string): string {
  return lines
    .split('\n')
    .filter((line) => !EXEMPT.some((e) => line.includes(e)))
    .join('\n')
    .trim();
}

describe('Terminology compliance', () => {
  it('no underscored display text in JSX (>XXX_YYY< pattern)', () => {
    // Matches: >TEXT_WITH_UNDERSCORES but NOT code identifiers
    const result = execSync(
      `grep -rn ">[A-Z]\\{2,\\}_[A-Z]\\{2,\\}" ${srcDir} --include="*.tsx" | grep -v "import " | grep -v "^.*const " | grep -v "interface " | grep -v "type " | grep -v "className=" || true`,
      { encoding: 'utf-8' }
    );
    const filtered = exemptFilter(result);
    expect(filtered).toBe('');
  });

  it('no banned sci-fi terms in display strings', () => {
    const bannedTerms = [
      'Personnel Intel',
      'Tactical Telemetry',
      'Syncing Archive',
      'Registry Balance',
      'Temporal Cycle',
      'Decommission',
      'Corpse Retrieved',
      'Neural Simulation',
      'Intelligence Synchronized',
      'Protocol Pending',
      'Asset Alpha',
      'Asset Beta',
      'Institutional Profile',
      'Personnel Management',
      'Personnel Registry',
      'Personnel Database',
      'Personnel Budget',
      'Tactical Hire',
      'Command Staff',
      'Registry Administration',
      'Fiscal Year',
      'ARCHIVE SYNC',
      'PRESS LINE SYNCHRONIZED',
      'VICTOR_SYNC',
      'HIGH HOSTILITY SYNC',
      'SYNCHRONIZATION PENDING',
      'IMPERIAL REGISTRY',
      'Commission Unit',
      'COMMISSION STABLES',
      'Zero Assets Selected',
      'combat asset',
      'MISSION CONTROL',
      'BIOMETRICS',
      'Bio-Rhythm',
      'Materiel Affinity',
      'EXECUTE WEEK',
      'EXECUTE DAY',
      'All systems operational',
      'No breakthrough signals',
      'Dormant Phase',
      'imperial commission has been notified',
      'No assets have been decommissioned',
      'disengage if',
      'CLASSIFIED',
      'Hardware Authentication Required',
      'target matching',
    ];
    const results: string[] = [];
    for (const term of bannedTerms) {
      const out = execSync(
        `grep -rn "${term}" ${srcDir} --include="*.tsx" || true`,
        { encoding: 'utf-8' }
      ).trim();
      if (out) {
        const filtered = exemptFilter(out);
        if (filtered) results.push(filtered);
      }
    }
    expect(results.join('\n')).toBe('');
  });

  it('no double-slash separators in user-facing display text', () => {
    // Catches: "Tactical Telemetry // Historical Aggregates"
    const result = execSync(
      `grep -rn ' // ' ${srcDir} --include="*.tsx" | grep -v "import " | grep -v "^.*const " | grep -v "^.*//" | grep -v "http" | grep -v ".test." | grep -v "className=" || true`,
      { encoding: 'utf-8' }
    );
    const filtered = exemptFilter(result);
    // Filter to only subtitle/label/title props and JSX text content
    const displayLines = filtered
      .split('\n')
      .filter(
        (l) =>
          l.includes('subtitle') ||
          l.includes('label') ||
          l.includes('title') ||
          (l.includes('>') && l.includes('//'))
      )
      .join('\n')
      .trim();
    expect(displayLines).toBe('');
  });
});
