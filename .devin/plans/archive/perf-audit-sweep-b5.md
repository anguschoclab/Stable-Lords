# Perf audit sweep — once-per-tick hoists in rivalStrategy + measured micro-opts (validated)

Validated perf-audit plan: every finding re-checked against source (narrowed-state field preservation, predicate equivalence, Warrior.stableId optionality, registry caching); Phase 0 mandates characterization/equivalence tests written and green BEFORE any refactor lands; then shared once-per-tick structures + pure-function micro-opts, verified byte-identical by A/B soak.

## Status — **COMPLETE**

- ✅ **Phase 0** — committed `f6cd62c7a` (T1–T16 characterization specs, green on unmodified source)
- ✅ **Tranche 1** — committed `5c9d40b03` (perception fields + SharedBidCtx; all specs + megaplan guards green)
- ✅ **Tranche 2** — committed `3f1d6af5a` (escapeHtml/nameGen/archetype/arenaFit/hasInjuryRisk micro-opts; specs green)
- ✅ **Tranche 3** — committed `f321175db` (contender-index single pass + findBestOpponent two-region early-exit; guards green)
- ✅ **Tranche 4** — 4A committed `5bcba81cb` (partial boutOffers impacts + dictMerge in-place accumulate); 4B committed `9c85a1b87` (8 narrow consumers → scoped `useShallow` selectors); 4C/4D/4E documented `5d2a46319`
- ✅ **Verification** — A/B soak same-seed `--weeks 40`: pre-B5 546.8 → post-B5 **460.3 ms/wk (-15.8%)**, final world-state summary **byte-identical every field**; `rivalStrategy` 282.5→213.7 ms, `promoter` 45.7→37.2 ms. Full fast suite green (runnerGroups regen'd for new specs). test:slow failures all proven **pre-existing at f6cd62c7a**: balance 80/20 (2 matchups, identical), worldLiveness coherence 0.11604781550830424 (bit-identical), advanceWeek 545ms (load flake — passed standalone), jscpd `spawnSync bun ENOENT` + orphanScan hook timeout (env). Parallelism gate re-confirmed **0.32× FAIL** — pool stays off.
- Notes: `duplication.guard` pre-existing failure (720bd04ce pair unregistered on main) fixed by registration → baseline 42. `planWorldBouts`/`bookableRoster`/`crownWorker` consume shared id-sets; `convertBidsToOffers` computes `lockedIds` once per call (kept 5-param signature — 14 test callers); `IntentContext.playerThreatLevel` threads perception into `vendettaApplies` too.

## Validation record (this review)

Every plan claim was re-verified against the codebase. Verdicts inline per item; corrections applied:

- ✅ `narrowRivalShardState` preserves `roster/rivals/realmRankings/arenaHistory/boutOffers/arenaChampions/player` **by identity** (`shardContract.ts:26-52`, pinned by `shardInputSize.test.ts:57-87`) — every computation proposed for the perception snapshot produces identical values on full state as on narrowed state. Perception-hoisting is sound.
- ✅ `buildWeekOffers` runs post-shard on full state (`finish.ts:42`) and receives `currentRivals` (post-update rivals) — the shared opponent pool must bucket **`currentRivals`, not `state.rivals`** (they differ).
- ✅ `Warrior.stableId` is optional (`warrior.types` — `stableId?: StableId`; generation.ts:56 uses `?? ctx.rivalId` fallback) — **correction:** shared style buckets must store `{warrior, rivalId}` pairs; own-stable skip = `entry.rivalId === rival.id`, not `w.stableId`.
- ✅ Bout-offer id-set predicates are **three distinct sets**, not one: `bookableRoster` = `Signed && boutOfferAbsoluteWeek > now`; `signedTitleBoutIds` = `titleArenaId && Signed && week >= now`; `collectBookedWarriorIds` = `Signed && week === targetWeek`. One `Object.values(state.boutOffers)` pass emits all three. Scan source is `state.boutOffers` (pre-merge — the world-bout offers are `Proposed` so semantics coincide, but fidelity demands the original map).
- ✅ `isChampionBookingLocked(state, id)` ≡ membership in `bookingLockedChampionIds(state)` — same predicate (`champion && status !== 'dormant'`) — safe swap at `conversion.ts:141,152,167,361` + `worldMatchmaking.ts:37`.
- ✅ `computePlayerThreatLevel` is pure `f(state)` over `roster`+`realmRankings` (agentCore.ts:215-243); called once/rival at agentCore.ts:92; sole production caller chain = `processAIStable`→`createAgentContext`. Hoist valid.
- ✅ `estimateThreat(stableId, fame, week)` is observer-independent → shared `threatByStableId` identical; `dossiers` keyed by stable `id` (player key = `state.player.id`).
- ✅ `metaLagWeeks` ∈ {0,1,2} → lagged metas for {1,2} suffice (+ inline fallback for other values).
- ✅ Arena registry already memoizes tag/tier results but returns `[...results]` copies; the real arenaFit cost is per-call `new Set(EXCLUDED…)`, `new Set(getArenasByTag('indoor').map(id))`, and per-call `Object.entries(recs)` — item reframed accordingly.
- ✅ `PERSONALITY_MATCH_SCORE` bounded: Greedy 10, Honorable 15, Corporate 5, Sadistic ≤45, Flashy ≤40, default 0 → pMax = 45 (findBestOpponent bound valid for non-Greedy branch only).
- ✅ `hasInjuryOfSeverity` = one `.some` per severity → single-pass `RISK_SEVERITIES.has` is identical.
- ✅ `seedPool` passed only by `rivalStableFactory.ts:291` → culture-pool cache hits ~all callers; pool order = dedupe insertion order → identical `rng.pick` index stream → byte-identical names.
- ⚠️ **Correction:** `applyOfferImpact` (268 ms) is `Object.assign` — call-frequency cost, nothing to optimize. Removed.
- ⚠️ **Downgrade:** `titleOpponents` generators are lazy and both consumers early-exit — real win is only the `selfIds` rebuild + one partial scan (~minor).
- ⚠️ **Correction:** `Attributes` sum must use `for…in` + `typeof v === 'number'` (identical to `Object.values().reduce` incl. any extra runtime props), not hardcoded keys.
- ✅ `narrowed.promoters = {}` — no plan item reads `state.promoters` inside shards; unaffected.

## Evidence (unchanged — `bun --cpu-prof`, 40-wk soak, seed 20260919, 26.4 s)

| self-time | site                                                                                                                                  | problem                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| ~9.4%     | `cloneObject`+`copyDataProperties`                                                                                                    | boundary structuredClone — inherent (P4 prior plan, out of scope)                  |
| ~5.3%     | `buildMatchupCtx`+`scorePairwise`+`bestMatchupModifier`+`collectCandidates`+`bookableRoster`+`isChampionBookingLocked`+`findOpponent` | per-rival/per-bid rebuilds of identical world-view structures                      |
| ~3.5%     | `updateDossiers`+`foldFight`+`observeTells`+`stableOf`+`resolveWarriorOwner`+`pruneDossiers`                                          | per-rival O(rivals) observe loop; `hashStr` per (stable×rival); roster-scan misses |
| 1.6%      | `computePlayerThreatLevel`                                                                                                            | pure `f(state)` called ~90×/wk                                                     |
| ~2.2%     | `interpolateTemplate`+`escapeHtml`+`getFromArchive`                                                                                   | 5 chained replaces per token                                                       |
| ~1.5%     | `rankContenders`+`buildContenderIndex`                                                                                                | per-arena full `collectAllWarriors` re-scan                                        |
| ~1.3%     | `generateWarriorName`                                                                                                                 | rebuilds+dedupes+sanitizes culture seed pool per call                              |
| ~1.1%     | `titleOpponents`+`signedTitleBoutIds`                                                                                                 | `Object.values(boutOffers)` scans per rival                                        |
| ~1.0%     | `classifyArchetype`/`barRatio`/`scoreCandidate`                                                                                       | `Object.entries`+sort per candidate                                                |
| ~1.0%     | `arenaFit` helpers                                                                                                                    | per-call `new Set`/`Object.entries` on static data                                 |
| ~0.6%     | `hasInjuryRisk`                                                                                                                       | 3× `.some` severity scans                                                          |
| 2.0%      | `findBestOpponent`                                                                                                                    | window scan + personality score per candidate — stretch                            |

Baseline 603.6 ms/wk; `rivalStrategy` 312 ms (~52%), `promoter` 49 ms (~8%).

## PHASE 0 — Test-first (mandatory, lands before any source change)

All specs below are **characterization/equivalence tests written against CURRENT code**: they pin exact present behavior, must pass on unmodified source, and stay green through the refactor. Files under `src/test/<domain>/` mirroring the subject (`testQualityAudit` filing rule); reuse `@/test/_fixtures/factories` (`makeGameState`, `makeRival`, `makeWarrior`). Fast tier; `*.slow` naming not needed (all <2 s).

| #   | Spec file (new or extend)                                                                 | Pins (must hold pre- AND post-change)                                                                                                                                                                                                                                                                                    |
| --- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T1  | `src/test/engine/pipeline/passes/rivalOffers.sharedCtx.test.ts` **(new)**                 | `generateBoutBids` output identical with vs without `SharedBidCtx` on populated fixture: bids array deep-equal incl. order, for VENDETTA + non-vendetta intents; `bookableRoster` exclusions equal; own-stable opponents never appear in buckets' effective picks.                                                       |
| T2  | `src/test/engine/matchmaking/worldMatchmaking.test.ts` (extend)                           | `collectEligibleWarriors`/`planWorldBouts` offers identical when locked-champion check uses shared `Set` vs per-warrior scan (incl. dormant champion stays eligible edge).                                                                                                                                               |
| T3  | `src/test/engine/ai/memory/perceptionSnapshot.test.ts` **(new)**                          | New fields equal the per-call computations: `playerThreatLevel === computePlayerThreatLevel(state)`; `threatByStableId.get(id)` ≡ `estimateThreat` output for every stable + player; `weekFightStableOf` ≡ `resolveWarriorOwner` for every weekFight participant incl. dead fighters (undefined); `laggedMetaByLag.get(1 | 2)` ≡ filter+`computeMetaDrift`at cutoffs;`signedTitleBoutWarriorIds`/`signedUpcomingBoutIds` ≡ predicates. |
| T4  | `src/test/engine/ai/agentCore.test.ts` (extend)                                           | `createAgentContext(rival, state, perception)` ≡ `(rival, state)` (no perception) on same fixture: dossiers, metaAwareness, playerThreatLevel deep-equal.                                                                                                                                                                |
| T5  | `src/test/engine/ai/memory/intelDossier.test.ts` + `.observedTells.test.ts` (extend)      | `updateDossiers(rival, state, weekFights, shared)` ≡ without `shared`: resulting dossier map deep-equal incl. `observedTells`, `recordVs`, prune order.                                                                                                                                                                  |
| T6  | `src/test/engine/ai/workers/crownWorker.test.ts` (extend)                                 | `processCrownPosture` output identical using shared signed-title set vs internal scan.                                                                                                                                                                                                                                   |
| T7  | `src/test/engine/ai/workers/intelWorker.test.ts` (extend)                                 | `processIntel` result equal pre/post `titleOpponents` dedupe (same dossier + scoutReports + log events).                                                                                                                                                                                                                 |
| T8  | `src/test/utils/escapeHtml.test.ts` (extend)                                              | Corpus incl. every special char, `&amp;`-adjacent strings, unicode, empty — output unchanged.                                                                                                                                                                                                                            |
| T9  | `src/test/data/names/nameGenerator.test.ts` (extend)                                      | Same seeded rng → identical name stream pre/post pool cache, for each culture + a `seedPool` case (rng consumption order unchanged).                                                                                                                                                                                     |
| T10 | `src/test/data/warriorArchetypes.canon.test.ts` (extend) or parity spec                   | `classifyArchetype` output identical on a corpus (full sorted vector incl. rounding); `barRatio` edge: no bars → 0.                                                                                                                                                                                                      |
| T11 | `src/test/engine/ai/workers/recruitmentWorker.test.ts` (extend)                           | Draft pick outcome identical on a fixture pool incl. `attrTotal` boundary (sum exactly 70/71) + TOURNAMENT_CAMPAIGN bonus path.                                                                                                                                                                                          |
| T12 | `src/test/engine/matchmaking/arenaFit.eligibility.test.ts` / `.test.ts` (extend)          | `eligibleArenasFor`/`matchupArenas`/`homeVenueOf` identical across weathers incl. hazardous-indoor and bannedArenaIds.                                                                                                                                                                                                   |
| T13 | `src/test/engine/promoters/warriorFilters.test.ts` **(new)**                              | `hasInjuryRisk` matrix: no injuries / Minor-only / each risk severity / mixed / `injuries` undefined.                                                                                                                                                                                                                    |
| T14 | `src/test/engine/championship/contenderLadder.test.ts` (extend)                           | `buildContenderIndex` deep-equal pre/post single-pass bucketing, incl. `includeUnready` variant + declinedContenders cooldown.                                                                                                                                                                                           |
| T15 | `src/test/engine/promoters/offerMatchmaking.test.ts` (extend) — only if item 13 attempted | findBestOpponent equality on boundary-gap cases (candidates exactly at gap threshold, all-skipped window, feud fast-path preserved).                                                                                                                                                                                     |
| T16 | `src/test/engine/moduleCacheRegistry.test.ts` (extend REGISTRY)                           | Register new module-level caches (verify scanner scope — if it covers `src/data`, name-pool cache must register; arenaFit caches under `src/engine` must).                                                                                                                                                               |

Landing order is strictly: write all of T1–T16 → confirm green on current code → implement items below → re-run. The soak byte-identity check (Verification) is the system-level proof; these specs are the unit-level proof.

## Tranche 1 — once-per-tick shared structures

**1. `SharedBidCtx` in `buildWeekOffers`** (`offers.ts`, `generation.ts`, `conversion.ts`, `worldMatchmaking.ts`)

- Build once per tick from `(state, currentRivals)`:
  - `lockedIds` = `bookingLockedChampionIds(state)` — replaces per-rival builds at generation.ts:143 and per-candidate scans at conversion.ts:141/152/167/361 + worldMatchmaking.ts:37 (swap those `isChampionBookingLocked` calls to `ctx.lockedIds.has`/`locked.has`).
  - One `Object.values(state.boutOffers)` pass emitting three sets: `signedUpcomingIds` (`Signed && week > now` — `bookableRoster`), `signedUpcomingTitleIds` (`titleArenaId && Signed && week >= now` — crownWorker reuse via item 5), `bookedForWeek2Ids` (`Signed && week === absoluteWeek+2` — `planWorldBouts`' `collectBookedWarriorIds`).
  - `activeOpponentsByStyle: Map<FightingStyle, {warrior, rivalId}[]>` — single pass over **`currentRivals`** (post-update rivals — NOT `state.rivals`), `isActive && !lockedIds.has`.
- `generateBoutBids`/`buildMatchupCtx`/`bookableRoster`/`convertBidsToOffers`/`planWorldBouts` gain optional ctx params; **fallback = today's local build** so tests and other callers are untouched.
- Own-stable exclusion: `entry.rivalId === rival.id` skip inside the bucket member loop (validated: `Warrior.stableId` optional — do NOT key on it for the skip; `bStableId` still read from `opponent.stableId` exactly as today).
- `collectCandidates` "all other intents" branch keeps its own stable-loop (it applies `stableIsAvoided` per stable) — only its `isChampionBookingLocked` calls swap to the shared set.

**2. `perception.playerThreatLevel`** (`perceptionSnapshot.ts`, `agentCore.ts:92`) — compute once; `createAgentContext` uses `perception?.playerThreatLevel ?? computePlayerThreatLevel(state)`.

**3. Dossier shared maps** (`perceptionSnapshot.ts`, `intelDossier.ts`, `agentCore.ts`)

- `perception.threatByStableId: Map<StableId, number>` — every rival stable id + `state.player.id`, values = today's `estimateThreat` formula verbatim.
- `perception.weekFightStableOf: Map<WarriorId, StableId|undefined>` — `resolveWarriorOwner` for every `weekFights` participant once (absorbs the dead-fighter roster-scan misses). Per-rival `stableOf` keeps its `selfIds` fast-path, then consults the shared map.
- `perception.knownRivalOwnerIds: StableId[]` — `refreshKnownRivals` becomes per-rival filter over it (identical exclusion by `owner.id`).
- `updateDossiers` gains optional `shared` param (`{threatByStableId, weekFightStableOf, knownRivalOwnerIds}`); `createAgentContext` passes `perception`. All three have inline-compute fallbacks.

**4. `perception.laggedMetaByLag: Map<number, StyleMeta>`** — compute lags {1,2} once (`absoluteWeek-lag` cutoff, filter+`computeMetaDrift`); `perceivedMeta(rival, state, perception?)` reads map, falls back to inline for missing lag values; lag 0 path unchanged (`cachedMetaDrift ?? compute`).

**5. `signedTitleBoutIds` consumers** (`crownWorker.ts:167,362`) — read `perception.signedUpcomingTitleIds` (from item 1's scan when available; the crown path is inside shards so perception is the carrier — keep `signedTitleBoutIds(state)` as fallback).

**6. `titleOpponents` dedupe (minor)** (`intelWorker.ts`) — materialize the pair list once per `processIntel` (single `selfIds` + one `boutOffers` scan, early-exit preserved for `pickScoutTarget`), pass to `pickScoutTarget`/`pickReportWarrior`.

## Tranche 2 — pure-function micro-opts

7. **`escapeHtml` fast path** (`src/utils/escapeHtml.ts`): `if (!/[&<>"']/.test(str)) return str;`.
8. **`generateWarriorName` culture cache** (`src/data/names/nameGenerator.ts:110`): module-level `Map<culture, string[]>` of deduped+sanitized `CULTURE_SEEDS`; `seedPool` path merges fresh. Verify `moduleCacheRegistry` scanner covers `src/data` — register if so.
9. **`classifyArchetype`/`scoreCandidate`** (`warriorArchetypes.ts:374-413`, `recruitmentWorker.ts:192`): hoisted frozen `ARCHETYPE_ENTRIES`; `barRatio` sum/count accumulator (no array); `attrTotal` via `for (const k in attrs) if (typeof attrs[k] === 'number') sum += attrs[k]`.
10. **`arenaFit` statics** (`arenaFit.ts:190-327`): module-scope `EXCLUDED_ARENA_SET`; lazy `indoorArenaIdSet` singleton (registry content static post-boot; laziness avoids init-order risk); keep `homeVenueOf` `Object.entries` — recs are per-warrior data (bounded), only drop the per-call Set build. Register module caches in REGISTRY.
11. **`hasInjuryRisk`** (`warriorFilters.ts:16`): single `.some(i => RISK_SEVERITIES.has(i.severity))` with module-scope `RISK_SEVERITIES = new Set(['Moderate','Severe','Critical'])`.

## Tranche 3 — optional, time-boxed (only after T1–T13 stay green)

12. **`buildContenderIndex` single-pass** (`queries.ts:207`): one `collectAllWarriors` pass, per-warrior `byArena` keys → per-arena rows; preserve exact `rankContenders` predicate incl. `{includeUnready: true}` variant used at queries.ts:211, per-arena `declinedContenders` cooldown, single `crownedIds` build, identical comparator order.
13. **`findBestOpponent` early-exit** (`offerMatchmaking.ts:204-250`) — non-Greedy only: two pointers outward from `lowerBound` insertion index; per-side break when `4500 - gap <= bestScore` (pMax=45 verified). Greedy branch (`gap*100 + p`) and feud fast-path untouched.

## Files to modify

- `src/engine/pipeline/passes/RivalStrategyPass/offers.ts` — SharedBidCtx build + threading
- `src/engine/ai/workers/competitionWorker/boutBidding/generation.ts`, `conversion.ts` — consume shared ctx
- `src/engine/matchmaking/worldMatchmaking.ts` — locked set + booked ids
- `src/engine/ai/memory/perceptionSnapshot.ts` — 6 new fields (all `Map`/`Set`/array — structuredClone-safe; **no functions/WeakMaps**)
- `src/engine/ai/agentCore.ts`, `src/engine/ai/memory/intelDossier.ts`, `src/engine/ai/workers/crownWorker.ts`, `intelWorker.ts`
- `src/utils/escapeHtml.ts`, `src/data/names/nameGenerator.ts`, `src/data/warriorArchetypes.ts`, `src/engine/ai/workers/recruitmentWorker.ts`, `src/engine/matchmaking/arenaFit.ts`, `src/engine/promoters/warriorFilters.ts`
- `src/test/**` per Phase-0 table; `src/test/megaplan/*guard.test.ts` — delete stale `KNOWN_EXCEPTIONS` for removed lines (bidirectional ratchet)
- `docs/engineering/pipeline-baseline.md` — B5 outcome block

## Determinism & serialization duties

- New perception fields are `Map`/`Set`/arrays only — clone cleanly for shard workers; verify `shardInputSize` still green.
- `rivalStableShard` equivalence: shared ctx lives post-shard (`buildWeekOffers`) or inside perception (pre-shard, cloned) — `shardInputSize.test.ts` byte-identical shard-output spec is the gate.
- New module-level mutables → `moduleCacheRegistry` REGISTRY entry (verify `src/data` coverage).
- `hashStr` call-count reduction is safe (pure, no RNG stream); `Math.max` first-max and sort orders untouched.
- Regenerate `src/test/_setup/runnerGroups.json` via `test-audit-scan` if new spec files land outside existing groups.

## Verification

- [ ] Phase 0 green on unmodified source (characterization baseline)
- [ ] `bun scripts/scan-in-loop.mjs && bun scripts/entries-in-loop.mjs` — no new violations; stale allowlist entries removed in same commit
- [ ] `bun run format && bun run lint && bun run type-check && bun run test`
- [ ] `bun run test:slow` — `determinism.slow`/`weekDeterminism`/`parallelDeterminism` byte-identical
- [ ] A/B `bun scripts/soak.mjs --weeks 40 --seed 20260919` — final-state summary byte-identical; record ms/wk delta (target ≈ −10-18% on `rivalStrategy`)
- [ ] Update `pipeline-baseline.md`

## Tranche 4 — previously out-of-scope (user-directed, best-effort)

User instruction: implement the deferred/out-of-scope items too. Each keeps
the same gates — output-preserving, byte-identical A/B soak, determinism tier
green. If an item cannot land without a determinism/behavior change, document
the measurement and the blocker rather than shipping a regression.

- **4A. Boundary `structuredClone` (~9%)** — ✅ **LANDED** `5bcba81cb`.
  Profile attribution disproved the transport theory: `structuredClone`
  proper is ~0.24%; the ~9% was V8 spread internals cloning the whole
  `boutOffers` map **per response call** — `respondToBoutOffer` (2.9%),
  `dictMerge` (2.46%), `processContractPayouts` (2.23%). Fix: partial
  `{[offerId]: updated}` impacts (byte-identical under `dictMerge`),
  `dictMerge` accumulates in place, payout-side `boutOffers` re-emit
  dropped (was a no-op delete — `dictMerge` resurrects state keys — AND
  a clobber hazard vs voided-cancel writes; `pruneStaleBoutOffers` owns
  cleanup). Replace-semantics consumers (`useOfferActions`, `boutActions`)
  converted to merge. Spec: `offerImpactEquivalence.test.ts`.
- **4B. `useWorldState` broad subscription** — ✅ **LANDED** `9c85a1b87`.
  `reconstructGameState` is already memoized, so the real cost
  was per-field-change re-renders across 16 subscribers. 8 provably-narrow
  consumers converted to `useShallow` scoped selectors in
  `src/state/selectors.ts`: `useRivalryAlerts`, `HallOfFights`,
  `useHallData`, `Gazette`, `useTrainingAssignments`, `useBloodfeudMarks`,
  `useBookingOffice`, `NextBoutWidget`. Skipped whole-state-helper users
  (HeadToHead, useCoachTip, useStableAdvisor). `entityIndex` WeakMap-keying
  preserved — name-state pick keeps {player, roster, graveyard, retired,
  rivals}. Spec: `scopedSelectors.test.ts` pins subset fields + referential
  stability across unrelated writes.
- **4C. Worker-pool parallelism (gate failed 0.33×)** — ❌ **DOCUMENTED,
  not landed.** Re-measured at steady state: `parallel-bench.mjs --weeks
  40 --seed 20260919 --pool 4` → sequential 13,955 ms vs parallel 42,968 ms
  = **0.32×** (gate needs ≥1.30×). The prior 0.33× was not spawn-dominated —
  the deficit is structural: the synced-shard protocol round-trips a cloned
  GameState to every worker each week plus impact deltas back, and
  serialization+marshal exceeds the shard compute it displaces. Not shipped.
- **4D. `applyOfferImpact` (268 ms, `Object.assign`)** — ✅ **DOCUMENTED,
  resolved by 4A.** Audited all 6 call sites (counters.ts:147, index.ts:43,
  slate.ts:50/89/101/244): every call merges a real respond/counter impact —
  no redundant invocations to elide. The cost driver was per-call `Object.assign`
  over whole-map `boutOffers` impacts; 4A's partial-impact contract makes each
  call O(1). No further code change warranted.
- **4E. Bundle weight** — ✅ **DOCUMENTED, healthy.** `vite build` 6.52s,
  188 precache entries ≈6.9 MiB (bulk = avatar/audio assets). Largest JS
  chunks: help 524 KB (164 gzip, lazy route), useGameStore 384 KB (124 gzip),
  vendor-core 345 KB (109 gzip), WarriorRadarChart 338 KB, combatPbp 318 KB —
  all lazy/manualChunks-boundary appropriate. No change needed.

## Out of scope (hard)

- None remaining — all prior out-of-scope items promoted to Tranche 4.

## Risks

- **Stale `KNOWN_EXCEPTIONS`** — same-commit cleanup required.
- **Perception snapshot growth** — new Maps clone per shard job when pool>1; small (~90-1,200 entries) vs recomputation.
- **Own-stable skip must key on loop `rivalId`, not `Warrior.stableId`** (optional field — validated).
- **`currentRivals` vs `state.rivals`** — shared buckets must use post-update `currentRivals`.
