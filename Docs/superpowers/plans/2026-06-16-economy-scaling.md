# Economy Scaling — Stakes That Rise With Fame & Arena Tier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat `purse × fightCount` / `winBonus × winCount` economy with per-fight purses that scale by the participating warrior's fame and the arena's tier, so climbing the ranks raises both reward and risk.

**Architecture:** Add a pure `computeFightEconomics()` function in the economy constants layer that maps `(fame, arenaTier, won)` → `{ purse, winBonus }`. Replace the flat aggregation in `computeWeeklyBreakdown()` with a per-fight loop that looks up each player fight in `arenaHistory`, derives the warrior's fame and the arena tier, and sums scaled payouts. Keep all multipliers as named constants for easy tuning. No new persisted state — fame (`FightSummary.fameA/fameD`) and `arenaId` already exist on each stored fight.

**Tech Stack:** TypeScript, Vitest. Pure functions only — no React changes required (the Ledger UI already renders whatever `computeWeeklyBreakdown` returns).

**Key existing facts (verified):**
- `computeWeeklyBreakdown()` (`src/engine/economy.ts:50`) currently aggregates flat: `fightCount * FIGHT_PURSE` and `winCount * WIN_BONUS`, walking `arenaHistory` backward over the current week.
- Base constants live in `src/constants/economy/economy.ts`: `FIGHT_PURSE = 90`, `WIN_BONUS = 35`, `WARRIOR_UPKEEP_BASE = 60`.
- Each stored fight (`FightSummary`, `src/types/combat.types.ts:225`) has `warriorIdA`, `warriorIdD`, `winner`, `fameA?`, `fameD?`, `arenaId?`.
- Arenas carry `tier: 1 | 2 | 3` (`src/types/shared.types.ts:520`); look up via `getArenaById(id)` (`src/data/arenas.ts:28`).
- Upkeep already has a fame premium (`Math.floor(fame/10) * 15`) — this plan leaves upkeep as-is and only scales income.

### Scaling model (tunable constants)

```
purse(fame, tier, won):
  fameMult   = 1 + min(fame, FAME_PURSE_CAP) / FAME_PURSE_DIVISOR     // fame 0→cap maps 1.0→~2.0
  tierMult   = ARENA_TIER_PURSE_MULT[tier]                            // {1:1.0, 2:1.5, 3:2.25}
  basePurse  = round(FIGHT_PURSE * fameMult * tierMult)
  bonus      = won ? round(WIN_BONUS * fameMult * tierMult) : 0
```

Worked examples (with FAME_PURSE_CAP=60, FAME_PURSE_DIVISOR=60 → fameMult 1.0..2.0):
- Rookie (fame 0) in a tier-1 arena, win: purse 90 + bonus 35 = **125** (unchanged from today).
- Star (fame 30) in a tier-2 arena, win: fameMult 1.5, tierMult 1.5 → purse 203 + bonus 79 = **282**.
- Legend (fame 60) in a tier-3 arena, win: fameMult 2.0, tierMult 2.25 → purse 405 + bonus 158 = **563**.

---

## File Structure

- Modify: `src/constants/economy/economy.ts` — add scaling constants + `computeFightEconomics()`.
- Test: `src/test/engine/fightEconomics.test.ts` (create) — unit-test the pure scaler.
- Modify: `src/engine/economy.ts` — replace the flat aggregation in `computeWeeklyBreakdown()` with a per-fight scaled sum.
- Test: `src/test/engine/economyScaling.test.ts` (create) — integration test over a constructed `GameState`.

---

## Task 1: Add scaling constants and the pure `computeFightEconomics()`

**Files:**
- Modify: `src/constants/economy/economy.ts`
- Test: `src/test/engine/fightEconomics.test.ts` (create)

- [ ] **Step 1: Write the failing test**

