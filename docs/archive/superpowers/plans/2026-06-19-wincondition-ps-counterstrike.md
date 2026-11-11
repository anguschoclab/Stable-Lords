# Win Condition — PS Parry→Counterstrike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Parry-Strike (PS) a win condition — a successful parry primes a boosted strike on PS's next attack — implemented as a single clean ATT payoff consumed at the one attack-check chokepoint, validated against the Phase-1 balance harness.

**Architecture:** `FighterState` is a freely-mutated per-fight object (`src/engine/combat/resolution/types.ts`). It already carries one-exchange flags like `survivalStrike` ("grants a free riposte on next exchange"). We add an analogous `counterstrikePrimed` flag: set it when a PS fighter lands a successful parry (`resolveContestedDefense`), and consume it — a flat ATT bonus, then clear — at the single attack-check site (`performAttackCheck` call) every PS attack passes through. The bonus magnitude is a pure helper so it is unit-testable in isolation.

**Tech Stack:** TypeScript, Bun (`bun`/`bunx` — never npm/node), Vitest. Run one file with `npx vitest run <path>`.

**Scope:** This is the first of six per-style win-condition plans from `docs/superpowers/specs/2026-06-19-winconditions-remaining-design.md` (build order PS → BA → WS → PR → ST → SL). Each is an independent slice; this plan delivers PS alone, working and tested.

**Spec refinement (grounded in code):** The spec's default was "+2 ATT, +1 damage, one-exchange window." During grounding, the damage half was dropped: `executeHit` resolves damage only on a _landed_ hit, which would not clear the flag on a miss and needs a signature change to thread a damage bonus. A pure **ATT** payoff consumes/clears cleanly at the single attack chokepoint and is exactly what low-ATT PS needs to _land_ its counter. So PS's counterstrike is a flat ATT bonus on the next attack after a parry. Magnitude (`PS_COUNTERSTRIKE_ATT`) is a balance knob.

**Canon guardrails:** Mechanics layer only. Do NOT touch `MATCHUP_MATRIX` or weapon-suitability/mortality data. Phase-1 guardrails (antisymmetric matrix, 40–60% band) must stay green.

---

## File Structure

- **Create:** `src/engine/combat/resolution/counterstrike.ts` — pure `getCounterstrikeAttBonus(fighter)` helper. One responsibility: decide the PS counterstrike ATT bonus.
- **Create:** `src/test/engine/combat/counterstrike.test.ts` — unit tests for the helper.
- **Modify:** `src/constants/combat/combat.ts` — add the `PS_COUNTERSTRIKE_ATT` tunable constant.
- **Modify:** `src/engine/combat/resolution/types.ts` — add `counterstrikePrimed?: boolean` to `FighterState`.
- **Modify:** `src/engine/bout/fighterState.ts` — initialise `counterstrikePrimed: false`.
- **Modify:** `src/engine/combat/resolution/resolution.ts` — set the flag on a PS parry; consume+clear it at the attack-check site.
- **Modify:** `src/test/engine/economy/balance.test.ts` — only if the re-ratchet (Task 5) requires a `STYLE_PENALTIES` change; no new assertions.

---

## Task 1: The pure counterstrike helper (TDD)

**Files:**

- Create: `src/engine/combat/resolution/counterstrike.ts`
- Create: `src/test/engine/combat/counterstrike.test.ts`
- Modify: `src/constants/combat/combat.ts`

- [ ] **Step 1: Add the tunable constant**

In `src/constants/combat/combat.ts`, near the other Phase-1 balance constants (e.g. `ABSOLUTE_POWER_LOW`), add:

```typescript
/** Flat ATT bonus on a Parry-Strike fighter's next attack after a successful parry. Balance knob. */
export const PS_COUNTERSTRIKE_ATT = 2;
```

- [ ] **Step 2: Write the failing unit test**

Create `src/test/engine/combat/counterstrike.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import { getCounterstrikeAttBonus } from '@/engine/combat/resolution/counterstrike';
import { PS_COUNTERSTRIKE_ATT } from '@/constants/combat/combat';

// Minimal shim: the helper only reads `style` and `counterstrikePrimed`.
const fighter = (style: FightingStyle, primed: boolean) =>
  ({ style, counterstrikePrimed: primed }) as any;

describe('getCounterstrikeAttBonus', () => {
  it('is zero for a non-PS style even when primed', () => {
    expect(getCounterstrikeAttBonus(fighter(FightingStyle.BashingAttack, true))).toBe(0);
  });

  it('is zero for PS when not primed', () => {
    expect(getCounterstrikeAttBonus(fighter(FightingStyle.ParryStrike, false))).toBe(0);
  });

  it('grants the PS counterstrike ATT bonus for a primed PS fighter', () => {
    expect(getCounterstrikeAttBonus(fighter(FightingStyle.ParryStrike, true))).toBe(
      PS_COUNTERSTRIKE_ATT
    );
  });

  it('treats an undefined flag as not primed', () => {
    expect(getCounterstrikeAttBonus(fighter(FightingStyle.ParryStrike, undefined as any))).toBe(0);
  });
});
```

