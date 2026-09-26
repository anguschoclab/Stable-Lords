# TEST_AUDIT_FINDINGS — Test Suite Audit, Consolidation & Reorganization

**Scope:** Exhaustive audit, dedup, structural reorganization, and performance optimization of the vitest suite per approved megaplan. Zero backwards-compatibility constraints.
**Restore point:** tag `pre-test-megaplan` → `fc3bd07f` (local).
**Working mode:** in-place at canonical clone, sequential commits per ledger batch; deletes and moves never mixed in a commit.

---

## 1. Baseline Metrics (Phase 0)

| Metric | Baseline | Notes |
| --- | --- | --- |
| `bunx vitest run` (default) | **690 files / 7,904 pass / 2 skip / 0 fail — 90.14s** | env 47%, tests 25%, setup 12%, import 8%, transform 7% |
| `bunx vitest run --config vitest.config.slow.ts` | 12 files | see §1a |
| `bun run test:bun` | **687 files / 7,874 pass / 1 skip / 0 fail — 139.69s** | 4 bunfig ignores (electronMain, bibleIndex, HelpA11y, *.slow) |
| `bunx playwright test` | — | e2e baseline TBD |
| type-check / lint / build | 0 errors (V7 verified, re-run at Phase 6) | |
| Per-file timings | `scripts/out/baseline-test-timings.tsv` (689 rows, Σ191.05s) | |
| Colocated strays outside `src/test/` | 10 files | src/lib×3, src/scripts×4, src/utils×1, src/engine/crest×2 |
| Local `make*/create*` factory defs in tests | ~127 files | vs 49 `_fixtures/factories` importers |
| `@vitest-environment jsdom` pragmas | 134 files | convention sanctioned by eslint `definedTags` |

### 1a. Slow-suite baseline (12 files)

| File | Time | Notes |
| --- | --- | --- |
| worldLiveness.integration.slow.test.ts | 50,932ms | 3 tests; 104-wk invariant sim dominates |
| *(remaining files)* | — | see §1a output |

### 1b. Top slow files, default suite

| ms | File | Verdict |
| --- | --- | --- |
| 33,248 | src/scripts/emergent-report.test.ts | self-declared harness, not a test → convert to script |
| 30,541 | src/scripts/simulation.test.ts | full runSimulation → promote/shrink |
| 15,766 | src/test/engine/ai/rivalTraitAI.integration.test.ts | shrink sim |
| 15,105 | src/test/engine/sim/harnessTruncation.test.ts | shrink sim |
| 9,130 | src/test/engine/pipeline/worldEvolvesWhenPlayerStopped.integration.test.ts | shrink sim |
| 7,930 | src/test/engine/autosim/sequentialMemoryGrowth.test.ts | merge w/ autosimMemoryGrowth, promote |
| 4,002 | src/test/engine/autosimMemoryGrowth.test.ts | same |
| 3,764 | src/test/engine/pipeline/yearRollover.integration.test.ts | promote/shrink |
| 3,555 | src/test/buildConfigIntegrity.test.ts | execSyncs `bun run type-check` (V7 N-A) → replace |
| 2,956 | src/test/engine/economy/balance.test.ts | review |

---

## 2. Validation Verdicts (from plan review, verified @ fc3bd07f)

- **APPROVED:** env-split via pragma convention (134 existing `@vitest-environment jsdom`); `test.projects` + per-project `isolate` available in vitest 5.0.1; emergent-report conversion; _mocks extraction (precedent: `_helpers.ts`); setup.ts resets exist but miss useGameStore/engineEventBus/NewsletterFeed/idCounter.
- **DISPROVED/STALE:** orphan-audit A1–A4 all wired since `49802cb2` (tournamentArenaSelection→resolution.ts+boutResolution; burnAnalysis→TrainingCardHeader/trainingAdvisor/rosterWorkerTraining; tacticAdvisor→tacticsAdvisorBridge/coreGenerator; run-round→BoutsStep/TournamentRoundCard/ArenaHub). Fresh orphan-scan required.
- **CORRECTED:** same-module dup pairs = 13 combat + warriorCollection + WinScreen + cn (+ narrativeContent cluster); remaining basename collisions are coincidental (rename only); engine/factories tests are correctly-placed production-factory tests; local factory count is ~127 not ~90.
- **isolate:false cannot be global:** 48 files mutate `useGameStore` with no setup reset → scope to node cohort only.

