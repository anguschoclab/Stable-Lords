# Combat Type Boundary — Remove `as unknown as Warrior` Casts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the unsafe `as unknown as Warrior` casts in the hot combat path by narrowing the two consuming functions (`getFavoriteRhythmBonus`, `getDynamicTraitMods`) to accept only the structural fields they actually read, so `FighterState` can be passed directly with full type checking.

**Architecture:** The casts exist only because two pure helpers declare a `Warrior` parameter but read a single field each (`.favorites` / `.traits`). `FighterState` already carries both fields (`favorites?: WarriorFavorites`, `traits?: string[]`) but is not a `Warrior`. Narrow each function's parameter to a minimal structural interface; a full `Warrior` and a `FighterState` both satisfy it, so all call sites — production and tests — keep working while the casts disappear.

**Tech Stack:** TypeScript, Vitest. Pure-function signature changes only; zero runtime behavior change.

**Key existing facts (verified):**

- `getFavoriteRhythmBonus(warrior: Warrior, currentOE, currentAL)` (`src/engine/favorites.ts:181`) reads only `warrior.favorites`.
- `getDynamicTraitMods(warrior: Warrior | undefined, ctx)` (`src/engine/traits.ts:473`) reads only `warrior.traits`.
- `FighterState` (`src/engine/combat/resolution/types.ts:23`) already has `favorites?: WarriorFavorites` (line 44) and `traits?: string[]` (line 47).
- The 5 casts to remove:
  - `src/engine/combat/resolution/resolution.ts:98` — `getFavoriteRhythmBonus(fA as unknown as Warrior, ...)`
  - `src/engine/combat/resolution/resolution.ts:101` — `getFavoriteRhythmBonus(fD as unknown as Warrior, ...)`
  - `src/engine/combat/resolution/resolution.ts:661` — `getDynamicTraitMods(fA.traits ? ({ traits: fA.traits } as unknown as Warrior) : undefined, ...)`
  - `src/engine/combat/resolution/resolution.ts:665` — same for `fD`
  - `src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts:234` — `getDynamicTraitMods({ traits: attacker.traits } as unknown as Warrior, ...)`
- All other callers are tests (`src/test/engine/favorites.test.ts`, `src/test/engine/traits.test.ts`) that pass full warrior-shaped objects — they remain valid under the narrower type.
- `WarriorFavorites` is at `src/types/warrior.types.ts:138`.

> **Out of scope (separate follow-up):** other `as unknown as` casts that are NOT the FighterState↔Warrior boundary — `reportingHandler.ts:82-83` (`stableId as unknown as StableId`) and `mortalityHandler.ts:67` (`as unknown as FightSummary`). Do not touch them here; they are different concerns.

---

## File Structure

- Modify: `src/engine/favorites.ts` — narrow `getFavoriteRhythmBonus` parameter type.
- Modify: `src/engine/traits.ts` — narrow `getDynamicTraitMods` parameter type.
- Modify: `src/engine/combat/resolution/resolution.ts` — drop 4 casts.
- Modify: `src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts` — drop 1 cast.
- Test: `src/test/engine/favorites.test.ts`, `src/test/engine/traits.test.ts` — add structural-acceptance assertions (existing tests already cover behavior).

---

## Task 1: Narrow `getFavoriteRhythmBonus` to a structural parameter

**Files:**

- Modify: `src/engine/favorites.ts:181-193`
- Test: `src/test/engine/favorites.test.ts`

- [ ] **Step 1: Add a test that a minimal `{ favorites }` object is accepted**

Add to `src/test/engine/favorites.test.ts` inside the `getFavoriteRhythmBonus` describe block (near line 328):

