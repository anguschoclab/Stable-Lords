# Test Suite Audit Ledger

Metrics and dispositions for the audit/optimization/reorganization pass
described in `TEST_SUITE_AUDIT_PLAN.md`. Date: 2026-10-08.

## Baseline vs after

| Metric                                       | Before | After           |
| -------------------------------------------- | ------ | --------------- |
| Default-suite files                          | 802    | 799             |
| Default-suite tests                          | 8,881  | 8,867           |
| Slow-suite files                             | 41     | 41              |
| `bunx vitest run` wall time                  | 63.5s  | 52.9s           |
| jscpd clones inside src/test                 | 0      | 0               |
| knip unused test files                       | 0      | 0               |
| orphan-scan test-only-reachable prod modules | 0      | 0               |
| Category-misplaced test files                | 22     | 2 (allowlisted) |
| Audit guards                                 | 8      | 11              |

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

---

## Wave 2 — 2026-10-22

Baseline (fresh scans; plan `TEST_SUITE_AUDIT_PLAN.md` §"Wave 2"; findings
`TEST_AUDIT_FINDINGS.md` §5). Restore tag: `pre-test-audit-v2`.

| Metric | Before (wave-1 close) | Wave-2 baseline | Target |
| ------ | --------------------- | --------------- | ------ |
| Default-suite files | 799 | **880** | — |
| Default-suite tests | 8,867 | **9,469** (0 fail, 2 deliberate pending) | green |
| `bunx vitest run` wall | 52.9s | ~66s (V18 baseline 10-21) | measured wins, no hard target |
| Files >2s / >5s | 23 >2s (stale TSV) | **52 / 11** | tail drained or demoted |
| jscpd clones in `src/test` | 0 (repo-wide run) | **88** (scoped run — new canonical measure) | 0 or EXEMPT-registered |
| dup-scan TEST_DEBT pairs | 150 registered → budget 70 | **70 remaining** | 0 |
| importSetClusters | 37 | 37 | distinct-subject groups only |
| basenameCollisions / missingPragma | 0 / 0 | 0 / 0 | hold |
| Category-misplaced files | 2 allowlisted | 2 + **layout/ dir drift (2 files, unguarded)** | conform |
| Non-taxonomy qualifier files | unguarded | **48** | ratcheted via word rule |
| CI bun-test shard coverage | unknown | **70 non-slow files unsharded** | 0 |
| megaplan guards | — | **28, all LIVE_RATCHET** | registered via T6 |
| Audit guards (testQualityAudit checks) | 11 | 11 | +T1–T5 (+T6 registry) |

### Phase 0 — baseline freeze

- Tag `pre-test-audit-v2`; `scripts/timings-to-tsv.mjs` landed;
  `baseline-test-timings.tsv` regenerated → 888 rows (880 fresh default rows +
  8 preserved slow rows pending a slow-suite refresh).
- Gate matrix recorded.

### Phase 1 — detection & disposition

- Disposition tables populated in `TEST_AUDIT_FINDINGS.md` §5b–§5e.
- All 28 `megaplan/` guards classified **LIVE_RATCHET** — zero retirements
  (every guard still names a live invariant; none superseded).
- `clickNavLink` verdict: unused **export**, not dead code — `navigateNavLink`
  calls it internally → Phase-3 fix = un-export, not delete.
- Obsolescence surface clean: orphan-scan 0 test-only-reachable modules,
  knip 0 unused test files → no test/subject paired deletions required.
- jscpd 88 clones, 37 importSetClusters, 70 TEST_DEBT pairs triaged into
  merge / extract / exempt queues.

### Phase 2 — contract construction (hard gate)

All of T1–T9 landed before implementation began:

- `testQualityAudit` extended: T1 suffix-taxonomy (`^[a-z][a-zA-Z]+$`
  qualifier word rule — all 48 drift files admitted, zero renames needed),
  T2 dir-registration (`CATEGORY_DOMAIN` ∪ `NON_MIRROR_DIRS`), T3 `lore` map
  entry, T4 ci.yml shard-coverage check, T5 bunfig↔slow sync, T6
  `GUARD_REGISTRY` lifecycle (LIVE_RATCHET | RETIRE→successor).
- T7 merge-parity harness: `scripts/test-title-diff.mjs` (JSON titles pre/post).
- T8 ticketed contracts: `src/test/megaplan/testSuiteAudit.guard.test.ts`
  (MEGAPLAN-A1…A5).
- T9 setup sentinels: `src/test/_setup/setup.regression.test.ts` pins the
  avatar-catalog stub's required presence in the node project.
- RED progression observed exactly as planned (T2/T3 on layout+lore, T4 on
  the 70-file shard gap, T6 on the then-unregistered V19 guards).

### Phase 3 — deletions & retirements

