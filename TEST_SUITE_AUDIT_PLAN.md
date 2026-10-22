# Test Suite Audit, Optimization & Reorganization — Implementation Plan

**Status:** Wave 1 executed 2026-10-08. **Wave 2 validated 2026-10-22, executed same day** — per-phase results and final metrics are in `TEST_SUITE_AUDIT_LEDGER.md` §"Wave 2" (0 TEST_DEBT pairs, 0 CI-shard gap, 0 files >5s, 16 audit checks). Wave-1 phases retained under §"Wave 1 (executed — archived)" for audit-trail completeness. Findings: `TEST_AUDIT_FINDINGS.md` §5.

**Wave-2 scope (user-approved):** `src/test/` (921 vitest files, 9,469 tests), `e2e/` (5 Playwright specs + helpers), test infrastructure (`vitest.config*.ts`, `bunfig.toml`, `playwright.config.ts`), CI runner parity (`.github/workflows/*.yml`), paired dead production code, and the `src/test/megaplan/` guard-spec lifecycle.

**Wave-2 baseline (2026-10-22, fresh scans):** default suite = **880 files / 9,469 tests / 0 fail / 2 pending** (deliberate `bunViCompat` conditional skips); slow suite = 41 files; e2e = 5 specs. Per-file timings refreshed into `scripts/out/baseline-test-timings.tsv` (888 rows): p50 38ms, p90 1.49s, p99 6.2s; **52 files >2s, 11 files >5s** (documented demote threshold ~5s). `test-audit.json`: 254 jsdom pragmas / 49 node / 248 needsDom / 0 missing-pragma / 0 basename collisions / 3 localFactory (allowlisted) / **37 importSetClusters**. jscpd scoped `src/test`: **88 clones / 1.02% dup lines**. dup-scan registered: test↔test 70 DEBT pairs (budget) + 9 EXEMPT; mixed 17 EXEMPT; ident queues w20=50, w16=125 test↔test.

**Existing machinery to reuse (do not rebuild):** same as wave 1 — `test-audit-scan.mjs`, `testQualityAudit.test.ts`, jscpd/knip/orphan-scan, `baseline-test-timings.tsv` — plus `scripts/timings-to-tsv.mjs` (wave-2 Phase 0) and `scripts/dup-scan.mjs` tier ledgers.

---

# Wave 2 — Validated Campaign Plan (2026-10-22)

## Validation ledger — draft claims re-verified against the codebase

