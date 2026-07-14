import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const SCRIPT_PATH = path.resolve(process.cwd(), 'scripts/narrative_validate.ts');
const CONTENT_PATH = path.resolve(process.cwd(), 'src/data/narrativeContent.json');

describe('narrative_validate script', () => {
  it('validates narrativeContent.json without errors', () => {
    expect(fs.existsSync(CONTENT_PATH)).toBe(true);
    expect(fs.existsSync(SCRIPT_PATH)).toBe(true);
    const result = execSync('npx tsx ' + SCRIPT_PATH, {
      encoding: 'utf-8',
      cwd: process.cwd(),
    });
    expect(result).toContain('passed');
  });
});
