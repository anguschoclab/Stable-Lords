# Emergent-Sim Regression Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A permanent long-horizon (104-week) headless-sim regression test that asserts the world stays _alive_ — bouts keep happening, rival rosters don't collapse, mortality sits in a sane band, and traits keep emerging — so the "bankrupt player freezes the world" class of bug (and future freezes) can never ship undetected again. It also re-measures trait/churn dynamics on an _unfrozen_ world, producing the numbers Plan 3 tunes against.

**Architecture:** Extend the existing `SimPulse` metric snapshot (`src/engine/stats/simulationMetrics.ts`) with trait/mortality fields, then add a Vitest integration test that runs the existing headless harness (`runSimulation` in `src/scripts/simulation-harness.ts`) for 104 weeks with `ignoreBankruptcy: true` and asserts world-liveness invariants on the resulting pulses + final state. The harness and OPFS-mock pattern already exist (`src/scripts/simulation.test.ts`); we reuse them.

**Tech Stack:** TypeScript, Bun (`bun`/`bunx` — never npm/node), Vitest. Tests: `npx vitest run <path>`. Typecheck: `bunx tsc --noEmit --project tsconfig.app.json`.

**Scope:** Pure metrics extension + one integration test. **Depends on** the world-decouple fix (`2026-06-21-world-sim-decouple-from-player-stop.md`) being merged first — without it, the liveness assertions are _expected_ to fail (that is the bug this harness guards). No production-behavior change.

---

## File Structure

- **Modify** `src/engine/stats/simulationMetrics.ts` — add trait/mortality fields to `SimPulse` and populate them in `collectPulse`.
- **Modify** `src/test/engine/stats/simulationMetrics.test.ts` — cover the new fields.
- **Create** `src/test/engine/sim/worldLiveness.integration.test.ts` — the 104-week liveness regression test.

---

## Task 1: Enrich `SimPulse` with trait & mortality metrics (TDD)

**Files:**

- Modify: `src/engine/stats/simulationMetrics.ts`
- Modify: `src/test/engine/stats/simulationMetrics.test.ts`

The current `SimPulse` (lines 8–17) tracks `week, playerTreasury, rosterSize, deadCount, retiredCount, rivalCount, avgRivalTreasury, totalBouts`. We add world-wide trait/flaw counts so liveness and trait-emergence can be asserted from a pulse.

- [ ] **Step 1: Write the failing test**

Append to `src/test/engine/stats/simulationMetrics.test.ts` (create the file with this content if it does not exist):

```typescript
import { describe, it, expect } from 'vitest';
import { collectPulse } from '@/engine/stats/simulationMetrics';
import type { GameState } from '@/types/state.types';

// Minimal state shim — only the fields collectPulse reads.
function fakeState(over: Partial<GameState> = {}): GameState {
  return {
    week: 5,
    treasury: 1000,
    roster: [
      { id: 'p1', traits: ['quick'] },
      { id: 'p2', traits: ['fragile', 'slow'] }, // 2 flaws
    ],
    graveyard: [],
    retired: [],
    arenaHistory: [{}, {}, {}],
    rivals: [
      { treasury: 2000, roster: [{ id: 'r1', traits: ['living_wall'] }] },
      { treasury: 500, roster: [{ id: 'r2', traits: [] }] },
    ],
    ...over,
  } as unknown as GameState;
}

describe('collectPulse trait/mortality metrics', () => {
  it('counts traited warriors, total traits, flaws, and multi-flaw warriors world-wide', () => {
    const p = collectPulse(fakeState());
    // player p1(quick) + p2(fragile,slow) + rival r1(living_wall) = 3 traited
    expect(p.traitedWarriors).toBe(3);
    // 1 + 2 + 1 = 4 total trait instances
    expect(p.totalTraits).toBe(4);
    // fragile + slow are flaws → 2 flaw instances
    expect(p.flawInstances).toBe(2);
    // p2 has 2 flaws → 1 multi-flaw warrior
    expect(p.multiFlawWarriors).toBe(1);
    // living_wall is a class-restricted (styles) trait → 1 class trait, Signature tier
    expect(p.classTraitInstances).toBeGreaterThanOrEqual(1);
    expect(p.signatureInstances).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `npx vitest run src/test/engine/stats/simulationMetrics.test.ts`
Expected: FAIL — `traitedWarriors` and the other fields don't exist yet.

- [ ] **Step 3: Extend `SimPulse` and `collectPulse`**

In `src/engine/stats/simulationMetrics.ts`, add the import and fields. Replace the `SimPulse` interface (lines 8–17) with:

```typescript
import type { GameState } from '@/types/state.types';
import { TRAITS } from '@/engine/traits';

/**
 * Defines the shape of sim pulse.
 */
