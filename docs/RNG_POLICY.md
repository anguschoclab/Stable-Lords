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