- [ ] **Step 3: Run it — expect FAIL (module not found)**

Run: `npx vitest run src/test/engine/combat/counterstrike.test.ts`
Expected: FAIL, "Cannot find module '@/engine/combat/resolution/counterstrike'".

- [ ] **Step 4: Implement the helper**

Create `src/engine/combat/resolution/counterstrike.ts`:

```typescript
import { FightingStyle } from '@/types/shared.types';
import { PS_COUNTERSTRIKE_ATT } from '@/constants/combat/combat';
import type { FighterState } from './types';

/**
 * Parry-Strike win condition: a successful parry primes `counterstrikePrimed`
 * (set in resolveContestedDefense). On the fighter's next attack we grant a
 * flat ATT bonus so PS — which has a low base ATT — can actually land its
 * counter. Returns 0 for any non-PS fighter or when not primed.
 */
export function getCounterstrikeAttBonus(
  fighter: Pick<FighterState, 'style' | 'counterstrikePrimed'>
): number {
  if (fighter.style !== FightingStyle.ParryStrike) return 0;
  return fighter.counterstrikePrimed ? PS_COUNTERSTRIKE_ATT : 0;
}
```

- [ ] **Step 5: Run the test — expect PASS**

Run: `npx vitest run src/test/engine/combat/counterstrike.test.ts`
Expected: PASS (all 4).

- [ ] **Step 6: Commit**

```bash
git add "src/engine/combat/resolution/counterstrike.ts" "src/test/engine/combat/counterstrike.test.ts" "src/constants/combat/combat.ts"
git commit -m "feat(combat): add PS counterstrike ATT-bonus helper (pure, unit-tested)"
```

---

## Task 2: Add the `counterstrikePrimed` flag to FighterState

**Files:**

- Modify: `src/engine/combat/resolution/types.ts`
- Modify: `src/engine/bout/fighterState.ts`

- [ ] **Step 1: Extend the FighterState interface**

In `src/engine/combat/resolution/types.ts`, inside `export interface FighterState`, next to `survivalStrike` (the existing one-exchange flag), add:

```typescript
  /** Parry-Strike: true after a successful parry — grants an ATT bonus on this
   *  fighter's next attack, then clears (spent on the attempt, hit or miss). */
  counterstrikePrimed?: boolean;
```

- [ ] **Step 2: Initialise it in the fighter builder**

In `src/engine/bout/fighterState.ts`, in the returned object literal (the block ending `…survivalStrike: false, recoveryDebt: 0,`), add after `survivalStrike: false,`:

```typescript
    counterstrikePrimed: false,
```

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: `0` (optional field + initialiser; no consumers yet).

- [ ] **Step 4: Commit**

```bash
git add "src/engine/combat/resolution/types.ts" "src/engine/bout/fighterState.ts"
git commit -m "feat(combat): add counterstrikePrimed flag to FighterState"
```

---

## Task 3: Set the flag on a PS parry

**Files:**

- Modify: `src/engine/combat/resolution/resolution.ts`

- [ ] **Step 1: Confirm the FightingStyle import**

Run: `grep -nE "import .*FightingStyle|from '@/types/shared.types'" src/engine/combat/resolution/resolution.ts | head`
If `FightingStyle` is not already imported, add it: `import { FightingStyle } from '@/types/shared.types';` near the other type imports at the top.

- [ ] **Step 2: Set the flag in the parry branch**

In `resolveContestedDefense` (`src/engine/combat/resolution/resolution.ts`), the successful-parry branch is `if (defCheck.success)` → `if (!isDodge)` (a parry, not a dodge), which currently updates `def.momentum` and runs the riposte check (around lines 322–365). Immediately after the momentum-shift block and before `const styleRip = styleRiposteBonus(def, att);`, add:

```typescript
// PS win condition: a successful parry primes a counterstrike on PS's next attack.
if (def.style === FightingStyle.ParryStrike) {
  def.counterstrikePrimed = true;
}
```

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: `0`.

- [ ] **Step 4: Commit**

```bash
git add "src/engine/combat/resolution/resolution.ts"
git commit -m "feat(combat): prime PS counterstrike on a successful parry"
```

---

## Task 4: Consume + clear the flag at the attack-check site

**Files:**

- Modify: `src/engine/combat/resolution/resolution.ts`

- [ ] **Step 1: Import the helper**

At the top of `src/engine/combat/resolution/resolution.ts`, with the other local imports, add:

```typescript
import { getCounterstrikeAttBonus } from './counterstrike';
```

- [ ] **Step 2: Apply the bonus and clear the flag at the `performAttackCheck` site**

The attacker's offense runs through a single `performAttackCheck(...)` call (around line 462), whose final argument is an additive ATT sum (`attMomentumBonus + attPsychMod + … + attDynTraitAtt`). Just before that call (near where `attMomentumBonus` is computed, ~line 454), add:

