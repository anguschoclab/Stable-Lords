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
const SRC_DIR = path.resolve(__dirname, '../..');
const ROUTES_DIR = path.join(SRC_DIR, 'routes');
const PAGES_DIR = path.join(SRC_DIR, 'pages');

const EXEMPT = new Set([
  'StartGame.tsx', // FTUE — outside AppShell by spec
  'Orphanage.tsx', // FTUE — outside AppShell by spec
  'NotFound.tsx', // chrome-free error surface
]);

/** All files under a dir (recursive). */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

/**
 * The pages this spec actually governs: modules imported as route components
 * from `src/routes/**`. Helper files inside page dirs (sections.tsx, tabs.tsx,
 * hooks) are components consumed by the entry — never routed — and out of scope.
 */
function routedPageFiles(): string[] {
  const out = new Set<string>();
  for (const f of walk(ROUTES_DIR).filter((p) => p.endsWith('.tsx'))) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/from ['"]@\/(pages|lore)\/([^'"]+)['"]/g)) {
      if (!m[1] || !m[2]) continue;
      const rel = path.join(SRC_DIR, m[1], m[2]);
      for (const cand of [`${rel}.tsx`, `${rel}.ts`, path.join(rel, 'index.tsx')]) {
        try {
          readFileSync(cand);
          out.add(cand);
          break;
        } catch {
          /* next candidate */
        }
      }
    }
  }
  return [...out];
}

describe('page primitives conformance (MEGAPLAN-L2)', () => {
  const files = routedPageFiles();

  it('every non-exempt page uses PageFrame', () => {
    const missing = files
      .filter((f) => !EXEMPT.has(path.basename(f)))
      .filter((f) => {
        const src = readFileSync(f, 'utf8');
        return (
          !src.includes('data-bible-exempt') &&
          !/from ['"]@\/components\/ui\/PageFrame['"]/.test(src)
        );
      })
      .map((f) => path.relative(PAGES_DIR, f));
    expect(missing, 'pages missing PageFrame — conform or mark data-bible-exempt').toEqual([]);
  });

  it('every non-exempt page renders PageHeader (or documented exemption)', () => {
    const missing = files
      .filter((f) => !EXEMPT.has(path.basename(f)))
      .filter((f) => {
        const src = readFileSync(f, 'utf8');
        return (
          !src.includes('data-bible-exempt') &&
          !/from ['"]@\/components\/ui\/PageHeader['"]/.test(src)
        );
      })
      .map((f) => path.relative(PAGES_DIR, f));
    expect(missing).toEqual([]);
  });
});
