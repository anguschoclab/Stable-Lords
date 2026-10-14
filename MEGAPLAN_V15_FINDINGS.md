# MEGAPLAN V15 FINDINGS — Exhaustive Re-Audit + PR Adjudication

**Scope:** whole-repo — `src/` (1,213 prod files / 133,212 LOC; 840 test files / ~134k LOC), `scripts/` (36), `e2e/` (5 specs), `electron/`, `.github/workflows`, root configs — plus all 23 open PRs and prior-campaign claims. Zero save-file/backcompat constraints. Slow suite skipped per user directive.

**Verdict vocabulary:** `APPROVED` / `DISPROVED` / `CORRECTED` / `PARTIAL` / `REJECTED` / `DEFERRED` / `EXEMPT`. Dispositions: `KEEP`, `RESTRUCTURE`, `DEDUPE`, `WIRE`, `DELETE`, `DOCUMENT`.

**Restore point:** `pre-megaplan-v15` at `97b16a46` (pushed). Backup refs `refs/megaplan/v15/*` hold all 23 PR heads.

---

## 0. Baseline gate matrix

See `MEGAPLAN_V15_LEDGER.md` §Phase 0 — all gates green except the known
`retrieveHotStatePlausibility` shared-worker flake (now root-caused; see B1).

---

## 1. PR adjudication matrix (all 23 — frozen at 2026-10-14 cut)

Comment review: every PR carries exactly one comment — the Jules
"reporting for duty" boilerplate; zero substantive review comments across
all 23. DISPROVED the assumption that adjudicable review feedback existed.

| PR | Cluster | CI | Claim-vs-diff | Verdict | Disposition |
| --- | --- | --- | --- | --- | --- |
| #1053 | narrative-JSON | green | honest: expands pbp/strikes/kill pools, prunes dupes | APPROVED | **MERGE** (primary narrative winner) |
| #1052 | a11y | green | honest: TooltipTrigger asChild + button + aria-label + focus ring | APPROVED | **MERGE** |
| #1051 | narrative-JSON | **red (test)** | adds 6 dup origins + 4 dup childhood + 4 dup moments — violates the dedup gates it claims to satisfy | REJECTED | CLOSE |
| #1050 | narrative-JSON | green | honest: quality adds + dupe removal; `{{defender}}` claim = content-level fix | APPROVED | **MERGE** |
| #1049 | lore+traits | green | honest: +3 notable traits (ash_born_survivor, silent_monk, feral_child) + lore | APPROVED | **MERGE** |
| #1048 | feature | **red (type-check)** | FALSIFIED "hooked up for random play": missing `WEATHER_STATS`, `WEATHER_VISUALS`, seasonal pool + weight, `SEASONABLE_WEATHER_TYPES` | PARTIAL | **FIX-THEN-MERGE** — complete all 10 registration surfaces (Fall pool, weight ~1) |
| #1047 | lore+traits | **red (type-check)** | trait uses invalid Archetype literals ('evasive'/'quick'/'heavy_handed' ∉ {brutal,agile,cunning,tank}) | PARTIAL | **SALVAGE** — cherry-pick `orphan_shadow_step` with archetypes mapped (agile/brutal) |
| #1046 | narrative-JSON | green | honest but heavy-handed: -341 net (recruitment name pruning OK) + 7 one-off scripts junk | PARTIAL | **CHERRY-PICK** data edits; DROP `scripts/{analyze,expand}_*.mjs` |
| #1045 | narrative-JSON | green | honest: +173/-32 across 4 files | APPROVED | **MERGE** (union-resolve vs #1053) |
| #1044 | lore+traits | green | honest: +1 common trait (orphanage_survivor) + generation wiring | APPROVED | **MERGE** |
| #1043 | a11y | green | honest: title attr on dismiss button | APPROVED | **MERGE** — strip `.jules/palette.md` |
| #1042 | perf | green | FALSIFIED: empty diff (0 files) | REJECTED | CLOSE — no content |
| #1041 | a11y/UI | green | mixed: hazard-badge token migration + focus ring good; 3 `.animate-*` classes unused (dead CSS, but completes existing convention); `??`→`||` on aria-describedby neutral-positive | APPROVED | **MERGE** |
| #1040 | narrative-JSON | **red (test)** | dedup drops `strikes.piercing.solid` to 104 < 105 thin-category floor — over-pruned | REJECTED | CLOSE |
| #1039 | a11y | green | honest: tablist/tab roles + focus ring + e2e role update — BUT `aria-controls` dangles (no `id="panel-*"` exists) | PARTIAL | **MERGE minus `aria-controls`/`id`** |
| #1038 | lore+traits | green | honest: +3 notable traits + lore | APPROVED | **MERGE** |
| #1037 | perf | green | claim mismatch (body describes useWarriorNameState; diff uses direct `findWarrior` selector) — but diff is a real simplification: 6-field shallow select → 3 fine-grained selectors | APPROVED | **MERGE** — strip `.jules/bolt.md` |
| #1036 | narrative-JSON | green | honest: +7 arena-flavor lines + 1 dupe removal (backed up per `.claude/backups` precedent) | APPROVED | **MERGE** |
| #1035 | narrative-JSON | **red (lint+test)** | over-pruned like #1040 | REJECTED | CLOSE |
| #1034 | lore+traits | **red (lint+test+type-check)** | + junk: `find_duplicates.cjs` at root, `.claude/backups` blobs | REJECTED | CLOSE — salvage `survivalist` trait only if trivially portable |
| #1033 | tests | green, CONFLICTING | substantive test expansion; but loosens perf ceiling 12s→15s and drops negative-input assertion | PARTIAL | **CHERRY-PICK** test files; regenerate artifacts; keep 12s ceiling + negative assertion |
| #1032 | lore+traits | green, CONFLICTING | own delta small (9 files) BUT slow-test edits revert V14's seed re-baseline (777→42 → back to 777, bar 1.3→1.0) | PARTIAL | **CHERRY-PICK** lore+traits only; reject all test edits |
| #1031 | narrative-JSON | green, stale | real delta ~10 lines; bulk is `.claude/backups/*.json` blobs (+6,117) | PARTIAL | **CHERRY-PICK** content lines only |

