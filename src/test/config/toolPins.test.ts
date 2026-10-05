// @vitest-environment node
/**
 * toolPins — `bun x`/`bunx` invocations in package.json scripts must resolve
 * locally: the target must be an installed dependency, a node_modules/.bin
 * binary, or an explicitly versioned fetch (pkg@1.2.3). A bare `bun x <pkg>`
 * fetches @latest into a temp dir — an upstream release with a broken dep
 * tree took the type-check gate down (Cannot find module 'picomatch', V11).
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const REPO = path.resolve(__dirname, '../../..');
const PKG_PATH = path.join(REPO, 'package.json');
const BIN_DIR = path.join(REPO, 'node_modules', '.bin');
const BUNX_RE = /\b(?:bunx|bun\s+x)\s+(?:--bun\s+)?(@[\w-]+\/[\w.-]+|[\w.@-]+)/g;

/** Strip an optional @version suffix, preserving the @scope prefix. */
function packageName(target: string): string {
  if (target.startsWith('@')) {
    const at = target.indexOf('@', 1);
    return at === -1 ? target : target.slice(0, at);
  }
  return target.split('@')[0]!;
}

function hasExplicitVersion(target: string): boolean {
  return target.startsWith('@') ? target.indexOf('@', 1) !== -1 : target.includes('@');
}

describe('package.json bunx/bun-x tool pins', () => {
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8')) as {
    scripts: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const installed = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]);
  const localBins = new Set(fs.existsSync(BIN_DIR) ? fs.readdirSync(BIN_DIR) : []);

  it('every bunx/bun x target resolves locally or is version-pinned', () => {
    const violations: string[] = [];
    for (const [scriptName, cmd] of Object.entries(pkg.scripts)) {
      for (const m of cmd.matchAll(BUNX_RE)) {
        const target = m[1]!;
        if (installed.has(packageName(target))) continue;
        if (localBins.has(target)) continue;
        if (hasExplicitVersion(target)) continue;
        violations.push(`"${scriptName}": bunx ${target} — floats to @latest`);
      }
    }
    expect(violations, 'floating bunx tool invocations').toEqual([]);
  });
});
