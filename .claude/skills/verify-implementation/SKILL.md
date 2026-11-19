---
name: verify-implementation
description: >-
  Rigorously verify that a claimed-complete change actually works — use whenever
  someone says a feature/plan/PR is "implemented", "done", "fixed", or "tests
  pass", or asks you to verify/confirm/QA a change. Green tests are NOT proof.
  This skill makes you trace the full vertical slice (UI → slice action or
  engineProxy job → engine → store), run independent seeded empirical checks,
  grep for determinism violations, run the FULL suite (not just targeted tests),
  bisect regressions to root cause, and re-confirm your own findings before
  reporting. Use it proactively before claiming any work complete in this repo.
---

# Verify Implementation (brutal honesty)

The job is to find out whether a change **actually does what it claims** — not
whether it compiles, not whether the new tests are green, not whether the author
says it's done. In this codebase, every one of those signals has been wrong
while the feature was broken. Treat "implemented" as a hypothesis to disprove.

## Prime directive: green tests ≠ working feature

A passing suite tells you the code the author chose to test behaves the way the
author chose to assert. It says nothing about whether the test is meaningful,
whether the feature reaches the player, or whether something else regressed.
Verify the **substance**, then trust the tests as a secondary signal.

## The failure classes to hunt

1. **Tautological tests.** A test that asserts properties of a static table or
   constant and never executes the behavior it claims to cover. It passes
   forever and proves nothing. **Counter:** find the test that supposedly covers
   the feature and ask "does this actually run the engine path and observe an
   outcome?" If not, write a real one (see "Independent empirical checks").

2. **Vertical-slice gaps — the feature exists at every layer except the one the
   user touches.** The engine service exists, the slice action exists — but no
   UI control invokes it, so the player can never trigger it. **Counter:** trace
   the slice end-to-end (below). A feature is not done until a real user action
   reaches the engine and a result reaches the screen.

3. **Determinism violations.** `Math.random()`, `Date.now()`, or `crypto.*`
   anywhere in `src/engine`, or a fresh `new SeededRNG(hardcoded)` mid-sim.
   These silently break seed-reproducibility — the engine's core guarantee —
   and the suite stays green. **Counter:** grep (below). Draws come from
   `ctx.rootRng` or a passed rng (`resolveRng` fallback precedent), and choices
   modulate weights _within_ the seeded sequence, never the seed itself.
   Known pre-existing offenders are registered in `docs/MEGAPLAN_BACKLOG.md`
   (e.g. V26-D3 `meta.createdAt`, V26-D4 gazette crypto fallback) — distinguish
   registered debt from new violations.

4. **Two-surface divergence.** This repo certifies behavior on two surfaces
   that do not move together: the **fixture** (identical all-15s warriors) and
   the **world** (real population). A change can pass the fixture and do nothing
   in the world — e.g. a `STYLE_PENALTIES` tweak on a skill that sits on the
   `STYLE_SKILL_FLOORS` clamp. Same trap family: narrated-vs-headless runs
   (narrators draw from an isolated rng — a shared-stream narrator breaks the
   `narrated === headless` gate) and interactive-vs-autosim paths.
   **Counter:** measure on the surface the claim is about — the world, via
   `SNAP=... bun run scripts/world-diag.ts` or a seeded throwaway harness.

5. **Hidden regressions.** A change can pass its own targeted tests while
   breaking a long-horizon or cross-domain test (real incidents: matrix
   symmetrization broke `schedulingAssistant.test.ts`; a lethality change broke
   a knockdown-narration test). **Counter:** always run the FULL fast suite,
   and `bun run test:slow` when sim/pipeline/economy/balance paths are touched.

6. **Your own false positives.** The "bug" is sometimes a mistake in the
   verification: a throwaway harness that doesn't call the function the way
   production does, or a "dead" file that's actually live (check
   `git log --follow` before ever calling something dead code — V26-D2's
   dead `processTierProgression` call was only found by reading the call site).
   **Counter:** before reporting a defect, re-confirm it the way production
   actually exercises the code.

## Verification procedure

Work top to bottom. Don't skip to "run the tests" — that's step 4 of 6.

### 1. See exactly what changed

```bash
git status --short
git log --oneline -10
git diff --stat HEAD~<n>      # n = commits since the work started
```

Read the diff, not just the summary. A deletion you don't understand is a red
flag — investigate before accepting it (`git log --follow -- <path>`).

### 2. Trace the vertical slice for each claimed feature

For a player-facing feature, confirm every hop exists and connects:

- **UI dispatch** — a component calls `useGameStore((s) => s.<action>)` the
  player can actually click. Grep pages/components including children.
- **Action routing** — the action exists in the right slice
  (`src/state/slices/` — `economySlice`, `rosterSlice`, `worldSlice/*Actions`,
  `tournamentSlice`, …) as a `set()` mutation, **or** the work is a heavy sim
  job exposed on `engineProxy` (`src/engine/runtime/workerProxy.ts`) and
  registered in `src/engine/runtime/worker.ts` behind `enqueueSim`.
- **Engine effect** — the action/job calls a real engine fn in
  `src/engine/<domain>/` that produces the change.
- **Result on screen / in state** — worker results land via
  `commitWorkerResult` → `store.loadGame` (`src/state/createStore.ts`); slice
  mutations are committed by `set()`. The change surfaces somewhere the player
  sees it.

If any hop is missing, the feature is incomplete regardless of tests.

### 3. Run independent empirical checks (don't trust the author's assertions)

If a feature claims to _change behavior_ (win-rate, growth, lethality, money),
measure it yourself over a seeded sample rather than reading the table. Write a
throwaway spec in `src/test/...` or a `bunx tsx` script, **call the function
exactly how production calls it**, and observe the distribution — e.g.
`simulateFight` from `src/engine/simulate/simulateFight.ts`, or the balance
harnesses (`bun run scripts/balance-lab.ts`, world confirmation on seeds
12345 / 777 / 2024 — the world-diag convention). Assert direction AND magnitude.
Delete the throwaway when done. If your check disagrees with the author's green
test, suspect _your_ harness first (step 6), then theirs.

### 4. Run the full suite, the build, and determinism greps

```bash
bun run test                                     # FULL fast suite, not just changed files
bun run type-check                               # regens routeTree.gen.ts, then tsc --build --force
bun run build                                    # production build compiles
bun run test:slow                                # when sim/pipeline/economy/balance paths touched
grep -rn "Math.random\|Date.now\|crypto\." src/engine   # must stay free of new hits
```

### 5. If the suite regressed, bisect to root cause — don't guess

A regression that reproduces on clean `HEAD` is real. Find the true cause by
isolation, not inspection:

- Re-run the failing test alone 2-3× to rule out flakiness (the slow tier has
  known flakes-under-load — see BACKLOG §2; re-run clean before assuming a
  regression).
- Revert suspect files to the last-known-good commit
  (`git show <good>:<path> > <path>`), confirm green, restore one file/area at
  a time until it flips.
- Beware shared mechanisms: a frequently-firing new code path can expose a
  latent flaw elsewhere. The trigger and the flaw are both worth naming.

### 6. Re-confirm before you report

Before writing a defect into the report, prove it the way production runs the
code. If you changed files to isolate a cause, restore the working tree
(`git checkout -- <paths>`) and re-confirm on clean HEAD so the report
describes reality, not your experiments.

## Reporting

Be brutally honest and specific. Structure:

- **Verdict line** — does it ship or not, in one sentence.
- **Status table** — per claim: ✅ verified working / ⚠️ partial / ❌ broken,
  each with evidence (a `file.ts:line`, a command + its output, or a measured
  number). No claim without evidence.
- **What's genuinely done** — credit real, end-to-end vertical slices.
- **What's still broken/hollow** — name the failure class, the exact location,
  and why it matters to the player.
- **Own your errors** — retract false positives plainly.
- **Recommended fixes** — concrete, prioritized by effort-to-impact.

Quote evidence verbatim. Vague praise and vague criticism are equally useless.

## This repo's quick reference

- Tests: `bun run test` (vitest fast tier; `*.slow.test.*` excluded),
  `bun run test:slow` (nightly tier), `bun run test:bun` (bun:test parity).
  Fixtures: `src/test/_fixtures/factories.ts`; store/singleton reset sentinels:
  `src/test/_setup/stateReset.test.ts`.
- Action path: zustand slices (`src/state/slices/`) via `useGameStore`; heavy
  sim via `engineProxy` → `src/engine/runtime/worker.ts` jobQueue →
  `commitWorkerResult` in `src/state/createStore.ts`.
- RNG: `SeededRNG` (`src/utils/random.ts`), `ctx.rootRng` in pipeline passes —
  never `Math.random`. Full conventions: `docs/engineering/testing.md`,
  `docs/engineering/rng-policy.md`.
- Balance surfaces: fixture vs world diverge — see the `combat-balance` skill
  before verifying any win-rate claim.
