# Win Condition — ST All-In Threat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Striking Attack (ST) a three-part win condition — (1) _front-load_: a damage multiplier that decays with the exchange count; (2) _crit specialist_: raised crit chance and crit damage; (3) _execute_: bonus damage versus low-HP targets — making ST the high-variance glass cannon (terrifying early, fades late, prey to TP/WS), validated against the Phase-1 balance harness.

**Architecture:** All three effects live in the landed-hit path `executeHit` (`hitExecution.ts`), where the damage pipeline already applies weather/commit/crit multipliers. Each effect is a pure, style-gated helper (returns the no-op value for non-ST) so it is unit-testable in isolation: `getFrontloadMult(style, exchange)` reads `ctx.exchange`; `getStCritChanceBonus`/`getStCritDamageBonus` fold into the existing crit roll; `getExecuteBonus(style, hp, maxHp)` reads the defender's HP ratio.

**Tech Stack:** TypeScript, Bun (`bun`/`bunx` — never npm/node), Vitest. Run one file with `npx vitest run <path>`.

**Scope:** Fifth of six per-style win-condition plans from `docs/superpowers/specs/2026-06-19-winconditions-remaining-design.md` (build order PS → BA → WS → PR → **ST** → SL). Independent slice; delivers ST alone. ST is already strong — the Task-5 re-ratchet is the anti-power-creep step.

**Canon guardrails:** Mechanics layer only. Do NOT touch `MATCHUP_MATRIX` or weapon-suitability/mortality data. Phase-1 guardrails (antisymmetric matrix, 40–60% band) must stay green.

---

## File Structure

- **Create:** `src/engine/combat/resolution/strikingAttack.ts` — the four pure ST helpers.
- **Create:** `src/test/engine/combat/strikingAttack.test.ts` — unit tests + a directional integration fight.
- **Modify:** `src/constants/combat/combat.ts` — add the ST tunable constants.
- **Modify:** `src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts` — wire front-load, execute, and the ST crit bonuses into the damage pipeline.
- **Modify (if Task 5 requires):** `src/engine/skillCalc.ts` — `STYLE_PENALTIES` ST row only.

---

## Task 1: Pure ST helpers (TDD)

**Files:**

- Create: `src/engine/combat/resolution/strikingAttack.ts`
- Create: `src/test/engine/combat/strikingAttack.test.ts`
- Modify: `src/constants/combat/combat.ts`

- [ ] **Step 1: Add the tunable constants**

In `src/constants/combat/combat.ts`, near the other style constants, add:

```typescript
/** Striking Attack front-load: damage multiplier at exchange 0, decaying to 1.0 over the window. */
export const ST_FRONTLOAD_START = 1.3;
export const ST_FRONTLOAD_WINDOW = 6;
/** Striking Attack crit specialist: added crit chance and added crit-damage multiplier. */
export const ST_CRIT_CHANCE_BONUS = 0.1;
export const ST_CRIT_DAMAGE_BONUS = 0.2;
/** Striking Attack execute: bonus damage when the target's HP ratio is below the threshold. */
export const ST_EXECUTE_HP_THRESHOLD = 0.3;
export const ST_EXECUTE_BONUS = 2;
```

- [ ] **Step 2: Write the failing unit test**

Create `src/test/engine/combat/strikingAttack.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import {
  getFrontloadMult,
  getStCritChanceBonus,
  getStCritDamageBonus,
  getExecuteBonus,
} from '@/engine/combat/resolution/strikingAttack';
import {
  ST_FRONTLOAD_START,
  ST_FRONTLOAD_WINDOW,
  ST_CRIT_CHANCE_BONUS,
  ST_CRIT_DAMAGE_BONUS,
  ST_EXECUTE_BONUS,
} from '@/constants/combat/combat';

const ST = FightingStyle.StrikingAttack;
const OTHER = FightingStyle.TotalParry;

describe('getFrontloadMult', () => {
  it('peaks at the start for ST', () => {
    expect(getFrontloadMult(ST, 0)).toBeCloseTo(ST_FRONTLOAD_START);
  });
  it('decays to 1.0 by the end of the window', () => {
    expect(getFrontloadMult(ST, ST_FRONTLOAD_WINDOW)).toBeCloseTo(1.0);
  });
  it('never drops below 1.0 past the window', () => {
    expect(getFrontloadMult(ST, ST_FRONTLOAD_WINDOW * 3)).toBe(1.0);
  });
  it('is 1.0 (no-op) for non-ST styles', () => {
    expect(getFrontloadMult(OTHER, 0)).toBe(1.0);
  });
});

describe('ST crit bonuses', () => {
  it('grants chance + damage bonuses for ST', () => {
    expect(getStCritChanceBonus(ST)).toBe(ST_CRIT_CHANCE_BONUS);
    expect(getStCritDamageBonus(ST)).toBe(ST_CRIT_DAMAGE_BONUS);
  });
  it('are zero for non-ST styles', () => {
    expect(getStCritChanceBonus(OTHER)).toBe(0);
    expect(getStCritDamageBonus(OTHER)).toBe(0);
  });
});

describe('getExecuteBonus', () => {
  it('fires against a low-HP target for ST', () => {
    expect(getExecuteBonus(ST, 20, 100)).toBe(ST_EXECUTE_BONUS); // 20% < 30%
  });
  it('does not fire against a healthy target', () => {
    expect(getExecuteBonus(ST, 80, 100)).toBe(0);
  });
  it('is zero for non-ST styles even against a low-HP target', () => {
    expect(getExecuteBonus(OTHER, 20, 100)).toBe(0);
  });
});
```

