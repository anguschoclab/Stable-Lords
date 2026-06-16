# IA Consolidation — Collapse to Two Hubs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current three-management-hub navigation (`Command` + `Stable/ops` + a dead `/stable/*` tree) with two hubs — a single unified **Stable** hub at `/stable/*` and the existing **World** hub — eliminating duplicate routes and a confusing Command/Ops split.

**Architecture:** Introduce one canonical route prefix `/stable/*` for all stable-management + weekly-action pages. Move each existing `/command/*` and `/ops/*` page to its `/stable/*` equivalent, leave thin redirect routes at the old paths for bookmark safety, delete the dead legacy `/stable/*` files first to free the prefix, and update `HUBS` plus all internal `<Link>`s. TanStack Router's file-based routing regenerates `routeTree.gen.ts` automatically.

**Tech Stack:** TanStack React Router (file-based routing, `routeTree.gen.ts` auto-generated), React 18, Vitest, Tailwind.

**Key existing facts (verified):**
- Live hubs are defined in `src/components/layout/navigationShared.tsx:43` (`HUBS`): `command`, `ops` (labeled "Stable"), `world`, `bookmarks`.
- `/command/roster`, `/ops/roster`, and `/ops/overview` all render the **same** `StableHall` component — true duplication.
- The legacy `/stable/*` tree (`src/routes/stable/*.tsx`: index, training, trainers, recruit, planner, finance, equipment, contracts, `$id`) is NOT referenced by `HUBS` and is dead, except confirm `$id`/warrior-detail usage before deleting (warrior detail is actually `/warrior/$id`; rival stable detail is `/world/stable/$id`).
- Redirect pattern already in use (`src/routes/command/combat.tsx`): `beforeLoad: () => { throw redirect({ to: '/...' }); }`.
- ~26 non-route files contain internal `/command/*` or `/ops/*` link strings (verified via grep).

### Canonical page map (target `/stable/*`)

| New path | Component | Old path(s) it replaces |
|---|---|---|
| `/stable` (index) | `ControlCenter` | `/command` |
| `/stable/roster` | `StableHall` | `/command/roster`, `/ops/roster`, `/ops/overview` |
| `/stable/training` | `Training` | `/command/training` |
| `/stable/planner` | `TrainingPlanner` | `/command/tactics` |
| `/stable/arena` | `ArenaHub` | `/command/arena`, `/command/combat` |
| `/stable/equipment` | `StableEquipment` | `/ops/equipment` |
| `/stable/bouts` | `BookingOffice` | `/ops/contracts` |
| `/stable/promoters` | `PromoterDirectory` | `/ops/promoters` |
| `/stable/promoter/$id` | `PromoterDetail` | `/ops/promoter/$id` |
| `/stable/trainers` | `Trainers` | `/ops/personnel` |
| `/stable/finance` | `StableLedger` | `/ops/finance` |
| `/stable/recruit` | `Recruit` | `/ops/recruit` |
| `/stable/offseason` | `Offseason` | `/ops/offseason` |

`Tournaments` stays in the World hub (`/world/tournaments`). `World` and `Bookmarks` hubs are unchanged.

---

## File Structure

- Delete: all `src/routes/stable/*.tsx` legacy files (after confirming none are linked).
- Create: `src/routes/stable/__root.tsx` (unified hub layout), `src/routes/stable/index.tsx`, and one file per row in the canonical map above.
- Create: `src/routes/stable/_layout` reuse — reuse the existing layout component currently used by Command/Ops (`CommandLayout` or a new `StableLayout`).
- Rewrite: each old `src/routes/command/*.tsx` and `src/routes/ops/*.tsx` into a redirect-only route.
- Modify: `src/components/layout/navigationShared.tsx` — collapse `HUBS` to two management entries → one `stable` hub + `world` + `bookmarks`.
- Modify: ~26 files containing internal links (mechanical find/replace, enumerated in Task 5).
- Auto-regenerated: `src/routeTree.gen.ts` (do not hand-edit; it regenerates on `bun run dev` / build).

---

## Task 1: Delete the dead legacy `/stable/*` tree

