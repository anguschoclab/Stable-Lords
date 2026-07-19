# Absolute Week Counter Implementation Plan (T2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a monotonic `absoluteWeek` counter to `GameState` and migrate the bout-offer subsystem's week arithmetic onto it — fixing a latent year-rollover bug where **world bouts booked in week 52 silently never fire** (they're booked for "week 53", but `state.week` resets to 1).

**Architecture:** `state.week` resets 52→1 each year (`prepareWeekContext`, `weekPipelineService.ts:49–61`), yet offer logic does cross-week arithmetic on it: `worldMatchmaking` books `boutWeek: state.week + 1`, `generatePairings` fights offers where `boutWeek === currentWeek`, and pruning compares `boutWeek <= justFinishedWeek` / `expirationWeek >= nextWeek`. At the year boundary all three comparisons go wrong. We add `absoluteWeek` (never resets; derived `(year−1)×52 + week` for old saves), switch every offer **creator and consumer** to it, and keep `week`/`year` for display and season math. A regression test proves world bouts survive the rollover.

**Tech Stack:** TypeScript, Bun (`bun`/`bunx` — never npm/node), Vitest. Tests: `npx vitest run <path>`. Typecheck: `bunx tsc --noEmit --project tsconfig.app.json`.

**Scope:** The offer subsystem only (creators + comparators) plus the counter itself. There are ~125 `state.week`-ish reads across the engine; most are within-week, display, or modulo-based (`week % 52` aging ticks) and are **explicitly out of scope** — migrate only what this plan lists. **Non-goal:** changing season/aging math or UI copy.

**The rollover bug, concretely (read before coding):**
1. Week 52: `planWorldBouts` (`src/engine/matchmaking/worldMatchmaking.ts:96–97`) books `boutWeek: state.week + 1 = 53`, `expirationWeek: 53`.
2. Week 1 (year+1): `generatePairings` (`src/engine/bout/core/pairings.ts:32–34`) filters `o.boutWeek === currentWeek` → `53 === 1` is false → **the bout never fights**.
3. Pruning (`weekPipelineService.ts` `finalizeState`, lines ~172–187) computes `justFinishedWeek = ctx.nextWeek − 1 = 0` at rollover → `boutWeek <= 0` is false → zombie offers linger until the `expirationWeek` clause catches them.

**Grounded facts (do not re-derive):**
- Rollover: `prepareWeekContext` — `let nextWeek = currentWeek + 1; if (nextWeek > 52) { nextWeek = 1; nextYear++; }` (`weekPipelineService.ts:49–61`).
- `finalizeState` sets `state.week = ctx.nextWeek; state.year = ctx.nextYear;` (`weekPipelineService.ts:163–166`).
- Offer creators: `src/engine/matchmaking/worldMatchmaking.ts` (world bouts) and `src/engine/pipeline/passes/PromoterPass.ts` (promoter offers). Offer comparators: `src/engine/bout/core/pairings.ts`, `finalizeState` pruning, `RivalStrategyPass.ts` purge (`offer.expirationWeek >= nextWeek`, lines ~68–77), `PromoterPass.ts` expiry (`offer.expirationWeek < state.week`, line ~55), `src/engine/core/warriorCollection.ts:52` (`boutWeek === targetWeek`), plus the headless harness auto-accept in `src/scripts/simulation-harness.ts` and `useDigestSummary` (UI, compares `boutWeek` to `currentWeek`).
- Persistence entry point: `src/state/serialization.ts` — where a loaded save can be patched with a derived `absoluteWeek`.
- `WEEKS_PER_YEAR = 52` exists at `src/constants/core/core.ts:22`.

---

## File Structure

- **Create** `src/engine/core/absoluteWeek.ts` — pure helpers (`deriveAbsoluteWeek`, `displayWeek`).
- **Create** `src/test/engine/core/absoluteWeek.test.ts` — helper tests.
- **Modify** `src/types/state.types.ts` — add `absoluteWeek: number` to `GameState`.
- **Modify** `src/engine/factories/gameStateFactory.ts` — initialize `absoluteWeek: 1`.
- **Modify** `src/engine/pipeline/services/weekPipelineService.ts` — increment in `finalizeState`; pruning uses absolute weeks.
- **Modify** `src/state/serialization.ts` — derive-if-missing on load.
- **Modify** offer creators/comparators listed above.
- **Create** `src/test/engine/pipeline/yearRollover.integration.test.ts` — the rollover regression test.

---

