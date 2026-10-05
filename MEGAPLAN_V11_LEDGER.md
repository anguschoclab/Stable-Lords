# MEGAPLAN V11 LEDGER

## Baseline

- **Branch:** `main`
- **Restore tag:** `pre-megaplan-v11` (at `ade1b001`)
- **Baseline gates (re-run at start):**
  - `tsc -b`: ✅ pass; `bun run type-check`: ❌ — floating `router-cli@latest`
    broke upstream (picomatch resolution), logged as B-V11-1
  - `eslint .`: ✅ 0 errors
  - `bun x vitest run`: ✅ 759 files / 8,682 passed / 2 skipped
  - `bun run test:bun`: ✅ 751 files / 8,640 passed
  - `bun run narrative-validate`: ✅ green
  - `knip`: 📊 1 unresolved import (advisor-e2e), 465 unused exports (report-only)
  - `jscpd`: 📊 114 clones / 0.76% (report-only)

## Consolidation summary

| PR | Disposition | Key commits |
| --- | --- | --- |
| #1024 | **LANDED (curated)** | `b9475174` |
| #1027 | **LANDED (curated)** | `fed4c44b` |
| #1029 | **LANDED (curated)** | `4052f289` |
| #1028 | **LANDED (curated, filtered)** | `bcb04689` — junk artifacts excluded |

## Concurrent-session absorption (stage B–E)

| Commits | Unit |
| --- | --- |
| `bedf55e4`/`f2e29e60` | stage-B owner competence axis |
| `4851b9bb`/`ceb9f7ad` | stage-C strategic & economic depth |
| `2ed86da9`/`159b010e` | stage-D in-bout adaptivity |
| `e76d6245`/`869478f4`/`fdaef651` | stage-E UX surfacing + worldgen difficulty |
| `8940a5d0`/`ce132d26` | SURVIVAL intent revival (crisis tier below RECOVERY) |
| `5a2b7e6b`/`c004ed5f` | lastLossFactors wired into season-objective re-planning |
| `a42bdb5c`/`ee8c4f27` | decoyAxes + phaseShiftOn + AI feature flags (D.2b/D.4) |
| `c6a8eed0`/`28f26ba5`/`92b313bd`/`da6d2237`/`3c19f364` | correctness fixes (bankruptcy grace, dead warriors, world-growth pins, schema round-trip) |

## Bugs fixed with failing evidence

| ID | Bug | Evidence | Fix commit |
| --- | --- | --- | --- |
| B-V11-1 | type-check floated router-cli@latest | baseline crash resolving picomatch | `838696e0`, `d1a02f27` |
| B-V11-2 | advisor-e2e stale import | scriptImports guard red | `47c1723f` |
| B-V11-3 | simulateFight/aiPlanForWarrior positional drift | FLAT lab crash plan.style | `3df0c578`, `08d9e581`, `17993f79` |
| B-V11-4 | param-budget breach in stage-C | ratchet red (7/6 params) | `28ef434b`, `33a34dcb` |
| B-V11-5 | non-null assertions stage-B/C | ESLint 5 errors | (lint commits) |
| B-V11-6 | questsVisible dead after #1024 | post-landing analysis | `b9475174` |
| B-V11-7 | VENDETTA unreachable | I.2 red; grudgeMap=0 probe | `03f457c0` (+`c6a8eed0` partial) |
| B-V11-8 | TOURNAMENT_CAMPAIGN unreachable | I.2 red after VENDETTA fix | `03f457c0` |
| B-V11-9 | sonner toasts occlude modal buttons | e2e click-fail LI.toast cover | `805dfc13` (final z-40; `985bf4a7` amended away) |

## Gate results at close

| Gate | Result | Notes |
| --- | --- | --- |
| type-check | ✅ | `tsc -b` green incl. pinned router codegen |
| lint | ✅ | 0 errors, 0 warnings |
| Vitest default | ✅ | 780 files / 8,767 pass / 2 skip |
| Bun test | ✅ | 771 files / 8,725 pass / 1 skip |
| Coverage | ✅ | 780 files green |
| Build | ✅ | |
| Electron compile | ✅ | |
| Narrative validate | ✅ | |
| jscpd / knip | 📊 report-only | 114 clones / 0.75%; 0 unresolved imports |
| Slow suite | ⏭️ | skipped per user — VENDETTA/TOURNAMENT invariants fixed + unit-verified; perf failures classified environmental |
| Playwright e2e | ⏳ | chromium (CI gate) in flight; multi-platform skipped per user |

## Post-implementation notes

- `VITE_NO_HMR=1` env gate added (`vite.config.ts`, `5c64c1a4`) — e2e soaks
  were being invalidated by concurrent-session commits reloading the dev
  server mid-run. Dev-module URLs preserved for `page.evaluate` imports.
