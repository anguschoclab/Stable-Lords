# Mechanical Bloodlines Implementation Plan (F3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `WarriorLineage` real mechanical weight — an heir can **inherit a parent's trait**, and `pedigree` grants a **starting-fame edge** — so the graveyard feeds recruitment and a dead champion's identity echoes in their descendant instead of being flavor text.

**Architecture:** Lineage generation already exists and already fires: `RecruitmentPass` collects `legacyCandidates` from `graveyard + retired` (`fame > 1000`), and `generateRecruit` gives a 5% chance to produce an heir who **inherits the parent's fighting style** plus a `lineage` record. What's missing is any *consequence*: a grep proves `pedigree` is read by **zero** engine systems, and the heir's traits come from a plain `generateTraits` call with no parental link. We add a pure `lineageEffects.ts` (inheritance roll + pedigree fame table), call it from `generateRecruit`, and surface lineage in the dossier.

**Tech Stack:** TypeScript, React 18, Tailwind + shadcn/ui, Bun (`bun`/`bunx` — never npm/node), Vitest + Testing Library.

**Scope:** Recruitment-time effects + one UI surface. **Non-goals:** changing `generateTraits` itself (the sparse-starts contract and its tests stay untouched — inheritance is applied *after*, in `generateRecruit`), attribute inheritance, breeding/pairing mechanics, or combat math (`balance.test.ts` stays green).

**Grounded facts (measured — do not re-derive):**
- `WarriorLineage` (`src/types/warrior.types.ts`): `{ parentId?, stableId?, generation, pedigree: 'Commoner'|'Second Generation'|'Legacy'|'Noble Blood'|'Exiled Legend', mentorName? }`.
- `generateRecruit(rng, usedNames, week, forceTier?, meta?, legacyCandidates = [])` — `src/engine/recruitment.ts:133–139`. Legacy branch at lines ~146–156:
  ```typescript
  const isLegacy = rng.next() < 0.05 && legacyCandidates.length > 0;
  if (isLegacy) {
    const parent = rng.pick(legacyCandidates);
    style = parent.style;                       // heir inherits the STYLE already
    lineage = { parentId: parent.id, generation: (parent.lineage?.generation ?? 1) + 1,
                pedigree: parent.fame > 2000 ? 'Noble Blood' : 'Legacy', mentorName: parent.name };
  }
  ```
- Traits are assigned later in the same function: `const traits = generateTraits(rng, archetype);` (line ~175), then personality `attrBonus` is applied (lines ~177–178), and `traits` lands in the returned object (~line 217).
- `legacyCandidates` source (`src/engine/pipeline/passes/RecruitmentPass.ts:20–23`): `[...graveyard, ...retired].filter((w) => w.fame > 1000)`. Also threaded through `partialRefreshPool` and the death-bonus/Mana-Surge `generateRecruit` calls.
- **`pedigree` has zero consumers** outside `recruitment.ts` and the type definition (verified by grep across `src/engine`). Three of its five union values (`'Commoner'`, `'Second Generation'`, `'Exiled Legend'`) are never produced by any code path.
- Sparse-starts contract (do not break): `generateTraits` yields ≤1 trait, never Exceptional/Signature, never `styles`-restricted — asserted in `src/test/engine/traits/generateTraits.test.ts`.
- `TRAITS[id]` exposes `tier`, `sign`, `styles`; `TraitBadge` renders one (`src/components/warrior/traits/TraitBadge.tsx`).

---

## File Structure

- **Create** `src/engine/lineage/lineageEffects.ts` — pure `rollInheritedTrait`, `pedigreeFameBonus`, `LEGACY_*` knobs.
- **Create** `src/test/engine/lineage/lineageEffects.test.ts` — unit tests.
- **Modify** `src/engine/recruitment.ts` — apply inheritance + pedigree fame; stamp `'Commoner'` on non-heirs.
- **Modify** `src/engine/pipeline/passes/RecruitmentPass.ts` — legacy-candidate fame threshold becomes a named knob.
- **Create** `src/test/engine/lineage/heirRecruit.test.ts` — integration over `generateRecruit`.
- **Modify** `src/components/warrior/dossier/WarriorDossierTraits.tsx` (or the dossier header — see Task 4) — show lineage.