| #   | Claim                                                                      | Verdict             | Evidence / correction                                                                                                                                                                            |
| --- | -------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| V1  | Default suite 880 files / 9,469 tests / 0 fail / 2 pending                 | **APPROVED**        | Fresh `bunx vitest run --reporter=json` → `scripts/out/default-suite-timings.json`                                                                                                                 |
| V2  | Timing TSV stale (Oct-8, 809 rows vs 921 files)                            | **APPROVED**        | Refreshed 2026-10-22 → 888 rows (880 default + 8 slow preserved)                                                                                                                                 |
| V3  | 52 files >2s, 11 >5s                                                     | **APPROVED**        | >5s: truncationCadence 10.3, enginePool 10.2, namePool 9.4, simulateArenaBalance 9.1, mutableInput 8.9, championsTournament 8.6, expansionService 6.8, VirtualizedFallenGrid 6.2, eslintSmoke 6.2, skipToWeekEndOwnership 5.0, finalizeContracts 5.0 (s) |
| V4  | test-audit summary numbers                                                 | **APPROVED**        | `test-audit.json` regen 2026-10-22                                                                                                                                                               |
| V5  | jscpd `src/test` 88 clones — "regrown from wave-1's 0"                     | **CORRECTED**       | 88 is ground truth via scoped `bunx jscpd src/test`; wave-1's 0 was measured repo-wide — record both, no regrowth claim                                                                            |
| V6  | TEST_DEBT ≈70                                                            | **APPROVED (70)**   | `duplication.guard.test.ts`: DEBT=70/budget=70, TEST_EXEMPT=9, EXEMPT=27, MIXED_EXEMPT=17                                                                                                        |
| V7  | ~69 files uncovered by CI bun-test shard                                   | **CORRECTED → 70, CI-only** | `ci.yml` loop covers `src/test/engine/*/` subdirs + 15 dirs; missed: 51 engine-root + constants 10 + layout 2 + lore 2 + vite 1 + _setup 3 + _fixtures 1. Local `bun run test:bun` (no path arg) covers all — a **CI-enumeration gap**, incl. the `bunViCompat` canary itself |
| V8  | knip: `e2e/helpers.ts:clickNavLink` dead                                   | **CORRECTED**       | Unused *export* — `navigateNavLink` (:60) calls it internally (:74). Fix = un-export, not delete                                                                                                   |
| V9  | 48 files with non-taxonomy dotted qualifiers                               | **APPROVED — zero renames needed** | 41 distinct qualifiers, all match `^[a-z][a-zA-Z]*$`; single-word subject-qualifier rule admits all 48                                                                                |
| V10 | `CATEGORY_DOMAIN` missing lore/layout                                       | **APPROVED — sharper** | Unlisted dirs escape conformance **silently** (how `layout/` drifted in). Fix = map entries + non-mirror registration guard                                                                        |
| V11 | Parallel fs-walk helpers                                                   | **APPROVED — triple** | `_setup/fsHelpers.ts` (5 consumers), `_helpers/fsWalk.ts` (5), inline copy in `testQualityAudit.test.ts`                                                                                           |
| V12 | `setup.node.ts` beforeEach fetch-stub + avatar catalog for all ~9.4k tests | **APPROVED**        | `setup.node.ts:13-39`; `setup.dom.ts` (43 lines, isolated-project-only) is the move target                                                                                                         |
| V13 | 28 megaplan guards / ~3.6k LOC need lifecycle audit                        | **APPROVED**        | LIVE-RATCHET vs RETIRE→successor classification in FINDINGS §5e                                                                                                                                  |
| V14 | "demote >5s files to .slow"                                                | **CORRECTED — coverage risk** | `.slow` files excluded from `test:coverage` AND `bun test`; demotion requires per-file coverage-delta measurement; fixture-light rewrite is default where unique coverage is carried                |
| V15 | orphan-scan 0 test-only / 0 unreachable                                    | **APPROVED**        | `orphan-scan.json` regen 2026-10-22 — obsolescence is semantic, not mechanical                                                                                                                    |
| V16 | `src/test/scripts/` needs CATEGORY_DOMAIN entry                            | **DISPROVED**       | Imports `#scripts/…` → resolveImport null → zero-prod-import → scanner-exempt; register as non-mirror instead                                                                                      |
| V17 | `e2e/screenshots` tracked                                                  | **DISPROVED**       | `git ls-files` empty — untracked; no policy needed                                                                                                                                               |
| V18 | jsdom-pragma lever exhausted                                               | **APPROVED**        | 6 no-signal files all indirect renderers (same set as wave-1); env cost falls only via DOM-spec consolidation                                                                                      |
| V19 | `scripts/timings-to-tsv.mjs` missing                                       | **APPROVED**        | wave-1 suggestion still unimplemented → Phase 0 deliverable                                                                                                                                       |
| V20 | Skip-ticket registry free for wave-2                                       | **CORRECTED**       | `S1–S34`/`D1–D14` permanently registered by V18; wave-2 uses **`MEGAPLAN-A*`** (`MEGAPLAN-[A-Z]\d+` regex)                                                                                        |

## Test inventory — specs that must land RED before implementation (strict test-first)

Every Phase-3+ change is validated by a spec authored in **Phase 2**. Phases 3–6 may not commit a deletion/merge/move/perf change whose validating spec hasn't landed.

