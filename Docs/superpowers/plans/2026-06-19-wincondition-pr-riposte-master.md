# Win Condition — PR Riposte Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Parry-Riposte (PR) a three-part win condition — (1) _counter-on-parry_: a successful parry raises riposte frequency; (2) _punish-commitment_: riposte damage scales with the attacker's commitment level; (3) _light chain_: consecutive ripostes compound a small, capped bonus — making PR the brawler-counter, validated against the Phase-1 balance harness.

**Architecture:** PR's riposte math is centralised in the already-exported pure function `styleRiposteBonus(def, att)` (`resolution.ts:203`, which also holds TP's fatigue-exploit and PL's momentum-riposte). We extend it with an options object carrying the three PR inputs (`afterParry`, `attCommitLevel`, `riposteStreak`) so all PR damage/frequency logic stays pure and unit-testable. The attacker's commitment level (`CommitResult.level`) is threaded onto `OffenseDefenseCtx` (it is already a local at the ctx-construction site). The chain uses a new `riposteStreak` field on `FighterState`, updated at the two riposte sites (parry and whiff).

**Tech Stack:** TypeScript, Bun (`bun`/`bunx` — never npm/node), Vitest. Run one file with `npx vitest run <path>`.

**Scope:** Fourth of six per-style win-condition plans from `docs/superpowers/specs/2026-06-19-winconditions-remaining-design.md` (build order PS → BA → WS → **PR** → ST → SL). Builds on the WS plan's version of `styleRiposteBonus` (additive — PR adds a new branch and an optional opts param; the WS plan's 2-arg call and test remain valid).

**Spec refinement (grounded):** The spec's chain "resets on a missed riposte or on taking a clean hit." Grounded version: resets on a **missed riposte** only (observed directly at the riposte sites via the check result), dropping the clean-hit reset — which would need a separate hook in `executeHit` for marginal benefit. Consecutive _successful_ ripostes are what the chain rewards; a missed riposte breaks it.

**Canon guardrails:** Mechanics layer only. Do NOT touch `MATCHUP_MATRIX` or weapon-suitability/mortality data. Phase-1 guardrails (antisymmetric matrix, 40–60% band) must stay green. PR's RIP penalty is its identity (least-penalised skill) — preserve that ordering in any re-ratchet.

---

## File Structure

- **Modify:** `src/constants/combat/combat.ts` — add `PR_COUNTER_ON_PARRY`, `PR_COMMIT_PUNISH`, `PR_CHAIN_STEP`, `PR_CHAIN_CAP`.
- **Modify:** `src/engine/combat/resolution/resolution.ts` — extend `styleRiposteBonus` with the PR branch + opts; add `attCommit` to `OffenseDefenseCtx` and the ctx construction; update the two riposte call sites + the `riposteStreak` counter.
- **Modify:** `src/engine/combat/resolution/types.ts` — add `riposteStreak?: number` to `FighterState`.
- **Modify:** `src/engine/bout/fighterState.ts` — initialise `riposteStreak: 0`.
- **Create:** `src/test/engine/combat/prRiposteMaster.test.ts` — unit tests for the `styleRiposteBonus` PR branch + a directional integration fight.
- **Modify (if Task 5 requires):** `src/engine/skillCalc.ts` — `STYLE_PENALTIES` PR row only.

---

## Task 1: Extend styleRiposteBonus with the PR branch (TDD)

**Files:**

- Modify: `src/constants/combat/combat.ts`
- Modify: `src/engine/combat/resolution/resolution.ts`
- Create: `src/test/engine/combat/prRiposteMaster.test.ts`

- [ ] **Step 1: Add the tunable constants**

In `src/constants/combat/combat.ts`, near the other style constants, add:

