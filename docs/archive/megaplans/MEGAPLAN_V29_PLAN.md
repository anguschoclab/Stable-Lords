# MEGAPLAN V29 — Exhaustive Review & Full Branch Consolidation

One-sentence summary: Run the full house megaplan ritual over the entire repo under a strict test-first contract — adjudicate and union-merge all 15 open PRs (7 narrative-pool, 2 button-type, 3 perf-memoization, 1 a11y, 2 test-coverage) directly into main with per-branch gates, delta-verify a broad code re-read against the V28 baseline, burn down the whole open BACKLOG plus bugs found en route, then disposition every PR, delete every merged remote branch, and publish a verdict matrix approving/disproving each finding.

> **Validation status:** every structural claim in this plan was audited against the code on 2026-11-19 before landing (see `MEGAPLAN_V29_FINDINGS.md` §0). Phase 3 enforces strict test-first: every merge pin and backlog fix spec is authored, committed, and observed RED before its implementation commit.

## Scope Decision (user-confirmed)

- **Framing — MEGAPLAN V29**: full ritual — `MEGAPLAN_V29_{PLAN,FINDINGS,LEDGER,DEFERRED}.md` at docs/ root, `pre-megaplan-v29` restore tag, per-commit ledger, BACKLOG fold at close-out, V28 set archives atomically with the V29 scaffold.
- **Merge path — direct to `main`**: per V18–V21 precedent; one branch per commit with gates between.
- **PR swarm — union-merge per cluster**: narrative pools deduped into one curated merge per cluster; each source PR gets a documented verdict.
- **Fix scope — whole backlog + bugs found**: every open BACKLOG row attempted; standing deferrals (V24-D5, V27-§5) re-affirmed per their own terms; feature-scale items (V22-D3 damage model, V22-D4 ADM tier) behind a go/no-go gate.
- **Constraints:** zero save-file/backwards-compat. `SAVE_STATE_VERSION` (`src/constants/core/core.ts:12`) bump optional — decision recorded in FINDINGS.

## Safety & hygiene

