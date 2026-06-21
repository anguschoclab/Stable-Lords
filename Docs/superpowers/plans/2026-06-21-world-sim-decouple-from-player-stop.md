# Decouple World Simulation from Player Stop-Conditions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the rival world (matchmaking, AI roster management, NPC trait development, promoters, rankings) keep evolving every week even when the **player** is bankrupt or has an empty roster — fixing the bug where a broke player freezes the entire game world.

**Architecture:** `advanceWeek` (`src/engine/pipeline/services/weekPipelineService.ts`) currently short-circuits when the player's treasury crosses `BANKRUPTCY_THRESHOLD` (−500) or the player's roster is empty, running only core impacts + `runWorldPass` and skipping `collectRemainingImpacts` — which contains the **entire** rival-world simulation (`runRivalStrategyPass`, `runPromoterPass`, `runSystemPass`, `runRankingsPass`, `runTrainerPass`, `runPromoterLifecyclePass`). We invert the gate: the WORLD passes always run; only the three **player-facing** passes (`runEventPass`, `runNarrativePass`) — already skipped in headless — additionally skip when the player is in a "stopped" state. This restores the intent stated in `src/engine/matchmaking/worldMatchmaking.ts:13` ("Ensures the world evolves… even without player input").

**Tech Stack:** TypeScript, Bun (`bun`/`bunx` — never npm/node), Vitest. Run tests with `npx vitest run <path>`; typecheck with `bunx tsc --noEmit --project tsconfig.app.json`.

**Scope:** One file of production change (`weekPipelineService.ts`) plus a new integration test. **Non-goal:** a player-recovery/receivership economy (a broke player can still climb out because promoters — a world pass — keep offering them bouts; building an explicit bailout is a separate feature, intentionally out of scope here). Game-over signalling already lives in `TimeAdvanceService.evaluateStopConditions` and is unchanged.

**Pass classification (from code audit — do not re-derive):**
- **WORLD (must always run):** `runWorldPass`, `runSystemPass`, `runRankingsPass`, `runPromoterPass`, `runPromoterLifecyclePass`, `runTrainerPass`, `runRivalStrategyPass`, `runSeasonalPass`.
- **PLAYER-FACING (skip when player stopped OR headless):** `runEventPass`, `runNarrativePass`.
- Rival warrior aging/retirement already runs in `runWarriorPass` (inside `collectCoreImpacts`), which executes on every path — leave it alone.

---

## File Structure

- **Modify** `src/engine/pipeline/services/weekPipelineService.ts` — extend `WeekAdvanceOptions`, rework `advanceWeek`'s stop branch, gate player-facing passes in `collectRemainingImpacts`.
- **Create** `src/test/engine/pipeline/worldEvolvesWhenPlayerStopped.integration.test.ts` — the regression test.

---

## Task 1: Failing regression test — world must evolve while the player is bankrupt/empty

**Files:**
- Create: `src/test/engine/pipeline/worldEvolvesWhenPlayerStopped.integration.test.ts`

This test reproduces the 156-week sim finding: once the player is bankrupt, `state.arenaHistory` stops growing because rival-vs-rival world bouts (created in `runRivalStrategyPass`) never run. It must FAIL against current code and PASS after Task 2.

- [ ] **Step 1: Write the failing test**

