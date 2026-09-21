/**
 * Archive routing invariant — every consumer outside the storage module
 * itself must go through the Electron/web `archiveService` switch, never
 * directly at the OPFS implementation. A direct `opfsArchive` or
 * `OPFSArchiveService` import outside `src/engine/storage/` splits
 * persistence across two backends in Electron (F-arch1).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(__dirname, '../../..');

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      yield* walk(p);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      yield p;
    }
  }
}

// Files inside the storage module and its worker legitimately touch OPFS.
const ALLOWED = new Set([
  'src/engine/storage/archiveService.ts',
  'src/engine/storage/archiveWorker.ts',
  'src/engine/storage/archiveWorkerProxy.ts',
  'src/engine/storage/electronArchive.ts',
]);

describe('archive routing invariant', () => {
  it('no file outside the storage module imports the OPFS implementation directly', () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const rel = file.replace(/\\/g, '/').replace(/^.*?\bsrc\//, 'src/');
      if (rel.startsWith('src/test/')) continue; // tests legitimately exercise the OPFS implementation
      if (ALLOWED.has(rel)) continue;
      if (rel.startsWith('src/engine/storage/opfsArchive/')) continue;
      const content = readFileSync(file, 'utf8');
      if (
        /import\s+[^'"]*from\s+['"][^'"]*opfsArchive['"]/.test(content) ||
        /import\s+[^'"]*from\s+['"][^'"]*archiveWorker['"]/.test(content)
      ) {
        offenders.push(rel);
      }
    }
    expect(offenders).toEqual([]);
  });
});