- [ ] **Step 3: Run it — expect FAIL (module not found)**

Run: `npx vitest run src/test/engine/combat/strikingAttack.test.ts`
Expected: FAIL, "Cannot find module '@/engine/combat/resolution/strikingAttack'".

- [ ] **Step 4: Implement the helpers**

Create `src/engine/combat/resolution/strikingAttack.ts`:

```typescript
import { FightingStyle } from '@/types/shared.types';
import {
  ST_FRONTLOAD_START,
  ST_FRONTLOAD_WINDOW,
  ST_CRIT_CHANCE_BONUS,
  ST_CRIT_DAMAGE_BONUS,
  ST_EXECUTE_HP_THRESHOLD,
  ST_EXECUTE_BONUS,
} from '@/constants/combat/combat';

const isST = (style: FightingStyle) => style === FightingStyle.StrikingAttack;

/** Front-load damage multiplier: peaks at ST_FRONTLOAD_START, decays linearly to 1.0 over the window. */
export function getFrontloadMult(style: FightingStyle, exchange: number): number {
  if (!isST(style)) return 1.0;
  const t = Math.max(0, 1 - exchange / ST_FRONTLOAD_WINDOW);
  return 1 + (ST_FRONTLOAD_START - 1) * t;
}

/** Added crit chance for ST (folded into the base style-passive crit chance). */
export function getStCritChanceBonus(style: FightingStyle): number {
  return isST(style) ? ST_CRIT_CHANCE_BONUS : 0;
}

/** Added crit-damage multiplier for ST (added on top of CRIT_DAMAGE_MULT). */
export function getStCritDamageBonus(style: FightingStyle): number {
  return isST(style) ? ST_CRIT_DAMAGE_BONUS : 0;
}

/** Execute: flat bonus damage when the target is below the HP threshold. */
export function getExecuteBonus(style: FightingStyle, hp: number, maxHp: number): number {
  if (!isST(style)) return 0;
  return hp / Math.max(1, maxHp) < ST_EXECUTE_HP_THRESHOLD ? ST_EXECUTE_BONUS : 0;
}
```

- [ ] **Step 5: Run the test — expect PASS**

Run: `npx vitest run src/test/engine/combat/strikingAttack.test.ts`
Expected: PASS (all unit cases).

- [ ] **Step 6: Commit**

```bash
git add "src/engine/combat/resolution/strikingAttack.ts" "src/test/engine/combat/strikingAttack.test.ts" "src/constants/combat/combat.ts"
git commit -m "feat(combat): add ST front-load/crit/execute helpers (pure, unit-tested)"
```

---

## Task 2: Wire the helpers into the damage pipeline

**Files:**

- Modify: `src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts`

`FightingStyle` is already imported here. The pipeline computes `rawDamage` through weather/commit multipliers, then a crit block (`hitExecution.ts:160-162`).

- [ ] **Step 1: Import the helpers**

At the top of `hitExecution.ts`, with the other local imports, add:

```typescript
import {
  getFrontloadMult,
  getStCritChanceBonus,
  getStCritDamageBonus,
  getExecuteBonus,
} from '../../strikingAttack';
```

- [ ] **Step 2: Apply front-load and execute before the crit block**

The existing crit block reads:

```typescript
const isCrit = attPassive.critChance > 0 && rng() < attPassive.critChance;
if (isCrit) {
  rawDamage = Math.round(rawDamage * CRIT_DAMAGE_MULT);
}
```

Immediately **before** it, insert front-load (a multiplier on `ctx.exchange`) and execute (a flat bonus vs a low-HP defender):

```typescript
// ST front-load: early-exchange damage multiplier that decays over the fight
rawDamage = Math.round(rawDamage * getFrontloadMult(attacker.style, ctx?.exchange ?? 0));
// ST execute: bonus damage to finish a wounded target
rawDamage += getExecuteBonus(attacker.style, defender.hp, defender.maxHp);
```

- [ ] **Step 3: Fold the ST crit bonuses into the crit block**

Replace the existing crit block with the ST-aware version:

```typescript
const effectiveCritChance = attPassive.critChance + getStCritChanceBonus(attacker.style);
const isCrit = effectiveCritChance > 0 && rng() < effectiveCritChance;
if (isCrit) {
  rawDamage = Math.round(rawDamage * (CRIT_DAMAGE_MULT + getStCritDamageBonus(attacker.style)));
}
```

> The second `if (isCrit)` block later in the function (crit metadata/event) is unaffected — `isCrit` keeps the same meaning.

