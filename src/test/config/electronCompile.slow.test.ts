import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('electron/main.ts compiles to valid JS via bun build', () => {
  const outfile = path.resolve(__dirname, '../../../electron/main.test-compiled.js');

  it('bun build produces a non-empty JS file', () => {
    try {
      execSync(`bun build electron/main.ts --target=node --outfile ${outfile}`, {
        cwd: path.resolve(__dirname, '../../..'),
        stdio: 'pipe',
        timeout: 30000,
      });
    } catch (e) {
      throw new Error(`bun build failed: ${(e as Error).message}`, { cause: e });
    }

    expect(existsSync(outfile)).toBe(true);
    const content = readFileSync(outfile, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
    expect(content).toMatch(/require\(|import\s|exports\./);
  });

  it('compiled output does not contain TypeScript syntax', () => {
    if (!existsSync(outfile)) {
      throw new Error('Compiled output not found — previous test may have failed');
    }
    const content = readFileSync(outfile, 'utf-8');
    expect(content).not.toMatch(/:\s*(string|number|boolean|any|void)\b/);
    expect(content).not.toMatch(/interface\s+\w+/);
  });

  it('cleanup compiled test artifact', () => {
    if (existsSync(outfile)) {
      unlinkSync(outfile);
    }
    expect(existsSync(outfile)).toBe(false);
  });
});