`src/test/engine/pipeline/worldEvolvesWhenPlayerStopped.integration.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import { NewsletterFeed } from '@/engine/newsletter/feed';
import type { GameState } from '@/types/state.types';

// OPFS archive is browser-only; mock it exactly as the headless harness does.
vi.mock('@/engine/storage/opfsArchive', () => {
  const m = {
    isSupported: () => true,
    archiveBoutLog: vi.fn().mockResolvedValue(undefined),
    retrieveBoutLog: vi.fn().mockResolvedValue(null),
    archiveGazette: vi.fn().mockResolvedValue(undefined),
    retrieveGazette: vi.fn().mockResolvedValue(null),
    archiveHotState: vi.fn().mockResolvedValue(undefined),
    retrieveHotState: vi.fn().mockResolvedValue(null),
    getArchivedBoutIdsForSeason: vi.fn().mockResolvedValue([]),
  };
  return {
    OPFSArchiveService: class {
      isSupported = m.isSupported;
      archiveBoutLog = m.archiveBoutLog;
      retrieveBoutLog = m.retrieveBoutLog;
      archiveGazette = m.archiveGazette;
      retrieveGazette = m.retrieveGazette;
      archiveHotState = m.archiveHotState;
      retrieveHotState = m.retrieveHotState;
      getArchivedBoutIdsForSeason = m.getArchivedBoutIdsForSeason;
    },
    opfsArchive: m,
    ArchiveConflictError: class extends Error {},
    assertSafeFileNamePart: vi.fn(),
  };
});

function reset() {
  let n = 0;
  setMockIdGenerator(() => `id_${++n}`);
  engineEventBus.clear();
  NewsletterFeed.clear();
}

const totalRivalWarriors = (s: GameState) =>
  s.rivals.reduce((acc, r) => acc + r.roster.length, 0);

describe('world evolves while the player is stopped', () => {
  beforeEach(reset, 120000);

  it('keeps running rival bouts after the player goes bankrupt', () => {
    let state = populateInitialWorld(createFreshState('freeze-fix'), 777);
    state.treasury = -10000; // force the player permanently below BANKRUPTCY_THRESHOLD

    // advance one week so any in-flight offers settle, then measure the baseline
    state = advanceWeek(state, { headless: true });
    const boutsAfterWarmup = state.arenaHistory.length;

    for (let i = 0; i < 8; i++) state = advanceWeek(state, { headless: true });

    // The bug: arenaHistory freezes once bankrupt. The fix: rival-vs-rival
    // world bouts keep firing, so the bout count must grow.
    expect(state.treasury).toBeLessThan(-500); // still bankrupt the whole time
    expect(state.arenaHistory.length).toBeGreaterThan(boutsAfterWarmup);
  }, 120000);

  it('keeps rival rosters alive when the player roster is empty', () => {
    let state = populateInitialWorld(createFreshState('empty-roster'), 778);
    state.roster = []; // player has no warriors

    const before = totalRivalWarriors(state);
    for (let i = 0; i < 8; i++) state = advanceWeek(state, { headless: true });

    // World keeps churning: rivals must still exist and have non-empty rosters.
    expect(state.rivals.length).toBeGreaterThan(0);
    expect(state.rivals.every((r) => r.roster.length > 0)).toBe(true);
    // Rival population should not have collapsed to nothing.
    expect(totalRivalWarriors(state)).toBeGreaterThan(0);
  }, 120000);
});
```

- [ ] **Step 2: Run it — expect the FIRST test to FAIL**

