# RNG Policy

`Math.random` is banned repo-wide — enforced by ESLint (`no-restricted-properties`)
and by `src/test/engine/determinismAudit.test.ts`. Never add it back.

## Rules

1. **Engine / pipeline code must accept an `IRNGService`** (see
   `src/engine/core/rng/IRNGService.ts`). When the parameter is optional, resolve
   it with `resolveRng(rng, seed)` from `src/utils/random.ts`, passing the same
   context-derived seed the call site has always used (e.g.
   `state.week * 881 + 17`). Seed expressions are load-bearing: changing one
   changes generated content — the `*.slow.test.ts` determinism suite will catch it.

2. **`src/utils/random.ts` is the only file allowed to construct fallback RNGs
   inline.** Everywhere else, `x || new SeededRNG(...)` / `x ?? new SeededRNG(...)`
   is flagged by the determinism audit — route through `resolveRng` or
   `entropyRng` instead.

3. **Contexts that intentionally want non-reproducible variety** (name
   generators, recruit/orphan pools, visual effects, one-off UI randomness) use
   `cryptoRandom` / `cryptoRandomInt` (`src/utils/cryptoRandom.ts`) or
   `entropyRng()`. These are cryptographically secure but non-deterministic —
   never use them on a determinism-sensitive path (simulation, replay, tests).

4. **Tests never use `Math.random`.** Use `SeededRNG`/`SeededRNGService`, a
   deterministic mock, or a counter — the audit test fails otherwise.

## Helpers

| Helper | Location | Use |
|---|---|---|
| `SeededRNG` / `SeededRNGService` | `src/utils/random.ts` | Deterministic Mulberry32 PRNG (implements `IRNGService`) |
| `resolveRng(rng, seed)` | `src/utils/random.ts` | Optional-rng resolution with deterministic seeded fallback |
| `entropyRng()` | `src/utils/random.ts` | `IRNGService` seeded from crypto entropy |
| `cryptoRandom` / `cryptoRandomInt` | `src/utils/cryptoRandom.ts` | CSPRNG float in [0,1) / int in [min,max] |
| `generateId(rng?, prefix?)` | `src/utils/idUtils.ts` | UUID via `crypto.randomUUID` / `getRandomValues` / seeded rng |

## Seed-scheme table (determinism-critical)

These seed expressions are the pipeline's determinism contract. They are
load-bearing — shard workers and the in-line path must compute identical
streams — so a change is a content change and the `*.slow.test.ts`
determinism suite (`determinism`, `parallelDeterminism`) will catch drift.

| Consumer | Seed expression | Location |
|---|---|---|
| Week root rng | `nextYear * 52 + nextWeek * 7919 + 101` | `pipeline/services/weekPipelineService.ts` (`prepareWeekContext`) |
| Tournament day | `tournamentDaySeed(year, week, day)` = `year * 10000 + week * 100 + day` | `pipeline/tick/TickOrchestrator.ts` — shared by `advanceDay` and `skipToWeekEnd` |
| Bout resolution | `hashStr(`${absoluteWeek}|${aId}|${dId}`)` | `bout/services/boutResolution.ts` |
| Rival strategy (shard-safe) | `absoluteWeek * 31 + index * 997 + owner.id.length` | `pipeline/passes/rivalStableShard.ts` |
| Rival shard intel rng | `strategySeed + 123` | `pipeline/passes/rivalStableShard.ts` |
| Rival succession (bankruptcy) | `absoluteWeek + index * 1000` | `pipeline/passes/rivalStableShard.ts` |
| Rival roster mgmt | `absoluteWeek * 13 + 7` | `pipeline/passes/RivalStrategyPass.ts` |
| Week gazette flavor | `absoluteWeek * 9973 + 123` | `bout/services/WeekFinalizationService.ts` |
| Week side-effects rng | `absoluteWeek * 13` | `bout/services/WeekFinalizationService.ts` |
| System-pass floor rng | `state.week * 6151 + 29` | `pipeline/passes/SystemPass.ts` |
| Tier progression fallback | `hashStr(createdAt) + state.week` | `pipeline/core/tierProgression.ts` |

### Identity-dependent seeds

Bout seeds hash warrior **ids** — any change to how ids are generated is a
seed change. `generateId()` without an rng and `crypto.randomUUID()` produce
non-deterministic ids and are banned on simulation paths; generated rival
warriors derive uuids from the seeded rng (`rivalWarriorFactory` delegates
`rngWrapper.uuid` to `rng.uuid`). Tests install `setMockIdGenerator` to keep
`generateId` call-order deterministic.

### Shard determinism

Shard seeds must be **position-independent**: `index`-derived seeds use the
rival's index in the week's stable ordering (fixed before dispatch), never a
chunk-local index or worker id. `hashStr`-based bout seeds depend only on
immutable ids and the absolute week, so chunk boundaries are invisible to
the output.
