# MEGAPLAN V16 LEDGER — Feature Integration + NPC-AI Accessibility

## Baseline

- **Branch:** `main` · **Tag:** `pre-megaplan-v16` · **Constraints:** zero
  save-file/backcompat; slow suite skipped per user directive (adhoc/nightly
  tier); test-first mandate in force (Phase 1 RED before any production change).

## Phase 0 — baseline gate matrix

| Gate | Result | Notes |
| --- | --- | --- |
| `type-check` (tsr + tsc --build) | ✅ 0 errors | routeTree.gen.ts regenerated — no drift |
| `lint` (eslint) | ✅ 0 errors | 5 pre-existing jsdoc warnings in avatarGenerator.ts |
| `test` (fast vitest) | baseline: 24 RED = V16 specs + 1 pre-existing | RED list verified file-by-file: livingWarriorById×2, WEATHER_AI_DISPOSITION×4, Cursed Eclipse×8, AI scout reports×7, schema round-trips×2, F3b insight deposit×1 |
| orphanScan guard | ❌ pre-existing on clean `main` | dead-export ratchet over the 157 ceiling before V16 began (verified via `git stash` on a clean tree); not a V16 regression |
| `dead-code` (knip) | report-only | 142 unused exports / 64 unused types / 4 dup exports (V15: 139/63/4) |
| 40w soak | ✅ 0 invariant violations | 608 ms/week, 5,721 bouts, 558 kills |

## Phase 1 — RED test suite

| Spec | File | Status |
| --- | --- | --- |
| T-F1 livingWarriorById / lookup parity | `src/test/engine/core/{entityIndex,warriorLookup}.test.ts` | ✅ written → verified RED at baseline |
| T-F2 disposition completeness + Cursed Eclipse | `src/test/engine/ai/{weatherDisposition.completeness,weatherSuitability}.test.ts` | ✅ written → verified RED at baseline |
| T-F3 AI scout reports + schemas + insights | `src/test/engine/ai/workers/intelWorker.test.ts`, `src/test/schemas/{aiMemorySchema,scoutReportSchema}.test.ts`, `src/test/pages/scouting/useScouting.test.ts`, `src/test/state/slices/rosterSlice.test.ts`, `src/test/components/ledger/InsightManager/hooks/useInsightManager.test.ts` | ✅ written → verified RED at baseline |
| T-F4 stableId crest | `src/test/components/avatar/AvatarForEntity.test.tsx` | ✅ written |
| T-F5 'recruit' EventType | `src/test/components/eventLog/{EventLog.test.tsx,eventFiltering.test.ts}` union + category completeness specs | ✅ written |

## Phase 2 — F1 warrior-index unification

- `entityIndex.ts`: `livingWarriorById` added to `EntityIndex`, populated only
  for `Yours`/`Rival` buckets inside `indexWarriors`'s `add` callback;
  context-global WeakMap contract doc ported.
- `warriorLookup.ts`: private WeakMap + build loop deleted; `findWarriorById`
  delegates to `ensureEntityIndex(state).livingWarriorById` after the
  unchanged tournament overlay + `deadIdSet` filter; `clearWarriorCache` →
  `clearEntityIndexCaches`. `getWarriorIndex` kept (test consumers, C2).
- Tests green: `entityIndex.test.ts` 15/15, `warriorLookup.test.ts` 13/13.

## Phase 3 — F2 AI weather disposition table

- `weatherSuitability.ts`: `WEATHER_AI_DISPOSITION: Record<WeatherType,
  WeatherDisposition>` — `{bucket, hazardous?, acceptanceBlock?, offerDecline?,
  committeeSkip?, bidModifier?}`; all legacy rules ported verbatim, Cursed
  Eclipse given real arena rules (CN<12 acceptance block, CN<10 decline +
  committee skip, PR +3 / lowCN −3 / default −1 bid), all 11 offseason types
  explicit `{bucket:'offseason'}`. Five exports are thin readers — signatures
  unchanged, callers untouched.