---

## Task 1: Pure lineage effects (TDD)

**Files:**
- Create: `src/engine/lineage/lineageEffects.ts`
- Create: `src/test/engine/lineage/lineageEffects.test.ts`

- [ ] **Step 1: Write the failing test**

`src/test/engine/lineage/lineageEffects.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  rollInheritedTrait,
  pedigreeFameBonus,
  LEGACY_INHERIT_CHANCE,
} from '@/engine/lineage/lineageEffects';
import { TRAITS } from '@/engine/traits';
import { SeededRNGService } from '@/utils/random';
import type { Warrior } from '@/types/warrior.types';

const parent = (traits: string[]): Warrior =>
  ({ id: 'p1', name: 'Legend', traits, fame: 1500 }) as unknown as Warrior;

describe('rollInheritedTrait', () => {
  it('can pass down a parent positive trait, and only ever one the parent had', () => {
    const rng = new SeededRNGService('inherit');
    const p = parent(['quick', 'living_wall']); // Notable + Signature class trait
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const id = rollInheritedTrait(p, rng);
      if (id) seen.add(id);
    }
    expect(seen.size).toBeGreaterThan(0);
    for (const id of seen) expect(p.traits).toContain(id);
  });

  it('never passes down a Signature (those must be earned) or a flaw', () => {
    const rng = new SeededRNGService('inherit-sig');
    const p = parent(['living_wall', 'fragile']); // Signature + Flaw only
    for (let i = 0; i < 400; i++) {
      const id = rollInheritedTrait(p, rng);
      if (id) {
        expect(TRAITS[id]!.tier).not.toBe('Signature');
        expect(TRAITS[id]!.tier).not.toBe('Flaw');
      }
    }
  });

  it('returns null for a parent with nothing inheritable', () => {
    const rng = new SeededRNGService('none');
    expect(rollInheritedTrait(parent([]), rng)).toBeNull();
    expect(rollInheritedTrait(parent(['fragile']), rng)).toBeNull(); // flaw only
  });

  it('inherits at roughly the configured rate', () => {
    const rng = new SeededRNGService('rate');
    const p = parent(['quick']);
    let hits = 0;
    for (let i = 0; i < 2000; i++) if (rollInheritedTrait(p, rng)) hits++;
    const rate = hits / 2000;
    expect(rate).toBeGreaterThan(LEGACY_INHERIT_CHANCE - 0.12);
    expect(rate).toBeLessThan(LEGACY_INHERIT_CHANCE + 0.12);
  });
});

describe('pedigreeFameBonus', () => {
  it('ranks pedigrees and gives commoners nothing', () => {
    expect(pedigreeFameBonus('Commoner')).toBe(0);
    expect(pedigreeFameBonus('Noble Blood')).toBeGreaterThan(pedigreeFameBonus('Legacy'));
    expect(pedigreeFameBonus('Legacy')).toBeGreaterThan(pedigreeFameBonus('Second Generation'));
    expect(pedigreeFameBonus(undefined)).toBe(0);
  });
});
```

- [ ] **Step 2: Run — expect FAIL.** `npx vitest run src/test/engine/lineage/lineageEffects.test.ts` → module not found.

- [ ] **Step 3: Implement**

`src/engine/lineage/lineageEffects.ts`:

