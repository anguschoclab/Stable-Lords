import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('build config audit', () => {
  const projectRoot = path.resolve(__dirname, '../../..');

  it('tsconfig.app.json has strict: true', () => {
    const tsconfigPath = path.join(projectRoot, 'tsconfig.app.json');
    if (fs.existsSync(tsconfigPath)) {
      const content = fs.readFileSync(tsconfigPath, 'utf-8');
      const config = JSON.parse(content);
      expect(config.compilerOptions?.strict).toBe(true);
    } else {
      // May be in tsconfig.json
      const tsconfigPath2 = path.join(projectRoot, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath2)).toBe(true);
      const content = fs.readFileSync(tsconfigPath2, 'utf-8');
      const config = JSON.parse(content);
      expect(config.compilerOptions?.strict).toBe(true);
    }
  });

  it('vite config has manualChunks for vendor splitting', () => {
    const viteConfig = fs.readFileSync(path.join(projectRoot, 'vite.config.ts'), 'utf-8');
    expect(viteConfig).toContain('manualChunks');
  });

  it('vite config has autoCodeSplitting', () => {
    const viteConfig = fs.readFileSync(path.join(projectRoot, 'vite.config.ts'), 'utf-8');
    expect(viteConfig).toContain('autoCodeSplitting');
  });

  it('eslint config does not globally disable no-explicit-any', () => {
    const eslintPath = path.join(projectRoot, 'eslint.config.js');
    if (fs.existsSync(eslintPath)) {
      const content = fs.readFileSync(eslintPath, 'utf-8');
      // Check that no-explicit-any is not globally turned off via rules config
      // Allow mentions in comments or per-file overrides
      const globalOff = content.match(/['"]no-explicit-any['"]\s*:\s*['"]off['"]/);
      expect(globalOff).toBeNull();
    }
  });

  it('package.json has required scripts', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts.test).toBeDefined();
    expect(pkg.scripts.build).toBeDefined();
  });
});
