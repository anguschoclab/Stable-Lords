# Plan: `perf-audit` skill for Stable Lords — LANDED

> Landed: `.claude/skills/perf-audit/SKILL.md` created; all gates green
> (skill-path-scan 37 skills/368 refs, skillPathScan.guard.slow, lint).
> Bonus fix from doc-conformance run: `new URL(...).pathname` →
> `fileURLToPath` Windows path bug in `scripts/soak.mjs` +
> `scripts/parallel-bench.mjs` (`--profile`/`baseline.json` writes crashed
> with `EPERM mkdir 'C:'` on Windows).

Create `.claude/skills/perf-audit/SKILL.md` — a Stable Lords adaptation of Basho's `perf-audit` skill (scan → triage → measure → fix → verify), wired to this repo's real scanners, perf battery, cache machinery, and determinism rules. Validated line-by-line against the codebase; corrections folded in below.

## Validation pass — approvals & corrections (all evidence-checked)

**APPROVED — verified against source:**

| Draft claim | Evidence |
|---|---|
| `scan-in-loop.mjs` + `entries-in-loop.mjs` are the real scanners, AST-accurate (TS compiler API), write `scripts/out/*.json` | `scripts/scan-in-loop.mjs:1-134`, `scripts/entries-in-loop.mjs:1-129` |
| Suppression = `KNOWN_EXCEPTIONS` entries, shrink-only | `src/test/megaplan/scanInLoop.guard.test.ts:22` + `_scanGuardHelpers.ts` — and the guard is **bidirectional**: `assertAllowlistFresh` fails on stale entries that no longer match a live violation, `assertExceptionsReviewed` requires `why` >20 chars and rejects /pending triage\|todo\|fixme\|baseline/i |
| `indexBy`/`groupBy`/`keySet` are the canonical helpers | `src/utils/collections.ts` (first-wins / insertion-order semantics documented) |
| entityIndex WeakMap identity trap is real | `src/engine/core/entityIndex.ts:7` — "callers must pass the store state itself… never a freshly assembled `{roster, rivals}` literal"; `searchEntities` consumed by `GlobalSearch.tsx:251` via `useShallow` |
| Week caches + strip/rebuild discipline | `src/engine/pipeline/services/weekPipeline/caches.ts` (`buildWeekCaches`, `CACHE_TOUCHING_KEYS`, `impactsAffectWeekCaches`); `src/state/serialization.ts` `stripNonSerializable` removes `warriorMap`, `cachedMetaDrift`, `warriorToStableMap`, `rivalMap`, `rivalryMap`, `grudgeMap`, `warriorToOfferIds`, `lastWeekBoutDisplay` |
| Perf battery locations | `src/test/perf/pipeline.perf.slow.test.ts`, `src/test/perf/rivalStrategyPass.perf.slow.test.ts`; `soak.mjs --profile` → per-pass table + `scripts/out/baseline.json`; `parallel-bench.mjs` pool gate |
| Baseline numbers | `docs/engineering/pipeline-baseline.md` — rivalStrategy ~56% of week, 90-stable ~630 ms/wk, 160-stable ~1,430 ms/wk, pool gate 0.33× FAIL, idle-machine warning, `bun --cpu-prof` precedent |
| Determinism files | `src/test/engine/sim/determinism.slow.test.ts`, `src/test/engine/weekDeterminism.slow.test.ts`, `src/test/engine/pipeline/parallelDeterminism.slow.test.ts` — all exist |
| `loadCombatNarrative` lazy-init precedent | `src/data/narrative/index.ts:37`; awaited in `runtime/worker.ts`, `pool/shardWorker.ts`, `weekPipeline/stages.ts` |
| `@tanstack/react-virtual` installed AND used | `WarriorLeaderboard.tsx`, `StableRankings.tsx`, `RivalVirtualRows.tsx`, `VirtualizedFallenGrid.tsx` — each requires `eslint-disable react-hooks/incompatible-library` |
| No React Compiler; no `analyze` script | `vite.config.ts` uses `@vitejs/plugin-react-swc` only; `package.json` scripts confirmed |
| Worker boundary cost | `workerProxy.ts` (Comlink → `runtime/worker.ts`) + `enginePool`/`shardWorker` — GameState crosses via `postMessage` structured clone per job |
| `scripts/out/` is gitignored | `.gitignore` `out/` pattern covers it → scanner runs are tree-safe verification steps |