```typescript
import type { CommitLevel } from '@/types/shared.types';

/** Parry-Riposte counter-on-parry: riposte-chance bonus after a successful parry. Balance knob. */
export const PR_COUNTER_ON_PARRY = 4;
/** Parry-Riposte punish-commitment: riposte damage bonus by the attacker's commitment level. */
export const PR_COMMIT_PUNISH: Record<CommitLevel, number> = {
  Cautious: 0,
  Standard: 1,
  Full: 2,
  Desperate: 3,
};
/** Parry-Riposte light chain: riposte damage per consecutive prior riposte, and its cap. */
export const PR_CHAIN_STEP = 0.5;
export const PR_CHAIN_CAP = 1.5;
```

> Confirm `CommitLevel` is exported from `@/types/shared.types`: `grep -n "CommitLevel" src/types/shared.types.ts`. It is used as `commitLevelA: CommitLevel` in `exchangeSubPhases.ts`, so the type exists; ensure it is exported.

- [ ] **Step 2: Write the failing unit test**

Create `src/test/engine/combat/prRiposteMaster.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import { styleRiposteBonus } from '@/engine/combat/resolution/resolution';
import { PR_COUNTER_ON_PARRY, PR_CHAIN_CAP } from '@/constants/combat/combat';

const f = (style: FightingStyle, momentum = 0) =>
  ({ style, momentum, endurance: 100, maxEndurance: 100 }) as any;

describe('styleRiposteBonus — PR riposte master', () => {
  it('counter-on-parry adds riposte frequency only after a parry', () => {
    const afterParry = styleRiposteBonus(
      f(FightingStyle.ParryRiposte),
      f(FightingStyle.BashingAttack),
      {
        afterParry: true,
        attCommitLevel: 'Standard',
      }
    );
    expect(afterParry.ripBonus).toBe(PR_COUNTER_ON_PARRY);

    const onWhiff = styleRiposteBonus(
      f(FightingStyle.ParryRiposte),
      f(FightingStyle.BashingAttack),
      {
        afterParry: false,
        attCommitLevel: 'Standard',
      }
    );
    expect(onWhiff.ripBonus).toBe(0);
  });

  it('punish-commitment scales riposte damage with the attacker commitment ladder', () => {
    const lvl = (l: any) =>
      styleRiposteBonus(f(FightingStyle.ParryRiposte), f(FightingStyle.BashingAttack), {
        attCommitLevel: l,
      }).dmgBonus;
    expect(lvl('Cautious')).toBe(0);
    expect(lvl('Standard')).toBe(1);
    expect(lvl('Full')).toBe(2);
    expect(lvl('Desperate')).toBe(3);
  });

  it('defaults to Standard commitment when no level is supplied', () => {
    const r = styleRiposteBonus(f(FightingStyle.ParryRiposte), f(FightingStyle.BashingAttack), {});
    expect(r.dmgBonus).toBe(1);
  });

  it('the chain compounds with streak and caps', () => {
    const at = (streak: number) =>
      styleRiposteBonus(f(FightingStyle.ParryRiposte), f(FightingStyle.BashingAttack), {
        attCommitLevel: 'Cautious', // isolate the chain (commit = 0)
        riposteStreak: streak,
      }).dmgBonus;
    expect(at(0)).toBe(0);
    expect(at(2)).toBe(1.0); // 2 * 0.5
    expect(at(10)).toBe(PR_CHAIN_CAP); // capped
  });

  it('is inert for non-PR styles', () => {
    const r = styleRiposteBonus(f(FightingStyle.StrikingAttack), f(FightingStyle.BashingAttack), {
      afterParry: true,
      attCommitLevel: 'Desperate',
      riposteStreak: 5,
    });
    expect(r).toEqual({ ripBonus: 0, dmgBonus: 0 });
  });
});
```

- [ ] **Step 3: Run it — expect FAIL**

Run: `npx vitest run src/test/engine/combat/prRiposteMaster.test.ts`
Expected: FAIL — `styleRiposteBonus` does not yet accept a third argument / has no PR branch (the PR assertions fail).

- [ ] **Step 4: Extend `styleRiposteBonus`**

In `src/engine/combat/resolution/resolution.ts`, add the import (if not present) at the top:

```typescript
import type { CommitLevel } from '@/types/shared.types';
import {
  PR_COUNTER_ON_PARRY,
  PR_COMMIT_PUNISH,
  PR_CHAIN_STEP,
  PR_CHAIN_CAP,
} from '@/constants/combat';
```

Change the `styleRiposteBonus` signature and add the PR branch. The current function (with TP and PL branches, PL already WS-gated by the WS plan) becomes:

```typescript
export function styleRiposteBonus(
  def: FighterState,
  att: FighterState,
  opts: { afterParry?: boolean; attCommitLevel?: CommitLevel; riposteStreak?: number } = {}
): { ripBonus: number; dmgBonus: number } {
  let ripBonus = 0;
  let dmgBonus = 0;

  // TP: fatigue-exploit counter — opponent's exhaustion feeds riposte chance and damage
  if (def.style === FightingStyle.TotalParry) {
    const endRatio = att.endurance / Math.max(1, att.maxEndurance);
    if (endRatio < 0.25) {
      ripBonus += 5;
      dmgBonus += 2;
    } else if (endRatio < 0.5) {
      ripBonus += 2;
      dmgBonus += 1;
    }
  }

  // PL: momentum-based riposte pressure (negated when the target is Wall of Steel)
  if (
    def.style === FightingStyle.ParryLunge &&
    def.momentum > 0 &&
    att.style !== FightingStyle.WallOfSteel
  ) {
    ripBonus += def.momentum;
    dmgBonus += def.momentum * 0.5;
  }

  // PR: riposte master — counter-on-parry (frequency), punish-commitment (damage), light chain
  if (def.style === FightingStyle.ParryRiposte) {
    if (opts.afterParry) ripBonus += PR_COUNTER_ON_PARRY;
    dmgBonus += PR_COMMIT_PUNISH[opts.attCommitLevel ?? 'Standard'];
    dmgBonus += Math.min(PR_CHAIN_CAP, (opts.riposteStreak ?? 0) * PR_CHAIN_STEP);
  }

  return { ripBonus, dmgBonus };
}
```

- [ ] **Step 5: Run the test — expect PASS**

Run: `npx vitest run src/test/engine/combat/prRiposteMaster.test.ts`
Expected: the 5 unit `describe` cases PASS (the integration test is added in Task 4).

- [ ] **Step 6: Typecheck + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0` (existing 2-arg callers still valid via the default `opts = {}`).

```bash
git add "src/constants/combat/combat.ts" "src/engine/combat/resolution/resolution.ts" "src/test/engine/combat/prRiposteMaster.test.ts"
git commit -m "feat(combat): PR riposte-master math in styleRiposteBonus (pure, unit-tested)"
```

---

## Task 2: Add `riposteStreak` (FighterState) and `attCommit` (OffenseDefenseCtx)

**Files:**

- Modify: `src/engine/combat/resolution/types.ts`
- Modify: `src/engine/bout/fighterState.ts`
- Modify: `src/engine/combat/resolution/resolution.ts`

- [ ] **Step 1: Add the FighterState field**

In `src/engine/combat/resolution/types.ts`, inside `export interface FighterState`, near `momentum`, add:

```typescript
  /** Parry-Riposte light chain: count of consecutive successful ripostes. Resets on a missed riposte. */
  riposteStreak?: number;
```

- [ ] **Step 2: Initialise it**

In `src/engine/bout/fighterState.ts`, in the returned object literal (near `momentum: 0,`), add:

```typescript
    riposteStreak: 0,
```

- [ ] **Step 3: Add `attCommit` to OffenseDefenseCtx**

In `src/engine/combat/resolution/resolution.ts`, the `OffenseDefenseCtx` interface already declares `defCommit: CommitResult;` (around line 184). Directly after it, add:

```typescript
attCommit: CommitResult;
```

- [ ] **Step 4: Populate it at the ctx construction**

In the same file, the `const s: OffenseDefenseCtx = { … }` construction (around line 499) lists `defCommit,` among its fields (~line 523). `attCommit` is already an in-scope local at this site (it is used in the `performAttackCheck` ATT sum just above, ~line 477). Add it next to `defCommit,`:

```typescript
    attCommit,
    defCommit,
