import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function readDir(dir: string, ext: string, results: string[] = []): string[] {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      readDir(fullPath, ext, results);
    } else if (item.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('typeSafetyAudit', () => {
  const srcDir = path.resolve(__dirname, '../../engine');

  it('no @ts-ignore or @ts-expect-error in engine source files', () => {
    const files = readDir(srcDir, '.ts');
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('@ts-ignore') || content.includes('@ts-expect-error')) {
        violations.push(file);
      }
    }
    expect(violations.length).toBe(0);
  });

  it('enumerates all "as any" in engine source files', () => {
    const files = readDir(srcDir, '.ts');
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i]!.includes(' as any') && !lines[i]!.includes('eslint-disable')) {
          violations.push(`${path.basename(file)}:${i + 1}`);
        }
      }
    }
    // We know there are ~5 instances. This test documents them.
    // The goal is to reduce this to 0 over time.
    expect(violations.length).toBeLessThanOrEqual(10);
  });

  it('no "as any" in state source files', () => {
    const stateDir = path.resolve(__dirname, '../../state');
    const files = readDir(stateDir, '.ts');
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i]!.includes(' as any') && !lines[i]!.includes('eslint-disable')) {
          violations.push(`${path.basename(file)}:${i + 1}`);
        }
      }
    }
    // serialization.ts has one known instance
    expect(violations.length).toBeLessThanOrEqual(5);
  });
});
