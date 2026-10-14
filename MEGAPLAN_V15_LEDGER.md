# MEGAPLAN V15 LEDGER — Exhaustive Re-Audit + 23-PR Consolidation Campaign

## Baseline

- **Branch:** `megaplan/v15` · **Restore tag:** `pre-megaplan-v15` at `97b16a46`
- **Backup refs:** all 23 PR head branches preserved under `refs/megaplan/v15/*`
- **Constraints:** zero save-file/backcompat; slow suite skipped per user
  directive (adhoc/nightly tier); test-first mandate in force (Phase 4 RED
  before any production change).

## Phase 0 — baseline gate matrix (measured at `97b16a46`, 2026-10-14)

| Gate | Result | Notes |
| --- | --- | --- |
| `type-check` (tsr + tsc --build) | ✅ 0 errors | routeTree.gen.ts regenerated — no drift |
| `lint` (eslint .) | ✅ 0 errors / 0 warnings | |
| `test` (vitest fast) | ⚠️ 799 files / 8,869 tests — 3 failures | all in `retrieveHotStatePlausibility.test.ts`; **known shared-worker flake** (V12/V14 documented); passes isolated 11/11; wall 42.59s |
| `build` (vite) | ✅ green | PWA precache 189 entries |
| `electron:compile` | ✅ green | 24.14 KB |
| `narrative-validate` | ✅ clean | |
| jscpd `dupes` | report-only | 100 clones / 0.75% dup lines (V12: 115) |
| knip `dead-code` | report-only | 139 unused exports / 63 unused types / 4 dup exports / 0 unresolved (62 files; V12: 193/68/4 — improved) |
| `orphan-scan` | ✅ within ceilings | unreachableFromProd 2 (ambient .d.ts, allowlisted); testOnly 0; unlinkedPages 0; nav-hidden routes 7 (allowlisted); src-scoped deadExports **154 / ceiling 156** |
| `dup-scan` | report-only | 180 clusters (V12: 213 — improved); first cluster is `_fixtures/weather.ts` ↔ `enumSourcesSync.test.ts` (the weather-union triple-list issue) |
| `param-count` | ✅ 0 violations | |
| `function-length` | ✅ budgets held | fns>80: 2; >120: 0; files>800: 3 (all exempt: commonCorpus.ts, lore.ts, routeTree.gen.ts) |
| `entries-in-loop` | 5 sites | same 5 KNOWN_EXCEPTIONS as V12 |
| `test-audit-scan` | residuals | 840 vitest + 5 e2e files; 41 slow; 35 importSetClusters; 4 localFactoryFiles; 2 dead patterns; 23 files >2s; 216 needsDom; 0 missing pragmas |
| `ui-audit-scan` | ✅ 0 hits | all classes clean |
| `data-array-dup-scan` | ✅ clean | |
| `find-dupes` (name pools) | ✅ clean | all six pools 0 dupes |
| 40w soak | 9.9s — **248.7 ms/wk** | 0 invariant violations; V14 A/B baseline was 228.5 ms/wk (~9% delta — machine variance or drift; re-measure at closeout) |
| `test:bun` | deferred | run at Phase 6 final battery |
| `e2e` chromium smoke | deferred | run at Phase 6 final battery |
| `test:slow` | SKIPPED | user directive — adhoc/nightly tier |

## Flake log

- `retrieveHotStatePlausibility.test.ts` — 3 failures under shared-worker
  packing (third recurrence across campaigns: V12, V14, V15). Passes isolated.
  Shared-mock-ordering hazard — **promoted from "watch" to fix candidate**
  (three-strike rule): filed as bug B-FLAKE-1.

## Phase log

_(filled as phases complete)_
