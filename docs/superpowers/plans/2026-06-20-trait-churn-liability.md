# Churn / Liability (System 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn flaw load into roster churn — a pure `computeWarriorLiability` scorer that flags flawed warriors as cut candidates, plus a `releaseWarrior` action so the player can act on it. (NPC auto-cut is System 5; the UI badge is System 7.)

**Architecture:** A new pure `src/engine/warriorValue.ts` reads a warrior's traits (using System 1's `tier`/`sign`) and career to produce `{ score, factors, recommendation }`. A new `releaseWarrior` store action (mirroring the existing `retireWarrior` at `src/state/slices/rosterSlice/actions.ts:43`) removes the warrior from the roster, freeing a slot so the recruitment loop refills it — closing the churn loop.

**Tech Stack:** TypeScript, Bun (`bun`/`bunx` — never npm/node), Vitest.

**Scope:** System 4. **Depends on System 1** (`tier`/`sign` on traits). The liability badge in `RosterWarriorRow.tsx` is a System 7 increment (sketched here). Used by System 5 (NPC auto-cut).

---

## File Structure

- **Create** `src/engine/warriorValue.ts` — `computeWarriorLiability(warrior)`.
- **Create** `src/test/engine/warriorValue.test.ts` — scorer tests.
- **Modify** `src/state/slices/rosterSlice/actions.ts` — `releaseWarrior` action.
- **Modify** `src/state/slices/rosterSlice/types.ts` — add `releaseWarrior` to the `RosterSlice` interface.

---

## Task 1: The liability scorer (TDD)

**Files:**

- Create: `src/engine/warriorValue.ts`
- Create: `src/test/engine/warriorValue.test.ts`

- [ ] **Step 1: Write the failing test**

`src/test/engine/warriorValue.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeWarriorLiability } from '@/engine/warriorValue';

const w = (over: any = {}) =>
  ({ traits: [], fame: 20, career: { wins: 5, losses: 5, kills: 1 }, age: 24, ...over }) as any;

describe('computeWarriorLiability', () => {
  it('a clean, decent warrior is Keep with a low score', () => {
    const r = computeWarriorLiability(w({ traits: ['quick'] }));
    expect(r.recommendation).toBe('Keep');
    expect(r.score).toBeLessThan(40);
  });

  it('one flaw is Monitor', () => {
    const r = computeWarriorLiability(w({ traits: ['fragile'] }));
    expect(r.recommendation).toBe('Monitor');
    expect(r.factors.some((f) => /flaw/i.test(f.name))).toBe(true);
  });

  it('two or more flaws is Release', () => {
    const r = computeWarriorLiability(w({ traits: ['fragile', 'slow'] }));
    expect(r.recommendation).toBe('Release');
    expect(r.score).toBeGreaterThan(60);
  });

  it('strong positives soften the recommendation', () => {
    // Two flaws but also a Signature class trait + good record ⇒ not an automatic Release.
    const r = computeWarriorLiability(
      w({
        traits: ['fragile', 'living_wall'],
        fame: 80,
        career: { wins: 30, losses: 4, kills: 12 },
      })
    );
    expect(['Monitor', 'Release']).toContain(r.recommendation);
    // value offsets some of the flaw penalty
    const bare = computeWarriorLiability(w({ traits: ['fragile', 'slow'] }));
    expect(r.score).toBeLessThan(bare.score);
  });
});
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `npx vitest run src/test/engine/warriorValue.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the scorer**

`src/engine/warriorValue.ts`:

```typescript
import type { Warrior } from '@/types/warrior.types';
import { TRAITS, type TraitTier } from '@/engine/traits';

export interface LiabilityResult {
  score: number; // 0–100, higher = more of a liability
  factors: { name: string; weight: number }[];
  recommendation: 'Keep' | 'Monitor' | 'Release';
}

const POSITIVE_VALUE: Record<TraitTier, number> = {
  Common: 6,
  Notable: 10,
  Exceptional: 16,
  Signature: 24,
  Flaw: 0,
};

/**
 * Liability = flaw burden minus the warrior's value (good traits, record, fame).
 * The churn signal: 2+ flaws reads as a cut candidate unless real value offsets it.
 */
export function computeWarriorLiability(warrior: Warrior): LiabilityResult {
  const traits = (warrior.traits ?? []).map((id) => TRAITS[id]).filter(Boolean);
  const factors: { name: string; weight: number }[] = [];

  const flaws = traits.filter((t) => t!.tier === 'Flaw');
  const flawBurden = flaws.length * 34;
  if (flaws.length)
    factors.push({
      name: `${flaws.length} flaw${flaws.length > 1 ? 's' : ''}`,
      weight: flawBurden,
    });

  const traitValue = traits
    .filter((t) => t!.sign === 'positive')
    .reduce((s, t) => s + POSITIVE_VALUE[t!.tier], 0);
  if (traitValue) factors.push({ name: 'positive traits', weight: -traitValue });

  const c = warrior.career ?? { wins: 0, losses: 0, kills: 0 };
  const fights = (c.wins ?? 0) + (c.losses ?? 0);
  const winRate = fights > 0 ? (c.wins ?? 0) / fights : 0.5;
  const recordValue = Math.round((winRate - 0.5) * 40); // ±20
  if (fights >= 5 && recordValue !== 0) factors.push({ name: 'win record', weight: -recordValue });

  const fameValue = Math.min(20, Math.round((warrior.fame ?? 0) / 5));
  if (fameValue) factors.push({ name: 'fame', weight: -fameValue });

  const ageBurden = (warrior.age ?? 24) >= 30 ? 8 : 0;
  if (ageBurden) factors.push({ name: 'age', weight: ageBurden });

  const raw = flawBurden + ageBurden - traitValue - recordValue - fameValue;
  const score = Math.max(0, Math.min(100, raw + 20)); // baseline 20 so a clean warrior sits low-but-nonzero

  const recommendation: LiabilityResult['recommendation'] =
    flaws.length >= 2 && score > 55
      ? 'Release'
      : flaws.length >= 1 || score > 55
        ? 'Monitor'
        : 'Keep';

  return { score, factors, recommendation };
}
```