| ID  | Spec / mechanism                                                                                                                                                                                                                                                                          | Validates                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| T1  | `testQualityAudit` suffix-taxonomy check: `.slow` terminal-only; category qualifiers ∈ {integration, e2e, perf, guard}; ≤1 subject qualifier matching `^[a-z][a-zA-Z]*$`                                                                                                                     | Phase-5 naming ratchet             |
| T2  | `testQualityAudit` dir-registration check: every `src/test/<dir>/` ∈ `CATEGORY_DOMAIN` ∪ `NON_MIRROR_DIRS` (\_fixtures, \_helpers, \_mocks, \_setup, config, integration, megaplan, perf, scripts, ui, vite)                                                                                   | closes the V10 silent-drift hole   |
| T3  | `CATEGORY_DOMAIN` += `lore: ['src/lore']` → conformance check flags `src/test/layout/*` (they import `@/components/layout/*`)                                                                                                                                                                | Phase-5 `git mv` target            |
| T4  | `testQualityAudit` CI-shard coverage check: parse `ci.yml` bun-test enumeration, assert every non-slow test file falls under a shard                                                                                                                                                          | Phase-5 CI fix (70-file gap)       |
| T5  | `testQualityAudit` bunfig↔slow sync: every `*.slow.test.*` matches `bunfig.toml` `pathIgnorePatterns` glob and default-config excludes                                                                                                                                                        | Phase-6 demotions                  |
| T6  | `guardLifecycle` registry: all `src/test/megaplan/` guards enumerated `LIVE_RATCHET \| RETIRE→<successor>`; RETIRE requires a named surviving spec/guard for the invariant                                                                                                                    | Phase-3 retirements                |
| T7  | Merge-parity mechanism: per Phase-4 batch, capture `vitest --reporter=json` titles pre/post; post-merge titles ⊇ pre-merge minus ledger-listed drops                                                                                                                                         | Phase-4 merges lose no test        |
| T8  | `_fixtures/factories.test.ts` assertions for each planned extraction, parked as `it.skip` under `MEGAPLAN-A*` tickets registered in `REGISTERED_SKIP_TICKETS`                                                                                                                                | Phase-4 shared-builder extractions |
| T9  | `setup.regression`/`stateReset` sentinels: jsdom project retains fetch-stub+avatar catalog post-surgery; shared project no longer pays avatar load; `bunViCompat` surface unchanged                                                                                                            | Phase-6 setup surgery              |
| T10 | Existing gates reused: coverage thresholds (84/74/78/85.5), runnerGroups drift guard, shrink-only allowlists                                                                                                                                                                                  | all phases                         |

## Phase 0 — Safety, baseline & findings freeze (0.5 day)

1. `git tag pre-test-audit-v2` at start HEAD; open LEDGER wave-2 block.
2. `bunx tsr generate` before baselining (stale route tree must not contaminate).
3. Land `scripts/timings-to-tsv.mjs` (vitest JSON → TSV, preserving stale slow rows); refresh `baseline-test-timings.tsv` (done: 888 rows).
4. Gate matrix recorded: type-check, lint, `bun run test`, build, narrative-validate, dup-scan all tiers, knip, jscpd `src/test`, orphan-scan, test-audit-scan regen.

**Exit:** tag exists; ledger baseline row committed.

## Phase 1 — Detection & disposition (no changes; 1 day)

Build the complete disposition ledger before anything moves:

1. Obsolescence triage: import-liveness via test-audit.json + orphan-scan + knip (clean today → semantic archaeology vs routes/features; `e2e/residual-routes.spec.ts` keep+annotate; `v13-surfaces.spec.ts` relevance check).
2. Classify all 28 `megaplan/` guards LIVE-RATCHET vs RETIRE→successor (feeds T6 — FINDINGS §5e).
3. Triage 88 jscpd clones + 37 importSetClusters + 70 TEST_DEBT pairs into merge/extract/keep queues with named harmonization targets (feeds T8 tickets).
4. Enumerate the 70-file shard-gap list and 48-qualifier list (feeds T2–T4).
5. e2e surface: un-export `clickNavLink` (internal-live per V8); spec inventory.

**Exit:** FINDINGS §5 tables fully populated; every Phase-3+ commit derivable from it.

## Phase 2 — Contract & guard construction, committed RED (hard gate; 1–2 days)

Land T1–T9 before any implementation:

1. T1 suffix-taxonomy check (lands GREEN — ratchet; any violating file renamed in-commit).
2. T2 dir-registration + `NON_MIRROR_DIRS` allowlist (RED on `layout`/`lore`).
3. T3 `lore: ['src/lore']` map entry (RED listing `src/test/layout/*`).
4. T4 CI-shard coverage check (RED on the 70 uncovered files).
5. T5 bunfig↔slow sync assertion.
6. T6 `guardLifecycle` registry with full dispositions.
7. T7 merge-parity harness (scripted title diff per batch).
8. T8 ticketed `.skip` extraction contracts under `MEGAPLAN-A*` in `_fixtures/factories.test.ts`.
9. T9 setup sentinels in `setup.regression`/`stateReset`.
10. Regen `runnerGroups.json`/`auditBaseline.json` via `test-audit-scan.mjs`.

