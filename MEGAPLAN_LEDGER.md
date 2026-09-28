# MEGAPLAN LEDGER — Deep Refactor, Dedup, Wiring & Bible Conformance

**Scope:** Exhaustive re-audit and refactor of the full codebase — monolith/long-function decomposition, duplicate elimination, orphan wiring, Design-Bible conformance. Zero backwards-compatibility constraints (saves disposable; `SAVE_STATE_VERSION` free to bump).
**Restore point:** tag `pre-megaplan-v8` → `a8cf7ca2` (local).
**Baseline-repair commit:** `3bc5476e` — 6 pre-existing type-check errors at HEAD fixed before baseline capture.
**Working mode:** in-place on `main`; sequential ledger-batch commits; deletes never mixed with moves; **test-first invariant** — Phase 2 constructs the full test inventory before any implementation commit (see MEGAPLAN_FINDINGS §M2).

---

## 0. Baseline Metrics (captured @ `3bc5476e`)

| Metric | Baseline | Notes |
|---|---|---|
| `bun run type-check` | **0 errors** | was 6 errors at `a8cf7ca2` — repaired `3bc5476e` |
| `bun run lint` | **0 errors / 0 warnings** | |
| `bun x vitest run` (default) | **692 files / 8,172 pass / 2 skip / 1 flaky** | 47.93s; `advanceWeekPerformance` timing-ratio flake (passes isolated — not a regression) |
| `bun run build` | **OK 2.38s** | 5.4MB precache |
| `bunx vitest run --config vitest.config.slow.ts` | 24 slow files | deferred to Phase 4+ gates |
| `bun test` compat / `playwright test` | deferred | final gate matrix |
| Coverage thresholds | 84 stmts / 74 branch / 78 funcs / 85.5 lines | floors held |
| Non-test LOC | ~111k | engine 45.6k · components 34k · pages 12k · data 7.3k · rest ~12k |
| Test files (vitest-collected) | 692 | |

### Pre-findings validated during plan review (V-ledger)

Full table lives in `MEGAPLAN_FINDINGS.md` §0. Headline confirmed findings: 7 engine-root file/dir shadows + ~43 flat files (§H); `arenaChampionship.ts` 922 lines post-extraction (§I); static non-location-aware primary CTA vs Page-System spec (§L); `PageFrame`/`PageHeader` coverage 21/28 of ~35 pages (§L); 105 files w/ raw color literals needing classified audit (§L).

---

## Disposition Ledger