**Files:**
- Delete: `src/routes/stable/index.tsx`, `training.tsx`, `trainers.tsx`, `recruit.tsx`, `planner.tsx`, `finance.tsx`, `equipment.tsx`, `contracts.tsx`, `$id.tsx`
- Test: confirm no live links break

- [ ] **Step 1: Verify the tree is truly unreferenced**

Run:
```bash
grep -rnE "to=[\"'\`]/stable/(index|training|trainers|recruit|planner|finance|equipment|contracts)" src --include="*.tsx" --include="*.ts" | grep -v routeTree.gen
```
Expected: NO output (these paths are not linked anywhere). If any line appears, note it — that link must be repointed in Task 5 instead of assumed dead.

Also confirm warrior detail and rival stable detail live elsewhere:
```bash
grep -rn "to=\"/warrior/\|to=\"/world/stable/" src --include="*.tsx" | head
```
Expected: warrior detail uses `/warrior/$id`, rival stable uses `/world/stable/$id` — so deleting `src/routes/stable/$id.tsx` is safe.

- [ ] **Step 2: Delete the files**

```bash
git rm "src/routes/stable/index.tsx" "src/routes/stable/training.tsx" "src/routes/stable/trainers.tsx" "src/routes/stable/recruit.tsx" "src/routes/stable/planner.tsx" "src/routes/stable/finance.tsx" "src/routes/stable/equipment.tsx" "src/routes/stable/contracts.tsx" "src/routes/stable/\$id.tsx"
```

- [ ] **Step 3: Regenerate the route tree and type-check**

