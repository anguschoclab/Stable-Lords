# Plan: perf-audit findings → improvement work items

> **Status (landed):** cpu-prof measurement done; P1 shipped (style-bucket bound
> pruning + `bookingLockedChampionIds`); intelDossier `stableOf` memo shipped;
> entityIndex lazy corpus + per-query memo shipped; P6 doc fix shipped.
> A/B soak 40wk same seed: 657.6→597.3 ms/wk, **world state byte-identical**
> (full-summary diff). Deferred with evidence: P2 (`findBestOpponent` already
> windowed — needs its own decomposition), P3 (`useWorldState` — needs React
> Profiler to rank consumers; cannot run headless), P4 (clone cost is the
> boundary `structuredClone` — inherent to non-`mutableInput` path).

Output of running the `perf-audit` skill over the codebase. Mechanical surface is already clean (93+5 scanner hits all allowlisted; zero `.find(id===)` in `src/engine`; no spread-accumulators; 1 small-N `.filter().map()`). Findings come from measurement + targeted reading. Ordered by expected value; **measure-first applies to every item** — the skill's own rule: no fix without a baseline.

## Confirmed signals

- `scripts/out/baseline.json` (fresh 5-wk profile, this machine): `rivalStrategy` 328 ms/wk (~80% of pass time), `promoter` 82 ms/wk (~19%), all others <6 ms/wk. Consistent with `docs/engineering/pipeline-baseline.md` (rivalStrategy ~56%, promoter ~9% @ 40 wk).
- `structuredClone`/boundary discipline already enforced (`mutableInput`, `shardInputSize` tests, `structuredCloneCost` <50 ms gate).
- `TRUNCATION_CAPS` (`src/engine/storage/truncation.ts`): `arenaHistory` capped at **500**, `matchHistory`/`killEvents`/`ledger`/`seasonalGrowth`/`restStates`/`insightTokens` 500, `graveyard`/`retired` 200, `newsletter` 100 — "unbounded" claims must be re-scoped to these caps.

## Improvement items

### P1 — `bestMatchupModifier`: O(bidders × world-warriors) weekly scan (tier 1)

- **Evidence:** `src/engine/ai/workers/competitionWorker/boutBidding/generation.ts:50-92` — per bookable bidder, full `ctx.nonVendettaOpponents` scan (every active rival warrior world-wide, ~450-1,200 at the 90-160 band) → ~0.5-1.2M lite `scorePairwiseMatchup` calls/week. `pipeline-baseline.md` §B3 names this the known residual hotspot.
- **Measure first:** `bun --cpu-prof` on `soak.mjs` to confirm `scorePairwiseMatchup`/`bestMatchupModifier` self-time share vs `RivalStrategyPass/{churn,offers,roster,finish}` modules.
- **Fix levers (pick by profile):** (a) feasibility pre-filter — build a per-week coarse bucket index on `nonVendettaOpponents` (fame band × style) once per stable instead of a flat scan — most pairs can never produce a winning bid; (b) early-exit when score hits the clamp ceiling (+5 post-clamp is unreachable past a bound); (c) per-week WeakMap memo keyed on the opponent-pool identity for repeated (warrior, pool) scans across intents.
- **Determinism:** pure scoring, no RNG — safe, but assert byte-identical anyway (max-pick must reproduce tie order exactly → keep the first-max-wins semantics of `Math.max` iteration order).

### P2 — `promoter` pass: unprofiled #2 (tier 1)

- **Evidence:** ~9-19% of week time (`baseline.json`, `pipeline-baseline.md`); `PromoterPass.ts`/`offerMatchmaking.ts` do per-offer sorting + candidate scans (`sortedBy` hits at offerMatchmaking.ts:168-205).
- **Measure first:** same `bun --cpu-prof` run — decompose promoter internals before choosing a lever (likely: per-week venue/candidate index or top-k pruning replacing full sorts).

### P3 — `useWorldState` broad subscription (tier 4, UI re-render fan-out)

