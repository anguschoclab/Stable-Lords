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
      path.join(root, 'src/test/buildConfigIntegrity.test.ts'),
      'utf-8'
    );
    expect(src).toContain('typescript7/bin/tsc');
  });

  it('buildConfigIntegrity does not shell out to `bun run type-check`', () => {
    const src = fs.readFileSync(
      path.join(root, 'src/test/buildConfigIntegrity.test.ts'),
      'utf-8'
    );
    expect(src).not.toContain("execSync('bun run type-check'");
  });
});
