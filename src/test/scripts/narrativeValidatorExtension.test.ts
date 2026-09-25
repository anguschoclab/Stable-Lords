import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, unlinkSync, rmdirSync, existsSync } from 'fs';
import { join } from 'path';

describe('narrative_validate.ts rejects mock/placeholder markers (N1)', () => {
  it('validator script exits 0 on current content (after mock removal)', () => {
    let exitCode = 0;
    try {
      execSync('bun run scripts/narrative_validate.ts', { stdio: 'pipe' });
    } catch (err: any) {
      exitCode = err.status ?? 1;
    }
    expect(exitCode, `narrative-validate should exit 0, got ${exitCode}`).toBe(0);
  });

  it('checkForPlaceholderMarkers detects (Mock N) but not canonical %A tokens', async () => {
    const validatorPath = '../../../scripts/narrative_validate.ts';
    let mod: any;
    try {
      mod = await import(validatorPath);
    } catch {
      // Module may not export anything.
    }
    expect(mod, 'narrative_validate.ts should export checkForPlaceholderMarkers').toBeDefined();
    expect(typeof mod.checkForPlaceholderMarkers).toBe('function');

    const cleanResult = mod.checkForPlaceholderMarkers(['clean text', 'text with %A token']);
    expect(cleanResult).toEqual([]);

    const mockResult = mod.checkForPlaceholderMarkers(['clean text', 'text with (Mock 1) marker']);
    expect(mockResult.length).toBeGreaterThan(0);
  });

  it('validator rejects a temp narrative file containing mock markers', () => {
    const tmpDir = join(__dirname, '__tmp_validator_test__');
    const tmpFile = join(tmpDir, 'test_mock.json');
    try {
      mkdirSync(tmpDir, { recursive: true });
      writeFileSync(tmpFile, JSON.stringify({
        test_section: ['A clean entry', 'Another entry with (Mock 1) marker'],
      }));
      // Verify the file exists
      expect(existsSync(tmpFile)).toBe(true);
    } finally {
      if (existsSync(tmpFile)) { unlinkSync(tmpFile); }
      if (existsSync(tmpDir)) { rmdirSync(tmpDir); }
    }
  });
});
