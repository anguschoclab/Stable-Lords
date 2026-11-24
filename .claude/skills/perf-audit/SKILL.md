---
name: perf-audit
description: Find and fix performance problems — array-as-set membership (.includes/.indexOf in loops), nested linear scans over state.rivals × state.arenaHistory, loop-invariant rebuilds, unindexed warrior/stable lookups, per-week allocations, unmemoized render derivations — plus the bigger levers: WeakMap identity-keyed caches, week-cache/stripNonSerializable discipline, worker-boundary clone cost, virtualization. Use whenever hunting speedups, auditing hot paths, investigating week-advance / bout-resolution / UI-render slowness, reviewing code for perf regressions, or before/after landing a perf fix. Wraps the scan-in-loop/entries-in-loop AST scanners, the src/test/perf slow-tier battery, soak --profile per-pass timing, and parallel-bench into a scan → triage → measure → fix → verify workflow. Carries the cardinality rubric (real hotspot vs false positive) and the determinism cautions (never change ctx.rootRng consumption order or Map/Set insertion order).
---

# Performance Audit

Scope: `src/engine/**` hot paths first, then `src/state/**`, `src/components/**`,
`src/pages/**`, `src/hooks/**` render paths.

Find → triage → measure → fix → verify. Perf work without measurement is
guessing; findings without triage are noise.

## Phase 1 — Scan

**AST scanners (run first):**

```bash
bun scripts/scan-in-loop.mjs      # .find/.findIndex/.filter/.some/.includes/.indexOf
                                  # executing once per loop iteration → scripts/out/scan-in-loop.json
bun scripts/entries-in-loop.mjs   # Object.entries() rebuilt per iteration → scripts/out/entries-in-loop.json
```

Secondary censuses (module/function size, not speed per se):
`bun scripts/srp-census.mjs`, `bun scripts/function-length.mjs`,
`bun scripts/param-count.mjs`.

**Suppression:** no inline ignore comment. A verified-legitimate hit registers
in `KNOWN_EXCEPTIONS` inside `src/test/megaplan/scanInLoop.guard.test.ts` /
`entriesInLoop.guard.test.ts` — keyed on file + code substring, `why` must be a
concrete reason >20 chars (no pending/todo/fixme/baseline). The ratchet is
bidirectional: unlisted violations fail, *and* stale entries that no longer
match a live violation fail — fix the code or justify it, then delete the
entry when the scan goes clean.

**Manual grep — patterns the scanners miss** (multi-line callbacks, non-loop
hot spots, render bodies):

```bash
# id-keyed find-in-loop → findWarriorById / getWarriorIndex / week caches
grep -rn "\.find(.*=>.*\.id *===" src/engine --include="*.ts"

# spread-in-accumulator → O(N²) copies
grep -rn "\.\.\.acc\|\.\.\.[a-z]*, *{" src/engine

# chained array passes that could be one loop
grep -rn "\.filter(.*)\.map(\|\.map(.*)\.filter(" src

# derivations inside render bodies (no React Compiler — these rerun per render)
grep -rn "sort(\|filter(\|reduce(" src/components src/pages --include="*.tsx" | grep -v "useMemo\|useListShell\|virtualizer"
```

Grep the file you're editing for scans against the big collections:
`state.arenaHistory`, `state.rivals`, `state.ledger`, `state.graveyard` /
`retired` / `deadWarriorIds`, `state.killEvents`, `state.matchHistory`,
`state.newsletter` / `gazettes`.

## Phase 2 — Triage (a finder, not a verdict)

Cardinality decides. **Leave alone:** `state.roster` (~dozens), `rival.roster`
per stable, bout `warriorIds` (≤2), style/severity/`PERSONALITY_CLASH` constant
tables, per-iteration collections (each item's own `tags`/`injuries`/
`seasonalGrowth`/`analysis.factors`), string `.includes("substr")` substring
checks, mutation-during-iteration scans, early-exit scans. **Real:** anything
iterating `state.rivals` (up to ~160 stables), `state.arenaHistory`
(append-only `FightSummary[]` — hundreds→thousands, never shrinks),
`deadWarriorIds`, `killEvents`, `ledger`, `matchHistory` — especially
per-rival-per-week. The expensive signature is `rivals × arenaHistory` or
`rivals × roster` inside a weekly pass.