---

## 3. Ledger (Phase 1 — generated)

*Note:* populated by `scripts/test-audit-scan.mjs` → `scripts/out/test-audit.json`; verdicts folded below.

### 3a. Merge queue (same-module duplicate specs)

| Pair | Target module | Verdict |
| --- | --- | --- |
| combat/combatFatigue + combat/mechanics/combatFatigue | mechanics/combatFatigue | merge → mechanics/ |
| combat/combatDamage + combat/mechanics/combatDamage | mechanics/combatDamage | merge → mechanics/ |
| combat/counterstrike + combat/resolution/counterstrike | resolution/counterstrike | merge → resolution/ |
| combat/damageCalc + combat/mechanics/damageCalc | mechanics/damageCalc | merge → mechanics/ |
| combat/hitLocation + combat/mechanics/hitLocation | mechanics/hitLocation | merge → mechanics/ |
| combat/bleed + combat/resolution/bleed | resolution/bleed | merge → resolution/ |
| combat/weaponArmor + combat/mechanics/weaponArmor | mechanics/weaponArmor | merge → mechanics/ |
| combat/specialtyMods + combat/resolution/specialtyMods | resolution/specialtyMods | merge → resolution/ |
| combat/attackCheck + combat/resolution/exchangeHelpers/checks/attackCheck | …/checks/attackCheck | merge → checks/ |
| combat/combatMath + combat/mechanics/combatMath | mechanics/combatMath | merge → mechanics/ |
| combat/protectShield + combat/mechanics/protectShield | mechanics/protectShield | merge → mechanics/ |
| combat/psychState + combat/resolution/psychState | resolution/psychState | merge → resolution/ |
| combat/guardBreak + combat/resolution/guardBreak | resolution/guardBreak | merge → resolution/ |
| utils/warriorCollection + engine/core/warriorCollection | engine/core/warriorCollection | merge → engine/core/ |
| components/WinScreen + components/progression/WinScreen | progression/WinScreen | merge → progression/ |
| src/lib/utils.test.ts + test/lib/cn.test.ts | lib/utils (cn) | merge → test/lib/ |
| data/narrativeContent cluster (9 files, ~1542 LOC) | data/narrativeContent | merge/dedup per-scan |

### 3b. Delete queue

| File                                | Reason                                | Verdict                              |
| ----------------------------------- | ------------------------------------- | ------------------------------------ |
| src/scripts/emergent-report.test.ts | self-declared instrumentation harness | convert → scripts/emergent-report.ts |

### 3c. Move queue (Phase 4)