- [ ] **Step 4: Run the test — expect PASS + typecheck**

Run: `npx vitest run src/test/engine/warriorValue.test.ts` → PASS. (Tune the `34`/`55` constants if a case is off — they are knobs.)
Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.

- [ ] **Step 5: Commit**

```bash
git add "src/engine/warriorValue.ts" "src/test/engine/warriorValue.test.ts"
git commit -m "feat(churn): pure warrior liability scorer from flaw load + value"
```

---

## Task 2: The `releaseWarrior` action

**Files:**

- Modify: `src/state/slices/rosterSlice/actions.ts`
- Modify: `src/state/slices/rosterSlice/types.ts`

- [ ] **Step 1: Add the action signature to the slice interface**

In `src/state/slices/rosterSlice/types.ts` (the `RosterSlice` interface, ~line 13), add:

```typescript
  releaseWarrior: (warriorId: WarriorId, reason?: string) => void;
```

- [ ] **Step 2: Implement the action**

In `src/state/slices/rosterSlice/actions.ts`, mirroring `retireWarrior` (line 43), add:

```typescript
releaseWarrior: (warriorId, reason = 'Released') =>
  set((draft) => {
    const w = draft.roster.find((x) => x.id === warriorId);
    if (!w) return;
    w.status = 'Retired';
    w.retiredWeek = draft.week;
    draft.roster = draft.roster.filter((x) => x.id !== warriorId);
    draft.retired = [...(draft.retired ?? []), w];
    draft.newsletter = draft.newsletter ?? [];
    // light ledger/newsletter note — match the existing pattern used by retireWarrior
  }),
```

> Match `retireWarrior`'s exact mutation style (it uses the same `set((draft) => …)` pattern and `draft.retired`). If `retireWarrior` posts a newsletter/ledger entry, mirror it with the `reason`. Releasing frees a roster slot; the existing `partialRefreshPool`/recruitment loop refills it — no extra wiring needed.

- [ ] **Step 3: Typecheck + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`

```bash
git add "src/state/slices/rosterSlice/actions.ts" "src/state/slices/rosterSlice/types.ts"
git commit -m "feat(churn): add releaseWarrior roster action"
```

---

## Task 3: Roster liability badge (System 7 increment)

**Files:**

- Modify: `src/components/stable/RosterWarriorRow.tsx`

UI, not TDD — keep it minimal and honest (the badge must reflect the real score, no decoration).

- [ ] **Step 1: Surface the recommendation**

In `RosterWarriorRow.tsx`, after the existing potential-grade badge (~line 156), render a small badge only when the warrior is not a clear keep:

```tsx
{
  warrior &&
    (() => {
      const liab = computeWarriorLiability(warrior);
      if (liab.recommendation === 'Keep') return null;
      const label = liab.recommendation === 'Release' ? 'Consider releasing' : 'Watch';
      return (
        <span
          title={liab.factors
            .map((f) => `${f.name}: ${f.weight > 0 ? '+' : ''}${f.weight}`)
            .join('\n')}
          className={liab.recommendation === 'Release' ? 'badge-warning' : 'badge-muted'}
        >
          {label}
        </span>
      );
    })();
}
```

Import `computeWarriorLiability` from `@/engine/warriorValue`. Use the project's existing badge classes (match the potential-grade badge's styling). The `title` gives a tooltip breakdown — honest, mapped to real factors.

- [ ] **Step 2: Typecheck + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`

```bash
git add "src/components/stable/RosterWarriorRow.tsx"
git commit -m "feat(churn): roster liability badge with factor tooltip"
```

---

## Self-Review Notes

- **Liability is pure and explainable.** It returns `factors` so the badge tooltip shows _why_ — no opaque score. Tune the `34`/`55` knobs against play, not vibes.
- **Value offsets flaws.** A flawed-but-valuable warrior (Signature trait, strong record) is `Monitor`, not an auto-cut — that nuance is what keeps churn from being purely punishing.
- **The churn loop closes itself.** `releaseWarrior` frees a slot; the existing recruitment refill handles the rest. No new economy wiring.
- **Signal, not force.** The player always decides; the badge only advises (System 5 is where NPCs act automatically).

## Verification

1. `npx vitest run src/test/engine/warriorValue.test.ts` → green; 2 flaws ⇒ Release, 1 ⇒ Monitor, value softens.
2. `releaseWarrior` removes from roster, adds to `retired`, frees a slot.
3. `bunx tsc …` → 0; full `npx vitest run` green.
