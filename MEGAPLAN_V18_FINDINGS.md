<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN V18 FINDINGS — Seeded Audit Baseline (validated 2026-10-21)

Companion to `MEGAPLAN_V18_PLAN.md`. Every number below was re-measured
against the live codebase on 2026-10-21; Phase 1 refreshes and extends
these tables.

## §0 Baseline metrics

| Metric | Value (2026-10-21) | Source |
| ------ | ------------------ | ------ |
| Source files / LOC | 1,243 files / 140,340 loc | `function-length.mjs` |
| Test files / LOC | 954 files / 146,704 loc | `function-length.mjs` |
| Functions >80 lines | **19** (0 >120, 0 >200) | `function-length.mjs` |
| Functions 60–80 lines | **293** | `function-length.mjs` |
| Files >800 lines | 2 (`commonCorpus.ts` 1,223; `arenas/lore.ts` 1,051 — both data) | `function-length.mjs` |
| dup-scan exact w8 | src↔src **27** · test↔test **150** · mixed **27** | `collectDuplicates()` |
| dup-scan exact w12 | src↔src **7** · test↔test **18** · mixed **4** | `collectDuplicates({window:12})` |
| dup-scan ident w20 | src↔src **181** · test↔test **50** · mixed **139** | `collectDuplicates({ident:true,window:20})` |
| dup-scan ident w16 | src↔src **484** · test↔test **125** · mixed **286** | `collectDuplicates({ident:true,window:16})` |
| dup-scan ident w8 | 13,926 src↔src — import-preamble noise, **unusable raw** | validation scan |
| Dupe ledger | `EXEMPT_PAIRS` 27 · `DEBT_PAIRS` **0** · baseline 27 | `duplication.guard.test.ts` |
| Coverage floors | 84 stmts / 74 branch / 78 funcs / 85.5 lines | `vitest.config.ts:67-72` |
| `SAVE_STATE_VERSION` | `'3.0.0'` (free to bump) | `src/constants/core/core.ts:12` |
| Skip registry | empty — every ticketed phase landed | `skipCount.guard.test.ts` |
| Restore point | tag `pre-megaplan-v18` (Phase 0) | `pre-megaplan-v8`…`v17` exist |

## §0b Dupe-ledger investigation — recent-additions analysis

The ledger reached 36 via V17's whole-repo prettier pass (`e1c19d8a`),
which normalized quote style and line wrapping across already-parallel
handlers and unmasked nine 8-line-block pairs that formatting differences
had hidden. V18 retroactively formalizes the drain:

| Commit | Action |
| ------ | ------ |
| `66a8a5a0` | Split the ledger: 27 `EXEMPT_PAIRS` (structural overlap — prop-name echoes, shard barrels, vendor/parallel implementations) + 9 `DEBT_PAIRS` (genuine cloned logic) |
| `4ac89484` | `statGrantOutcome` + `makeMinorInjury` extracted — drained 7 offseason pairs |
| `8529759f` | `DriftParticles` extracted across 5 weather effect files |
| `5f82051f` | `rivalFightPlan` extracted across the 3 plan builders (grudge + aiPlan tail) |
| `3245263b` | `DEBT_PAIRS` empty → `SRC_TO_SRC_BASELINE` ratcheted 36 → 27 |
| `e6dcc447`, `672e4045` | Stale phase-pending docblocks retired; skip registry drained |

Live rescan confirms: exactly 27 src↔src pairs, all registered, `DEBT_PAIRS`
empty, zero stale entries (live-ledger test enforces this going forward).

## §A SRP targets — function-level queue

**Correction (validated):** the monolith-by-size list was disproved.
`narrateEvents/handlers.ts` (562) is a uniform ~20-handler dispatch table —
already decomposed. `stateInvariants.ts` (454) is cohesive per-check
validators + 2 entry points. `recruitmentWorker.ts` (455) is a cohesive
pipeline worker. `notable.ts` (714) is homogeneous
`Record<string, TraitDef>` data. `arenaFit.ts` (467) is borderline — one
domain, mild phase mixing. **Size misclassifies; classify-by-reading.** The
remaining SRP surface is function-level plus god-components/hooks mixing
fetch+derive+render.

First queue — all 19 functions >80 lines (contract tickets `MEGAPLAN-S1`…`S19`):

| # | Fn | File:line | Len |
| - | -- | --------- | --- |
| S1 | `WarriorBuilder` | `src/components/WarriorBuilder/index.tsx:35` | 100 |
| S2 | `resolveDecision` | `src/engine/bout/decisionLogic.ts:209` | 100 |
| S3 | `useRecruitActions` | `src/pages/Recruit/hooks/useRecruitActions.ts:181` | 99 |
| S4 | `ComparisonHeader` | `src/components/scouting/ComparisonHeader.tsx:40` | 96 |
| S5 | `createRosterActions` | `src/state/slices/rosterSlice/actions.ts:166` | 96 |
| S6 | `prepareExchange` | `src/engine/combat/resolution/exchangePrep.ts:268` | 91 |
| S7 | `resolveCounteredOffers` | `src/engine/ai/workers/competitionWorker/offerProcessor/counters.ts:66` | 88 |
| S8 | `scheduleTitleBouts` | `src/engine/championship/arenaChampionship/phases/scheduling.ts:38` | 88 |
| S9 | `RosterWarriorRow` | `src/components/stable/RosterWarriorRow.tsx:90` | 86 |
| S10 | `WarriorDossierHeader` | `src/components/warrior/dossier/WarriorDossierHeader.tsx:26` | 85 |
| S11 | `applyBoutResults` | `src/engine/matchmaking/tournamentSelection/resolution/results.ts:35` | 85 |
| S12 | `generateWarriorStatements` | `src/data/warriorStatements.ts:125` | 84 |
| S13 | `buildFTUEInitialState` | `src/components/orphanage/ftueStateBuilder.ts:71` | 83 |
| S14 | `DominantCombatantsSection` | `src/components/scouting/components/DominantCombatantsSection.tsx:27` | 83 |
| S15 | `computeAgingImpact` | `src/engine/aging/agingSystem.ts:215` | 83 |
| S16 | `aiPlanForWarrior` | `src/engine/ai/plan/coreGenerator/index.ts:50` | 83 |
| S17 | `processRecruitment` | `src/engine/ai/workers/recruitmentWorker.ts:372` | 83 |
| S18 | `MathStep` | `src/components/resolution-reveal/MathStep.tsx:18` | 81 |
| S19 | `computeTrainingImpact` | `src/engine/training/trainingImpact.ts:172` | 81 |

