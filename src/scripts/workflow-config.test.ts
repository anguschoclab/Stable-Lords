import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const repoRoot = resolve(__dirname, '../..');

function readFile(relPath: string): string {
  return readFileSync(resolve(repoRoot, relPath), 'utf-8');
}

describe('workflow-config', () => {
  it('Daily_Balance_Report.md is NOT gitignored', () => {
    const gitignore = readFile('.gitignore');
    const lines = gitignore.split('\n');
    const matches = lines.filter(
      (l) => l.trim() === 'Daily_Balance_Report.md' && !l.trim().startsWith('#')
    );
    expect(matches).toHaveLength(0);
  });

  it('tsconfig.json has @/* path alias', () => {
    const tsconfig = JSON.parse(readFile('tsconfig.json'));
    expect(tsconfig.compilerOptions).toBeDefined();
    expect(tsconfig.compilerOptions.paths).toBeDefined();
    expect(tsconfig.compilerOptions.paths['@/*']).toBeDefined();
  });

  it('daily_sim.yml references src/scripts/daily_oracle.ts, not benchmark.ts', () => {
    const yml = readFile('.github/workflows/daily_sim.yml');
    expect(yml).not.toContain('benchmark.ts');
    expect(yml).toContain('src/scripts/daily_oracle.ts');
  });

  it('both workflow YAMLs pin bun-version: 1.3.11', () => {
    const files = ['.github/workflows/daily_sim.yml', '.github/workflows/daily_bard.yml'];
    for (const f of files) {
      const yml = readFile(f);
      const match = yml.match(/bun-version:\s*(.+)/);
      expect(match, `${f} should have bun-version`).not.toBeNull();
      expect(match?.[1]?.trim()).toBe('1.3.11');
    }
  });

  it('both workflow YAMLs have permissions: contents: write', () => {
    const files = ['.github/workflows/daily_sim.yml', '.github/workflows/daily_bard.yml'];
    for (const f of files) {
      const yml = readFile(f);
      expect(yml, `${f} should have contents: write`).toContain('contents: write');
    }
  });

  it('daily_oracle.ts awaits runSimulation', () => {
    const src = readFile('src/scripts/daily_oracle.ts');
    expect(src).toContain('await runSimulation');
  });

  it('daily_balance_report.yml has been removed', () => {
    expect(() => readFile('.github/workflows/daily_balance_report.yml')).toThrow();
  });

  it('daily_sim.yml does NOT contain git push origin HEAD:main', () => {
    const yml = readFile('.github/workflows/daily_sim.yml');
    expect(yml).not.toContain('git push origin HEAD:main');
  });

  it('daily_bard.yml falls back to DRY_RUN when GEMINI_API_KEY is absent', () => {
    const yml = readFile('.github/workflows/daily_bard.yml');
    expect(yml).toContain('DRY_RUN:');
    expect(yml).toContain('!secrets.GEMINI_API_KEY');
  });

  it('daily_bard.yml passes GEMINI_API_KEY through when available', () => {
    const yml = readFile('.github/workflows/daily_bard.yml');
    expect(yml).toContain('GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}');
  });

  it('ci.yml pins bun-version: 1.3.11', () => {
    const yml = readFile('.github/workflows/ci.yml');
    const matches = yml.match(/bun-version:\s*(.+)/g);
    expect(matches).not.toBeNull();
    for (const m of matches!) {
      expect(m.trim()).toBe('bun-version: 1.3.11');
    }
  });
});
