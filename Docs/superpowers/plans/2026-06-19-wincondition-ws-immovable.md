# Win Condition — WS Immovable (Tempo-Immune) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Wall of Steel (WS) a win condition — it is _immovable_: the LU and PL initiative-snowball payoffs are negated when WS is on the receiving end, and WS gains a small steady-attrition floor so the brick still closes fights. Creates clean rock-paper-scissors (LU/PL snowball tempo, WS breaks it), validated against the Phase-1 balance harness.

**Architecture:** Spec 2a is already implemented: LU's momentum-damage lives inline in `executeHit` (`hitExecution.ts:114`), and PL's momentum-riposte lives in the exported `styleRiposteBonus()` (`resolution.ts:203`). This plan (1) extracts LU's momentum damage into a pure, WS-aware helper that returns 0 when the defender is WS, (2) adds a one-condition WS gate to the PL branch of `styleRiposteBonus`, and (3) adds a WS attrition floor via a second pure helper. No new matrix entries; WS's absolute power is re-centred in `STYLE_PENALTIES`.

**Tech Stack:** TypeScript, Bun (`bun`/`bunx` — never npm/node), Vitest. Run one file with `npx vitest run <path>`.

**Scope:** Third of six per-style win-condition plans from `docs/superpowers/specs/2026-06-19-winconditions-remaining-design.md` (build order PS → BA → **WS** → PR → ST → SL). **Hard dependency satisfied:** WS gates 2a's LU/PL momentum payoffs, both verified present in the code.

**Canon guardrails:** Mechanics layer only. Do NOT touch `MATCHUP_MATRIX` or weapon-suitability/mortality data. Phase-1 guardrails (antisymmetric matrix, 40–60% band) must stay green.

---

## File Structure

- **Create:** `src/engine/combat/resolution/tempoMechanics.ts` — pure `getMomentumDamageBonus(...)` (WS-aware LU momentum) and `getWsAttritionBonus(...)`.
- **Create:** `src/test/engine/combat/tempoMechanics.test.ts` — unit tests for both helpers.
- **Modify:** `src/constants/combat/combat.ts` — add `LU_MOMENTUM_DMG_COEFF` (extracted from the `0.5` literal) and `WS_ATTRITION_FLOOR`.
- **Modify:** `src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts` — replace the inline LU block with the helper; add the WS attrition floor.
- **Modify:** `src/engine/combat/resolution/resolution.ts` — add the WS gate to the PL branch of `styleRiposteBonus`.
- **Create:** `src/test/engine/combat/wsImmovable.test.ts` — unit test for `styleRiposteBonus` WS-immunity + a directional integration fight.
- **Modify (if Task 5 requires):** `src/engine/skillCalc.ts` — `STYLE_PENALTIES` WS row only.

---

## Task 1: Pure tempo helpers (TDD)

**Files:**

- Create: `src/engine/combat/resolution/tempoMechanics.ts`
- Create: `src/test/engine/combat/tempoMechanics.test.ts`
- Modify: `src/constants/combat/combat.ts`

- [ ] **Step 1: Add the tunable constants**

In `src/constants/combat/combat.ts`, near the other style constants, add:

```typescript
/** Damage per momentum point for Lunging Attack's first-strike pressure. Balance knob. */
export const LU_MOMENTUM_DMG_COEFF = 0.5;
/** Flat attrition damage on a Wall of Steel landed hit so the immovable brick still closes fights. */
export const WS_ATTRITION_FLOOR = 0.5;
```

- [ ] **Step 2: Write the failing unit test**