**Exit (hard gate):** T1–T9 committed; RED checks enumerate every planned target; skip registry enumerates every parked ticket.

## Phase 3 — Obsolescence deletions & guard retirements (1 day)

Per Phase-1 dispositions, small mechanical commits:

- Delete dead tests **paired with** test-only prod subjects (same commit; coverage floor is the gate — never delete coverage of live code).
- Retire guards only where T6 names a successor invariant-owner.
- Un-export `clickNavLink` in `e2e/helpers.ts`.
- Re-run full suite + `test-audit-scan` regen per batch; coverage thresholds hold.

## Phase 4 — Duplication & consolidation (2–3 days)

- Drain jscpd `src/test` 88 clones → 0 or registered EXEMPT (canonical measurement: `bunx jscpd src/test`).
- Drain `TEST_DEBT_PAIRS` 70 → budget ratcheted to 0 (`_fixtures/` extraction, `it.each` merges).
- 37 importSetClusters per triage matrix (merge same-subject / extract shared setup / keep distinct-subject).
- Ident-tier queues staged: ident-w20 (50 test↔test) then w16 (125).
- Merge `_setup/fsHelpers` + `_helpers/fsWalk` + `testQualityAudit`'s inline walker → `_helpers/fsWalk.ts`.
- Mixed pairs (17) → EXEMPT verdicts recorded, not churn.
- Per batch: T7 parity check, T8 tickets un-skip, ledger row, suite green.

## Phase 5 — Structural moves & CI fix (1 day)

- `git mv src/test/layout/breadcrumbs/*` → `src/test/components/layout/breadcrumbs/` (T3 GREEN).
- Fix `ci.yml` bun-test shard enumeration — prefer `find`-driven walk over hardcoded dirs so the gap can't regrow (T4 GREEN).
- Formalize `megaplan/` as permanent structural-guard home in TESTING.md.
- Regen `runnerGroups.json`/`auditBaseline.json`; update `bunfig.toml` ignores if renamed paths appear.

## Phase 6 — Execution profiling & optimization (1–2 days; measured wins, no hard target)

1. Tail: demote-or-rewrite the 11 >5s files — **coverage-delta measured before each demotion** (`.slow` files are excluded from `test:coverage`; fixture-light rewrite is default where unique coverage is carried).
2. `setup.node.ts` surgery: move fetch-stub/avatar-catalog `beforeEach` + unconditional `loadCombatNarrative` `beforeAll` toward `setup.dom.ts` or demand-gating → T9 sentinels GREEN.
3. DOM-spec consolidation compounding Phase 4 (only remaining env lever — pragma removal exhausted, V18).
4. Runner knobs measured-and-logged accept/reject: `maxWorkers`/`minWorkers`, `sequence.concurrent`, `poolOptions`. **`vmThreads` and `isolate:false` widening remain measured-and-rejected** (Oct-8 data; retry only after fixing the window-stub pattern AND transform regression).
5. e2e: chromium smoke stays inner loop; Playwright `--shard`/`fullyParallel` only if smoke >~10min.
6. All decisions incl. rejects recorded in the ledger.

## Phase 7 — Close-out (0.5 day)

- `docs/TESTING.md`: qualifier rule, lore/layout filing, NON_MIRROR_DIRS registry, shard-coverage note, `bunx jscpd src/test` as canonical dup measurement.
- LEDGER wave-2 finalized per-phase before/after.
- `git tag post-test-audit-v2`; one-shot scripts deleted.

## Cross-cutting rules

- **Ordering:** measure → detect → contracts RED → delete → merge → move → perf → docs.
- **Per-commit verification:** `bunx vitest run` green · `test-audit-scan` regen clean · `bun --smol test --isolate` on touched dirs · lint on changed files · `tsc -p tsconfig.e2e.json` if e2e touched.
- `git mv` for renames; deletes never mixed with moves; `auditBaseline.json` shrink-only; rollback via `pre-test-audit-v2` tag + small commits.
- **Non-goals:** framework rewrites, prod semantic changes beyond approved paired dead-code deletion, lowering coverage thresholds, deleting `.slow` coverage for wall-clock.