```typescript
it('accepts any object exposing favorites (e.g. a FighterState), not just a full Warrior', () => {
  // A minimal structural object — this is what FighterState provides.
  const fighterLike = {
    favorites: {
      // shape mirrors WarriorFavorites enough for the rhythm path
      discovered: { rhythm: true, weapon: false },
      rhythm: { oe: 7, al: 5 },
      // other WarriorFavorites fields omitted intentionally
    },
  } as const;
  // @ts-expect-no-error — should compile once the signature is narrowed.
  expect(getFavoriteRhythmBonus(fighterLike as any, 7, 5)).toBe(2);
});
```

> Engineer note: the `as any` in the test exists only because the inline literal omits some `WarriorFavorites` fields; the _production_ call sites pass a real `FighterState` whose `favorites` is a full `WarriorFavorites`, so they need no cast. The point of this test is behavioral coverage of the narrowed path, not type assertion. If you can build a complete `WarriorFavorites` literal easily, drop the `as any`.

- [ ] **Step 2: Run test to verify current behavior still passes (baseline)**

Run: `npx vitest run src/test/engine/favorites.test.ts`
Expected: PASS (the new test passes even before the signature change because of `as any`; this is the behavioral baseline).

- [ ] **Step 3: Narrow the signature**

In `src/engine/favorites.ts`, change the `getFavoriteRhythmBonus` signature. Find:

```typescript
export function getFavoriteRhythmBonus(
  warrior: Warrior,
  currentOE: number,
  currentAL: number
): number {
  const fav = warrior.favorites;
```

Replace the parameter type with a structural one:

```typescript
export function getFavoriteRhythmBonus(
  warrior: { favorites?: WarriorFavorites },
  currentOE: number,
  currentAL: number
): number {
  const fav = warrior.favorites;
```

`WarriorFavorites` is already imported at the top of `favorites.ts` (`import type { Warrior, WarriorFavorites } from '@/types/warrior.types';`). Leave the `Warrior` import in place — `applyInsightToken` and other functions in this file still use it.

- [ ] **Step 4: Run favorites tests**

Run: `npx vitest run src/test/engine/favorites.test.ts`
Expected: PASS — full-warrior callers and the structural object both satisfy `{ favorites?: WarriorFavorites }`.

- [ ] **Step 5: Commit**

```bash
git add src/engine/favorites.ts src/test/engine/favorites.test.ts
git commit -m "refactor(combat): narrow getFavoriteRhythmBonus to structural param"
```

---

## Task 2: Narrow `getDynamicTraitMods` to a structural parameter

**Files:**

- Modify: `src/engine/traits.ts:473-480`
- Test: `src/test/engine/traits.test.ts`

- [ ] **Step 1: Add a structural-acceptance test**

Add to `src/test/engine/traits.test.ts` inside the `getDynamicTraitMods` describe block (near line 76):

```typescript
it('accepts any object exposing traits (e.g. a FighterState), not just a full Warrior', () => {
  const fighterLike = { traits: ['berserker'] };
  const bloodied = getDynamicTraitMods(fighterLike, {
    ...baseCtx,
    hpRatio: 0.3,
  });
  // berserker grants an attack bonus at low HP — same as the mockWarrior path
  expect(bloodied.attMod).toBeGreaterThan(0);
});

it('returns the zero-mods accumulator for undefined input', () => {
  const mods = getDynamicTraitMods(undefined, baseCtx);
  expect(mods).toEqual({ attMod: 0, parMod: 0, defMod: 0, iniMod: 0, killWindowBonus: 0 });
});
```

> Engineer note: confirm `baseCtx` and the `berserker` trait's `attModLowHp` exist in this test file (they do per `traits.test.ts:80`). Adjust the trait id/assertion if the fixture differs.

- [ ] **Step 2: Run test to verify it fails to compile (or passes trivially)**

Run: `npx vitest run src/test/engine/traits.test.ts`
Expected: BEFORE the signature change, `getDynamicTraitMods(fighterLike, ...)` is a TYPE error (`{ traits: string[] }` is not assignable to `Warrior | undefined`). Vitest via esbuild may still run it, but `npx tsc` will flag it. Run `npx tsc --noEmit --project tsconfig.app.json` and confirm the type error on the new test line.