Run: `npx vitest run src/test/engine/pipeline/worldEvolvesWhenPlayerStopped.integration.test.ts`
Expected: the "keeps running rival bouts after the player goes bankrupt" test FAILS — `arenaHistory.length` does not grow because `runRivalStrategyPass` is skipped on the bankruptcy path. (The empty-roster test may already pass partially; that's fine — both must pass after Task 2.)

- [ ] **Step 3: Commit the failing test**

```bash
git add "src/test/engine/pipeline/worldEvolvesWhenPlayerStopped.integration.test.ts"
git commit -m "test(pipeline): world must keep evolving when player is bankrupt/empty (failing)"
```

---

## Task 2: Always run world passes; gate only player-facing passes

**Files:**
- Modify: `src/engine/pipeline/services/weekPipelineService.ts`

The current shape (for reference — lines ~223–250):

```typescript
export function advanceWeek(state: GameState, opts?: WeekAdvanceOptions): GameState {
  const headless = opts?.headless;
  const mutableState = createMutableWeekContext(state);
  const ctx = prepareWeekContext(mutableState);
  buildWeekCaches(mutableState);

  const settledState = runBoutPhase(mutableState, ctx, headless);
  const coreImpacts = collectCoreImpacts(settledState, ctx);

  if (checkBankruptcy(settledState, coreImpacts) || settledState.roster.length === 0) {
    const stopImpacts: StateImpact[] = [
      ...coreImpacts,
      runWorldPass(settledState, ctx.nextWeek, ctx.rootRng),
    ];
    return finalizeState(resolveImpacts(settledState, stopImpacts), state, ctx);
  }

  const stateAfterCore = resolveImpacts(settledState, coreImpacts);
  const remainingImpacts = collectRemainingImpacts(stateAfterCore, ctx, { headless });
  return finalizeState(resolveImpacts(stateAfterCore, remainingImpacts), state, ctx);
}
```

- [ ] **Step 1: Extend `WeekAdvanceOptions`**

Find the interface near the top of the file (lines ~12–15):

```typescript
export interface WeekAdvanceOptions {
  /** Skip UI-facing content generation (newsletters, gazettes) for headless mode */
  headless?: boolean;
}
```

Replace it with:

```typescript
export interface WeekAdvanceOptions {
  /** Skip UI-facing content generation (newsletters, gazettes) for headless mode */
  headless?: boolean;
  /**
   * Player is bankrupt or has an empty roster this week. World passes still run;
   * only player-facing content passes (events, narrative) are skipped. Internal —
   * set by advanceWeek, not by callers.
   */
  playerStopped?: boolean;
}
```

- [ ] **Step 2: Gate player-facing passes in `collectRemainingImpacts`**

Find `collectRemainingImpacts` (lines ~138–161). Replace its body so the player-facing passes skip when the player is stopped (in addition to the existing headless skip). The WORLD passes are unchanged:

```typescript
function collectRemainingImpacts(
  state: GameState,
  ctx: WeekContext,
  opts?: WeekAdvanceOptions
): StateImpact[] {
  // WORLD passes — always run so rivals keep evolving regardless of player state.
  const impacts: StateImpact[] = [
    runWorldPass(state, ctx.nextWeek, ctx.rootRng),
    runSystemPass(state, ctx.rootRng),
    runRankingsPass(state),
    runPromoterPass(state),
    runPromoterLifecyclePass(state, ctx.rootRng),
    runTrainerPass(state, ctx.rootRng),
    runRivalStrategyPass(state, ctx.nextWeek, ctx.rootRng, opts?.headless),
  ];

  // PLAYER-FACING content — skip in headless mode OR when the player is stopped
  // (bankrupt / empty roster): no point generating the player's events & gazette.
  if (!opts?.headless && !opts?.playerStopped) {
    impacts.push(runEventPass(state, ctx.nextWeek, ctx.rootRng));
    impacts.push(runNarrativePass(state, ctx.currentWeek, ctx.nextWeek, ctx.rootRng));
  }

  impacts.push(runSeasonalPass(state, ctx.nextWeek, ctx.rootRng));
  return impacts;
}
```

- [ ] **Step 3: Rework `advanceWeek` to remove the world-skipping short-circuit**

Replace the whole `advanceWeek` body (lines ~223–250) with:

```typescript
export function advanceWeek(state: GameState, opts?: WeekAdvanceOptions): GameState {
  const headless = opts?.headless;

  // Deep clone state once at week boundary to allow safe mutation in all passes
  const mutableState = createMutableWeekContext(state);
  const ctx = prepareWeekContext(mutableState);

  // Build caches once per week for O(1) lookups
  buildWeekCaches(mutableState);

  const settledState = runBoutPhase(mutableState, ctx, headless);
  const coreImpacts = collectCoreImpacts(settledState, ctx);

  // Player stop conditions gate PLAYER content only — the WORLD keeps evolving.
  const playerStopped =
    checkBankruptcy(settledState, coreImpacts) || settledState.roster.length === 0;

  // Stage the pipeline: apply core impacts BEFORE running remaining passes
  const stateAfterCore = resolveImpacts(settledState, coreImpacts);
  const remainingImpacts = collectRemainingImpacts(stateAfterCore, ctx, {
    headless,
    playerStopped,
  });
  return finalizeState(resolveImpacts(stateAfterCore, remainingImpacts), state, ctx);
}
```

> Notes for the engineer: `runWorldPass` ignores its first `_state` argument (signature `runWorldPass(_state, nextWeek, rng)` reads only `nextWeek` + `rng`), so moving it from the old stop-branch into `collectRemainingImpacts` does not change its output. `checkBankruptcy` and `runWorldPass` are already imported and used in this file — no new imports needed. If `StateImpact` was only referenced by the deleted `stopImpacts` array and is now unused, remove its import to keep typecheck clean; if it's used elsewhere in the file, leave it.

- [ ] **Step 4: Run the regression test — expect PASS**

Run: `npx vitest run src/test/engine/pipeline/worldEvolvesWhenPlayerStopped.integration.test.ts`
Expected: both tests PASS. Bankrupt player → `arenaHistory` grows; empty player roster → rivals stay alive.

- [ ] **Step 5: Typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: `0`

- [ ] **Step 6: Guard against regressions in the solvent path**

The solvent path must be byte-for-byte equivalent (previously it ran `collectRemainingImpacts(..., { headless })`; now `{ headless, playerStopped: false }`, which takes the same branches and draws RNG in the same order).

Run: `npx vitest run src/test/integration/weekAdvancement.test.ts src/test/engine/determinism.test.ts`
Expected: green. If `determinism.test.ts` fails, the seed world it uses is solvent and the draw order must be identical — re-check that you did not reorder any pass or add an RNG draw on the solvent path.

- [ ] **Step 7: Commit**

```bash
git add "src/engine/pipeline/services/weekPipelineService.ts"
git commit -m "fix(pipeline): world passes always run; only player content gates on bankruptcy/empty roster"
```

---

## Task 3: Full-suite verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run 2>&1 | tail -6`
Expected: no NEW failures versus the pre-existing baseline. Known-unrelated reds at the time of writing (do not attempt to fix here): `scouting.test.ts`, `Trainers.test.tsx`, `useDigestSummary.test.ts`, `Bookmarks.test.tsx`, `HallOfFame.test.tsx`, `Tournaments.test.tsx`. Everything else must be green, including:
- `src/test/engine/ai/rivalTraitAI.integration.test.ts` (rivals develop traits over a season)
- `src/test/engine/training/traitTraining.integration.test.ts`
- `src/test/integration/weekAdvancement.test.ts`

- [ ] **Step 2: Typecheck once more**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: `0`

- [ ] **Step 3: Final commit (if anything was touched)**

```bash
git add -A
git commit -m "test(pipeline): verify suite green after world-decouple fix" || echo "nothing to commit"
```

---

## Self-Review Notes

- **Inversion, not deletion.** We did not delete the stop condition — we changed what it gates. Player-facing content still skips when the player is broke/empty; the world simulation no longer does.
- **`runWorldPass` move is safe.** It ignores `_state`, so relocating it into `collectRemainingImpacts` changes nothing about its output; it now runs once per week on every path (previously once on each path too).
- **Aging untouched.** Rival aging/retirement lives in `runWarriorPass` (core impacts), which always ran and still does — so the year-3 retirements observed in the sim continue, but now refilling/recruiting (in `runRivalStrategyPass`) also runs, so rosters no longer bleed out unreplenished.
- **Determinism.** The solvent path takes identical branches and RNG draws; only the bankrupt/empty path changes (intended).

## Verification

1. `worldEvolvesWhenPlayerStopped.integration.test.ts` → both tests green (bankrupt world keeps fighting; empty-player world keeps rivals alive).
2. `weekAdvancement.test.ts` + `determinism.test.ts` → green (solvent path unchanged).
3. `rivalTraitAI.integration.test.ts` → still green.
4. `bunx tsc …` → 0; full `npx vitest run` → no new failures.
