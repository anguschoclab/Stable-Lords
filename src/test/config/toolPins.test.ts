// @vitest-environment node
/**
 * toolPins — `bun x`/`bunx` invocations in package.json scripts must target
 * installed dependencies. `bun x <pkg>` with no version fetches @latest into a
 * temp dir; an upstream release with a broken dep tree took the type-check
 * gate down (Cannot find module 'picomatch', V11 pass). Pinning the package in
 * devDependencies makes bunx resolve the local install deterministically.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PKG_PATH = path.resolve(__dirname, '../../../package.json');
const BUNX_RE = /\bbunx?\s+(?:--bun\s+)?(@[\w-]+\/[\w.-]+|[\w-]+)/g;
/** Tokens that are flags or bun builtins, not package names. */
const NON_PACKAGES = new Set(['x', 'install', 'run', 'test', '--version']);

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

  it('every bunx/bun x target is an installed dependency', () => {
    const violations: string[] = [];
    for (const [scriptName, cmd] of Object.entries(pkg.scripts)) {
      for (const m of cmd.matchAll(BUNX_RE)) {
        const target = m[1]!;
        if (NON_PACKAGES.has(target)) continue;
        // `bunx pkg@1.2.3` pins a version ad hoc — allowed but discouraged;
        // `bunx pkg` unpinned is legal ONLY when pkg is installed locally.
        const name = target.startsWith('@')
          ? target.split('@').slice(0, 2).join('@')
          : target.split('@')[0]!;
        if (!installed.has(name)) {
          violations.push(`"${scriptName}": bunx ${target} — '${name}' not in dependencies`);
        }
      }
    }
    expect(violations, 'floating bunx tool invocations').toEqual([]);
  });
});