- **Evidence:** `src/state/selectors.ts:7` — `useGameStore(reconstructGameState)` returns a single global-memo object; ANY of ~70 tracked fields changing re-renders all ~20+ subscribers (widgets, pages, hooks: `SchedulingWidget`, `NextBoutWidget`, `useBookingOffice`, `useTrainingAssignments`, `useWeekExecution`, `HeadToHead`, `Gazette`, `StableLedger`, `useRivalryAlerts`, `useStableAdvisor`, `useCoachTip`, `useBloodfeudMarks`, `useWorldOverview`, `useArenaHubData`, `TournamentSchedule`, `useFtueBout`…).
- **Fix:** migrate the highest-render-cost consumers to narrow `useShallow` selectors (precedents already in `selectors.ts`: `useReputationState`, `useWarriorNameState`, `useArenaPreferences`, `useBookmarks`). Start with always-mounted widgets.
- **Measure first:** React Profiler render counts during (a) week advance, (b) bout animation ticks — target the subscribers that re-render most.

### P4 — Decompose the ~48% non-pass harness overhead (measurement item)

- **Evidence:** 5-wk `baseline.json` totals 815 ms/wk vs ~422 ms/wk inside passes. Doc warns harness ms/wk ≠ `advanceWeek` (archive drain, pulse logging, tracker) — don't assume; decompose it.
- **Check:** `WEEK_CACHE_REBUILDS` telemetry — `CACHE_TOUCHING_KEYS` is deliberately conservative (`weekPipeline/caches.ts:20`); if rebuilds fire multiple times/week over ~1,000 warriors, narrowing the key set or the rebuild trigger is a real lever. Plus `structuredCloneCost` re-check at populated-state size (gate only pins fresh-state <50 ms).

### P5 — `GlobalSearch` corpus rescan per store change (tier 4, minor)

- **Evidence:** `src/components/layout/GlobalSearch.tsx:251` — `useGameStore(useShallow(s => searchEntities(s, q, 12)))` reruns the O(corpus) score+sort on EVERY store change while search is open (useShallow only dedupes the result).
- **Fix:** WeakMap memo on (state, q) inside `searchEntities`, or compute inside `useMemo` on [state, query] — trivial, low priority since the modal is open briefly.

### P6 — Skill-doc correction (housekeeping)

- `perf-audit` SKILL.md says `arenaHistory` is "hundreds→thousands, never shrinks" — wrong: `TRUNCATION_CAPS.arenaHistory = 500`. Update the cardinality rubric line to cite the caps (arenaHistory/matchHistory/killEvents/ledger 500; graveyard/retired 200; newsletter 100) so future audits triage against the true bounds.

### Checked & dismissed

- `WeekFinalizationService.ts:44` `[...window, entry]` — bounded mood window (~≤50).
- `tournamentWorker.ts:127` `.filter().map()` — per-rival roster, small-N.
- `ProgressionPass.ts:142` `structuredClone(state.progression)` — small object, weekly.
- `useQuadrantDots` — `useMemo`-gated; ~160× `computeRivalReputation` only when reputation inputs change — acceptable; revisit only if quadrant page profiles hot.
- `conversion.ts` pairwise path — already uses `rivalryMap`/`h2hCache` (B3-fixed).
- `weekSkip.ts` tournaments filter — small-N.

## Execution order

1. **Measurement pass (do nothing before this):** `bun --cpu-prof` on `soak.mjs --weeks 40` → decompose rivalStrategy internals + non-pass overhead → confirm P1/P2 lever choices and P4 scope. React Profiler pass for P3 subscriber ranking.
2. P1 (engine, biggest) → P4 (if rebuild/clone telemetry shows it) → P2 → P3 (UI, parallel-safe) → P5/P6 (quick wins).
3. **Gates per item:** `bun run lint && bun run test`; `bun run test:slow` for any engine item (byte-identical determinism non-negotiable); record before/after in the same harness; update `pipeline-baseline.md` on landed wins; new module-level caches register in `moduleCacheRegistry` REGISTRY; new per-week state caches wire through `stripNonSerializable` + `buildWeekCaches` + `CACHE_TOUCHING_KEYS`.
