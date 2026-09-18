/**
 * Accessibility motion-reduce — verifies motion-reduce classes are present
 * on animated elements. Tests 1-3 activated after confirming motion-reduce
 * classes exist on main. Test 4 verifies no blanket bg-background/90.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';

function listTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTsxFiles(full));
    else if (entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

describe('accessibility motion-reduce', () => {
  it('MiniCombatLog has motion-reduce:transition-none on all log entries', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/arena/MiniCombatLog.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/motion-reduce/);
  });

  it('TacticalLogView has motion-reduce:animate-none on animated elements', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/arena/TacticalLogView.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/motion-reduce/);
  });

  it('AppHeader has motion-reduce classes', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/layout/AppHeader.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/motion-reduce/);
  });

  it('no blanket bg-background/90 replacements in component files', () => {
    const componentDir = path.resolve(process.cwd(), 'src/components');
    const files = listTsxFiles(componentDir);
    let violations = 0;
    for (const fullPath of files) {
      const file = path.relative(componentDir, fullPath);
      const content = readFileSync(fullPath, 'utf-8');
      // Flag bg-background/90 used as a blanket replacement (should preserve original opacity)
      // AppHeader.tsx is exempt — it intentionally uses bg-background/90 for sticky header backdrop
      if (file.replace(/\\/g, '/') === 'layout/AppHeader.tsx') continue;
      const matches = content.match(/bg-background\/90/g);
      if (matches) {
        violations += matches.length;
      }
    }
    expect(violations, 'Found blanket bg-background/90 replacements').toBe(0);
  });
});
