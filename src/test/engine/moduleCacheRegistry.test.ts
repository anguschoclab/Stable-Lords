import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ENGINE_ROOT = join(__dirname, '../../engine');

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (path.endsWith('.ts')) yield path;
  }
}

/**
 * Engine module-level mutable registry (D2/T12).
 *
 * `src/engine` ships inside multiple execution contexts — main thread,
 * engine worker, shard workers — and each context gets its OWN module
 * instance. A module-level `let` or mutable collection is therefore not a
 * process-global by accident; it is per-context state whose coherence is
 * guaranteed only because `jobQueue` serializes each context's work.
 *
 * Every module-level mutable must be registered here with its
 * context-safety rationale. Adding one without registration fails this
 * test — think first: is it per-context by design, keyed by identity, or a
 * leak waiting for a second execution context?
 */
const REGISTRY: Record<string, string> = {
  // ── Intentional singletons (per-context by design) ──────────────────────
  'core/telemetry.ts:globalProvider':
    'Process-wide telemetry sink, managed by set/resetTelemetryProvider.',
  'core/deathNotifier.ts:busSubscription':
    'Singleton EventBus subscription latch — prevents double-subscribe.',
  'core/deathNotifier.ts:handlers':
    'Per-context death-handler registry; attached once at boot, cleared in tests.',
  'runtime/session.ts:epoch':
    'Engine-session epoch guard — the mechanism that discards stale jobs.',
  'runtime/session.ts:queue':
    'Engine-session FIFO; serialization guarantees coherence per context.',
  'runtime/workerProxy.ts:proxy': 'Lazy per-context engine proxy singleton.',
  'runtime/cancellation.ts:requested':
    'Worker-local cooperative-cancel flag (cancelSim); never crosses contexts.',
  'storage/archiveWorkerProxy.ts:proxy': 'Lazy per-context archive proxy singleton.',
  'pool/enginePool.ts:sharedPoolSize': 'Shared pool size; shutdownEnginePool resets.',
  'pool/enginePool.ts:sharedPool': 'Shared pool instance; opt-in, default size 1.',
  'pipeline/adapters/opfsArchiver.ts:retryListeners':
    'Listener registry for the deferred-archive retry channel.',
  'pipeline/adapters/opfsArchiver.ts:pendingRetries':
    'Main-thread-only retry registry for failed archive writes; re-attempted on next flush.',
  'pipeline/services/weekPipeline/passes.ts:pipelineValidated':
    'Once-only DAG legality latch; validation is idempotent.',
  'combat/mechanics/weaponStats.ts:WEAPON_BY_ID':
    'Lazy-init lookup over static WEAPONS data; written once, then read-only.',

  // ── Identity-keyed caches (GC-bounded, safe in any context) ─────────────
  'core/historyResolver.ts:warriorCache': 'WeakMap keyed on state object identity.',
  'core/historyResolver.ts:stableCache': 'WeakMap keyed on state object identity.',
  'core/warriorLookup.ts:warriorCache':
    'WeakMap keyed on GameState identity; per-context module instance — safe only because jobQueue serializes each context\'s engine work and rosters never mutate in place.',
  'matchmaking/arenaFit.ts:underservedByHistory':
    'WeakMap keyed on arenaHistory identity; caches per-week underserved weights.',
  'advisor/stableCouncilService.ts:reportCache': 'WeakMap keyed on GameState identity.',
  'advisor/campaignFocusEvaluator.ts:contenderSetCache':
    'WeakMap keyed on the roster-map identity it derives from.',
  'matchmaking/schedulingAssistant/headToHead.ts:h2hByHistory':
    'WeakMap keyed on the arenaHistory array identity; a new history rebuilds the index fresh.',
  'storage/archiveService.ts:archiveService':
    'Environment-selected service singleton; assigned once at module init.',

  // ── Context-guarded caches (no-op where the backing store is absent) ────
  'stats/styleRollups.ts:weekCache':
    'localStorage-backed UI metric cache; localStorage guard no-ops in workers.',
  'stats/styleRollups.ts:rollingCache': 'Same — worker-safe via localStorage guard.',
  'stats/styleRollups.ts:tourCache': 'Same — worker-safe via localStorage guard.',
};

// V14 A1: the const branch also catches `= []`, `= {}`, `new Array()`, and
// type-annotated constructors (`const x: Set<T> = new Set()` escaped the old
// `name =` adjacency requirement — deathNotifier's `handlers`). Literals and
// annotated constructors mutate without hitting the old pattern.
// (opfsArchiver's `pendingRetries` and newsletter feed's `current` escaped the
// old collection-constructor-only pattern.)
const DECL_RE = /^(?:export\s+)?(let|var)\s+([A-Za-z_$][\w$]*)|^(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*(?::[^=\n]+)?=\s*(?:new\s+(?:Map|Set|WeakMap|WeakSet|Array)\s*[<(]|\[\s*\]|\{\s*\})/gm;
const MUTATION_RE = (id: string) => new RegExp(`\\b${id}\\.(set|add|delete|push|clear|pop|shift|splice)\\(`);

describe('engine module-level mutable registry', () => {
  it('every module-level mutable under src/engine is registered', () => {
    const found = new Set<string>();
    for (const file of walk(ENGINE_ROOT)) {
      const src = readFileSync(file, 'utf8');
      const rel = relative(ENGINE_ROOT, file);
      for (const m of src.matchAll(DECL_RE)) {
        const id = m[2] ?? m[3];
        const isLet = !!m[2];
        if (!id) continue;
        // `const` collections are only mutable if something writes to them;
        // read-only constant Sets/Maps are fine and need no registration.
        if (!isLet && !MUTATION_RE(id).test(src)) continue;
        found.add(`${rel}:${id}`);
      }
    }

    const registered = new Set(Object.keys(REGISTRY));
    const unregistered = [...found].filter((k) => !registered.has(k));
    const stale = [...registered].filter((k) => !found.has(k));

    expect(
      unregistered,
      `unregistered module-level mutables — add to REGISTRY with a context-safety rationale: ${unregistered.join(', ')}`
    ).toEqual([]);
    expect(stale, `stale REGISTRY entries (code removed — clean up): ${stale.join(', ')}`).toEqual(
      []
    );
  });
});
