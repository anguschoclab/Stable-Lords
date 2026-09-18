# V5 Consolidation Ledger (working file — folded into CONSOLIDATION_FINDINGS_V5.md at end)

## Environment note (critical)

**User repo lives inside iCloud Drive** (`~/Documents/GitHub/stable-lords`) — `brctl` showed active eviction/sync on `.git`+`node_modules`: truncated git packs (all 4, "early EOF"), 0-byte tsgo binary, hand-patched lucide-react package.json, intermittent "X is not a constructor" module loads, multi-minute stalls. **All work happens in clean clone `~/dev/stable-lords-v5`; pushes go to origin; user's iCloud copy updates on next pull.** Untracked WIP (scripts/build-fight.ts, run-fight.ts, stubs/, .build/) exists in user's copy — left untouched.

## Baseline metrics (clean clone, Phase 0)

| Metric | Value |
| ------ | ----- |
| type-check | **0 errors** (after B1 fix) |
| lint | **0 errors, 519 warnings** (mostly jsdoc/require-description; ~20 no-explicit-any; ~8 react-hooks/exhaustive-deps; ~6 react-refresh) |
| vitest fast suite | **580 files / 7,261 tests — ALL PASS** (115.8s) |
| build | SUCCESS (PWA, 146 precache entries, 3.49s) |
| electron:compile | OK (main.js 25.18 KB) |
| narrative-validate | PASS |
| git fsck | CLEAN (fresh clone) |
| vitest installed | 4.1.11 (resolves ^4.1.10 — #968's bump already satisfied) |

## Findings log

| id | file:line | category | severity | evidence | verdict | commit |
| --- | --------- | -------- | -------- | -------- | ------- | ------ |
| B1 | src/test/ui/accessibilityMotionReduce.test.ts:8 | bug | medium | imports transitive `glob` w/o types → tsc red on main | FIXED: fs.readdirSync walk; also removes the recurring @types/glob temptation | pending |
| F-icloud | repo location | env/repo-health | critical | iCloud evicts+version-swaps files; corrupted packs/binaries | DISAPPROVED hosting repo under iCloud; work in plain clone; user should relocate | — |
| F-lock | bun.lock vs package.json | repo hygiene | high | bun.lock pins lucide@1.34.0/react@19.2.8; package.json wants 1.44.0/19.3.0 | regenerate bun.lock (bun install stalls on artifactory in iCloud env; retry in clean env) | pending |
| F-case | Docs/ vs docs/ | repo hygiene | low | 5 files under `docs/` collide with `Docs/` on case-insensitive FS | consolidate to single casing | pending |
| F-pkglock | package-lock.json untracked | repo hygiene | low | gitignored; drifted from package.json until npm install | gitignored — no action; keep bun.lock canonical | — |
| F-arch1 | src/state/createStore.ts:8,127,250; engine/pipeline/adapters/opfsArchiver.ts | arch bug | high | createStore + pipeline bypass `archiveService` Electron/web switch, hitting OPFS singleton directly → split-brain persistence in Electron (saveSlots → Electron FS, everything else → OPFS) | FIX: route all consumers through archiveService | pending |
| F-arch2 | opfsArchiver.ts:47-55 flushDeferredArchivesOffThread | bug | medium | clears deferredBoutLogs before worker flush; on worker failure logs are lost (transcript already cleared at weekPipelineService:284) | FIX: fallback direct-archive on worker failure | pending |
| F-dead1 | src/data/templates/templateBuilders.ts | dead code | low | 4 exports never imported; 2 carry `rng \|\| Math.random` non-determinism footgun | REMOVE file + index re-export | pending |
| F-dead2 | opfsArchiver.ts:60-81 archiveWeekLogs | dead code | low | zero callers | REMOVE | pending |
| F-dead3 | src/test/engine/pipeline/advanceWeek.test.ts.skip | dead file | low | disabled test committed to tree; advanceWeek covered elsewhere | REMOVE | pending |
| F-ui1 | components/dashboard/AgentReasoningWidget.tsx:127 | UI dishonesty | medium | hardcoded "Confidence: 94.8%" — no confidence field exists in AIAgentMemory/AIStrategy | REMOVE fabricated metric | pending |
| F-ui2 | AgentReasoningWidget.tsx:126 | UI dishonesty | low | `rival.strategy?.targetStableId` renders raw internal StableId to user | resolve stable name from store | pending |
| F-ui3 | components/ledger/Chronicle.tsx:164 | UI dishonesty | low | pulsing "LIVE_DATA_STREAM" over archived historical data | replace with honest label/remove | pending |
| F-ui4 | components/ErrorBoundary.tsx:60-65 | UI dishonesty | low | "Reload Page" button only resets boundary state, never reloads | relabel "Try Again" (folds into #967 extraction) | pending |
| F-ui5 | pages/AdminTools/components/TelemetryPanel.tsx:30 | UI dishonesty | low | hardcoded "Data Report // V2.4.0" fake version | remove/derive real version | pending |
| F-trait1 | engine/traitDefs.ts:282 orphan_vengeance | balance bug | medium | killWindowBonus:1 adds +1.0 to kill threshold (probability clamped to [0,0.04]) → saturates cap permanently; bloodthirsty uses correct 0.005 scale | RESCALE via combat-balance discipline + harness | pending |
| F-rng1 | engine/combat/mechanics/simulateHelpers.ts:29 | dead fallback | trivial | `?? Date.now()` unreachable (getRandomValues always fills array) | remove dead fallback | pending |
| F-type1 | state/serialization.ts:202 | type debt | low | `as any` bridging FightOutcome vs SimulationReport on lastSimulationReport | align types; keep documented if deferred | pending |
| F-cycle | types/*.types ↔ engine/data type imports | arch debt | low | all 11 detected cycles are type-only or already broken by intentional lazy() — residual: types files import from engine/data | DEFER: relocate engine/data-owned types into types/ layer | deferred |
| F-memorial | ResolutionReveal.tsx:106-108 | UX edge | low | deaths>0 but zero graveyard-resolved → empty memorial step renders | guard step on deadWarriors.length | pending |

## PR dispositions (Phase 2 — all diffs + comments read; all 11 comments are boilerplate Jules intro)

| PR | Branch | Verdict | Extraction plan | Evidence |
|----|--------|---------|-----------------|----------|
| #958 | jules-7439905443583485088-0f584037 | APPROVED/EXTRACT | combat JSON deltas → curated union; strip `.claude/backups/narrative/removed_narratives.json` | +132/-34 over combatPbp/combatStrikes/combatKillText; removals all consensus |
| #959 | bolt-resolution-reveal-perf-… | APPROVED/EXTRACT | ResolutionReveal.tsx single-pass loops; strip `@types/glob` | explicit for-loops, no `any` |
| #960 | fix-motion-reduce-fallback-… | APPROVED/EXTRACT | useFighterStyles.ts wholesale (7 stance classes gain `motion-reduce:animate-none`) | 1 file, +7/-7, zero artifacts |
| #961 | narrative-content-curation-… | APPROVED/EXTRACT | combat JSON deltas → curated union; strip 3 `.bak` files | +4817/-50, biggest expander |
| #962 | palette-tooltip-… | APPROVED/EXTRACT | BoutControls.tsx tooltip wrap; strip `@types/glob` | matches existing reset/skip tooltip convention |
| #963 | feat-narrative-content-expansion-… | PARTIAL/EXTRACT | +3 traits (gallows_born killWindowBonus 2 → RESCALE ~0.01), +2 arena lore, traitDedup 139→142; DISAPPROVE loreData churn (removes vivid lines, adds generic near-dupes); strip backups+@types/glob | all effect keys real; killWindowBonus:2 exceeds the 0.04 cap |
| #964 | fix-narrative-… | APPROVED/EXTRACT | combat JSON deltas → curated union; strip analyze_narrative.cjs, generate_missing.cjs, bun.lock churn | +1764/-1494, largest deduper |
| #965 | bolt-optimize-legacy-mentors-… | PARTIAL/EXTRACT | LegacyMentorsTab.tsx single-pass hunk only; DISAPPROVE other 110 files (cosmetic churn + test edits) | hunk is functionally equivalent: same formula/filter/sort/truncate |
| #966 | bolt-optimize-resolution-reveal-… | DISAPPROVED/SUPERSEDED | superseded by #959 | `.reduce`+`any` (loses type safety), junk `.jules/bolt.md`, same @types/glob artifact |
| #967 | sentinel-error-leakage-… | APPROVED/EXTRACT | ErrorBoundary.tsx wholesale (removes `<details>` error.message) + fold in F-ui4 relabel | +1/-10, clean; severity lower than claimed (details-gated) |
| #968 | chore/narrative-cleanup-… | APPROVED/EXTRACT | combat JSON → union + vitest ^4.1.10→^4.1.11; strip @types/glob + backups | bump already satisfied by resolution; still corrects the spec |

### Narrative union (computed from branch JSON, not just diffs)

- combatPbp.json: **+73 additions / -24 removals** — all 24 removals agreed by ≥2 PRs, zero add/remove conflicts
- combatStrikes.json: **+25 / -6** — all 6 consensus
- combatKillText.json: **+18 / -2** — all 2 consensus
- Merge rule: `final[path] = (base[path] − union(removals)) ∪ union(additions)`, preserving first-seen order; then fuzzy-dedupe (>85% similarity) pass over the union + narrative-validate.

## Read checklist (Phase 1 sweeps)

Coverage tiers: **D**eep-read (every line) / **S**canned (structure + key sections) / **T**ooled (grep/audit only). Honest coverage is reported in V5 doc — no claim without evidence.

| Sweep | Scope | Files | Coverage | Findings |
| ----- | ----- | ----- | -------- | -------- |
| 1 | types+schemas+constants+data | 85 | S+T | F-case, narrative lazy-load verified sound, arena dupe caught by dedupe test |
| 2 | engine: combat/pipeline/bout/core/simulate | 118 | D(anchors)+S | F-arch1/2/3, F-trait1, F-rng1, kill-window scale verified at damageCalc.ts |
| 3 | engine remainder | 189 | S+T | cycle audit: all flagged edges type-only (erased at compile) |
| 4 | state+hooks+lib+utils | 67 | D+S | F-type1 (lastSimulationReport), archive routing, setup.ts vi.unmock placement |
| 5 | components | 366 | S+T+D(targets) | F-ui1/F-ui2, F-memorial, extraction targets deep-read |
| 6 | pages+routes+App+main | ~94 | S+T | TelemetryPanel fake label (F-ui2 batch) |
| 7 | lore+scripts+electron+configs | ~25 | S+T | F-lock (artifactory + git+ssh), vitest/vite __dirname warnings |
| 8 | test | 579 | T+S | 5 zero-coverage components found; 18 red tests authored before impl |

## Test-first tracker

| Change item | Required tests | Test file | Test commit | Impl commit |
| ----------- | -------------- | --------- | ----------- | ---------- |
| #959 deadWarriors | populated-graveyard resolution | src/test/components/ResolutionReveal.test.tsx | 5e72520d | af4bea03 |
| #965 mentors | ranking characterization | src/test/components/stable/LegacyMentorsTab.test.tsx | 5e72520d | fd08b71a |
| #960 stances | pure-function classes | src/test/components/arena/useFighterStyles.test.ts | 5e72520d | 9ce9d8d3 |
| #962 tooltip | tooltip content | src/test/components/boutViewer/BoutViewer.test.tsx | 5e72520d | 04922d09 |
| #967 boundary | crash UI + message hidden | src/test/components/ErrorBoundary.test.tsx | 5e72520d | 558f734b |
| F-ui1/2 honesty | no fabricated values | src/test/components/dashboard/AgentReasoningWidget.test.tsx | 5e72520d | 046ca5fe |
| F-arch1/2 routing | Electron/web service switch | src/test/engine/storage/archiveRouting.test.ts | 5e72520d | 86bae8c8 |
| F-arch3 re-queue | failed logs re-queued | src/test/engine/pipeline/opfsArchiverFlush.test.ts | 5e72520d(+eb7c4a9e) | eb7c4a9e |
| F-trait1 scale | killWindowBonus ≤ cap | src/test/engine/traits/killWindowScale.test.ts | 5e72520d | 2f9418aa |
| #963 traits | count bump + trait resolution | src/test/engine/traits/traitDedup.test.ts | 5e72520d | 2f9418aa |
| narrative curation | suite + validate | existing narrativeContent* + arenaLoreDedup | n/a — pre-existing | f83c442f |
| B1 glob fix | n/a (test file is the fix) | same file | n/a — direct fix | ea6f8b18 |

## Final verification (Phase 6, clean clone)

| Gate | Result |
| ---- | ------ |
| type-check | **0 errors** |
| lint | **0 errors, 518 warnings** (baseline 519) |
| test:all | **595 files / 7,431 tests — all pass** (baseline 7,261; +170 net new) |
| build | PWA build OK, 148 precache entries |
| electron:compile | OK (main.js 25.18 KB) |
| narrative-validate | pass |
| app smoke | title → FORGE YOUR STABLE renders, interactive (Playwright) |
| e2e golden path | **PASS** (30.4s, chromium) |
| known noise | HowlerGlobal worker error — verified pre-existing on `pre-v5-consolidation` tag; jsdom media warnings; `passives.StrikingAttack` narrative warning |