**Hot-path tiers** (fix top-down):

1. `src/engine/pipeline/passes/*Pass.ts` +
   `src/engine/pipeline/passes/rivalStableShard/` — run every week;
   `rivalStrategy` is ~56% of week time (see `docs/engineering/pipeline-baseline.md`)
2. `src/engine/combat/**` + `src/engine/bout/**` — per bout, hundreds/week
3. `src/engine/pipeline/tick/**` +
   `src/engine/pipeline/services/weekPipeline/**` — per advance
4. `src/state/selectors.ts`, `src/components/**`, `src/pages/**`,
   `src/hooks/**` — per render
5. Worker/pool boundary — every Comlink job `postMessage`-clones the whole
   GameState; keep the serialized surface small
6. One-shot modals/FTUE — last

## Phase 3 — Measure

```bash
bun run test:slow                                        # perf battery lives here, not in `bun run test`
bun x vitest run --config vitest.config.slow.ts src/test/perf/pipeline.perf.slow.test.ts
bun x vitest run --config vitest.config.slow.ts src/test/perf/rivalStrategyPass.perf.slow.test.ts
bun scripts/soak.mjs --weeks 40 --profile                # per-pass total/avg/max ms + scripts/out/baseline.json
bun scripts/parallel-bench.mjs                           # pool=1 vs pool=N ship gate
```

`docs/engineering/pipeline-baseline.md` is the comparison table — 90-stable
~630 ms/wk, 160-stable ~1,430 ms/wk, populated-week `RivalStrategyPass` tick
~67 ms. Caveats from that doc: harness ms/wk includes archive/pulse overhead —
never cross-compare with bare `advanceWeek` perf rows; always measure on an
idle machine (a contaminated run once produced a false 1.51× gate result);
update the doc when landing a real win.

Deeper profiling: `bun --cpu-prof` on a harness run found the B3 hotspots
(`getHeadToHeadRecord`, `underservedWeights`, `STYLE_ORDER.indexOf`). Runtime
caveat: scripts run under Bun (JavaScriptCore); the shipped app is Electron
(V8) — big-O fixes transfer; shape/IC-level micro-opts verify under
node/electron. UI cost: React DevTools Profiler or a render counter, not
wall-clock guesses. Bundle weight: `bun run build` chunk table (no `analyze`
script exists).

## Phase 4 — Fix recipes

| Smell | Fix |
|-------|-----|
| `arr.includes(x)` / `indexOf` in a loop | `keySet(arr, k)` hoisted above the loop |
| `arr.find(x => x.id === id)` in a loop | `indexBy(arr, x => x.id)` — or the existing `state.warriorMap` / `rivalMap` / `rivalryMap` / `grudgeMap` / `warriorToStableMap` week caches in pipeline code |
| `.filter(pred)` per key in a loop | `groupBy(arr, keyFn)` once before the loop |
| warrior/stable by id or name, anywhere | `findWarriorById`, `getWarriorIndex`, `searchEntities` (`src/engine/core/entityIndex.ts`) |
| `[...acc, x]` / `{...acc, k}` in reduce/loop | `acc.push` / `acc[k] =` on a mutable local, or `Set`/`Map` accumulation |
| `.filter().map()` chains | single `for`/`reduce` pass |
| loop-invariant `Object.entries`/sort/index rebuilt per iteration | hoist above the loop (`entries-in-loop.mjs` flags these) |
| same derivation recomputed by several passes/weeks | identity-keyed WeakMap memo — precedents in the module-cache registry: `entityIndex.indexCache`, `arenaFit.underservedByHistory`, `headToHead.h2hByHistory`, `historyUtils.fightsByWarrior`, `warriorStatus.deadIdSetCache`, `stableCouncilService.reportCache` |
| `EnumOrder.indexOf(x)` in a hot path | module-scope `Map` — `STYLE_INDEX` precedent (`src/constants/combat/combat/matchup.ts`) |
| expensive derived data in render | `useShallow` selector in `src/state/selectors.ts`; `useMemo`/`useCallback`/`memo` are legitimate — **no React Compiler** — but verify a re-render problem is real first |
| hundreds-row list (rivals, arenaHistory, newsletter, graveyard) | `useVirtualizer` (`@tanstack/react-virtual` is installed — precedents: `WarriorLeaderboard`, `StableRankings`, `RivalVirtualRows`, `VirtualizedFallenGrid`); needs the `react-hooks/incompatible-library` disable comment |
| search/sort list UX | `useListShell` — the established `useMemo` + `pageSize` window + "show all" pattern; `useDeferredValue`/`startTransition` have **no local precedent** — measured cases only |
| bundle weight | `autoCodeSplitting` is already on (TanStackRouterVite); heavy deps go through `manualChunks` in `vite.config.ts`; `React.lazy` for one-off heavy components (3 precedents in `src/routes/__root.tsx`) |
| heavy data needed only on some paths | lazy-init — `loadCombatNarrative` precedent (`src/data/narrative/index.ts`) |

