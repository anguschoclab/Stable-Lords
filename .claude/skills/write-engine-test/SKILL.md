---
name: write-engine-test
description: Write a test that survives this repo's audit gates and lands in the right tier. Use whenever adding tests — decides fast vs slow vs e2e placement, enforces the src/test/ mirror-tree + domain-conformance filing rules, factories.ts discipline, GUARD_REGISTRY registration, jsdom pragma and bun-parity mock rules, seeded-RNG determinism, and the no-tautological-assertion rule. A test written the naive way here fails testQualityAudit even when its assertions pass. Full conventions live in docs/engineering/testing.md.
---

# Writing Tests for This Repo

The suite is audited structurally (`src/test/testQualityAudit.test.ts`) — a test
that passes its own assertions can still fail the suite for where it lives, what
it's named, what it imports, or how it mocks. Get the placement right first.

## 1. Pick the right tier and location

| Tier           | Location                                                                                                                                | Runs via                                                       | Belongs here                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Fast (default) | `src/test/<domain>/…` mirroring the subject path                                                                                        | `bun run test` — every change                                  | Pure logic, single-week ticks, UI components                                              |
| Slow           | `src/test/<domain>/*.slow.test.ts` (`.slow` must be **terminal**: `foo.integration.slow.test.ts`, never `foo.slow.integration.test.ts`) | `bun run test:slow` — nightly CI, not a per-PR gate            | Many-week sims, balance/determinism harnesses, subprocess tests, >~2s wall time           |
| E2E            | `e2e/*.spec.ts`                                                                                                                         | `bun run e2e` (chromium, `@slow` excluded) / `bun run e2e:all` | Browser flows; `{ tag: '@slow' }` when `test.setTimeout` >5min or it drives long sessions |
| Perf           | `src/test/perf/`                                                                                                                        | perf runs                                                      | Timing gates                                                                              |

- **Mirror the production path:** `src/engine/pipeline/passes/EventPass.ts` →
  `src/test/engine/pipeline/passes/EventPass.test.ts`. Never colocate tests
  next to source.
- **Domain conformance:** a test under `src/test/<cat>/` must import at least
  one module from that domain (`engine/` → `src/engine`, `components/` →
  `src/components|src/pages`, `data/` → `src/data`, `state/` → `src/state`, …).
  Misfiled tests get moved, not allowlisted.
- **Subprocess rule:** spawn only inside `it`/`beforeAll` — a describe-scope
  `execSync` fires during collection on every filtered run and escapes the
  timing baseline. Heavy subprocess tests belong in `.slow` files.

## 2. Factories — shared builders or nothing

- Use `src/test/_fixtures/factories.ts` (schema-valid builders) or thin
  per-file adapters that **delegate** to it / to a production factory under
  `@/engine/factories/` (`createFreshState` from
  `src/engine/factories/gameStateFactory.ts` is the canonical world builder).
- The audit fails on real local `make*` factory implementations — including
  `function`-declared ones. Local factories survive only via the shrink-only
  allowlist in `src/test/_setup/auditBaseline.json` (3 residuals — don't add).
- `resetFixtureIds()` exists when deterministic ids matter.

## 3. Guard specs (structural ratchets)

- Live in `src/test/megaplan/` — scanner-backed audits (`*.guard.test.ts` /
  `*.guard.slow.test.ts` when they exec a scanner subprocess).
- **Every guard must register** in `GUARD_REGISTRY`
  (`src/test/testQualityAudit.test.ts`) as `LIVE_RATCHET` or `RETIRE` —
  unregistered guard files fail the suite.
- After adding a guard, regenerate `src/test/_setup/runnerGroups.json` +
  `src/test/_setup/auditBaseline.json` via `bun scripts/test-audit-scan.mjs`.
- See the `guard-ratchet` skill for the scanner+report+guard+allowlist pattern.

## 4. Environment & runner rules

- Config: `vitest.config.ts` runs `environment: 'node'` with two projects —
  `shared` (`isolate: false`, fast) and `isolated`. DOM-touching tests need
  `// @vitest-environment jsdom` as the **first line** (audit-enforced); pin to
  the isolated project with `// @vitest-isolate` when shared-mode detection
  can't prove safety (singleton-driven work).
- **Bun parity** (`bun run test:bun`): `vi.mock(path, () => import(...))`
  async factories **deadlock** bun:test — mock factories must be synchronous;
  `vi.hoisted` is a passthrough shim (sync values only); `_mocks/` files must
  never dynamic-import.
- Global singletons are reset by `src/test/_setup/setup.node.ts`; add a
  sentinel to `src/test/_setup/stateReset.test.ts` when you introduce a new
  one — and reset via dynamic `await import()` inside `afterEach`, never a
  static import (it defeats `vi.mock`).
- Default timeout is 30s. A test that needs more is a misplaced test — move it
  to `.slow`, don't raise its timeout.

## 5. Determinism & assertions

- **Seeded RNG only** in code under test — `ctx.rootRng` in pipeline passes,
  fixture stub rngs like `makeStubRng` (`src/test/_fixtures/offseasonCtx.ts`)
  for branch coverage. Never `Math.random()`/`Date.now()`/`crypto.*` — that's
  the suite's core guarantee (see `determinism-debug`).
- **Write a real assertion, not a tautology.** Asserting properties of a
  static table proves nothing. Exercise the actual engine path the way
  production calls it — e.g. `simulateFight`
  (`src/engine/simulate/simulateFight.ts`), a pipeline pass returning a
  `StateImpact`, a slice action mutating the store — and observe the outcome.
  See `verify-implementation` for the empirical-check pattern.
- Fixture-driven tests for handlers/passes follow the precedent in
  `src/test/engine/pipeline/` (`makeOffseasonCtx()` + `makeStubRng({...})`
  overriding `roll`/`pick`/`next` to hit each branch).

## 6. Before you commit

- `bun run test -- <path>` your file, then the domain dir, then the suite.
- If you touched naming/tiers/factories, expect `testQualityAudit` to weigh in —
  regenerate `runnerGroups.json`/`auditBaseline.json` when the change is
  intentional (shrink-only baseline: fixing a violation requires deleting its
  entry, and stale entries fail the gate).
- Coverage floors (`bun run test:coverage`): statements 84 / branches 74 /
  functions 78 / lines 85.5 — `vitest.config.ts` thresholds.