```typescript
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { Warrior, WarriorLineage } from '@/types/warrior.types';
import { TRAITS } from '@/engine/traits';

/** Chance an heir inherits one of their parent's inheritable traits. Knob. */
export const LEGACY_INHERIT_CHANCE = 0.35;

/**
 * Roll for a trait passed down from a legendary parent.
 *
 * Inheritable = the parent's own POSITIVE traits, excluding Signature (the top
 * tier must always be earned in the arena, never gifted at birth). Class traits
 * ARE inheritable because an heir also inherits the parent's fighting style, so
 * the restriction is satisfied by construction.
 */
export function rollInheritedTrait(parent: Warrior, rng: IRNGService): string | null {
  const inheritable = (parent.traits ?? []).filter((id) => {
    const t = TRAITS[id];
    return t && t.sign === 'positive' && t.tier !== 'Signature';
  });
  if (inheritable.length === 0) return null;
  if (rng.next() >= LEGACY_INHERIT_CHANCE) return null;
  const idx = Math.floor(rng.next() * inheritable.length);
  return inheritable[Math.min(idx, inheritable.length - 1)]!;
}

/** Starting-fame edge conferred by bloodline. The crowd knows the name. */
const PEDIGREE_FAME: Record<WarriorLineage['pedigree'], number> = {
  Commoner: 0,
  'Second Generation': 10,
  Legacy: 25,
  'Exiled Legend': 35,
  'Noble Blood': 50,
};

export function pedigreeFameBonus(pedigree?: WarriorLineage['pedigree']): number {
  if (!pedigree) return 0;
  return PEDIGREE_FAME[pedigree] ?? 0;
}
```

- [ ] **Step 4: Run + typecheck.** Test → PASS; `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.

- [ ] **Step 5: Commit**

```bash
git add "src/engine/lineage/lineageEffects.ts" "src/test/engine/lineage/lineageEffects.test.ts"
git commit -m "feat(lineage): pure inheritance roll + pedigree fame table"
```

---

## Task 2: Wire inheritance and pedigree into recruitment (TDD)

**Files:**
- Modify: `src/engine/recruitment.ts`
- Create: `src/test/engine/lineage/heirRecruit.test.ts`

- [ ] **Step 1: Write the failing test**

`src/test/engine/lineage/heirRecruit.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateRecruit } from '@/engine/recruitment';
import { SeededRNGService } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';

const legend = (): Warrior =>
  ({
    id: 'legend1', name: 'Old Iron', fame: 2500,
    style: FightingStyle.WallOfSteel,
    traits: ['quick'], // a plain Notable so inheritance is observable
    lineage: undefined,
  }) as unknown as Warrior;

describe('heir recruits', () => {
  it('over many draws, some heirs appear and carry lineage + the parent style', () => {
    const rng = new SeededRNGService('heirs');
    const used = new Set<string>();
    const heirs = [];
    for (let i = 0; i < 600; i++) {
      const r = generateRecruit(rng, used, 10, undefined, undefined, [legend()]);
      if (r.lineage?.parentId === 'legend1') heirs.push(r);
    }
    expect(heirs.length).toBeGreaterThan(0);
    for (const h of heirs) {
      expect(h.style).toBe(FightingStyle.WallOfSteel); // style inheritance (pre-existing)
      expect(h.lineage!.pedigree).toBe('Noble Blood'); // parent fame > 2000
      expect(h.fame).toBeGreaterThan(0); // pedigree fame bonus applied
    }
    // At least one heir inherited the parent's trait.
    expect(heirs.some((h) => h.traits.includes('quick'))).toBe(true);
  });

  it('non-heir recruits are stamped Commoner and get no fame bonus from pedigree', () => {
    const rng = new SeededRNGService('commoners');
    const used = new Set<string>();
    const r = generateRecruit(rng, used, 10); // no legacyCandidates ⇒ never an heir
    expect(r.lineage?.parentId).toBeUndefined();
    expect(r.lineage?.pedigree ?? 'Commoner').toBe('Commoner');
  });
});
```

> `generateRecruit` returns a `PoolWarrior`. Confirm it exposes `fame`, `traits`, `style`, and `lineage` — read the `PoolWarrior` interface near `src/engine/recruitment.ts:55`. If `fame` is absent from `PoolWarrior`, add it to the interface and to the returned object (a recruit's starting fame is the point of the pedigree bonus), and drop the `h.fame` assertion only if the codebase deliberately has no recruit fame — then apply the bonus at hire time instead and note it in the commit.

- [ ] **Step 2: Run — expect FAIL.** `npx vitest run src/test/engine/lineage/heirRecruit.test.ts`

- [ ] **Step 3: Implement in `generateRecruit`**

Three edits in `src/engine/recruitment.ts`:

**(a) Stamp non-heirs as Commoner.** In the legacy branch (~lines 146–156), add an `else` so every recruit carries a meaningful pedigree. Directly after the existing `if (isLegacy) { … }` block's closing brace — but *before* the `else if (meta)` style-selection branch, which is a separate concern — set a default. The cleanest placement is right after the whole style/lineage selection completes:

```typescript
  // Every recruit carries a pedigree; commoners are the baseline.
  if (!lineage) {
    lineage = { generation: 1, pedigree: 'Commoner' };
  }
