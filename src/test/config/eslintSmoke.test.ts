import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('eslint config smoke test', () => {
  const projectRoot = path.resolve(__dirname, '../../..');

  it('eslint.config.js exists', () => {
    expect(fs.existsSync(path.join(projectRoot, 'eslint.config.js'))).toBe(true);
  });

  it('eslint config can be imported without crashing', async () => {
    // Dynamic import to catch module-level errors
    const configPath = path.join(projectRoot, 'eslint.config.js');
    const configUrl = `file://${configPath}`;
    const mod = await import(configUrl);
    expect(mod.default).toBeDefined();
    expect(Array.isArray(mod.default)).toBe(true);
    expect(mod.default.length).toBeGreaterThan(0);
  });

  it('eslint config has a rule set for typescript files', async () => {
    const configPath = path.join(projectRoot, 'eslint.config.js');
    const configUrl = `file://${configPath}`;
    const mod = await import(configUrl);
    const configs = mod.default as Array<Record<string, unknown>>;
    const tsConfig = configs.find(
      (c) => c.files && Array.isArray(c.files) && c.files.some((f: string) => f.includes('.ts'))
    );
    expect(tsConfig).toBeDefined();
    expect(tsConfig?.rules).toBeDefined();
  });

  it('enforces no-console as error on ts/tsx and exempts the logger sink', async () => {
    const configPath = path.join(projectRoot, 'eslint.config.js');
    const configUrl = `file://${configPath}`;
    const mod = await import(configUrl);
    const configs = mod.default as Array<{
      files?: string[];
      rules?: Record<string, unknown>;
    }>;

    const tsConfig = configs.find(
      (c) => c.files?.some((f) => f === '**/*.{ts,tsx}') && c.rules?.['no-console'] === 'error'
    );
    expect(tsConfig).toBeDefined();

    const loggerConfig = configs.find(
      (c) => c.files?.some((f) => f === 'src/utils/logger.ts')
    );
    expect(loggerConfig?.rules?.['no-console']).toBe('off');
  });
});