```

- [ ] **Step 5: Typecheck + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.

```bash
git add "src/engine/combat/resolution/types.ts" "src/engine/bout/fighterState.ts" "src/engine/combat/resolution/resolution.ts"
git commit -m "feat(combat): thread attCommit into OffenseDefenseCtx; add riposteStreak to FighterState"
```

---

## Task 3: Wire the PR inputs at the two riposte sites

**Files:**

- Modify: `src/engine/combat/resolution/resolution.ts`

Two sites call `styleRiposteBonus(def, att)` and then perform a riposte check: the **whiff** path (`resolveWhiffRiposte`, ~line 239) and the **parry** path (`resolveContestedDefense`, ~line 345). Both receive `s: OffenseDefenseCtx`, so `s.attCommit.level` and `def.riposteStreak` are in scope.

- [ ] **Step 1: Whiff path — pass opts + update the streak**

At the whiff site, change:

```typescript
const styleRip = styleRiposteBonus(def, att);
```

to (note `afterParry: false` — counter-on-parry does not apply to a whiff riposte):

```typescript
const styleRip = styleRiposteBonus(def, att, {
  afterParry: false,
  attCommitLevel: s.attCommit.level,
  riposteStreak: def.riposteStreak ?? 0,
});
```

Then, where this path resolves the riposte check (`const ripCheck = performRiposteCheck(...)` followed by `if (ripCheck) { executeRiposte(...) }`, ~lines 240–261), update the PR streak right after the `if (ripCheck)` block. Replace:

```typescript
  if (ripCheck) {
    executeRiposte(
```

with:

```typescript
  if (def.style === FightingStyle.ParryRiposte) {
    def.riposteStreak = ripCheck ? (def.riposteStreak ?? 0) + 1 : 0;
  }
  if (ripCheck) {
    executeRiposte(
```

- [ ] **Step 2: Parry path — pass opts + update the streak**

At the parry site (~line 345), change:

```typescript
const styleRip = styleRiposteBonus(def, att);
```

to (note `afterParry: true`):

```typescript
const styleRip = styleRiposteBonus(def, att, {
  afterParry: true,
  attCommitLevel: s.attCommit.level,
  riposteStreak: def.riposteStreak ?? 0,
});
```

Then, at the riposte-check result (`if (ripPostParry) { executeRiposte(...) }`, ~line 358), update the streak. Replace:

```typescript
      if (ripPostParry) {
        executeRiposte(
```

with:

```typescript
      if (def.style === FightingStyle.ParryRiposte) {
        def.riposteStreak = ripPostParry ? (def.riposteStreak ?? 0) + 1 : 0;
      }
      if (ripPostParry) {
        executeRiposte(
```

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: `0`.

- [ ] **Step 4: Commit**

```bash
git add "src/engine/combat/resolution/resolution.ts"
git commit -m "feat(combat): wire PR counter-on-parry, punish-commitment, and chain at riposte sites"
```

---

## Task 4: Directional integration test

**Files:**

- Modify: `src/test/engine/combat/prRiposteMaster.test.ts`

- [ ] **Step 1: Add a PR-vs-brawler fight test**

Append to `src/test/engine/combat/prRiposteMaster.test.ts`:

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

describe('PR riposte master (integration)', () => {
  it('Parry-Riposte punishes an aggressive Striking Attack brawler', () => {
    const pr = mk(FightingStyle.ParryRiposte, 'PR');
    const st = mk(FightingStyle.StrikingAttack, 'ST');
    let wins = 0;
    const N = 400;
    for (let i = 0; i < N; i++) {
      const o = simulateFight(
        defaultPlanForWarrior(pr),
        defaultPlanForWarrior(st),
        pr,
        st,
        i * 8209 + 31
      );
      if (o.winner === 'A') wins++;
    }
    const rate = wins / N;
    // PR is the brawler-counter: it should hold its own against an aggressive ST.
    expect(rate, `PR vs ST win rate ${(rate * 100).toFixed(1)}%`).toBeGreaterThan(0.4);
  });
});
```

Run: `npx vitest run src/test/engine/combat/prRiposteMaster.test.ts`
Expected: PASS (5 unit + 1 integration). If PR is below the floor, raise `PR_COUNTER_ON_PARRY` to 5 or the commit ladder by 1 across the board, then re-run; PR's _overall_ level is the re-ratchet's job (Task 5).

- [ ] **Step 2: Commit**

```bash
git add "src/test/engine/combat/prRiposteMaster.test.ts"
git commit -m "test(combat): PR punishes an aggressive brawler (integration)"
```

---

## Task 5: Re-ratchet absolute power and confirm guardrails

**Files:**

- Modify (if needed): `src/engine/skillCalc.ts` (`STYLE_PENALTIES` — the PR row only)

- [ ] **Step 1: Run the balance harness**

Run: `npx vitest run src/test/engine/economy/balance.test.ts`
Expected: if `Absolute-power band` flags PR as >0.60, proceed to Step 2; if green, skip to Step 3.

- [ ] **Step 2: Nudge PR penalties (only if out of band)**

In `src/engine/skillCalc.ts`, the PR row is `[FightingStyle.ParryRiposte]: /*PR*/ [-14, -8, -15, -8, -2, -2]`. Deepen **ATT or DEF** in steps of 1 to offset the riposte buffs, but **keep RIP (`-2`) the least-penalised skill** — that ordering is PR's identity. Re-run Step 1 until PR is within `[0.40, 0.60]` and no other style left the band.

- [ ] **Step 3: Confirm the matrix never moved**

Run: `npx vitest run src/test/engine/economy/balance.test.ts -t "near-antisymmetric"`
Expected: PASS.

- [ ] **Step 4: Full suite + typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`
Run: `npx vitest run 2>&1 | tail -4`
Expected: all green (including the WS plan's `styleRiposteBonus` test, still valid with the new opts param).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "balance(PR): re-ratchet absolute power after riposte-master; guardrails green"
```

---

## Self-Review Notes (for the implementer)

- **All PR math is in one pure function.** `styleRiposteBonus` holds counter-on-parry, punish-commitment, and chain — fully unit-tested via the opts object. The resolution edits only _supply_ inputs (commit level, streak) and _update_ the streak counter.
- **`afterParry` matters.** Counter-on-parry (the riposte-frequency bonus) is parry-only; the whiff path passes `afterParry: false`. Punish-commitment and chain apply to both riposte triggers.
- **Streak is PR-gated** at both sites (`if (def.style === ParryRiposte)`) so no other style pays the cost of maintaining it. It increments on a successful riposte check and resets on a miss.
- **Identity is shape.** The Task-5 ratchet must keep PR's RIP as its least-penalised skill — that is what makes PR the riposte king. Deepen ATT/DEF, never RIP past the others.
- **Builds on WS.** This plan assumes the WS plan's `styleRiposteBonus` (PL branch WS-gated, 2-arg signature). The opts param is additive; the WS unit test (2-arg call) still passes.

## Verification (done by reviewer after implementation)

1. `npx vitest run src/test/engine/combat/prRiposteMaster.test.ts` → 5 unit + 1 integration pass.
2. `grep -n "riposteStreak\|attCommit\|styleRiposteBonus" src/engine/combat/resolution/resolution.ts` → opts passed at both riposte sites; streak updated (PR-gated) at both; `attCommit` on the ctx.
3. `npx vitest run src/test/engine/combat/wsImmovable.test.ts` → still green (opts default preserves the 2-arg behaviour).
4. `npx vitest run src/test/engine/economy/balance.test.ts` → green, including `near-antisymmetric` and the 40–60% band (PR in band, RIP still its least-penalised skill).
5. `bunx tsc --noEmit --project tsconfig.app.json` → 0; full `npx vitest run` green.
6. No edits to `MATCHUP_MATRIX` or canon data.

```

```