- `e2e/helpers.ts`: `clickNavLink` un-exported (internal to `navigateNavLink`).
- `_setup/fsHelpers.ts` deleted; its 5 importers repointed to the canonical
  `_helpers/fsWalk.ts` — resolves the triple fs-walk duplication
  (`testQualityAudit`'s inline walker swapped for the shared helper too).
- Zero guard retirements (all LIVE_RATCHET); zero test deletions (no dead
  subjects found — see Phase 1).

### Phase 4 — duplication & consolidation

- **TEST_DEBT_PAIRS: 70 → 0.** Drained via shared fixtures
  (`_fixtures/competitionWorker.ts`, `bidRoster.ts`, `arenaTitle.ts`,
  `determinism.ts`, `statWarrior.ts`, `equipmentLoadout.ts`, `intelDossier.ts`,
  `dashboardTabState.ts`, `offseasonCtx.ts`, `offerCard.ts`, `eventLog.ts`,
  `combatFighter.ts`, `signedBout.ts`, `factories.ts` additions) and shared
  mock modules (`_mocks/framerMotion`, `archiveService`, `bookmarkStore`,
  `uiMeta`, `entityLinkDeps`, `warriorTrainingDeps`, `gameStoreSelector`,
  `bookmarkButton`).
- Residual pairs reclassified where duplication is intentional:
  `TEST_EXEMPT_PAIRS` += unavoidable `vi.mock`/import preambles and
  characterization literal pins (enum-sync, canonical-string specs).
- test↔test live-pair baseline ratcheted **79 → 12** (all EXEMPT-registered;
  shrink-only ratchet holds).
- jscpd `src/test`: **88 clones / 1.02% → 73 clones / 0.86%**; remaining
  clones are sub-threshold fragments not present in the strict dup-scan
  ledger (which gates at 0 DEBT).
- importSetClusters: 37 → all dispositioned **keep** — the clusters are
  forced-separate by `vi.mock` file isolation (virtualized branch specs,
  `.perf` gates, `.triggers`, A11y); subject substance drained into fixtures.
- Mixed (src↔test) pairs: 17 → EXEMPT verdicts recorded (literal pins).

### Phase 5 — structural moves & CI fix

- `git mv src/test/layout/breadcrumbs/*` → `src/test/components/layout/`
  (T3 GREEN); `TEST_EXEMPT_PAIRS` path updated in-commit (live-ledger rule).
- `.github/workflows/ci.yml` bun-test shard: hardcoded dir list →
  `find`-driven enumeration with per-subdir engine split + engine-root shard
  (T4 GREEN; the 70 uncovered files — incl. `bunViCompat.test.ts`, the
  bun-parity canary itself — are now sharded; gap cannot silently regrow).
- `megaplan/` formalized as the permanent structural-guard home in
  `docs/TESTING.md`, with the guard-lifecycle registry contract documented.
- `runnerGroups.json` / `auditBaseline.json` regenerated.

### Phase 6 — profiling & optimization (measured)

- **Tail:** re-measured the 11 baseline >5s files — all ≤1.9s after the
  Phase-4 drains + shared-project `isolate:false` coverage → **0 demotions
  needed** (no coverage-floor risk taken; slow tier stays at 41 files).
- **Setup surgery (A5): measured-and-REJECTED.** Moving the
  fetch-stub/avatar-catalog `beforeEach` out of `setup.node.ts` broke 16
  node-env specs across 5 files (`avatarGenerator` et al. legitimately
  exercise the catalog without rendering) — the stub is needed in both
  projects. Sentinel A5 now pins that decision.
- `vmThreads`, `isolate:false` widening: remain measured-and-rejected
  (Oct-8 data stands).
- **Result:** default-suite tail collapsed — **0 files >5s** (was 11),
  p99 6.2s → 1.4s, wall ~66s → ~53s.
- e2e: chromium smoke (5 specs) remains the push-tier inner loop; matrix +
  @slow marathons live in nightly — no shard needed at current size.

### Phase 7 — close-out

- `docs/TESTING.md`: qualifier word rule, `lore`/`layout` filing,
  `NON_MIRROR_DIRS` registry, dynamic-shard note, guard-lifecycle registry.
- `GUARD_REGISTRY` updated in-commit as guards appeared
  (`v19Dedup`/`v19Srp` registered when they landed).
- Regressions caught by the new contracts and fixed in-campaign:
  `TornadoEffect` lost `rounded-sm` during a refactor → restored;
  3 `competitionWorker` specs lost direct subject imports via fixture
  extraction → subject-declaring imports restored (T-category check GREEN).
- Baselines regenerated: `auditBaseline.json` (unregisteredTestDirs: 0),
  `baseline-test-timings.tsv` (891 rows: fresh default + preserved slow rows).

### Wave-2 final metrics

| Metric | Wave-2 baseline | Wave-2 final |
| ------ | --------------- | ------------ |
| Default-suite tests | 9,469 | 9,493 (9,491 pass, 0 fail, 2 deliberate pending; +24 net from new guard/contract specs) |
| `bunx vitest run` wall | ~66s | ~53s |
| Files >5s | 11 | **0** |
| Files >2s | 52 | **2** (fresh TSV, 888 default rows) |
| p50 / p90 / p99 | 38ms / 1.49s / 6.2s | **10.6ms / 357ms / 1.40s** |
| dup-scan TEST_DEBT pairs | 70 | **0** |
| test↔test live pair baseline | 79 | **12** (all EXEMPT) |
| jscpd `src/test` | 88 / 1.02% | 73 / 0.86% |
| CI bun-test shard gap | 70 files | **0** (find-driven) |
| testQualityAudit checks | 11 | **16** (+T1–T5 +T6 registry) |
| megaplan guard registry | unguarded | all enumerated LIVE_RATCHET |
| Audit contracts (A-tickets) | — | A1–A5 green |

Push-CI verdict on the landed commit: `test`, `bun-test`, `type-check`,
`lint`, `build`, `electron`, `e2e` green; `coverage` reported by the
coverage job. Slow suite: nightly-tier (`nightly.yml`) — local failures
under concurrent-suite CPU starvation (`rivalStrategyPass.perf`,
`advanceWeekPerformance`, `killDeathDivergence`) **all pass in isolation**
(perf gates against the best-of-3 min <2s bound; kill/death 234s clean).
Restore tag: `pre-test-audit-v2` → close-out tag `post-test-audit-v2`.
