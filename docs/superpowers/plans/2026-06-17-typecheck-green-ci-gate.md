# Type-Check Green + CI Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drive `npx tsc --noEmit --project tsconfig.app.json` from 134 errors to 0 — fixing 6 real production bugs first, then 128 test-fixture errors — and add a required CI gate so the type-check can never silently go red again.

**Architecture:** Fix production errors individually (each is a genuine defect with an exact fix). Clear test-fixture errors in batches grouped by error _class_ (unused vars, possibly-undefined index access, type mismatches) using a documented recipe per class, with `tsc` as the gate. Finally, wire `type-check` + `test` into the GitHub Actions workflow as a required check.

**Tech Stack:** TypeScript (strict, `noUncheckedIndexedAccess`), Vitest, React 18, GitHub Actions.

**Key existing facts (verified):**

- Current count: **6 production errors + 128 test-file errors = 134** (`npx tsc --noEmit --project tsconfig.app.json`).
- The 6 production errors are: 3 duplicate-`aria-label` bugs in the plan builder, 1 incomplete weather-icon map, 1 scouting prop mismatch, 1 AI-bidding `GameState` literal missing `bookmarks`.
- `package.json` already defines `"type-check": "tsc --noEmit --project tsconfig.app.json"` and `"test": "npx vitest run"`.
- Project tooling is **Bun** — use `bun`/`bunx` (the `test` script shells to vitest; `bunx tsc` works for type-check).
- Test-error classes (counts): TS2532 possibly-undefined (34), TS6133/TS6196 unused (29), TS2345 arg-mismatch (25), TS2322 type-mismatch (22), plus smaller buckets (TS2353, TS2339, TS2305, TS2820, TS2352, TS7053, TS2741).

---

## File Structure

- Modify: `src/components/planBuilder/TacticBank.tsx`, `PhaseOverrides.tsx`, `SpatialControls.tsx` — remove duplicate `aria-label` attributes.
- Modify: `src/components/arena/weather/index.tsx` — add the missing `'Blood Fog'` key.
- Modify: `src/components/scouting/StableComparison.tsx` — align props to the child component's interface.
- Modify: `src/engine/ai/workers/competitionWorker/boutBidding.ts` — add missing `bookmarks` field.
- Modify: ~55 files under `src/test/**` — clear type errors by class.
- Modify/Create: `.github/workflows/*.yml` — add the type-check + test gate.

---

## Task 1: Fix the three duplicate-`aria-label` bugs in the plan builder

These are merge collisions — each `<button>` ended up with two `aria-label` attributes; React silently keeps the last and drops the first. Keep the attribute that matches the button's visible purpose; delete the other.

**Files:**

- Modify: `src/components/planBuilder/TacticBank.tsx:62`
- Modify: `src/components/planBuilder/PhaseOverrides.tsx:45`
- Modify: `src/components/planBuilder/SpatialControls.tsx:123`