**DISPROVED / corrected — the draft was wrong here:**

1. **`useDeferredValue`/`startTransition` have zero usages in `src/`** — the draft implied `searchEntities`/`useListShell` were precedents. False. The established type-ahead pattern is `useListShell` (`useMemo` filter+sort+`pageSize` window of 25 + "show all", `src/hooks/useListShell.ts`) and `useShallow`-wrapped `searchEntities`. `useDeferredValue` may be suggested only as a measured next step, not as house pattern.
2. **"Pages lazy-load via React.lazy" is mostly false** — only 3 `lazy()` call sites in `src/routes/__root.tsx`. The actual code-split mechanism is `autoCodeSplitting: true` in `TanStackRouterVite` (`vite.config.ts:116`). Cite that + `manualChunks` (`vendor-core`/`vendor-ui`/`engine-core`) + the 3 lazy call sites.
3. **`STYLE_INDEX` path precision** — it lives at `src/constants/combat/combat/matchup.ts`, not `src/engine/combat/`.
4. **Missing gate (most important finding): `moduleCacheRegistry.test.ts`** — any new module-level `let` or mutated `const Map/Set/WeakMap/literal` under `src/engine` must be registered in `REGISTRY` with a context-safety rationale or the test fails. The WeakMap-memo recipe MUST cite this gate. The registry also documents the safety model: engine code ships into multiple contexts (main thread, engine worker, shard workers), each context gets its own module instance, and `jobQueue` serializes each context's work — that's why identity-keyed module caches are safe.
5. **`bun run test` does not cover this change** — fast suite excludes `*.slow.test.*` and nothing in it touches `.claude/`. The real gate is `skillPathScan.guard.slow.test.ts`, which runs under `vitest.config.slow.ts` (include: `src/test/**/*.slow.test.*`), not the default config. Verification section updated accordingly.

## Files to create

- `.claude/skills/perf-audit/SKILL.md` — the only file (flat dir, matching every existing skill). No registration needed: `scripts/skill-path-scan.mjs` auto-discovers `*/SKILL.md` and CI-verifies every `src/`/`scripts/`/`docs/` path it cites — so every path below was confirmed to exist.

## Strict test-first sequence (mandated order)

This is a documentation artifact — there are no code units to unit-test, so "tests" means the repo's guard gates. The sequence is non-negotiable:

**Phase A — baseline gates BEFORE writing (prove clean tree is green):**
```bash
node scripts/skill-path-scan.mjs          # must exit 0 on current skills
bun x vitest run --config vitest.config.slow.ts src/test/megaplan/skillPathScan.guard.slow.test.ts
bun run lint                              # record current state
```

**Phase B — write `.claude/skills/perf-audit/SKILL.md`** per the outline below.

**Phase C — post-write gates (must stay green):**
1. `node scripts/skill-path-scan.mjs` — every repo path cited in the new SKILL.md resolves
2. `bun x vitest run --config vitest.config.slow.ts src/test/megaplan/skillPathScan.guard.slow.test.ts` — same gate via vitest
3. `bun run lint`
4. **Doc-conformance run:** execute each command the skill prescribes exactly as written (`bun scripts/scan-in-loop.mjs`, `bun scripts/entries-in-loop.mjs`, `bun scripts/srp-census.mjs`, `bun scripts/function-length.mjs`, `bun scripts/param-count.mjs`) — all write only to gitignored `scripts/out/`; a command that fails invalidates the doc, fix it
5. **Claim checklist:** walk the "APPROVED" table above — every mechanism cited in the SKILL.md must trace to a real file (re-grep `findWarriorById`, `ensureEntityIndex`, `buildWeekCaches`, `stripNonSerializable`, `REGISTRY`, `useVirtualizer`, `useListShell`, `manualChunks`, `autoCodeSplitting` at write time)

