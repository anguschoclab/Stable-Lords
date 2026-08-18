import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

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

describe('tsconfig reference graph', () => {
  const projectRoot = path.resolve(__dirname, '../..');

  function readJson(filePath: string): Record<string, any> {
    const raw = fs.readFileSync(filePath, 'utf-8');
    // Strip JSON5-style comments (// and /* */) for tsconfig files
    const stripped = raw.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    return JSON.parse(stripped);
  }

  it('root tsconfig.json references all 4 build projects', () => {
    const root = readJson(path.join(projectRoot, 'tsconfig.json'));
    const refs = (root.references as Array<{ path: string }>) ?? [];
    const refPaths = refs.map((r) => r.path);
    expect(refPaths).toContain('./tsconfig.app.json');
    expect(refPaths).toContain('./tsconfig.node.json');
    expect(refPaths).toContain('./electron/tsconfig.json');
    expect(refPaths).toContain('./tsconfig.e2e.json');
  });

  it('electron/tsconfig.json is composite for --build graph membership', () => {
    const electronTsconfig = readJson(path.join(projectRoot, 'electron', 'tsconfig.json'));
    expect(electronTsconfig.compilerOptions?.composite).toBe(true);
  });

  it('tsconfig.app.json is composite for --build graph membership', () => {
    const appTsconfig = readJson(path.join(projectRoot, 'tsconfig.app.json'));
    expect(appTsconfig.compilerOptions?.composite).toBe(true);
  });

  it('tsconfig.node.json is composite for --build graph membership', () => {
    const nodeTsconfig = readJson(path.join(projectRoot, 'tsconfig.node.json'));
    expect(nodeTsconfig.compilerOptions?.composite).toBe(true);
  });

  it('tsconfig.e2e.json exists and is composite for --build graph membership', () => {
    const e2eTsconfigPath = path.join(projectRoot, 'tsconfig.e2e.json');
    expect(fs.existsSync(e2eTsconfigPath)).toBe(true);
    const e2eTsconfig = readJson(e2eTsconfigPath);
    expect(e2eTsconfig.compilerOptions?.composite).toBe(true);
  });

  it('tsc --build --force exits with code 0 from root', () => {
    expect(() => {
      execSync('bun x tsc --build --force', {
        cwd: projectRoot,
        stdio: 'pipe',
        timeout: 120000,
      });
    }).not.toThrow();
  });
});

describe('CI and package.json scripts', () => {
  const projectRoot = path.resolve(__dirname, '../..');

  function readJson(filePath: string): Record<string, any> {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const stripped = raw.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    return JSON.parse(stripped);
  }

  it('package.json type-check script uses tsc --build', () => {
    const pkg = readJson(path.join(projectRoot, 'package.json'));
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts['type-check']).toContain('tsc --build');
  });

  it('ci.yml has a type-check job running tsc --build', () => {
    const ciPath = path.join(projectRoot, '.github', 'workflows', 'ci.yml');
    const ci = fs.readFileSync(ciPath, 'utf-8');
    expect(ci).toContain('type-check');
    expect(ci).toContain('tsc --build');
  });

  it('ci.yml has a build job running vite build', () => {
    const ciPath = path.join(projectRoot, '.github', 'workflows', 'ci.yml');
    const ci = fs.readFileSync(ciPath, 'utf-8');
    expect(ci).toMatch(/build:/);
    expect(ci).toContain('vite build');
  });

  it('.gitignore excludes *.tsbuildinfo files', () => {
    const gitignore = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf-8');
    expect(gitignore).toContain('*.tsbuildinfo');
  });
});
