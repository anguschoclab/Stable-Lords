# Win Condition — SL Bleed + Flurry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Slashing Attack (SL) a win condition — landed SL hits apply stacking **bleed** (a new lightweight damage-over-time that ticks each exchange and decays), and SL's **flurry** of cuts applies multiple stacks per hit so bleed builds fast — making SL the attrition/DoT style, validated against the Phase-1 balance harness.

**Architecture:** This is the only mechanic that adds a new subsystem. It is deliberately minimal: a `bleedStacks` field on `FighterState`, accumulated on a landed SL hit in `executeHit` (`hitExecution.ts`, alongside the existing AB/LU/BA style blocks), and ticked once per exchange at the end of `resolveExchange` (`resolution.ts`, just before `return events`), where it deals `stacks × tick` damage to each bleeding fighter, pushes a bleed event, and decays. Both the accumulation and the tick are pure helpers so they are unit-testable; the subsystem is generic (a plain stack counter) so future effects could reuse it, but only bleed is implemented (YAGNI).

**Tech Stack:** TypeScript, Bun (`bun`/`bunx` — never npm/node), Vitest. Run one file with `npx vitest run <path>`.

**Scope:** Sixth and final per-style win-condition plan from `docs/superpowers/specs/2026-06-19-winconditions-remaining-design.md` (build order PS → BA → WS → PR → ST → **SL**). Independent slice; completes the set (all ten styles).

**Spec refinement (grounded):** The spec's flurry "splits SL's attack into multiple smaller strikes." Literal multi-strike resolution would require restructuring the one-attack-per-exchange flow (extra attack/defense/riposte passes) — a large, risky change. Grounded version: **flurry = multiple bleed stacks per landed hit** (`SL_BLEED_STACKS_PER_HIT`), delivering the intended "stacks bleed faster than a single-hit style" outcome without rewriting the attack loop. Per-hit direct damage is unchanged; the bleed DoT is SL's payoff.

**Canon guardrails:** Mechanics layer only. Do NOT touch `MATCHUP_MATRIX` or weapon-suitability/mortality data. Phase-1 guardrails (antisymmetric matrix, 40–60% band) must stay green. Bleed can reduce HP to 0 — the existing post-exchange death check in `simulationLoop.ts` handles fight-end — so the harness **kill-rate** test (4.5–16%) is part of Task 5's validation.

---

## File Structure

- **Create:** `src/engine/combat/resolution/bleed.ts` — pure `accumulateBleed(current)` and `tickBleed(stacks)`.
- **Create:** `src/test/engine/combat/bleed.test.ts` — unit tests + a directional integration fight.
- **Modify:** `src/constants/combat/combat.ts` — add the SL bleed constants.
- **Modify:** `src/engine/combat/resolution/types.ts` — add `bleedStacks?: number` to `FighterState`.
- **Modify:** `src/engine/bout/fighterState.ts` — initialise `bleedStacks: 0`.
- **Modify:** `src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts` — apply bleed on a landed SL hit.
- **Modify:** `src/engine/combat/resolution/resolution.ts` — tick bleed at the end of `resolveExchange`.
- **Modify (if Task 5 requires):** `src/engine/skillCalc.ts` — `STYLE_PENALTIES` SL row only.

---

## Task 1: Pure bleed helpers (TDD)

**Files:**
- Create: `src/engine/combat/resolution/bleed.ts`
- Create: `src/test/engine/combat/bleed.test.ts`
- Modify: `src/constants/combat/combat.ts`

- [ ] **Step 1: Add the tunable constants**

In `src/constants/combat/combat.ts`, near the other style constants, add:

```typescript
/** Slashing Attack flurry: bleed stacks applied per landed SL hit. Balance knob. */
export const SL_BLEED_STACKS_PER_HIT = 2;
/** Maximum bleed stacks a fighter can carry. */
export const SL_BLEED_CAP = 5;
/** Damage per bleed stack per exchange tick. */
export const SL_BLEED_TICK_DMG = 1;
/** Bleed stacks shed per exchange (natural clotting). */
export const SL_BLEED_DECAY = 1;
```

- [ ] **Step 2: Write the failing unit test**

