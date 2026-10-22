import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';

/**
 * Wave-2 test-suite audit contracts (TEST_SUITE_AUDIT_PLAN.md §"Wave 2",
 * T8 inventory). Real-assertion REDs landed before their Phase-3/4/5
 * implementations — each `it` names the MEGAPLAN-A ticket it enforces.
 * These are source-structure contracts, not behavioral skips: they fail
 * until the named consolidation lands, then stay as permanent ratchets.
 */

const REPO = path.resolve(__dirname, '../../..');
const read = (p: string) => readFileSync(path.join(REPO, p), 'utf8');

function testFilesUnder(dir: string): string[] {
  const abs = path.join(REPO, dir);
  if (!existsSync(abs)) return [];
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.test\.tsx?$/.test(e.name)) out.push(p);
    }
  };
  walk(abs);
  return out;
}

describe('wave-2 test-suite audit contracts', () => {
  it('MEGAPLAN-A1: a single fs-walk helper — _setup/fsHelpers.ts has no importers or is deleted', () => {
    const helper = path.join(REPO, 'src/test/_setup/fsHelpers.ts');
    const importers: string[] = [];
    for (const f of testFilesUnder('src/test')) {
      if (f === helper || f === __filename) continue;
      if (/_setup\/fsHelpers|_setup['"]?\s*\/\s*['"]?fsHelpers/.test(readFileSync(f, 'utf8')))
        importers.push(path.relative(REPO, f));
    }
    expect(
      !existsSync(helper) || importers.length === 0,
      `fsHelpers still imported by:\n${importers.join('\n')}`
    ).toBe(true);
  });

  it('MEGAPLAN-A2: testQualityAudit uses the shared fs walker (no inline walk impl)', () => {
    const src = read('src/test/testQualityAudit.test.ts');
    expect(
      /function readDirRecursive|function\* walkTsFiles/.test(src),
      'testQualityAudit still defines its own recursive walker — import _helpers/fsWalk'
    ).toBe(false);
  });

  it('MEGAPLAN-A3: e2e/helpers.ts does not export clickNavLink (unused export — internal to navigateNavLink)', () => {
    const src = read('e2e/helpers.ts');
    expect(
      /export\s+(async\s+)?function\s+clickNavLink|export\s*\{[^}]*clickNavLink/.test(src),
      'clickNavLink is still exported — un-export it (navigateNavLink owns it internally)'
    ).toBe(false);
  });

  it('MEGAPLAN-A4: no test files under src/test/layout/ (subjects live in components/layout)', () => {
    const strays = testFilesUnder('src/test/layout').map((f) => path.relative(REPO, f));
    expect(strays, `files still under src/test/layout/:\n${strays.join('\n')}`).toEqual([]);
  });

  it('MEGAPLAN-A5: setup.node.ts installs the avatar-catalog fetch stub (both projects need it)', () => {
    // Measured-and-rejected optimization (wave-2): node-env specs exercise the
    // catalog too (avatarGenerator/avatarCatalog/avatarLifecycle/avatarSlice —
    // a dom-only stub broke 16 tests), and loadAvatarCatalog() caches after
    // first call so the per-test cost is a no-op. The stub must stay in the
    // shared node setup.
    const node = read('src/test/_setup/setup.node.ts');
    const dom = read('src/test/_setup/setup.dom.ts');
    expect(
      node.includes('loadAvatarCatalog'),
      'avatar fetch stub missing from setup.node.ts — node-env specs need it too'
    ).toBe(true);
    expect(
      dom.includes('loadAvatarCatalog'),
      'avatar catalog work does not belong in the DOM-only setup'
    ).toBe(false);
  });
});
