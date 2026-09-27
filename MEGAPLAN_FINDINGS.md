# MEGAPLAN FINDINGS — Exhaustive Review & Verdict Tables

**Scope:** Full-repo re-read with tiered sweeps + scanner-generated findings. Every row carries a verdict: **APPROVED** (confirmed, action planned), **CORRECTED** (real but different), **DISPROVED** (premise false), **NOTE** (intentional-dormancy/accepted candidate).
**Baseline:** `3bc5476e` (post baseline-repair; tag `pre-megaplan-v8` = `a8cf7ca2`).
**Authority:** full autonomy on verdicts per owner direction; this document is the audit trail.

---

## 0. Validation Ledger — plan-draft claims audited

| # | Claim | Verdict | Evidence / correction |
|---|---|---|---|
| V1 | ~111k LOC non-test | **APPROVED** | `wc -l` per top dir |
| V2 | 7 engine file/dir shadows + ~43 flat root files | **APPROVED** | `aging` `economy` `favorites` `injuries` `promoters` `simulate` `training` each `X.ts` + populated `X/` |
| V3 | 165 functions ≥80 lines | **CORRECTED (methodology)** | crude brace-depth heuristic; authoritative census = `scripts/function-length.mjs` (Phase 1). Worst offenders verified real |
| V4 | `data/arenas.ts` 1,558 splittable | **APPROVED** | registry fns L3–94 + ~40 inline `*_ARENA` consts + `ARENA_LORE` mixed in one file |
| V5 | `traitDefs.ts` 997 splittable | **APPROVED (data-dominant)** | single `TRAITS` literal L96+; split types + tier-sharded data |
| V6 | `arenaChampionship.ts` 960 split | **CORRECTED** | 922 now — user extracted `championsTournament.ts` (`284a88c5`); remaining axes: lifecycle / offers / perks / delta |
| V7 | `weekPipelineService.ts` 610 splittable | **APPROVED** | seams: pass table L117–251, context prep, `buildWeekCaches` L305+, stage runner |
| V8 | `state.types.ts` 752 domain-splittable | **APPROVED** | ≥10 type domains in one file |
| V9 | `chaosHandlers.ts` 828 / `loreData.ts` 658 | **APPROVED (sampled)** | bulk single-domain files |
| V10 | `warriorNames.ts` 1,221 keepable | **NOTE** | homogeneous data; exemptible if Phase-1 verdict finds no mixed logic |
| V11 | Per-route primary CTA missing | **VIOLATION CONFIRMED** | `AppHeader.tsx:367` static `ExecuteWeekButton`; labels week/day-driven. Spec route names stale (`/run-round`→`/stable/bouts` etc.) — mapping amendment required |
| V12 | Page primitives universal | **CORRECTED → gap confirmed** | `PageFrame` 21/~35, `PageHeader` 28/~35 |
| V13 | Raw hex/rgba = violations | **CORRECTED (scope)** | 105 files contain literals; legit subset exists (crest metals, SVG stops, semantic chart colors) — classified audit w/ allowlist required |
| V14 | No dup/dep tooling | **APPROVED** | no jscpd/knip/madge; `orphan-scan.mjs` + `dedupe.mjs` + `test-audit-scan.mjs` exist |
| V15 | Coverage floors 84/74/78/85.5 | **APPROVED** | `vitest.config.ts` |
| V16 | `SAVE_STATE_VERSION` bumpable | **APPROVED** | `'2.1.0-hardened'` @ `constants/core/core.ts:12` → bump to `3.0.0-megaplan` at first schema change |
| V17 | AppShell wraps all non-FTUE routes | **APPROVED** | `__root.tsx` |
| V18 | `bun test` has 4 ignores | **CORRECTED** | 7 `pathIgnorePatterns` (e2e, out/, 2 config tests, `*.slow`, bibleIndex, HelpA11y) |
| V19 | Slow suite = 12 files | **CORRECTED** | 24 `*.slow.test.*` |
| V20 | e2e = 2 nav-covering specs | **APPROVED** | `golden-path` + `seasonal-tournament`; surfaced routes need additions |