Create `src/test/engine/combat/bleed.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { accumulateBleed, tickBleed } from '@/engine/combat/resolution/bleed';
import {
  SL_BLEED_STACKS_PER_HIT,
  SL_BLEED_CAP,
  SL_BLEED_TICK_DMG,
  SL_BLEED_DECAY,
} from '@/constants/combat/combat';

describe('accumulateBleed', () => {
  it('adds the per-hit flurry stacks from zero', () => {
    expect(accumulateBleed(0)).toBe(SL_BLEED_STACKS_PER_HIT);
  });

  it('accumulates across hits and clamps at the cap', () => {
    let s = 0;
    for (let i = 0; i < 10; i++) s = accumulateBleed(s);
    expect(s).toBe(SL_BLEED_CAP);
  });
});

describe('tickBleed', () => {
  it('deals stacks × tick damage and decays the stacks', () => {
    const { damage, next } = tickBleed(3);
    expect(damage).toBe(3 * SL_BLEED_TICK_DMG);
    expect(next).toBe(3 - SL_BLEED_DECAY);
  });

  it('never decays below zero', () => {
    const { damage, next } = tickBleed(0);
    expect(damage).toBe(0);
    expect(next).toBe(0);
  });

  it('a full stack bleeds down over successive ticks', () => {
    let s = SL_BLEED_CAP;
    let total = 0;
    while (s > 0) {
      const t = tickBleed(s);
      total += t.damage;
      s = t.next;
    }
    // 5+4+3+2+1 = 15 total bleed damage from a maxed stack
    expect(total).toBe(15 * SL_BLEED_TICK_DMG);
  });
});
```

- [ ] **Step 3: Run it — expect FAIL (module not found)**

Run: `npx vitest run src/test/engine/combat/bleed.test.ts`
Expected: FAIL, "Cannot find module '@/engine/combat/resolution/bleed'".

- [ ] **Step 4: Implement the helpers**

Create `src/engine/combat/resolution/bleed.ts`:

```typescript
import {
  SL_BLEED_STACKS_PER_HIT,
  SL_BLEED_CAP,
  SL_BLEED_TICK_DMG,
  SL_BLEED_DECAY,
} from '@/constants/combat/combat';

/**
 * Slashing Attack win condition (flurry of cuts): add bleed stacks to a target
 * on a landed SL hit, clamped to the cap. Pure — the caller owns the mutation.
 */
export function accumulateBleed(current: number): number {
  return Math.min(SL_BLEED_CAP, current + SL_BLEED_STACKS_PER_HIT);
}

/**
 * One exchange's bleed tick: damage dealt this exchange and the decayed stack
 * count for next exchange. Pure.
 */
export function tickBleed(stacks: number): { damage: number; next: number } {
  return {
    damage: stacks * SL_BLEED_TICK_DMG,
    next: Math.max(0, stacks - SL_BLEED_DECAY),
  };
}
```

- [ ] **Step 5: Run the test — expect PASS**

Run: `npx vitest run src/test/engine/combat/bleed.test.ts`
Expected: PASS (all unit cases).

- [ ] **Step 6: Commit**

```bash
git add "src/engine/combat/resolution/bleed.ts" "src/test/engine/combat/bleed.test.ts" "src/constants/combat/combat.ts"
git commit -m "feat(combat): add SL bleed subsystem helpers (pure, unit-tested)"
```

---

## Task 2: Add the `bleedStacks` field to FighterState

**Files:**
- Modify: `src/engine/combat/resolution/types.ts`
- Modify: `src/engine/bout/fighterState.ts`

- [ ] **Step 1: Extend the FighterState interface**

In `src/engine/combat/resolution/types.ts`, inside `export interface FighterState`, near `momentum`, add:

```typescript
  /** Slashing Attack bleed: damage-over-time stacks this fighter is suffering.
   *  0..SL_BLEED_CAP; ticks and decays each exchange in resolveExchange. */
  bleedStacks?: number;
```

- [ ] **Step 2: Initialise it**

In `src/engine/bout/fighterState.ts`, in the returned object literal (near `momentum: 0,`), add:

```typescript
    bleedStacks: 0,
```

- [ ] **Step 3: Typecheck + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.
```bash
git add "src/engine/combat/resolution/types.ts" "src/engine/bout/fighterState.ts"
git commit -m "feat(combat): add bleedStacks field to FighterState"
```

---

## Task 3: Apply bleed on a landed SL hit