`bun run test` is listed as optional last — it covers no `.claude` paths, but it's the house default and cheap insurance against surprise interactions.

## Skill content outline (corrected)

Frontmatter: `name: perf-audit` + trigger-rich description in the house style (hunting speedups, auditing hot paths, week-advance / bout-resolution / UI-render slowness, perf-regression review, before/after a perf fix). Names the scan → triage → measure → fix → verify workflow and the determinism cautions.

### Phase 1 — Scan
- `bun scripts/scan-in-loop.mjs` — `.find/.findIndex/.filter/.some/.includes/.indexOf` executing per loop iteration → `scripts/out/scan-in-loop.json`
- `bun scripts/entries-in-loop.mjs` — `Object.entries` rebuilt per iteration → `scripts/out/entries-in-loop.json`
- Secondary censuses: `srp-census.mjs`, `function-length.mjs`, `param-count.mjs`
- Suppression (differs from Basho): no inline ignore — register in `KNOWN_EXCEPTIONS` (`src/test/megaplan/scanInLoop.guard.test.ts` / `entriesInLoop.guard.test.ts`), file+code-substring keyed, `why` >20 chars, no placeholder reasons; **bidirectional ratchet** — stale entries must be deleted, missing entries must be added, never either-way inflated
- Manual grep recipes for what the AST scan misses: `.find(... => .id ===` (→ `findWarriorById`/`getWarriorIndex`/week caches), spread-in-accumulator, `.filter().map()` chains, sort/filter/reduce in `.tsx` render bodies — aimed at the big collections: `state.arenaHistory`, `state.rivals`, `state.ledger`, `graveyard`/`retired`/`deadWarriorIds`, `killEvents`, `matchHistory`, `newsletter`/`gazettes`

### Phase 2 — Triage (cardinality rubric)
- Small-N leave-alone: `state.roster` (~dozens), `rival.roster`, bout `warriorIds` (≤2), style/severity/`PERSONALITY_CLASH` tables, per-iteration collections (`tags`/`injuries`/`seasonalGrowth`/`analysis.factors`), string `.includes`, mutation-during-iteration, early-exit scans
- Real hotspots: `state.rivals` (up to ~160 stables), `state.arenaHistory` (append-only `FightSummary[]`, never shrinks), `deadWarriorIds`/`killEvents`/`ledger`/`matchHistory` — the expensive signature is `rivals × arenaHistory` per week
- Hot-path tiers: (1) `pipeline/passes/*Pass.ts` + `rivalStableShard*` (`rivalStrategy` ≈56% of week per baseline), (2) `engine/combat/**` + `engine/bout/**` per bout, (3) `pipeline/tick/**` + `weekPipeline/**` per advance, (4) `state/selectors.ts` + components/pages/hooks per render, (5) worker/pool boundary (`postMessage` clones full GameState per Comlink job), (6) one-shot modals last

### Phase 3 — Measure
- `bun run test:slow` → `src/test/perf/pipeline.perf.slow.test.ts` + `rivalStrategyPass.perf.slow.test.ts`
- `bun scripts/soak.mjs --weeks 40 --profile` → per-pass total/avg/max ms + `scripts/out/baseline.json` (harness ms/wk ≠ bare `advanceWeek` rows — different overhead, never cross-compare)
- `bun scripts/parallel-bench.mjs` — pool ship gate (currently 0.33× FAIL; `docs/engineering/pipeline-parallelism.md`)
- `docs/engineering/pipeline-baseline.md` — canonical comparison table; update it when landing a real win
- `bun --cpu-prof` (the B3 precedent); idle-machine rule; Bun(JSC)-vs-Electron(V8) caveat — big-O transfers, shape/IC micro-opts verify under V8
- UI cost via React DevTools Profiler / render counter; bundle weight via `bun run build` chunk table

