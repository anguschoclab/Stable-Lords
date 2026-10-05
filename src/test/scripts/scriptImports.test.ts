// @vitest-environment node
/**
 * scriptImports — every '@/…' specifier in scripts/*.ts must resolve to a
 * real file. A bare directory import only resolves when the directory has an
 * index.ts — `@/engine/autosim` pointed at a directory with no index and left
 * advisor-e2e.ts dead (found by knip, V11 pass).
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const REPO = path.resolve(__dirname, '../../..');
const SCRIPTS_DIR = path.join(REPO, 'scripts');
const SRC_DIR = path.join(REPO, 'src');

const SPECIFIER_RE = /from\s+['"](@\/[^'"]+)['"]/g;
const CANDIDATE_EXTS = ['.ts', '.tsx', '.js', '.mjs', '.json', '.d.ts'];

function aliasResolves(spec: string): boolean {
  const base = path.join(SRC_DIR, spec.slice(2));
  if (CANDIDATE_EXTS.some((ext) => fs.existsSync(base + ext))) return true;
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return true;
  if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
    return CANDIDATE_EXTS.some((ext) => fs.existsSync(path.join(base, 'index' + ext)));
  }
  return false;
}

describe('script @/ imports resolve to real files', () => {
  const scripts = fs
    .readdirSync(SCRIPTS_DIR)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => path.join(SCRIPTS_DIR, f));

  it('found scripts to audit', () => {
    expect(scripts.length).toBeGreaterThan(10);
  });

  it('every @/ specifier in scripts/*.ts resolves', () => {
    const violations: string[] = [];
    for (const file of scripts) {
      const content = fs.readFileSync(file, 'utf8');
      for (const m of content.matchAll(SPECIFIER_RE)) {
        const spec = m[1]!;
        if (!aliasResolves(spec)) {
          violations.push(`${path.basename(file)} → ${spec}`);
        }
      }
    }
    expect(violations, 'unresolvable @/ imports in scripts').toEqual([]);
  });
});
