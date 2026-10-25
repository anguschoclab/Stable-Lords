---
name: determinism-debug
description: Debug seed/ determinism regressions in the Stable Lords seeded simulation. Use whenever "same seed different result", a determinism test flakes, narrated-vs-headless outcomes diverge, parallel/shard runs disagree, a data-pool edit changes unrelated seeded output, or you're touching SeededRNG, RNG consumption order, or anything that must reproduce bit-for-bit from a seed.
---

# determinism-debug

The whole sim is a seeded function — same seed must produce identical state.
Determinism failures are almost never "RNG is broken"; they're **consumption**
bugs: something changed the number, order, or shape of RNG draws.

## Where RNG lives

- `SeededRNG` (`src/utils/random.ts`) implements `IRNGService` — `next()`,
  `pick()`, `roll()`, `uuid()`, `shuffled()`, `rollWeighted()`.
- `resolveRng(rng, fallbackSeed)` normalizes optional rng params.
- Passes draw from `ctx.rootRng` (see week-pipeline skill). Sub-systems get
  seeded children — never instantiate `new SeededRNG(hardcoded)` mid-sim.
- Narration draws from an **isolated** narration RNG — that's the whole point
  of `narrationDeterminism.test.ts` (narrated === headless).

## The usual suspects, in order

1. **Pool/array length changed.** `randomPick` draws one index — removing or
   adding an entry shifts every downstream draw. Deduping narrative strings,
   adding an offseason event, or growing a name pool will *legitimately*
   change seeded picks; characterization tests flag it, it's usually fine.
2. **New unconditional draw.** A `rng.next()` added on a hot path consumes a
   value every other consumer expected. Gate new draws behind the same
   condition shape as neighbors, or draw from a dedicated sub-RNG.
3. **Iteration-order dependence.** `Object.keys`, `Map`, `Set` ordering —
   object key order is insertion order. Sort before iterating in sim code
   (precedent: `selectGrandChampionshipField` sorts arenaIds pre-shuffle).
4. **Narration leaking into mechanics.** Any `rng` call inside a narrator that
   shares the mechanical stream. Narrators get their own rng — check the call.
5. **Environment leak.** `Math.random()`, `Date.now()`, `crypto.randomUUID()`
   inside sim code. Grep the diff for them first — it's cheap.
6. **Shard/pool nondeterminism.** Parallel rival-stable work must reduce
   deterministically — `shardInputSize` and `parallelDeterminism` gate it.

## Triage loop

```bash
# 1. Which layer broke?
bun run test --reporter=verbose src/test/engine/determinismAudit.test.ts src/test/engine/combat/resolutionDeterminism.test.ts src/test/engine/narrative/narrationDeterminism.test.ts src/test/engine/pipeline/offseasonDeterminism.test.ts

# 2. Slow-tier characterization (week-scale repro)
bun run test:slow src/test/engine/sim/determinism.slow.test.ts src/test/engine/weekDeterminism.slow.test.ts src/test/engine/pipeline/parallelDeterminism.slow.test.ts
```

3. **Bisect by seed, then by week.** A seed that diverges at week N but not
   N−1 localizes the offending pass to that week's events — check what fired
   (offseason boundary? tournament week? recruitment refresh?).
4. **Diff the impact, not the state.** Two runs diverging in a single
   StateImpact key points at the writing pass far faster than a full-state diff.

## Notes

- Characterization tests encode *current* behavior as truth — a legit content
  change (new event, deduped pool) updating expected characterization output
  is the suite working as designed; re-baseline only after confirming the
  *mechanical* stream is stable.
- `hashStr` seeds per-entity draws — renaming an entity changes its stream.
- JS object key order is deterministic but insertion-order-dependent —
  different construction order = different iteration = different draws.
