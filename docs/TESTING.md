# Testing Guide

How to write, place, and run tests in this repo.

## Layout

All tests live under `src/test/` mirroring the production tree:

```
src/test/
  _fixtures/factories.ts   shared entity builders (schema-valid)
  _mocks/                  shared mock modules (synchronous only — see below)
  _setup/                  setup.node.ts + setup.dom.ts, bun-setup.ts,
                           runnerGroups.json, auditBaseline.json, sentinels
  config/                  meta tests: runner safety, env canaries, build integrity
  components/  pages/  routes/  hooks/  state/   UI-side tests (jsdom pragma)
  engine/  lib/  utils/  data/  scripts/         engine/logic tests (node env)
```

Rules:

- **Never colocate tests** next to source (`src/engine/foo.test.ts`). The
  structural audit fails on any test file outside `src/test/`.
- Mirror the production path: `src/engine/ai/workers/competitionWorker/foo.ts`
  → `src/test/engine/ai/workers/competitionWorker/foo.test.ts`.

## Environments

`vitest.config.ts` uses `environment: 'node'` globally.

- Writing a test that renders or touches `document`/`window`? Add
  `// @vitest-environment jsdom` as the first line.
- The audit gate flags DOM-consuming files missing the pragma.
- `bun test` always runs with jsdom installed (bun-setup.ts) — pragmas are
  vitest-only and do not affect Bun.

## Factories

Use `src/test/_fixtures/factories.ts` builders instead of local `make*`
helpers. The audit gate allows thin per-file adapters that _delegate_ to a
fixture builder (or to a production factory under `@/engine/factories/`,
e.g. `makeWarrior` from `warriorFactory`), but fails on real local factory
implementations — including `function`-declared and block-bodied ones.

Local factories remain acceptable only when no shared builder exists for the
type (e.g. domain contexts, plan objects) or the factory carries real logic —
and such files must be allowlisted in `src/test/_setup/auditBaseline.json`.
Current residuals: 3 files (seeded-RNG fighter pairs, equipment loadouts,
an inner bracket generator).

## Slow tests

Files named `*.slow.test.{ts,tsx}` are excluded from the default suite
(`bunx vitest run`), from `bun test` (`bunfig.toml` `pathIgnorePatterns`),
and from `test:coverage`; they run in the dedicated slow suite
(`bun run test:slow`, nightly CI `slow-tests` job) and in `bun run test:all`.

The default suite is the fast inner loop — keep it fast. Promote a test to
`.slow` when it:

- simulates many weeks / runs a balance or determinism harness
- `execSync`s a subprocess (build, validator script, `npx tsx`, …)
- exceeds ~2s wall time (the suite is audited periodically for >5s
  stragglers — demote by renaming to `.slow.test.ts`, then regenerate
  `runnerGroups.json` via `bun scripts/test-audit-scan.mjs`)

The slow suite is **not** a per-PR gate. It runs nightly and on
`workflow_dispatch` in `.github/workflows/nightly.yml`; run it locally when
a change touches the sim/pipeline/economy paths those files cover, or
before merging work that could shift long-horizon behavior.

## E2E tiers

Playwright runs in two tiers:

- `bun run e2e` — fast tier: chromium only, skips `@slow`-tagged specs via
  `--grep-invert @slow`. This is the default verification for UI changes
  and the CI `e2e` job.
- `bun run e2e:all` — full matrix: all 5 projects (chromium, firefox,
  webkit, Mobile Chrome, Mobile Safari) including `@slow` specs. Ad hoc
  only; also runs nightly per-browser shard in `nightly.yml`.

