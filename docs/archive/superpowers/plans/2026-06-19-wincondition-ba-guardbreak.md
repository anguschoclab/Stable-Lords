# Win Condition — BA Guard-Break Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Bashing Attack (BA) a win condition — each landed BA hit erodes the defender's guard (accumulating `parDegrade` that lowers their effective parry/dodge for the rest of the fight, capped) — making BA the counter to defensive walls, validated against the Phase-1 balance harness.

**Architecture:** `FighterState` is a freely-mutated per-fight object (`src/engine/combat/resolution/types.ts`) already carrying style-specific accumulators (`momentum`, `consecutiveHits`). We add `parDegrade`. It is **accumulated** on each landed BA hit in `executeHit` (`hitExecution.ts`, alongside the existing AB/LU style blocks) and **consumed** by folding it into the defender's `extraDefPenalty` in `resolveContestedDefense` (`resolution.ts`), which `performDefenseCheck` subtracts from _both_ the parry and dodge rolls (verified: `defenseCheck.ts:70` parry, `:45` dodge). The clamped accumulation is a pure helper so it is unit-testable in isolation.

**Tech Stack:** TypeScript, Bun (`bun`/`bunx` — never npm/node), Vitest. Run one file with `npx vitest run <path>`.

**Scope:** Second of six per-style win-condition plans from `docs/superpowers/specs/2026-06-19-winconditions-remaining-design.md` (build order PS → **BA** → WS → PR → ST → SL). Independent slice; delivers BA alone, working and tested. (Note: Spec 2a's AB/LU/TP hooks are already present in `hitExecution.ts` — this plan adds a parallel style block, the same established pattern.)

**Canon guardrails:** Mechanics layer only. Do NOT touch `MATCHUP_MATRIX` or weapon-suitability/mortality data. Phase-1 guardrails (antisymmetric matrix, 40–60% band) must stay green. For BA — already a strong style — the Task-5 re-ratchet is what prevents power creep.

---

## File Structure

- **Create:** `src/engine/combat/resolution/guardBreak.ts` — pure `accumulateGuardBreak(current)` helper (clamped increment). One responsibility.
- **Create:** `src/test/engine/combat/guardBreak.test.ts` — unit tests for the helper.
- **Modify:** `src/constants/combat/combat.ts` — add `BA_PARDEGRADE_PER_HIT` and `BA_PARDEGRADE_CAP`.
- **Modify:** `src/engine/combat/resolution/types.ts` — add `parDegrade?: number` to `FighterState`.
- **Modify:** `src/engine/bout/fighterState.ts` — initialise `parDegrade: 0`.
- **Modify:** `src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts` — accumulate on a landed BA hit.
- **Modify:** `src/engine/combat/resolution/resolution.ts` — fold `parDegrade` into the defender's `extraDefPenalty`.
- **Create:** `src/test/engine/combat/baGuardBreak.integration.test.ts` — directional fight test.
- **Modify (if Task 5 requires):** `src/engine/skillCalc.ts` — `STYLE_PENALTIES` BA row only.

---

## Task 1: The pure guard-break helper (TDD)

**Files:**

- Create: `src/engine/combat/resolution/guardBreak.ts`
- Create: `src/test/engine/combat/guardBreak.test.ts`
- Modify: `src/constants/combat/combat.ts`

- [ ] **Step 1: Add the tunable constants**

In `src/constants/combat/combat.ts`, near `PS_COUNTERSTRIKE_ATT` (added by the PS plan) or the other Phase-1 balance constants, add:

```typescript
/** Parry/dodge penalty added to a defender per landed Bashing Attack hit. Balance knob. */
export const BA_PARDEGRADE_PER_HIT = 0.5;
/** Maximum accumulated guard-break penalty a defender can suffer in one fight. */
export const BA_PARDEGRADE_CAP = 3;
```

- [ ] **Step 2: Write the failing unit test**

Create `src/test/engine/combat/guardBreak.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { accumulateGuardBreak } from '@/engine/combat/resolution/guardBreak';
import { BA_PARDEGRADE_PER_HIT, BA_PARDEGRADE_CAP } from '@/constants/combat/combat';

describe('accumulateGuardBreak', () => {
  it('adds one increment from zero', () => {
    expect(accumulateGuardBreak(0)).toBe(BA_PARDEGRADE_PER_HIT);
  });

  it('accumulates across hits', () => {
    expect(accumulateGuardBreak(BA_PARDEGRADE_PER_HIT)).toBe(BA_PARDEGRADE_PER_HIT * 2);
  });

  it('clamps at the cap', () => {
    expect(accumulateGuardBreak(BA_PARDEGRADE_CAP)).toBe(BA_PARDEGRADE_CAP);
    expect(accumulateGuardBreak(BA_PARDEGRADE_CAP - 0.1)).toBe(BA_PARDEGRADE_CAP);
  });

  it('never exceeds the cap even from a large current value', () => {
    expect(accumulateGuardBreak(BA_PARDEGRADE_CAP + 5)).toBe(BA_PARDEGRADE_CAP);
  });
});
```

- [ ] **Step 3: Run it — expect FAIL (module not found)**

Run: `npx vitest run src/test/engine/combat/guardBreak.test.ts`
Expected: FAIL, "Cannot find module '@/engine/combat/resolution/guardBreak'".

- [ ] **Step 4: Implement the helper**

Create `src/engine/combat/resolution/guardBreak.ts`:

```typescript
import { BA_PARDEGRADE_PER_HIT, BA_PARDEGRADE_CAP } from '@/constants/combat/combat';

/**
 * Bashing Attack win condition: each landed BA hit erodes the defender's guard.
 * Returns the defender's next accumulated parry/dodge penalty, clamped to the
 * cap. Pure — the caller (executeHit) owns the FighterState mutation.
 */
export function accumulateGuardBreak(current: number): number {
  return Math.min(BA_PARDEGRADE_CAP, current + BA_PARDEGRADE_PER_HIT);
}
```

- [ ] **Step 5: Run the test — expect PASS**

Run: `npx vitest run src/test/engine/combat/guardBreak.test.ts`
Expected: PASS (all 4).

- [ ] **Step 6: Commit**

```bash
git add "src/engine/combat/resolution/guardBreak.ts" "src/test/engine/combat/guardBreak.test.ts" "src/constants/combat/combat.ts"
git commit -m "feat(combat): add BA guard-break accumulator helper (pure, unit-tested)"
```

---

## Task 2: Add the `parDegrade` field to FighterState

**Files:**

- Modify: `src/engine/combat/resolution/types.ts`
- Modify: `src/engine/bout/fighterState.ts`

- [ ] **Step 1: Extend the FighterState interface**

In `src/engine/combat/resolution/types.ts`, inside `export interface FighterState`, near `momentum`, add:

```typescript
  /** Bashing Attack guard-break: accumulated parry/dodge penalty this fighter
   *  suffers from landed BA hits taken. 0..BA_PARDEGRADE_CAP, persists for the fight. */
  parDegrade?: number;
```

- [ ] **Step 2: Initialise it in the fighter builder**

In `src/engine/bout/fighterState.ts`, in the returned object literal (near `momentum: 0,`), add:

```typescript
    parDegrade: 0,
```

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: `0`.

- [ ] **Step 4: Commit**

```bash
git add "src/engine/combat/resolution/types.ts" "src/engine/bout/fighterState.ts"
git commit -m "feat(combat): add parDegrade (guard-break) field to FighterState"
```

---

## Task 3: Accumulate guard-break on a landed BA hit

**Files:**

- Modify: `src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts`

`executeHit` is the landed-hit path (called from `resolution.ts:372` only when the defender's defense fails). It already contains style-specific blocks for AB (precision/bypass) and LU (momentum damage). Add a parallel BA block. `FightingStyle` is already imported in this file.

- [ ] **Step 1: Import the helper**

At the top of `hitExecution.ts`, with the other local imports, add:

```typescript
import { accumulateGuardBreak } from '../../guardBreak';
```

- [ ] **Step 2: Accumulate on the landed BA hit**

Find the LU momentum block (currently):

```typescript
// LU: momentum damage pressure on a landed hit
if (attacker.style === FightingStyle.LungingAttack && attacker.momentum > 0) {
  preArmor += attacker.momentum * 0.5;
}
```

Immediately after it, add:

```typescript
// BA: guard-break — each landed hit erodes the defender's guard for the rest of the fight
if (attacker.style === FightingStyle.BashingAttack) {
  defender.parDegrade = accumulateGuardBreak(defender.parDegrade ?? 0);
}
```

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: `0`. (Accumulates but nothing consumes it yet — no behaviour change.)

- [ ] **Step 4: Commit**

```bash
git add "src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts"
git commit -m "feat(combat): accumulate BA guard-break on each landed hit"
```

---

## Task 4: Consume guard-break in the defender's defense roll

**Files:**

- Modify: `src/engine/combat/resolution/resolution.ts`
- Create: `src/test/engine/combat/baGuardBreak.integration.test.ts`

In `resolveContestedDefense`, the defender's `extraDefPenalty` is assembled (around lines 293–299) and passed to `performDefenseCheck`, which subtracts it from **both** the parry roll (`defenseCheck.ts:70`) and the dodge roll (`:45`). Folding `parDegrade` in there erodes the wall's guard exactly as intended.

- [ ] **Step 1: Add parDegrade to extraDefPenalty**

The current expression reads:

```typescript
const extraDefPenalty =
  zonePenalty -
  s.defCommit.defPenalty +
  s.feintDefBonus +
  defRangePenalty -
  s.defDynTraitPar -
  s.defDynTraitDef;
```

Change it to add the defender's accumulated guard-break (a positive penalty makes defense worse, since `performDefenseCheck` does `- extraDefPenalty`):

```typescript
const extraDefPenalty =
  zonePenalty -
  s.defCommit.defPenalty +
  s.feintDefBonus +
  defRangePenalty -
  s.defDynTraitPar -
  s.defDynTraitDef +
  (def.parDegrade ?? 0);
```

(`def` is the defender FighterState, destructured at the top of `resolveContestedDefense`.)

- [ ] **Step 2: Typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: `0`.

- [ ] **Step 3: Integration test — BA cracks the wall**

Create `src/test/engine/combat/baGuardBreak.integration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { FightingStyle, type Warrior } from '@/types/game';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { computeWarriorStats } from '@/engine/skillCalc';

function mk(style: FightingStyle, id: string): Warrior {
  const attrs = { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 };
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  return {
    id: id as import('@/types/shared.types').WarriorId,
    name: id,
    style,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 20,
    traits: [],
  };
}

describe('BA guard-break (integration)', () => {
  it('Bashing Attack is favored against a Total Parry wall (guard erodes over the fight)', () => {
    const ba = mk(FightingStyle.BashingAttack, 'BA');
    const tp = mk(FightingStyle.TotalParry, 'TP');
    let wins = 0;
    const N = 400;
    for (let i = 0; i < N; i++) {
      const o = simulateFight(
        defaultPlanForWarrior(ba),
        defaultPlanForWarrior(tp),
        ba,
        tp,
        i * 6151 + 23
      );
      if (o.winner === 'A') wins++;
    }
    const rate = wins / N;
    // BA is meant to crack walls — it should be the favorite in this matchup.
    expect(rate, `BA vs TP win rate ${(rate * 100).toFixed(1)}%`).toBeGreaterThan(0.5);
  });
});
```

Run: `npx vitest run src/test/engine/combat/baGuardBreak.integration.test.ts`
Expected: PASS. If below 0.50, the erosion is too weak — raise `BA_PARDEGRADE_PER_HIT` to 0.75 (or `BA_PARDEGRADE_CAP` to 4) and re-run. Do not push BA's _overall_ power here — that is the re-ratchet's job (Task 5).

- [ ] **Step 4: Commit**

```bash
git add "src/engine/combat/resolution/resolution.ts" "src/test/engine/combat/baGuardBreak.integration.test.ts"
git commit -m "feat(combat): consume BA guard-break in defender defense; integration test"
```

---

## Task 5: Re-ratchet absolute power and confirm guardrails

BA is already strong; guard-break raises it further. Re-centre BA in the 40–60% band **without touching the matrix** — this is the anti-power-creep step.

**Files:**

- Modify (if needed): `src/engine/skillCalc.ts` (`STYLE_PENALTIES` — the BA row only)

- [ ] **Step 1: Run the balance harness**

Run: `npx vitest run src/test/engine/economy/balance.test.ts`
Expected: the `Absolute-power band` test likely flags BA as >0.60 (guard-break pushed it up). If green, skip to Step 3.

- [ ] **Step 2: Nudge BA penalties (only if out of band)**

In `src/engine/skillCalc.ts`, the BA row is `[FightingStyle.BashingAttack]: /*BA*/ [-4, -6, -10, 0, -2, +2]`. Deepen the **ATT** penalty in steps of 1–2 (e.g. `-4 → -6`) to offset the new offensive payoff while preserving BA's brute _shape_ (keep INI at 0, do not touch its identity ordering). Re-run Step 1. Repeat until BA is within `[0.40, 0.60]` and no other style was knocked out of band.

- [ ] **Step 3: Confirm the matrix never moved**

Run: `npx vitest run src/test/engine/economy/balance.test.ts -t "near-antisymmetric"`
Expected: PASS — only `STYLE_PENALTIES` may have changed.

- [ ] **Step 4: Full suite + typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`
Run: `npx vitest run 2>&1 | tail -4`
Expected: all green (no pre-existing test regressed).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "balance(BA): re-ratchet absolute power after guard-break; guardrails green"
```

---

## Self-Review Notes (for the implementer)

- **Accumulate in one place, consume in one place.** Set in `executeHit` (landed BA hit only — a whiffed BA does not erode, which is the defender's counterplay); consumed once via `extraDefPenalty`, which hits both parry and dodge.
- **`accumulateGuardBreak` is pure** — clamping logic lives there and is unit-tested; the resolution edits are two-line adds.
- **Landed-only is intentional.** Defensive styles that avoid hits (high DEF/dodge) delay the erosion; the cap (`-3`) prevents runaway. This is the anti-flatten lever — BA must _connect_ to grind a guard down.
- **Mechanics layer only.** No matrix edit. The Task-5 ratchet touches only the BA row of `STYLE_PENALTIES`, preserving BA's brute shape (INI 0, ATT-led).
- **Power-creep guard.** BA starts strong; do not skip Task 5 — guard-break must be paid for with a deeper ATT penalty so BA's _win rate_ stays in band while its _win shape_ becomes "grinds down guards."

## Verification (done by reviewer after implementation)

1. `npx vitest run src/test/engine/combat/guardBreak.test.ts` → 4 pass.
2. `grep -n "parDegrade" src/engine/combat/resolution/resolution.ts src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts` → accumulated on landed BA hit, consumed in `extraDefPenalty`.
3. `npx vitest run src/test/engine/combat/baGuardBreak.integration.test.ts` → BA favored vs TP (>0.50).
4. `npx vitest run src/test/engine/economy/balance.test.ts` → green, including `near-antisymmetric` and the 40–60% band (BA in band).
5. `bunx tsc --noEmit --project tsconfig.app.json` → 0; full `npx vitest run` green.
6. No edits to `MATCHUP_MATRIX` or canon data.

```

```