**Files:**
- Modify: `src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts`

`executeHit` is the landed-hit path; `FightingStyle` is already imported. Add an SL block alongside the existing AB/LU/BA style blocks.

- [ ] **Step 1: Import the helper**

At the top of `hitExecution.ts`, with the other local imports, add:

```typescript
import { accumulateBleed } from '../../bleed';
```

- [ ] **Step 2: Apply bleed stacks on the landed SL hit**

Near the other style-specific landed-hit blocks (after the LU/BA blocks, before the armor step), add:

```typescript
  // SL: flurry of cuts — each landed hit stacks bleed (damage-over-time) on the defender
  if (attacker.style === FightingStyle.SlashingAttack) {
    defender.bleedStacks = accumulateBleed(defender.bleedStacks ?? 0);
  }
```

- [ ] **Step 3: Typecheck + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0` (accumulates but nothing ticks yet — no behaviour change).
```bash
git add "src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts"
git commit -m "feat(combat): SL applies bleed stacks on landed hits"
```

---

## Task 4: Tick bleed at the end of each exchange

**Files:**
- Modify: `src/engine/combat/resolution/resolution.ts`
- Create: (integration test) `src/test/engine/combat/bleed.test.ts` (append)

`resolveExchange` builds `const events: CombatEvent[] = []` (line ~580) and ends with `return events;` (line ~834). `fA`, `fD`, and `events` are all in scope at the return. `CombatEvent.location` is a free `string` and `metadata.cause` mirrors the existing `'SURVIVAL_STRIKE'`/`'FATAL_DAMAGE'` convention.

- [ ] **Step 1: Import the tick helper**

At the top of `resolution.ts`, with the other local imports, add:

```typescript
import { tickBleed } from './bleed';
```

- [ ] **Step 2: Insert the bleed tick before `return events`**

Immediately before `return events;` at the end of `resolveExchange`, add:

```typescript
  // SL bleed: damage-over-time tick on any bleeding fighter, then decay.
  for (const fighter of [fA, fD]) {
    const stacks = fighter.bleedStacks ?? 0;
    if (stacks > 0) {
      const { damage, next } = tickBleed(stacks);
      fighter.hp -= damage;
      fighter.bleedStacks = next;
      events.push({
        type: 'HIT',
        actor: fighter.label === 'A' ? 'D' : 'A',
        target: fighter.label,
        value: damage,
        location: 'Bleed',
        metadata: { cause: 'BLEED', stacks: next },
      });
    }
  }
```

> Bleed can reduce `hp` to 0 — the simulation loop's post-exchange HP check (`simulationLoop.ts`) ends the fight, so no extra death handling is needed here. Whether a bleed-out is attributed as a "kill" is validated indirectly by the harness kill-rate test (Task 5).

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: `0`.

- [ ] **Step 4: Integration test — SL grinds a tank down**

Append to `src/test/engine/combat/bleed.test.ts`:

```typescript
import { FightingStyle, type Warrior } from '@/types/game';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { computeWarriorStats } from '@/engine/skillCalc';

function mk(style: FightingStyle, id: string): Warrior {
  const attrs = { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 };
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  return {
    id: id as import('@/types/shared.types').WarriorId, name: id, style,
    attributes: attrs, baseSkills, derivedStats, fame: 0, popularity: 0,
    titles: [], injuries: [], flair: [], career: { wins: 0, losses: 0, kills: 0 },
    champion: false, status: 'Active', age: 20, traits: [],
  };
}