**Merge set (9):** #1053, #1052, #1050, #1049, #1048*, #1045, #1044, #1043, #1041, #1039*, #1038, #1037, #1036 (*=with modifications).
**Cherry-pick set (4):** #1046, #1033, #1032, #1031 (+#1047 trait salvage).
**Close set (6):** #1051, #1042, #1040, #1035, #1034 (+#1047 branch after salvage).

## 2. New findings (V15 audit)

| ID | Finding | Verdict | Disposition |
| --- | --- | --- | --- |
| B1 | `retrieveHotStatePlausibility.test.ts` shared-worker flake — third recurrence (V12, V14, V15). Root cause: file runs in `shared` project (no `vi.mock`, no global stubs → `needsIsolation` false) but depends on module-level `mockOpfsFileText` in `setup.node.ts`, which a sibling's lifecycle can reset mid-file; symptom signature: plausibility fails on `'{}'` (the reset default), exactly matching all 3 observed failures | CONFIRMED | `@vitest-isolate` marker → runnerGroups regen → isolated project (repo's documented escape hatch) |
| F1 | **11 WeatherTypes are unreachable as arena weather** — 'Weeping Skies', 'Eclipse of Chaos', 'Eldritch Eclipse', 'Prismatic Rain', 'Moonlight Duel', 'Winds of Chaos', 'Diamond Rain', 'Cosmic Anomaly', 'Mana Storm', 'Dreamweavers Mist', 'Shattered Skies' — fully registered in all `Record<WeatherType>` tables but absent from every seasonal pool; no code path assigns them to `state.weather`. #1048's 'Cursed Eclipse' would be the 12th | CONFIRMED dead content (designed or accidental — undecidable from code) | **WIRE + GUARD**: formalize `OFFSEASON_WEATHER_TYPES` allowlist; new `weatherFixtureUnion` guard asserts `WEATHER_TYPES ≡ SEASONABLE ∪ OFFSEASON` — forces conscious bucketing for every future type; #1048's fix completes its seasonal registration |
| F2 | `getWeatherSeason` `?? 'All'` fallback (seasonalWeather.ts:213) launders missing-pool bugs into a plausible 'All' — the exact mechanism that hid #1048's defect | CONFIRMED semantic hazard | DOCUMENT via F1 guard (fallback retained intentionally for offseason types; guard catches the real omission) |
| F3 | `cosmicAnomaly.test.ts` conditional-assertion smell: `if (WEATHER_TYPES.includes('Cosmic Anomaly')) expect(63) else expect(55)` — else-branch dead AND stale; #1048 edits in-place | CONFIRMED | rewrite unconditional (63 → 64 if eclipse lands) |
| F4 | `IconTabStrip` has zero contract tests — only referenced by `v12Dedup.guard` | CONFIRMED coverage gap | new a11y contract test (authored RED pre-merge of #1039) |
| F5 | `SEASONABLE_WEATHER_TYPES` fixture duplicates the union list a 3rd time (union → enumSources → fixture → `enumSourcesSync` hardcode) — appears as dup-scan cluster #1 | CONFIRMED structural drift vector | F1 guard converts it to a pinned contract; derive fixture from union where possible |

## 3. V14 deferred items — re-evaluated (user directive: include deferred)

| Item | Re-evaluation | Verdict |
| --- | --- | --- |
| `cloneObject`/`copyDataProperties` ~12% churn | `mutableInput: true` already wired at every reachable entry (worker.ts:49-78, autosim.ts:216, TickOrchestrator). Remaining cost is pass-boundary object spreads, not the boundary clone. A fix needs impact-application restructuring — out of proportion to ~2-3% residual | **DEFERRED again** (evidence updated) |
| Matchup-scoring call volume (~556ms) | `scorePairwiseMatchup` already memoizes `headToHeadFor` via WeakMap keyed on arenaHistory identity (V14 P1). Pairwise score itself isn't safely cacheable below (pair, week, history-identity) granularity — and pairs are unique per week. `getMatchupBonus` is already O(1) matrix lookup | **EVALUATED-AND-REJECTED** — no safe memo remains |
| Engine-pool persistent shard state | `poolSize=1` stands; parallel-bench 0.33× documented | **DEFERRED** (documented-only per scope) |

## 4. Prior-claims re-verification (sampled mechanical checks)

| Claim | Re-check | Verdict |
| --- | --- | --- |
| V14 A1 registry regex blind spot | `pendingRetries` + `deathNotifier.handlers` registered in `moduleCacheRegistry.test.ts` | APPROVED — fix landed |
| V14 A2/A3 dead mutable removals | `NewsletterFeed.current`, `StyleRollups` absent from src | APPROVED |
| V14 A4 `runGuarded` 15s timeout | `session.ts:71` `runGuarded(job, 15000)` live | APPROVED |
| V14 A7 field-parity guard | `reconstructionFieldParity.test.ts` exists | APPROVED |
| V14 B1 weekly truncation | `truncateState` in `finalizeState` every week + `truncationCadence.test.ts` green | APPROVED |
| V12 D11 plausibility table-driven | `plausibility.ts` uses `SCALAR/OBJECT/ARRAY_FIELDS` tables | APPROVED |
| V12 guard-ledger hygiene | `duplication.guard` KNOWN_SRC_PAIRS — check at Phase 6 scanner regen | PENDING |
| Scanner deltas vs V12 | jscpd 115→100 clones; knip 193→139 exports; dup-scan 213→180 clusters; deadExports ratchet 154≤156 | APPROVED — monotonic improvement, no regression |

## 5. Architecture verdicts

(filled at Phase 8 — pipeline design, worker pool, zustand/memoization, schema
boundary, exhaustive-Record pattern, test tiers, narrative-RNG coupling)
