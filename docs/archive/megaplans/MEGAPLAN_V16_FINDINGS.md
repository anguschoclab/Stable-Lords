# MEGAPLAN V16 FINDINGS — Validated Audit (3 source-read rounds)

## Approved (verified in code)

- **A1 — Avatars fully wired.** `avatarSeed` set in every creation path (rival owner/warrior factories, recruit generators, pool signings, veteran patches, founder-trainers). Cache invalidation on removal + age-bracket change. `avatarCache` persisted.
- **A2 — New traits AI-reachable.** No `styles` restriction → `generateTraits` rolls them for AI warriors.
- **A3 — Event feed honest.** `collectEvents` fully derived; every live `EventType` categorized.
- **A4 — Search/breadcrumbs wired.** `#global-search-input` + `/` shortcut live; routes registered; trail resets on `playerId`.
- **A5 — AI intel id-keyed.** `planMasked` decoy feeds `possiblyMaskedPlan` in reports and `AIDebugDrawer`.
- **A6 — Privacy holds.** `narrowRivalShardState` (rivalStableShard.ts:114) zeroes `scoutReports`; `agentMemory` survives narrowing.
- **A7 — All five `weatherSuitability` exports have live callers** (`committee.ts:85`, `boutBidding/generation.ts:324`, `boutAcceptance/*`, `intentEngine/{skepticism,context}.ts`).
- **A8 — `'Trait'` is schema-legal** (`InsightTokenType` + `InsightTokenSchema`); `insightTokens` persisted (gameStateSchema.ts:177).
- **A9 — `processIntel` determinism.** `(rival, state, _perception?)` — jitter via `hashStr` only; `SeededRNG(hashStr(...))` fits.
- **A10 — `stableId` survives death** (`retireToGraveyard` spreads `...victim`).
- **A11 — Weather timing.** Acceptance evaluates next tick under correct bout-week weather; bid-_priority_ modifier is one week stale (pre-existing, out of scope).

## Corrected draft claims

- **C1 — `findWarriorById` has 19 caller files** (advisor, intelDossier, arenaChampionship×6, championsTournament, tournamentSelection, awards, resolution, weekPipeline/caches, simulationMetrics, stateInvariants, ArenaCircuit, useArenaDetail).
- **C2 — `getWarriorIndex` has test consumers** (`entityIndex.mutation.test.ts`, `buildWarriorMapDivergence.test.ts`) — stays. Its map covers dead+retired → F1 needs a NEW `livingWarriorById` gated on Yours/Rival buckets.
- **C3 — `entityIndex` WeakMap is already per-context** — same `let` idiom as `warriorLookup`; porting the contract doc is documentation.
- **C4 — `newInsights` never consumed** — `useScouting.ts:37` destructures `{ report }` only (pre-existing).
- **C5 — Parity-test nuance** — widening `ALL_WEATHER` to the full union requires Cursed Eclipse rules in the test's local legacy fns (they become intended-behavior tables).
- **C6 — `processIntel` signature is `(rival, state, _perception?)`** — RNG constructed inside, not passed.
- **C7 — `OpponentDossier` is stable-keyed** with `planIntel`/`knownStyles`/`observedTells` — override target is `planIntel`, not `effectivePlanBias`.
- **C8 — `'recruit'` EventType dead** — zero `type:'recruit'` producers; `category:'recruit'` is a different field — do not touch.

## New findings

- **F3b — Scout→insight pipeline dead.** `generateScoutReport` returns `newInsights` (Style always; Attribute Detailed+; Tactic Expert; Trait per suspected trait); `purchaseScoutReport` discards them while `consumeInsightToken`/`InsightManager` exist.
- **F3c — Trait tokens dead-on-consume.** `applyInsightToken` chain ends at `'Tactic'` (no `'Trait'` case → no-op); `resolveInsightResult` returns `'Unknown'`.
- **F3d — `ScoutReport`↔`ScoutReportData` drift.** Internal: plain-string ids, `attributeRanges: Record<string,string>`, HAS `suspectedTraits`. Persisted: branded ids, `Partial<Record<keyof Attributes,string>>`, NO `suspectedTraits` → silently dropped on save (`useScouting.ts:41` casts over the gap).
- **F3e — Schema touch-points.** `AIAgentMemorySchema` (economySchemas.ts:202) + `OpponentDossierSchema` (:173) + `ScoutReportDataSchema` (:262) each need one new optional field.
- **SuspectedOE/AL semantics.** `getSuspectedPlanTendencies` emits bands ('High'|'Medium'|'Low') only at Expert quality → band-override of `planIntel` is inherently Expert-gated. `suspectCompetence`: Expert → real, Detailed → ±1 drift, Basic → undefined.