---

# Wave 1 (executed 2026-10-08 — archived)

**Status:** Executed 2026-10-08 — results and dispositions in `TEST_SUITE_AUDIT_LEDGER.md`. **Scope:** `src/test/` (843 vitest files, ~8,900 tests), `e2e/` (5 Playwright specs), test infrastructure (`vitest.config*.ts`, `bunfig.toml`, `playwright.config.ts`, CI workflows).

**Baseline (2026-10-08):** default suite = 802 files / 8,881 tests / ~63.5s wall (tests 36%, environment 30%, setup 15%, transform 11%, import 8%); slow suite = 41 `*.slow.test.*` files; e2e = 5 specs tiered chromium-smoke vs `@slow` full matrix.

**Prior waves already landed:** TEST_AUDIT_FINDINGS.md, CONSOLIDATION_V5–V7, MEGAPLAN_V9–V14, plus the tier split (slow suite + e2e `@slow`). This plan targets what those waves did not: systematic obsolescence, cross-file assertion duplication, mirror-tree drift, and the remaining runtime cost structure.

**Existing machinery to reuse (do not rebuild):**

- `bun scripts/test-audit-scan.mjs` → `scripts/out/test-audit.json` (per-file records: imports, DOM signals, mocks/stubs, local factories, dead patterns, runtime join, `basenameCollisions`, `importSetClusters`) + regenerates `runnerGroups.json` / `auditBaseline.json`
- `src/test/testQualityAudit.test.ts` — structural gate (no colocation, basename pairs, local factories, jsdom pragma, bun-deadlock patterns, slow-suite containment, runnerGroups drift)
- `bun run dupes` (jscpd ≥10 lines/100 tokens), `bun run dead-code` (knip), `bun scripts/orphan-scan.mjs` (domain liveness incl. test-only reachability)
- `scripts/out/baseline-test-timings.tsv` — per-file wall times, refreshed 2026-10-08

## Phase 0 — Baseline & Metrics Capture (0.5 day)

Goal: freeze a measurable "before" so every later phase has quantified deltas.

1. Refresh all generated artifacts:
   - `bunx vitest run --reporter=json --outputFile=scripts/out/default-suite-timings.json` → regenerate `baseline-test-timings.tsv` (script the TSV rewrite — currently done ad hoc; consider adding `scripts/timings-to-tsv.mjs`)
   - `bun scripts/test-audit-scan.mjs` → fresh `test-audit.json`
   - `bun run dupes` → `scripts/out/jscpd/`
   - `bun run dead-code:report` → `scripts/out/knip-report.json`
   - `bun scripts/orphan-scan.mjs` → `scripts/out/orphan-scan.json`
   - `bunx vitest run --config vitest.config.slow.ts --reporter=json --outputFile=scripts/out/slow-suite-timings.json` (one-time cost ~nightly-job duration)
2. Record metrics in a ledger section: file/test counts per tier, wall time + vitest time breakdown, jscpd duplication %, audit violations, timings p50/p90/p99 per directory.
3. Define targets (proposed):
   - Default suite < 45s wall on dev hardware; environment+setup < 20% combined
   - Test-tree duplication < 3% (jscpd)
   - Zero audit violations; `auditBaseline.json` residual lists shrinking
   - Every test file matches the suffix taxonomy (Phase 3)

**Exit criteria:** metrics ledger committed; targets agreed.

## Phase 1 — Obsolescence Audit (1–2 days)

Goal: find tests covering removed, deprecated, or unreachable functionality. A test is obsolete if its _subject_ is dead, not merely if it fails — everything currently passes, so this is a semantic audit.