## Task 1: Pure helpers (TDD)

**Files:**
- Create: `src/engine/core/absoluteWeek.ts`
- Create: `src/test/engine/core/absoluteWeek.test.ts`

- [ ] **Step 1: Write the failing test**

`src/test/engine/core/absoluteWeek.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { deriveAbsoluteWeek, displayWeek } from '@/engine/core/absoluteWeek';

describe('absolute week helpers', () => {
  it('derives the monotonic week from (year, week)', () => {
    expect(deriveAbsoluteWeek(1, 1)).toBe(1);
    expect(deriveAbsoluteWeek(1, 52)).toBe(52);
    expect(deriveAbsoluteWeek(2, 1)).toBe(53); // the rollover boundary
    expect(deriveAbsoluteWeek(3, 10)).toBe(114);
  });

  it('round-trips back to a display week in [1, 52]', () => {
    expect(displayWeek(1)).toBe(1);
    expect(displayWeek(52)).toBe(52);
    expect(displayWeek(53)).toBe(1);
    expect(displayWeek(114)).toBe(10);
  });

  it('defaults missing/garbage inputs to week 1', () => {
    expect(deriveAbsoluteWeek(undefined, undefined)).toBe(1);
  });
});
```

- [ ] **Step 2: Run — expect FAIL.** `npx vitest run src/test/engine/core/absoluteWeek.test.ts` → module not found.

- [ ] **Step 3: Implement**

`src/engine/core/absoluteWeek.ts`:

```typescript
import { WEEKS_PER_YEAR } from '@/constants/core/core';

/**
 * The monotonic week counter. `state.week` resets 52→1 every year, which breaks
 * any cross-week arithmetic at the boundary (offers booked in week 52 for "week
 * 53" never match week 1 of the next year). All scheduling math must use
 * absoluteWeek; `week`/`year` remain for display and season logic.
 */
export function deriveAbsoluteWeek(year?: number, week?: number): number {
  const y = Math.max(1, year ?? 1);
  const w = Math.max(1, week ?? 1);
  return (y - 1) * WEEKS_PER_YEAR + w;
}

/** Convert an absolute week back to the in-year display week (1–52). */
export function displayWeek(absoluteWeek: number): number {
  return ((Math.max(1, absoluteWeek) - 1) % WEEKS_PER_YEAR) + 1;
}
```

- [ ] **Step 4: Run + typecheck.** Test → PASS; `bunx tsc … | grep -c "error TS"` → `0`.

- [ ] **Step 5: Commit**

```bash
git add "src/engine/core/absoluteWeek.ts" "src/test/engine/core/absoluteWeek.test.ts"
git commit -m "feat(core): absoluteWeek helpers (monotonic week + display round-trip)"
```

---

## Task 2: Failing rollover regression test

**Files:**
- Create: `src/test/engine/pipeline/yearRollover.integration.test.ts`

- [ ] **Step 1: Write the failing test**

Copy the OPFS mock + `reset()` helper verbatim from `src/test/engine/pipeline/worldEvolvesWhenPlayerStopped.integration.test.ts` (lines 8–41 of that file — the `vi.mock('@/engine/storage/opfsArchive', …)` block and the `reset` function), then add:

