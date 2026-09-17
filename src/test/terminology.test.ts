/**
 * Terminology compliance tests.
 * Ensures no sci-fi/military jargon or underscored display text leaks into user-facing UI.
 * These tests scan the source .tsx files for banned patterns.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const srcDir = 'src';
const e2eDir = 'e2e';

// Files/dirs exempt from display-text rules (debug tools, engine internals)
const EXEMPT = [
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

function getE2eTsFiles(dir = e2eDir): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const normalized = normalizePath(fullPath);
    if (EXEMPT.some((e) => normalized.includes(e))) continue;
    if (statSync(fullPath).isDirectory()) {
      files.push(...getE2eTsFiles(fullPath));
    } else if (normalized.endsWith('.ts')) {
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

// A SCREAMING_SNAKE token: at least two uppercase groups separated by underscore.
const SCREAMING_SNAKE = /[A-Z]{2,}_[A-Z]{2,}/;

// Remove ${...} template interpolations so constant identifiers referenced
// inside ${...} (e.g. ${ATTRIBUTE_TRAINING.MAX_VALUE}) are not treated as
// literal display text. Sufficient for this codebase: interpolations are
// simple property accesses / ternaries without nested braces.
function stripInterpolations(s: string): string {
  return s.replace(/\$\{[^}]*\}/g, '');
}

// Display-rendering props whose string value is shown to users. Curated,
// conservative allowlist — excludes generic/risky names like `name`, `value`,
// `id`, `key`, `type`, `error`, `text`, `header`, `footer` that frequently
// hold data/identifiers rather than display copy. Extend as needed.
const DISPLAY_PROPS = [
  'label', 'title', 'placeholder', 'aria-label', 'description', 'alt',
  'subtitle', 'heading', 'caption', 'tooltip', 'message', 'helperText',
  'errorMessage',
];
// NOTE: the `g` flag is REQUIRED — without it, RegExp.exec() in a while
// loop never advances lastIndex, causing an infinite loop that hangs the
// test suite.
const DISPLAY_PROP_RE = new RegExp(
  `(?:^|\\s)(${DISPLAY_PROPS.join('|')})\\s*=\\s*\\{?\\s*(['"\`])([^'"\`]*)\\2`,
  'g',
);

// Narrower skip for the display-string checks: does NOT reuse isCodeLine
// (which would wrongly skip `const msg = "..."` display strings and
// multi-prop JSX lines starting with `const`).
function skipForDisplayScan(line: string): boolean {
  const t = line.trim();
  return t.startsWith('import ') || t.startsWith('//');
}

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

describe('Terminology compliance', () => {
  it('no underscored display text in JSX (>XXX_YYY< pattern)', () => {
    const pattern = />[A-Z]{2,}_[A-Z]{2,}</;
    const matches: string[] = [];
    for (const file of getTsxFiles()) {
      const lines = readLines(file);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line || isCodeLine(line)) continue;
        const m = line.match(pattern);
        if (m) matches.push(`${file}:${i + 1}: token=${m[0]} :: ${line.trim()}`);
      }
    }
    expect(matches.join('\n')).toBe('');
  });

  it('no SCREAMING_SNAKE in display-rendering props', () => {
    const matches: string[] = [];
    for (const file of getTsxFiles()) {
      const lines = readLines(file);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line || skipForDisplayScan(line)) continue;
        const stripped = stripInterpolations(line);
        let m: RegExpExecArray | null;
        DISPLAY_PROP_RE.lastIndex = 0;
        while ((m = DISPLAY_PROP_RE.exec(stripped)) !== null) {
          const prop = m[1];
          const value = m[3];
          if (SCREAMING_SNAKE.test(value)) {
            matches.push(`${file}:${i + 1}: ${prop}="${value}" :: ${line.trim()}`);
          }
        }
      }
    }
    expect(matches.join('\n')).toBe('');
  });

  it('no SCREAMING_SNAKE in prose-mixed string literals', () => {
    const stringLiteral = /(['"`])([^'"`]*)\1/g;
    const matches: string[] = [];
    for (const file of getTsxFiles()) {
      const lines = readLines(file);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line || skipForDisplayScan(line)) continue;
        const stripped = stripInterpolations(line);
        let m: RegExpExecArray | null;
        stringLiteral.lastIndex = 0;
        while ((m = stringLiteral.exec(stripped)) !== null) {
          const content = m[2];
          if (SCREAMING_SNAKE.test(content) && /[a-z]/.test(content)) {
            matches.push(`${file}:${i + 1}: "${content}" :: ${line.trim()}`);
          }
        }
      }
    }
    expect(matches.join('\n')).toBe('');
  });

  it('no banned sci-fi terms in display strings', () => {
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

  it('no banned sci-fi terms in e2e specs', () => {
    const matches: string[] = [];
    for (const file of getE2eTsFiles()) {
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
