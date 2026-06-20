# Sparse Starts (System 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make most warriors born blank — rewrite `generateTraits` so ~68% start with no traits, ~25% with one Common/Notable *generic* trait (never Exceptional/Signature, never class-restricted), and ~7% with a single Flaw.

**Architecture:** `generateTraits(rng, archetype?)` (`src/engine/traits.ts:411`) is the single chokepoint for birth traits (consumed at `warriorFactory.ts:43` for both player and rival warriors). We make it **tier-aware** using the `tier`/`styles` fields from System 1: it rolls a category (blank / positive / flaw) then picks from the appropriate filtered, archetype-weighted pool.

**Tech Stack:** TypeScript, Bun (`bun`/`bunx` — never npm/node), Vitest.

**Scope:** System 2 of the trait redesign. **Depends on System 1** (the `tier`/`styles` fields and the Flaw pool must exist). Class traits and Exceptional/Signature are *earned*, never granted at birth — this plan enforces that.

---

## File Structure

- **Modify** `src/engine/traits.ts` — rewrite `generateTraits` to be sparse + tier/styles-aware.
- **Create** `src/test/engine/traits/generateTraits.test.ts` — distribution + eligibility tests.

---

## Task 1: Sparse, tier-aware `generateTraits` (TDD)

**Files:**
- Modify: `src/engine/traits.ts`
- Create: `src/test/engine/traits/generateTraits.test.ts`

- [ ] **Step 1: Add the tunable constants**

In `src/engine/traits.ts`, near the existing `TRAIT_SYNERGY_MULTIPLIER` constants, add:

```typescript
/** Birth-trait distribution: most warriors are born blank; traits are developed. */
export const BIRTH_BLANK_CHANCE = 0.68;   // 0 traits
export const BIRTH_FLAW_CHANCE = 0.07;    // a single Flaw (after the blank roll)
// remaining ~0.25 → one Common/Notable generic positive trait
```

- [ ] **Step 2: Write the failing distribution test**

`src/test/engine/traits/generateTraits.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateTraits, TRAITS } from '@/engine/traits';
import { SeededRNGService } from '@/utils/random';

describe('generateTraits (sparse, tier-aware)', () => {
  const sample = (n: number) => {
    const rng = new SeededRNGService('sparse-seed');
    const out: string[][] = [];
    for (let i = 0; i < n; i++) out.push(generateTraits(rng, 'brutal'));
    return out;
  };

  it('most warriors are born blank (~68%, never more than one trait)', () => {
    const rolls = sample(3000);
    const blank = rolls.filter((r) => r.length === 0).length / rolls.length;
    expect(blank, `blank rate ${(blank * 100).toFixed(1)}%`).toBeGreaterThan(0.6);
    expect(rolls.every((r) => r.length <= 1)).toBe(true);
  });

  it('never grants Exceptional/Signature or class-restricted traits at birth', () => {
    for (const r of sample(3000)) {
      for (const id of r) {
        const t = TRAITS[id]!;
        expect(['Exceptional', 'Signature'].includes(t.tier), `${id} tier`).toBe(false);
        expect(t.styles, `${id} is class-restricted`).toBeUndefined();
      }
    }
  });

  it('a minority are born with a single Flaw', () => {
    const rolls = sample(3000);
    const flawed = rolls.filter((r) => r.some((id) => TRAITS[id]!.tier === 'Flaw')).length / rolls.length;
    expect(flawed, `flaw rate ${(flawed * 100).toFixed(1)}%`).toBeGreaterThan(0.03);
    expect(flawed).toBeLessThan(0.12);
  });
});
```

- [ ] **Step 3: Run it — expect FAIL**

Run: `npx vitest run src/test/engine/traits/generateTraits.test.ts`
Expected: FAIL — the current `generateTraits` grants up to 2 traits from the whole pool (incl. Exc/Sig/class).

- [ ] **Step 4: Rewrite `generateTraits`**

Replace the body of `generateTraits` in `src/engine/traits.ts` with:

```typescript
export function generateTraits(rng: IRNGService, archetype?: Archetype): string[] {
  const roll = rng.next();
  if (roll < BIRTH_BLANK_CHANCE) return [];

  const wantFlaw = roll < BIRTH_BLANK_CHANCE + BIRTH_FLAW_CHANCE;

  // Eligible birth pool: flaws, OR generic (non-class) Common/Notable positives.
  const eligible = TRAIT_IDS.filter((id) => {
    const t = TRAITS[id];
    if (!t) return false;
    if (wantFlaw) return t.tier === 'Flaw';
    return t.sign === 'positive' && !t.styles && (t.tier === 'Common' || t.tier === 'Notable');
  });
  if (eligible.length === 0) return [];

  // Archetype-weighted pick (same weighting as before, over the filtered set).
  let total = 0;
  const weights: { id: string; w: number }[] = [];
  for (const id of eligible) {
    const t = TRAITS[id]!;
    let w = t.weight;
    if (archetype) {
      if (t.synergy?.includes(archetype)) w *= TRAIT_SYNERGY_MULTIPLIER;
      if (t.antiSynergy?.includes(archetype)) w *= TRAIT_ANTI_SYNERGY_MULTIPLIER;
    }
    weights.push({ id, w });
    total += w;
  }
  let target = rng.next() * total;
  for (const { id, w } of weights) {
    target -= w;
    if (target <= 0) return [id];
  }
  return [];
}
```

- [ ] **Step 5: Run the test — expect PASS + typecheck**

Run: `npx vitest run src/test/engine/traits/generateTraits.test.ts` → PASS.
Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.

- [ ] **Step 6: Confirm no downstream test regressed**

Run: `npx vitest run 2>&1 | tail -4`
Expected: green. Note: the trait-noise test (`traitBalance.test.ts` / `traitNoise.test.ts`) calls `generateTraits` directly — if any asserted the old "0–2 traits" distribution, update it to the sparse contract and note why in the commit.

- [ ] **Step 7: Commit**

```bash
git add "src/engine/traits.ts" "src/test/engine/traits/generateTraits.test.ts"
git commit -m "feat(traits): sparse, tier-aware birth traits (mostly blank; no class/Exc/Sig at birth)"
```

---

## Self-Review Notes

- **One chokepoint.** Both player and rival warriors route through `generateTraits`, so sparse starts apply universally — rival rosters thin out too, which the churn/NPC systems rely on.
- **Eligibility is the safeguard.** Filtering on `tier`/`styles` is what guarantees the "earned only" rule for class + high-tier traits; do not loosen it.
- **Magnitudes are knobs.** `BIRTH_BLANK_CHANCE`/`BIRTH_FLAW_CHANCE` tune the texture; the distribution test ranges are deliberately loose.

## Verification

1. `npx vitest run src/test/engine/traits/generateTraits.test.ts` → 3 pass.
2. Birth traits are ≤1, never Exceptional/Signature, never `styles`-restricted; ~7% flaws.
3. `bunx tsc … ` → 0; full `npx vitest run` green.