```typescript
// PS win condition: spend the primed counterstrike on this attack (hit or miss).
const counterstrikeAtt = getCounterstrikeAttBonus(att);
att.counterstrikePrimed = false; // window lapses on the attempt
```

Then add `+ counterstrikeAtt` to the additive ATT argument of `performAttackCheck`. The argument currently reads:

```typescript
attMomentumBonus +
  attPsychMod +
  (aGoesFirst ? es.rangeModA : es.rangeModD) +
  attCommit.attBonus +
  feintAttBonus +
  attWeaponRangeMod +
  attDynTraitAtt;
```

Change the final line to:

```typescript
attDynTraitAtt + counterstrikeAtt;
```

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: `0`.

- [ ] **Step 4: Integration test — PS lands its primed counter**

Create `src/test/engine/combat/psCounterstrike.integration.test.ts`. Drive a full fight and assert PS is functional and non-trivially competitive against an aggressive opponent (the mechanic's directional effect; exact win rate is tuned via the harness):

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

describe('PS counterstrike (integration)', () => {
  it('a Parry-Strike fighter remains competitive vs an aggressive Bashing Attack', () => {
    const ps = mk(FightingStyle.ParryStrike, 'PS');
    const ba = mk(FightingStyle.BashingAttack, 'BA');
    let wins = 0;
    const N = 400;
    for (let i = 0; i < N; i++) {
      const o = simulateFight(
        defaultPlanForWarrior(ps),
        defaultPlanForWarrior(ba),
        ps,
        ba,
        i * 4099 + 17
      );
      if (o.winner === 'A') wins++;
    }
    const rate = wins / N;
    // Directional floor: with the counterstrike, PS should not be a free win for BA.
    expect(rate, `PS vs BA win rate ${(rate * 100).toFixed(1)}%`).toBeGreaterThan(0.3);
  });
});
```

Run: `npx vitest run src/test/engine/combat/psCounterstrike.integration.test.ts`
Expected: PASS. If PS is below the floor, raise `PS_COUNTERSTRIKE_ATT` by 1 and re-run (do not exceed +4 — that is the re-ratchet's job, Task 5).

- [ ] **Step 5: Commit**

```bash
git add "src/engine/combat/resolution/resolution.ts" "src/test/engine/combat/psCounterstrike.integration.test.ts"
git commit -m "feat(combat): consume PS counterstrike at attack-check; integration test"
```

---

## Task 5: Re-ratchet absolute power and confirm guardrails

The counterstrike raises PS's effective power, so re-centre it in the Phase-1 band without touching the matrix.

**Files:**

- Modify (if needed): `src/engine/skillCalc.ts` (`STYLE_PENALTIES` — the PS row only)

- [ ] **Step 1: Run the balance harness**

Run: `npx vitest run src/test/engine/economy/balance.test.ts`
Expected: green. If the `Absolute-power band` test now flags PS as >0.60, PS over-performs — proceed to Step 2. If still green, skip to Step 3.

- [ ] **Step 2: Nudge PS penalties (only if out of band)**

In `src/engine/skillCalc.ts`, the `STYLE_PENALTIES` PS row is `[FightingStyle.ParryStrike]: /*PS*/ [-12, -6, -12, -9, -4, -1]`. Deepen the ATT penalty by 1 (e.g. `-12 → -13`) to offset the counterstrike's ATT gain — preserving PS's defensive _shape_ (do not touch its PAR/DEF identity). Re-run Step 1. Repeat in steps of 1 until PS is within `[0.40, 0.60]`.

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
git commit -m "balance(PS): re-ratchet absolute power after counterstrike; guardrails green"
```

---

## Self-Review Notes (for the implementer)

- **One chokepoint, one flag.** The flag is set in exactly one place (PS parry branch) and consumed+cleared in exactly one place (the `performAttackCheck` site). The clear is unconditional on the attacker's turn, so the window correctly lapses on a miss.
- **`getCounterstrikeAttBonus` is pure** — it reads only `style` + `counterstrikePrimed`. All style/primed gating lives there, so the resolution.ts edit is a two-line add.
- **Mechanics layer only.** No matrix edit. The Task-5 ratchet touches only the PS row of `STYLE_PENALTIES`, preserving PS's defensive shape (PAR/DEF untouched).
- **Magnitude is a knob.** `PS_COUNTERSTRIKE_ATT` and the PS penalty row are tuned against the harness; the _tests_ define done.

## Verification (done by reviewer after implementation)

1. `npx vitest run src/test/engine/combat/counterstrike.test.ts` → 4 pass.
2. `grep -n "counterstrikePrimed" src/engine/combat/resolution/resolution.ts` → set in the parry branch, cleared at the attack-check site.
3. `npx vitest run src/test/engine/combat/psCounterstrike.integration.test.ts` → PS vs BA above the floor.
4. `npx vitest run src/test/engine/economy/balance.test.ts` → green, including `near-antisymmetric` and the 40–60% band (PS in band).
5. `bunx tsc --noEmit --project tsconfig.app.json` → 0; full `npx vitest run` green.
6. No edits to `MATCHUP_MATRIX` or canon data.

```

```