Create `src/test/engine/combat/tempoMechanics.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import {
  getMomentumDamageBonus,
  getWsAttritionBonus,
} from '@/engine/combat/resolution/tempoMechanics';
import { LU_MOMENTUM_DMG_COEFF, WS_ATTRITION_FLOOR } from '@/constants/combat/combat';

describe('getMomentumDamageBonus', () => {
  it('grants LU momentum damage vs a normal defender', () => {
    expect(
      getMomentumDamageBonus(FightingStyle.LungingAttack, 3, FightingStyle.StrikingAttack)
    ).toBe(3 * LU_MOMENTUM_DMG_COEFF);
  });

  it('is negated when the defender is Wall of Steel (immovable)', () => {
    expect(getMomentumDamageBonus(FightingStyle.LungingAttack, 3, FightingStyle.WallOfSteel)).toBe(
      0
    );
  });

  it('is zero for a non-LU attacker', () => {
    expect(
      getMomentumDamageBonus(FightingStyle.BashingAttack, 3, FightingStyle.StrikingAttack)
    ).toBe(0);
  });

  it('is zero when momentum is not positive', () => {
    expect(
      getMomentumDamageBonus(FightingStyle.LungingAttack, 0, FightingStyle.StrikingAttack)
    ).toBe(0);
  });
});

describe('getWsAttritionBonus', () => {
  it('grants the attrition floor for a WS attacker', () => {
    expect(getWsAttritionBonus(FightingStyle.WallOfSteel)).toBe(WS_ATTRITION_FLOOR);
  });

  it('is zero for any non-WS attacker', () => {
    expect(getWsAttritionBonus(FightingStyle.LungingAttack)).toBe(0);
  });
});
```

- [ ] **Step 3: Run it — expect FAIL (module not found)**

Run: `npx vitest run src/test/engine/combat/tempoMechanics.test.ts`
Expected: FAIL, "Cannot find module '@/engine/combat/resolution/tempoMechanics'".

- [ ] **Step 4: Implement the helpers**

Create `src/engine/combat/resolution/tempoMechanics.ts`:

```typescript
import { FightingStyle } from '@/types/shared.types';
import { LU_MOMENTUM_DMG_COEFF, WS_ATTRITION_FLOOR } from '@/constants/combat/combat';

/**
 * Lunging Attack's first-strike damage pressure, scaled by momentum — UNLESS
 * the defender is Wall of Steel, which is immovable and negates the tempo
 * snowball. Pure; returns the damage to add to a landed hit.
 */
export function getMomentumDamageBonus(
  attackerStyle: FightingStyle,
  attackerMomentum: number,
  defenderStyle: FightingStyle
): number {
  if (defenderStyle === FightingStyle.WallOfSteel) return 0; // immovable
  if (attackerStyle === FightingStyle.LungingAttack && attackerMomentum > 0) {
    return attackerMomentum * LU_MOMENTUM_DMG_COEFF;
  }
  return 0;
}

/** Wall of Steel attrition floor: a flat damage bump on WS landed hits. */
export function getWsAttritionBonus(attackerStyle: FightingStyle): number {
  return attackerStyle === FightingStyle.WallOfSteel ? WS_ATTRITION_FLOOR : 0;
}
```

- [ ] **Step 5: Run the test — expect PASS**

Run: `npx vitest run src/test/engine/combat/tempoMechanics.test.ts`
Expected: PASS (all 6).

- [ ] **Step 6: Commit**

```bash
git add "src/engine/combat/resolution/tempoMechanics.ts" "src/test/engine/combat/tempoMechanics.test.ts" "src/constants/combat/combat.ts"
git commit -m "feat(combat): add WS-aware tempo damage + WS attrition helpers (pure, unit-tested)"
```

---

## Task 2: Wire the helpers into the landed-hit path

**Files:**

- Modify: `src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts`

`FightingStyle` is already imported here.

- [ ] **Step 1: Import the helpers**

At the top of `hitExecution.ts`, with the other local imports, add:

```typescript
import { getMomentumDamageBonus, getWsAttritionBonus } from '../../tempoMechanics';
```

- [ ] **Step 2: Replace the inline LU block and add WS attrition**

Find the existing LU block (lines ~113–116):

```typescript
// LU: momentum damage pressure on a landed hit
if (attacker.style === FightingStyle.LungingAttack && attacker.momentum > 0) {
  preArmor += attacker.momentum * 0.5;
}
```

Replace it entirely with:

```typescript
// Tempo: LU momentum damage — negated when the defender is Wall of Steel (immovable)
preArmor += getMomentumDamageBonus(attacker.style, attacker.momentum, defender.style);
// WS: immovable — steady attrition floor so the brick still closes fights
preArmor += getWsAttritionBonus(attacker.style);
```

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: `0`.