| Commit | Phase | Batch | Disposition |
|---|---|---|---|
| `3bc5476e` | 0 | baseline repair | 6 type-check errors fixed (pre-existing at tag) |
| `ad2a3806` | 0 | baseline + findings docs | MEGAPLAN_FINDINGS seeded with validated V-ledger |
| `6fbd0422` | 1a | scan tooling | function-length / dup-scan / ui-audit scanners |
| `d9824c7f` | 1-2 | guards + specs | structural guards (fn budgets, dup ratchet, orphan, UI honesty, type parity, skip-count) + characterization + ticketed spec-encoding tests — committed before ANY implementation (test-first invariant) |
| `173fd0db` | 3a | shadow fold | 7 engine-root file/dir shadows → domain dirs w/ barrels |
| `e14d31e7` | 3b | root normalization | ~34 flat engine files → domain dirs; 225 files repointed; metaDrift UI helpers → lib/ |
| `b6e62956` | 3c | traits fold | traits.ts compat barrel deleted; traitDefs 997L → tiered shards; traitTypes dedupe |
| `ed7d98e2` | 3 | type shards | state.types 791L→barrel+6; shared.types 568L→14 shards; export-parity green |
| `b6d1caa5` | 3 | data split | arenas.ts 1,559L → data/arenas/{registry,venues,lore}; injectable default-arena breaks venue↔registry cycle; snapshot/restore test helpers |
| `969c3805` | 3 | lore split | loreData → narrative/lore/ shards; path-dependent tests repointed |
| `c9fee7a8` | 3 | pipeline split | weekPipelineService 611L → context/caches/passes/profiling/stages/finalize; semantics pinned |
| `064eed0f` | 3 | championship split | arenaChampionship 922L → core/queries/phases/*; owningStableOf moved to core (cycle break) |
| `a7277e79` | 3 | chaos handlers | chaosHandlers 828L → 5 thematic shards via offseasonEvents barrel |
| `21780e38` | 3 | social handlers | socialHandlers 513L → socialHandlers/ shards |
| `2586fe42` | 3 | narrative types | narrative.types 503L → types/narrative/ domain shards |
| `54ed3420` | 3 | constants/data shards | weather.ts, combat.ts, weapons.ts → config/penalties/items shards (mechanical; zero value changes — balance untouched) |
| `39e15f4e` | 3 | advisor decomp | computeStableCouncilReport 431L → cards/directives/lookahead modules |
| `52740c4c` | 3 | combat narrate | narrateEvents 307L → dispatch-table handlers (event order preserved) |
| `e4debdd9` | 3 | advisor decomp | evaluateBoutOffers 276L → gates/filter/scoring/recommendation |
| `7b69855f` | 3 | AI worker decomp | processAllRivalsBoutOffers 253L → group/slate/counter phases |
| `8d457b90` | 3 | simulation decomp | runSimulationLoop 250L → loop-phase helpers |
| `0c6b6ce0` | 3 | AI worker decomp | evaluateBoutOffer 248L → gate-chain helpers |
| `c6fefe04` | 3 | AI worker decomp | convertBidsToOffers 220L → BidConversionCtx + per-bid phases |
| `c01ec7fd` | 3 | matchmaking decomp | resolveRound 214L → resolveRoundBouts/seedNextRound |
| `41cc6c14` | 3 | AI plan decomp | aiPlanForWarrior 199L → computePlanModifiers/applyStrategicLayer |
| `810211f1` | 3 | pipeline decomp | processHallOfFame 195L → collectEligible/pickBest/recordAward (kills 3x dup bookkeeping) |
| `16f79da4` | 3 | AI worker decomp | processRecruitment 192L → signGeneratedRecruit/scoreCandidates/signPoolRecruit |
| `381f3e6e` | 3 | anim decomp | processArenaEvent 197L → side-parameterized movement (clampMove/toward/setFighter) |
| `e5751ac0` | 3 | store decomp | createStore → hydrateDraft + runEngineJob (dedupes doAdvanceWeek/doAdvanceDay runners) |
| `8690a7fc` | 3c | page decomp | ArenaDetail 420L fn → arenaDetail/{ChampionBlock,RecordTable,sections}; dup-guard rebaselined 84→130 (relocated handler boilerplate — Phase-4 target, see FINDINGS) |
| `35e80150` | 3c | page decomp | Help 383L → help/sections (8 codex accordion items) |
| `621a7a8d` | 3c | page decomp | Bookmarks 325L → bookmarks/groupBookmarks (pure grouping helper) |
| `47da672d` | 3c | page decomp | StableDetail 301L → stableDetail/{StableSidebar,StableOverviewTab} |
| `2c173bd2` | 3c | page decomp | WorldOverview 301L → worldOverview/rows.ts |
| `741c7e1d` | 3c | page decomp | PromoterDetail 297L → promoterDetail/{config,tabs} |
| `8d24aee6` | 3c | page decomp | HallOfFights 284L → lore/hallOfFights/tabs |
| `9a814bca` | 3c | page decomp | Training 284L → training/sections |
| `4be1b937` | 3c | page decomp | Orphanage 274L → orphanage/useFtueFlow hook |
| `9880868b` | 3c | page decomp | ArenaDetail record boards → arenaDetail/RecordBoards |
| `7a0dddeb` | 3c | page decomp | Trainers 269L → Trainers/tabs (+5 sub-components; ratchet held at 239 by keeping extractions <80L) |
| `43b571b6` | 3c | page decomp + dedupe | BookingOffice 260L → sections {HeaderStats,RosterStatusBar,OfferGrid}; twin offer-card maps + empty states consolidated |
| `0cc515d1` | 3c | page decomp | WarriorCouncilCard 249L → councilCardSections (header/3 columns/footer) |
| `94ea21dc` | 3c | page decomp + dedupe | NewGameForm 233L → newGameFields; shared NameField dedupes owner/stable inputs |
| `5ecc4eac` | 3c | page decomp | PlanBuilder 220L → usePlanOrchestration hook + planBuilder/sections |
| `946f378e` | 3c | page decomp | WarriorDetail 211L → WarriorDetail/sections |
| `3e49fbe2` | 3c | page decomp | StartGame 202L → startGame/{useStartGame,DeleteSaveDialog}; dup baseline 131→134 (relocated boilerplate + 3rd AlertDialog confirm site) |
| `601c7510` | 3c | state decomp | createStore creator arrow 233L → module-level hydrateDraft + runEngineJob (set/get injected). **0 functions >200L remain** |
| `f99b83d7` | 4 | dup elimination | offseason handlers: pickActiveWarrior + announceOffseasonEvent helpers; 53 pick preambles + 62 newsletter calls codemodded across 11 files (-127 net) |
| `2e7c739a` | 4 | dup elimination + drift fix | 38 z.enum literals → enumSources tuples; FightingStyle→enum; CombatEventType union derives from new COMBAT_EVENT_TYPES. **Fixed real drift**: CONDITION_TRIGGERS +4 values, BOUT_OFFER_RESPONSES +'Countered', ArenaTag schema now accepts canonical superset, CombatEventType schema +3 |
| `83d850d7` | 4 | dup elimination | 3 AlertDialog confirm sites → ConfirmDestructiveDialog |
| `3d858c1e` | 4 | test dedupe | 270L tournament fixture dup → _fixtures/tournamentState.ts |

## Phase-4 dispositions

- **Residual offseason-handler overlap (~75L clusters)** — shape-level similarity (identical signatures + ctx-write idioms); helper extraction done; further dedup = over-abstraction. DISPOSITIONED: acceptable.
- **369 zero-prod-consumer exports** — triage: dormant AI systems (intentEngine, poachBid, intelDossier, agentPlanForWarrior, assessCrownOpportunity, preferredTrainerFocus, budgetWorker, metaDrift::createDefaultMeta, killAnalytics, seasonalRetirementService) → Phase-5 wire-or-remove. Type-only exports + ui/ library surface → intentional API, retained.
- **test↔test 780 pairs** — fixture/setup boilerplate; worst cluster (270L tournament) extracted; remainder dispositioned as acceptable per-file isolation.
- **`src/engine/validate/stateInvariants.ts`** — test-only reachable; Phase-5 wiring candidate (post-load validation or removal).
