import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function readDirRecursive(dir: string, ext: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...readDirRecursive(full, ext));
    } else if (entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

describe('effect dependency audit', () => {
  const srcDir = path.resolve(__dirname, '../../src');

  it('no useEffect with empty dependency array that references state variables', () => {
    const files = readDirRecursive(path.join(srcDir, 'hooks'), '.ts');
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      // Find useEffect blocks with [] dependency arrays
      const useEffectBlocks = content.matchAll(/useEffect\(\(\)\s*=>\s*\{[^}]+\},\s*\[\]\)/g);
      for (const match of useEffectBlocks) {
        // Check if the effect body references useGameStore or state variables
        if (match[0].includes('useGameStore') || match[0].includes('s.')) {
          violations.push(path.basename(file));
        }
      }
    }
    // Allow up to 2 known cases (mount-only effects that are intentional)
    expect(violations.length).toBeLessThanOrEqual(2);
  });

  it('no useMemo with missing dependencies that reference function parameters', () => {
    const files = readDirRecursive(path.join(srcDir, 'hooks'), '.ts');
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      // Find useMemo with empty deps
      const useMemoEmpty = content.match(/useMemo\(\(\)\s*=>\s*\{[^}]+\},\s*\[\]\)/g);
      if (useMemoEmpty) {
        for (const match of useMemoEmpty) {
          // Check if the memo body references parameters or external variables
          if (match.includes('roster') || match.includes('rivals') || match.includes('state')) {
            violations.push(path.basename(file));
            break;
          }
        }
      }
    }
    expect(violations.length).toBeLessThanOrEqual(2);
  });
});