- [ ] **Step 4: Confirm the LU refactor is behaviour-preserving (except vs WS)**

The LU momentum value is unchanged for non-WS defenders; only the vs-WS case now returns 0, and WS attackers gain a small floor. Run the balance harness to confirm nothing unexpected shifted:

Run: `npx vitest run src/test/engine/economy/balance.test.ts`
Expected: green (WS/LU win rates may move slightly — that is the intended effect; the band test must still pass, or be addressed in Task 5).

- [ ] **Step 5: Commit**

```bash
git add "src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts"
git commit -m "feat(combat): WS negates LU momentum damage; add WS attrition floor"
```

---

## Task 3: Gate the PL momentum-riposte against WS

**Files:**

- Modify: `src/engine/combat/resolution/resolution.ts`
- Create: `src/test/engine/combat/wsImmovable.test.ts`

`styleRiposteBonus(def, att)` (`resolution.ts:203`) computes per-style riposte bonuses; the PL branch reads the riposting fighter's momentum. `def` is the riposter (PL); `att` is the target being riposted. WS immunity means: when the target (`att`) is WS, PL's tempo-riposte snowball does not apply.

- [ ] **Step 1: Add the WS gate to the PL branch**

The current PL branch (lines ~214–218):

```typescript
// PL: momentum-based riposte pressure (reactive tempo, not raw attack damage)
if (def.style === FightingStyle.ParryLunge && def.momentum > 0) {
  ripBonus += def.momentum;
  dmgBonus += def.momentum * 0.5;
}
```

Change the condition to negate it when the target is the immovable WS:

```typescript
// PL: momentum-based riposte pressure (reactive tempo, not raw attack damage).
// Negated when the target is Wall of Steel — WS is immovable to tempo snowballs.
if (
  def.style === FightingStyle.ParryLunge &&
  def.momentum > 0 &&
  att.style !== FightingStyle.WallOfSteel
) {
  ripBonus += def.momentum;
  dmgBonus += def.momentum * 0.5;
}
```

- [ ] **Step 2: Write the unit test (styleRiposteBonus is exported)**

Create `src/test/engine/combat/wsImmovable.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import { styleRiposteBonus } from '@/engine/combat/resolution/resolution';

// Shim: styleRiposteBonus reads only style/momentum (PL) and endurance (TP).
const f = (style: FightingStyle, momentum = 0) =>
  ({ style, momentum, endurance: 100, maxEndurance: 100 }) as any;

describe('styleRiposteBonus — WS immovable', () => {
  it('PL gets momentum riposte pressure vs a normal target', () => {
    const r = styleRiposteBonus(f(FightingStyle.ParryLunge, 2), f(FightingStyle.StrikingAttack));
    expect(r.ripBonus).toBe(2);
    expect(r.dmgBonus).toBe(1);
  });

  it('PL momentum riposte is negated when the target is Wall of Steel', () => {
    const r = styleRiposteBonus(f(FightingStyle.ParryLunge, 2), f(FightingStyle.WallOfSteel));
    expect(r.ripBonus).toBe(0);
    expect(r.dmgBonus).toBe(0);
  });
});
```

- [ ] **Step 3: Run it — expect PASS**

Run: `npx vitest run src/test/engine/combat/wsImmovable.test.ts`
Expected: PASS (both).

- [ ] **Step 4: Typecheck + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`

```bash
git add "src/engine/combat/resolution/resolution.ts" "src/test/engine/combat/wsImmovable.test.ts"
git commit -m "feat(combat): WS negates PL momentum-riposte snowball; unit test"
```

---

## Task 4: Directional integration test

**Files:**

- Modify: `src/test/engine/combat/wsImmovable.test.ts`

- [ ] **Step 1: Add a WS-vs-LU fight test**

Append to `src/test/engine/combat/wsImmovable.test.ts`:

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

describe('WS immovable (integration)', () => {
  it('Wall of Steel resists a Lunging Attack tempo snowball', () => {
    const ws = mk(FightingStyle.WallOfSteel, 'WS');
    const lu = mk(FightingStyle.LungingAttack, 'LU');
    let wins = 0;
    const N = 400;
    for (let i = 0; i < N; i++) {
      const o = simulateFight(
        defaultPlanForWarrior(ws),
        defaultPlanForWarrior(lu),
        ws,
        lu,
        i * 7177 + 29
      );
      if (o.winner === 'A') wins++;
    }
    const rate = wins / N;
    // WS is immune to LU's snowball — it should hold its own, not get run over.
    expect(rate, `WS vs LU win rate ${(rate * 100).toFixed(1)}%`).toBeGreaterThan(0.35);
  });
});
```

