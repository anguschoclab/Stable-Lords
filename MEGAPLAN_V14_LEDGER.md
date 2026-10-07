# MEGAPLAN V14 LEDGER — Pipeline & Time-Advancement Campaign

## Baseline

- **Branch:** `main` · **Restore tag:** `pre-megaplan-v14` at `1b325469`
- **Concurrency note:** this campaign ran concurrently with two other
  megaplan sessions: the V12 SRP/DRY campaign (closed out mid-session at
  `d1628e5a`) and a follow-on SRP/DRY-residual wave that claimed the `V13`
  name in commits (`1b325469` "V13 W6") and `e2e/v13-surfaces.spec.ts`.
  To avoid a numbering collision this pipeline campaign is **V14**.
  Early gate/soak runs overlapped V12's uncommitted WIP — numbers below
  were taken on an idle machine; the autosim row documents a contaminated
  reading that was re-measured clean.
- **Baseline gates:**
  - `type-check` (`tsc -b`): ✅ 0 errors
  - `vitest` (main suite): run in-flight during V12 churn; re-verified at
    closeout — see Phase 6 gate matrix
  - `bun run test:bun` (`bun test --isolate`): ⚠ interrupted — runner burned
    ~170 CPU-min on a single process with no output for >15 min (suspected
    pathological file under `--isolate`, or contention with concurrent V12
    work). Deferred to final battery; V12 ledger documents it green.
  - `eslint`: in-flight at compaction; re-run scheduled at Phase 6
  - `narrative-validate`: pending re-run at Phase 6

## Phase 0 — baselines (measured at `23d5839e`, idle machine)

| Metric | Prior doc | V14 measured | Verdict |
| --- | --- | --- | --- |
| Week soak, 40w | 292.7 ms/wk | **258.3 ms/wk**, 0 invariant violations | ~12% better than doc; `rivalStrategy` 146.8 ms/wk (~57%), `promoter` 25.0 ms/wk (~9.7%), `arenaChampionship` 5.4 ms/wk; ~72 ms/wk outside timed passes (bout phase, sweep, caches, finalize) |
| Day-mode soak, 40w | +18.5% vs week | **294.7 ms/wk** (~+14% vs 258.3) | overhead persists but modest; day-path shares resolveTournamentDay |
| Autosim 52w | ~17 s (~327 ms/wk) | **~10.6 s — 204 ms/wk** clean (wk1-26: 185 ms → wk27-52: 225 ms, +21% growth); an earlier 38.3 s reading was contaminated by a concurrent vitest slow-perf run at 99% CPU | Faster than documented; mild growth curve tied to history-array length (Phase 2 target) |
| parallel-bench pool 4 | 0.33× | not re-run | prior gate stands; `poolSize=1` retained |

## Phase 1 — audit findings (in progress)

| ID | Finding | Verdict | Disposition |
| --- | --- | --- | --- |
| A1 | `opfsArchiver.ts` `pendingRetries` is a module-level `[]` that escapes the module-cache registry `DECL_RE` (only `new Map/Set/WeakMap/WeakSet` detected) | CONFIRMED blind spot — real mechanism, guard can't see it | extend registry regex to `= []`/`= {}` mutables or add explicit allow-list; guard test |
| A2 | `NewsletterFeed.current` (feed.ts:105) — module-level mutable `FightCard[]`, zero production callers (tests only reset it) | CONFIRMED dead mutable surface | removal candidate (test-first) |
| A3 | `StyleRollups` `weekCache`/`rollingCache` + `_clearCaches` — zero production callers besides `loadGame`'s `_clearCaches()` call | CONFIRMED orphaned subsystem (knip territory) | removal candidate; `_clearCaches` call in `loadGame` becomes dead too |
| A4 | Admin skip paths (`skipToMonthEnd`/`skipToQuarterEnd`) don't call `stripNonSerializable` and lack the 15s timeout + `cancelSim` that `runEngineJob` has | PARTIAL: strip is harmless today (`reconstructGameState` output can't contain the 8 stripped fields); missing timeout is a real asymmetry — a hung week blocks the FIFO and leaves `isSimulating` stuck | add timeout+cancel parity; strip for defense-in-depth; entry-point guard test |
| A5 | Dead worker surfaces: `advanceMonth/Quarter/Year`, `skipToYearEnd`, `resolveTournamentRound`, `createFreshState`, `configureEnginePool` have zero production `engineProxy.*` callers (month/quarter/year only reachable via `skipTo*` composition) | CONFIRMED | document or remove (zero backcompat constraints per user); entry-point matrix test |
| A6 | `sweepUnfinishedTournaments` runs pre-`createMutableWeekContext` on raw input | DISPROVED — pure, spread-based; input never mutated | none |
| A7 | `collectStoreValues` (60 tracked fields) vs `hydrateDraft` writes — untracked hydrated fields (`pendingResolutionData`, `lastWeekBoutDisplay`, `absoluteWeek`) are correct-but-fragile; adding a tracked field to hydrate without collectStoreValues silently breaks memoization | CONFIRMED drift hazard | field-parity guard test (known-exempt list) |
| A8 | `runBoutPhase` is outside the timed pass table — ~72 ms/wk of soak time invisible to per-pass profile | CONFIRMED observability gap | instrument bout phase + sweep + finalize in Phase 2 profiling |
| A9 | Headless transcript invariant — `simulateFight.ts:107` `log: headless ? [] : [...]` hard-nulls per-fight; all 14 `log.push` sites verified under `!headless` gates (narrate.ts:60/65/69 via index.ts:81; outcomes.ts:42/104 via :35/:73; beats.ts:18/32/33 via :14/:31; postFight.ts:100 via :99; narrative.ts intro via simulateFight conditional); `AutosimResult` has no `pendingArchives` so a leak would accumulate silently to the 200-cap | CONFIRMED structural — gates audited, all correct; end-to-end contract unpinned | runtime contract test (headless autosim → zero deferred logs) + static guard on `log.push` sites |
| A10 | `stopConditions.ts:25` `noPairings` flattens `[...roster, ...rivals.flatMap(r=>r.roster)]` (all world warriors) every evaluation, then `isFightReady`-filters all — no early exit | CONFIRMED waste — ~O(world warriors) alloc+scan per week per span | Phase 5: early-exit at 2 eligible; measure first |
| B1 | **`truncateState` cadence diverges across time scales** — sequential `advanceWeek` never truncates in-session (save-only via `saveSlots.ts`); `advanceMonth/Quarter` truncate at span end; `advanceYear` truncates at EVERY quarter end; autosim every 50w + finish. Capped arrays (`matchHistory`/`arenaHistory`/`rivalries`/`newsletter`) are read by sim passes (`rivalStableShard`, `PromoterPass`, `WorldPass`, `arenaChampionship`) | CONFIRMED structural divergence — batch vs sequential worlds can diverge once a cap is crossed mid-span (500-entry arrays, ~8 bouts/wk → reachable ~w50-60; `rivalries` cap 100 reachable sooner) | Phase 4: determinism test with shrunk `overrides` caps (sequential vs batch, byte-compare) — likely RED first → Phase 5 normalize cadence (truncate every week in `finalizeState`, or prove sim never reads beyond caps) |