- [ ] **Step 3: Narrow the signature**

In `src/engine/traits.ts`, find:

```typescript
export function getDynamicTraitMods(
  warrior: Warrior | undefined,
  ctx: DynamicTraitContext
): DynamicTraitMods {
  const acc = { attMod: 0, parMod: 0, defMod: 0, iniMod: 0, killWindowBonus: 0 };
  if (!warrior?.traits) return acc;
```

Replace the parameter type:

```typescript
export function getDynamicTraitMods(
  warrior: { traits?: string[] } | undefined,
  ctx: DynamicTraitContext
): DynamicTraitMods {
  const acc = { attMod: 0, parMod: 0, defMod: 0, iniMod: 0, killWindowBonus: 0 };
  if (!warrior?.traits) return acc;
```

Leave any other `Warrior` usage in `traits.ts` (e.g. `generateTraits`, `getStaticTraitMods`) unchanged.

- [ ] **Step 4: Run traits tests + type-check**

Run: `npx vitest run src/test/engine/traits.test.ts && npx tsc --noEmit --project tsconfig.app.json`
Expected: tests PASS; the new test line no longer errors.

- [ ] **Step 5: Commit**

```bash
git add src/engine/traits.ts src/test/engine/traits.test.ts
git commit -m "refactor(combat): narrow getDynamicTraitMods to structural param"
```

---

## Task 3: Remove the casts in `resolution.ts`

**Files:**

- Modify: `src/engine/combat/resolution/resolution.ts:97-102` and `660-667`

- [ ] **Step 1: Remove the favorite-rhythm casts (lines ~97-102)**

Find:

```typescript
const masteryIniA = fA.favorites ? getFavoriteRhythmBonus(fA as unknown as Warrior, OE_A, AL_A) : 0;
const masteryIniD = fD.favorites ? getFavoriteRhythmBonus(fD as unknown as Warrior, OE_D, AL_D) : 0;
```

Replace with:

```typescript
const masteryIniA = fA.favorites ? getFavoriteRhythmBonus(fA, OE_A, AL_A) : 0;
const masteryIniD = fD.favorites ? getFavoriteRhythmBonus(fD, OE_D, AL_D) : 0;
```

- [ ] **Step 2: Remove the dynamic-trait casts (lines ~660-667)**

Find:

```typescript
const dynTraitsA = getDynamicTraitMods(
  fA.traits ? ({ traits: fA.traits } as unknown as Warrior) : undefined,
  traitCtxA
);
const dynTraitsD = getDynamicTraitMods(
  fD.traits ? ({ traits: fD.traits } as unknown as Warrior) : undefined,
  traitCtxD
);
```

Replace with (pass `fA`/`fD` directly — `getDynamicTraitMods` already guards on `warrior?.traits`):

```typescript
const dynTraitsA = getDynamicTraitMods(fA, traitCtxA);
const dynTraitsD = getDynamicTraitMods(fD, traitCtxD);
```

- [ ] **Step 3: Drop the now-unused `Warrior` import if nothing else needs it**

Run:

```bash
grep -n "Warrior" src/engine/combat/resolution/resolution.ts | grep -v "FighterState\|warrior\|Warriors"
```

If `Warrior` (the type) is no longer referenced anywhere else in the file, remove its import line (`import type { Warrior } from '@/types/warrior.types';`). If it IS still used (e.g. another cast or signature), leave the import.

- [ ] **Step 4: Type-check + run combat tests**