### Phase 4 — Fix recipes
- `keySet`/`indexBy`/`groupBy` (`src/utils/collections.ts`) — first-wins/insertion-order semantics match `find`/`filter`/`includes`
- Lookups → `findWarriorById`/`getWarriorIndex`/`searchEntities` (`src/engine/core/entityIndex.ts`) or week caches `state.warriorMap`/`warriorToStableMap`/`rivalMap`/`rivalryMap`/`grudgeMap`. **Identity trap:** WeakMap keyed on state object — pass the real state, never a fresh literal
- **New module-level cache → `moduleCacheRegistry.test.ts` REGISTRY entry is mandatory** (unregistered = test failure), plus the mental model: per-context module instances + `jobQueue` serialization make identity-keyed caches safe
- New per-week state cache → `stripNonSerializable` + `buildWeekCaches` + `CACHE_TOUCHING_KEYS` (`weekPipeline/caches.ts`); gated by `weekCacheFreshness`/`rivalMapStaleness`
- WeakMap-memo precedents (all in REGISTRY): `entityIndex.indexCache`, `arenaFit.underservedByHistory`, `schedulingAssistant/headToHead.h2hByHistory`, `historyUtils.fightsByWarrior`, `warriorStatus.deadIdSetCache`, `stableCouncilService.reportCache`; `STYLE_INDEX` map at `src/constants/combat/combat/matchup.ts`
- Generic: hoist loop-invariants, single-pass over `.filter().map()`, `Set`/`Map` accumulation, cheap-predicate-first + early exit, merge-join, top-k
- UI (corrected): no React Compiler — `useMemo`/`useCallback`/`memo` legitimate after measuring; `useShallow` selectors (`src/state/selectors.ts`); `useVirtualizer` for long lists (4 precedents; needs the `react-hooks/incompatible-library` disable comment); type-ahead = `useListShell` windowing + `useShallow` `searchEntities` — **`useDeferredValue` has no local precedent, measured cases only**; code-split via `autoCodeSplitting` + `manualChunks` + the 3 `React.lazy` sites; stable `data=` into Recharts; `loadCombatNarrative` lazy-init

### Phase 5 — Verify
- Scanner re-run: fixed or justified `KNOWN_EXCEPTIONS` (bidirectional — remove stales too); `bun run format && bun run lint && bun run type-check && bun run test`; `bun run test:slow` on pipeline/pool/determinism paths (byte-identical); same-harness before/after; update `pipeline-baseline.md`; new perf coverage → `src/test/perf/*.perf.slow.test.ts`

### Determinism cautions
- `ctx.rootRng` order/count fixed; shard seeds position-independent (`docs/engineering/rng-policy.md`); Map/Set insertion-ordered iteration only; passes return `StateImpact`s never mutate snapshot; bout changes → `combat-domain`/`combat-balance` first

### Cross-links
`sim-diagnostics`, `determinism-debug`, `week-pipeline`, `guard-ratchet`, `write-engine-test`, `verify-implementation`, `bolt`/`perf-auditor` agents (`.claude/agents/`).

## Risks/Considerations

- Skill-doc drift: `skill-path-scan` catches dead paths but not stale numbers — tie figures to `pipeline-baseline.md`, don't hardcode new ones.
- Description kept to house-style single trigger-rich sentence. Scope = ONE skill; other Basho files were format references only.
- The `moduleCacheRegistry` requirement is the least-obvious gate — a perf PR following this skill's caching advice will fail CI without it; the skill must make it unmissable.
