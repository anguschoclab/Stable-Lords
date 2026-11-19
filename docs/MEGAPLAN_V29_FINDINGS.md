# MEGAPLAN V29 — Findings: Exhaustive Review & Full Branch Consolidation

**Plan:** `MEGAPLAN_V29_PLAN.md`
**Source material:** `main` @ `pre-megaplan-v29` + 15 open PRs (#1079–#1093) + `MEGAPLAN_BACKLOG.md` open register.
**Audit status:** plan-structure claims verified pre-landing (✅ verified, ⚠️ corrected, ❌ disproved). §1+ fills through the phases; §V publishes the final verdict matrix at close-out.

## §0 — Plan-structure validation (pre-landing audit, 2026-11-19)

| # | Claim | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | `megaplanDocLayout` enforces one lineage; atomic swap needed | ✅ | `megaplanDocLayout.guard.test.ts:83-93` (`versions.size===1`); allowlists L27/L77 |
| 2 | `GUARD_REGISTRY` at `testQualityAudit.test.ts:~155` | ✅ | L155 — 47 LIVE_RATCHET entries |
| 3 | `.devin/plans` accepts any plan filename | ❌ | `^megaplan-*` drafts rejected L136-147 — mirror renamed `plan-*.md` |
| 4 | INDEX freshness needed only at close-out | ⚠️ corrected | `docsLayout` L126-143 indexes every non-archive doc → Phase 0 |
| 5 | `weaponArmor.ts` under `resolution/` | ❌ (BACKLOG row stale) | actual: `mechanics/weaponArmor.ts` |
| 6 | V26-D2 dead call + createdAt hazard | ✅ | `SystemPass.ts:53` passes `state.season`; `tierProgression.ts:66-67` verbatim; fix eased — `computeNextSeason` already imported L19 |
| 7 | V26-D3 wall-clock default | ✅ | `gameStateFactory.ts:109` `new Date().toISOString()` default param |
| 8 | V26-D4 crypto fallback | ✅ | `gazetteTemplateHelpers.ts:61-66` `new SeededRNG(cryptoRandomInt(...))` verbatim |
| 9 | V26-D1 missing tactic row | ✅ | zero `tactic` refs under `src/components/warrior/favorites/` |
| 10 | V16-A11 stale weather in bids | ✅ + deepened | `offers.ts:46` `state.weather`; `_currentWeek` underscore-ignored — deeper than logged |
| 11 | V21-B3 token↔effect contradiction | ✅ | `weatherStats.ts:61` "DRAIN 125%" vs `table.ts:419` `staminaMult: 0.8` |
| 12 | V21-B6 KD spec exists at balance.slow:308 | ✅ | verbatim |
| 13 | V15 `cloneObject`/`copyDataProperties` churn | ⚠️ corrected | functions gone; residual at `structuredClone` sites (~6 files) |
| 14 | V22-D3 damage model shape | ✅ | `damageCalc.ts:21-24` verbatim |
| 15 | V22-D4 caps 3–25 | ✅ | `ATTRIBUTE_MAX=25` `shared/attributes.ts:40` |
| 16 | `SAVE_STATE_VERSION` bump optional | ✅ | `'3.0.0'` `core.ts:12` |
| 17 | Trait drift assert requires `LEGACY_TRAIT_ORDER` sync | ✅ | `registry.ts:220-224` throws |
| 18 | v21Traits floor conversion | ✅ + scoped | count pin 184 → floor; SURVIVING asserts stay valid |
| 19 | #1091 ⊆ #1090 | ⚠️ corrected | unique hunk = generated `docs/ORPHAN_REPORT.md` (stale pre-V28 path) → strip; supersession holds on code |
| 20 | `determinismAudit`, `soak.mjs`, chromium tier, coverage floors, nightly slow tier | ✅ | all verified at cited paths |
| 21 | `bun audit` advisory check | ⚠️ corrected | no such script; `gh api dependabot/alerts` → **30 open alerts** |
| 22 | Scanners all under `scripts/` | ⚠️ corrected | `find-dupes.mjs` at repo root |
| 23 | #1081 test-dir filing legal | ✅ | `src/test/engine/pipeline/services/` mirrors `src/engine/pipeline/services/` |

## §0b — Phase-0 baseline gates

`type-check` clean · `lint` 0 errors/42 warnings · `test` 998/999 files (10768/10771) — sole failure `opfsArchiverFlush` hook-timeout flake (standalone 6/6 green; same class as the V28 `tacticDiscovery.parity` watch item — second instance, watch-list candidate). merge-tree: 13/15 clean vs main; #1081/#1086 conflict only in generated baselines; narrative collisions are pairwise (lore pools ×3, combat JSON ×4 surfaces). Dependabot: 30 open alerts. Human review threads: none on any PR (verified via API).

## §1 — PR adjudication

| PR | Cluster | Verdict | Evidence |
| --- | --- | --- | --- |
| 1079 | lore+traits | **MERGE-WITH-FIXES** | union-merge content (+5 origins/+3 childhood/+3 moments/+2 lore/+2 flaw traits); traits clean — whitelist keys only (`defModLowHp`,`parModLate`,`attMod`,`fightPlanMod`), `LEGACY_TRAIT_ORDER` synced (registry.ts:204+); guard count-bump hunks resolve to Phase-3 floor form |
| 1080 | combat JSON | **MERGE (union)** | +killText/+pbp/+strikes entries; dedupe vs union |
| 1081 | tests | **MERGE-WITH-FIXES** | drop `plan.md` junk; strip+regen generated baselines; its own notes admit a WarriorId-indexing type issue in `caches.test.ts` — merge-time typecheck gates |
| 1082 | lore | **MERGE (union)** | +5 origins/+3 childhood/+3 moments/+2 lore; on-canon tone |
| 1083 | combat JSON | **MERGE-MINUS-HUNKS** | JSON content into union; **REJECT `fuzzy_dedupe.mjs` 0.8→0.85 loosening** — suspicious direction (lets its own near-dupes through); dedupe runs at the existing 0.8 |
| 1084 | perf | **MERGE-MINUS-HUNKS** | `memo()` firewall on SnapshotRow correct (immer refs); drop `.jules/bolt.md` |
| 1085 | lore | **MERGE (union)** | +5 origins/+3 childhood/+3 moments/+2 lore |
| 1086 | tests | **MERGE-WITH-FIXES** | 3 new component specs; strip+regen generated baselines |
| 1087 | a11y | **MERGE-WITH-FIXES** | keyboard-focusable tooltip triggers valid; fix-forward: drop redundant `tabIndex` on spans wrapping already-focusable `<button>` children (ExecuteWeekButton, TagBadge — double tab-stop) |
| 1088 | perf | **MERGE** | single-pass useMemo keyed on `state.roster` — semantics preserved |
| 1089 | combat JSON | **MERGE (union)** | +killText/+pbp/+uiMeta; verbatim dupes vs #1080 confirmed (`{{attacker}} aims to slay {{defender}}!`) |
| 1090 | button types | **MERGE** | superset of #1091's code edits (identical, formatting-only diff) |
| 1091 | button types | **SUPERSEDED-BY #1090** | code edits identical; unique hunk = hand-edit to generated `docs/ORPHAN_REPORT.md` at stale pre-V28 path → strip, never merge |
| 1092 | perf | **MERGE** | flat-primitive `useShallow` selectors preserve semantics (hp<30 injury, endurance<encumbrance mismatch); matches merged #1062 precedent |
| 1093 | combat JSON | **MERGE-MINUS-HUNKS** | JSON + uiMeta into union; strip generated baseline timestamp churn |

## §W — Wiring audit · §D — Duplication audit · §A — SRP audit · §K — Dead-code audit · §P — Perf audit

Phase-2 delta-verified read complete (2026-11-19). Read-only scanner suite run and diffed against the V28 baseline — **zero new violations introduced**:

- `orphan-scan`: 0 unreachable page files; 148 unique-code findings, 10 alternate flows, **3 untriaged orphans** (triage in Phase 5 or defer).
- `data-array-dup-scan`, `dedupe` (no `--fix`), `dup-scan`, `param-count`, `ui-audit` (tracking/dead-keyframe), `skill-path` (145/145 refs resolve): all clean.
- `fuzzy_dedupe.mjs` deliberately NOT executed — it rewrites files in place; dedupe is a Phase-4 controlled step.

Deep-dive wiring confirmations (feed §B + Phase-5 specs):

- `SystemPass.ts:53` — `processTierProgression(state, state.season, nextWeek)` dead call confirmed; `tierProgression.ts:64` early-returns when seasons match. `computeNextSeason` already imported (L19); `runSystemPass`'s `rng` (L274) is never threaded into `processSystemicProgression` — fix = pass `computeNextSeason(nextWeek)` + `rng`.
- `gameStateFactory.ts:109` — `createdAt` param-2 defaults to `new Date().toISOString()`; `createFreshState(SEED)` is the only wall-clock read in the engine besides the gazette fallback.
- `gazetteTemplateHelpers.ts:61-66` — `t()` crypto-random array fallback; **unreachable from production callers** (gazetteNarrative/gazetteFactory always thread seeded rng or preselect). Decision: remove fallback → deterministic first-element pick.
- `RivalStrategyPass/offers.ts:46` — bids for `_currentWeek = absoluteWeek+1` priced with `weather: state.weather` (current week). `generateBoutBids` is invoked unconditionally per rival (L43); `buildWeekOffers` already receives `rng` (L19). Fix = derive bout-week weather on an independent stream `rollWeather(SeededRNG(nextWeek*13), computeNextSeason(nextWeek))` — same derivation WorldPass uses (`WorldPass.ts:30-31`), decoupled from the shared chain.
- `weatherStats.ts:61` vs `weatherEffects/table.ts:419` — B3 confirmed **×3, not ×1**: Chaos Storm (DRAIN 125% ↔ `staminaMult` 0.8), Chaos Squall (115% ↔ 0.85), Abyssal Tempest (60% ↔ 1.6). Every other weather follows `DRAIN N% ↔ N/100`, `CONSERVATION N% ↔ 1−N/100`.
- `damageCalc.ts:16-24` vs `mechanics/weaponArmor.ts` — V22-D3 canonical-model gap confirmed live (backlog's `resolution/` path stale, corrected).
- `structuredClone` residual sites for the V15 perf re-audit: `engine/autosim/autosim.ts`, `engine/pipeline/services/weekPipeline/context.ts`, `engine/runtime/worker.ts` — original `cloneObject`/`copyDataProperties` names no longer exist.

SRP/function-length census (existing, not V29-attributed): `classTraits.ts` 517L, `hallOfFame.ts` 511, `weather/config.ts` 509, `weatherEffects/table.ts` 496 — recorded for future campaigns; not blocking.

## §B — Bug register

| ID | Item | Status |
| --- | --- | --- |
| B0 | 30 open dependabot alerts on default branch | recorded — dependency triage is out of merge scope; flagged for a dedicated security pass |
| B1 | V26-D2 tier progression never fires | **FIXED (GREEN)** — `SystemPass` now passes `computeNextSeason(nextWeek)` + threads pass rng; promote/demote verified at boundary |
| B2 | V26-D3 `createFreshState` wall-clock `createdAt` | **FIXED (GREEN)** — defaults to `weekToTimestamp(0)`; cross-call `toEqual` passes |
| B3 | V26-D4 `t()` crypto fallback | **FIXED (GREEN)** — fallback removed; deterministic first-element pick; unused imports dropped |
| B4 | V26-D1 discovered favorite tactic never surfaces | **FIXED (GREEN)** — "Tactics Revealed" cell + "Favorite Tactics" rows in `FavoritesCharting` |
| B5 | V16-A11 bid priority on current-week weather | **FIXED (GREEN)** — bout-week weather derived on independent `SeededRNG` stream; spec captured `'Chaos Storm'`→`'Blood Rain'` |
| B6 | V21-B3 weather stamina incoherence — **three** violators | **FIXED (GREEN)** — Chaos Storm/Squall effect-side corrected; Abyssal Tempest display-side corrected; 65/65 coherent |
| B7 | #1081 `caches.test.ts` WarriorId-indexing type error | **cleared** — type-check clean post-merge; admitted issue did not materialize under the current config |
| B8 | `opfsArchiverFlush` afterEach hook-timeout flake under suite load | watch item — same class as V28's `tacticDiscovery.parity` |
| B9 | pre-existing duplicate strings: pbp 'SOLAR PLEXUS', uiMeta 'Fallen in combat.' | allowlisted in `v29Narrative` live guard; ratchet now forbids NEW dupes — post-union suite shows 0 real dupes |
| B10 | V21-B6 kill-desire differential | **DISPROVED suspicion** — slow-tier re-run: both kill specs (`:308`,`:402`) PASS on current engine; no re-baseline |
| B11 | V22-D3 damage model, V22-D4 ADM/graduation | **NO-GO** — both deferred: feature-scale; V22-D3 rewrites invalidate all combat baselines; V22-D4 is a design-level advancement tier. BACKLOG notes sharpened |
| B12 | V15 structuredClone residuals | **RESOLVED-by-design** — `mutableInput` ownership flag bypasses clones on owned state; residual clone is the semantically-required boundary copy |

## §V — Verdict matrix

Every adjudication, claim, and backlog row — APPROVED / DISPROVED /
CORRECTED — with `file:line` evidence.

### PR adjudications (§1)

| PR | Verdict | Outcome |
| --- | --- | --- |
| #1079 lore+traits | MERGE-WITH-FIXES | **APPROVED** — landed; `LEGACY_TRAIT_ORDER` synced, `fightPlanMod:{OE:-2}` shape corrected at pin-time; `v29Traits` guard green |
| #1080 combat JSON | MERGE | **APPROVED** — union-landed clean vs main |
| #1081 test coverage | MERGE-WITH-FIXES | **APPROVED** — `plan.md` stripped, generated files regenerated, `caches.test.ts` type concern cleared (B7) |
| #1082 lore | MERGE | **APPROVED** — union-landed; +5/+3/+3/+2 pins verified |
| #1083 combat JSON + dedupe threshold | MERGE-MINUS-HUNKS | **APPROVED** — content landed; `fuzzy_dedupe` 0.8→0.85 hunk **rejected** (would admit more near-dupes) |
| #1084 memo() | MERGE-MINUS-HUNKS | **APPROVED** — memo firewall landed; `.jules/bolt.md` junk stripped |
| #1085 lore | MERGE | **APPROVED** — union-landed; pins verified |
| #1086 component specs | MERGE-WITH-FIXES | **APPROVED** — specs landed; generated metadata regenerated |
| #1087 a11y tabIndex | MERGE (+fix-forward note) | **CORRECTED** — the "redundant tabIndex" concern was disproved: all three spans wrap disabled/non-focusable tooltip anchors (`ExecuteWeekButton`, `WarriorBadges`, status tooltips); attributes are required. Merged clean, no fix-forward |
| #1088 useMemo | MERGE | **APPROVED** — single-pass memo landed |
| #1089 combat JSON | MERGE | **APPROVED** — union-landed; verbatim `"RIGHT/LEFT TRICEP"` dupes stripped |
| #1090 button types | MERGE | **APPROVED** — landed; superset of #1091 verified line-by-line |
| #1091 button types | SUPERSEDED | **APPROVED** — unique hunk was stale generated `ORPHAN_REPORT.md`; left un-merged |
| #1092 useShallow | MERGE | **APPROVED** — landed; `fileBudget` rebaselined 19→20 (CoachOverlay +7 lines, legitimate) |
| #1093 combat JSON + uiMeta | MERGE-MINUS-HUNKS | **APPROVED** — content landed; generated timestamp churn stripped |

### Plan-structure audit (§0)

| Claim | Verdict | Evidence |
| --- | --- | --- |
| `.devin/plans/` accepts any filename | **DISPROVED** | `megaplanDocLayout.guard.test.ts:136-147` rejects `^megaplan-*` drafts; mirror renamed `plan-a90ed5c661debd60.md` |
| `weaponArmor.ts` under `resolution/` | **CORRECTED** | lives at `src/engine/combat/mechanics/weaponArmor.ts` |
| `cloneObject`/`copyDataProperties` residual | **CORRECTED** | symbols gone; residual is `structuredClone` at `weekPipeline/context.ts:53-64` |
| INDEX freshness at close-out | **CORRECTED** | docsLayout guard requires it at scaffold time — moved to Phase 0 |
| #1091 ⊂ #1090 strict | **CORRECTED** | unique hunk exists (stale `ORPHAN_REPORT.md`) — strip-and-supersede holds on code |
| `bun audit` script | **DISPROVED** | no such script; Dependabot API used instead |

### Backlog rows (§B)

| Row | Verdict | Evidence |
| --- | --- | --- |
| V26-D1 tactic row missing | **APPROVED + FIXED** | `FavoritesCharting.tsx` tactics cell+rows; `tacticRow.test.tsx` green |
| V26-D2 dead `processTierProgression` | **APPROVED + FIXED** | `SystemPass.ts:36-58` now passes `computeNextSeason(nextWeek)`+rng |
| V26-D3 wall-clock `createdAt` | **APPROVED + FIXED** | `gameStateFactory.ts` defaults `weekToTimestamp(0)`; `hardcodedYearAudit` spec updated to forbid `new Date(` |
| V26-D4 crypto fallback | **APPROVED + FIXED** | `gazetteTemplateHelpers.ts` — fallback deleted, deterministic pick |
| V16-A11 stale bid weather | **APPROVED + FIXED** | `RivalStrategyPass/offers.ts` derives bout-week weather on `SeededRNG` stream |
| V21-B3 stamina incoherence | **APPROVED + FIXED (3 violators)** | `weatherStats.ts` Abyssal display 60→160%; `weatherEffects/table.ts` Chaos Storm 0.8→1.25, Squall 0.85→1.15 |
| V21-B6 zero KD differential | **DISPROVED** | `balance.slow.test.ts:308,402` pass on current engine |
| V15 structuredClone residual | **DISPROVED-as-defect** | `mutableInput` bypasses owned-state clones; residual is required boundary copy |
| V22-D3 / V22-D4 | **APPROVED-as-deferred** | feature-scale; `MEGAPLAN_V29_DEFERRED.md` |

### Architecture & test strategy

| Decision | Verdict | Evidence |
| --- | --- | --- |
| Union-merge per cluster | **APPROVED** | 4 JSON + 3 lore merges; 0 non-allowlisted dupes post-union |
| Test-first hard gate (Phase 3 before Phase 4/5) | **APPROVED** | 19 observed REDs pre-implementation; all flipped GREEN; zero implementation before REDs |
| Floor-form guard conversion (v21 pins) | **APPROVED** | matches `v20Narrative` precedent; guards survived union-landing |
| Reject #1083 dedupe-threshold loosening | **APPROVED** | 0.85 admits near-dupes the union itself would have tripped |
| Direct-to-main merges | **APPROVED** | per user direction; 14 merges + 8 work commits, all gates green at each push |
| Slow-tier flake policy (isolate, not mask) | **APPROVED** | `opfsArchiverFlush` 6/6 standalone; registered watch item |

### Final gates (Phase 6)

| Gate | Result |
| --- | --- |
| `bun run type-check` | clean |
| `bun run lint` | 0 errors / 42 warnings (baseline) |
| `bun run test` | 1012/1012 files — 10878 tests pass (sole initial failure = obsolete `new Date(` pin, corrected to deterministic contract) |
| Slow subset (determinism×3, balance, traitBalance, RivalStrategyPass, stateInvariants) | 7/7 files, 100/100 tests |
| Orphan scan | 172 dead exports < 174 ratchet; **0 untriaged** |
| Docs layout guards | 12/12 green |