- Restore tag `pre-megaplan-v29` (pushed); 15 backup refs `refs/megaplan/v29/pr-<N>` (pushed) before any branch deletion.
- `megaplanDocLayout` invariants: exactly one lineage at docs/ root — Phase 0 is a single atomic commit (scaffold + V28 archive + `ARCHIVED_DOCS`/`ARCHIVED_VERSIONS` += V28 + `docs/INDEX.md` + BACKLOG latest-pointer).
- Deletes never mixed with moves; one cluster per commit.
- Generated files are regenerated, never hand-merged: `routeTree.gen.ts` (`bunx tsr generate` in `type-check`), `runnerGroups.json`/`auditBaseline.json` (`bun scripts/test-audit-scan.mjs`), `docs/reports/orphan-report.md` (`scripts/orphan-report.mjs`).
- PR junk dropped at merge: `.jules/bolt.md` (#1084), `plan.md` (#1081).
- `.devin/plans` top level must not carry `^megaplan-*` drafts (`megaplanDocLayout` L136-147) — session plan mirror named `plan-*.md`.

## PR inventory & conflict map (file-level overlap pre-mapped; merge-tree verified Phase 1)

| Cluster               | PRs                    | Shared surface                                                                          | Verdict shape                                                                                                   |
| --------------------- | ---------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Narrative lore pools  | 1079, 1082, 1085       | `origins`, `childhoodTraits`, `definingMoments`, `arenas/lore.ts`, `v21Narrative.guard` | union + dedupe; #1079 adds trait defs (`flaws.ts`, `registry.ts`, `traitDedup.test.ts`, guard pins)             |
| Combat narrative JSON | 1080, 1083, 1089, 1093 | `combatKillText.json`, `combatPbp.json` (+`combatStrikes`, `uiMeta`)                    | union; #1083 edits `scripts/fuzzy_dedupe.mjs` itself — adjudicated on merit                                     |
| Button types          | 1090, 1091             | `WarriorLeaderboardFilters.tsx`, `FilterToggleButton.test.tsx`                          | 1090 near-superset; #1091's unique hunk is generated `docs/ORPHAN_REPORT.md` at a stale pre-V28 path → strip    |
| Perf memoization      | 1084, 1088, 1092       | independent files                                                                       | verify referential-equality semantics vs merged `useShallow` precedent                                          |
| Test coverage         | 1081, 1086             | `auditBaseline.json`, `runnerGroups.json` (generated — strip+regen)                     | #1081 adds `src/test/engine/pipeline/services/` mirroring `src/engine/pipeline/services/` — domain-filing valid |
| A11y tooltips         | 1087                   | 6 standalone component files                                                            | keyboard-handler correctness + determinism check                                                                |

## Phase 0 — Safety, baseline & docs scaffold (atomic)

- Tag `pre-megaplan-v29` + push; push 15 backup refs `refs/megaplan/v29/pr-<N>`.
- Baseline → LEDGER §0: `type-check`, `lint`, `test` (counts/duration), coverage floors, advisory scan (30 dependabot alerts at Phase-0).
- One atomic commit: `MEGAPLAN_V29_{PLAN,FINDINGS,LEDGER}.md` scaffold + `git mv MEGAPLAN_V28_* → docs/archive/megaplans/` + `megaplanDocLayout` allowlists + `INDEX.md` megaplan section → V29 rows + BACKLOG "Current latest" → V29.

## Phase 1 — PR adjudication (no code changes)

- Fetch all 15 heads; `git merge-tree` each vs main + pairwise within narrative clusters → lock conflict surface.
- **V28-staleness sweep:** every PR diff checked for paths V28's move map renamed (`docs/ORPHAN_REPORT.md` proven in #1091; also `USER_MANUAL`, `TESTING`, `DESIGN_*`, `PIPELINE_*`, `Stable_Lords_*`, `Daily_*`). Hit → strip + remap note.
- Per-PR diff review; trait adds validated against `TRAIT_EFFECT_KEYS` + `LEGACY_TRAIT_ORDER` drift assert (`registry.ts:220-224`).
- `gh api .../pulls/<N>/comments` human-thread sweep per PR.
- Lock verdicts in FINDINGS §1: MERGE / MERGE-WITH-FIXES / MERGE-MINUS-HUNKS / SUPERSEDED-BY / REJECT.

## Phase 2 — Delta-verified broad read

- Scanner suite re-run diffed vs Phase-0 baseline: `scripts/` orphan-scan, data-array-dup-scan, skill-path-scan, ui-audit-scan, test-audit-scan, dedupe, dup-scan, fuzzy_dedupe, function-length, param-count, srp-census, entries-in-loop, scan-in-loop, narrative_validate; root `find-dupes.mjs`; `bun run dead-code:report` (knip), `bun run dupes` (jscpd).
- Module sweep + deep-dives on PR/backlog domains: engine → state/schemas → data → pages/routes/components → hooks/lib/utils → constants → test infra → scripts/e2e/electron.
- Spec-vs-shipped spot re-audit vs `docs/design/` on touched domains.
- BACKLOG rows re-verified; new bugs → FINDINGS §B. **No implementation may precede a bug's spec commit.**

## Phase 3 — Test inventory committed BEFORE any merge (hard gate; strict test-first)

**Contract:** every Phase-4 merge pin and Phase-5 fix spec authored, committed, observed RED here. Sole exception: a spec that cannot exist pre-implementation lands as a spec-only RED commit immediately before its fix — LEDGER-logged.

| Spec / change                                                                                | Covers                                                              | State at commit | Turns green         |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------- | ------------------- |
| `v21Narrative.guard` exact pins → `>=` floors                                                | pool counts only grow                                               | GREEN           | —                   |
| `v21Traits.guard` count 184 → `>=` floor (SURVIVING asserts stay)                            | trait count only grows                                              | GREEN           | —                   |
| `v29Narrative.guard.test.ts` (new LIVE_RATCHET)                                              | union entries + deduped exact counts + zero dupes/id-collisions     | RED             | Phase 4 lore merges |
| `v29Traits.guard.test.ts` (new, iff #1079 traits land)                                       | ids ⊆ TRAITS+LEGACY_TRAIT_ORDER, effect keys ⊆ whitelist, count pin | RED             | Phase 4 trait merge |
| V26-D2 spec: `SystemPass` passes `computeNextSeason(nextWeek)` — promotion fires on boundary | backlog fix                                                         | RED             | Phase 5             |
| V26-D3 spec: fresh-state digest stable across two `createFreshState` calls                   | backlog fix                                                         | RED             | Phase 5             |
| V26-D4 spec: gazette `t()` deterministic under seeded rng                                    | backlog fix                                                         | RED             | Phase 5             |
| V26-D1 spec: favorites renders discovered-tactic row                                         | backlog fix                                                         | RED             | Phase 5             |
| V16-A11 spec: bid priority under bout-week weather                                           | backlog fix                                                         | RED             | Phase 5             |
| V21-B3 spec: `WEATHER_STATS` token ↔ `staminaMult` coherence                                 | backlog fix                                                         | RED             | Phase 5             |
| Phase-2 §B bug specs                                                                         | per discovered bug                                                  | RED             | Phase 5             |
| `GUARD_REGISTRY` += v29 guards + runnerGroups/auditBaseline regen                            | registration enforced                                               | GREEN           | —                   |

## Phase 4 — Merge sequence (one branch per commit; type-check+test+lint between each)

1. `#1084` SnapshotRow (drop `.jules/bolt.md`) → 2. `#1092` CoachOverlay → 3. `#1088` TreasuryOverview → 4. `#1087` a11y → 5. `#1086` component tests (strip generated → regen) → 6. `#1081` weekPipeline tests (drop `plan.md`, strip generated) → 7. `#1090` button types → `#1091` SUPERSEDED/closed after proving nothing unique survives → 8. combat-JSON union `#1080`→`#1083`→`#1089`→`#1093` (strip generated) → 9. lore union `#1079`→`#1082`→`#1085` → 10. regen commit → 11. cross-PR dedupe cleanup → all Phase-3 REDs GREEN.

Mechanics: `git merge --no-ff origin/<branch>`; union+dedupe for tail-appends; generated files always stripped & regenerated.

## Phase 5 — Backlog burn-down + newly found bugs (spec-first per Phase-3 contract)

- V26-D2 `processTierProgression` dead call (`SystemPass.ts:53` passes `state.season`; `computeNextSeason` already imported L19) → wire or remove; delete `hashStr(createdAt)+week` rng fallback (`tierProgression.ts:66-67`).
- V26-D3 `meta.createdAt` wall-clock (`gameStateFactory.ts:109`) → `weekToTimestamp(0)`/seed-derived; re-baseline digests.
- V26-D4 Gazette `t()` crypto fallback (`gazetteTemplateHelpers.ts:61-66`) → thread pass rng.
- V26-D1 favorites `discovered.tactic` row (zero `tactic` refs under `favorites/` verified).
- V16-A11 bid-priority weather (`offers.ts:46` uses `state.weather`; `_currentWeek` is underscore-ignored — fix needs next-week weather derivation).
- V21-B3 `WEATHER_STATS` 'Chaos Storm' "STAMINA DRAIN 125%" vs `staminaMult: 0.8` (`weatherEffects/table.ts:418-419`) — pick convention, fix display or effect.
- V21-B6 KD zero kill-rate (`balance.slow.test.ts:308`) — run slow spec, adjudicate.
- V15 perf pair — `cloneObject`/`copyDataProperties` gone; residual churn at `structuredClone` sites (`autosim.ts`, `weekPipeline/context.ts`, `weekPipelineService.ts`, `runtime/worker.ts`, `ProgressionPass.ts`, `mortalityHandler.ts`). Re-measure; fix only if cheap.
- V22-D3 Pagan damage model — `damageCalc.ts:21-24` `(class+4)×locMult×variance`; armor soak at `mechanics/weaponArmor.ts`. Soak rework + damage/KO/kill re-verification; go/no-go gate.
- V22-D4 ADM/graduation tier — `ATTRIBUTE_MAX=25` (`shared/attributes.ts:40`); feature-scale; same gate.
- Standing deferrals re-affirmed: V24-D5 modes, V27-§5 design deferrals.
- Watch items re-measured at world re-baseline.

## Phase 6 — Validation battery & close-out

`type-check`+`lint`+`test` green; `test:slow` mandatory; `e2e` chromium; `build`; `bun test` parity; coverage floors; 40-week soak + `determinismAudit`; knip/jscpd zero-regression; `narrative-validate`; `bun run dev` spot-checks; `MEGAPLAN_V29_DEFERRED.md`; BACKLOG fold; INDEX final pass.

## Phase 7 — GitHub cleanup & verdict publication

Push `main`; disposition all 15 PRs with evidence comments → close; delete 15 remote branches (heads preserved `refs/megaplan/v29/*`); tag `post-megaplan-v29`; FINDINGS §V verdict matrix — every adjudication/claim/backlog row APPROVED / DISPROVED / CORRECTED with `file:line` evidence; LEDGER baseline → final → Δ.

## Risks / considerations

- **Lineage atomicity** — Phase 0 is one commit or `megaplanDocLayout`/`docsLayout` both break.
- **Strict test-first is load-bearing** — Phase 3 hard gate; spec-only RED exceptions LEDGER-logged.
- **RNG/digest drift** — narrative pools, traits, `createdAt`, gazette rng perturb seeded output; multi-seed re-baseline discipline.
- **Scope risk** — V22-D3/D4 feature-scale; go/no-go keeps them from destabilizing the train; unresolved → DEFERRED with evidence.
- **Nightly-only suites** — slow tier + e2e matrix gate nightly CI; post-merge watch items.
- **Windows local vs Linux CI** — local green necessary, CI is the final gate.