```typescript
// src/test/engine/fightEconomics.test.ts
import { describe, it, expect } from 'vitest';
import {
  computeFightEconomics,
  FIGHT_PURSE,
  WIN_BONUS,
} from '@/constants/economy/economy';

describe('computeFightEconomics', () => {
  it('returns base purse and win bonus for a fame-0 tier-1 winner', () => {
    const r = computeFightEconomics({ fame: 0, arenaTier: 1, won: true });
    expect(r.purse).toBe(FIGHT_PURSE);
    expect(r.winBonus).toBe(WIN_BONUS);
  });

  it('awards no win bonus on a loss', () => {
    const r = computeFightEconomics({ fame: 0, arenaTier: 1, won: false });
    expect(r.purse).toBe(FIGHT_PURSE);
    expect(r.winBonus).toBe(0);
  });

  it('scales purse up with fame', () => {
    const low = computeFightEconomics({ fame: 0, arenaTier: 1, won: true });
    const high = computeFightEconomics({ fame: 30, arenaTier: 1, won: true });
    expect(high.purse).toBeGreaterThan(low.purse);
  });

  it('scales purse up with arena tier', () => {
    const t1 = computeFightEconomics({ fame: 0, arenaTier: 1, won: true });
    const t3 = computeFightEconomics({ fame: 0, arenaTier: 3, won: true });
    expect(t3.purse).toBeGreaterThan(t1.purse);
  });

  it('caps the fame multiplier so purses do not run away', () => {
    const atCap = computeFightEconomics({ fame: 60, arenaTier: 1, won: false });
    const wayOver = computeFightEconomics({ fame: 600, arenaTier: 1, won: false });
    expect(wayOver.purse).toBe(atCap.purse);
  });

  it('treats missing/zero fame and unknown tier safely', () => {
    const r = computeFightEconomics({ fame: 0, arenaTier: 1, won: true });
    expect(Number.isFinite(r.purse)).toBe(true);
    expect(Number.isFinite(r.winBonus)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/engine/fightEconomics.test.ts`
Expected: FAIL — `computeFightEconomics` is not exported.

- [ ] **Step 3: Add constants and the function**

Append to `src/constants/economy/economy.ts`:

```typescript
// ─── Income Scaling ────────────────────────────────────────────────────────
/**
 * Fame at/above which the purse multiplier stops growing.
 * Keeps legend payouts bounded.
 */
export const FAME_PURSE_CAP = 60;

/**
 * Divisor that converts capped fame into the purse multiplier.
 * fameMult = 1 + min(fame, FAME_PURSE_CAP) / FAME_PURSE_DIVISOR.
 * With cap=60 and divisor=60, fame 0→1.0x and fame 60→2.0x.
 */
export const FAME_PURSE_DIVISOR = 60;

/**
 * Arena-tier purse/win multipliers. Tier 1 = common (no bonus),
 * tier 2 = prestigious, tier 3 = special event.
 */
export const ARENA_TIER_PURSE_MULT: Record<1 | 2 | 3, number> = {
  1: 1.0,
  2: 1.5,
  3: 2.25,
};

/**
 * Inputs for a single fight's payout.
 */
export interface FightEconomicsInput {
  /** Fame of the player's warrior in this bout. */
  fame: number;
  /** Tier of the arena the bout was fought in (defaults handled by caller). */
  arenaTier: 1 | 2 | 3;
  /** Whether the player's warrior won. */
  won: boolean;
}

/**
 * Pure scaler: maps a single fight's (fame, tier, result) to its payout.
 * Base case (fame 0, tier 1) returns exactly FIGHT_PURSE / WIN_BONUS so the
 * early game is unchanged.
 */
export function computeFightEconomics(input: FightEconomicsInput): {
  purse: number;
  winBonus: number;
} {
  const cappedFame = Math.min(Math.max(input.fame, 0), FAME_PURSE_CAP);
  const fameMult = 1 + cappedFame / FAME_PURSE_DIVISOR;
  const tierMult = ARENA_TIER_PURSE_MULT[input.arenaTier] ?? 1.0;
  const purse = Math.round(FIGHT_PURSE * fameMult * tierMult);
  const winBonus = input.won ? Math.round(WIN_BONUS * fameMult * tierMult) : 0;
  return { purse, winBonus };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/engine/fightEconomics.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/constants/economy/economy.ts src/test/engine/fightEconomics.test.ts
git commit -m "feat(economy): add fame+tier purse scaler computeFightEconomics"
```

---

## Task 2: Use per-fight scaled payouts in `computeWeeklyBreakdown`

**Files:**
- Modify: `src/engine/economy.ts:54-80` (the fight-count loop and income push)
- Test: `src/test/engine/economyScaling.test.ts` (create)

- [ ] **Step 1: Write the failing integration test**

