import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { walkTsFiles as walk } from '@/test/_helpers/fsWalk';

const ENGINE_ROOT = join(__dirname, '../../engine');


/**
 * Engine code runs inside Web Workers and the Electron renderer where the
 * Node `process` global does not exist — a bare `process.env.FOO` read is a
 * ReferenceError, not `undefined`. Env access must go through
 * `globalThis.process?.env` so it degrades safely off-Node.
 */
describe('engine env safety', () => {
  it('no engine source reads bare process.env', () => {
    const offenders: string[] = [];
    for (const file of walk(ENGINE_ROOT)) {
      const src = readFileSync(file, 'utf8');
      // Strip the sanctioned guarded form, then look for any bare access.
      const unguarded = src.replaceAll('globalThis.process', '');
      if (/\bprocess\.env\b/.test(unguarded)) {
        offenders.push(relative(process.cwd(), file));
      }
    }
    expect(offenders).toEqual([]);
  });
});