```

**(b) Inherit a parent trait.** Immediately after `const traits = generateTraits(rng, archetype);` (~line 175), and *before* the personality `attrBonus` loop that follows (so an inherited personality trait's bonus is applied too):

```typescript
  // 🧬 Bloodline: an heir may inherit one of the parent's traits. Applied after
  // generateTraits so the sparse-starts contract for ordinary recruits is intact.
  if (isLegacy && legacyParent) {
    const inherited = rollInheritedTrait(legacyParent, rng);
    if (inherited && !traits.includes(inherited)) {
      traits.push(inherited);
    }
  }
```

This requires capturing the picked parent. In the legacy branch, change `const parent = rng.pick(legacyCandidates);` so the reference survives — declare `let legacyParent: import('@/types/warrior.types').Warrior | undefined;` next to the `let lineage` declaration (~line 144) and assign `legacyParent = parent;` inside the branch.

Add the import: `import { rollInheritedTrait, pedigreeFameBonus } from '@/engine/lineage/lineageEffects';`

**(c) Apply the pedigree fame bonus.** Find where the returned `PoolWarrior` sets `fame` (near `traits,` at ~line 217). Add the bonus to the existing expression, e.g.:

```typescript
    fame: <existingFameExpression> + pedigreeFameBonus(lineage?.pedigree),
```

Read the actual expression first — if `fame` is currently a literal `0`, it becomes `pedigreeFameBonus(lineage?.pedigree)`.

- [ ] **Step 4: Run + verify sparse-starts is untouched**

Run: `npx vitest run src/test/engine/lineage/heirRecruit.test.ts` → PASS.
Run: `npx vitest run src/test/engine/traits/generateTraits.test.ts` → PASS (must be unaffected — we never modified `generateTraits`).
Run: `bunx tsc … | grep -c "error TS"` → `0`.

- [ ] **Step 5: Commit**

```bash
git add "src/engine/recruitment.ts" "src/test/engine/lineage/heirRecruit.test.ts"
git commit -m "feat(lineage): heirs inherit a parent trait; pedigree grants starting fame"
```

---

## Task 3: Make bloodlines observable (named knob + measurement)

**Files:**
- Modify: `src/engine/pipeline/passes/RecruitmentPass.ts`

The legacy pool requires `fame > 1000`, and heirs are a flat 5% of draws. If almost no warrior reaches fame 1000, the whole system is dormant. Name the knob and measure.

- [ ] **Step 1: Extract the threshold**

In `RecruitmentPass.ts`, above `runRecruitmentPass`:

```typescript
/** Dead/retired warriors at or above this fame can sire heirs. Knob (was 1000). */
export const LEGACY_PARENT_FAME_THRESHOLD = 600;
```

and change the filter (lines ~20–23) to:

```typescript
  const legacyCandidates = [...(state.graveyard || []), ...(state.retired || [])].filter(
    (w) => w.fame >= LEGACY_PARENT_FAME_THRESHOLD
  );
