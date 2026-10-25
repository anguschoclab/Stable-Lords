---
name: week-pipeline
description: Add or modify a weekly pipeline pass — the GameState-week-advancement engine. Use whenever a task adds a mechanic that runs during week advancement (training ticks, economy ticks, AI decisions, narrative generation, championship logic), touches src/engine/pipeline/passes/, or needs a new pass wired into the DAG. Covers the WeekPassSpec contract (stage/writes/after/playerFacing), StateImpact merging, and the guard tests that gate ordering and purity.
---

# week-pipeline

Week advancement is a staged, declarative pipeline — not a sequence of function
calls. Almost every "runs every week" mechanic is a pass, and the pipeline's
invariants are enforced by tests, not convention.

## The contract — `src/engine/pipeline/pipelineStages.ts`

Every pass is a `WeekPassSpec`:

| Field           | Meaning                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------- |
| `id`            | Unique pass name                                                                          |
| `stage`         | `'core'` → `'world'` → `'content'` — resolves in that order                              |
| `run`           | `(state, ctx) => StateImpact \| Promise<StateImpact>` — reads the shared stage snapshot  |
| `writes`        | Declared `StateImpact` keys the pass may write — validated                              |
| `after`         | Pass ids that must resolve earlier (ordering constraints, enforced)                     |
| `playerFacing`  | Skipped when headless or playerStopped — set this for UI/newsletter-only output         |

Passes in the same stage all read the **same snapshot** — a pass never sees
another same-stage pass's writes. Impacts merge in declaration order.

## The rules that get you

- **Two passes in one stage may not `replace`-write the same StateImpact key.**
  It silently clobbers (real bug: Progression vs Narrative both writing
  `gazettes`). `append`/`accumulate`/`mapMerge`/`dictMerge` collisions are fine.
- **Mutating `state` directly is forbidden** — passes return impacts. The
  `mutableInput` and `passPurity` tests catch writes into the snapshot.
- **Ordering is explicit** — if your pass consumes what another pass produces,
  declare `after`. (RecruitmentPass→RivalStrategyPass: the draft pool must be
  refilled before the AI draft drains it.)
- **RNG comes from `ctx.rootRng`** — never `Math.random()` or `new SeededRNG`
  with a fresh seed inside a pass; determinism tests gate this.
- **Headless runs skip `playerFacing` passes** — narrative/UI effects must not
  carry mechanical state.

## Adding a mechanic

1. Write a pure-ish pass module in `src/engine/pipeline/passes/` (precedent:
   `TrainerPass.ts`, `EconomyPass.ts`). Return a `StateImpact`; merge helpers
   live in `src/engine/impacts`.
2. Register a `WeekPassSpec` in `pipelineStages.ts` — pick the right stage:
   `core` = mechanical state first, `world` = world/AI that depends on it,
   `content` = player-facing output last.
3. Declare `writes` honestly — the validator and `passPurity` check them.
4. Test: fixture-driven unit test in `src/test/engine/pipeline/passes/`
   asserting the returned impact.

## Gate tests (run after any pass change)

```bash
bun run test --reporter=verbose src/test/engine/pipeline/weekPipelineDAG.test.ts src/test/engine/pipeline/passOrdering.test.ts src/test/engine/pipeline/passPurity.test.ts src/test/engine/pipeline/impactMergeOrder.test.ts src/test/engine/pipeline/mutableInput.test.ts
```

## Notes

- `WeekPipelineContext` carries `currentWeek`, `nextWeek`, `nextYear`,
  `rootRng`, `headless`, and `pool` (shard pool — treat absence as "run in-line").
- Rival-stable work parallelizes through `rivalStableShard` — shard output must
  be deterministic (`shardInputSize`/`parallelDeterminism` tests).
- The offseason boundary (week 1) is SeasonalPass territory — see the
  offseason-event skill for adding events there.
