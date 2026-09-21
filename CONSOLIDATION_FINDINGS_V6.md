# CONSOLIDATION_FINDINGS_V6 — Exhaustive Review, Curated Merge & Cleanup

**Scope:** 14 PRs (#969–#982), closed-PR salvage scan, deep code re-read (V5 verdicts re-verified + new findings N1–N4), strict test-first scheduling (Phase 3A), curated extraction into `main` — zero backwards-compatibility constraints.
**Restore point:** tag `pre-v6-consolidation` (baseline `c66993c1`).
**Result range:** `c66993c1..main` — 7 consolidation commits.

---

## 1. Final Verdict

**APPROVED.** All accepted value from the 14 PRs is integrated into `main` via curated extraction; every bug found is fixed; all gates are green on a clean clone; the lockfile is portable; zero test regressions.

---

## 2. Per-PR Disposition Table

| PR | Category | Verdict | Integration commit | Rationale |
|----|----------|---------|--------------------|-----------|
| #969 | Lore + trait | **PARTIAL / EXTRACTED** | `97a4d96f` | Lore strings unioned (ORIGINS/CHILDHOOD_TRAITS/DEFINING_MOMENTS). New traits `shadow_born`, `feral_instincts` **rejected** — both are in `traitDedup.test.ts` `REMOVED_IDS` (deliberately removed in a prior dedup pass); re-adding would contradict the dedup contract. `.claude/backups/**` artifacts stripped, not landed. |
| #970 | Narrative combat pool | **PARTIAL / EXTRACTED** | `d8c259c9` | combatPbp/combatStrikes/combatKillText/combatPassives unioned with #973 + #981 by leaf-path, keyed on `text`, consensus rule applied. `.claude/backups/narrative/removed_mocks.json` artifact stripped. |
| #971 | Arena Architect (closed PR) | **APPROVED / EXTRACTED** | `fdadf6a2` | 3 new arenas (Shifting Sands, Cursed Swamp, Iron Cage), 2 arena events (sands_shift, swamp_miasma), 2 style-weather modifiers, water+cursed matchmaking synergy penalty. PR-supplied tests landed and green. |
| #972 | Lore + trait | **PARTIAL / EXTRACTED** | `97a4d96f` | Lore strings unioned; `orphan_resilience_two` accepted. `.claude/backups/**` stripped. |
| #973 | Narrative combat pool | **PARTIAL / EXTRACTED** | `d8c259c9` | Passives expansion + dedup removals unioned. `.claude/backups/**` (2 files) stripped. |
| #974 | Dependabot vitest 5.0.1 | **APPROVED / EXTRACTED** | `c3795f13` | MAJOR bump applied; jest-dom type augmentation fixed via `tsconfig.app.json` `types` entry. Full suite green — no runtime regressions. |
| #975 | Dependabot coverage-v8 5.0.1 | **APPROVED / EXTRACTED** | `c3795f13` | Applied with #974 (must move together). |
| #976 | Dependabot lucide-react 1.47.0 | **APPROVED / EXTRACTED** | `c3795f13` | Applied; type-check + lint green. |
| #977 | Dependabot electron 44.4.2 | **APPROVED / EXTRACTED** | `c3795f13` | Applied; `electron:compile` green. |
| #978 | Dependabot framer-motion 13.4.0 | **APPROVED / EXTRACTED** | `c3795f13` | Applied; type-check + lint green. |
| #979 | Perf (Bolt) | **APPROVED / EXTRACTED** | `fdadf6a2` | Single-pass loop rewrite of `ActiveTournamentManifest.tsx` landed (filter/map/Set/Math.max/find chains → 2 linear passes). `bun.lock` churn stripped. Characterization tests written pre-change (`11338dd3`) and remain green. `noUncheckedIndexedAccess` required explicit `if (!b) continue` guards — lint forbids `!` assertions. |
| #980 | Lore + trait + arenas | **PARTIAL / EXTRACTED** | `97a4d96f` | Strongest of the 3 lore branches (most content, no dups) used as union base; `abyssal_survivor`, `rust_blooded` accepted; 3 arena-lore entries + arena configs extracted. **Regression caught:** #980 dropped `getArenaLore`/`loreIndex` while `ArenaLeaderboards.tsx` still imports it — restored from base. `.claude/backups/**` stripped. |
| #981 | Narrative combat pool | **PARTIAL / EXTRACTED** | `d8c259c9` | Dedup removals + additions unioned per consensus rule. |
| #982 | Prismatic Gale feature | **APPROVED / EXTRACTED** | `fdadf6a2` | Complete vertical slice landed: WeatherType union + WEATHER_TYPES + schema enum + config + ambience + stats + effects + opening lines + visual + seasonal weight (Spring-exclusive, 2.0) + offseason event handler + narrative + tests. #971↔#982 `weather.ts` conflict resolved by hand (different sections). Count tests updated 62→63; seasonal mock RNG values adjusted for shifted distribution (0.893→0.866, 0.77→0.761). |

### Closed-PR salvage scan

| PR | State | Verdict |
|----|-------|---------|
| #971 | CLOSED (not merged) | **EXTRACTED anyway** — contained unique arena-architect value not on main |
| #974–#978 | CLOSED | **Value already landed** via `c3795f13` curated version bumps — no further extraction needed |
| #962 (`palette-tooltip-5886959168913987839`) | CLOSED in V5 | **Stale branch only** — value already extracted in V5; branch deleted in Phase 6 |

No other closed-not-merged PR contained unique value absent from `main`.

---

## 3. Artifact Contamination Strip List

| Artifact | Source PRs | Disposition |
|----------|-----------|-------------|
| `.claude/backups/narrative/removed_mocks.json` | #970 | **Stripped** — Jules backup file, not production data |
| `.claude/backups/**` (2 files) | #973 | **Stripped** — same |
| `.claude/backups/**` | #969, #972, #980 | **Stripped** — never landed |
| `bun.lock` churn (768 lines) | #979 | **Stripped** — only `ActiveTournamentManifest.tsx` extracted |
| 15 `(Mock N)` placeholder entries | base (`combatPassives.json`) | **Removed** — see N1 |

---

## 4. Narrative Curation Report

### Combat JSON pool (#970 + #973 + #981)

Curated union computed programmatically from branch JSON (never diff-line merging), keyed on `text` per leaf, first-seen order, consensus rule for removals (≥2 PRs), canonical dedupe:

- `combatPassives.json` — union of #970's 7/style + #973's 9/style additions; **15 `(Mock 1–3)` entries removed** (N1); deduped.
- `combatPbp.json` — union of additions across all 3 PRs; consensus removals applied.
- `combatStrikes.json` — union of 4-style expansions.
- `combatKillText.json` — union of 5+2 kill-text additions.
- All 4 files JSON-parse clean; `narrative_validate` passes.

### Lore + trait union (#969 + #972 + #980)

| Array | Base | Unioned |
|-------|------|---------|
| `ORIGINS` | 276 | 293 |
| `CHILDHOOD_TRAITS` | 152 | 162 |
| `DEFINING_MOMENTS` | 135 | 145 |

- `traitDefs.ts`: +3 traits — `orphan_resilience_two`, `abyssal_survivor`, `rust_blooded` (count 142→145).
- **Rejected:** `shadow_born`, `feral_instincts` (in `REMOVED_IDS`).
- `arenas.ts` ARENA_LORE: +7 entries (3 from #980, 4 from #969/#972).
- No duplicate effects introduced (dedup test green); kill-window cap invariant intact (`damageCalc.ts:70` clamp [0, 0.04] — new traits carry no `killWindowBonus`).

### Validator extension (N1)

`scripts/narrative_validate.ts` gained `checkForPlaceholderMarkers` — rejects `(Mock`, `TODO`, `FIXME`, `PLACEHOLDER`, `LOREM`, `XXX`, `TBD` in any narrative string; **does NOT flag canonical `%A`/`%D`/`%W`/`%BP`/`%H` tokens** (both token styles are canonical per `narrativePBPUtils.ts:23`). Main execution guarded behind `import.meta.main` so the module is importable in tests without `process.exit`.

---

## 5. Bug-Fix Log

| ID | Finding | Evidence | Fix | Commit |
|----|---------|----------|-----|--------|
| N1 | Mock narrative contamination | `combatPassives.json` had 15 `(Mock N)` entries across 5 style arrays reaching production via `combatNarrators.ts:43` → `getFromArchive` | Removed all 15; extended validator to reject placeholder markers | `d8c259c9` |
| N2 | `as never` cast residual | `createStore.ts:124` — leftover workaround after F-type1 aligned `lastSimulationReport` types | Direct assignment; round-trip test confirms preservation | `fdadf6a2` |
| N3 | HelpA11y test matcher failure (pre-existing) | `getByText(/results/i)` matched hit snippets containing "results" as substring | Anchored regex to count element `/^\d+ results?$/` | `17e7ae5e` |
| N4 | bun.lock artifactory pollution | Dev machine global `~/.npmrc` → `artifactory.ubisoft.org`; baseline lockfile had 26 artifactory refs; regen produced 1,443 | `[install] registry = "https://registry.npmjs.org"` pinned in `bunfig.toml` + lockfile regenerated: **0 artifactory/git+ssh refs** (sole github.com entry = upstream `@electron/node-gyp` pin from `@electron/rebuild`) | `1fe2a3f1` |

### V5 verdicts re-verified

| V5 finding | Verdict | Evidence |
|------------|---------|----------|
| F-arch1 (archive routing) | **CONFIRMED still-fixed** | `createStore.ts` routes through `archiveService`; only `flushDeferredArchivesOffThread` from `opfsArchiver` |
| F-arch3 (deferred-log re-queue) | **CONFIRMED still-fixed** | `opfsArchiver.ts:14` documents re-queue; lines 20–23 read/clear `deferredBoutLogs` |
| F-type1 (lastSimulationReport) | **CONFIRMED + N2 cleaned** | `store.types.ts:16` uses `GameState['lastSimulationReport']`; cast residual removed |
| F-trait1 (killWindow cap) | **CONFIRMED still-fixed** | `damageCalc.ts:70` clamps [0, 0.04]; all trait values below cap |
| F-lock (bun.lock clean) | **RE-OPENED → FIXED (N4)** | Baseline still carried 26 artifactory refs; now pinned at repo level |

---

## 6. Architectural Findings — Explicit Verdicts

| Finding | Verdict | Evidence |
|---------|---------|----------|
| iCloud-hosted working copy | **DISAPPROVED (environmental)** | 148 packages evicted from `node_modules` at baseline; restored via `bun install`. All verification additionally run on a non-iCloud clean clone (`~/dev/stable-lords-v6-clean`) — fully green. |
| bun.lock portability | **APPROVED after N4 fix** | Repo-level registry pin makes lockfile regeneration deterministic |
| `%A`-style token canonicity | **APPROVED as canonical** | `narrativePBPUtils.ts:23` documents both `%A` and `{{token}}` styles; `interpolateTemplate` handles both; validator flags placeholder markers only |
| Import cycles | **APPROVED (unchanged)** | Back-edges remain type-only; no new cycles introduced |
| Two-layer combat balance | **APPROVED** | Absolute power stays in `STYLE_PENALTIES`; matchup identity in `MATCHUP_MATRIX`; new traits touch neither layer — balance harness green (9/9) |
| Trait additions combat impact | **APPROVED** | New traits are data-only (weighted pool entries); no mechanic changes; harness: antisymmetry, mirror-drift, 40–60% band, kill-rate all green |
| #979 single-pass rewrite | **APPROVED** | Functionally identical output; 4 passes → 2 linear passes; characterization tests green |
| #971↔#982 weather.ts overlap | **APPROVED (hand-merged)** | Different file sections; both intents preserved |
| GameState↔GameStore drift | **APPROVED (collapsed)** | `as never` removed; single type source via `GameState['lastSimulationReport']` |
| `getArenaLore` removal in #980 | **DISAPPROVED (caught & fixed)** | `ArenaLeaderboards.tsx` still imports it — restored `loreIndex` + `getArenaLore` |
| Re-adding `shadow_born`/`feral_instincts` (#969) | **DISAPPROVED** | Both in `traitDedup.test.ts` `REMOVED_IDS`; prior dedup deliberately removed them |

---

## 7. Spot-Check Results

| Claim | Result |
|-------|--------|
| 14 open PRs | **CORRECTED at execution** — 8 open at execution time; #971 + #974–#978 already closed (content extracted anyway) |
| 15 remote branches not on main | **CORRECTED at execution** — 10 unmerged branches (8 open-PR heads + #971's head + stale `palette-tooltip`) |
| Mock entries reach production | **CONFIRMED** — `combatNarrators.ts:43` → `getFromArchive(['passives', style])` |
| `%A` tokens are inconsistent style | **REFUTED** — canonical per `narrativePBPUtils.ts:23` |
| `as never` breaks runtime round-trip | **REFUTED** — type-only; round-trip test green before and after |
| #971/#982 conflict is contextual | **CONFIRMED** — different sections of `weather.ts` |
| Vitest 5 has runtime breakage | **REFUTED** — type-augmentation gap only; fixed via `types` config; zero runtime regressions |

---

## 8. Metrics Summary (baseline → final)

| Gate | Baseline (V6 pre) | Final (clean clone) |
|------|-------------------|---------------------|
| type-check | 0 errors | **0 errors** |
| lint | 0/0 | **0/0** |
| test:all | 7,584 pass / 1 fail / 2 skip (648 files) | **7,718 pass / 0 fail / 2 skip (662 files)** |
| build | — | **PWA OK — 156 precache entries (4,846.72 KiB)** |
| electron:compile | — | **OK (25.23 KB bundle)** |
| narrative-validate | pass | **pass (extended validator)** |
| e2e | — | **5/5 projects pass: chromium, firefox, webkit, Mobile Chrome, Mobile Safari (1.8m)** |
| bun.lock | 26 artifactory refs | **0 artifactory/git+ssh refs** |
| Math.random in `src/` (excl. test) | 0 | **0** |

`test:all` runs `vitest.config.all.ts` (broader than default `vitest run` — 662 files vs 652).

---

## 9. Test-First Compliance Audit

Gate commit `11338dd3` (Phase 3A) authored all red tests before implementation:

| Item | Red test | Gate | Impl commit | Compliance |
|------|----------|------|-------------|------------|
| N1 mock removal | `narrativeMockMarkers.test.ts` | TDD | `d8c259c9` | ✅ red→green |
| N1 validator ext | `narrativeValidatorExtension.test.ts` | TDD | `d8c259c9` | ✅ red→green |
| N2 cast cleanup | `serializationRoundTrip.test.ts` | TDD | `fdadf6a2` | ✅ green guard (type-only fix) |
| #979 perf | `ActiveTournamentManifest.test.tsx` | TDD | `fdadf6a2` | ✅ characterization green pre/post |
| Lore/trait union | `traitDedup.test.ts` (count 142→145) | TDD | `97a4d96f` | ✅ |
| #971 arenas | `newArenaArchitect.test.ts`, `arenaFit.test.ts` (PR-supplied) | TDD | `fdadf6a2` | ✅ |
| #982 Prismatic Gale | `seasonalPrismaticGale.test.ts` (PR-supplied) | TDD | `fdadf6a2` | ✅ |
| Dependabot ×5 | existing suite + build | Validation | `c3795f13` | ✅ suite stayed green |
| Vitest 5 migration | existing suite | Validation | `c3795f13` | ✅ zero regressions |
| bun.lock regen | `bun install` clean | Validation | `1fe2a3f1` | ✅ 0 artifactory refs |
| Lint sweep | `lint` 0/0 | Validation | `17e7ae5e` | ✅ |

---

## 10. Deferred Items Register

**None.** The pre-existing HelpA11y failure (N3) — the only candidate for deferral — was fixed (`17e7ae5e`). All gates green; nothing deferred.

---

## 11. Remote Disposition Log

| Action | Detail |
|--------|--------|
| Push | `main` → `origin/main` (7 consolidation commits + findings doc) |
| Tag | `pre-v6-consolidation` → pushed |
| Verdict comments | Posted on all 8 open PRs citing this document + integration commits |
| PR closures | #969, #970, #972, #973, #979, #980, #981, #982 closed (value extracted) |
| Branch deletions | 10 remote branches: 8 open-PR heads + `feature/arena-architect-3413841124313887882` (#971) + `palette-tooltip-5886959168913987839` (stale, V5) |
| Preserved | `main`, `pre-v6-consolidation` tag; PR diffs remain on GitHub |

*(Populated after execution — see git log and PR timelines.)*

---

## 12. Final Verdict

**APPROVED.** The consolidation is complete and verified:

- Every open PR's strongest compatible value landed via curated extraction — zero verbatim merges.
- Every artifact (`.claude/backups/**`, lockfile churn) stripped.
- Every finding fixed: N1 (15 mock entries + validator), N2 (`as never`), N3 (test matcher), N4 (lockfile portability).
- Two PR-introduced regressions caught and fixed during extraction (#980's `getArenaLore` removal; #969's REMOVED_IDS violations).
- Full gate matrix green on a clean, non-iCloud clone: type-check 0, lint 0/0, 7,718 tests pass, build OK, electron OK, narrative-validate OK, e2e 5/5 browsers.
- Combat balance harness green (9/9) — new traits data-only, no mechanic changes.
- Test-first discipline enforced: Phase 3A gate `11338dd3` preceded every implementation commit.