Run: `npx tsc --noEmit --project tsconfig.app.json && npx vitest run src/test/engine`
Expected: clean type-check; combat/resolution tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/combat/resolution/resolution.ts
git commit -m "refactor(combat): pass FighterState directly, drop Warrior casts in resolution"
```

---

## Task 4: Remove the cast in `hitExecution.ts`

**Files:**

- Modify: `src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts:233-240`

- [ ] **Step 1: Remove the cast**

Find:

```typescript
const attackerTraitKill = attacker.traits
  ? getDynamicTraitMods({ traits: attacker.traits } as unknown as Warrior, {
      phase: phase as 'OPENING' | 'MID' | 'LATE',
      hpRatio: attacker.hp / attacker.maxHp,
      endRatio: attacker.endurance / attacker.maxEndurance,
      consecutiveHits: attacker.consecutiveHits,
    }).killWindowBonus
  : 0;
```

Replace with (`attacker` is a `FighterState`, now directly assignable):

```typescript
const attackerTraitKill = attacker.traits
  ? getDynamicTraitMods(attacker, {
      phase: phase as 'OPENING' | 'MID' | 'LATE',
      hpRatio: attacker.hp / attacker.maxHp,
      endRatio: attacker.endurance / attacker.maxEndurance,
      consecutiveHits: attacker.consecutiveHits,
    }).killWindowBonus
  : 0;
```

- [ ] **Step 2: Drop unused `Warrior` import if applicable**

Run:

```bash
grep -n "Warrior" src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts
```

If the only reference was the removed cast, delete the `Warrior` import. Otherwise leave it.

- [ ] **Step 3: Type-check + run tests**

Run: `npx tsc --noEmit --project tsconfig.app.json && npx vitest run src/test/engine`
Expected: clean; PASS.

- [ ] **Step 4: Commit**

```bash
git add src/engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts
git commit -m "refactor(combat): drop Warrior cast in hitExecution kill-window calc"
```

---

## Task 5: Confirm the boundary is clean and behavior is unchanged

- [ ] **Step 1: Verify no FighterState↔Warrior casts remain**

Run:

```bash
grep -rn "as unknown as Warrior\|as Warrior" src/engine/combat src/engine/bout --include="*.ts" | grep -v test
```

Expected: NO output. (The out-of-scope `StableId`/`FightSummary` casts live in `reportingHandler.ts`/`mortalityHandler.ts` and are intentionally untouched — they will not match this grep.)

- [ ] **Step 2: Run the full engine + integration suite to prove no behavior change**

Run: `npx vitest run src/test/engine src/test/integration`
Expected: PASS — these are pure signature changes, so every simulation test must produce identical results.

- [ ] **Step 3: Full type-check**

Run: `npx tsc --noEmit --project tsconfig.app.json`
Expected: clean.

- [ ] **Step 4: Commit (if any cleanup remained)**

```bash
git add -A
git commit -m "test(combat): verify FighterState type boundary is cast-free"
```

---

## Self-Review Notes (for the implementer)

- **Zero runtime change is the whole point.** If any simulation/golden test output changes, STOP — something other than a signature was altered. The seed-based combat tests are the safety net; they must stay green and identical.
- **Why structural types, not adapters:** these two functions read exactly one field each. A full `WarriorAdapter` would be over-engineering (YAGNI). The minimal `{ favorites?: ... }` / `{ traits?: ... }` interfaces are the correct surface.
- **Imports:** removing `Warrior` imports is optional polish — only do it when the type is genuinely unreferenced, and let `npx tsc` (noUnusedLocals if enabled) or eslint guide you.

## Verification (done by reviewer after implementation)

1. `grep -rn "as unknown as Warrior\|as Warrior" src/engine/combat src/engine/bout --include="*.ts" | grep -v test` → no output.
2. `npx vitest run src/test/engine src/test/integration` → all pass, identical to pre-change baseline.
3. `npx tsc --noEmit --project tsconfig.app.json` → clean.
4. Spot-check the 5 edited call sites: each passes `fA`/`fD`/`attacker` directly with no cast.
5. Confirm the out-of-scope casts in `reportingHandler.ts` / `mortalityHandler.ts` were left untouched.
