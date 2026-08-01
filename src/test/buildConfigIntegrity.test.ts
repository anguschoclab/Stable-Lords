import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('buildConfigIntegrity', () => {
  const projectRoot = path.resolve(__dirname, '../..');

  it('vite.config.ts exists and is valid', () => {
    const configPath = path.join(projectRoot, 'vite.config.ts');
    expect(fs.existsSync(configPath)).toBe(true);
    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toContain('defineConfig');
  });

  it('tsconfig files exist', () => {
    expect(fs.existsSync(path.join(projectRoot, 'tsconfig.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, 'tsconfig.app.json'))).toBe(true);
  });

  it('vitest config is present (either in vite.config.ts or vitest.config.ts)', () => {
    const viteConfig = fs.readFileSync(path.join(projectRoot, 'vite.config.ts'), 'utf-8');
    const hasVitestInVite = viteConfig.includes('test') || viteConfig.includes('vitest');
    const hasStandaloneVitest = fs.existsSync(path.join(projectRoot, 'vitest.config.ts'));
    expect(hasVitestInVite || hasStandaloneVitest).toBe(true);
  });

  it('package.json has required scripts', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts.test).toBeDefined();
  });

  it('package.json has required dependencies', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(allDeps.react).toBeDefined();
    expect(allDeps.zustand).toBeDefined();
  });

  it('stripWorkerRefresh plugin is defined in vite config', () => {
    const viteConfig = fs.readFileSync(path.join(projectRoot, 'vite.config.ts'), 'utf-8');
    expect(viteConfig).toContain('stripWorkerRefresh');
  });
});
