# Test Suite Audit Ledger

Metrics and dispositions for the audit/optimization/reorganization pass
described in `TEST_SUITE_AUDIT_PLAN.md`. Date: 2026-10-08.

## Baseline vs after

| Metric | Before | After |
| --- | --- | --- |
| Default-suite files | 802 | 799 |
| Default-suite tests | 8,881 | 8,867 |
| Slow-suite files | 41 | 41 |
| `bunx vitest run` wall time | 63.5s | 52.9s |
| jscpd clones inside src/test | 0 | 0 |
| knip unused test files | 0 | 0 |
| orphan-scan test-only-reachable prod modules | 0 | 0 |
| Category-misplaced test files | 22 | 2 (allowlisted) |
| Audit guards | 8 | 11 |

## Phase 1 — Obsolescence

Automated surface was already clean: knip reports no unused test files,
orphan-scan reports zero test-only-reachable prod modules, and the only
`dead` patterns in `test-audit.json` were false positives
(`skipCount.guard.test.ts` matches `it.skip(` inside the regexes it enforces;
`bunViCompat.test.ts` asserts on `it.skipIf`, which is not a skip).

Dispositions:

- `vitest4Compat.test.ts` → renamed `vitestCompat.test.ts`, comments fixed —
  a v4-specific name on a vitest 5 suite was stale; the canary itself still
  earns its place.
- `environmentNodeCanary` / `environmentSplitCanary` — KEEP, distinct
  purposes (the importSetClusters pair is coincidental; both guard the
  node/jsdom env split contract).
- The 69 zero-prod-import files are scanner-style audits (fs/source-text
  assertions) — a deliberate pattern, not dead tests.

## Phase 2 — Consolidation

- `narrativeUnionV7` + `V9` + `V10` → merged into
  `src/test/data/narrativeUnion.test.ts` (30 tests preserved verbatim, shared
  `allStrings`/`leafArrays`/`key`/`leaf` helpers deduplicated).
- `hitLocation.coverage.test.ts` → folded into `hitLocation.test.ts`: kept
  the four unique branches (pick/exposed-pick fallbacks, `protectCovers('')`,
  spy-based `exposed.length === 0`), dropped ~16 assertions that duplicated
  existing describes with differently-cased inputs. 42 tests green.
- Evaluated and kept separate: `WarriorLeaderboardVirtualized` +
  `Branch` (different vi.mock of useVirtualizer — merging would cross a mock
  boundary), `intentEngine.*` and `trait*` clusters (distinct aspects of the
  same module — same-import ≠ same-subject).

## Phase 3 — Reorganization

- 21 files moved to their subject's domain (`git mv`): 6 page/component hooks
  → `pages/*/hooks/` + `components/ledger/*/hooks/`; constants/data-driven
  engine stragglers → `constants/` (4), `data/equipment/` (4) +
  `data/seasonalEventHandlerCoverage`; `state/fightSummarySchema` +
  `engine/ai/enumSourcesSync` → `schemas/`; `awardsOptimization` → `utils/`.
- Legacy `src/test/equipment/` dir folded into `src/test/data/equipment/`
  (removed dir; mirrors `src/data/equipment`).
- Remaining residuals: `state/lastWeekBoutDisplay` (state round-trip test —
  schema+truncation are mechanics, not subject) and `engine/grudgeMap`
  (engine behavior using serialization utils). Allowlisted in
  `auditBaseline.json.misplacedCategoryFiles`.

## Phase 4 — Performance

- **jsdom pragma audit:** 6 files carry `jsdom` pragma with no static DOM
  signal; all six render indirectly via helpers (`routeTestHelper`,
  `import.meta.glob` wiring) — true positives, no pragma removals. Env-time
  wins come only from DOM-file consolidation, not annotation fixes.
- **setup.node.ts eager imports:** converted 7 static prod imports
  (warriorLookup, historyResolver, narrative, EventBus, idUtils,
  serialization, arenas) to lazy `await import()` inside hooks — the file's
  own documented rule. 9 test files `vi.mock` those exact modules and were
  exposed to mock-defeat. Verified green on sentinel + mock-heavy specs.
- **`vmThreads`:** measured and rejected (2026-10-08): environment 30%→3% but
  wall +20% (76.2s vs 63.5s) and 27 failures — `global.window =` assignment
  breaks on VM-context getter-only globals. Do not retry without first fixing
  the window-stub pattern AND the transform-time regression.
- **`isolate: false`:** already at its provable-safe maximum; the `isolated`
  project exists precisely for files where sharing a registry breaks mocks.
- **bun-test CI shard:** KEEP — the double run is the only coverage of the
  bun↔vitest shim layer (`bunViPolyfill`, `bunRunnerSafety` contract). Slow
  tests are already excluded from it via `bunfig.toml`.
- **Ratchet:** post-demotion max file in the default suite is ~4.6s
  (`engine/rivals/namePool`); >5s files are demote-on-detection per
  TESTING.md.

## Phase 5 — Guards

New `testQualityAudit.test.ts` checks (3):

- `.slow` terminal suffix position
- category-domain conformance via import analysis (baseline allowlist:
  `misplacedCategoryFiles`, emitted by `test-audit-scan.mjs`)
- e2e marathon specs (`test.setTimeout` > 5min) must carry `@slow`

Docs updated: `docs/TESTING.md` (layout/conformance/suffix rules, audit list),
`.claude/CLAUDE.md` (Testing Discipline → domain filing).
