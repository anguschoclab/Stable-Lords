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
      (l) => l.trim() === 'Daily_Balance_Report.md' && !l.trim().startsWith('#'),
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

  it('all three workflow YAMLs pin bun-version: 1.3.11', () => {
    const files = [
      '.github/workflows/daily_sim.yml',
      '.github/workflows/daily_balance_report.yml',
      '.github/workflows/daily_bard.yml',
    ];
    for (const f of files) {
      const yml = readFile(f);
      const match = yml.match(/bun-version:\s*(.+)/);
      expect(match, `${f} should have bun-version`).not.toBeNull();
      expect(match?.[1]?.trim()).toBe('1.3.11');
    }
  });

  it('all three workflow YAMLs have permissions: contents: write', () => {
    const files = [
      '.github/workflows/daily_sim.yml',
      '.github/workflows/daily_balance_report.yml',
      '.github/workflows/daily_bard.yml',
    ];
    for (const f of files) {
      const yml = readFile(f);
      expect(yml, `${f} should have contents: write`).toContain('contents: write');
    }
  });

  it('daily_sim.yml cron differs from daily_balance_report.yml cron', () => {
    const simYml = readFile('.github/workflows/daily_sim.yml');
    const balanceYml = readFile('.github/workflows/daily_balance_report.yml');
    const simCron = simYml.match(/cron:\s*'([^']+)'/);
    const balanceCron = balanceYml.match(/cron:\s*'([^']+)'/);
    expect(simCron).not.toBeNull();
    expect(balanceCron).not.toBeNull();
    expect(simCron?.[1]).not.toBe(balanceCron?.[1]);
  });

  it('daily_sim.yml does NOT contain git push origin HEAD:main', () => {
    const yml = readFile('.github/workflows/daily_sim.yml');
    expect(yml).not.toContain('git push origin HEAD:main');
  });
});
