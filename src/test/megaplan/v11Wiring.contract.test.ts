import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

/**
 * MEGAPLAN-V14 wiring contracts (test-first, skipped until Phase 6):
 *
 * 1. Constants liveness — every export in a leaf constants module must be
 *    imported by at least one non-test file outside its own module. Flags the
 *    `constants/core/dates.ts`-class finding (file where most exports were
 *    zero-consumer).
 * 2. Engine-pool worker surface — `processBoutShard` must either be invoked
 *    through the pool's dispatch path or be unexported (knip flagged it as an
 *    unused export; verify the comlink/worker call path exists or trim it).
 */

const REPO = path.resolve(__dirname, '../../..');
const SRC = path.join(REPO, 'src');

function* srcFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* srcFiles(full);
    else if (/\.(ts|tsx)$/.test(entry) && !entry.includes('/test/'))
      yield full;
  }
}

const prodFiles = [...srcFiles(SRC)].filter((f) => !f.includes(`${path.sep}test${path.sep}`));

function consumersOf(symbol: string, exclude: string): string[] {
  const re = new RegExp(`\\b${symbol}\\b`);
  return prodFiles.filter((f) => f !== exclude && re.test(readFileSync(f, 'utf8')));
}

describe('megaplan V11: wiring contracts', () => {
describe('MEGAPLAN-V14', () => {
  it('every export of constants/core/dates.ts is consumed outside the module', () => {
    const file = path.join(SRC, 'constants/core/dates.ts');
    if (!existsSync(file)) return; // deleted-file disposition also satisfies
    const exports = [...readFileSync(file, 'utf8').matchAll(/export\s+const\s+(\w+)/g)]
      .map((m) => m[1])
      .filter((s): s is string => Boolean(s));
    const dead = exports.filter((sym) => consumersOf(sym, file).length === 0);
    expect(
      dead,
      `dead constants in dates.ts (wire into calendar/day math or delete):\n${dead.join('\n')}`
    ).toEqual([]);
  });

  it('processBoutShard is invoked through the worker/pool path or unexported', () => {
    const file = path.join(SRC, 'engine/pool/enginePool.ts');
    if (!existsSync(file)) return;
    const consumers = consumersOf('processBoutShard', file).filter(
      (f) => !f.includes('enginePool')
    );
    const stillExported = /export\s+(?:async\s+)?function\s+processBoutShard/.test(
      readFileSync(file, 'utf8')
    );
    expect(
      consumers.length > 0 || !stillExported,
      'processBoutShard is exported but has no consumers — wire to worker path or unexport'
    ).toBe(true);
  });
});
});