### The caching discipline — read before adding ANY cache

- **Module-level mutable under `src/engine` → register it in
  `src/test/engine/moduleCacheRegistry.test.ts` `REGISTRY` or that test fails.**
  The safety model: engine code ships into multiple execution contexts (main
  thread, engine worker, shard workers); each context gets its own module
  instance, and `jobQueue` serializes each context's work. Identity-keyed
  (WeakMap) caches are the safe pattern — GC-bounded and correct per context.
- **New per-week state cache → three registrations:**
  `stripNonSerializable` (`src/state/serialization.ts`) so it never crosses
  the worker boundary, `buildWeekCaches` +
  `CACHE_TOUCHING_KEYS` (`src/engine/pipeline/services/weekPipeline/caches.ts`)
  so it rebuilds after impact-resolution boundaries. Gated by
  `weekCacheFreshness` / `rivalMapStaleness` tests.
- **Never put a computed Map on the wire** — every Comlink job
  structured-clones the whole GameState; maps that survive serialization are
  pure tax.

## Phase 5 — Verify

1. Re-run the scanner(s): finding fixed, or a justified `KNOWN_EXCEPTIONS`
   entry (and remove any entry that went stale).
2. `bun run format && bun run lint && bun run type-check && bun run test`.
3. `bun run test:slow` when touching pipeline/pool/determinism paths —
   `determinism.slow` / `weekDeterminism` / `parallelDeterminism` must stay
   byte-identical.
4. Record before/after in the same harness; update
   `docs/engineering/pipeline-baseline.md` on a real win. New perf coverage →
   `src/test/perf/*.perf.slow.test.ts` (tier/filing rules: `write-engine-test`).

**Determinism cautions — non-negotiable:** never change `ctx.rootRng`
consumption order or count; shard seeds stay position-independent
(`docs/engineering/rng-policy.md`); `Map`/`Set` insertion order is the only
safe iteration-order swap; passes return `StateImpact`s — never mutate the
snapshot (`mutableInput`/`passPurity` guards). Bout-resolution changes: see
`combat-domain` / `combat-balance` first — resolution must stay
order-independent.

## Report format

```
finding: <file:line> [<kind>]
  hot path: <tier> | cardinality: ~<N> × ~<M>
  fix: <recipe> | expected: O(N*M) → O(N+M)
  measured: <harness> <before> → <after> | determinism: <pass/n-a>
  status: fixed | allowlisted (<why>) | dismissed (<reason>)
```

## Related

`sim-diagnostics` (harness catalog) · `determinism-debug` (seed/order
regressions) · `week-pipeline` (pass contract) · `guard-ratchet` (scanner +
allowlist conventions) · `write-engine-test` (perf-test tiering) ·
`verify-implementation` (before claiming done). Ad-hoc specialists:
`bolt` (implements one measured win/run) and `perf-auditor` (audit-only) in
`.claude/agents/`.