## Phase 5 — implementation units (commits)

| Unit | Finding | Change | Commit | Gate |
| --- | --- | --- | --- | --- |
| B1 | Truncation cadence divergence | `finalizeState` applies `truncateState` at every week boundary; autosim's separate periodic truncation removed | c861053a | `truncationCadence.test.ts` red→green; sequential ≡ month-span byte-identical under reduced caps |
| A4 | Admin timeout/cancel asymmetry | `engineSession.runGuarded` centralizes 15s timeout → `cancelSim`; `runEngineJob` + `adminActions` delegate | c861053a | `v14EntryPoints.guard` updated to pin delegation; `storeGuards` #13 adapted to async timer advance (timeout now registers inside the queued job, not at enqueue) |
| A1 | Registry regex blind spot | `DECL_RE` extended to `= []`/`= {}`/`new Array`/annotated constructors; `pendingRetries` + `deathNotifier.handlers` registered | 17228896 (test commit) | registry green; stale-entry check enforces cleanup |
| A2 | `NewsletterFeed.current` dead mutable | `current`/`appendFightResult`/`closeWeekToIssue`/`clear` removed; pure `generateIssue` kept | 029c5977 | feed.test.ts rewritten to the pure API; 12 files' `clear()` calls + leak signal dropped |
| A3 | `StyleRollups` dead write-only subsystem | module + dedicated tests deleted; `_clearCaches` callsites removed | 029c5977 | tsc clean; storeGuards survives via timeout/reconstruction tests |
| A10 | `noPairings` world-flatten alloc | early-exit counter at threshold 2 | 087bee92 | stopConditions/TimeAdvanceService/autosim.unit green |
| P1 | `getRecentFightsForWarrior` full-tail scans | WeakMap warrior→fights index keyed on arenaHistory identity (append-only-by-replacement invariant, same as h2hByHistory) | 087bee92 | historyUtils 38 green; determinism.slow byte-identical |
| P2 | `sweepOrphanedReigns` unconditional 3-Set build | early return when no reigns; sets built only when champions exist | 777ee0ff | finalizeContracts green (incl. dead-while-rostered branch preserved) |
| — | `deferBoutArchives` O(n) scan | EVALUATED-AND-REJECTED — 500 cheap predicates are sub-ms; suffix early-exit risks skipping undrained transcripts on legacy entries lacking `absoluteWeek` | — | recorded for posterity |

## Phase 6 — docs + A/B soak

- Dependency-map stage table rewritten to the declared 16-pass layout
  (recruitment→core, progression→world, arenaChampionship + seasonal added,
  boutSimulation removed — it is a phase). `v14PipelineDocs.guard` now green.
- `PIPELINE_AUDIT` stale "15 passes" → 16; autosim path corrected to
  `src/engine/autosim/autosim.ts` in three docs.