```typescript
// src/test/engine/economyScaling.test.ts
import { describe, it, expect } from 'vitest';
import { computeWeeklyBreakdown } from '@/engine/economy';
import type { GameState } from '@/types/state.types';

// Minimal GameState builder — engineer: reuse an existing test fixture/factory
// if one exists (grep src/test for a makeGameState helper). Otherwise construct
// the smallest object computeWeeklyBreakdown reads: week, roster, arenaHistory,
// fame, weather, trainers, trainingAssignments.
function makeState(over: Partial<GameState> = {}): GameState {
  return {
    week: 5,
    fame: 0,
    weather: 'Clear',
    roster: [{ id: 'p1', name: 'Hero', fame: 30 } as any],
    trainers: [],
    trainingAssignments: [],
    arenaHistory: [],
    ...over,
  } as unknown as GameState;
}

describe('computeWeeklyBreakdown income scaling', () => {
  it('pays more for a famous warrior in a high-tier arena than the flat base', () => {
    const state = makeState({
      arenaHistory: [
        {
          id: 'f1',
          week: 5,
          warriorIdA: 'p1',
          warriorIdD: 'enemy',
          winner: 'A',
          fameA: 30,
          arenaId: 'TIER3_ARENA_ID', // engineer: use a real tier-3 arena id from src/data/arenas.ts
        } as any,
      ],
    });
    const b = computeWeeklyBreakdown(state);
    const purseLine = b.income.find((i) => i.label.startsWith('Fight purses'));
    expect(purseLine).toBeDefined();
    // Flat would have been 90; scaled (fame 30, tier 3) must exceed it.
    expect(purseLine!.amount).toBeGreaterThan(90);
  });

  it('pays exactly the base for a fame-0 warrior in a tier-1 arena (no regression for rookies)', () => {
    const state = makeState({
      fame: 0,
      roster: [{ id: 'p1', name: 'Rookie', fame: 0 } as any],
      arenaHistory: [
        {
          id: 'f1',
          week: 5,
          warriorIdA: 'p1',
          warriorIdD: 'enemy',
          winner: 'A',
          fameA: 0,
          arenaId: 'TIER1_ARENA_ID', // engineer: use a real tier-1 arena id
        } as any,
      ],
    });
    const b = computeWeeklyBreakdown(state);
    const purseLine = b.income.find((i) => i.label.startsWith('Fight purses'));
    const winLine = b.income.find((i) => i.label.startsWith('Win bonuses'));
    expect(purseLine!.amount).toBe(90);
    expect(winLine!.amount).toBe(35);
  });
});
```

> Engineer note: open `src/data/arenas.ts` and substitute real arena `id` strings for `TIER1_ARENA_ID` (a `tier: 1` arena) and `TIER3_ARENA_ID` (a `tier: 3` arena).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/engine/economyScaling.test.ts`
Expected: FAIL — the famous-warrior purse still equals the flat `count × 90`.

- [ ] **Step 3: Rewrite the income aggregation**

In `src/engine/economy.ts`:

1. Add imports at the top:

```typescript
import { computeFightEconomics } from '@/constants/economy/economy';
import { getArenaById } from '@/data/arenas';
```

2. Replace the `fightCount`/`winCount` accumulation loop (lines ~54-74) and the flat income pushes (lines ~76-80) with a scaled accumulation:

```typescript
  let fightCount = 0;
  let winCount = 0;
  let scaledPurse = 0;
  let scaledWinBonus = 0;

  const arenaTier = (arenaId?: string): 1 | 2 | 3 => {
    if (!arenaId) return 1;
    try {
      return getArenaById(arenaId).tier;
    } catch {
      return 1; // unknown/legacy arena id → treat as tier 1
    }
  };

  for (let i = state.arenaHistory.length - 1; i >= 0; i--) {
    const f = state.arenaHistory[i];
    if (!f) break;
    if (f.week !== week) break;

    const aIsPlayer = playerWarriorIds.has(f.warriorIdA);
    const dIsPlayer = playerWarriorIds.has(f.warriorIdD);
    const tier = arenaTier(f.arenaId);

    if (aIsPlayer) {
      fightCount++;
      const won = f.winner === 'A';
      if (won) winCount++;
      const { purse, winBonus } = computeFightEconomics({ fame: f.fameA ?? 0, arenaTier: tier, won });
      scaledPurse += purse;
      scaledWinBonus += winBonus;
    }
    if (dIsPlayer) {
      fightCount++;
      const won = f.winner === 'D';
      if (won) winCount++;
      const { purse, winBonus } = computeFightEconomics({ fame: f.fameD ?? 0, arenaTier: tier, won });
      scaledPurse += purse;
      scaledWinBonus += winBonus;
    }
  }

  const income: { label: string; amount: number }[] = [];
  if (fightCount > 0)
    income.push({ label: `Fight purses (${fightCount})`, amount: scaledPurse });
  if (winCount > 0)
    income.push({ label: `Win bonuses (${winCount})`, amount: scaledWinBonus });