export interface SimPulse {
  week: number;
  playerTreasury: number;
  rosterSize: number;
  deadCount: number;
  retiredCount: number;
  rivalCount: number;
  avgRivalTreasury: number;
  totalBouts: number;
  // ─── Trait / churn emergence (world-wide: player + all rivals) ───
  traitedWarriors: number;
  totalTraits: number;
  flawInstances: number;
  multiFlawWarriors: number;
  classTraitInstances: number;
  signatureInstances: number;
}
```

> Note: the file already imports `GameState`; if so, do not duplicate the import — just add the `TRAITS` import.

Then replace the `collectPulse` body (lines 22–39) with:

```typescript
/**
 * Collect a snapshot of metrics from the current game state.
 */
export function collectPulse(state: GameState): SimPulse {
  const activeRivals = state.rivals || [];
  const avgRivalTreasury =
    activeRivals.length > 0
      ? activeRivals.reduce((sum, r) => sum + r.treasury, 0) / activeRivals.length
      : 0;

  // World-wide trait accounting: player roster + every rival roster.
  const allWarriors = [...state.roster, ...activeRivals.flatMap((r) => r.roster)];
  let traitedWarriors = 0;
  let totalTraits = 0;
  let flawInstances = 0;
  let multiFlawWarriors = 0;
  let classTraitInstances = 0;
  let signatureInstances = 0;
  for (const w of allWarriors) {
    const ids = w.traits ?? [];
    if (ids.length > 0) traitedWarriors++;
    totalTraits += ids.length;
    let flawsOnW = 0;
    for (const id of ids) {
      const t = TRAITS[id];
      if (!t) continue;
      if (t.tier === 'Flaw') {
        flawInstances++;
        flawsOnW++;
      }
      if (t.tier === 'Signature') signatureInstances++;
      if (t.styles && t.styles.length > 0) classTraitInstances++;
    }
    if (flawsOnW >= 2) multiFlawWarriors++;
  }

  return {
    week: state.week,
    playerTreasury: state.treasury,
    rosterSize: state.roster.length,
    deadCount: state.graveyard.length,
    retiredCount: state.retired.length,
    rivalCount: activeRivals.length,
    avgRivalTreasury: Math.round(avgRivalTreasury),
    totalBouts: state.arenaHistory.length,
    traitedWarriors,
    totalTraits,
    flawInstances,
    multiFlawWarriors,
    classTraitInstances,
    signatureInstances,
  };
}
```

- [ ] **Step 4: Run the test — expect PASS + typecheck**

Run: `npx vitest run src/test/engine/stats/simulationMetrics.test.ts` → PASS.
Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.

> If `formatPulseTable` (later in the file) breaks typecheck because the `SimPulse` shape changed, it won't — it only reads the original fields. Leave it as-is.

- [ ] **Step 5: Commit**

```bash
git add "src/engine/stats/simulationMetrics.ts" "src/test/engine/stats/simulationMetrics.test.ts"
git commit -m "feat(metrics): SimPulse tracks world-wide trait, flaw, class & signature counts"
```

---

## Task 2: 104-week world-liveness regression test

**Files:**

- Create: `src/test/engine/sim/worldLiveness.integration.test.ts`

This is the guard. It runs the headless harness for 104 weeks with bankruptcy stops disabled, then asserts the world never froze and the population stayed healthy. The thresholds are deliberately _loose_ (catch a freeze/collapse, not micro-balance — that's Plan 3's job).

- [ ] **Step 1: Write the test**

`src/test/engine/sim/worldLiveness.integration.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runSimulation } from '@/scripts/simulation-harness';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import { NewsletterFeed } from '@/engine/newsletter/feed';

// OPFS archive is browser-only; mock it exactly as the headless harness test does.
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

