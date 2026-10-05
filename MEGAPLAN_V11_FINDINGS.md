# MEGAPLAN V11 FINDINGS — Exhaustive Consolidation & Verdict Ledger

**Scope:** Consolidation pass over the entire Stable Lords repository — 4 open
PRs (#1024, #1027–#1029), remote-branch hygiene, all unmerged work since V10,
plus a concurrent in-flight feature train (stage B–E owner-competence axis)
that landed on `main` mid-pass and was absorbed, reviewed, and gate-repaired
in place. Zero save-file / backward-compatibility constraints.

**Verdict vocabulary:** `APPROVED` / `CORRECTED` / `DISPROVED` / `PARTIAL` /
`REJECTED` / `DEFERRED` / `EXEMPT`.

**Restore point:** `pre-megaplan-v11` at `ade1b001`.

---

## 0. Baseline re-measurement

| Metric | V10 close | V11 baseline | V11 close |
| --- | --- | --- | --- |
| Vitest files / tests | 752 / 8,577 (+2 skip) | 759 / 8,682 (+2 skip) | 780 / 8,767 (+2 skip) |
| Bun test files / tests | sharded green | 751 / 8,640 | 771 / 8,725 (+1 skip) |
| jscpd | report-only | 114 clones / 0.76% | 114 clones / 0.75% |
| knip unresolved imports | — | 1 (advisor-e2e) → **0 after fix** | 0 |
| knip unused exports | — | 465 | 463 (report-only) |
| jscpd file/line census | — | 1,851 files / 266,189 lines | same |

---

## 0a. Pre-implementation plan validation

| # | Draft claim | Verdict | Evidence |
| --- | --- | --- | --- |
| V1 | PR #1024 narrows QuestsWidget subscription correctly | **APPROVED** | `useShallow` + `React.memo` diff verified semantic-parity; `evaluateQuests` stays live via tests. Landed curated as `b9475174`. |
| V2 | #1024's vitest failure is real breakage | **DISPROVED** | Failing job was `fileBudget` ratchet on a 17-commits-stale baseline; merge-tree produced conflict-free tree; landed + green. |
| V3 | `type-check` script is green | **DISPROVED → FIXED** | `bun x @tanstack/router-cli generate` resolved `@latest` into a bunx temp dir whose `tinyglobby` couldn't resolve `picomatch` under Node 26. Pinned `1.167.29` (`838696e0`); output byte-identical. Guard: `toolPins.test.ts`. |
| V4 | `questsVisible` remains needed after #1024 | **DISPROVED** | PR bypassed the flag entirely; post-landing it was a dead export. Deleted in the curated commit. |
| V5 | `scripts/` drift is covered by type-check | **DISPROVED → PARTIALLY FIXED** | `tsconfig.e2e.json` excluded most of `scripts/`; `balance-lab`/`style-probe`/`run-fight`/`advisor-e2e` called `simulateFight`/`aiPlanForWarrior` positionally after both moved to options objects — FLAT harness crashed at `fighterState.ts:228`. Migrated all call sites (`3df0c578`, `08d9e581`, `17993f79`); still-broken legacy scripts remain excluded, itemized below. |
| V6 | V10 commit note "t2 25→21" vs code `{2:25}` | **CORRECTED** | The 25→21 delta was the *normal-pool* count inside the t2 tier cap, not the cap itself. Comment clarified (`8eb2b257`), no cap change. |
| V7 | Slow-suite failures are regressions | **PARTIAL** | Perf/timeout failures = environmental (concurrent suites + a zombie `bun test --isolate` process). VENDETTA/TOURNAMENT invariants = real logic gaps — `c6a8eed0`'s threshold fix proved insufficient; completed by `03f457c0` (see B-V11-7/8). |
| V8 | e2e 14/20 failure = app regression | **PARTIAL — see §4** | One real UI bug (B-V11-9, sonner z-index) + boot timeouts under suite contention. Two subsequent soak reruns were **invalidated by mid-run source edits** (vite HMR reloads reset all browsers to the title screen — error-context snapshots prove it). |

## 0b. Test-first compliance

Git-order audit `pre-megaplan-v11..HEAD`:

- `844d2d0d` test: V11 gate (QuestsWidget narrowing + script/tool guards) **before** `b9475174`/`47c1723f`/`838696e0` impl.
- `bedf55e4` test: stage-B red **before** `f2e29e60` impl.
- `4851b9bb` test: stage-C red **before** `ceb9f7ad` impl.
- `2ed86da9` test: stage-D red **before** `159b010e` impl.
- `e76d6245` test: stage-E red **before** `869478f4`/`fdaef651` impl.
- WarriorFightHistory narrowing test authored red (3 commits vs 2 expected) **before** `fed4c44b` landed #1027.

**APPROVED** — every implementation unit has a preceding `test:` commit.

---

## 1. Open-PR / branch disposition

| PR / Branch | Verdict | Landed as / Disposition |
| --- | --- | --- |
| #1024 QuestsWidget rerenders | **LANDED (curated)** | `b9475174` — `useShallow`+`memo`; deleted now-dead `questsVisible`; added Profiler commit-count regression test. |
| #1027 WarriorFightHistory selectors | **LANDED (curated)** | `fed4c44b` — targeted selectors; new `WarriorFightHistory.test.tsx` proves mutation outside selected slices does not re-render. |
| #1029 combat narration | **LANDED (curated)** | `4052f289` — 4 JSON data files; `narrative_validate` clean. |
| #1028 lore + traits | **LANDED (curated, filtered)** | `bcb04689` — content only; **excluded** `audit_lore.cjs`, `.claude/backups/*`, and its slow-test assertion relaxations (kept timeout bumps out; clean-run ceilings still hold). |

## 2. Concurrent-work absorption (stage B–E)

A parallel session committed a 5-stage feature train during this pass
(owner-competence axis → strategic/economic depth → in-bout adaptivity →
worldgen difficulty + UX surfacing). All absorbed into the V11 window and
gate-repaired in place:

| Commit | Unit | V11 action |
| --- | --- | --- |
| `bedf55e4`/`f2e29e60` | stage-B competence | ESLint `no-non-null-assertion` violations repaired (guarded indexing/defaults); JSDoc gaps filled (`5c190da0`). |
| `4851b9bb`/`ceb9f7ad` | stage-C strategic depth | `escalateCounter` (7 params) + `matchupSkepticism` (6 params) violated param-budget ratchet → bundled to options objects (`28ef434b`). |
| `2ed86da9`/`159b010e` | stage-D adaptivity | reviewed; green. |
| `e76d6245`/`869478f4`/`fdaef651` | stage-E UX + worldgen | signature bundling (`33a34dcb`); typecheck green at `17993f79`. |
| `c6a8eed0` | VENDETTA reachability fix | **PARTIAL** — lowered the intensity threshold and fixed pick ordering, but V11 probes proved grudges never formed at all (victims left rosters). Completed by `03f457c0` (B-V11-7). |
| `8940a5d0`/`ce132d26` | SURVIVAL intent revival | reviewed — crisis tier correctly placed between VENDETTA and RECOVERY in `pickWeeklyIntent`; does not disturb B-V11-8's tournament ordering (SURVIVAL requires insolvency+losses, where tournament decline is already asserted). 55 focused tests green. |
| `5a2b7e6b`/`c004ed5f` | lastLossFactors → re-planning | reviewed; green. |
| `a42bdb5c`/`ee8c4f27` | decoyAxes + phaseShiftOn (D.2b/D.4) | landed mid-e2e-run (08:05/08:09) — the commits' file writes invalidated that soak via HMR reload; code itself unreviewed at write time, covered by suite. |

## 3. New bugs found & fixed (failing evidence first)

| # | Bug | Failing evidence | Fix |
| --- | --- | --- | --- |
| B-V11-1 | `type-check` floated `router-cli@latest` | Baseline run crashed resolving `picomatch` inside bunx temp dir; unrelated to repo code. | Pinned `@tanstack/router-cli@1.167.29` + `toolPins` guard (`838696e0`, `d1a02f27`). |
| B-V11-2 | `advisor-e2e.ts` stale import | `scriptImports` guard flagged `@/engine/autosim/autosim` (dir has no index); knip unresolved. | `47c1723f` — pointed at real module. |
| B-V11-3 | `simulateFight`/`aiPlanForWarrior` positional drift | FLAT lab `TypeError: plan.style` at `fighterState.ts:228`. | Options-object migration across lab scripts (`3df0c578`, `08d9e581`, `17993f79`). |
| B-V11-4 | Param-budget breach in committed stage-C | `paramBudget` ratchet failed: `escalateCounter` 7 params, `matchupSkepticism` 6 params. | `28ef434b`, `33a34dcb` — `args` objects per repo convention. |
| B-V11-5 | ESLint non-null assertions in stage-B/C | 5 `no-non-null-assertion` errors in `ambition.ts`, `competence.ts`, `budgetWorker.ts`. | Safe defaults + guarded indexing; lint 0/0. |
| B-V11-6 | `questsVisible` dead after #1024 | Post-landing knip/dead-export analysis. | Deleted inside `b9475174`. |
| B-V11-7 | `VENDETTA` intent unreachable | I.2 invariant red; 104-week probe showed `grudgeMap=0` — zero grudges ever formed despite ~50 kills/13wk and 1,192 clashing pairs. Root cause: `aggregateRecentFights` attributes warriors via *live rosters* only, and `28f26ba5` (correctly) removes kill victims from rosters → every Kill fight had a missing participant → `hasKill` never set. (`c6a8eed0`'s intensity-2 threshold was necessary but insufficient — there were no grudges to find.) | `03f457c0` — graveyard `stableId` attribution for victims, incl. player-side kills; I.2 then fired VENDETTA. |
| B-V11-8 | `TOURNAMENT_CAMPAIGN` unreachable | I.2 red again after B-V11-7 fix — stage-C `objectiveServicingIntent` preempts the cascade every week (a viable season objective always exists), and `pickSeasonObjective` never emits TOURNAMENT objectives, so neither path could produce it. | `03f457c0` — `tournamentCampaignApplies` (fixed calendar deadline) moved above servicing; red unit test pinned TREASURY-objective preemption. |
| B-V11-9 | Toasts occlude modal buttons | e2e click-fail diagnostics: `LI.toast` element covered `MEMORIALIZE & CONTINUE` across browsers; sonner's `[data-sonner-toaster]` ships `z-index: 999999999` vs `z-50`/`z-[100]` overlays. | `805dfc13` — toaster pinned to **z-40** (below the z-50 ResolutionReveal floor; an earlier z-90 attempt still leaked over it); layering pinned red→green by `sonnerLayering.test.tsx`. |
| B-V11-10 | Bankruptcy grace shielded all fixtures | `establishedAbsoluteWeek` absent → treated as "founded week 0", exempting every fixture < week 13. | `c6a8eed0` (concurrent session): missing field = predates tracking, not week-0. V11-verified. |

## 4. Gate matrix

| Gate | Result | Notes |
| --- | --- | --- |
| type-check | ✅ | `tsc -b` green incl. router codegen via pinned CLI |
| lint | ✅ | 0 errors, 0 warnings at close |
| Vitest default | ✅ | 780 files / 8,767 pass / 2 skip |
| Bun test | ✅ | 771 files / 8,725 pass / 1 skip |
| Coverage | ✅ | 780 files green |
| Build | ✅ | |
| Electron compile | ✅ | |
| Narrative validate | ✅ | no errors |
| jscpd | 📊 report | 114 clones / 0.75% |
| knip | 📊 report | 0 unresolved, 463 unused, 7 dup exports |
| Slow suite | ⏭️ SKIPPED | per user decision — perf rows classified environmental; invariant rows (VENDETTA/TOURNAMENT) fixed + unit-verified, full re-run deferred to CI |
| Playwright e2e | ⏳ | see below — chromium-only (CI gate); multi-platform soak skipped per user call |

### Slow-suite classification (contended run)

| Test | Symptom | Classification |
| --- | --- | --- |
| `autosimChampionship` (×2) | 428s / 49s timeouts (clean CI: 118s) | environmental |
| `worldLiveness.slow` | 910s timeout (clean CI: 649s+151s) | environmental |
| `pipeline.perf` (×6) | 21s–709s timeouts (clean: 211s whole file) | environmental |
| `killDeathDivergence` | 1,279s timeout @300wk | environmental |
| `rivalStrategyPass.perf` | >500ms on contended run; **492ms clean rerun** | environmental (marginal ceiling — flag) |
| AI liveness `VENDETTA` | intent never observed | **real** → B-V11-7, fixed by `c6a8eed0` |

### e2e classification

| Mode | Symptom | Classification |
| --- | --- | --- |
| Boot timeouts (multiple specs/browsers) | `NEW GAME` never rendered | **environmental** — clean rerun passed all 16 non-soak specs |
| seasonal-tournament modal stall | `LI.toast` covered `MEMORIALIZE & CONTINUE` | **real UI bug** → B-V11-9 (sonner z-index 999999999 over z-[100] modals); fixed + layered test |
| seasonal-tournament prize assertion | rival stable ledger lacked expected 2500g silver purse (webkit, Mobile Chrome) | under investigation — suspected snapshot-window/podium-derivation fragility on irregular brackets (post-`28f26ba5` deaths remove mid-bracket participants) |
| firefox round-1 stall | EXECUTE NEXT BOUT produced no resolved bouts within 60s | under investigation — likely downstream of modal/occlusion stall |
| soak reruns #2/#3 — all browsers at title screen, `progressedLabel` 120s timeouts | error-context snapshots show title screen + WK1 autosave | **INVALIDATED** — vite HMR reloads from mid-run commits (`a42bdb5c`@08:05, `ee8c4f27`@08:09) and an in-flight edit reset every browser to title; not app failures. `vite preview` attempt failed too — spec's `page.evaluate` imports `/src/state/useGameStore.ts` (dev-server module URLs). Resolution: `VITE_NO_HMR=1` env gate in `vite.config.ts` disables reload while keeping dev modules; chromium-only soak run on it. |
| multi-platform soak (firefox/webkit/Mobile Chrome/Mobile Safari) | tournament day-tick 120s polls; ambient CPU ~80% from parallel vitest | **SKIPPED per user decision** — CI gate is chromium-only (F-C1 accepted asymmetry); non-chromium sensitivity logged, not gated. |

## 5. Known exclusions / deferred

- `scripts/` not yet type-checked (still excluded in `tsconfig.e2e.json`):
  legacy lab scripts needing `Bun`/`import.meta.dir` ambient types and
  independent repairs — itemized during the migration attempt; none are
  CI-referenced. DEFERRED.
- `rivalStrategyPass` perf ceiling (~500ms) has little headroom — if a future
  pass sees >600ms clean, investigate before bumping.
- Report-only knip findings (463 unused exports, 7 duplicate exports) —
  not CI gates; logged for V12.

---

## 6. Periphery lane — infra/scripts/CI/docs-drift

_Audited lane: `electron/`, `scripts/`, `.github/workflows`, root configs,
`e2e/`, `archives/`, `public/`, Feature-Matrix docs-drift. Dispositions:
`KEEP` / `RESTRUCTURE` / `DEDUPE` / `WIRE` / `DELETE` / `DOCUMENT`._

## F-E* — electron/

| ID | Finding | Verdict | Disposition | Evidence |
| --- | --- | --- | --- | --- |
| F-E1 | Menu/tray `webContents.send('menu-*')` events have **no renderer path** — 8 dead actions (New Game, Save, Load, Export, Import, About ×2 tray dupes) | **APPROVED-dead** | **WIRE** (add `onMenu` bridge in `preload.js` + `ipcRenderer.on` + renderer handlers + `global.d.ts` surface) **or DELETE** the menu items — Phase 6 | `electron/main.ts:286,293,300,313,325,369,403,410`; `preload.js` exposes invoke-wrappers only, no `on`; `global.d.ts:4-48` confirms no `on*` API; contextIsolation+sandbox means renderer cannot subscribe any other way. |
| F-E2 | `electron/main.js` git-tracked build artifact | **APPROVED** | **DOCUMENT** (committed artifact is load-bearing for `"main"` field; regenerated by `electron:compile` which every forge/dev path runs first) — optional gitignore + always-build | `package.json:10,13`; `git ls-files electron/` |
| F-E3 | `SL_FLAVOR` window-global declared "not yet implemented" | **APPROVED-dead** | **DELETE** decl (zero consumers) or implement — Phase 6 with other dormant features | `src/types/global.d.ts:50-56` — only self-reference in repo |
| F-E4 | `electron/main.ts` 876 LOC monolith | **APPROVED** | **RESTRUCTURE** — Phase 4 target: split `ipcHandlers.ts` / `window.ts` / `menu.ts` / `tray.ts` / `configStore.ts` per leaf→orchestrator order | file is 876 lines (>400 threshold), ~5 cohesive regions |
| — | Security posture | **APPROVED** | KEEP | contextIsolation+sandbox, permission denial, nav guards, `resolveContainedPath`, slotId/boutId regex + size caps on every IPC handler |
| — | `SAVE_STATE_VERSION` hardcoded dup of `core.ts:12` | **APPROVED-guarded** | KEEP + DOCUMENT | `'2.1.0-hardened'` in sync today; `src/test/config/saveVersionSync.test.ts` already ratchets the dup |
| — | `_get*/_set*` exports | test hooks | KEEP + DOCUMENT | `electronMain.test.ts:95-103` sole consumer — enables electron-main testability |

## F-S* — scripts/

| ID | Finding | Verdict | Disposition | Evidence |
| --- | --- | --- | --- | --- |
| F-S1 | `advisor-probe.ts` orphan — superseded by `advisor-e2e.ts` | **APPROVED-orphan** | **DELETE** | zero refs outside `tsconfig.e2e.json` include |
| F-S2 | `liveness-diag.ts`, `roundtrip-check.ts`, `tournament-dominance.ts`, `emergent-report.ts` orphaned diagnostics | **APPROVED-orphan** | **DELETE** | only `tsconfig.*` + stale-ledger refs; `roundtrip-check`/`emergent-report` appear in V5–V10 ledgers as one-shot diagnostics |
| F-S3 | `generate_lore.py` orphan Python one-shot | **APPROVED-orphan** | **DELETE** | zero refs repo-wide |
| F-S4 | `strip-junk-jsdoc.ts`, `_motion-reduce-codemod.mjs`, `_token-migration.mjs` — one-shot codemods, jobs done | **APPROVED-orphan** | **DELETE** (Phase 8 "strip scratch artifacts" mandate) | refs only in old plan docs |
| F-S5 | `bun.d.ts` fully redundant shim | **APPROVED-dead** | **DELETE** | `import.meta.dir` unused since `build-fight.ts` moved to `fileURLToPath` + local `Bun.build` decl (`17993f79`); no other script touches `Bun.*` or `import.meta.dir` |
| — | KEEP — CI/test-referenced | **APPROVED** | KEEP | `daily_oracle` (daily_sim.yml + tests), `daily_bard` (`bard:daily` + tests), `narrative_validate` (package.json + tests), `simulation-harness` (6 slow suites + soak), `soak.mjs`, `nodeArchiveService`, `advisor-e2e` (scriptImports test), `build-fight`+`run-fight`+`stubs/` (headless fight harness), lab cluster (`balance-lab`/`lab-overrides`/`style-probe`/`world-diag`), all 8 scanners (megaplan guard inputs), `parallel-bench.mjs` |
| F-S6 | `tsconfig.e2e.json` excludes 16 scripts | **PARTIAL** | **shrink on deletes; repair residue in Phase 8** | excluded KEEP-scripts (run-fight, build-fight, lab cluster, daily_*, harness) need `Bun`/ambient typing repairs before re-inclusion — mirrors main-ledger §5 DEFERRED |

## F-C* — CI / workflows

| ID | Finding | Verdict | Disposition | Evidence |
| --- | --- | --- | --- | --- |
| — | `ci.yml` 9-job matrix (type-check, build, test, lint, bun-test sharded, slow, coverage, electron, e2e-chromium) | **APPROVED** | KEEP | current actions (checkout@v7/setup-bun@v2); shard loop + `--smol`+30s-timeout rationale documented inline; thresholds enforced |
| F-C1 | e2e runs chromium only; firefox + Mobile Chrome projects exist in `playwright.config.ts` but no CI job | **APPROVED-gap** | **DOCUMENT** — local-only projects is plausibly intentional (CI cost); record as accepted asymmetry | `ci.yml` e2e job vs `playwright.config.ts` projects |
| — | `daily_bard.yml` / `daily_sim.yml` crons | **APPROVED** | KEEP | real automation; `GEMINI_API_KEY` secret-gated with DRY_RUN fallback; report commits tolerant (`|| echo No changes`) |
| — | `Daily_Balance_Report.md` tracked (cron-generated) | **APPROVED** | KEEP | `daily_sim.yml` commits it by design; `Daily_Bard_Report.md` absent (bard never produced one — tolerated) |

## F-K* — configs

All **KEEP** — well-maintained with inline rationale:

- `knip.json` — entry/ignore/dependency suppressions all commented. Minor: `src/scripts/**/*.ts` entry glob is stale (dir doesn't exist) → **F-K1 DOCUMENT/cleanup in Phase 8**.
- `.jscpd.json`, `bunfig.toml` (pathIgnorePatterns each documented), `playwright.config.ts`, `tsconfig.*` chain, `eslint.config.js`, `tailwind.config.ts`, `components.json` — APPROVED.
- `scripts/tsconfig.json` — legacy looser config (noUncheckedIndexedAccess off) → **F-K2** candidate to consolidate into `tsconfig.e2e.json` after F-S deletions, or DOCUMENT.

## F-X* — e2e / archives / public

| ID | Finding | Verdict | Disposition | Evidence |
| --- | --- | --- | --- | --- |
| — | e2e spec surface: golden-path, primary-cta, residual-routes, seasonal-tournament + helpers | **APPROVED** | KEEP | matches CI job; `seasonal-tournament.spec.ts` is 1,073 lines — note for Phase 8 test-file hygiene, not a guard target |
| F-X1 | `archives/` — 80,679 files / **745 MB** local bout archives | **EXEMPT** (untracked, gitignored line 72-73) | KEEP locally; **note to user**: disk footprint is real — consider pruning or relocating outside the repo dir | `du -sh`; generated by electron/opfs archiver during local sims |
| F-X2 | `e2e/screenshots/` — untracked 2-PNG artifacts | **EXEMPT** | gitignore candidate (`test-results/`+`playwright-report/` already ignored; screenshots dir isn't) | `git ls-files` empty |
| — | `public/` — 15 files standard assets | **APPROVED** | KEEP | favicons/icons/audio/robots/_redirects |

## F-D* — docs drift / Feature Matrix (~21 rows)

All rows verified implemented-and-wired this pass:

| Row | Surface | Verdict |
| --- | --- | --- |
| 1 Warrior Builder | `components/WarriorBuilder/` + `WarriorDetail` | wired |
| 3 Scheduling/Challenge-Avoid | `schedulingAssistant.ts` → `SchedulingWidget` | wired |
| 4 Combat Log | BoutViewer + panels | wired |
| 5 Favorite Weapon Charting | `wiring.wired.test.tsx` guard green | wired |
| 6 Style Archives | `world/style-archives.tsx` route | wired |
| 7 Bible Reader + TOC | `help.tsx` + `lib/bibleIndex.ts` | wired |
| 8 Training Planner + Burns Advisor | `stable/planner.tsx`, `TrainingPlanner/`, **`assessBurnRisks` now consumed by `TrainingCardHeader` (UI) + `trainingAdvisor` + `rosterWorkerTraining` (AI)** | wired — old A2 orphan **resolved** |
| 9 Physicals Simulator | `tools/physicals-simulator.tsx` | wired |
| 10 Equipment Optimizer | `stable/equipment.tsx` | wired |
| 11 Strategy Editor | PlanBuilder | wired |
| 15 Kill Analytics | `KillAnalyticsPanel` + `lore/hall-of-fights.tsx` | wired |
| 23 Tournament Prep | `world/tournament-prep.tsx` | wired |
| 25 House Rules/Mods | `mods.tsx` + `houseRules` (live field) | wired |
| 27 Import/Export | `import-export.tsx` | wired |
| 29 Telemetry Panel | `AdminTools/TelemetryPanel` — admin-gated, not `/telemetry` route | **wired-in-admin** — PARTIAL vs spec's public route; record as intentional or G-gap in Phase 6 |
| 31 Theme/A11y | Help accessibility settings | wired |
| 33 Onboarding Quests | QuestsWidget (#1024 curated) | wired |
| 34 Bible Search | `bibleIndex.ts` + help | wired |
| 36 Content Updater | `Mods` + `contentPacks` (live) | wired |
| 38 Save Slots | `saveSlots.ts` + welcome flow | wired |
| 39 Admin Tools | `admin.tsx` | wired |

**No spec-declared-but-unimplemented G-gaps found in the periphery lane.**
The one dormant designed feature remains `ARENA_EVENTS` (main-ledger S3).

## Periphery disposition summary for Phases 3–6

- **Phase 3 DELETE candidates:** `advisor-probe.ts`, `liveness-diag.ts`, `roundtrip-check.ts`, `tournament-dominance.ts`, `emergent-report.ts`, `generate_lore.py`, `strip-junk-jsdoc.ts`, `_motion-reduce-codemod.mjs`, `_token-migration.mjs`, `bun.d.ts` (+ `SL_FLAVOR` decl).
- **Phase 4 RESTRUCTURE candidate:** `electron/main.ts` (876).
- **Phase 5:** no periphery dedupe targets beyond the seeded `chaosHandlers` cluster (S5 — engine lane).
- **Phase 6 WIRE candidates:** menu/tray IPC events (F-E1) — preload `onMenu` bridge + renderer handlers; `stateInvariants` dev-gate (S1); `ARENA_EVENTS` verdict (S3).