1. **Import-target liveness.** From `test-audit.json` records: for each test file, resolve its import targets; flag files whose _only_ prod targets are (a) knip-unused modules, (b) orphan-scan "test-only reachable" modules, or (c) modules in known-deprecated areas (cross-check MEGAPLAN ledgers' deprecation notes). A test that exists solely to keep dead code alive is a delete candidate _paired with_ the dead code's removal — never delete coverage of live code.
2. **Feature-archaeology pass.** List per-directory: grep test names/describes against feature registries — routes (`src/routes*`), nav hubs, style/fighting-style enums, arena events, UI feature flags. Flag describes referencing renamed/removed user-facing features. `e2e/residual-routes.spec.ts` intentionally covers residuals — keep but annotate.
3. **Skip/todo/disabled sweep.** `test-audit.json` `dead` field already counts `it.todo`/`it.skip`/commented describes — 2 files flagged; triage to fix-or-delete.
4. **Duplicate-of-history check.** For each flagged file, check `git log` for the feature removal commit; if the feature was removed but its test survived by testing mocks/fixtures only, mark for deletion.
5. **Disposition ledger.** Every flagged file gets one of: DELETE (obsolete), REWRITE (subject changed), KEEP (still valid) with justification — audited via PR description, not silently.

**Safety rule:** deletion PRs are small and mechanical; each runs the full default suite + affected slow files + `test-audit-scan` regen. Coverage thresholds in `vitest.config.ts` are the floor — a deletion that drops below threshold forces the "was this actually covering live code?" question.

**Exit criteria:** ledger of dispositions; deletions landed; coverage thresholds still green.

## Phase 2 — Duplication & Consolidation (2–3 days)

Goal: eliminate redundant assertions and merge same-subject specs.

1. **Automated clustering** (already computed — start here):
   - `test-audit.json` → `basenameCollisions` (currently 0 — verified) and `importSetClusters` (37 clusters of files importing identical module sets — primary merge candidates)
   - `bun run dupes` scoped to `src/test/` — copy-pasted assertion blocks
2. **Triage matrix per cluster:**
   - Same imports + same describe subject → merge into one file, `it.each` for parametric variants
   - Same imports + different subject → keep, but extract shared setup into `_fixtures/` or `_mocks/`
   - Overlapping assertions (same invariant asserted in N files) → keep the strongest formulation, delete the rest
3. **Assertion-level dedup.** For engine/pipeline spec groups (the densest clusters): diff `expect()` sets across sibling files; where two files assert the same postcondition on the same fixture shape, consolidate. Preserve _distinct_ invariants — dedup targets redundancy, not coverage.
4. **Shared-helper extraction.** Repeated local builders exceeding the delegating-adapter rule → promote to `_fixtures/factories.ts`; the audit gate enforces no regression.
5. **Re-verify per batch:** default suite green, `test-audit-scan` regen, jscpd % re-measured into ledger.

**Exit criteria:** jscpd test duplication < target; importSetClusters reduced to real distinct-subject groups; no net loss of unique assertions (spot-check via coverage diff on touched areas).

## Phase 3 — Structural Reorganization (1–2 days)

Goal: strict mirror-tree conformance + codified naming taxonomy.

Current rules (TESTING.md): tests live under `src/test/` mirroring production; `_fixtures/`/`_mocks/`/`_setup/` are the only non-mirror dirs. Known drift to resolve:

1. **Mirror conformance scan.** New check (add to `test-audit-scan.mjs`): each test file should map to a plausible prod counterpart. Flag mismatches, e.g. files in `src/test/megaplan/` (guard specs for past initiatives — either migrate to `src/test/config/`/`src/test/guards/` or formalize `megaplan/` as the structural-audit home), `src/test/integration/`, `src/test/perf/`, `src/test/lore/` vs their actual subjects.
2. **Suffix taxonomy** (codify then enforce):
   - `.test.ts[x]` — unit/spec, default tier
   - `.integration.test.ts` — multi-module engine flows
   - `.e2e.test.ts` — in-suite engine end-to-end (e.g. `vendettaPlayer.e2e`)
   - `.perf.test.ts` — timing gates
   - `.guard.test.ts` — structural/consistency audits
   - `.slow.test.ts[x]` — tier suffix, composes with the above
     Deliverable: a lint/audit guard listing legal suffix combos and flagging violations (e.g. `*.slow.test.ts` files missing a category, or `.e2e` files outside engine).
3. **Directory cleanup.** Rename/migrate flagged files with `git mv`; after every batch regenerate `runnerGroups.json`/`auditBaseline.json` via `test-audit-scan.mjs` and update `bunfig.toml` ignore list if renamed paths appear there.
4. **e2e tree.** `e2e/` stays flat (5 specs + `helpers.ts`); add `e2e/README` notes? No — document tiers in TESTING.md only (already done).

**Exit criteria:** conformance scan clean (or violations allowlisted with justification); taxonomy guard in `testQualityAudit.test.ts`.

## Phase 4 — Execution Profiling & Optimization (2–3 days)

Goal: attack the measured cost structure: tests 36% / environment 30% / setup 15% / transform 11% / import 8%.

1. **Environment (30%, ~19s).** 216 jsdom-pragma files each spin a fresh jsdom. Options, in order of safety:
   - _Pragma audit:_ verify all 216 flagged files truly need jsdom (`needsDom` signal in test-audit.json exists — re-run after pragma removals; measure delta). DOM tests that only stub `document` may not need real jsdom.
   - _Measured & rejected:_ `pool: 'vmThreads'` — verified 2026-10-08: environment→3% but wall time +20% (76.2s vs 63.5s) and 27 failures from `global.window =` assignments breaking on VM-context getter-only globals. Do not re-attempt without first fixing the window-stub pattern _and_ resolving the transform-time regression.
   - _Not expandable:_ `isolate: false` is already at its provable-safe maximum (shared project); widening it breaks `vi.mock` semantics — documented in `vitest.config.ts`.
   - _Consolidation:_ merging sibling DOM specs (Phase 2) directly reduces env count — the two phases compound.
2. **Setup (15%, ~9.5s).** `setup.node.ts` + `setup.dom.ts` per-file cost in the isolated project. Audit for: imports pulling broad prod graphs (the comment forbids it — verify no creep), singleton-reset work proportional to suite size vs per-file need. Target: move resettable state behind lazy dynamic imports already established pattern.
3. **Transform (11%).** Vite transform cache — check `node_modules/.vite` cache warmth; consider `server.deps`/`optimizeDeps` for hot imports, and confirm `esbuild` target isn't re-transpiling.
4. **Tail latency.** From the fresh TSV: demote anything regrowing past 5s (ratchet documented in TESTING.md). p90 files in `engine/pipeline`, `engine/ai` — the integration-heavy dirs — are candidates for fixture-light rewrites (seeded mini-worlds instead of full `advanceWeek` loops) _where the test isn't measuring integration_.
5. **CI-level:** bun-test shard duplicates vitest coverage (~8.9k tests run twice). Evaluate whether `bun-test` CI still earns its runtime vs a weekly parity check — decision point, record rationale either way.
6. **e2e:** chromium smoke is the inner loop; matrix is nightly. Optional: Playwright `--shard` if smoke tier grows past ~10 min.

**Exit criteria:** default suite < 45s with environment+setup < 20%; optimization decisions logged in the ledger incl. rejected options.

## Phase 5 — Guardrails & Documentation (0.5 day)

1. Extend `testQualityAudit.test.ts`: suffix-taxonomy guard, mirror-conformance guard, `@slow` e2e tag guard (marathon specs must be tagged).
2. Update `docs/TESTING.md` (taxonomy section, audit workflow, refresh commands), `README.md` if commands change, `.claude/CLAUDE.md` Testing Discipline if conventions change.
3. Commit a `TEST_SUITE_AUDIT_LEDGER.md` with before/after metrics per phase — matches repo convention (MEGAPLAN ledgers).

## Cross-cutting

- **Ordering rationale:** measure first (0), delete before merge (1→2 — consolidation churn is wasted on files about to die), merge before move (2→3), structure before perf (3→4 — perf work assumes stable layout), guards last (5 — they encode the final state).
- **Per-PR verification:** `bunx vitest run` green · `test-audit-scan` regen clean · `bun --smol test --isolate` on touched dirs · `tsc -p tsconfig.e2e.json` if e2e touched · lint on changed files.
- **Rollback:** every rename/dedup lands via `git mv`/small PRs; `auditBaseline.json` is shrink-only, so any regressed gate fails loudly rather than silently ratcheting.
- **Non-goals:** rewriting test frameworks, changing production code semantics, lowering coverage thresholds, deleting `.slow` coverage to hit wall-clock targets.
