# MEGAPLAN V29 — Exhaustive Review & Full Branch Consolidation (15 open PRs) — validated

Run the full house megaplan ritual over the entire repo under a strict test-first contract: adjudicate and union-merge all 15 open PRs directly into main with per-branch gates, delta-verify a broad code re-read against the V28 baseline, burn down the full open BACKLOG plus bugs found en route — every fix preceded by a RED spec — then disposition every PR, delete every merged remote branch, and publish a verdict matrix approving/disproving each finding.

## Validation status

Every claim in this draft was audited against the code on **2026-11-19** (second pass). Verdicts are integrated inline as ✅ APPROVED / ⚠️ CORRECTED / ❌ DISPROVED; the consolidated table is at the end. Two live corrections resulted: the `.devin/plans` mirror was renamed off the `megaplan-*` pattern after `megaplanDocLayout.guard.test.ts:136-147` proved it a suite violation, and all stale entry-point paths were repointed.

## Context & conventions (all ✅ validated)

- **Lineage:** MEGAPLAN **V29**, direct successor of V21 (same task shape). Full ritual confirmed by user: `docs/MEGAPLAN_V29_{PLAN,FINDINGS,LEDGER,DEFERRED}.md`, BACKLOG fold, V28 set → `docs/archive/megaplans/` at close-out.
- **Working state:** `main` clean, up-to-date with `origin/main` — no WIP caveat needed (unlike V21).
- **Merge path (user-confirmed):** direct commits to `main`; `pre-megaplan-v29` restore tag + per-branch backup refs `refs/megaplan/v29/*` pushed before any deletion.
- **Constraints:** zero save-file/backwards-compat. `SAVE_STATE_VERSION` = `'3.0.0'` (`src/constants/core/core.ts:12`) ✅ — bump optional, decision recorded in FINDINGS.
- **PR comments:** all 15 PRs carry exactly one comment (Jules bot greeting), zero reviews ✅. Human-thread sweep still mandated: `gh api repos/anguschoclab/Stable-Lords/pulls/<N>/comments` per PR during Phase 1 (gh authenticated as owner ✅). Zero closed-unmerged PRs since V21 — nothing to salvage ✅.
- **Guard lifecycle:** `GUARD_REGISTRY` lives at `src/test/testQualityAudit.test.ts:155` (47 entries, all `LIVE_RATCHET`) ✅. Precedent: old version guards' exact pins → `>=` floors; new version pins exact. New guards register `LIVE_RATCHET` + regenerate `runnerGroups.json`/`auditBaseline.json` via `bun scripts/test-audit-scan.mjs`.
- **`megaplanDocLayout` invariants (read in full):** exactly-one-lineage at docs/ root (`versions.size === 1`, L91) ✅; `ARCHIVED_DOCS`/`ARCHIVED_VERSIONS` allowlists (L27/L77) need += 4 V28 files / += 28; **`.devin/plans` top level rejects `^megaplan-*` drafts (L136-147)** — session-plan mirror must be named `plan-*.md` ⚠️ CORRECTED (was `megaplan-v29-plan.md`, a live violation — renamed).
- **INDEX freshness:** `docsLayout` guard requires every non-archive doc in `docs/INDEX.md`; INDEX's "Megaplan (protocol)" section indexes the current set — **the V29 set must be indexed in Phase 0, not Phase 6** ⚠️ CORRECTED (draft had it too late).
- **Hygiene:** deletes never mixed with moves; one cluster per commit; generated files regenerated never hand-merged (`routeTree.gen.ts` via `bunx tsr generate` inside `type-check` ✅; `runnerGroups.json`/`auditBaseline.json` via test-audit-scan; `docs/reports/orphan-report.md` via `scripts/orphan-report.mjs`). PR junk (`.jules/bolt.md` in #1084, `plan.md` in #1081) dropped at merge.

## PR inventory & conflict map (file-level overlap mapped; merge-tree verification in Phase 1)

| Cluster               | PRs                    | Shared surface                                                                          | Verdict shape                                                                                                                                                    |
| --------------------- | ---------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Narrative lore pools  | 1079, 1082, 1085       | `origins`, `childhoodTraits`, `definingMoments`, `arenas/lore.ts`, `v21Narrative.guard` | union + dedupe; #1079 also adds trait defs (`flaws.ts`, `registry.ts`, `traitDedup.test.ts`, `v20/v21 guards`)                                                   |
| Combat narrative JSON | 1080, 1083, 1089, 1093 | `combatKillText.json`, `combatPbp.json` (+`combatStrikes`, `uiMeta`)                    | union; #1083 edits `scripts/fuzzy_dedupe.mjs` itself — adjudicate scanner change on merit                                                                        |
| Button types          | 1090, 1091             | `WarriorLeaderboardFilters.tsx`, `FilterToggleButton.test.tsx`                          | 1090 near-superset; #1091's unique hunk is generated `docs/ORPHAN_REPORT.md` — **stale pre-V28 path** (now `docs/reports/orphan-report.md`) → strip, never merge |
| Perf memoization      | 1084, 1088, 1092       | independent files                                                                       | verify referential-equality semantics vs merged `useShallow` precedent (#1062/#1067/#1069/#1076)                                                                 |
| Test coverage         | 1081, 1086             | `auditBaseline.json`, `runnerGroups.json` (generated — strip+regen)                     | #1081 adds `src/test/engine/pipeline/services/` (new dir mirroring `src/engine/pipeline/services/` ✅ domain-filing valid)                                       |
| A11y tooltips         | 1087                   | 6 standalone component files                                                            | keyboard-handler correctness + determinism check                                                                                                                 |

## Phase 0 — Safety, baseline & docs scaffold (atomic)

- [ ] Tag `pre-megaplan-v29` + push; push 15 backup refs `refs/megaplan/v29/pr-<N>` (each PR head).
- [ ] Baseline into LEDGER §0: `bun run type-check`, `bun run lint`, `bun run test` (counts/duration), coverage floors (`vitest.config.ts:60-67` ✅), advisory scan (`gh api .../dependabot/alerts`; fallback `bun audit` — replaces draft's unspecified check).
- [ ] One atomic commit: `docs/MEGAPLAN_V29_{PLAN,FINDINGS,LEDGER}.md` scaffold + `git mv docs/MEGAPLAN_V28_*.md docs/archive/megaplans/` + `megaplanDocLayout` allowlist updates + `docs/INDEX.md` Megaplan section → V29 rows + BACKLOG "Current latest" → V29. (INDEX inclusion promoted from Phase 6 — guard-enforced ⚠️.)

## Phase 1 — PR adjudication (no code changes)

- [ ] Fetch all 15 heads; `git merge-tree` each vs main + pairwise within narrative clusters → lock real conflict surface.
- [ ] **V28-staleness sweep (NEW — validated need):** check every PR diff for paths V28's move map renamed (`docs/ORPHAN_REPORT.md` proven in #1091; also `docs/USER_MANUAL.md`, `docs/TESTING.md`, `docs/DESIGN_*`, `docs/PIPELINE_*`, `docs/Stable_Lords_*`, `docs/Daily_*`). Any hit → strip hunk + note remap.
- [ ] Per-PR diff review per the cluster table; trait adds validated against `TRAIT_EFFECT_KEYS` whitelist + `LEGACY_TRAIT_ORDER` drift assert (`registry.ts:220-224` throws on unsynced additions — #1079 must update it or import breaks ✅ verified mechanism).
- [ ] Lock verdicts in FINDINGS §1: MERGE / MERGE-WITH-FIXES / MERGE-MINUS-HUNKS / SUPERSEDED-BY / REJECT.

## Phase 2 — Delta-verified broad read

Scanner suite re-run, diffed vs V28 close-out + Phase-0 baseline (2,913 tracked files; scanner coverage + targeted deep-dives, not line-by-line):

- [ ] `scripts/`: orphan-scan, data-array-dup-scan, skill-path-scan, ui-audit-scan, test-audit-scan, dedupe, dup-scan, fuzzy_dedupe, function-length, param-count, srp-census, entries-in-loop, scan-in-loop, narrative_validate; **root**: `find-dupes.mjs` ⚠️ (draft misfiled it under scripts/); `bun run dead-code:report` (knip), `bun run dupes` (jscpd).
- [ ] Module sweep + deep-dives on PR/backlog-touched domains: `src/engine` (combat, pipeline, traits, narrative) → `state`/`schemas` → `data` → `pages`/`routes`/`components` → `hooks`/`lib`/`utils` → `constants` → `src/test` infra → `scripts`/`e2e`/`electron`.
- [ ] Spec-vs-shipped spot re-audit vs `docs/design/` on touched domains.
- [ ] Every open BACKLOG row re-verified; new bugs → FINDINGS §B. **Any bug found here must be specced in Phase 3 — no implementation may precede its spec commit.**

## Phase 3 — Test inventory committed BEFORE any merge (hard gate; strict test-first)

**Contract:** every Phase-4 merge and Phase-5 fix has its spec authored, committed, and observed RED in this phase. Sole exception: a spec that cannot meaningfully exist pre-implementation lands as a spec-only commit observed RED immediately before its fix commit — the exception is logged in the LEDGER, never silent.

| Spec / change                                                                                                                                                      | Covers                                                                                                       | State at commit | Turns green         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | --------------- | ------------------- |
| `v21Narrative.guard` exact pins → `>=` floors                                                                                                                      | pool counts only grow                                                                                        | GREEN           | —                   |
| `v21Traits.guard` count pin `184` → `>=` floor; SURVIVING membership asserts unchanged (they remain valid — union only grows) ⚠️ corrected detail                  | trait count only grows                                                                                       | GREEN           | —                   |
| `v29Narrative.guard.test.ts` (new, LIVE_RATCHET)                                                                                                                   | union entries per source PR; deduped exact counts; intra-pool dupes `[]`; cross-pool lore-id collisions `[]` | RED             | Phase 4 lore merges |
| `v29Traits.guard.test.ts` (new, iff #1079 traits land)                                                                                                             | new ids in `TRAITS`+`LEGACY_TRAIT_ORDER`; effect keys ⊆ `TRAIT_EFFECT_KEYS`; final count pin                 | RED             | Phase 4 trait merge |
| V26-D2 spec: `SystemPass` invokes `processTierProgression` with `computeNextSeason(nextWeek)` (or the call+function are gone) — promotion fires on season boundary | backlog fix                                                                                                  | RED             | Phase 5             |
| V26-D3 spec: fresh-state digest stable across two `createFreshState` calls (no wall-clock field)                                                                   | backlog fix                                                                                                  | RED             | Phase 5             |
| V26-D4 spec: gazette `t()` picks deterministically under a seeded rng (no crypto fallback at deterministic call sites)                                             | backlog fix                                                                                                  | RED             | Phase 5             |
| V26-D1 spec: favorites section renders discovered-tactic row                                                                                                       | backlog fix                                                                                                  | RED             | Phase 5             |
| V16-A11 spec: bid priority evaluated under bout-week weather                                                                                                       | backlog fix                                                                                                  | RED             | Phase 5             |
| V21-B3 spec: display token ↔ `staminaMult` coherence across `WEATHER_STATS`×`weatherEffects/table`                                                                 | backlog fix                                                                                                  | RED             | Phase 5             |
| Phase-2 §B bug specs                                                                                                                                               | per discovered bug                                                                                           | RED             | Phase 5             |
| `GUARD_REGISTRY` += v29 guards + `runnerGroups`/`auditBaseline` regen                                                                                              | registration enforced                                                                                        | GREEN           | —                   |

## Phase 4 — Merge sequence (one branch per commit; type-check+test+lint between each)

1. `#1084` SnapshotRow (drop `.jules/bolt.md`) → 2. `#1092` CoachOverlay → 3. `#1088` TreasuryOverview → 4. `#1087` a11y → 5. `#1086` component tests (strip generated → regen after) → 6. `#1081` weekPipeline tests (drop `plan.md`, strip generated) → 7. `#1090` button types → `#1091` SUPERSEDED/closed after proving nothing unique survives → 8. combat-JSON union `#1080`→`#1083`→`#1089`→`#1093` (strip generated) → 9. lore union `#1079`→`#1082`→`#1085` → 10. regen commit → 11. cross-PR dedupe cleanup → all Phase-3 REDs GREEN.

Mechanics: `git merge --no-ff origin/<branch>`; union+dedupe for tail-appends; generated files always stripped & regenerated.

## Phase 5 — Backlog burn-down (user: whole backlog) + newly found bugs

Spec-first per the Phase-3 contract; lowest-risk first:

- [ ] V26-D2 — wire `computeNextSeason(nextWeek)` as `newSeason` (`SystemPass.ts:53`; import already present at L19 ✅) or remove call+function; delete the `hashStr(createdAt)+week` rng fallback (`tierProgression.ts:66-67` ✅ verified verbatim).
- [ ] V26-D3 — `gameStateFactory.ts:109` `createdAt: string = new Date().toISOString()` default → `weekToTimestamp(0)` (`@/constants` export exists ✅, used by `worldMatchmaking`/`mortalityHandler`/`fightSummaryFactory`) or seed-derived; determinism specs already pass fixed timestamps (`weekDeterminism.slow.test.ts:28` ✅) — re-baseline digests.
- [ ] V26-D4 — `gazetteTemplateHelpers.ts:61-66` crypto fallback verified verbatim ✅ → thread pass rng at deterministic callers.
- [ ] V26-D1 — favorites `discovered.tactic` row: zero `tactic` refs under `src/components/warrior/favorites/` ✅ verified; add row alongside WeaponAffinity/BioRhythm/LearnAffinity sections.
- [ ] V16-A11 — `offers.ts:46` `weather: state.weather` verified; nuance found ⚠️: `_currentWeek: state.absoluteWeek + 1` is passed but underscore-ignored by `generateBoutBids` — fix needs next-week weather derivation, not just a different argument.
- [ ] V21-B3 — `weatherStats.ts:61` "STAMINA DRAIN 125%" vs `weatherEffects/table.ts:418-419` `staminaMult: 0.8` verified verbatim ✅ (siblings use direct-mult: 'Temporal Rift' 200%); pick convention, fix display or effect.
- [ ] V21-B6 — `balance.slow.test.ts:308` spec verified verbatim ✅; run slow tier, adjudicate.
- [ ] V15 perf pair — **entry points stale** ⚠️: `cloneObject`/`copyDataProperties` no longer exist; residual churn now lives at `structuredClone` sites (`autosim.ts`, `weekPipeline/context.ts`, `weekPipelineService.ts`, `runtime/worker.ts`, `ProgressionPass.ts`, `mortalityHandler.ts`). Re-measure; fix only if cheap.
- [ ] V22-D3 Pagan damage model — `damageCalc.ts:21-24` verified verbatim (`(class+4)×locMult×variance`); armor side moved — **BACKLOG path stale** ⚠️: now `src/engine/combat/mechanics/weaponArmor.ts`. Soak rework + distribution re-verification; go/no-go gate last.
- [ ] V22-D4 ADM tier — `ATTRIBUTE_MAX = 25` at `src/types/shared/attributes.ts:40` ✅; feature-scale; same gate.
- [ ] Standing deferrals re-affirmed (V24-D5 modes, V27-§5 design deferrals — their own terms gate on canon push).
- [ ] New §B bugs per Phase 3; watch items re-measured at world re-baseline.

## Phase 6 — Validation battery & close-out

- [ ] `type-check` + `lint` + `test` green; `test:slow` mandatory (traits/balance/pipeline/backlog touched); `e2e` chromium (`playwright.config.ts:44` ✅); `build`; `bun test` parity (CI shards it).
- [ ] Coverage thresholds hold (`vitest.config.ts` floors ✅).
- [ ] 40-week soak (`scripts/soak.mjs` ✅) + `determinismAudit` (`src/test/engine/determinismAudit.test.ts` ✅) — narrative/trait/createdAt/gazette deltas must be explainable; multi-seed re-baseline discipline.
- [ ] knip/jscpd/dup-scans zero-regression; `narrative-validate` clean.
- [ ] `bun run dev` spot-check: favorites row, tooltip keyboard nav, button-type surfaces.
- [ ] `MEGAPLAN_V29_DEFERRED.md`; BACKLOG fold (§1 struck/updated, §2 watch refreshed, §6 += V28); INDEX final pass.

## Phase 7 — GitHub cleanup & verdict publication

- [ ] Push `main`. Disposition all 15 PRs with per-PR evidence comments → close. Delete all 15 remote branches (heads preserved under `refs/megaplan/v29/*`). Tag `post-megaplan-v29`.
- [ ] FINDINGS §V verdict matrix: every PR adjudication, Phase-2 claim, backlog row → APPROVED / DISPROVED / CORRECTED with `file:line` evidence. LEDGER baseline → final → Δ.

## Validation verdicts (draft claim → verdict → evidence)

| #   | Draft claim                                                                       | Verdict                | Evidence                                                                                                                            |
| --- | --------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `megaplanDocLayout` enforces one lineage; atomic swap needed                      | ✅ APPROVED            | spec L83-93 `versions.size===1`; allowlists L27/L77                                                                                 |
| 2   | GUARD_REGISTRY at `testQualityAudit.test.ts:~155`                                 | ✅ APPROVED            | exact: L155, 47 LIVE_RATCHET entries                                                                                                |
| 3   | `.devin/plans` accepts any name                                                   | ❌ DISPROVED           | `^megaplan-*` drafts rejected L136-147 — mirror renamed `plan-a90ed5c661debd60.md`                                                  |
| 4   | INDEX freshness needed only at close-out                                          | ⚠️ CORRECTED           | `docsLayout` enforces every non-archive doc indexed → Phase 0                                                                       |
| 5   | `weaponArmor.ts` under `resolution/`                                              | ❌ DISPROVED           | actual: `mechanics/weaponArmor.ts` (BACKLOG row itself stale)                                                                       |
| 6   | V26-D2 dead call + createdAt hazard                                               | ✅ APPROVED            | `SystemPass.ts:53` passes `state.season`; `tierProgression.ts:66-67` verbatim; fix eased — `computeNextSeason` already imported L19 |
| 7   | V26-D3 wall-clock default                                                         | ✅ APPROVED            | `gameStateFactory.ts:109` verbatim; `weekToTimestamp` exists (`@/constants`)                                                        |
| 8   | V26-D4 crypto fallback                                                            | ✅ APPROVED            | `gazetteTemplateHelpers.ts:61-66` verbatim                                                                                          |
| 9   | V26-D1 missing tactic row                                                         | ✅ APPROVED            | zero `tactic` refs under `favorites/`                                                                                               |
| 10  | V16-A11 stale weather in bids                                                     | ✅ APPROVED + deepened | `offers.ts:46`; `_currentWeek` is underscore-ignored — deeper than logged                                                           |
| 11  | V21-B3 token↔effect contradiction                                                 | ✅ APPROVED            | `weatherStats.ts:61` 125% vs `table.ts:419` `staminaMult:0.8`                                                                       |
| 12  | V21-B6 KD spec exists at balance.slow:308                                         | ✅ APPROVED            | verbatim                                                                                                                            |
| 13  | V15 `cloneObject`/`copyDataProperties` churn                                      | ⚠️ CORRECTED           | functions gone; residual now `structuredClone` at ~6 sites                                                                          |
| 14  | V22-D3 damage model shape                                                         | ✅ APPROVED            | `damageCalc.ts:21-24` verbatim                                                                                                      |
| 15  | V22-D4 caps 3–25                                                                  | ✅ APPROVED            | `ATTRIBUTE_MAX=25` `shared/attributes.ts:40`                                                                                        |
| 16  | SAVE_STATE_VERSION bump optional                                                  | ✅ APPROVED            | `'3.0.0'` `core.ts:12`                                                                                                              |
| 17  | Trait drift assert requires `LEGACY_TRAIT_ORDER` sync                             | ✅ APPROVED            | `registry.ts:220-224` throws                                                                                                        |
| 18  | v21Traits floor conversion                                                        | ✅ APPROVED + scoped   | count pin 184 → floor; SURVIVING asserts stay valid                                                                                 |
| 19  | #1091 ⊆ #1090                                                                     | ⚠️ CORRECTED           | unique hunk = generated `docs/ORPHAN_REPORT.md` (stale path) → strip; supersession holds on code                                    |
| 20  | `determinismAudit`, `soak.mjs`, chromium tier, coverage floors, nightly slow tier | ✅ APPROVED            | all verified at cited paths                                                                                                         |
| 21  | `bun audit` advisory check                                                        | ⚠️ CORRECTED           | no such script; use `gh api dependabot/alerts` (authed owner) w/ `bun audit` fallback                                               |
| 22  | Scanners all under `scripts/`                                                     | ⚠️ CORRECTED           | `find-dupes.mjs` lives at repo root                                                                                                 |
| 23  | #1081 test-dir filing legal                                                       | ✅ APPROVED            | `src/test/engine/pipeline/services/` mirrors `src/engine/pipeline/services/` per domain rule                                        |

## Risks / considerations

- **Lineage atomicity** — Phase 0 must be one commit (scaffold + archive + allowlists + INDEX) or `megaplanDocLayout`/`docsLayout` both break.
- **Strict test-first is now load-bearing** — Phase 3 is a hard gate; spec-only RED exceptions are LEDGER-logged.
- **RNG/digest drift** — narrative pools, traits, `createdAt`, gazette rng perturb seeded output; multi-seed re-baseline discipline per BACKLOG §4.
- **Scope risk** — V22-D3/D4 are feature-scale inside a consolidation; go/no-go gate keeps them from destabilizing the merge train; unresolved items return to DEFERRED with measured evidence.
- **Nightly-only suites** — slow tier + full e2e matrix gate nightly CI; post-merge watch items.
- **Windows local vs Linux CI** — local green is necessary, CI is the final gate.
