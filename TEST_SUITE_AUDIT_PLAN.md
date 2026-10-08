# Test Suite Audit, Optimization & Reorganization — Implementation Plan

**Status:** Executed 2026-10-08 — results and dispositions in `TEST_SUITE_AUDIT_LEDGER.md`. **Scope:** `src/test/` (843 vitest files, ~8,900 tests), `e2e/` (5 Playwright specs), test infrastructure (`vitest.config*.ts`, `bunfig.toml`, `playwright.config.ts`, CI workflows).

**Baseline (2026-10-08):** default suite = 802 files / 8,881 tests / ~63.5s wall (tests 36%, environment 30%, setup 15%, transform 11%, import 8%); slow suite = 41 `*.slow.test.*` files; e2e = 5 specs tiered chromium-smoke vs `@slow` full matrix.

**Prior waves already landed:** TEST_AUDIT_FINDINGS.md, CONSOLIDATION_V5–V7, MEGAPLAN_V9–V14, plus the tier split (slow suite + e2e `@slow`). This plan targets what those waves did not: systematic obsolescence, cross-file assertion duplication, mirror-tree drift, and the remaining runtime cost structure.

**Existing machinery to reuse (do not rebuild):**

- `bun scripts/test-audit-scan.mjs` → `scripts/out/test-audit.json` (per-file records: imports, DOM signals, mocks/stubs, local factories, dead patterns, runtime join, `basenameCollisions`, `importSetClusters`) + regenerates `runnerGroups.json` / `auditBaseline.json`
- `src/test/testQualityAudit.test.ts` — structural gate (no colocation, basename pairs, local factories, jsdom pragma, bun-deadlock patterns, slow-suite containment, runnerGroups drift)
- `bun run dupes` (jscpd ≥10 lines/100 tokens), `bun run dead-code` (knip), `bun scripts/orphan-scan.mjs` (domain liveness incl. test-only reachability)
- `scripts/out/baseline-test-timings.tsv` — per-file wall times, refreshed 2026-10-08

---

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

Goal: find tests covering removed, deprecated, or unreachable functionality. A test is obsolete if its *subject* is dead, not merely if it fails — everything currently passes, so this is a semantic audit.

1. **Import-target liveness.** From `test-audit.json` records: for each test file, resolve its import targets; flag files whose *only* prod targets are (a) knip-unused modules, (b) orphan-scan "test-only reachable" modules, or (c) modules in known-deprecated areas (cross-check MEGAPLAN ledgers' deprecation notes). A test that exists solely to keep dead code alive is a delete candidate *paired with* the dead code's removal — never delete coverage of live code.
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
3. **Assertion-level dedup.** For engine/pipeline spec groups (the densest clusters): diff `expect()` sets across sibling files; where two files assert the same postcondition on the same fixture shape, consolidate. Preserve *distinct* invariants — dedup targets redundancy, not coverage.
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
   - *Pragma audit:* verify all 216 flagged files truly need jsdom (`needsDom` signal in test-audit.json exists — re-run after pragma removals; measure delta). DOM tests that only stub `document` may not need real jsdom.
   - *Measured & rejected:* `pool: 'vmThreads'` — verified 2026-10-08: environment→3% but wall time +20% (76.2s vs 63.5s) and 27 failures from `global.window =` assignments breaking on VM-context getter-only globals. Do not re-attempt without first fixing the window-stub pattern *and* resolving the transform-time regression.
   - *Not expandable:* `isolate: false` is already at its provable-safe maximum (shared project); widening it breaks `vi.mock` semantics — documented in `vitest.config.ts`.
   - *Consolidation:* merging sibling DOM specs (Phase 2) directly reduces env count — the two phases compound.
2. **Setup (15%, ~9.5s).** `setup.node.ts` + `setup.dom.ts` per-file cost in the isolated project. Audit for: imports pulling broad prod graphs (the comment forbids it — verify no creep), singleton-reset work proportional to suite size vs per-file need. Target: move resettable state behind lazy dynamic imports already established pattern.
3. **Transform (11%).** Vite transform cache — check `node_modules/.vite` cache warmth; consider `server.deps`/`optimizeDeps` for hot imports, and confirm `esbuild` target isn't re-transpiling.
4. **Tail latency.** From the fresh TSV: demote anything regrowing past 5s (ratchet documented in TESTING.md). p90 files in `engine/pipeline`, `engine/ai` — the integration-heavy dirs — are candidates for fixture-light rewrites (seeded mini-worlds instead of full `advanceWeek` loops) *where the test isn't measuring integration*.
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
