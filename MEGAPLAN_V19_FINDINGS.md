<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN V19 FINDINGS — Full Re-Baseline (measured 2026-10-22)

Companion to `MEGAPLAN_V19_PLAN.md`. Every number below was measured
against the live codebase at HEAD `217c1b7c`. Prior verdicts (V8–V18)
are re-verification targets, not assumptions; verdict diffs are recorded
where fresh evidence reverses them.

## §0 Baseline metrics

See `MEGAPLAN_V19_LEDGER.md` §0 for the full gate matrix. Headline:
1,283 src files / 141,711 LOC; 994 test files / 149,849 LOC;
**6 functions >80**; dup w8 27/79/17; knip 222; orphan deadExports 215;
scan-in-loop 88; entries-in-loop 5; ui-audit 0; soak 40w 0 violations
@ 257.7 ms/week.

## §W Wiring findings

_Re-baseline pending — Phase 1 populates._

Code level: 215 deadExports to classify (159 src + 56 non-src);
stateFields all audited `ok` at snapshot (weatherMods reader-status
re-verify); 0 unreachable prod modules; 0 unlinked pages; 0 test-only.

Feature level: spec-matrix re-audit pending.

## §D Dup clusters — per-tier verdict tables

_Re-baseline pending._ Fresh counts: w8 27/79/17 · w12 6/12/3 ·
ident w20 170/52/135 · ident w16 454/128/288.

Registered ledgers to re-verify: `EXEMPT_PAIRS` 27 · `DEBT_PAIRS` 0 ·
`TEST_EXEMPT_PAIRS` ~4 · `TEST_DEBT_PAIRS` **70** ·
`MIXED_EXEMPT_PAIRS` 17 · `MIXED_DEBT_PAIRS` 0.

## §A SRP targets

New hard queue (6 fns >80 — none in V18's drained list):

| # | Fn | File:line | Len |
| - | -- | --------- | --- |
| S35 | `processArenaEvent` | `src/hooks/arenaAnimationUtils.ts:196` | 88 |
| S36 | `assessCrownOpportunity` | `src/engine/ai/workers/crownWorker.ts:151` | 83 |
| S37 | `projectEvent` | `src/engine/simulate/logging.ts:43` | 82 |
| S38 | `computeEffectiveSkills` | `src/engine/bout/fighterState.ts:104` | 81 |
| S39 | `createFighterState` | `src/engine/bout/fighterState.ts:212` | 81 |
| S40 | `recordGrandChampions` | `src/engine/championship/championsTournament.ts:109` | 81 |

Band (60–80): 268 functions — triage by responsibility-mix pending.
srp-census re-run pending; V18 watch-list re-review pending.

## §K Dead code

knip 222 (150 exports + 68 types + 4 duplicates) across 72 files;
orphan deadExports 215 (159 src + 56 non-src: electron 9, scripts
~47 incl. `scripts/stubs` 21). Classification pending.

Distinct finding class: **intra-file duplicate exported symbols** in
`src/engine/warrior/skillBreakpoints.ts` — `ST_ATT`/`ST_PAR`,
`WT_ATT`/`WT_DEF`, `WL_ATT`/`WL_PAR`, `SZ_PAR_MOD`/`SZ_DEF_MOD`
each declared twice (lines 32/43, 46/60, 97/108, 226/247).

## §P Perf

scan-in-loop 88 exceptions — re-triage queue (each `why` re-verified).
entries-in-loop 5 exceptions — verified live. Perf band: 257.7 ms/week
@ 40w soak. test-audit `over2s`: 23 specs (re-tier candidates).

## §C CSS / design-bible conformance

ui-audit 0 across all five rules at baseline. By-reading conformance
sweep pending — `index.css` (1,369 L), `tailwind.config.ts`, all
pages/components vs `DESIGN_BIBLE_UI_v1.0.md` (radius-0, Cinzel display
type, tracking caps, tabular-nums, 3:1 contrast, data-integrity §L605).

## §B Bug register

_Populated during Phase 1 reads._

## §U Unique-logic register

_Rebuilt during Phase 1._ V18 U1–U10 re-verification pending.

## Scanner-interface reference

Importable: `collectDuplicates({ident,window,minBlock})`,
`collectSizes()`, `collectParamCounts()` + `PARAM_LIMIT`,
`collectEntriesInLoop()`, `collectUiAudit()`, `collectSrpCensus()`,
`collectScanInLoop()`. Subprocess-only: `orphan-scan`,
`data-array-dup-scan`, `test-audit-scan` (regenerates JSONs),
`dedupe`, `fuzzy_dedupe`, `soak` (needs `bun`, not `node`).