Run: `npx vitest run src/test/engine/combat/wsImmovable.test.ts`
Expected: PASS. If WS is below the floor, raise `WS_ATTRITION_FLOOR` to 0.75 and re-run; WS's _overall_ level is the re-ratchet's job (Task 5).

- [ ] **Step 2: Commit**

```bash
git add "src/test/engine/combat/wsImmovable.test.ts"
git commit -m "test(combat): WS resists LU tempo snowball (integration)"
```

---

## Task 5: Re-ratchet absolute power and confirm guardrails

WS is one of the weakest styles; immunity + attrition lift it slightly. Re-centre it in the 40–60% band **without touching the matrix** — here that usually means _lightening_ WS penalties, not deepening them.

**Files:**

- Modify (if needed): `src/engine/skillCalc.ts` (`STYLE_PENALTIES` — the WS row only)

- [ ] **Step 1: Run the balance harness**

Run: `npx vitest run src/test/engine/economy/balance.test.ts`
Expected: if the `Absolute-power band` test flags WS as <0.40, proceed to Step 2; if green, skip to Step 3.

- [ ] **Step 2: Lighten WS penalties (only if out of band)**

In `src/engine/skillCalc.ts`, the WS row is `[FightingStyle.WallOfSteel]: /*WS*/ [-4, -2, -9, 0, -2, 0]`. Lighten the **DEF** penalty in steps of 1 (e.g. `-9 → -7`) to lift WS toward the band while preserving its defensive _shape_ (keep INI at 0 — WS stays the slowest; do not turn it into an attacker). Re-run Step 1. Repeat until WS is within `[0.40, 0.60]` and no other style left the band.

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
git commit -m "balance(WS): re-ratchet absolute power after immovable mechanic; guardrails green"
```

---

## Self-Review Notes (for the implementer)

- **Two gates, one floor.** WS-immunity is enforced in exactly two places: `getMomentumDamageBonus` (LU, defender = WS → 0) and the `styleRiposteBonus` PL branch (target = WS → no bonus). The attrition floor is the only thing WS _gains_.
- **The LU refactor is behaviour-preserving** for every non-WS defender — the `0.5` literal became `LU_MOMENTUM_DMG_COEFF` and the logic is identical except the new vs-WS short-circuit.
- **Identity is shape, not level.** WS stays the slowest style (INI untouched). It does not gain tempo — it _denies_ it. The Task-5 ratchet only lightens its defensive penalties to reach the band.
- **Dependency is real and satisfied** — this plan edits 2a's LU/PL code. If 2a were reverted, these gates would have nothing to gate; confirm `getMomentumDamageBonus`'s LU branch and the PL branch of `styleRiposteBonus` exist before starting.

## Verification (done by reviewer after implementation)

1. `npx vitest run src/test/engine/combat/tempoMechanics.test.ts` → 6 pass.
2. `npx vitest run src/test/engine/combat/wsImmovable.test.ts` → unit (PL vs WS zeroed) + integration (WS vs LU > 0.35) pass.
3. `grep -n "WallOfSteel" src/engine/combat/resolution/tempoMechanics.ts src/engine/combat/resolution/resolution.ts` → immunity in both the LU helper and the PL branch.
4. `npx vitest run src/test/engine/economy/balance.test.ts` → green, including `near-antisymmetric` and the 40–60% band (WS in band).
5. `bunx tsc --noEmit --project tsconfig.app.json` → 0; full `npx vitest run` green.
6. No edits to `MATCHUP_MATRIX` or canon data.

```

```
