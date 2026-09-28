import { describe, it, expect } from 'vitest';
import { readDirRecursive } from '@/test/_setup/fsHelpers';
import * as fs from 'fs';
import * as path from 'path';


describe('NF7: hardcoded year 2024', () => {
  const srcDir = path.resolve(__dirname, '../../engine');
  const stateDir = path.resolve(__dirname, '../../state');
  const constantsDir = path.resolve(__dirname, '../../constants');

  it('no hardcoded "2024" year in engine source files', () => {
    const dirs = [srcDir, stateDir, constantsDir];
    const violations: string[] = [];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      const files = readDirRecursive(dir, '.ts');
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          // Look for hardcoded 2024 in string literals or date constructors
          if (
            lines[i]!.includes("'2024") ||
            lines[i]!.includes('"2024') ||
            lines[i]!.includes('2024-01-01')
          ) {
            // Skip comments
            if (lines[i]!.trim().startsWith('//') || lines[i]!.trim().startsWith('*')) continue;
            violations.push(`${path.basename(file)}:${i + 1}: ${lines[i]!.trim()}`);
          }
        }
      }
    }
    // No hardcoded 2024 dates should remain in engine source files
    expect(violations.length).toBe(0);
  });

  it('gameStateFactory no longer hardcodes 2024-01-01 (NF7 fixed)', () => {
    const factoryPath = path.resolve(srcDir, 'factories/gameStateFactory.ts');
    if (fs.existsSync(factoryPath)) {
      const content = fs.readFileSync(factoryPath, 'utf-8');
      expect(content).not.toContain("'2024-01-01");
      expect(content).toContain('new Date().toISOString()');
    }
  });
});
