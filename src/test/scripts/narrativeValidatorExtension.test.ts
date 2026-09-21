/**
 * N1 red test — narrative_validate.ts script must reject mock/placeholder markers.
 * This test FAILS until the validator is extended with checkForPlaceholderMarkers.
 * The validator must NOT flag canonical %A-style tokens (narrativePBPUtils.ts:23).
 */
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('narrative_validate.ts rejects mock/placeholder markers (N1)', () => {
  it('validator script exits 0 on current content (after mock removal)', () => {
    // This will FAIL until mock entries are removed from combatPassives.json
    // AND the validator is extended to check for them.
    // After both fixes, it should pass.
    let exitCode = 0;
    try {
      execSync('bun run scripts/narrative_validate.ts', { stdio: 'pipe' });
    } catch (err: any) {
      exitCode = err.status ?? 1;
    }
    expect(exitCode, `narrative-validate should exit 0, got ${exitCode}`).toBe(0);
  });

  it('validator detects (Mock N) markers in a temp file', () => {
    // This test verifies the validator's checkForPlaceholderMarkers function
    // by creating a temp narrative file with a mock marker and confirming
    // the validator catches it.
    // RED until checkForPlaceholderMarkers is added to narrative_validate.ts.
    const fs = require('fs');
    const path = require('path');
    const tmpDir = path.join(__dirname, '__tmp_validator_test__');
    const tmpFile = path.join(tmpDir, 'test_mock.json');

    try {
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(tmpFile, JSON.stringify({
        test_section: ["A clean entry", "Another clean entry with %A canonical token"]
        }));
      // The validator should be able to detect mock markers.
      // We test the function directly once it exists.
      // For now, this is RED because checkForPlaceholderMarkers doesn't exist.
      const { checkForPlaceholderMarkers } = require('../../../../scripts/narrative_validate.ts');
      expect(typeof checkForPlaceholderMarkers).toBe('function');

      const cleanResult = checkForPlaceholderMarkers(["clean text", "text with %A token"]);
      expect(cleanResult).toEqual([]);

      const mockResult = checkForPlaceholderMarkers(["clean text", "text with (Mock 1) marker"]);
      expect(mockResult.length).toBeGreaterThan(0);
    } finally {
      try { fs.unlinkSync(tmpFile); } catch {}
      try { fs.rmdirSync(tmpDir); } catch {}
    }
  });
});
