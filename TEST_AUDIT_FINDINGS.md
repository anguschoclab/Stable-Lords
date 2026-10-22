# TEST_AUDIT_FINDINGS — Test Suite Audit, Consolidation & Reorganization

**Scope:** Exhaustive audit, dedup, structural reorganization, and performance optimization of the vitest suite per approved megaplan. Zero backwards-compatibility constraints.
**Restore point:** tag `pre-test-megaplan` → `fc3bd07f` (local).
**Working mode:** in-place at canonical clone, sequential commits per ledger batch; deletes and moves never mixed in a commit.

---

## 1. Baseline Metrics (Phase 0)

| Metric                                           | Baseline                                                     | Notes                                                         |
| ------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------- |
| `bunx vitest run` (default)                      | **690 files / 7,904 pass / 2 skip / 0 fail — 90.14s**        | env 47%, tests 25%, setup 12%, import 8%, transform 7%        |
| `bunx vitest run --config vitest.config.slow.ts` | 12 files                                                     | see §1a                                                       |
| `bun run test:bun`                               | **687 files / 7,874 pass / 1 skip / 0 fail — 139.69s**       | 4 bunfig ignores (electronMain, bibleIndex, HelpA11y, *.slow) |
| `bunx playwright test`                           | —                                                            | e2e baseline TBD                                              |
| type-check / lint / build                        | 0 errors (V7 verified, re-run at Phase 6)                    |                                                               |
| Per-file timings                                 | `scripts/out/baseline-test-timings.tsv` (689 rows, Σ191.05s) |                                                               |
| Colocated strays outside `src/test/`             | 10 files                                                     | src/lib×3, src/scripts×4, src/utils×1, src/engine/crest×2     |
| Local `make*/create*` factory defs in tests      | ~127 files                                                   | vs 49 `_fixtures/factories` importers                         |
| `@vitest-environment jsdom` pragmas              | 134 files                                                    | convention sanctioned by eslint `definedTags`                 |

### 1a. Slow-suite baseline (12 files)

| File                                   | Time     | Notes                                   |
| -------------------------------------- | -------- | --------------------------------------- |
| worldLiveness.integration.slow.test.ts | 50,932ms | 3 tests; 104-wk invariant sim dominates |
| _(remaining files)_                    | —        | see §1a output                          |

### 1b. Top slow files, default suite

| ms     | File                                                                       | Verdict                                               |
| ------ | -------------------------------------------------------------------------- | ----------------------------------------------------- |
| 33,248 | src/scripts/emergent-report.test.ts                                        | self-declared harness, not a test → convert to script |
| 30,541 | src/scripts/simulation.test.ts                                             | full runSimulation → promote/shrink                   |
| 15,766 | src/test/engine/ai/rivalTraitAI.integration.test.ts                        | shrink sim                                            |
| 15,105 | src/test/engine/sim/harnessTruncation.test.ts                              | shrink sim                                            |
| 9,130  | src/test/engine/pipeline/worldEvolvesWhenPlayerStopped.integration.test.ts | shrink sim                                            |
| 7,930  | src/test/engine/autosim/sequentialMemoryGrowth.test.ts                     | merge w/ autosimMemoryGrowth, promote                 |
| 4,002  | src/test/engine/autosimMemoryGrowth.test.ts                                | same                                                  |
| 3,764  | src/test/engine/pipeline/yearRollover.integration.test.ts                  | promote/shrink                                        |
| 3,555  | src/test/buildConfigIntegrity.test.ts                                      | execSyncs `bun run type-check` (V7 N-A) → replace     |
| 2,956  | src/test/engine/economy/balance.test.ts                                    | review                                                |

---

## 2. Validation Verdicts (from plan review, verified @ fc3bd07f)