describe('world liveness over a long sim (104 weeks)', () => {
  beforeEach(reset, 300000);

  it('never freezes: bouts keep happening through the back half of the run', () => {
    const { pulses } = runSimulation({
      weeks: 104,
      seed: 4242,
      logFrequency: 4, // a pulse every 4 weeks
      ignoreBankruptcy: true, // keep advancing even if the player goes broke
    });

    expect(pulses.length).toBeGreaterThan(10);
    const mid = pulses[Math.floor(pulses.length / 2)];
    const end = pulses[pulses.length - 1];

    // FREEZE GUARD: total bouts must keep climbing in the second half of the run.
    // Pre-fix, this is flat (the world froze once the player went bankrupt).
    expect(end.totalBouts).toBeGreaterThan(mid.totalBouts);
  }, 300000);

  it('rival population stays alive and does not monotonically bleed out', () => {
    const { finalState, pulses } = runSimulation({
      weeks: 104,
      seed: 4242,
      logFrequency: 4,
      ignoreBankruptcy: true,
    });

    // Every rival stable still fields warriors at the end (recruiting refills churn).
    expect(finalState.rivals.length).toBeGreaterThan(0);
    expect(finalState.rivals.every((r) => r.roster.length > 0)).toBe(true);

    const totalRivalWarriors = finalState.rivals.reduce((s, r) => s + r.roster.length, 0);
    // World started ~350+ rival warriors; a healthy world keeps a large standing
    // population. A collapse (the unrefilled-bleed symptom) would drop far below this.
    expect(totalRivalWarriors).toBeGreaterThan(150);

    // Deaths should accumulate (combat is lethal sometimes) but not exterminate.
    const end = pulses[pulses.length - 1];
    expect(end.deadCount).toBeGreaterThan(0);
  }, 300000);

  it('traits keep emerging across the world', () => {
    const { pulses } = runSimulation({
      weeks: 104,
      seed: 4242,
      logFrequency: 4,
      ignoreBankruptcy: true,
    });
    const end = pulses[pulses.length - 1];

    // A meaningful share of the world carries traits (births + development).
    expect(end.traitedWarriors).toBeGreaterThan(0);
    expect(end.totalTraits).toBeGreaterThan(0);
    // Some flaws exist in the world (births + training botches).
    expect(end.flawInstances).toBeGreaterThan(0);
  }, 300000);
});
```

> Why `ignoreBankruptcy: true`: `runSimulation` (in `src/scripts/simulation-harness.ts`) has a stop condition that breaks the loop if the _player_ goes bankrupt/empty; we disable it so the loop runs the full 104 weeks and we can observe the _world_. The harness's headless auto-accept of player offers is already built in.

- [ ] **Step 2: Run it**

Run: `npx vitest run src/test/engine/sim/worldLiveness.integration.test.ts`
Expected (with the world-decouple fix from the prior plan merged): all three tests PASS.

If the "never freezes" test FAILS with `end.totalBouts` equal to `mid.totalBouts`, the world-decouple fix (`2026-06-21-world-sim-decouple-from-player-stop.md`) is not in place — that fix is a hard dependency. Confirm `advanceWeek` no longer short-circuits world passes before tuning thresholds.

- [ ] **Step 3: Record the measured baseline (for Plan 3)**

Add a non-asserting diagnostic so the trait/churn numbers are visible in CI logs and Plan 3 can calibrate against them. Append this test to the same file:

```typescript
describe('world liveness — measured baseline (diagnostic, no hard assert)', () => {
  beforeEach(reset, 300000);

  it('logs end-of-run trait & churn metrics', () => {
    const { pulses, finalState } = runSimulation({
      weeks: 104,
      seed: 4242,
      logFrequency: 4,
      ignoreBankruptcy: true,
    });
    const end = pulses[pulses.length - 1];
    const all = [...finalState.roster, ...finalState.rivals.flatMap((r) => r.roster)];
    // eslint-disable-next-line no-console
    console.log(
      `[liveness] week=${end.week} bouts=${end.totalBouts} dead=${end.deadCount} ` +
        `traited=${end.traitedWarriors}/${all.length} totalTraits=${end.totalTraits} ` +
        `flaws=${end.flawInstances} multiFlaw=${end.multiFlawWarriors} ` +
        `classTraits=${end.classTraitInstances} signature=${end.signatureInstances}`
    );
    expect(end.week).toBeGreaterThan(0);
  }, 300000);
});
```

- [ ] **Step 4: Typecheck + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`

```bash
git add "src/test/engine/sim/worldLiveness.integration.test.ts"
git commit -m "test(sim): 104-week world-liveness regression harness (freeze + collapse guard)"
```

---

## Task 3: Full-suite verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full suite**

Run: `npx vitest run 2>&1 | tail -6`
Expected: the new tests green; no new failures elsewhere (same known-unrelated reds as the prior plan: `scouting`, `Trainers`, `useDigestSummary`, `Bookmarks`, `HallOfFame`, `Tournaments`).

- [ ] **Step 2: Commit if needed**

```bash
git add -A && git commit -m "test(sim): verify suite green after liveness harness" || echo "nothing to commit"
```

---

## Self-Review Notes

- **Loose on purpose.** The asserts catch _freezes and collapses_, not balance. `end.totalBouts > mid.totalBouts` is the precise inverse of the observed bug (bouts froze at 843). The population floor (`> 150`) is well under a healthy standing population (~350) so normal churn never trips it.
- **Re-uses existing infra.** No new harness — `runSimulation` + the OPFS mock + the headless auto-accept already exist. We only enriched the pulse and added asserts.
- **Feeds Plan 3.** The diagnostic log surfaces `classTraits`, `signature`, and `multiFlaw` on an _unfrozen_ world. Plan 3 reads those to decide whether class/Signature reachability and multi-flaw churn need mechanism fixes, then tightens these asserts.
- **Determinism.** Fixed seed (4242) makes the run reproducible; if it ever flakes, the harness — not the test — is non-deterministic and should be investigated.

## Verification

1. `simulationMetrics.test.ts` → new trait/flaw fields green.
2. `worldLiveness.integration.test.ts` → freeze guard, population floor, and trait-emergence all green (with the decouple fix merged).
3. Diagnostic line printed in logs with class/Signature/multi-flaw counts.
4. `bunx tsc …` → 0; full suite → no new failures.
