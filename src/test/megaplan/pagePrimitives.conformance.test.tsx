// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

/**
 * MEGAPLAN-L2 spec (test-first, skipped until Phase 6):
 *
 * Every routed page renders inside the shared shell primitives:
 * PageFrame (<main>) wrapping content + PageHeader (<h1.font-display>).
 * Exemptions are explicit: FTUE flows (start/welcome/orphanage), and any
 * page module carrying a `data-bible-exempt` marker comment.
 *
 * This spec is structural (source-level) rather than render-per-page —
 * rendering all 30+ pages needs per-page store scaffolding that the
 * per-page pinning specs already provide; here we assert primitive usage.
 */
const PAGES_DIR = path.resolve(__dirname, '../../pages');
const LORE_DIR = path.resolve(__dirname, '../../lore');

const EXEMPT = new Set([
  'StartGame.tsx', // FTUE — outside AppShell by spec
  'Orphanage.tsx', // FTUE — outside AppShell by spec
  'NotFound.tsx', // chrome-free error surface
]);

function pageFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      const idx = path.join(p, 'index.tsx');
      try { readFileSync(idx); out.push(idx); } catch { /* subdir without index — descend */ out.push(...pageFiles(p)); }
    } else if (e.name.endsWith('.tsx') && !e.name.includes('.test.')) {
      out.push(p);
    }
  }
  return out;
}

describe.skip('page primitives conformance (MEGAPLAN-L2)', () => {
  const files = [...pageFiles(PAGES_DIR), ...pageFiles(LORE_DIR)];

  it('every non-exempt page uses PageFrame', () => {
    const missing = files
      .filter((f) => !EXEMPT.has(path.basename(f)))
      .filter((f) => {
        const src = readFileSync(f, 'utf8');
        return !src.includes('data-bible-exempt') && !/from ['"]@\/components\/ui\/PageFrame['"]/.test(src);
      })
      .map((f) => path.relative(PAGES_DIR, f));
    expect(missing, 'pages missing PageFrame — conform or mark data-bible-exempt').toEqual([]);
  });

  it('every non-exempt page renders PageHeader (or documented exemption)', () => {
    const missing = files
      .filter((f) => !EXEMPT.has(path.basename(f)))
      .filter((f) => {
        const src = readFileSync(f, 'utf8');
        return !src.includes('data-bible-exempt') && !/from ['"]@\/components\/ui\/PageHeader['"]/.test(src);
      })
      .map((f) => path.relative(PAGES_DIR, f));
    expect(missing).toEqual([]);
  });
});
