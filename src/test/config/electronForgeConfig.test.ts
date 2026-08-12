import { describe, it, expect } from 'vitest';
import packageJson from '../../../package.json';

describe('electron-forge config accessibility', () => {
  it('forge config is accessible at top-level config (not nested in build)', () => {
    const forgeConfig = (packageJson as any).config?.forge;
    expect(forgeConfig).toBeDefined();
    expect(forgeConfig.makers).toBeDefined();
    expect(Array.isArray(forgeConfig.makers)).toBe(true);
    expect(forgeConfig.makers.length).toBeGreaterThan(0);
  });

  it('dead electron-builder "build" block is removed', () => {
    expect((packageJson as any).build).toBeUndefined();
  });

  it('main entry point points to compiled JS, not TS source', () => {
    expect(packageJson.main).toBe('electron/main.js');
    expect(packageJson.main).not.toBe('electron/main.ts');
  });

  it('forge config has a plugins array', () => {
    const forgeConfig = (packageJson as any).config?.forge;
    expect(forgeConfig.plugins).toBeDefined();
    expect(Array.isArray(forgeConfig.plugins)).toBe(true);
  });

  it('no npx appears in any scripts value', () => {
    const scripts = packageJson.scripts as Record<string, string>;
    for (const [, value] of Object.entries(scripts)) {
      expect(value).not.toMatch(/\bnpx\b/);
    }
  });

  it('@google/generative-ai is in devDependencies, not dependencies', () => {
    expect(packageJson.dependencies).not.toHaveProperty('@google/generative-ai');
    expect(packageJson.devDependencies).toHaveProperty('@google/generative-ai');
  });

  it('@testing-library/dom is in devDependencies, not dependencies', () => {
    expect(packageJson.dependencies).not.toHaveProperty('@testing-library/dom');
    expect(packageJson.devDependencies).toHaveProperty('@testing-library/dom');
  });
});
