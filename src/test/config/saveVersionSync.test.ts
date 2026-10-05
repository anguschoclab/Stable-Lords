// @vitest-environment node
/**
 * saveVersionSync — electron/main.ts duplicates SAVE_STATE_VERSION as a
 * hardcoded literal ("Keep in sync with src/constants/core/core.ts"). If the
 * two ever diverge, every save whose meta.version carries the app-stamped
 * version is rejected at the Electron boundary — silent save loss. This guard
 * pins the two copies together.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { SAVE_STATE_VERSION } from '@/constants/core/core';

const ELECTRON_MAIN = path.resolve(__dirname, '../../../electron/main.ts');

describe('SAVE_STATE_VERSION sync', () => {
  it('electron/main.ts stamps the same version as constants/core', () => {
    const source = fs.readFileSync(ELECTRON_MAIN, 'utf8');
    const m = /const SAVE_STATE_VERSION = '([^']+)'/.exec(source);
    expect(m, 'electron/main.ts must declare SAVE_STATE_VERSION').not.toBeNull();
    expect(m![1]).toBe(SAVE_STATE_VERSION);
  });
});