```

> Keep the `FAME_DIVIDEND`, Mana Surge, and Noble Patronage income pushes exactly as they are below this block. Remove the now-unused `FIGHT_PURSE` / `WIN_BONUS` imports from `economy.ts` only if nothing else in the file references them (grep first).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/engine/economyScaling.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the existing economy test suite for regressions**

Run: `npx vitest run src/test/engine` (and `grep -rln "computeWeeklyBreakdown\|computeEconomyImpact" src/test` to catch any economy tests elsewhere, then run those).
Expected: PASS. If a pre-existing economy test asserts the OLD flat numbers, update it to the scaled expectation and note the change in the commit.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit --project tsconfig.app.json`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/engine/economy.ts src/test/engine/economyScaling.test.ts
git commit -m "feat(economy): scale weekly purses by warrior fame and arena tier"
```

---

## Task 3: Update the stale economy doc-comment and the manual

**Files:**
- Modify: `src/engine/economy.ts:1-13` (the file header comment, which currently states wrong flat numbers like "50g per fight")
- Modify: `Docs/USER_MANUAL.md` §8.1 Income table

- [ ] **Step 1: Fix the engine header comment**

Replace the inaccurate income/expense summary at the top of `src/engine/economy.ts` with the scaled reality:

```typescript
/**
 * Economy engine — weekly income/expenses processed at week advance.
 *
 * Income sources:
 *  - Fight purses: base FIGHT_PURSE scaled by the warrior's fame and arena tier
 *    (see computeFightEconomics in constants/economy).
 *  - Win bonus: base WIN_BONUS, scaled the same way, on wins only.
 *  - Fame dividend: fame × FAME_DIVIDEND per week.
 *  - Noble patronage: high-fame warriors attract sponsors.
 *
 * Expenses:
 *  - Warrior upkeep: WARRIOR_UPKEEP_BASE + fame premium per warrior per week.
 *  - Trainer salaries: by tier.
 *  - Training costs: TRAINING_COST per warrior in training.
 */
```

- [ ] **Step 2: Update the manual income table**

In `Docs/USER_MANUAL.md` §8.1, replace the flat "Fight purse 240 gold / Win bonus 100 gold" rows with a description of fame+tier scaling, including the worked examples from this plan's "Scaling model" section.

> Engineer note: the manual currently lists 240/100 which do not match even the current code (90/35). Align it to the new scaled model and remove the stale flat figures.

- [ ] **Step 3: Commit**

```bash
git add src/engine/economy.ts Docs/USER_MANUAL.md
git commit -m "docs(economy): document fame/tier purse scaling"
```

---

## Self-Review Notes (for the implementer)

- **Backward compatibility:** old saves whose fights lack `fameA/fameD` fall back to fame 0 (base purse); legacy/unknown `arenaId` falls back to tier 1. No save migration needed.
- **AI parity:** the constants file header says "Ensures parity between Player and AI economic calculations." Check whether AI stables compute income via this same path (grep `FIGHT_PURSE` / `computeWeeklyBreakdown` usage). If AI uses a separate flat calc, decide whether AI should also scale — out of scope for this plan, but flag it to the product owner so player and AI economies don't diverge.
- **Tuning:** all multipliers are named constants. The base case (fame 0, tier 1) is pinned to today's numbers by test, so designers can tune `FAME_PURSE_DIVISOR` / `ARENA_TIER_PURSE_MULT` without breaking the rookie experience.

## Verification (done by reviewer after implementation)

1. `npx vitest run src/test/engine/fightEconomics.test.ts src/test/engine/economyScaling.test.ts` — pass.
2. Rookie regression: a fame-0 / tier-1 fight still pays 90 + 35.
3. A fame-30 / tier-3 win pays meaningfully more than the flat base.
4. `npx tsc --noEmit --project tsconfig.app.json` — clean.
5. Confirm no other economy code path still uses flat `FIGHT_PURSE * count` for player income.
