import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * MEGAPLAN-V14 entry-point guard (test-first; partially red until Phase 5c):
 *
 * Freezes the production-call surface of the engine worker:
 *  1. Every `engineProxy.<method>` call site lives in an allowlisted file.
 *  2. Every allowlisted caller routes through `engineSession` (the epoch-
 *     guarded main-thread serializer) — raw proxy calls would bypass stale-
 *     result protection.
 *  3. Admin fast-forward paths (`skipToMonthEnd`/`skipToQuarterEnd`) carry
 *     the same timeout + `cancelSim` termination affordance as
 *     `runEngineJob` — today a hung week in an admin skip blocks the worker
 *     FIFO forever with no timeout. (RED)
 *  4. Admin callers pass state through `stripNonSerializable` like the
 *     store path — harmless today because `reconstructGameState` cannot
 *     emit the stripped fields, but the divergence is a latent break.
 *     (RED — defense in depth)
 *  5. The worker's exposed surface stays intentional: every exposed method
 *     either has a production caller or is pinned in DEAD_SURFACE.
 */

const SRC = path.resolve(__dirname, '../..');

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx)$/.test(p)) yield p;
  }
}

const ENGINE_PROXY_CALL_RE = /engineProxy\.(\w+)\s*\(/g;

/** Production files permitted to call engineProxy, with their serializer. */
const ALLOWED_CALLERS: Record<string, { needsSession: boolean }> = {
  'src/state/createStore.ts': { needsSession: true },
  'src/hooks/useWeekExecution.ts': { needsSession: true },
  'src/pages/AdminTools/hooks/adminActions.ts': { needsSession: true },
};

/** Worker methods with no production caller — kept or removed deliberately. */
const DEAD_SURFACE: string[] = [
  'advanceMonth',
  'advanceQuarter',
  'advanceYear',
  'skipToYearEnd',
  'resolveTournamentRound',
  'createFreshState',
  'configureEnginePool',
];

function productionCallSites(): Map<string, string[]> {
  const sites = new Map<string, string[]>();
  for (const file of walk(SRC)) {
    const rel = path.relative(path.resolve(SRC, '..'), file);
    if (rel.includes('src/test/') || rel.includes('src/engine/runtime/')) continue;
    const text = readFileSync(file, 'utf8');
    const methods = [...text.matchAll(ENGINE_PROXY_CALL_RE)].map((m) => m[1]!);
    if (methods.length) sites.set(rel, methods);
  }
  return sites;
}

describe('megaplan V14: engineProxy entry-point matrix', () => {
  it('all engineProxy call sites live in allowlisted files', () => {
    const sites = productionCallSites();
    const unlisted = [...sites.keys()].filter((f) => !(f in ALLOWED_CALLERS));
    expect(unlisted, `engineProxy called outside allowlist: ${unlisted.join(', ')}`).toEqual([]);
  });

  it('every allowlisted caller routes through engineSession', () => {
    for (const [file, cfg] of Object.entries(ALLOWED_CALLERS)) {
      if (!cfg.needsSession) continue;
      const text = readFileSync(path.join(path.resolve(SRC, '..'), file), 'utf8');
      expect(text, `${file} must import engineSession`).toMatch(/engineSession/);
      expect(text, `${file} must gate calls via runExclusive/runGuarded`).toMatch(
        /runExclusive|runGuarded/
      );
    }
  });

  it('admin fast-forward paths carry timeout + cancelSim parity with runEngineJob', () => {
    const admin = readFileSync(
      path.join(path.resolve(SRC, '..'), 'src/pages/AdminTools/hooks/adminActions.ts'),
      'utf8'
    );
    // The affordance lives in engineSession.runGuarded — admin paths must
    // delegate to it (not bare runExclusive) so a hung week is cancelled.
    expect(admin, 'admin skips must use engineSession.runGuarded for timeout+cancelSim').toMatch(
      /runGuarded/
    );
    const session = readFileSync(
      path.join(SRC, 'engine/runtime/session.ts'),
      'utf8'
    );
    const guarded = session.match(/runGuarded[\s\S]*?\n  \},?/)?.[0] ?? '';
    expect(guarded, 'runGuarded must retain the setTimeout → cancelSim affordance').toMatch(
      /setTimeout/
    );
    expect(guarded, 'runGuarded must retain the cancelSim call').toMatch(/cancelSim/);
  });

  it('admin callers strip non-serializable fields before worker transfer (parity with doAdvance*)', () => {
    const text = readFileSync(
      path.join(path.resolve(SRC, '..'), 'src/pages/AdminTools/hooks/adminActions.ts'),
      'utf8'
    );
    expect(text, 'adminActions must call stripNonSerializable on reconstructed state').toMatch(
      /stripNonSerializable/
    );
  });

  it('every exposed worker method has a production caller or is pinned dead surface', () => {
    const workerSrc = readFileSync(
      path.join(path.resolve(SRC, 'engine/runtime/worker.ts')),
      'utf8'
    );
    // Scope to the `const engine = { … }` literal — a bare object-method scan
    // would also catch `fn:` params inside enqueueSim's signature.
    const engineBlock = workerSrc.match(/const engine = \{([\s\S]*?)\n\};/);
    expect(engineBlock, 'could not locate the exposed engine object in worker.ts').not.toBeNull();
    const exposed = [...engineBlock![1]!.matchAll(/^\s{2}(\w+):\s*(?:\(|async)/gm)].map(
      (m) => m[1]!
    );
    const callSites = productionCallSites();
    const called = new Set([...callSites.values()].flat());
    for (const m of exposed) {
      expect(
        called.has(m) || DEAD_SURFACE.includes(m),
        `worker method '${m}' is neither called in production nor pinned in DEAD_SURFACE`
      ).toBe(true);
    }
    // Ratchet the other way too — a pinned-dead method that gains a caller
    // must leave DEAD_SURFACE so its call path gets audited.
    for (const m of DEAD_SURFACE) {
      expect(
        exposed.includes(m),
        `DEAD_SURFACE entry '${m}' no longer exposed on the worker — clean it up`
      ).toBe(true);
    }
  });
});
