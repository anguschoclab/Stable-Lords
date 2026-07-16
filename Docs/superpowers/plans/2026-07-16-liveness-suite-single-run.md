# Liveness Suite Single-Run Implementation Plan (T1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut the world-liveness regression suite from ~445s to ~80s by running the deterministic 104-week simulation **once** and sharing the result across all six tests, instead of re-running the identical sim per test.

**Architecture:** Every test in `src/test/engine/sim/worldLiveness.integration.test.ts` calls `runSimulation({ weeks: 104, seed: 4242, ignoreBankruptcy: true, … })` — the same deterministic config (one test uses `logFrequency: 2`, the rest `4`). We hoist a single run into a `beforeAll` at the finest granularity any test needs (`logFrequency: 2`) and let all assertions read the shared `{ pulses, finalState }`. The sim is seeded and side-effect-free apart from the global ID/event-bus state, which we reset once before the single run.

**Tech Stack:** TypeScript, Bun (`bun`/`bunx` — never npm/node), Vitest. Tests: `npx vitest run <path>`. Typecheck: `bunx tsc --noEmit --project tsconfig.app.json`.

**Scope:** One test file rewritten. Zero production code changes. All existing assertions are preserved verbatim — only the plumbing changes. Baseline measured 2026-07-16: 6 tests × ~73s = 445.53s total; the `[vitest-worker]: Timeout calling "onTaskUpdate"` unhandled-error noise comes from the repeated long-running tests and disappears with the single run.

**Grounded facts (do not re-derive):**
- File: `src/test/engine/sim/worldLiveness.integration.test.ts` (~146 lines, two `describe` blocks, six tests). Each test independently calls `runSimulation` and a `beforeEach(reset)` re-seeds `setMockIdGenerator`, clears `engineEventBus` and `NewsletterFeed`.
- `runSimulation` (`src/scripts/simulation-harness.ts`) is synchronous and deterministic given `seed`; `logFrequency: N` pushes a pulse every N weeks, so `logFrequency: 2` is a strict superset of the pulses `logFrequency: 4` produces (assertions only index `pulses[mid]`/`pulses[length-1]`, which remain valid).
- The OPFS mock block at the top of the file is required (browser-only API) — keep it untouched.

---

## File Structure

- **Modify** `src/test/engine/sim/worldLiveness.integration.test.ts` — single shared run; assertions unchanged.

---

## Task 1: Rewrite the suite around one shared run

**Files:**
- Modify: `src/test/engine/sim/worldLiveness.integration.test.ts`

- [ ] **Step 1: Capture the current green baseline**

Run: `npx vitest run src/test/engine/sim/worldLiveness.integration.test.ts 2>&1 | tail -5`
Expected: 6 passed, total duration in the 400–460s range. Note the exact duration — you will compare after.

- [ ] **Step 2: Rewrite the file**

Replace the two `describe` blocks and the `reset` plumbing (keep the `vi.mock('@/engine/storage/opfsArchive', …)` block at the top of the file exactly as-is, and keep all imports) with the following structure. Every `expect` line is copied verbatim from the current file — do not weaken or strengthen any assertion:

```typescript
function reset() {
  let n = 0;
  setMockIdGenerator(() => `id_${++n}`);
  engineEventBus.clear();
  NewsletterFeed.clear();
}

// ONE deterministic run shared by every test below. logFrequency 2 is the finest
// granularity any assertion needs (the multi-flaw test samples often to catch
// transient 2-flaw warriors before the cull removes them).
let shared: ReturnType<typeof runSimulation>;

beforeAll(() => {
  reset();
  shared = runSimulation({
    weeks: 104,
    seed: 4242,
    logFrequency: 2,
    ignoreBankruptcy: true, // keep advancing even if the player goes broke
  });
}, 600000);

describe('world liveness over a long sim (104 weeks, single shared run)', () => {
  it('never freezes: bouts keep happening through the back half of the run', () => {
    const { pulses } = shared;
    expect(pulses.length).toBeGreaterThan(10);
    const mid = pulses[Math.floor(pulses.length / 2)]!;
    const end = pulses[pulses.length - 1]!;
    // FREEZE GUARD: total bouts must keep climbing in the second half of the run.
    // Pre-fix, this is flat (the world froze once the player went bankrupt).
    expect(end.totalBouts).toBeGreaterThan(mid.totalBouts);
  });

  it('rival population stays alive and does not monotonically bleed out', () => {
    const { finalState, pulses } = shared;
    expect(finalState.rivals.length).toBeGreaterThan(0);
    expect(finalState.rivals.every((r) => r.roster.length > 0)).toBe(true);
    const totalRivalWarriors = finalState.rivals.reduce((s, r) => s + r.roster.length, 0);
    expect(totalRivalWarriors).toBeGreaterThan(150);
    const end = pulses[pulses.length - 1]!;
    expect(end.deadCount).toBeGreaterThan(0);
  });

  it('traits keep emerging across the world', () => {
    const end = shared.pulses[shared.pulses.length - 1]!;
    expect(end.traitedWarriors).toBeGreaterThan(0);
    expect(end.totalTraits).toBeGreaterThan(0);
    expect(end.flawInstances).toBeGreaterThan(0);
  });

  it('class identity and Signatures emerge, with acquisition in a sane band', () => {
    const { pulses, finalState } = shared;
    const end = pulses[pulses.length - 1]!;
    const allWarriors = [...finalState.roster, ...finalState.rivals.flatMap((r) => r.roster)];
    expect(end.classTraitInstances).toBeGreaterThan(0);
    expect(end.signatureInstances).toBeGreaterThan(0);
    const traitedShare = end.traitedWarriors / Math.max(1, allWarriors.length);
    expect(traitedShare).toBeGreaterThan(0.2); // traits do emerge
    expect(traitedShare).toBeLessThan(0.8); // …but the world is NOT saturated (was 0.99)
    const blankShare = 1 - traitedShare;
    expect(blankShare).toBeGreaterThan(0.18); // a real population stays permanently blank
  });

  it('multi-flaw warriors occur during the run, feeding the Release cull', () => {
    const peakMultiFlaw = Math.max(...shared.pulses.map((p) => p.multiFlawWarriors));
    expect(peakMultiFlaw).toBeGreaterThan(0);
  });

  it('logs end-of-run trait & churn metrics (diagnostic)', () => {
    const { pulses, finalState } = shared;
    const end = pulses[pulses.length - 1]!;
    const all = [...finalState.roster, ...finalState.rivals.flatMap((r) => r.roster)];
    console.log(
      `[liveness] week=${end.week} bouts=${end.totalBouts} dead=${end.deadCount} ` +
        `traited=${end.traitedWarriors}/${all.length} totalTraits=${end.totalTraits} ` +
        `flaws=${end.flawInstances} multiFlaw=${end.multiFlawWarriors} ` +
        `classTraits=${end.classTraitInstances} signature=${end.signatureInstances}`
    );
    expect(end.week).toBeGreaterThan(0);
  });
});
```

Also update the vitest import at the top: replace `beforeEach` with `beforeAll` in the `import { describe, it, expect, vi, beforeEach } from 'vitest';` line (i.e. `import { describe, it, expect, vi, beforeAll } from 'vitest';`).

> Why the assertions survive the `logFrequency` change from 4 → 2: pulses double in count, but every assertion indexes relatively (`mid`, `length - 1`) or aggregates (`Math.max`), so more samples only make the freeze/multi-flaw guards *stricter*, never looser.

- [ ] **Step 3: Run — expect 6 green, dramatically faster**

Run: `npx vitest run src/test/engine/sim/worldLiveness.integration.test.ts 2>&1 | tail -6`
Expected: 6 passed; total duration ~75–100s (one sim run + trivial assertions). The `Timeout calling "onTaskUpdate"` unhandled-error should no longer appear.

If the multi-flaw or Signature assertion fails where it passed before, the RNG draw sequence has NOT changed (same seed, `logFrequency` does not consume RNG — it only controls pulse collection in the harness loop). Verify you did not alter `weeks`/`seed`, and that `reset()` runs exactly once before the single run.

- [ ] **Step 4: Typecheck + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`
```bash
git add "src/test/engine/sim/worldLiveness.integration.test.ts"
git commit -m "perf(test): liveness suite shares one 104-week sim run (445s -> ~80s)"
```

---

## Task 2: Full-suite verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full suite**

Run: `npx vitest run 2>&1 | tail -4`
Expected: all green (the suite was fully green — 386 files / 5384 tests — as of 2026-07-16; no new failures are acceptable).

- [ ] **Step 2: Commit if anything else was touched**

```bash
git add -A && git commit -m "test: verify suite green after liveness single-run refactor" || echo "nothing to commit"
```

---

## Self-Review Notes

- **Zero assertion drift.** Every `expect` is copied verbatim; only the run-sharing plumbing changed. The suite's meaning as the balance gate is untouched.
- **Determinism is the enabler.** `runSimulation` is seeded and synchronous; six identical runs were pure waste. If any test ever needs a *different* config (different weeks/seed), give it its own run — do not bend the shared one.
- **`logFrequency: 2` is the superset.** Finer sampling only strengthens the peak-based multi-flaw guard.

## Verification

1. `worldLiveness.integration.test.ts` → 6/6 green in ≤ ~100s (was ~445s).
2. Diagnostic `[liveness]` line still printed with identical metric values as the pre-change run (same seed → same world).
3. `bunx tsc …` → 0; full suite green.