```typescript
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { deriveAbsoluteWeek } from '@/engine/core/absoluteWeek';

describe('year rollover', () => {
  beforeEach(reset, 120000);

  it('world bouts keep firing across the week-52 → week-1 boundary', () => {
    let state = populateInitialWorld(createFreshState('rollover'), 4141);
    // Jump to late in the year. Keep week/year/absoluteWeek consistent.
    state.week = 50;
    state.year = 1;
    state.absoluteWeek = deriveAbsoluteWeek(1, 50);

    const boutsPerWeek: number[] = [];
    let prev = state.arenaHistory.length;
    for (let i = 0; i < 6; i++) {
      state = advanceWeek(state, { headless: true });
      boutsPerWeek.push(state.arenaHistory.length - prev);
      prev = state.arenaHistory.length;
    }

    // Weeks simulated: 51, 52, 1(y2), 2, 3, 4. The bug: bouts booked in week 52
    // for "week 53" never match week 1, so the rollover week goes silent.
    expect(state.year).toBe(2);
    const rolloverWeekBouts = boutsPerWeek[2]!; // the first week of year 2
    expect(rolloverWeekBouts, `bouts per week: [${boutsPerWeek.join(', ')}]`).toBeGreaterThan(0);
    // And the counter is monotonic:
    expect(state.absoluteWeek).toBe(deriveAbsoluteWeek(1, 50) + 6);
  }, 120000);
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/test/engine/pipeline/yearRollover.integration.test.ts`
Expected: FAIL — either `state.absoluteWeek` is undefined (field doesn't exist yet) or `rolloverWeekBouts` is 0 (the latent bug). Both prove the test bites.

- [ ] **Step 3: Commit the failing test**

```bash
git add "src/test/engine/pipeline/yearRollover.integration.test.ts"
git commit -m "test(pipeline): failing rollover regression — world bouts must survive week 52->1"
```

---

## Task 3: Add the field — type, init, increment, save derivation

**Files:**
- Modify: `src/types/state.types.ts`
- Modify: `src/engine/factories/gameStateFactory.ts`
- Modify: `src/engine/pipeline/services/weekPipelineService.ts`
- Modify: `src/state/serialization.ts`

- [ ] **Step 1: Type**

In `src/types/state.types.ts`, in the `GameState` interface directly under `year: number;`:

```typescript
  /** Monotonic week counter — never resets at year rollover. All cross-week
   *  scheduling math (offers, countdowns) uses this; `week` is display-only. */
  absoluteWeek: number;
```

- [ ] **Step 2: Fresh-state init**

In `src/engine/factories/gameStateFactory.ts`, find where `week: 1` (and `year: 1`) are initialized in `createFreshState` and add alongside them:

```typescript
    absoluteWeek: 1,
```

- [ ] **Step 3: Increment in `finalizeState`**

In `weekPipelineService.ts` `finalizeState` (lines ~163–166), directly after `state.year = ctx.nextYear;` add:

```typescript
  state.absoluteWeek = deriveAbsoluteWeek(ctx.nextYear, ctx.nextWeek);
```

with `import { deriveAbsoluteWeek } from '@/engine/core/absoluteWeek';` at the top. (Deriving from the context rather than `+1` keeps it self-healing even if a caller hand-edits `week`/`year`, as tests do.)

- [ ] **Step 4: Derive-if-missing on load**

In `src/state/serialization.ts`, find the deserialization path where a loaded `GameState` is returned/hydrated, and patch:

```typescript
  if (typeof loaded.absoluteWeek !== 'number' || loaded.absoluteWeek < 1) {
    loaded.absoluteWeek = deriveAbsoluteWeek(loaded.year, loaded.week);
  }
```

(Adapt the variable name to the file's actual hydration code — read the file first; the patch goes wherever the parsed state object exists before being handed to the store.)

- [ ] **Step 5: Typecheck — expect missing-field errors, fix them**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep "error TS" | head -20`
Any state-literal in tests/factories that builds a full `GameState` now needs `absoluteWeek`. Fix each by adding `absoluteWeek: deriveAbsoluteWeek(year, week)` (or `1`). Do NOT weaken the type to optional — the whole point is that it always exists.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(core): GameState.absoluteWeek — monotonic counter with save derivation"
```

---

## Task 4: Migrate the offer subsystem to absolute weeks

**Files:**
- Modify: `src/engine/matchmaking/worldMatchmaking.ts`
- Modify: `src/engine/pipeline/passes/PromoterPass.ts`
- Modify: `src/engine/bout/core/pairings.ts`
- Modify: `src/engine/pipeline/services/weekPipelineService.ts` (pruning)
- Modify: `src/engine/pipeline/passes/RivalStrategyPass.ts` (purge)
- Modify: `src/engine/core/warriorCollection.ts`
- Modify: `src/scripts/simulation-harness.ts` (auto-accept comparison, if it compares weeks)
- Modify: `src/hooks/useDigestSummary.ts` (UI comparisons)

The semantic rule for every edit: **`boutWeek` and `expirationWeek` now hold absolute weeks.** Creators write `state.absoluteWeek + 1`; comparators compare against `state.absoluteWeek` (or the context's absolute next-week). Display code converts with `displayWeek()`.

- [ ] **Step 1: Creators**

`worldMatchmaking.ts` (lines ~96–97): change

```typescript
        boutWeek: state.week + 1,
        expirationWeek: state.week + 1,
```

to

```typescript
        boutWeek: state.absoluteWeek + 1,
        expirationWeek: state.absoluteWeek + 1,
```

`PromoterPass.ts`: grep the file for `boutWeek:` and `expirationWeek:` creation sites and apply the same `state.week` → `state.absoluteWeek` substitution. Read each site — if one uses `state.week + N` for scheduling several weeks out, keep the `+ N` and only swap the base.

- [ ] **Step 2: Comparators**

`pairings.ts` (lines ~24, 32–34): change `const currentWeek = state.week;` to `const currentWeek = state.absoluteWeek;` (the filter `o.boutWeek === currentWeek` then works across rollover unchanged).

`weekPipelineService.ts` `finalizeState` pruning (~lines 172–187): `justFinishedWeek` must be absolute. Change

```typescript
    const justFinishedWeek = ctx.nextWeek - 1;
```

to

```typescript
    const justFinishedWeek = deriveAbsoluteWeek(ctx.nextYear, ctx.nextWeek) - 1;
```

`RivalStrategyPass.ts` purge (~lines 68–77): the function receives `nextWeek` (in-year). Find where `runRivalStrategyPass` is called (`collectRemainingImpacts`, `weekPipelineService.ts:~174–181`) and what it passes; change the purge comparison to use the state's absolute week instead: `offer.expirationWeek >= state.absoluteWeek + 1`. If `nextWeek` is threaded through several helpers, prefer computing `const nextAbsoluteWeek = state.absoluteWeek + 1;` locally inside the pass from `state` rather than re-plumbing parameters.

`PromoterPass.ts` expiry (~line 55): `offer.expirationWeek < state.week` → `offer.expirationWeek < state.absoluteWeek`.

`warriorCollection.ts:52`: read the call site to find what `targetWeek` is fed with; ensure its caller passes `state.absoluteWeek` (grep for the function's callers and update them).

- [ ] **Step 3: Display + harness**

`useDigestSummary.ts`: it compares `boutWeek` against a current week for pending/signed/upcoming buckets. Swap the current-week source to `absoluteWeek` (the hook reads from the store; use the state's `absoluteWeek`). Any place a `boutWeek` is *rendered* as "Week N" should render `displayWeek(offer.boutWeek)`.

`src/scripts/simulation-harness.ts`: the auto-accept block filters offers by status only (no week compare) — verify with a read; if any week comparison exists, migrate it the same way.

- [ ] **Step 4: Sweep for stragglers**

Run: `grep -rn "boutWeek\|expirationWeek" src --include="*.ts" --include="*.tsx" | grep -v test | grep -v "absoluteWeek"`
Read every remaining hit and confirm it is either (a) a type definition, (b) already-migrated, or (c) display code using `displayWeek`. Fix anything comparing against `state.week`/`ctx.nextWeek`.

- [ ] **Step 5: The rollover test goes green**

Run: `npx vitest run src/test/engine/pipeline/yearRollover.integration.test.ts`
Expected: PASS — bouts fire in week 1 of year 2 and `absoluteWeek` is monotonic.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "fix(offers): bout offers use absoluteWeek — world bouts survive year rollover"
```

---

## Task 5: Full verification

**Files:** none (verification only)

- [ ] **Step 1: The affected suites**

Run: `npx vitest run src/test/engine/pipeline/ src/test/hooks/useDigestSummary.test.ts src/test/integration/weekAdvancement.test.ts src/test/engine/determinism.test.ts 2>&1 | tail -5`
Expected: green. `useDigestSummary.test.ts` fixtures may hard-code small week numbers — if they fail, update the fixtures to set `absoluteWeek` consistently with `week` (the semantics of the hook are unchanged for year 1, where `absoluteWeek === week`).

- [ ] **Step 2: Liveness + full suite**

Run: `npx vitest run 2>&1 | tail -4` → all green (suite was fully green as of 2026-07-16).
Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "test: verify suite green after absoluteWeek migration" || echo "nothing to commit"
```

---

## Self-Review Notes

- **Fixes a real, silent bug** — the week-52 world bouts vanish today; the regression test proves it before the fix and guards it after.
- **Scoped migration.** Only the offer subsystem moves; the ~100 other `state.week` reads (season, aging `week % 52`, display) are explicitly untouched — they are within-year semantics and correct as-is.
- **Self-healing counter.** Deriving in `finalizeState` from `(nextYear, nextWeek)` rather than incrementing means hand-edited test states can't desync it.
- **Year-1 compatibility.** For the entire first year `absoluteWeek === week`, so most existing fixtures/tests are unaffected by the semantic change.

## Verification

1. `absoluteWeek.test.ts` + `yearRollover.integration.test.ts` → green; rollover week fights bouts.
2. Straggler grep returns only types/display/migrated hits.
3. Full suite green; typecheck 0.