- Tests green: `weatherDisposition.completeness.test.ts` 4/4,
  `weatherSuitability.test.ts` 9/9 (full-union × style × CN parity sweep).

## Phase 4 — F3 AI scout reports + insight economy

- F3e: `AIAgentMemory.scoutReports`, `OpponentDossier.suspectedCompetence`,
  `ScoutReportData.suspectedTraits` + all three schemas; `AI_SCOUT_REPORT_CAP =
  12` in `constants/ai.ts`.
- F3d: internal `ScoutReport` interface deleted — `generateScoutReport` now
  returns `ScoutReportData` (branded `ScoutReportId` cast at construction);
  `as ScoutReportData` cast dropped at `useScouting.ts`.
- `intelWorker.ts`: `pickReportWarrior` (title-bout opponent > most-accomplished
  active, deterministic tiebreaks), `toScoutQuality` (≥0.75 Expert / ≥0.55
  Detailed / else Basic), `SeededRNG(hashStr(scout|rival.id|week|warriorId))`,
  id-keyed dedupe via `matchesScoutTarget`, cap 12 oldest-first, Expert band
  override of `planIntel` (skipped when `possiblyMaskedPlan`),
  `knownStyles`/`suspectedCompetence` written to dossier, `newInsights`
  discarded for AI (no token economy).
- F3b: `purchaseScoutReport` appends `newInsights` → `draft.insightTokens`.
- F3c: `applyInsightToken` + `resolveInsightResult` `'Trait'` cases — flair
  `'Pattern Reader'` + reveal string.
- `AIDebugDrawer`: dev-flagged `rivalIntel` surface (agentMemory scout reports
  and dossier beliefs per side).
- Tests green: intelWorker V16 describe 7/7, schema specs 2/2, useScouting F3b
  1/1, rosterSlice F3c 1/1, useInsightManager Trait reveal 1/1.

## Phase 5 — F4/F5 small fixes

- F4: `AvatarForEntity.resolveEntityColors` warrior branch resolves
  `source.stableId` → `rivals.find(r => r.id === stableId)` before the
  live-roster scan; fallen rival warriors render their own crest.
- F5: `'recruit'` removed from `EventType` union, `EVENT_ICONS`,
  `CATEGORY_TYPES.reports`. `category:'recruit'` AI-action field untouched (C8).
- Tests green: AvatarForEntity 4/4, eventLog specs (icon-union completeness,
  category coverage).

## Phase 6 — full battery + docs

| Gate | Result |
| --- | --- |
| `type-check` | ✅ 0 errors |
| `lint` | ✅ 0 errors (5 pre-existing jsdoc warnings) |
| `test` (fast vitest) | ✅ 849 files / 9,102 passed / 2 skipped — zero failures |
| `dead-code` (knip) | ✅ report-only — unchanged 142/64/4, no new dead exports |
| megaplan guards | ✅ all 23 files green (param/file/orphan/uiTokens/etc.) |
| 40w soak ×2 identical | ✅ 0 invariant violations, `DETERMINISM: identical` |
| e2e chromium subset | ✅ 5/5 passed (~1.0m) |

### Phase 6 regression fixes

- `moduleCacheRegistry.test.ts`: stale `core/warriorLookup.ts:warriorCache`
  entry removed — that private cache was deleted when `findWarriorById`
  delegated to `entityIndex`; registry description updated to name it the
  unified lookup+search index.
- `scripts/orphan-scan.mjs`: `routeTree.gen.ts` (gitignored, regenerated on
  build) excluded from the dead-export index — the generated file's five type
  exports had pushed the count over the 157 ratchet on any machine that had
  built. Guard now deterministic across environments.
- `fileBudget.test.ts`: `processIntel` was decomposed by the parallel edit
  into `refreshDossier` + `fileScoutReport` helpers — functions >80 lines
  back at the 7-function historical allowance.
- `paramBudget.guard.test.ts`: `RivalIntelLine` accepts an options object
  instead of six destructured props.
