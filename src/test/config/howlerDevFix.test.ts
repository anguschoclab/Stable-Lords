import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '../../..');

describe('howler dev white-screen fix', () => {
  it('vite.config.ts does NOT define global.HowlerGlobal', () => {
    const content = fs.readFileSync(path.join(projectRoot, 'vite.config.ts'), 'utf-8');
    expect(content).not.toContain("'global.HowlerGlobal'");
    expect(content).not.toContain('"global.HowlerGlobal"');
  });

  it('vite.config.ts does NOT have a define block for HowlerGlobal', () => {
    const content = fs.readFileSync(path.join(projectRoot, 'vite.config.ts'), 'utf-8');
    expect(content).not.toContain("define:");
    expect(content).not.toContain("'global.HowlerGlobal'");
    expect(content).not.toContain('"global.HowlerGlobal"');
  });

  it('vite.config.ts includes fixHowler plugin in the plugins array', () => {
    const content = fs.readFileSync(path.join(projectRoot, 'vite.config.ts'), 'utf-8');
    expect(content).toContain('fixHowler()');
  });

  it('src/main.tsx does NOT reference HowlerGlobal', () => {
    const content = fs.readFileSync(path.join(projectRoot, 'src/main.tsx'), 'utf-8');
    expect(content).not.toContain('HowlerGlobal');
  });

  it('src/lib/AudioManager.ts does NOT reference HowlerGlobal', () => {
    const content = fs.readFileSync(path.join(projectRoot, 'src/lib/AudioManager.ts'), 'utf-8');
    expect(content).not.toContain('HowlerGlobal');
  });

  it('index.html does NOT reference init-howler.js', () => {
    const content = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf-8');
    expect(content).not.toContain('init-howler');
  });

  it('public/init-howler.js does NOT exist', () => {
    expect(fs.existsSync(path.join(projectRoot, 'public/init-howler.js'))).toBe(false);
  });

  it('src/types/global.d.ts does NOT reference HowlerGlobal', () => {
    const content = fs.readFileSync(path.join(projectRoot, 'src/types/global.d.ts'), 'utf-8');
    expect(content).not.toContain('HowlerGlobal');
  });
});