Tag a spec `{ tag: '@slow' }` when it drives a long session (e.g.
`seasonal-tournament`'s full-year soak, ~17 min locally). When in doubt,
keep new e2e specs in the fast tier — short navigations and assertions,
no multi-week advances.

## Runner parity

- `bunx vitest run` — default suite (CI `test` job)
- `bun test --isolate` — `bun run test:bun` (CI `bun-test` job)
- `bunx vitest run --config vitest.config.slow.ts` — slow suite
  (nightly `slow-tests` job, or `bun run test:slow`)
- `bunx vitest run --config vitest.config.all.ts` — everything, isolated
- `bunx vitest run --coverage` — v8 coverage, fails below `coverage.thresholds`
  in `vitest.config.ts` (CI `coverage` job)
- `bun run electron:compile` — electron main bundle (CI `electron` job)
- `bun run e2e` — chromium smoke, `@slow` excluded (CI `e2e` job)
- `bun run e2e:all` — full browser matrix + `@slow` (nightly `e2e-matrix`
  job, or ad hoc)

Bun caveats (enforced by `bunRunnerSafety.test.ts`):

- `vi.mock(path, () => import(...))` — async module factories **deadlock**
  bun:test. Mock factories must be synchronous. Shared `_mocks/` files must
  never dynamic-import.
- `vi.hoisted` is a passthrough shim under bun — fine for sync values only.

## Isolation

`vitest.config.ts` runs two projects:

- **`shared`** — pure-node tests run with `isolate: false` in a shared worker
  (~2× faster). A file qualifies only if it uses no `vi.mock`/`mock.module`,
  no global stubs (`vi.stubGlobal`, `globalThis.X =`, `defineProperty(global…)`),
  no DOM, and no jsdom pragma.
- **`isolated`** — everything else keeps per-file workers.

Membership is generated by `scripts/test-audit-scan.mjs` into
`src/test/_setup/runnerGroups.json` and drift-guarded by
`testQualityAudit.test.ts`. When static detection can't prove a file safe
(e.g. it awaits singleton-driven work), pin it to the isolated project with
a `// @vitest-isolate` comment at the top.

`setup.node.ts` resets known singletons after every test (engineEventBus,
NewsletterFeed, idCounter, useGameStore, arena registry, engine-pool size +
instance, module caches). Covered by `src/test/_setup/stateReset.test.ts`
sentinels — add a sentinel when you introduce a new global singleton.

Never statically import a broad production graph into a setup file to reset
it: the eager import defeats `vi.mock` in test files that mock the graph.
Use a dynamic `await import()` inside `afterEach` (see the `enginePool` and
`useGameStore` resets).

## Structural audit

`src/test/testQualityAudit.test.ts` enforces:

- no colocated test files
- no same-module basename duplicate pairs
- no local entity factories (delegating adapters OK)
- DOM tests carry an explicit env pragma (`jsdom`; a deliberate `node` pragma
  is a valid opt-out for absence-assertions)
- no `vi.mock(() => import())` deadlock pattern

Allowlists live in `src/test/_setup/auditBaseline.json` and are
**shrink-only**: fixing a violation requires deleting its entry (the gate
fails on stale entries). Regenerate after intentional changes:

```
bun scripts/test-audit-scan.mjs
```

## Code hygiene scans

Three complementary, report-only scanners (none gate CI):

| Command                       | Tool   | Detects                                                                     |
| ----------------------------- | ------ | --------------------------------------------------------------------------- |
| `bun run dead-code`           | knip   | Unused files, exports, exported types, dependencies, duplicate exports      |
| `bun run dead-code:report`    | knip   | Same, as JSON → `scripts/out/knip-report.json`                              |
| `bun run dupes`               | jscpd  | Copy-pasted blocks ≥10 lines / 100 tokens → `scripts/out/jscpd/`            |
| `bun scripts/orphan-scan.mjs` | custom | Domain audit: state-field liveness, route/nav links, test-only reachability |

Division of labor: knip is the canonical unused-code check (compiler-accurate);
orphan-scan.mjs covers the domain-specific checks knip can't; jscpd covers
duplication for consolidation sweeps. Config lives in `knip.json` and
`.jscpd.json`.