Second tier: 293 functions in the 60–80 band — triaged by
responsibility-mix (census signals: fetch+derive+render, multi-domain
imports, section-banner partitions), **not** by length. Promoted entries
append as `S20+`.

God-component/hook candidates: to be populated by `scripts/srp-census.mjs`
(Phase 1) + classify-by-reading.

## §D Dup clusters — per-tier ledger skeleton

| Tier | src↔src | test↔test | mixed | Disposition |
| ---- | ------- | --------- | ----- | ----------- |
| exact w8 | 27 — all registered EXEMPT, `DEBT_PAIRS` empty | **150 — ungated, triage queue** | **27 — ungated, triage queue** | w8 src↔src is the standing gate |
| exact w12 | 7 | 18 | 4 | secondary audit tier |
| ident w20 | 181 | 50 | 139 | audit queue — verdicts before ledger registration |
| ident w16 | 484 | 125 | 286 | deep tier — staged after w20 drains; never a raw-count gate |

Known test↔test boilerplate clusters (seeded): competitionWorker spec
families sharing 37–53 lines pairwise
(`playerPressure`/`venueCounter`/`styleMatchupGate`/`desperationGate`);
`src/test/_fixtures/weather.ts`↔`enumSourcesSync.test.ts` 42L; determinism
specs 24L. Harmonization target already enforced:
`src/test/_fixtures/factories.ts` via `testQualityAudit`'s local-factory
rule (`auditBaseline.json: localFactoryFiles`).

Known mixed-pair shape (predicted mostly-EXEMPT — **not debt**): tests
intentionally pinning production literals — `warriorDefaults.ts` canonical
zero-state echoed in 8 specs, `enumSources.ts`↔schema tests,
`resolution.ts`↔combat specs.

Per-cluster rows (verdict + harmonization target + `MEGAPLAN-D*` ticket)
are filled during Phase-1 triage.

## §U Unique-logic register

Per-cluster divergent behavior that must provably survive consolidation.
Seeded empty — populated in Phase 1; each row gets a preservation spec in
Phase 2 and a `MEGAPLAN-U*` ticket.

| Cluster | Site A | Site B | Divergent behavior | Preservation spec | Ticket |
| ------- | ------ | ------ | ------------------ | ----------------- | ------ |
| _pending Phase-1 triage_ | | | | | |

## Scanner-interface reference (for Phase-2 test authors)

Two harness shapes exist — pick per scanner:

| Scanner | Interface | Notes |
| ------- | --------- | ----- |
| `dup-scan.mjs` | `collectDuplicates({ident, window, minBlock})` | importable; `@ts-expect-error` on the .mjs import |
| `function-length.mjs` | `collectSizes()` → `{functions}` | importable (v12Srp precedent) |
| `param-count.mjs` | `collectParamCounts()` + `PARAM_LIMIT`=5 | importable |
| `entries-in-loop.mjs` | `collectEntriesInLoop()` | importable |
| `ui-audit-scan.mjs` | `collectUiAudit()` | importable |
| `orphan-scan.mjs` | **no exports** — subprocess + read `scripts/out/orphan-scan.json` | `orphanScan.guard.test.ts` precedent (`execFileSync` + JSON read) |
| `data-array-dup-scan.mjs` | **no exports** — subprocess | data-array dupe report/rewrite |
| `test-audit-scan.mjs` | **no exports** — subprocess; **regenerates** `runnerGroups.json`/`auditBaseline.json` | never hand-edit generated JSON (V17 C3) |
| `srp-census.mjs` | **NEW** (Phase 1) — should export `collect*` for `v18Srp` consumers | emits responsibility-signal candidates |

## Conventions confirmed for V18 docs/guards

- Megaplan docs carry their own `markdownlint-disable` block — **no
  filename exemption exists** (`d9488e8e` added inline directives;
  `eslint.config.js` has no markdown rules).
- Skip tickets match `MEGAPLAN-[A-Z]\d+` on the skip line and must be
  registered in `REGISTERED_SKIP_TICKETS`; registry currently empty.
- Test placement per `docs/TESTING.md`: mirror-path under `src/test/`,
  guards in `src/test/megaplan/` (outside CATEGORY_DOMAIN →
  domain-import-rule exempt), `.slow` terminal marker for heavy specs.
- Guard docblocks state "authored test-first" history accurately — the
  stale-marker guard scans whole-file contents for pending-phase claims.