- [ ] **Step 1: Confirm the three errors exist**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep TS17001`
Expected: three lines — `PhaseOverrides.tsx(55,21)`, `SpatialControls.tsx(123,17)`, `TacticBank.tsx(62,13)`.

- [ ] **Step 2: TacticBank — remove the second `aria-label`**

In `src/components/planBuilder/TacticBank.tsx`, the `<button>` has `aria-label={\`Select Tactic: ${t.id}\`}`(line 52) and`aria-label={'Select tactic ' + t.label}` (line 62). Delete the line 62 duplicate:

Remove this line entirely:

```tsx
            aria-label={'Select tactic ' + t.label}
```

- [ ] **Step 3: PhaseOverrides — remove the first `aria-label`**

In `src/components/planBuilder/PhaseOverrides.tsx`, the Clear `<button>` has `aria-label="Remove phase override"` (line 45) and `aria-label={\`Clear phase ${p}\`}` (line 55). The visible button text is "Clear", so keep the line 55 label and delete the line 45 one:

Remove this line entirely:

```tsx
                    aria-label="Remove phase override"
```

- [ ] **Step 4: SpatialControls — remove the second `aria-label`**

In `src/components/planBuilder/SpatialControls.tsx`, the range `<button>` has `aria-label={\`Set Range Preference to ${r}\`}`(line 115) and`aria-label={'Set preferred distance to ' + r}` (line 123). Delete the line 123 duplicate:

Remove this line entirely:

```tsx
                aria-label={'Set preferred distance to ' + r}
```

- [ ] **Step 5: Verify the three errors are gone**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep TS17001 || echo "NO duplicate-attribute errors"`
Expected: `NO duplicate-attribute errors`.

- [ ] **Step 6: Commit**

```bash
git add src/components/planBuilder/TacticBank.tsx src/components/planBuilder/PhaseOverrides.tsx src/components/planBuilder/SpatialControls.tsx
git commit -m "fix(plan-builder): remove duplicate aria-label attributes (merge collisions)"
```

---

## Task 2: Complete the weather-visuals map

The `WEATHER_VISUALS` registry is typed `Record<WeatherType, …>` and is missing the `'Blood Fog'` weather (a `WeatherType` member at `src/types/shared.types.ts:623`), so that weather renders no overlay and the compiler errors.

**Files:**

- Modify: `src/components/arena/weather/index.tsx:38`

- [ ] **Step 1: Confirm the error**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep "weather/index"`
Expected: one error — `Property '"Blood Fog"' is missing … required in type 'Record<WeatherType, …>'`.

- [ ] **Step 2: Add the missing key**

In `src/components/arena/weather/index.tsx`, inside the `WEATHER_VISUALS` object literal, add a `'Blood Fog'` entry next to `'Blood Moon'`. Use `null` (intentionally neutral, no particle overlay) — the same convention already used for `Clear`/`Overcast`:

```tsx
  'Blood Fog': null,
```

> Engineer note: if a fog/blood particle effect already exists in `./effects` and design wants it, wire `() => <SomeFogEffect />` instead. `null` is the safe, compiler-correct minimum.

- [ ] **Step 3: Verify**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep "weather/index" || echo "weather map complete"`
Expected: `weather map complete`.

- [ ] **Step 4: Commit**

```bash
git add src/components/arena/weather/index.tsx
git commit -m "fix(weather): add missing Blood Fog entry to WEATHER_VISUALS"
```

---

## Task 3: Fix the scouting prop mismatch and the AI-bidding state literal

**Files:**

- Modify: `src/components/scouting/StableComparison.tsx:71`
- Modify: `src/engine/ai/workers/competitionWorker/boutBidding.ts:20`

- [ ] **Step 1: Fix the AI-bidding `GameState` literal**

The error: a `GameState` object literal in `boutBidding.ts:20` is missing the required `bookmarks` field (`bookmarks: Bookmark[]`, `src/types/state.types.ts:579`). Add it to the literal:

```ts
  bookmarks: [],
```

> Engineer note: place it alongside the other `GameState` fields in that literal. `[]` is the correct empty default (matches how a fresh state initializes bookmarks).

- [ ] **Step 2: Fix the scouting prop mismatch**

Open `src/components/scouting/StableComparison.tsx` (the error is at line 71, where it renders a child — likely `AverageAttributesSection`). Open that child component, read its `AverageAttributesSectionProps` interface, and pass **only** the props it declares. The error means the parent passes extra/wrong-typed props (e.g. `rivalA`/`rivalB` that the child doesn't accept). Remove the undeclared props or extend the child's interface to accept them — whichever matches how the child actually uses the data.

Run to see the exact shape mismatch:

```bash
bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep "StableComparison"
```

> Engineer note: prefer trimming the call site to the declared props (YAGNI) unless the child genuinely needs the extra data, in which case add the fields to `AverageAttributesSectionProps` and use them.

- [ ] **Step 3: Verify both gone**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -E "StableComparison|boutBidding" || echo "both fixed"`
Expected: `both fixed`.

- [ ] **Step 4: Confirm production code is now fully clean**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep "error TS" | grep -v "src/test/" || echo "PRODUCTION CODE TYPE-CLEAN"`
Expected: `PRODUCTION CODE TYPE-CLEAN`.

- [ ] **Step 5: Commit**

```bash
git add src/components/scouting/StableComparison.tsx src/engine/ai/workers/competitionWorker/boutBidding.ts
git commit -m "fix(types): scouting prop mismatch and AI-bidding state bookmarks field"
```

---

## Task 4: Clear unused-declaration errors in tests (TS6133 / TS6196)

~29 errors are unused imports/variables in test files — pure deletes, no behavior change.

**Files:**

- Modify: every `src/test/**` file with a TS6133/TS6196 error (enumerate in Step 1).

- [ ] **Step 1: Enumerate**

Run:

```bash
bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -E "TS6133|TS6196" | sort
```

Each line names a file, position, and the unused identifier (e.g. `'foo' is declared but its value is never read`).

- [ ] **Step 2: Delete each unused declaration**

For each error, open the file at the given line and remove the unused identifier:

- Unused **import**: delete it from the import list (or drop the whole `import` line if it becomes empty).
- Unused **local variable**: delete the declaration; if it's a destructure (`const { a, b } = x` where `b` is unused), remove just `b`.

Worked example — if the error is `src/test/engine/foo.test.ts(3,10): 'vi' is declared but its value is never read`:

```ts
// before
import { describe, it, expect, vi } from 'vitest';
// after
import { describe, it, expect } from 'vitest';
```

- [ ] **Step 3: Verify the class is empty**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -cE "TS6133|TS6196"`
Expected: `0`.

- [ ] **Step 4: Run the affected tests to confirm no behavior change**

Run: `npx vitest run` (full suite — these are deletes; nothing should change).
Expected: same pass count as before (record the baseline first with `npx vitest run 2>&1 | tail -3`).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(tests): remove unused declarations (TS6133/TS6196)"
```

---

## Task 5: Clear possibly-undefined index-access errors in tests (TS2532)

~34 errors from `noUncheckedIndexedAccess`: indexing an array/record returns `T | undefined`, and the test then dereferences it. The fix is a non-null assertion on the index result (these are test fixtures with known-present elements).

**Files:**

- Modify: every `src/test/**` file with a TS2532 error (enumerate in Step 1).

- [ ] **Step 1: Enumerate**

Run:

```bash
bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep "TS2532" | sort
```

- [ ] **Step 2: Apply the non-null-assertion recipe**

For each error, add `!` to the index access that is being dereferenced. This is the exact recipe already used in `src/test/engine/tokens/patronTokenService.test.ts`.

Worked examples:

```ts
// before → after
expect(result.roster[0].name).toBe('X');        →  expect(result.roster[0]!.name).toBe('X');
state.insightTokens![0].type = 'Weapon';          →  state.insightTokens![0]!.type = 'Weapon';
result.newsletter?.[0].title                       →  result.newsletter?.[0]!.title
const w = arr[2]; w.fame                           →  const w = arr[2]!; w.fame
```

Rule: only the index result being **dereferenced** (`.prop` or assignment target) needs `!`. A value merely _passed_ to `expect(...)` does not.

- [ ] **Step 3: Verify the class is empty**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "TS2532"`
Expected: `0`.

- [ ] **Step 4: Run the suite**

Run: `npx vitest run 2>&1 | tail -3`
Expected: same pass count as the Task 4 baseline.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(tests): assert non-null on index access (TS2532)"
```

---

## Task 6: Clear remaining type-mismatch / fixture errors in tests

Remaining classes: TS2345 (arg mismatch, ~25), TS2322 (type mismatch, ~22), TS2353 (unknown property), TS2339 (missing property), TS2305 (missing export), TS2820/TS2352/TS7053/TS2741. These are mostly incomplete or mistyped test fixtures.

**Files:**

- Modify: every `src/test/**` file with one of these errors (enumerate in Step 1).

- [ ] **Step 1: Enumerate by class**

Run:

```bash
bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -E "TS2345|TS2322|TS2353|TS2339|TS2305|TS2820|TS2352|TS7053|TS2741" | sort
```

- [ ] **Step 2: Fix per the error's nature — use the type definition as the source of truth**

For each error, open the file and apply the matching recipe:

- **TS2741 / TS2345 / TS2322 (incomplete or wrong fixture):** the fixture object is missing a required field or has the wrong type. Open the target type (the error message names it, e.g. `GameState`, `Warrior`) and add the missing field with a correct default. Worked example — `Property 'traits' is missing … in type 'Warrior'`:

  ```ts
  const w = makeTestWarrior({ /* … */ });   // before, fails if factory omits traits
  // fix the factory or the literal to include:
  traits: [],
  ```

  For branded-id fixtures (`Type 'string' is not assignable to 'WarriorId'`), cast at the fixture boundary: `id: 'p1' as WarriorId` (import the brand type), matching how production code mints ids.

- **TS2353 (object literal has an unknown property):** remove the stray property, or — if the property is real and the type is stale — add it to the type. Prefer removing from the test (YAGNI) unless production code reads it.

- **TS2339 (property does not exist):** the test references a renamed/removed field. Update the test to the current field name (grep the production type for the right name).

- **TS2305 (module has no exported member):** the test imports something no longer exported. Update the import to the current export name, or remove it if the symbol is gone.

- **TS2820 ("Did you mean 'X'?"):** apply the compiler's suggestion (a typo in an enum/string-literal fixture).

- **TS7053 (implicit any index):** add an explicit type to the index expression, or assert the key type.

- [ ] **Step 3: Verify zero errors remain across the whole project**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"`
Expected: `0`.