---

## A. Unreachable / parallel modules

*(populated by Phase-1 `orphan-scan` + reads)*

## B. Dead state fields

## C. Dead data / narrative content

## D. Dead exports in live modules

## E. Nav-hidden / unrouted UI

## F. AI-unreachable subsystems

## G. Spec-matrix gaps (Master Bible Feature Integration Matrix)

## H. File/dir shadows & misplaced modules

| # | Finding | Verdict | Plan |
|---|---|---|---|
| H1 | `engine/{aging,economy,favorites,injuries,promoters,simulate,training}.ts` shadow same-named dirs | **APPROVED** | Fold each flat file into its dir (merge/index), `git mv` + codemod imports |
| H2 | ~36 remaining flat root files (`fame.ts`, `telemetry.ts`, `crowdMood.ts`, `skillCalc.ts`, `traitDefs.ts`…) | pending per-file verdict | relocate to domain dirs per Phase-1 map |

## I. Monolithic files (>800 logic / >1,200 data)

| # | File | Lines | Verdict |
|---|---|---|---|
| I1 | `data/arenas.ts` | 1,558 | APPROVED → `arenas/{registry,venues/*,lore,index}` |
| I2 | `data/names/warriorNames.ts` | 1,221 | NOTE → keep-by-verdict |
| I3 | `engine/traitDefs.ts` | 997 | APPROVED → `traitDefs/{types,*-tier data,index}` |
| I4 | `engine/championship/arenaChampionship.ts` | 922 | APPROVED → `{lifecycle,titleOffers,perks,delta}` + existing `championsTournament` |
| I5 | `engine/pipeline/offseasonEvents/chaosHandlers.ts` | 828 | APPROVED → per-event-family + registry |
| I6 | `types/state.types.ts` | 752 | APPROVED → domain shards + barrel |
| I7 | `engine/narrative/lore/loreData.ts` | 658 | APPROVED → thematic shards + index |
| I8 | `engine/pipeline/services/weekPipelineService.ts` | 610 | APPROVED → `weekPipeline/{passes,context,caches,runner,index}` |
| I9–I13 | `constants/arena/weather.ts` 531 · `constants/combat/combat.ts` 509 · `data/equipment/weapons.ts` 508 · `types/narrative.types.ts` 503 · `combat/mechanics/weatherEffects.ts` 497 | — | verdict pending Phase-1 read |

## J. Long functions (>80 authoritative)

*(populated by `function-length.mjs`; crude top-list: `computeStableCouncilReport` 361 · `computeWeeklyBreakdown` 179 · `runSimulation` 157 · ~30 page components 160–383)*

## K. Duplicate clusters

*(populated by `dup-scan.mjs`)*

## L. Design-Bible violations

| # | Finding | Verdict |
|---|---|---|
| L1 | Static `ExecuteWeekButton` for all routes; spec mandates per-route CTA (`VIEW CARD ›`, `COMMIT REGIMEN ›`, `SIGN CONTRACT ›`, `CLOSE SEASON ›`, `ADVANCE BRACKET ›`) | **APPROVED** — location-aware CTA registry + spec route-table amendment |
| L2 | `PageFrame`/`PageHeader` non-universal (21/28 of ~35) | **APPROVED** — conform or documented exemption |
| L3 | 105 files w/ raw color literals — needs classification (SVG paints/data palettes legit) | **APPROVED** — allowlisted token sweep + `uiTokens` guard test |
| L4–Ln | populated by `ui-audit-scan.mjs` | |

## M. Test-suite findings

### M2. Test-plan table — change → required test(s) → status

*(populated Phase 1–2; the acceptance checklist for the test-first invariant)*

Status values: `constructed` · `skipped-spec` · `green` · `n/a-covered`
