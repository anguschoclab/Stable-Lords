# MEGAPLAN LEDGER — Deep Refactor, Dedup, Wiring & Bible Conformance

**Scope:** Exhaustive re-audit and refactor of the full codebase — monolith/long-function decomposition, duplicate elimination, orphan wiring, Design-Bible conformance. Zero backwards-compatibility constraints (saves disposable; `SAVE_STATE_VERSION` free to bump).
**Restore point:** tag `pre-megaplan-v8` → `a8cf7ca2` (local).
**Baseline-repair commit:** `3bc5476e` — 6 pre-existing type-check errors at HEAD fixed before baseline capture.
**Working mode:** in-place on `main`; sequential ledger-batch commits; deletes never mixed with moves; **test-first invariant** — Phase 2 constructs the full test inventory before any implementation commit (see MEGAPLAN_FINDINGS §M2).

---

## 0. Baseline Metrics (captured @ `3bc5476e`)

| Metric | Baseline | Notes |
|---|---|---|
| `bun run type-check` | **0 errors** | was 6 errors at `a8cf7ca2` — repaired `3bc5476e` |
| `bun run lint` | **0 errors / 0 warnings** | |
| `bun x vitest run` (default) | **692 files / 8,172 pass / 2 skip / 1 flaky** | 47.93s; `advanceWeekPerformance` timing-ratio flake (passes isolated — not a regression) |
| `bun run build` | **OK 2.38s** | 5.4MB precache |
| `bunx vitest run --config vitest.config.slow.ts` | 24 slow files | deferred to Phase 4+ gates |
| `bun test` compat / `playwright test` | deferred | final gate matrix |
| Coverage thresholds | 84 stmts / 74 branch / 78 funcs / 85.5 lines | floors held |
| Non-test LOC | ~111k | engine 45.6k · components 34k · pages 12k · data 7.3k · rest ~12k |
| Test files (vitest-collected) | 692 | |

### Pre-findings validated during plan review (V-ledger)

Full table lives in `MEGAPLAN_FINDINGS.md` §0. Headline confirmed findings: 7 engine-root file/dir shadows + ~43 flat files (§H); `arenaChampionship.ts` 922 lines post-extraction (§I); static non-location-aware primary CTA vs Page-System spec (§L); `PageFrame`/`PageHeader` coverage 21/28 of ~35 pages (§L); 105 files w/ raw color literals needing classified audit (§L).

---

## Disposition Ledger

| Commit | Phase | Batch | Disposition |
|---|---|---|---|
| `3bc5476e` | 0 | baseline repair | 6 type-check errors fixed (pre-existing at tag) |

*(populated as batches land)*