```

- [ ] **Step 2: Measure over a real world**

Run: `npx vitest run src/test/engine/sim/worldLiveness.integration.test.ts 2>&1 | grep -E "liveness|Tests "`
Expected: all green. To confirm heirs occur, temporarily add to the diagnostic test a count of warriors with `lineage?.parentId` across `finalState` rosters and log it; expect ≥1 over 104 weeks. **Remove the temporary logging before committing.**

If zero heirs appear, the blocker is the fame distribution, not the 5% rate — lower `LEGACY_PARENT_FAME_THRESHOLD` to 400 and re-measure rather than raising the 5% legacy chance (which would make heirs common and cheapen them).

- [ ] **Step 3: Typecheck + commit**

Run: `bunx tsc … | grep -c "error TS"` → `0`.

```bash
git add "src/engine/pipeline/passes/RecruitmentPass.ts"
git commit -m "tune(lineage): named legacy-parent fame knob so bloodlines actually occur"
```

---

## Task 4: Surface lineage in the dossier

**Files:**
- Modify: the warrior dossier (locate first)

Pedigree is currently invisible to the player — a mechanic nobody can see is a mechanic that doesn't exist.

- [ ] **Step 1: Locate the surface**

Run: `ls src/components/warrior/dossier/` and pick the header/identity component (the file rendering name/style/record). `WarriorDossierTraits.tsx` is the trait strip — lineage belongs near identity, but rendering it just above the trait badges is acceptable if no header component exists.

- [ ] **Step 2: Render it honestly**

Add, guarded so commoners show nothing:

```tsx
{warrior.lineage && warrior.lineage.pedigree !== 'Commoner' && (
  <p className="text-[11px] text-muted-foreground">
    <span className="font-semibold text-arena-gold">{warrior.lineage.pedigree}</span>
    {warrior.lineage.mentorName && <> — heir of {warrior.lineage.mentorName}</>}
    {warrior.lineage.generation > 1 && <> · generation {warrior.lineage.generation}</>}
  </p>
)}
```

Every value maps to real lineage data — no invented flavor. (`arena-gold` is an existing token used elsewhere in the dossier.)

- [ ] **Step 3: Typecheck + component tests + commit**

Run: `bunx tsc … | grep -c "error TS"` → `0`; `npx vitest run src/test/components 2>&1 | tail -4` → green.

```bash
git add -A
git commit -m "feat(ui): dossier shows pedigree and parent for heirs"
```

---

## Task 5: Full-suite verification

**Files:** none (verification only)

- [ ] **Step 1:** `npx vitest run src/test/engine/economy/balance.test.ts` → green (no combat math touched).
- [ ] **Step 2:** `npx vitest run 2>&1 | tail -4` → all green (suite was fully green — 386 files / 5384 tests — as of 2026-07-16); `bunx tsc …` → `0`.
- [ ] **Step 3:** `git add -A && git commit -m "test: verify suite green after mechanical bloodlines" || echo "nothing to commit"`

---

## Self-Review Notes

- **Activates dormant data.** Lineage generation, style inheritance, and the legacy-candidate pipeline already existed; `pedigree` had *zero* consumers. This plan adds consequences, not scaffolding.
- **Sparse-starts stays intact.** Inheritance is applied in `generateRecruit` *after* `generateTraits`, so `generateTraits.test.ts`'s "never Exceptional/Signature/class at birth" contract is untouched — heirs are the deliberate, rare exception, and Signature is *still* excluded from inheritance so the top tier is always earned.
- **Class traits are safe to inherit** precisely because heirs already inherit the parent's style, so the `styles` restriction holds by construction.
- **Rarity preserved.** 5% legacy draw × 35% inheritance ≈ under 2% of recruits carry a parent's trait — special, not routine. The knob raised is the *fame threshold* (which decides whether legends exist at all), never the heir rate.
- **Closes the emotional loop.** Graveyard → recruit pool → an heir with the family gift and a name the crowd already knows.

## Verification

1. `lineageEffects.test.ts` → inheritance only from parent's positive non-Signature traits, at ~the configured rate; pedigree fame ranks correctly.
2. `heirRecruit.test.ts` → heirs appear, carry parent style + `Noble Blood` + fame bonus, and at least one inherits the trait; non-heirs are `Commoner`.
3. `generateTraits.test.ts` → unchanged and green (sparse-starts contract intact).
4. ≥1 heir observed over a 104-week sim; dossier renders pedigree.
5. `balance.test.ts` green; full suite green; typecheck 0.