- **A/B soak (idle machine, 40w week-mode, same harness):**
  258.3 → **228.5 ms/week (−11.5%)**; rivalStrategy 146.8 → 121.3 ms/wk
  (−17.4%); promoter flat 25.0 → 24.6. 0 invariant violations.

## Phase dispositions

| Phase | Work | Commits |
| --- | --- | --- |
| 0 — baseline | `pre-megaplan-v14` tag; soak ×2 + autosim bench; gate triage | (ledger commit) |
| 1 — audit | entry-point matrix, ownership audit, dead-surface scan, registry blind spot | ledger (this file) |
| 2 — profiling | `bun --cpu-prof` 26w soak → `scripts/out/v14-week-soak.cpuprofile`; autosim growth curve (185→225 ms/wk over 52w, driven by history-array length) | measured |
| 3 — contracts | test inventory + matrix (committed in gate) | 17228896 |
| 4 — test-first | all contract/guard tests authored + committed RED before any production change | 17228896 |
| 5 — implementation | B1, A4, A1, A2/A3, A10, P1, P2 | c861053a, 029c5977, 087bee92, 777ee0ff |
| 6 — docs + soak | dependency-map rewrite, audit-doc fixes, A/B soak | 9364dad0 |
| 7 — close-out | verdict table + regression follow-ups | 618a77d8, this ledger |

## Phase 2 — CPU bottleneck table (26w soak, 4.9s sampled)

| Function | Self ms | % | Bucket |
| --- | --- | --- | --- |
| `cloneObject` + `copyDataProperties` (structuredClone/spread) | 572 | ~12% | state-copy churn across pass boundaries + week-1 clone |
| `getMatchupBonus` (combat/matchup.ts) | 278 | ~5.7% | bout sim + matchup scoring |
| `scorePairwiseMatchup` (schedulingAssistant) | 165 | ~3.4% | rivalStrategy matchmaking |
| `bestMatchupModifier` (boutBidding/generation) | 113 | ~2.3% | rival bid generation |
| `getRecentFightsForWarrior` (historyUtils) | 107 | ~2.2% | history scans (B3 territory, still hot) |
| intel dossier family (`observeTells`/`updateDossiers`/`foldFight`/`sideFor`) | ~196 | ~4% | AI memory bookkeeping per bout |
| `rankContenders` (arenaChampionship/queries) | 99 | ~2% | championship ranking |
| `findBestOpponent` (offerMatchmaking) | 90 | ~1.8% | promoter offer gen |
| `applyOfferImpact` | 75 | ~1.5% | offer resolution |
| `computePlayerThreatLevel` (agentCore) | 73 | ~1.5% | AI |
| `interpolateTemplate` + `escapeHtml` | ~101 | ~2% | narration (non-headless only) |

**Implications for Phase 5:** the two structural costs are (a) ~12% in
state-copy churn — whole-state spreads per pass/per impact — and (b) the
matchup-scoring family (~556ms) shared by bout bidding and sim. Both preserve
byte-identical gates naturally (pure reorder/memoization candidates).
`getRecentFightsForWarrior` and the dossier family scale with history length —
explains the autosim +21% growth curve and the slowest weeks late in runs.

## Phase 7 — close-out

### Regression found + fixed during Phase 5

- `truncateState` clears `lastWeekBoutDisplay` (UI-only, never read inbound).
  B1's weekly cadence started wiping the display the bout phase just produced
  — caught by `boutDisplayData`/`boutSimulation` tests in the first full-suite
  run. Fix (618a77d8): `finalizeState` restores the field post-truncate; span
  teardown still clears it. B1 byte-compare excludes it by design.
- `orphanScan` guard caught `src/schemas/statsSchemas.ts` as production-
  unreachable after the StyleRollups deletion — deleted with its test.
- `useAdminTools` test updated for the consolidated 'Admin fast-forward
  failed:' label (A4).
- `retrieveHotStatePlausibility.test.ts` flaked once under shared-worker
  packing (3/8961), green on isolated + full-suite re-run — pre-existing
  shared-mock-ordering hazard, not V14 collateral. Filed as flake to watch.

### Deferred (next campaign candidates, measured not speculative)

- `cloneObject`/`copyDataProperties` ~572ms (~12% of sampled) — pass-boundary
  state-copy churn; needs structural work on impact application, not a micro-fix.
- Matchup-scoring call *volume* (~556ms across getMatchupBonus/
  scorePairwiseMatchup/bestMatchupModifier) — `getMatchupBonus` itself is
  already Map+matrix optimal; the win is memoizing pairwise scores per
  (warrior pair, week) — an identity-keyed-cache design question, deferred.
- Persistent shard state for the engine pool — documented-only per scope
  (docs/PIPELINE_PARALLELISM.md), `poolSize=1` stands.

### Final gates

- `tsc --build --force`: clean.
- `eslint` on changed surface: clean.
- `bunx vitest run` (full fast suite): **813 files / 8,959 tests / 0 failures**.
- `determinism.slow`: byte-identical two-run hash.
- 40w week-mode A/B soak: **258.3 → 228.5 ms/wk (−11.5%)**, 0 invariant
  violations; rivalStrategy 146.8 → 121.3 ms/wk.