describe('SL bleed (integration)', () => {
  it('Slashing Attack stays competitive vs a defensive Parry-Strike via attrition', () => {
    const sl = mk(FightingStyle.SlashingAttack, 'SL');
    const ps = mk(FightingStyle.ParryStrike, 'PS');
    let wins = 0;
    const N = 400;
    for (let i = 0; i < N; i++) {
      const o = simulateFight(defaultPlanForWarrior(sl), defaultPlanForWarrior(ps), sl, ps, i * 10009 + 41);
      if (o.winner === 'A') wins++;
    }
    const rate = wins / N;
    // Bleed rewards sustained engagement — SL should hold its own.
    expect(rate, `SL vs PS win rate ${(rate * 100).toFixed(1)}%`).toBeGreaterThan(0.40);
  });
});
```

Run: `npx vitest run src/test/engine/combat/bleed.test.ts`
Expected: PASS. If SL is below the floor, raise `SL_BLEED_STACKS_PER_HIT` to 3 or `SL_BLEED_TICK_DMG` to 1.5; SL's *overall* level is the re-ratchet's job (Task 5).

- [ ] **Step 5: Commit**

```bash
git add "src/engine/combat/resolution/resolution.ts" "src/test/engine/combat/bleed.test.ts"
git commit -m "feat(combat): tick SL bleed each exchange; integration test"
```

---

## Task 5: Re-ratchet absolute power and confirm guardrails (incl. kill rate)

Bleed adds sustained damage, raising SL's power and possibly the global kill rate. Re-centre SL in the 40–60% band **without touching the matrix**, and confirm kills stay in range.

**Files:**
- Modify (if needed): `src/engine/skillCalc.ts` (`STYLE_PENALTIES` — the SL row only)

- [ ] **Step 1: Run the balance harness**

Run: `npx vitest run src/test/engine/economy/balance.test.ts`
Expected: check two tests in particular — `Absolute-power band` (SL may be >0.60) and `Kill Rate` (bleed-outs may push kills up). If both green, skip to Step 3.

- [ ] **Step 2: Tune SL penalties and/or bleed magnitude (only if out of band)**

In `src/engine/skillCalc.ts`, the SL row is `[FightingStyle.SlashingAttack]: /*SL*/ [-12, -14, -15, -4, -7, -2]`. Deepen **ATT/PAR/DEF** in steps of 1 to offset bleed while keeping **INI (`-4`) as SL's least-penalised, identity skill**. If the **kill rate** exceeds 16%, lower `SL_BLEED_TICK_DMG` (1 → 0.75) rather than penalties — that targets lethality directly. Re-run Step 1 until SL is in `[0.40, 0.60]`, the kill rate is in `[0.045, 0.16]`, and no other style left its band.

- [ ] **Step 3: Confirm the matrix never moved**

Run: `npx vitest run src/test/engine/economy/balance.test.ts -t "near-antisymmetric"`
Expected: PASS.

- [ ] **Step 4: Full suite + typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`
Run: `npx vitest run 2>&1 | tail -4`
Expected: all green (no pre-existing test regressed; the bleed event's `cause: 'BLEED'` is tolerated by the narrative projection).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "balance(SL): re-ratchet absolute power + kill rate after bleed; guardrails green"
```

---

## Self-Review Notes (for the implementer)

- **Two pure helpers, two wiring sites.** `accumulateBleed` (applied on an SL landed hit) and `tickBleed` (applied to both fighters at the end of every exchange). All clamp/decay logic is in the helpers and unit-tested; the engine edits are small.
- **Generic subsystem, single use.** `bleedStacks` + the tick loop are style-agnostic — only the SL accumulation site is gated to `SlashingAttack`. A future poison/burn could reuse the tick, but none is added now (YAGNI).
- **Flurry is grounded as multi-stack, not multi-strike.** Literal multi-strike resolution would mean rewriting the attack loop; multiple stacks per hit delivers the "bleeds faster" outcome cleanly. This is a deliberate refinement, flagged in the header.
- **Bleed can kill.** That is intended (DoT finishing) and is why Task 5 explicitly re-checks the kill-rate guardrail — tune `SL_BLEED_TICK_DMG` if lethality drifts, penalties if win rate drifts.
- **Identity is shape.** The ratchet keeps SL's INI as its least-penalised skill — SL stays the nimble flexible style whose payoff is attrition, not burst.

## Verification (done by reviewer after implementation)

1. `npx vitest run src/test/engine/combat/bleed.test.ts` → unit (accumulate/clamp, tick/decay, full-stack bleed-down) + integration pass.
2. `grep -n "bleedStacks\|tickBleed\|accumulateBleed" src/engine/combat/resolution/resolution.ts src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts` → applied on SL hit, ticked before `return events`.
3. `npx vitest run src/test/engine/economy/balance.test.ts` → green, including `near-antisymmetric`, the 40–60% band (SL in band), and `Kill Rate` (4.5–16%).
4. `bunx tsc --noEmit --project tsconfig.app.json` → 0; full `npx vitest run` green.
5. No edits to `MATCHUP_MATRIX` or canon data.
```