- [ ] **Step 4: Run the full suite**

Run: `npx vitest run 2>&1 | tail -3`
Expected: same pass count as baseline (no test should have changed behavior — these are type-only fixes).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(tests): complete fixtures and fix type mismatches (tsc green)"
```

---

## Task 7: Add the CI gate so type-check and tests are required

**Files:**

- Modify or Create: `.github/workflows/ci.yml` (read the existing workflow directory first).

- [ ] **Step 1: Inspect existing CI**

Run: `ls .github/workflows && cat .github/workflows/*.yml 2>/dev/null | head -60`
Determine whether a workflow already runs on PRs. If one exists, add the steps to it; otherwise create `ci.yml`.

- [ ] **Step 2: Add (or create) the gate**

Ensure a job runs on `pull_request` (and `push` to the default branch) with these steps, using Bun:

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.3.11
      - run: bun install --frozen-lockfile
      - name: Type-check
        run: bunx tsc --noEmit --project tsconfig.app.json
      - name: Tests
        run: npx vitest run
```

> Engineer note: match the Bun version in `package.json` (`packageManager: bun@1.3.11`). If a workflow already installs deps, reuse its setup and just append the Type-check + Tests steps.

- [ ] **Step 3: Verify the workflow is valid locally**

Run the two gate commands exactly as CI will:

```bash
bunx tsc --noEmit --project tsconfig.app.json && npx vitest run
```

Expected: both succeed (0 type errors, all tests pass).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows
git commit -m "ci: require type-check and tests on PRs"
```

- [ ] **Step 5 (manual, by repo admin): make the check required**

In GitHub → Settings → Branches → branch protection for `main`, mark the `verify` job a required status check. (Not scriptable here — note it in the PR description.)

---

## Self-Review Notes (for the implementer)

- **Production fixes are real bugs, not hygiene** — the duplicate aria-labels (accessibility), the missing weather overlay, and the scouting/AI type holes were shipping. Do Tasks 1–3 first and in their own commits so they're easy to cherry-pick if needed.
- **Test fixes must not change behavior** — every test-error task is type-only. After each, the vitest pass count must be unchanged from the baseline you record at the start of Task 4. If a count drops, you changed runtime behavior — revert and reapply as a pure type fix.
- **The CI gate is the durable win** — without it, the next mass-merge re-reds the type-check. Do not skip Task 7.

## Verification (done by reviewer after implementation)

1. `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.
2. `npx vitest run` → all pass, count unchanged from pre-work baseline.
3. The 3 plan-builder buttons each have exactly one `aria-label`; `WEATHER_VISUALS` has all `WeatherType` keys.
4. CI workflow runs type-check + tests on PRs and is marked required on `main`.