- **APPROVED:** env-split via pragma convention (134 existing `@vitest-environment jsdom`); `test.projects` + per-project `isolate` available in vitest 5.0.1; emergent-report conversion; _mocks extraction (precedent: `_helpers.ts`); setup.ts resets exist but miss useGameStore/engineEventBus/NewsletterFeed/idCounter.
- **DISPROVED/STALE:** orphan-audit A1–A4 all wired since `49802cb2` (tournamentArenaSelection→resolution.ts+boutResolution; burnAnalysis→TrainingCardHeader/trainingAdvisor/rosterWorkerTraining; tacticAdvisor→tacticsAdvisorBridge/coreGenerator; run-round→BoutsStep/TournamentRoundCard/ArenaHub). Fresh orphan-scan required.
- **CORRECTED:** same-module dup pairs = 13 combat + warriorCollection + WinScreen + cn (+ narrativeContent cluster); remaining basename collisions are coincidental (rename only); engine/factories tests are correctly-placed production-factory tests; local factory count is ~127 not ~90.
- **isolate:false cannot be global:** 48 files mutate `useGameStore` with no setup reset → scope to node cohort only.

---

## 3. Ledger (Phase 1 — generated)

_Note:_ populated by `scripts/test-audit-scan.mjs` → `scripts/out/test-audit.json`; verdicts folded below.

### 3a. Merge queue (same-module duplicate specs)

| Pair                                                                      | Target module                 | Verdict              |
| ------------------------------------------------------------------------- | ----------------------------- | -------------------- |
| combat/combatFatigue + combat/mechanics/combatFatigue                     | mechanics/combatFatigue       | merge → mechanics/   |
| combat/combatDamage + combat/mechanics/combatDamage                       | mechanics/combatDamage        | merge → mechanics/   |
| combat/counterstrike + combat/resolution/counterstrike                    | resolution/counterstrike      | merge → resolution/  |
| combat/damageCalc + combat/mechanics/damageCalc                           | mechanics/damageCalc          | merge → mechanics/   |
| combat/hitLocation + combat/mechanics/hitLocation                         | mechanics/hitLocation         | merge → mechanics/   |
| combat/bleed + combat/resolution/bleed                                    | resolution/bleed              | merge → resolution/  |
| combat/weaponArmor + combat/mechanics/weaponArmor                         | mechanics/weaponArmor         | merge → mechanics/   |
| combat/specialtyMods + combat/resolution/specialtyMods                    | resolution/specialtyMods      | merge → resolution/  |
| combat/attackCheck + combat/resolution/exchangeHelpers/checks/attackCheck | …/checks/attackCheck          | merge → checks/      |
| combat/combatMath + combat/mechanics/combatMath                           | mechanics/combatMath          | merge → mechanics/   |
| combat/protectShield + combat/mechanics/protectShield                     | mechanics/protectShield       | merge → mechanics/   |
| combat/psychState + combat/resolution/psychState                          | resolution/psychState         | merge → resolution/  |
| combat/guardBreak + combat/resolution/guardBreak                          | resolution/guardBreak         | merge → resolution/  |
| utils/warriorCollection + engine/core/warriorCollection                   | engine/core/warriorCollection | merge → engine/core/ |
| components/WinScreen + components/progression/WinScreen                   | progression/WinScreen         | merge → progression/ |
| src/lib/utils.test.ts + test/lib/cn.test.ts                               | lib/utils (cn)                | merge → test/lib/    |
| data/narrativeContent cluster (9 files, ~1542 LOC)                        | data/narrativeContent         | merge/dedup per-scan |

### 3b. Delete queue

| File                                | Reason                                | Verdict                              |
| ----------------------------------- | ------------------------------------- | ------------------------------------ |
| src/scripts/emergent-report.test.ts | self-declared instrumentation harness | convert → scripts/emergent-report.ts |

### 3c. Move queue (Phase 4)