Run: `bun run dev` briefly (it regenerates `routeTree.gen.ts`) then stop it, OR run `npx tsc --noEmit --project tsconfig.app.json`.
Expected: no references to the deleted routes remain; type-check is clean.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(ia): delete dead legacy /stable route tree"
```

---

## Task 2: Create the unified `/stable/*` hub routes

**Files:**
- Create: `src/routes/stable/__root.tsx`
- Create: `src/routes/stable/index.tsx`, `roster.tsx`, `training.tsx`, `planner.tsx`, `arena.tsx`, `equipment.tsx`, `bouts.tsx`, `promoters.tsx`, `promoter.$id.tsx`, `trainers.tsx`, `finance.tsx`, `recruit.tsx`, `offseason.tsx`

> Engineer note: open `src/routes/command/__root.tsx` and `src/routes/ops/__root.tsx` first to see how the hub layout is wired (`CommandLayout` / `OpsLayout`). Reuse one layout component for the merged hub. If both layouts are near-identical, create `src/components/layout/StableLayout.tsx` by copying the richer of the two and rename; otherwise reuse `CommandLayout` directly.

- [ ] **Step 1: Create the hub root layout**

```tsx
// src/routes/stable/__root.tsx
import { createFileRoute } from '@tanstack/react-router';
import StableLayout from '@/components/layout/StableLayout';

export const Route = createFileRoute('/stable')({
  component: StableLayout,
});
```

> If you reuse `CommandLayout` instead of creating `StableLayout`, import that and ensure it renders an `<Outlet />` plus the shared nav.

- [ ] **Step 2: Create the index (Overview)**

```tsx
// src/routes/stable/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import ControlCenter from '@/pages/ControlCenter';

export const Route = createFileRoute('/stable/')({
  component: ControlCenter,
});
```

- [ ] **Step 3: Create each page route**

Create one file per row, each following this exact shape (substitute path + component per the canonical map):

```tsx
// src/routes/stable/roster.tsx
import { createFileRoute } from '@tanstack/react-router';
import StableHall from '@/pages/StableHall';

export const Route = createFileRoute('/stable/roster')({
  component: StableHall,
});
```

Repeat for:
- `training.tsx` → `Training` from `@/pages/Training`, path `/stable/training`
- `planner.tsx` → `TrainingPlanner` from `@/pages/TrainingPlanner`, path `/stable/planner`
- `arena.tsx` → `ArenaHub` from `@/pages/ArenaHub`, path `/stable/arena`
- `equipment.tsx` → `StableEquipment` from `@/pages/StableEquipment`, path `/stable/equipment`
- `bouts.tsx` → `BookingOffice` from `@/pages/BookingOffice`, path `/stable/bouts`
- `promoters.tsx` → `PromoterDirectory` from `@/pages/PromoterDirectory`, path `/stable/promoters`
- `promoter.$id.tsx` → `PromoterDetail` from `@/pages/PromoterDetail`, path `/stable/promoter/$id`
- `trainers.tsx` → `Trainers` from `@/pages/Trainers`, path `/stable/trainers`
- `finance.tsx` → `StableLedger` from `@/pages/StableLedger`, path `/stable/finance`
- `recruit.tsx` → `Recruit` from `@/pages/Recruit`, path `/stable/recruit`
- `offseason.tsx` → `Offseason` from `@/pages/Offseason`, path `/stable/offseason`

> For `promoter.$id.tsx`, copy the exact param/loader logic from `src/routes/ops/promoter.$id.tsx` (it may read `Route.useParams()`); only the path string changes.

- [ ] **Step 4: Regenerate route tree + type-check**

Run: `npx tsc --noEmit --project tsconfig.app.json` (after a `bun run dev` regeneration pass).
Expected: clean. All new `/stable/*` routes resolve.

- [ ] **Step 5: Manual smoke test**

Run: `bun run dev`, visit `/stable`, `/stable/roster`, `/stable/bouts`, `/stable/finance`, `/stable/promoter/<some-id>`. Each renders the correct page.

- [ ] **Step 6: Commit**

```bash
git add src/routes/stable src/components/layout/StableLayout.tsx
git commit -m "feat(ia): add unified /stable hub routes"
```

---

## Task 3: Convert old `/command/*` and `/ops/*` routes to redirects

**Files:**
- Rewrite: every file in `src/routes/command/` and `src/routes/ops/` (except `__root.tsx` — see note)

> Engineer note: keep the `__root.tsx` files for now ONLY if deleting them would orphan the redirect children in TanStack's file routing. Simplest correct approach: turn each leaf route into a `beforeLoad` redirect and leave `__root.tsx` as a pass-through `<Outlet/>` layout. After verifying redirects work, `__root.tsx` for command/ops can be simplified to a bare outlet.

- [ ] **Step 1: Rewrite each leaf as a redirect**

For every old leaf route, replace its body with the redirect pattern. Example:

```tsx
// src/routes/command/roster.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/command/roster')({
  beforeLoad: () => {
    throw redirect({ to: '/stable/roster' });
  },
  component: () => null,
});
```

Apply the full mapping:
- `/command/` → `/stable`
- `/command/roster` → `/stable/roster`
- `/command/training` → `/stable/training`
- `/command/tactics` → `/stable/planner`
- `/command/arena` → `/stable/arena`
- `/command/combat` → `/stable/arena` (already a redirect; just retarget)
- `/ops/` → `/stable`
- `/ops/overview` → `/stable/roster`
- `/ops/roster` → `/stable/roster`
- `/ops/equipment` → `/stable/equipment`
- `/ops/contracts` → `/stable/bouts`
- `/ops/promoters` → `/stable/promoters`
- `/ops/promoter/$id` → `/stable/promoter/$id` (preserve the param: `throw redirect({ to: '/stable/promoter/$id', params })` inside `beforeLoad: ({ params }) => ...`)
- `/ops/personnel` → `/stable/trainers`
- `/ops/finance` → `/stable/finance`
- `/ops/recruit` → `/stable/recruit`
- `/ops/offseason` → `/stable/offseason`

For the param-carrying redirect:

```tsx
// src/routes/ops/promoter.$id.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/ops/promoter/$id')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/stable/promoter/$id', params });
  },
  component: () => null,
});
```

- [ ] **Step 2: Type-check + regenerate**

Run: `npx tsc --noEmit --project tsconfig.app.json`
Expected: clean.

- [ ] **Step 3: Manual redirect smoke test**

Run: `bun run dev`. Manually enter old URLs in the address bar: `/command`, `/command/roster`, `/ops/overview`, `/ops/contracts`, `/ops/promoter/<id>`. Each should land on its `/stable/*` equivalent.

- [ ] **Step 4: Commit**

```bash
git add src/routes/command src/routes/ops
git commit -m "feat(ia): redirect legacy /command and /ops paths to /stable"
```

---

## Task 4: Collapse `HUBS` to two management hubs

**Files:**
- Modify: `src/components/layout/navigationShared.tsx:43-97`

- [ ] **Step 1: Write/adjust a nav test**

```typescript
// src/test/components/navigationHubs.test.ts
import { describe, it, expect } from 'vitest';
import { HUBS } from '@/components/layout/navigationShared';

describe('HUBS structure after consolidation', () => {
  it('has exactly one stable management hub, world, and bookmarks (no command/ops split)', () => {
    const ids = HUBS.map((h) => h.id);
    expect(ids).toContain('stable');
    expect(ids).toContain('world');
    expect(ids).not.toContain('command');
    expect(ids).not.toContain('ops');
  });

  it('the stable hub links only to /stable/* (and /world/tournaments)', () => {
    const stable = HUBS.find((h) => h.id === 'stable')!;
    stable.pages.forEach((p) => {
      expect(p.to.startsWith('/stable') || p.to.startsWith('/world')).toBe(true);
    });
  });

  it('contains no /command or /ops links anywhere in HUBS', () => {
    const json = JSON.stringify(HUBS);
    expect(json).not.toMatch(/\/command/);
    expect(json).not.toMatch(/\/ops/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/components/navigationHubs.test.ts`
Expected: FAIL — `command`/`ops` still present.

- [ ] **Step 3: Replace the two management hub entries with one**

In `src/components/layout/navigationShared.tsx`, replace the `command` and `ops` objects in `HUBS` with a single `stable` hub:

```tsx
  {
    id: 'stable',
    label: 'Stable',
    icon: Swords,
    to: '/stable',
    pages: [
      { to: '/stable', label: 'Overview', icon: LayoutDashboard, exact: true },
      { to: '/stable/roster', label: 'Roster', icon: BookUser },
      { to: '/stable/training', label: 'Training', icon: Dumbbell },
      { to: '/stable/planner', label: 'Planner', icon: BrainCircuit },
      { to: '/stable/arena', label: 'Arena', icon: Flame },
      { to: '/stable/equipment', label: 'Equipment', icon: Wrench },
      { to: '/stable/bouts', label: 'Bouts', icon: ScrollText },
      { to: '/stable/promoters', label: 'Promoters', icon: Building2 },
      { to: '/stable/trainers', label: 'Trainers', icon: Dumbbell },
      { to: '/stable/finance', label: 'Finance', icon: Coins },
      { to: '/stable/recruit', label: 'Recruit', icon: UserPlus },
      { to: '/stable/offseason', label: 'Offseason', icon: Sunset },
      { to: '/world/tournaments', label: 'Tournaments', icon: CalendarClock },
    ],
  },
```

Leave the `world` and `bookmarks` hub objects unchanged.

- [ ] **Step 4: Fix the other references in navigationShared.tsx**

Search the rest of the file for the hardcoded hub-default paths seen at lines ~160, ~364, ~372 (`command: '/command/training'`, `ops: '/ops/contracts'`, etc.) and any `HubId`-keyed maps. Repoint them to `/stable/*` and collapse the `command`/`ops` keys into a single `stable` key. Specifically:
- `command: '/command/training'` and `ops: '/ops/contracts'` default-target maps → replace with the single `stable: '/stable'` (or remove if now unused).
- Any `to: '/command/training'` / `to: '/ops/contracts'` fallback links → `/stable/training` / `/stable/bouts`.

Update the `HubId` type if it's a string-literal union (`'command' | 'ops' | 'world' | 'bookmarks'` → `'stable' | 'world' | 'bookmarks'`).

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/test/components/navigationHubs.test.ts`
Expected: PASS.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit --project tsconfig.app.json`
Expected: clean (the `HubId` narrowing surfaces any stale references — fix them).

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/navigationShared.tsx src/test/components/navigationHubs.test.ts
git commit -m "feat(ia): collapse Command+Ops nav into single Stable hub"
```

---

## Task 5: Repoint internal links across the app

**Files:**
- Modify: all non-route files containing `/command/*` or `/ops/*` link strings (~26 files, enumerate in Step 1)

- [ ] **Step 1: Enumerate the files**

Run:
```bash
grep -rlE "[\"'\`]/(command|ops)/" src --include="*.tsx" --include="*.ts" | grep -v routeTree.gen | grep -v "src/routes/"
```
Record the list. These are the files to edit.

- [ ] **Step 2: Apply the path mapping**

For each file, replace link targets per this exact mapping (same as Task 3):
- `/command` → `/stable`
- `/command/roster` → `/stable/roster`
- `/command/training` → `/stable/training`
- `/command/tactics` → `/stable/planner`
- `/command/arena` → `/stable/arena`
- `/command/combat` → `/stable/arena`
- `/ops/overview` → `/stable/roster`
- `/ops/roster` → `/stable/roster`
- `/ops/equipment` → `/stable/equipment`
- `/ops/contracts` → `/stable/bouts`
- `/ops/promoters` → `/stable/promoters`
- `/ops/promoter/` → `/stable/promoter/`
- `/ops/personnel` → `/stable/trainers`
- `/ops/finance` → `/stable/finance`
- `/ops/recruit` → `/stable/recruit`
- `/ops/offseason` → `/stable/offseason`

> Do these as careful per-file edits, not a blind global sed, because `/ops/overview` and `/ops/roster` both map to `/stable/roster` and ordering matters. Apply longest-prefix matches first.

- [ ] **Step 3: Confirm no stale internal links remain**

Run:
```bash
grep -rnE "to=[\"'\`]/(command|ops)/" src --include="*.tsx" --include="*.ts" | grep -v routeTree.gen | grep -v "beforeLoad"
```
Expected: NO output except the redirect routes themselves (which legitimately mention old paths in `createFileRoute`).

- [ ] **Step 4: Type-check (catches typed router link errors)**

Run: `npx tsc --noEmit --project tsconfig.app.json`
Expected: clean. TanStack's typed `Link` will error on any `to` that no longer exists.

- [ ] **Step 5: Run the full component test suite**

Run: `npx vitest run src/test/components`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ia): repoint internal links to /stable hub"
```

---

## Task 6: Full-app verification pass

- [ ] **Step 1: Run the whole suite**

Run: `npx vitest run`
Expected: PASS (or unchanged baseline — record any pre-existing failures separately).

- [ ] **Step 2: Run e2e if present**

Run: `bun run e2e` (Playwright). If e2e specs hardcode `/command` or `/ops` URLs, update them to `/stable` equivalents and re-run.

- [ ] **Step 3: Manual click-through**

Run: `bun run dev`. From a fresh load: click every item in the Stable hub and the World hub; confirm each lands on the right page and the active-state highlight works. Enter 3 old URLs manually and confirm redirects.

- [ ] **Step 4: Commit any e2e fixups**

```bash
git add -A
git commit -m "test(ia): update e2e specs for /stable routes"
```

---

## Self-Review Notes (for the implementer)

- **`routeTree.gen.ts` is generated** — never hand-edit it; it rebuilds from the `src/routes/` file structure on dev/build.
- **Redirects are kept indefinitely** for bookmark safety; they are cheap (`beforeLoad` throw). Do not delete the old route files.
- **Duplicate-resolution:** `/ops/overview` historically rendered `StableHall` (the roster). It now redirects to `/stable/roster`. If product wants the old "Overview" to be the dashboard (`ControlCenter`) instead, redirect `/ops/overview` → `/stable` instead. Confirm intent with the product owner; default in this plan is `/stable/roster` to preserve prior behavior.
- **Layout reuse:** only one of `CommandLayout`/`OpsLayout` survives as `StableLayout`. Delete the unused one in a follow-up cleanup commit once redirects are confirmed working.

## Verification (done by reviewer after implementation)

1. `grep -rnE "to=[\"'\`]/(command|ops)/" src --include="*.tsx" | grep -v beforeLoad | grep -v routeTree.gen` → only redirect route definitions, no live links.
2. `npx tsc --noEmit --project tsconfig.app.json` → clean.
3. `npx vitest run src/test/components/navigationHubs.test.ts` → pass.
4. Manual: every Stable-hub nav item resolves; 3 legacy URLs redirect correctly.
5. Confirm the dead `/stable/*` legacy files are gone and no new ones were re-created with stale content.
