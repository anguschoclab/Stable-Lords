# Testing Guide

How to write, place, and run tests in this repo.

## Layout

All tests live under `src/test/` mirroring the production tree:

```
src/test/
  _fixtures/factories.ts   shared entity builders (schema-valid)
  _mocks/                  shared mock modules (synchronous only — see below)
  _setup/                  setup.ts, bun-setup.ts, baseline, sentinels
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
helpers. The audit gate allows thin per-file adapters that *delegate* to a
fixture builder, but fails on real local factory implementations.

Local factories remain acceptable only when no shared builder exists for the
type (e.g. domain contexts, plan objects) or the factory carries real logic —
and such files must be allowlisted in `src/test/_setup/auditBaseline.json`.

## Slow tests

Files named `*.slow.test.ts` are excluded from the default suite
(`bunx vitest run`) and from `bun test`; they run in the dedicated slow suite
(`bun run test:slow`, CI `slow-tests` job) and in `bun run test:all`.

Promote a test to `.slow` when it simulates many weeks, execSyncs tooling,
or exceeds ~2s wall time.

## Runner parity

- `bunx vitest run` — default suite (CI `test` job)
- `bun test --isolate` — `bun run test:bun` (CI `bun-test` job)
- `bunx vitest run --config vitest.config.slow.ts` — slow suite
- `bunx vitest run --config vitest.config.all.ts` — everything, isolated

Bun caveats (enforced by `bunRunnerSafety.test.ts`):

- `vi.mock(path, () => import(...))` — async module factories **deadlock**
  bun:test. Mock factories must be synchronous. Shared `_mocks/` files must
  never dynamic-import.
- `vi.hoisted` is a passthrough shim under bun — fine for sync values only.

## Isolation

`isolate: false` is **off by design** — measured during the Phase-5 audit:
shared module registries break `vi.mock` interception and mixed-env RTL
unmount. Do not re-enable.

`setup.ts` resets known singletons after every test (engineEventBus,
NewsletterFeed, idCounter, useGameStore, module caches). Covered by
`src/test/_setup/stateReset.test.ts` sentinels — add a sentinel when you
introduce a new global singleton.

## Structural audit

`src/test/testQualityAudit.test.ts` enforces:

- no colocated test files
- no same-module basename duplicate pairs
- no local entity factories (delegating adapters OK)
- DOM tests carry the jsdom pragma
- no `vi.mock(() => import())` deadlock pattern

Allowlists live in `src/test/_setup/auditBaseline.json` and are
**shrink-only**: fixing a violation requires deleting its entry (the gate
fails on stale entries). Regenerate after intentional changes:

```
bun scripts/test-audit-scan.mjs
```