| File | Destination |
| --- | --- |
| src/lib/{utils,obfuscation,boutUtils}.test.ts | src/test/lib/ |
| src/scripts/{daily_bard,workflow-config,simulation}.test.ts | src/test/scripts/ |
| src/utils/format.test.ts | src/test/utils/ |
| src/engine/crest/{chargePaths,crestGenerator}.test.ts | src/test/engine/crest/ (new) |
| src/test/components/run-round/AutosimConsole.test.tsx | src/test/components/runRound/ |
| src/test/engine/ai/competitionWorker/* | merge into src/test/engine/ai/workers/competitionWorker/ or per source layout |
| src/test/buildConfigIntegrity.test.ts | src/test/config/ |
| src/test/electronMain.test.ts | src/test/vite/ or electron/ |
| src/test/terminology.test.ts, testQualityAudit.test.ts | src/test/_meta/ or root |

*Note:* scanner results + sign-off appended below as generated.

### 3d. Scanner results (scripts/test-audit-scan.mjs → scripts/out/test-audit.json)

| Metric | Value |
| --- | --- |
| Files needing DOM, missing jsdom pragma | **56** (list in test-audit.json; ~29 RTL .tsx + 3 RTL .ts hooks/state + engine .ts referencing DOM globals) |
| Basename collision groups | 23 (incl. combatFatigue **triple**: `engine/combatFatigue.test.ts` also targets mechanics/combatFatigue) |
| Identical import-set clusters | 44 |
| Local factory defs | 127 |
| Dead patterns | 6 files (expect(true): bunViCompat×1, TacticalBar×2, narrativeContent.integration×4, seasonalPrismaticGale×1, newLoreExpansionTraits×4, ariaLabels×1) |
| Fresh orphans (test-only source) | `engine/ai/plan/index.ts` (dead barrel), `engine/pipeline/tick/dayAdvance.ts` (passthrough delegate) |
| Kept despite orphan flag | `engine/validate/stateInvariants.ts` — intentional soak tooling, imported by `scripts/soak.mjs` |

### 3e. Fresh orphan dispositions (Phase 1 verdicts)

| File | Evidence | Verdict |
| --- | --- | --- |
| `src/engine/ai/plan/index.ts` | Sole consumer: `test/engine/ai/ownerAI.test.ts` imports `aiPlanForWarrior, getStyleMatchupMods` from the barrel | **DELETE barrel**; repoint test to `./coreGenerator` + `../matchup/styleMatcher` |
| `src/engine/pipeline/tick/dayAdvance.ts` | 9-line delegate to `TickOrchestrator.advanceDay`; `dayPipeline.test.ts` only asserts delegation; `TickOrchestrator.test.ts` covers the real impl | **DELETE both** (test loses no unique coverage) |
| `src/engine/validate/stateInvariants.ts` | Imported by `scripts/soak.mjs`; docstring: intentional soak/CI tooling | **KEEP** |

### 3f. Additional same-module merge candidates (scanner-confirmed, beyond §3a)

| Files | Shared target | Verdict |
| --- | --- | --- |
| `src/scripts/daily_bard.test.ts` + `test/scripts/dailyBard.test.ts` | src/scripts/daily_bard | merge → `test/scripts/` (move+dup) |
| `test/engine/combatFatigue.test.ts` (engine root) | mechanics/combatFatigue | merge into mechanics/ (triple→single) |
| `test/engine/ai/matchup/styleMatcher.test.ts` + `test/engine/combat/styleMatchupSymmetry.test.ts` | ai/matchup/styleMatcher | review: symmetry test may assert cross-style invariants → merge only overlapping cases |
| `test/engine/ai/boutBiddingOptimization.test.ts` + `boutBiddingPerf.test.ts` | competitionWorker/boutBidding | merge perf+opt where assertions overlap |
| `test/engine/storage/electronArchive.test.ts` + `electronIPCBounds.test.ts` | storage/electronArchive | merge |
| `test/engine/traits/traits.test.ts` + `traitsCharacterization.test.ts` | engine/traits | review |
| `test/engine/stats/styleRollups.test.ts` + `styleRollupsCache.test.ts` | stats/styleRollups | review: cache-file may be distinct concern → keep if no overlap |
| `test/data/arenas` cluster (arenaLore, arenaLoreDedup, arenaRegistration, arenaRegistrationV7, newArenaLore, newArenas) | src/data/arenas | assertion-level review; likely dedup of registration/lore-count assertions across V5–V7 PR gates |
| `test/data/narrative` cluster (7 files on src/data/narrative) | src/data/narrative | same — UnionV7/narrativeMockMarkers likely redundant post-merge |
| `test/engine/pipeline` seasonal/offseason clusters | offseasonEvents/chaosHandlers etc. | same target but distinct events — **keep**, review only |
| `src/test/components/BookmarkButton.test.tsx` + `BookmarkButtonA11y.test.tsx` | bookmarks/BookmarkButton | review: a11y file may be subset → merge if subset |

**Merge rule:** union-spec-first drafting decides every pair — if the drafted union file is green against unmodified source and preserves both files' describe intent, originals are deleted; otherwise files stay split (verdict recorded).

### 3g. Sign-off

Presented to user (session msg); deletions proceed under approved plan policy: delete test+source together for confirmed dead code; all merges gated by union-spec-green precondition. Newly discovered items (§3e–§3f) flagged here for review — objections may be raised before Phase 3 commit lands.
