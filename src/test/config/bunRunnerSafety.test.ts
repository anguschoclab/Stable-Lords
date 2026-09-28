import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const root = process.cwd();

// N-A: `bun test` cannot execute specs that import Vite-only APIs
// (import.meta.glob with ?raw/eager) or shell out to `bun run` subcommands
// that resolve deps mid-test. These specs must be excluded from the bun
// runner and no test may shell `bun run type-check`.
describe('bun-runner safety contract (N-A)', () => {
  it('bunfig [test] pathIgnorePatterns excludes vite-only specs', () => {
    const bunfig = fs.readFileSync(path.join(root, 'bunfig.toml'), 'utf-8');
    expect(bunfig).toContain('bibleIndex.test.ts');
    expect(bunfig).toContain('HelpA11y.test.tsx');
  });

  it('buildConfigIntegrity invokes tsc directly, not via `bun run type-check`', () => {
    const src = fs.readFileSync(
      path.join(root, 'src/test/config/buildConfigIntegrity.slow.test.ts'),
      'utf-8'
    );
    expect(src).toContain('typescript7/bin/tsc');
  });

  it('buildConfigIntegrity does not shell out to `bun run type-check`', () => {
    const src = fs.readFileSync(
      path.join(root, 'src/test/config/buildConfigIntegrity.slow.test.ts'),
      'utf-8'
    );
    expect(src).not.toContain("execSync('bun run type-check'");
  });

  // Verified empirically during the test-megaplan audit: a vi.mock factory that
  // dynamically imports a module (`() => import('…')`) deadlocks bun:test —
  // the whole file never completes. `vi.hoisted(async …)` is equally unsafe
  // (polyfill shim does not await). Shared mocks instead live in
  // src/test/_mocks/*, which _setup/sharedMocks.ts installs on the
  // `__SHARED_MOCKS` global — call sites use the bun-safe sync factory
  // `vi.mock(path, () => ({ ...__SHARED_MOCKS.x }))`.
  it('no test uses dynamic-import vi.mock factories (bun deadlock)', () => {
    const testDir = path.join(root, 'src');
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
          walk(p);
        } else if (/\.test\.(ts|tsx)$/.test(entry.name)) {
          // skip self — this file contains the pattern literals it scans for
          if (entry.name === 'bunRunnerSafety.test.ts') continue;
          const src = fs.readFileSync(p, 'utf-8');
          // `vi.mock(path, (async) (…) => (await) import('…'))` — the `[^)]*`
          // class can't be used here: the params' own parens would stop it.
          if (
            /vi\.mock\(\s*['"][^'"]+['"]\s*,\s*(?:async\s+)?\([^)]*\)\s*=>\s*(?:await\s+)?import\s*\(/s.test(
              src
            )
          ) {
            offenders.push(path.relative(root, p));
          }
          if (/vi\.hoisted\s*\(\s*async/.test(src)) {
            offenders.push(`${path.relative(root, p)} (vi.hoisted async)`);
          }
        }
      }
    };
    walk(testDir);
    expect(offenders, `bun-deadlocking mock patterns:\n${offenders.join('\n')}`).toEqual([]);
  });
});
