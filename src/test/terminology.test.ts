/**
 * Terminology compliance tests.
 * Ensures no sci-fi/military jargon or underscored display text leaks into user-facing UI.
 * These tests scan the source .tsx files for banned patterns.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

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

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

function getTsxFiles(dir = srcDir): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const normalized = normalizePath(fullPath);
    if (EXEMPT.some((e) => normalized.includes(e))) continue;
    if (statSync(fullPath).isDirectory()) {
      files.push(...getTsxFiles(fullPath));
    } else if (normalized.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function readLines(file: string): string[] {
  return readFileSync(file, 'utf-8').split('\n');
}

function isCodeLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('import ') ||
    trimmed.startsWith('const ') ||
    trimmed.startsWith('interface ') ||
    trimmed.startsWith('type ') ||
    trimmed.startsWith('className=')
  );
}

describe('Terminology compliance', () => {
  it('no underscored display text in JSX (>XXX_YYY< pattern)', () => {
    const pattern = />[A-Z]{2,}_[A-Z]{2,}</;
    const matches: string[] = [];
    for (const file of getTsxFiles()) {
      const lines = readLines(file);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        if (isCodeLine(line)) continue;
        if (pattern.test(line)) {
          matches.push(`${file}:${i + 1}:${line.trim()}`);
        }
      }
    }
    expect(matches.join('\n')).toBe('');
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
    const matches: string[] = [];
    for (const file of getTsxFiles()) {
      const lines = readLines(file);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        for (const term of bannedTerms) {
          if (line.includes(term)) {
            matches.push(`${file}:${i + 1}:${line.trim()}`);
          }
        }
      }
    }
    expect(matches.join('\n')).toBe('');
  });

  it('no double-slash separators in user-facing display text', () => {
    // Only flag // inside string literals (display text), not code comments.
    function isInsideStringLiteral(line: string, index: number): boolean {
      const prefix = line.slice(0, index);
      const inSingle = (prefix.match(/'/g) || []).length % 2 === 1;
      const inDouble = (prefix.match(/"/g) || []).length % 2 === 1;
      return inSingle || inDouble;
    }

    const matches: string[] = [];
    for (const file of getTsxFiles()) {
      const lines = readLines(file);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const trimmed = line.trim();
        if (trimmed.startsWith('//')) continue;
        const idx = line.indexOf(' // ');
        if (idx === -1) continue;
        if (isCodeLine(line)) continue;
        if (line.includes('http')) continue;
        if (isInsideStringLiteral(line, idx)) {
          matches.push(`${file}:${i + 1}:${trimmed}`);
        }
      }
    }
    expect(matches.join('\n')).toBe('');
  });
});