- [ ] **Step 4: Typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: `0`.

- [ ] **Step 5: Commit**

```bash
git add "src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts"
git commit -m "feat(combat): wire ST front-load, execute, and crit bonuses into hit damage"
```

---

## Task 3: Directional integration test

**Files:**

- Modify: `src/test/engine/combat/strikingAttack.test.ts`

- [ ] **Step 1: Add an ST fight test**

Append to `src/test/engine/combat/strikingAttack.test.ts`:

```typescript
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { computeWarriorStats } from '@/engine/skillCalc';
import type { Warrior } from '@/types/game';

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

describe('ST all-in (integration)', () => {
  it('Striking Attack is a real threat against a mid-tier Parry-Lunge', () => {
    const st = mk(FightingStyle.StrikingAttack, 'ST');
    const pl = mk(FightingStyle.ParryLunge, 'PL');
    let wins = 0;
    const N = 400;
    for (let i = 0; i < N; i++) {
      const o = simulateFight(
        defaultPlanForWarrior(st),
        defaultPlanForWarrior(pl),
        st,
        pl,
        i * 9001 + 37
      );
      if (o.winner === 'A') wins++;
    }
    const rate = wins / N;
    // ST is a burst threat — it should be competitive, not a pushover.
    expect(rate, `ST vs PL win rate ${(rate * 100).toFixed(1)}%`).toBeGreaterThan(0.4);
  });
});
```

Run: `npx vitest run src/test/engine/combat/strikingAttack.test.ts`
Expected: PASS. ST's _overall_ level is the re-ratchet's job (Task 4); do not over-tune the constants to hit this floor.

- [ ] **Step 2: Commit**

```bash
git add "src/test/engine/combat/strikingAttack.test.ts"
git commit -m "test(combat): ST is a burst threat vs PL (integration)"
```

---

## Task 4: Re-ratchet absolute power and confirm guardrails

ST is already strong; front-load + crit + execute push it up. Re-centre it in the 40–60% band **without touching the matrix** — the anti-power-creep step.

**Files:**

- Modify (if needed): `src/engine/skillCalc.ts` (`STYLE_PENALTIES` — the ST row only)

- [ ] **Step 1: Run the balance harness**

Run: `npx vitest run src/test/engine/economy/balance.test.ts`
Expected: the `Absolute-power band` test likely flags ST as >0.60. If green, skip to Step 3.

- [ ] **Step 2: Deepen ST penalties (only if out of band)**

In `src/engine/skillCalc.ts`, the ST row is `[FightingStyle.StrikingAttack]: /*ST*/ [-7, -6, -9, -2, -2, +2]`. Deepen the **ATT** penalty in steps of 1–2 (e.g. `-7 → -9`) to pay for the new offensive payoff while keeping ST's damage-dealer _shape_ (it remains ATT-led; do not touch INI/DEC identity). Re-run Step 1 until ST is within `[0.40, 0.60]` and no other style left the band.

- [ ] **Step 3: Confirm the matrix never moved**

Run: `npx vitest run src/test/engine/economy/balance.test.ts -t "near-antisymmetric"`
Expected: PASS.

- [ ] **Step 4: Full suite + typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`
Run: `npx vitest run 2>&1 | tail -4`
Expected: all green (no pre-existing test regressed).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "balance(ST): re-ratchet absolute power after all-in mechanics; guardrails green"
```

---

## Self-Review Notes (for the implementer)

- **Three pure helpers, one wiring site.** Front-load (multiplier), execute (flat), and crit bonuses (folded into the existing crit roll) are each style-gated and return no-ops for non-ST — so the `hitExecution` edit is additive and touches no other style's damage.
- **Order matters for variance.** Front-load and execute apply _before_ crit, so a crit on a front-loaded finisher is enormous — the intended high-variance "all-in" feel. This is deliberate.
- **`ctx?.exchange ?? 0`** — `ctx` is optional in `executeHit`; defaulting to exchange 0 gives the max front-load only in the (rare, test-only) ctx-less path. Real fights always pass `ctx`.
- **Identity is shape.** The Task-4 ratchet deepens ST's ATT penalty only — ST stays the ATT-led damage dealer; do not flatten its INI/DEC profile. Front-load is what makes it _fade_, the design's built-in counterplay (TP/WS outlast it).

## Verification (done by reviewer after implementation)

1. `npx vitest run src/test/engine/combat/strikingAttack.test.ts` → unit (front-load decay, crit bonuses, execute) + integration pass.
2. `grep -n "getFrontloadMult\|getExecuteBonus\|getStCritChanceBonus" src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts` → all wired; crit block uses the effective chance + ST damage bonus.
3. `npx vitest run src/test/engine/economy/balance.test.ts` → green, including `near-antisymmetric` and the 40–60% band (ST in band).
4. `bunx tsc --noEmit --project tsconfig.app.json` → 0; full `npx vitest run` green.
5. No edits to `MATCHUP_MATRIX` or canon data.

```

```