| File                                                        | Destination                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| src/lib/{utils,obfuscation,boutUtils}.test.ts               | src/test/lib/                                                                 |
| src/scripts/{daily_bard,workflow-config,simulation}.test.ts | src/test/scripts/                                                             |
| src/utils/format.test.ts                                    | src/test/utils/                                                               |
| src/engine/crest/{chargePaths,crestGenerator}.test.ts       | src/test/engine/crest/ (new)                                                  |
| src/test/components/run-round/AutosimConsole.test.tsx       | src/test/components/runRound/                                                 |
| src/test/engine/ai/competitionWorker/*                      | merge into src/test/engine/ai/workers/competitionWorker/ or per source layout |
| src/test/buildConfigIntegrity.test.ts                       | src/test/config/                                                              |
| src/test/electronMain.test.ts                               | src/test/vite/ or electron/                                                   |
| src/test/terminology.test.ts, testQualityAudit.test.ts      | src/test/_meta/ or root                                                       |

_Note:_ scanner results + sign-off appended below as generated.

### 3d. Scanner results (scripts/test-audit-scan.mjs → scripts/out/test-audit.json)

| Metric                                  | Value                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Files needing DOM, missing jsdom pragma | **56** (list in test-audit.json; ~29 RTL .tsx + 3 RTL .ts hooks/state + engine .ts referencing DOM globals)                                           |
| Basename collision groups               | 23 (incl. combatFatigue **triple**: `engine/combatFatigue.test.ts` also targets mechanics/combatFatigue)                                              |
| Identical import-set clusters           | 44                                                                                                                                                    |
| Local factory defs                      | 127                                                                                                                                                   |
| Dead patterns                           | 6 files (expect(true): bunViCompat×1, TacticalBar×2, narrativeContent.integration×4, seasonalPrismaticGale×1, newLoreExpansionTraits×4, ariaLabels×1) |
| Fresh orphans (test-only source)        | `engine/ai/plan/index.ts` (dead barrel), `engine/pipeline/tick/dayAdvance.ts` (passthrough delegate)                                                  |
| Kept despite orphan flag                | `engine/validate/stateInvariants.ts` — intentional soak tooling, imported by `scripts/soak.mjs`                                                       |

### 3e. Fresh orphan dispositions (Phase 1 verdicts)

| File                                     | Evidence                                                                                                                                         | Verdict                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `src/engine/ai/plan/index.ts`            | Sole consumer: `test/engine/ai/ownerAI.test.ts` imports `aiPlanForWarrior, getStyleMatchupMods` from the barrel                                  | **DELETE barrel**; repoint test to `./coreGenerator` + `../matchup/styleMatcher` |
| `src/engine/pipeline/tick/dayAdvance.ts` | 9-line delegate to `TickOrchestrator.advanceDay`; `dayPipeline.test.ts` only asserts delegation; `TickOrchestrator.test.ts` covers the real impl | **DELETE both** (test loses no unique coverage)                                  |
| `src/engine/validate/stateInvariants.ts` | Imported by `scripts/soak.mjs`; docstring: intentional soak/CI tooling                                                                           | **KEEP**                                                                         |

### 3f. Additional same-module merge candidates (scanner-confirmed, beyond §3a)

| Files                                                                                                                   | Shared target                      | Verdict                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/scripts/daily_bard.test.ts` + `test/scripts/dailyBard.test.ts`                                                     | src/scripts/daily_bard             | merge → `test/scripts/` (move+dup)                                                               |
| `test/engine/combatFatigue.test.ts` (engine root)                                                                       | mechanics/combatFatigue            | merge into mechanics/ (triple→single)                                                            |
| `test/engine/ai/matchup/styleMatcher.test.ts` + `test/engine/combat/styleMatchupSymmetry.test.ts`                       | ai/matchup/styleMatcher            | review: symmetry test may assert cross-style invariants → merge only overlapping cases           |
| `test/engine/ai/boutBiddingOptimization.test.ts` + `boutBiddingPerf.test.ts`                                            | competitionWorker/boutBidding      | merge perf+opt where assertions overlap                                                          |
| `test/engine/storage/electronArchive.test.ts` + `electronIPCBounds.test.ts`                                             | storage/electronArchive            | merge                                                                                            |
| `test/engine/traits/traits.test.ts` + `traitsCharacterization.test.ts`                                                  | engine/traits                      | review                                                                                           |
| `test/engine/stats/styleRollups.test.ts` + `styleRollupsCache.test.ts`                                                  | stats/styleRollups                 | review: cache-file may be distinct concern → keep if no overlap                                  |
| `test/data/arenas` cluster (arenaLore, arenaLoreDedup, arenaRegistration, arenaRegistrationV7, newArenaLore, newArenas) | src/data/arenas                    | assertion-level review; likely dedup of registration/lore-count assertions across V5–V7 PR gates |
| `test/data/narrative` cluster (7 files on src/data/narrative)                                                           | src/data/narrative                 | same — UnionV7/narrativeMockMarkers likely redundant post-merge                                  |
| `test/engine/pipeline` seasonal/offseason clusters                                                                      | offseasonEvents/chaosHandlers etc. | same target but distinct events — **keep**, review only                                          |
| `src/test/components/BookmarkButton.test.tsx` + `BookmarkButtonA11y.test.tsx`                                           | bookmarks/BookmarkButton           | review: a11y file may be subset → merge if subset                                                |

**Merge rule:** union-spec-first drafting decides every pair — if the drafted union file is green against unmodified source and preserves both files' describe intent, originals are deleted; otherwise files stay split (verdict recorded).

### 3g. Sign-off

Presented to user (session msg); deletions proceed under approved plan policy: delete test+source together for confirmed dead code; all merges gated by union-spec-green precondition. Newly discovered items (§3e–§3f) flagged here for review — objections may be raised before Phase 3 commit lands.

---

## 4. Outcomes (Phases 3–5, measured)

### 4a. Deletions & merges

- `src/scripts/emergent-report.test.ts` (33s, self-described "not a real test")
  → converted to `scripts/emergent-report.ts` standalone script; verified
  end-to-end run (52 weeks, clean exit).
- Dead pairs removed: `ai/plan/index.ts` barrel + `dayAdvance.ts`/`dayPipeline`
  delegation test. Fresh orphan scan re-ran clean; `stateInvariants.ts` kept
  (documented soak tooling used by `scripts/soak.mjs`).
- Same-module duplicate merges (union-spec-first, all green pre-delete):
  combat ×13 (flat → mechanics/resolution), `warriorCollection`, `WinScreen`,
  `cn`, `daily_bard`→`dailyBard`, `boutBidding` perf+opt (29 tests),
  `traits`+characterization (2 unique assertions kept; "0–1 traits" weaker
  claim dropped — real contract is 0–2), arena cluster (6→2 files),
  narrative cluster. **22 colliding basenames → 0.**

### 4b. Fixture migration (Phase 3c + follow-up sweep)

- `factories.ts` gained `makeFighterState` + `makeResolutionContext` (combat
  exchange shapes previously copy-pasted ×5), `makeComputedWarrior`
  (attributes → real `computeWarriorStats` baseSkills/derivedStats, ~23 file
  pattern), `makeTrainer`, `makeRivalry`, `makeGrudge`, `makePromoter`,
  `makePoolWarrior`, `makeDerivedRivalry`, `makeWarriorRow(s)`.
- 85 files migrated to thin adapters via a brace-aware codemod
  (`scripts/delegate-factories.mjs`, removed after use); a follow-up manual
  sweep converted function-declared factories, GameState literals (delegate
  to `makeGameState` which auto-builds warriorMap/rivalMap/grudgeMap), and
  identical cross-file helpers (DerivedRivalry ×2, WarriorRow ×2).
- **3 files retain local factories**, all principled: `aiIntentTelemetry`
  (seeded-RNG fighter pair via the production `warriorFactory`),
  `equipmentIntegration` (production factory + equipment spread),
  `tournamentSelection` (inner 8-warrior bracket generator). Tracked in
  `auditBaseline.json` under `localFactoryFiles`.
- The delegate detector exempts adapters that call names imported from
  `_fixtures/factories` OR `@/engine/factories/*` (production factories are
  not fixture duplication), including `function` declarations and block
  bodies up to the next factory def.
- Codemod incidents (stale `as T` tails, braced-body misparse) were reverted
  cleanly and the script fixed before re-application — no forward-patching.

### 4c. Reorganization (Phase 4)

- 7 colocated strays moved to `src/test/` with `@/` import rewiring.
- `runRound/` → `run-round/`, `ai/competitionWorker/` → `ai/workers/...` to
  mirror production paths; meta-tests (`buildConfigIntegrity`,
  `electronMain`, `terminology`) → `src/test/config/`.
- `vitest.config*.ts`: `dir` tightened `./src` → `./src/test` — future
  colocated strays are uncollectable.

### 4d. Performance (Phase 5, measured wall-clock)

| Metric                | Before                         | After                                                                                      |
| --------------------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| Default suite         | ~90s / 702 files / 7,904 tests | **~33s / 653 files / 7,867 tests**                                                         |
| Slow suite (parallel) | 125.9s sequential              | **~66s** (`fileParallelism` re-enabled — safe)                                             |
| Environment share     | 47%                            | 18%                                                                                        |
| jsdom workers         | all                            | only pragma-flagged DOM files                                                              |
| Coverage (v8)         | unmeasured                     | 85.3% stmts / 75.2% branches / 79.1% funcs / 86.8% lines — gated via `coverage.thresholds` |

- Global env `jsdom` → `node`; every DOM consumer carries an explicit pragma
  (`needsDomMissingPragma: 0`; a `node` pragma suppresses false-positive
  "DOM references" like `typeof document === 'undefined'`).
- 10 long-pole files promoted to `*.slow.test.ts` (top: 52-week simulation
  ~29s). Slow suite: `bun run test:slow`, CI `slow-tests` job.
- `setup.ts` split into `setup.node.ts` + `setup.dom.ts`; the shared project
  loads only the node half.
- **Scoped `isolate: false` via `test.projects`**: pure-node files (~440)
  share workers in a `shared` project; mocks/DOM/global-mutation files stay
  in `isolated`. Classification is generated into `runnerGroups.json` by the
  audit scanner and guarded by `testQualityAudit`. `@vitest-isolate` pragma
  available for cases static detection can't prove.
- Shared-worker pollution fixed at the root (not by isolating victims):
  `resetArenaRegistry` in `arenas.ts`; engine-pool reset in `setup.node.ts`
  (`configureEnginePool(>1)` survived `shutdown` → Comlink workers spawned in
  vitest → 120s hangs); `bunViPolyfill` gained `stubEnv`/`unstubAllEnvs`.
- Global `isolate: false` **rejected** earlier — shared module registry breaks
  `vi.mock` interception and mixed-env RTL unmount; the scoped variant keeps
  the speed (~33s) without the hazard.

### 4e. Guardrails (permanent)

- `testQualityAudit.test.ts`: 8 structural guards, shrink-only allowlists in
  `auditBaseline.json` (stale entries fail the gate); runner-group drift guard
  keeps the shared/isolated split honest.
- `stateReset.test.ts`: singleton reset sentinels (eventBus, NewsletterFeed,
  idCounter, useGameStore, module caches, arena registry, engine pool).
- `bunRunnerSafety.test.ts`: bans bun-deadlocking `vi.mock(() => import())`.
- Env canaries: pragma mechanism + node-env proof.
- Dead-pattern sweep: `expect(true)` tautologies replaced with real
  assertions (seeded-loop `fired` flags, expand-then-clear UI paths,
  trait-definition hard asserts, aria-label path fixes — the old list pointed
  at 9 moved components and silently passed). One intentional `toBe(false)`
  throw remains inside `vi.waitFor`.
- Coincidental basename collisions resolved: 7 pairs renamed to
  subject-qualified names (`weekDeterminism`, `economyUtils`, `injuryUtils`,
  `impactProgression`, `weatherVisuals`, `TournamentComponents`,
  `FighterConfigCard.domIds`, `ResolutionReveal.selector`).
- CI matrix gained `coverage` (threshold-gated) and `electron`
  (`electron:compile`) jobs; `playwright --project=chromium` already present.
- Authoring rules: `docs/TESTING.md`.

---

## 5. Wave 2 (2026-10-22)

Findings for the wave-2 campaign (`TEST_SUITE_AUDIT_PLAN.md` §"Wave 2"; ledger
`TEST_SUITE_AUDIT_LEDGER.md` §"Wave 2"). Every claim below was re-verified
against live scans and file reads on 2026-10-22 — verdicts: **APPROVED** /
**CORRECTED** / **DISPROVED** per row in the plan's validation ledger (V1–V20).
This document earlier covered the `pre-test-megaplan` campaign (§1–§4);
wave-2 continues the numbering.

### 5a. Baseline metrics (fresh, 2026-10-22)

| Metric | Value | Source |
| ------ | ----- | ------ |
| `bunx vitest run` (default) | **880 files / 9,467 pass / 2 pending / 0 fail** | `scripts/out/default-suite-timings.json` |
| Per-file wall | p50 38ms · p90 1,487ms · p99 6,216ms · Σ512s | same |
| Files >2s / >5s | **52 / 11** | same (TSV refreshed → 888 rows) |
| `test-audit.json` | 921 vitest · 41 slow · 254 jsdom / 49 node pragmas · 248 needsDom · 0 missing-pragma · 0 basename collisions · 3 localFactory · **37 importSetClusters** | `scripts/out/test-audit.json` |
| jscpd `src/test` | **88 clones / 1.02% dup lines** | `bunx jscpd src/test` → `scripts/out/jscpd/` (canonical scoped command; wave-1's "0" was the repo-wide run) |
| dup-scan registered | test↔test **70 DEBT** (budget) + 9 EXEMPT · mixed 17 EXEMPT · ident queues w20=50 / w16=125 | `duplication.guard.test.ts`, `dup-scan.json` |
| knip | 150 unused exports · 68 types · 4 duplicate exports (report-only) | `bun run dead-code` |
| orphan-scan | 0 unreachable · 0 test-only-reachable | `scripts/out/orphan-scan.json` |
| Wall time trend | 90.14s (wave-0) → 63.5s → 52.9s (wave-1) → ~66s (V18 baseline 10-21) | ledgers |

### 5b. Validation ledger (draft claims → verdicts)

| # | Claim | Verdict |
| - | ----- | ------- |
| V1 | 880 files / 9,469 tests / 0 fail / 2 pending | **APPROVED** |
| V2 | TSV stale (Oct-8, 809 rows) | **APPROVED** → refreshed 888 rows |
| V3 | 52 >2s / 11 >5s | **APPROVED** (list §5d) |
| V4 | test-audit summary | **APPROVED** |
| V5 | jscpd 88 clones "regrown" | **CORRECTED** — measurement-basis caveat; 88 is scoped ground truth |
| V6 | TEST_DEBT ≈70 | **APPROVED (exact 70)** |
| V7 | ~69 files outside CI bun shard | **CORRECTED → exactly 70; CI-only gap** (list §5c) — local `bun run test:bun` covers all |
| V8 | `clickNavLink` dead helper | **CORRECTED** — unused export, live internally via `navigateNavLink`; fix = un-export |
| V9 | 48 non-taxonomy qualifier files | **APPROVED** — all 41 qualifiers match `^[a-z][a-zA-Z]*$` → word rule, zero renames |
| V10 | CATEGORY_DOMAIN missing lore/layout | **APPROVED — sharper**: unlisted dirs escape conformance silently → dir-registration guard |
| V11 | Parallel fs-walk helpers | **APPROVED — triple** (`_setup/fsHelpers` ×5, `_helpers/fsWalk` ×5, inline copy in `testQualityAudit`) |
| V12 | avatar-catalog `beforeEach` for all ~9.4k tests | **APPROVED** (`setup.node.ts:13-39`) |
| V13 | 28 megaplan guards need lifecycle audit | **APPROVED** → §5e all LIVE_RATCHET |
| V14 | demote >5s → `.slow` | **CORRECTED** — coverage-delta measurement required per demotion |
| V15 | orphan-scan clean | **APPROVED** |
| V16 | `src/test/scripts/` needs map entry | **DISPROVED** — `#scripts/` imports → exempt; register as non-mirror |
| V17 | `e2e/screenshots` tracked | **DISPROVED** — untracked |
| V18 | jsdom-pragma lever exhausted | **APPROVED** (6 indirect renderers only) |
| V19 | `timings-to-tsv.mjs` missing | **APPROVED** → Phase-0 deliverable |
| V20 | skip-ticket registry free | **CORRECTED** — `S*/D*` taken by V18 → wave-2 uses `MEGAPLAN-A*` |

### 5c. CI bun-test shard coverage gap (70 files)

`ci.yml` `bun-test` iterates `src/test/engine/*/` + 15 named dirs — engine-root
files and 6 whole dirs are never enumerated in CI (local `bun run test:bun`
covers everything; this is a CI-enumeration gap only).

- `src/test/engine/` root (51): `moduleCacheRegistry`, `grudgeMap`,
  `equipmentOptimizer`, `stylePassives`, `weekPipeline`, `progression`,
  `strategyAnalysis`, `potential`, `warriorStatus`, `injuries`, `aging`,
  `recruitScouting`, `locustSwarm`, `trainers`, `jobQueue`, `rivals`,
  `draftService`, `crowdMood`, `strategyValidator`, `coverageGapReport`,
  `matchmakingServices`, `fame`, `recruitment`, `metaDrift`,
  `stewardReportLeakage`, `skillCalc`, `stableReputation`,
  `determinismAudit`, `luckfactor`, `houseRules`, `scouting.insights`,
  `bloodMoon`, `session`, `aging.helpers`, `weaponSuitability`, `scouting`,
  `traitMods`, `bloodRain`, `tacticSuitability`, `stableReputation.helpers`,
  `workerProxy`, `deathNotifier`, `hardcodedYearAudit`, `favorites`,
  `simulateArenaBalance`, `planBias`, `envSafety`, `trainerAging`,
  `boutSimulationTimestamp`, `trainerSpecialties`, `warriorValue`
- `src/test/constants/` (10): arenaEvents, weatherRegistries,
  balanceConstantBounds, newArenaMath, recruitCosts, arenaEventsMigration,
  arenaWeatherModifiers, fightEconomics, magicNumbers, newArenaIntegration
- `src/test/layout/` (2): breadcrumbs/navTrail, breadcrumbs/routeCrumbs
- `src/test/lore/` (2): HallOfFights, LoreArchive
- `src/test/vite/` (1): stripWorkerRefresh
- `src/test/_setup/` (3): stateReset, setup.regression, **bunViCompat** (the
  bun-parity canary itself — never run under bun in CI)
- `src/test/_fixtures/` (1): factories.test

### 5d. Tail queue — 11 files >5s (fresh timings)

| ms | File | Notes |
| -- | ---- | ----- |
| 10,324 | engine/pipeline/truncationCadence.test.ts | demote vs fixture-light: measure coverage delta |
| 10,213 | engine/pool/enginePool.test.ts | real-pool work — candidate demote |
| 9,381 | engine/rivals/namePool.test.ts | |
| 9,077 | engine/simulateArenaBalance.test.ts | balance-sim — likely `.slow` |
| 8,863 | engine/pipeline/mutableInput.test.ts | |
| 8,614 | engine/championship/championsTournament.test.ts | coverage-heavy — prefer rewrite |
| 6,817 | engine/ai/expansionService.test.ts | |
| 6,216 | components/VirtualizedFallenGrid.test.tsx | jsdom+virtualization |
| 6,215 | config/eslintSmoke.test.ts | subprocess lint — demote candidate |
| 5,044 | engine/pipeline/skipToWeekEndOwnership.test.ts | |
| 5,018 | engine/pipeline/finalizeContracts.test.ts | |

Coverage-floor rule (V14): `*.slow.test.*` is excluded from `test:coverage`
and `bun test` — every demotion requires a before/after coverage delta on the
file's subjects; fixture-light rewrite (seeded mini-worlds) is the default
where unique coverage is carried.

### 5e. Guard lifecycle register (28 files — verdict: all LIVE_RATCHET)

Every `src/test/megaplan/` guard was read for its assertion shape: each pins a
regressable invariant (allowlist ceilings, ledger parity, wiring contracts,
doc-parity, preserved behaviors) — **none are one-shot historical checks**, so
zero retirements this wave. T6 registers them formally; new guards must
register going forward.

| Guard | Guards | Verdict |
| ----- | ------ | ------- |
| duplication.guard | src↔src/test↔test/mixed dup ledgers + baselines | LIVE_RATCHET |
| entriesInLoop.guard | Object.entries-in-loop exception list | LIVE_RATCHET |
| scanInLoop.guard | in-loop linear-scan exception list | LIVE_RATCHET |
| skipCount.guard | .skip policy + ticket registry | LIVE_RATCHET |
| orphanScan.guard | no new unreachable/test-only-reachable | LIVE_RATCHET |
| paramBudget.guard | PARAM_LIMIT=5 | LIVE_RATCHET |
| fileBudget | file/function size ceilings | LIVE_RATCHET |
| uiTokens.guard | design-token/RNG policy | LIVE_RATCHET |
| markdownSanitize.guard | rehype-sanitize pipeline | LIVE_RATCHET |
| typeSurface | type-module export parity | LIVE_RATCHET |
| informationArchitecture | Stable/World hub structure | LIVE_RATCHET |
| documentationParity | docs vs live routes | LIVE_RATCHET |
| legibility.contract | tracking/py caps | LIVE_RATCHET |
| pagePrimitives.conformance | PageFrame/PageHeader usage | LIVE_RATCHET |
| wiring.wired | G2/G3 feature wiring contracts | LIVE_RATCHET |
| styleArchives.wired | G1 style-archive wiring | LIVE_RATCHET |
| appShell.cta | L1 per-route CTA registry | LIVE_RATCHET |
| v11DeadSurface.guard | dead barrels stay deleted | LIVE_RATCHET |
| v11Dedup.guard.slow | prod cluster ceiling ≤50 (subprocess) | LIVE_RATCHET |
| v11Restructure.guard | monolith dir/budget structure | LIVE_RATCHET |
| v11Wiring.contract | V11 export-consumption contracts | LIVE_RATCHET |
| v12Dedup.guard | V12 shared-helper existence+behavior | LIVE_RATCHET |
| v12Srp.guard | V12 decomposition budgets | LIVE_RATCHET |
| v14EntryPoints.guard | engineProxy call-site allowlist | LIVE_RATCHET |
| v14PipelineDocs.guard | pipeline docs ⇄ pass table parity | LIVE_RATCHET |
| v18Dedup.guard | V18 test-tier dedup contracts | LIVE_RATCHET |
| v18Preservation.guard | §U unique-logic preservation | LIVE_RATCHET |
| v18Srp.guard | V18 decomposition budgets | LIVE_RATCHET |

### 5f. Consolidation queues (Phase-1 triage)

- **jscpd `src/test`:** 88 clones → enumerate via
  `scripts/out/jscpd/jscpd-report.json`; drain to 0 or register EXEMPT.
- **TEST_DEBT_PAIRS (70):** harmonization targets per pair-class —
  `_fixtures/factories.ts` is the enforced home for local factories;
  `_mocks/`/`_helpers/` for test-infra duplication.
- **importSetClusters (37→36):** triage COMPLETE (2026-10-23) —
  **all 36 KEEP**. Substance drained via the TEST_DEBT 70→0 pass; what
  remains is shared import preambles only. Same-subject sibling splits
  (`BookmarkButton`/`A11y`, `EntityLink`/`.perf`,
  `WarriorLeaderboardVirtualized`/`.branch`, `conditionEngine`/`.triggers`,
  `entityIndex`/`.mutation`, `electronArchive`/`IPCBounds`) are
  **deliberate `vi.mock`-isolation splits** — each file needs a different
  mock config for the same subject, which module-scope `vi.mock` makes
  impossible to merge. Includes the fs-walk triple (merged in Phase 4).
- **Ident tiers:** w20 = 50 test↔test, w16 = 125 — audit queues, staged.
- **e2e:** un-export `clickNavLink` (live internally via `navigateNavLink`).

### 5g. Reorganization queue

- `src/test/layout/breadcrumbs/{navTrail,routeCrumbs}.test.ts` →
  `src/test/components/layout/breadcrumbs/` (subjects:
  `@/components/layout/breadcrumbs/*`).
- `CATEGORY_DOMAIN` += `lore: ['src/lore']`; register `NON_MIRROR_DIRS`
  (\_fixtures, \_helpers, \_mocks, \_setup, config, integration, megaplan,
  perf, scripts, ui, vite) — any other dir with prod-importing tests is a
  violation.
- Residual allowlists (2 misplaced, 3 localFactory) re-verified — judgment
  calls stand.


### 5h. Wave-2 outcome (2026-10-22)

Campaign executed; per-phase record and final metrics live in
`TEST_SUITE_AUDIT_LEDGER.md` §"Wave 2". Headline: TEST_DEBT_PAIRS 70→0,
test↔test baseline 79→12 (all EXEMPT), jscpd 88→73 clones (1.02%→0.86%),
CI bun-test shard gap 70→0 (find-driven enumeration), default-suite tail
0 files >5s (was 11), p99 6.2s→1.4s, suite 9,469→9,493 tests green.
Setup-surgery (avatar-stub relocation) measured-and-rejected — node-env
specs legitimately consume the catalog; sentinel A5 pins the decision.
All T1–T9 contracts and A1–A5 guard tickets green; GUARD_REGISTRY is the
live lifecycle ledger for megaplan guards.
