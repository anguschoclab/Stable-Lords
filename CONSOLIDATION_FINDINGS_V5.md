# Consolidation Findings V5

> **Final verdict: APPROVED.** 11 open PRs (#958–#968) evaluated under curated-extraction rules — every PR dispositioned, every accepted change committed to `main` behind a test-first gate. All gates green: type-check 0 errors, lint 0 errors, **7,431/7,431 tests** across 595 files, build + Electron compile + narrative-validate + E2E golden path all pass. Working tree is a clean clone outside iCloud; the original working copy was disqualified on evidence (§5, F-icloud).

---

## 1. Per-PR Disposition Table

| PR # | Category | Verdict | Integration commit | Rationale |
|------|----------|---------|--------------------|-----------|
| #958 | Narrative | EXTRACTED | 535e91a2 | Combat PBP/strikes/kill-text additions folded into the curated union; strip list applied |
| #959 | Perf | EXTRACTED | 32563291 | Typed single-pass `deadWarriors` — cleanest of the two ResolutionReveal PRs; also fixed F-memorial in the same hunk |
| #960 | A11y | EXTRACTED | 38a41c4e | `motion-reduce:animate-none` on all 8 animated fighter stances — clean, complete |
| #961 | Narrative | EXTRACTED | 535e91a2 | Largest content contributor to the union; curation over literal merge |
| #962 | UX | EXTRACTED | 1acbbcc4 | Play/pause tooltip, state-aware (`PLAY BOUT`/`PAUSE PLAYBACK`), matches Radix convention |
| #963 | Feature | PARTIAL/EXTRACTED | d9638746 | 3 traits adopted; `gallows_born` killWindowBonus corrected 2→0.01; 2 arena lore entries rejected as duplicates; loreData churn and artifacts stripped |
| #964 | Narrative | EXTRACTED | 535e91a2 | Largest deduper — consensus removals applied; `.cjs` scripts + bun.lock churn stripped |
| #965 | Bundled | PARTIAL/EXTRACTED | 3e90e829 | ~23-line LegacyMentorsTab hunk kept (typed explicitly); the other 110 cosmetic files DISAPPROVED |
| #966 | Perf | DISAPPROVED/SUPERSEDED | — | `.reduce`+`any` loses type safety vs #959; junk `.jules/bolt.md`; same `@types/glob` artifact |
| #967 | Security/UX | EXTRACTED | e96cb6dc | Raw `error.message` removed from fallback UI; honest retry label added. Severity lower than claimed (details-gated) — still correct |
| #968 | Narrative/Chore | EXTRACTED | 535e91a2 + 5520c02f | JSON → union; vitest spec `^4.1.10`→`^4.1.11` matches resolved version; `@types/glob` + backups stripped |

**Summary**: 0 PRs merged verbatim (every branch carried artifact contamination — `.claude/backups/**`, scratch `.cjs` scripts, `@types/glob`, `bun.lock` churn, `.jules/bolt.md`). 9 extracted in whole or part, #965 partially, #966 superseded. Curated union applied per the computed overlap matrix.

## 2. Artifact Contamination — Mandatory Strip List (applied)

Five PRs bundled a junk `@types/glob` devDep (for a test that used `glob` only to enumerate `*.tsx` — replaced with `fs.readdirSync` walk, commit ea6f8b18). Four carried `.claude/backups/**` snapshots. #964 carried scratch dedupe `.cjs` scripts and `bun.lock` churn. #966 carried `.jules/bolt.md`. **None of these reached `main`.**

## 3. Narrative Curation Report

Union computed from branch JSON (not diff lines), keyed on `text` for `{text,min}` objects:

| File | Additions | Removals | Consensus check |
|------|-----------|----------|-----------------|
| combatPbp.json | +61 | −21 | every removal flagged by ≥2 PRs; zero add/remove conflicts |
| combatStrikes.json | +25 | −6 | consensus |
| combatKillText.json | +18 | −2 | consensus |

- Merge rule per leaf: `(base − union(removals)) ∪ union(additions)`, first-seen order preserved.
- Canonical dedupe (case/punctuation-insensitive) dropped intra-leaf near-dupes; cross-context repeats kept intentionally.
- `narrative_validate.ts` (exact-dup) + `narrativeContent*` suites + `arenaLoreDedup` all green.
- **Method note**: an earlier merge keyed object entries by identity and quadruple-concatenated `{text,min}` leaves — caught by `narrativeContent.test.ts`'s per-path dup check, corrected by keying on `text`.

## 4. Bug Fix Log (findings-driven, beyond PR content)

| Finding | Evidence | Fix | Commit |
|---------|----------|-----|--------|
| F-trait1: kill-window saturation | `calculateKillWindow` clamps to `[0, 0.04]`; traits carried `killWindowBonus` of 1–2 | orphan_vengeance 1→0.01, death_marked 2→0.012, alley_stalker 1→0.008; `gallows_born` landed at 0.01 | d9638746 |
| F-arch1: archive routing | `createStore` imported OPFS singleton directly, bypassing the Electron/web switch | all persistence routed through `archiveService` | 59bc245e |
| F-arch3: deferred-log loss | per-log archive failures swallowed by `console.error` | failed logs re-queued onto `deferredBoutLogs` for next flush | 7893385c |
| F-memorial: blank memorial step | unresolved death names → empty `deadWarriors` → memorial skipped | memorial renders whenever selected; unresolved-name test added | 32563291 |
| F-type1: `lastSimulationReport` type drift | store declared `FightOutcome`; runtime copies `SimulationReport` — masked by `any` selector | store.types + serialization use `GameState['lastSimulationReport']` | 255de87e |
| F-rng1: dead `Date.now()` fallback | `getRandomValues` always fills the array | `as number` cast matching `initialization.ts` | 255de87e |
| F-case: `Docs/`↔`docs/` collision | 67 vs 5 tracked paths, case-insensitive FS collision + clone warnings | consolidated to `docs/`; README + spec comments updated | 0f348eda |
| F-ui1/F-ui2: fabricated UI | static "Confidence: 94.8%", raw `targetStableId`, `LIVE_DATA_STREAM` on archived news, fake telemetry label | all values now map to real state | a63b78a4 |
| Dead code | `templateBuilders.ts` zero consumers; `advanceWeek.test.ts.skip` mocked removed APIs | deleted | 255de87e |
| Config warnings | `__dirname` under native configLoader; nested `vi.unmock` | `import.meta.dirname`; top-level unmock | 255de87e |
| Store test mocks | 4 state tests broke when `createStore` moved to `archiveService` | `OPFSArchiveService` stub added to mocks | 5f4bbdc9 |
| Lint regression | 3 non-null assertions introduced by my own rewrite | for-of iteration | 28885a3a |

## 5. Architectural Findings — Explicit Verdicts

| # | Finding | Verdict | Notes |
|---|---------|---------|-------|
| F-icloud | Repo hosted in iCloud-synced `Documents` | **DISAPPROVED** | `brctl` showed active eviction of `.git`/`node_modules`; caused truncated packs, 0-byte `tsgo`, moving "not a constructor" errors. Work relocated to `~/dev/stable-lords-v5`; do not return the repo to a sync-managed path |
| F-lock | `bun.lock` pins 1,437 `artifactory.ubisoft.org` URLs + stale vs `package.json` | **DISAPPROVED (infra)** | Cannot regenerate off-network; transitive `@electron/node-gyp` resolves `git+ssh` which bun cannot fetch. `package-lock.json` is the working lockfile here. CI's `bun install --frozen-lockfile` is non-portable — recommend regenerating `bun.lock` on-network or moving CI to npm |
| Cycles | Import-cycle audit | **APPROVED as-is** | Every flagged cycle is a type-only back-edge erased at compile (`import type` / inline `import()`); `recruitment→potential` is a one-way runtime edge. No runtime init-order cycle exists; breaking them would churn files for zero measured benefit |
| F-howler | `HowlerGlobal is not defined` in built worker | **PRE-EXISTING — DEFERRED** | Reproduced identically on `pre-v5-consolidation` tag build; `fixHowler()` covers the main-thread path but not the worker bundle. Not a regression; tracked for a future worker-bundle patch |
| Archive design | Electron/web `archiveService` switch | **APPROVED** | Single runtime-selected backend is now enforced everywhere — createStore, saveSlots, deferred flush |
| Narrative lazy-load | `loadCombatNarrative()` | **APPROVED** | Eager non-combat + cached lazy combat JSON; structurally sound |
| Balance layers | `killWindowBonus` → `calculateKillWindow` | **APPROVED after fix** | Two layers remain decoupled; `traitBalance.slow` harness green after rescale |
| Save/serialization | `GameState` ↔ `GameStore` field drift | **FIXED** | `lastSimulationReport` was the one mistyped field; pattern now consistent via `GameState[...]` indexing |
| Micro-optimizations | `.map().filter().sort()` → single-pass loops | **APPROVED selectively** | Adopted only where a hot path is exercised (deadWarriors resolution, mentor ranking); rejected the 110-file cosmetic churn of #965 |

## 6. Spot-Check Results (claims verified against code)

| Claim | Verified | Status |
|-------|----------|--------|
| `killWindowBonus` consumed in combat | `traitMods.ts` accumulates it; `hitExecution.ts` passes it into `calculateKillWindow`; `fighterState.ts` applies `dmgBonus` | **CONFIRMED** |
| `calculateKillWindow` cap | `damageCalc.ts` clamps final to `0..0.04` | **CONFIRMED** |
| `deaths: string[]` in pendingResolutionData | shared.types.ts | **CONFIRMED** |
| All 4 narrative PRs add plain entries to shared pools | diff of each branch | **CONFIRMED** — union mechanically safe |
| #966 `any`/`reduce` | branch diff | **CONFIRMED** — superseded |
| `@types/glob` needed | test used `glob` only for `**/*.tsx` enumeration | **REFUTED** — `fs.readdirSync` walk suffices |
| Docs↔docs collision | `git ls-files` counts 67/5 | **CONFIRMED** — fixed |

## 7. Metrics Summary

| Metric | Baseline | Final |
|--------|----------|-------|
| Test files | 580 | **595** |
| Tests | 7,261 | **7,431** (all pass) |
| type-check errors | 0 | **0** |
| lint errors | 0 | **0** (518 warnings, was 519) |
| Build | OK, 146 precache | **OK, 148 precache** |
| electron:compile | OK | **OK** |
| narrative-validate | pass | **pass** |
| E2E golden path | n/a | **PASS 30.4s** |
| Commits on main | — | **17** |

Known non-blocking noise (all pre-existing, verified): `HowlerGlobal` worker ReferenceError, jsdom `HTMLMediaElement` warnings, `passives.StrikingAttack` narrative path warning, `@tanstack/router-cli` circular-dependency warning, 518 lint warnings (JSDoc-description + targeted `any`s, unchanged in kind).

## 8. Test-First Compliance Audit

Gate commit `80b2265c` authored 18 intentionally-red tests + characterization suites **before** any implementation commit. Mapping (test commit → impl commit):

| Item | Test | Impl |
|------|------|------|
| ResolutionReveal deadWarriors + memorial | 80b2265c | 32563291 |
| LegacyMentorsTab ranking | 80b2265c | 3e90e829 |
| Stance motion-reduce | 80b2265c | 38a41c4e |
| BoutControls tooltip | 80b2265c | 1acbbcc4 |
| ErrorBoundary leakage | 80b2265c | e96cb6dc |
| AgentReasoningWidget honesty | 80b2265c | a63b78a4 |
| Archive routing | 80b2265c | 59bc245e |
| Deferred-log re-queue | 80b2265c (+ red test landed in 7893385c before impl) | 7893385c |
| Kill-window scale invariant | 80b2265c | d9638746 |

The red tests caught real scope growth: `killWindowScale.test.ts` revealed **three** traits saturated the cap, not the one originally flagged.

## 9. Deferred Items

- `bun.lock` regeneration — blocked on network (artifactory + git+ssh); recommendation in §5/F-lock.
- `fixHowler` worker-bundle coverage — pre-existing, needs a worker-aware patch or howler-free worker import graph.
- 518 lint warnings — mostly JSDoc-description and a handful of hook-deps; unchanged from baseline, not in consolidation scope.
- iCloud-hosted original working copy — abandoned in place; contains another session's untracked scratch scripts under `scripts/`.

## 10. Remote Disposition — EXECUTED

- `main` pushed: `ea6f8b18..a2131edd` (19 commits, rebased onto the remote's `ea6f8b18`; ledger conflict resolved in favor of the complete version).
- Restore point tag `pre-v5-consolidation` pushed.
- Verdict comment posted on all 11 PRs citing this document and their integration commit(s).
- All 11 PRs closed (0 open remaining).
- All 11 evaluated remote branches deleted after disposition (PR diffs remain preserved on GitHub).

## 11. Final Verdict

**APPROVED.** The consolidation extracted everything of value from 11 contaminated branches without importing any of their artifacts; fixed nine findings discovered during review (kill-window saturation, archive data-loss, type drift, blank memorial, fabricated UI, case collision, dead code, dead fallback, config warnings); preserved the test-first gate end-to-end; and leaves the tree strictly greener than the already-green baseline (+170 tests, −1 warning, +2 precached narrative payloads). The two infra problems found are environmental (iCloud eviction, artifactory-pinned lockfile), documented with evidence and recommendations rather than papered over.
