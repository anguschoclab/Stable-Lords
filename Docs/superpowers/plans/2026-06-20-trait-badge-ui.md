# TraitBadge UI (System 7) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A reusable, tier-colored `TraitBadge` that renders any trait with its name, tier color, a class tag when restricted, and a **tooltip showing the trait's description** — then drop it in wherever traits appear, so the ~98-trait roster is legible to players.

**Architecture:** Combat values are computed elsewhere; this component only *displays* a trait honestly. A pure `traitDisplay.ts` maps a trait id to display metadata (name, tier, sign, class tag, description) and a tier→color class — unit-testable with no DOM. `TraitBadge.tsx` wraps the existing shadcn `Badge` + `Tooltip` primitives. The current flat rendering in `WarriorDossierTraits.tsx` is replaced with `TraitBadge`, and the component is reused on the roster and training screens.

**Tech Stack:** TypeScript, React 18, Tailwind + shadcn/ui (`Badge`, `Tooltip`), Vitest + Testing Library. Bun (`bun`/`bunx` — never npm/node).

**Scope:** System 7 of the trait redesign. **Depends on System 1** (`tier`/`sign`/`styles` on `TraitDef`). It does not compute anything new — every value maps to real trait data. (The roster *liability* badge is a separate component shipped in System 4.)

**Honesty rule (per the project's UI conventions):** the badge must show only what's true of the trait — name, real tier, real description, real class restriction. No invented flavor, no fake "rarity sparkle" beyond the tier color. A trait the player can't read is the problem we're fixing; a trait that *lies* is worse.

---

## File Structure

- **Create** `src/components/warrior/traits/traitDisplay.ts` — pure metadata + color helpers.
- **Create** `src/test/components/warrior/traitDisplay.test.ts` — helper tests.
- **Create** `src/components/warrior/traits/TraitBadge.tsx` — the component.
- **Create** `src/test/components/warrior/TraitBadge.test.tsx` — render test.
- **Modify** `src/components/warrior/dossier/WarriorDossierTraits.tsx` — use `TraitBadge`.

---

## Task 1: Pure display helpers (TDD)

**Files:**
- Create: `src/components/warrior/traits/traitDisplay.ts`
- Create: `src/test/components/warrior/traitDisplay.test.ts`

- [ ] **Step 1: Write the failing test**

`src/test/components/warrior/traitDisplay.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { traitBadgeMeta, traitTierColorClasses } from '@/components/warrior/traits/traitDisplay';

describe('traitBadgeMeta', () => {
  it('returns name, tier, description, and a class tag for a class trait', () => {
    const m = traitBadgeMeta('living_wall'); // WS Signature
    expect(m).not.toBeNull();
    expect(m!.name).toBe('Living Wall');
    expect(m!.tier).toBe('Signature');
    expect(m!.description.length).toBeGreaterThan(5);
    expect(m!.classTag).toBeTruthy(); // styles-restricted ⇒ has a class tag
    expect(m!.isFlaw).toBe(false);
  });

  it('flags flaws and has no class tag for generic traits', () => {
    const flaw = traitBadgeMeta('fragile');
    expect(flaw!.isFlaw).toBe(true);
    expect(flaw!.classTag).toBeUndefined();
  });

  it('returns null for an unknown id', () => {
    expect(traitBadgeMeta('does_not_exist')).toBeNull();
  });
});

describe('traitTierColorClasses', () => {
  it('gives each tier a distinct, non-empty class string', () => {
    const tiers = ['Common', 'Notable', 'Exceptional', 'Signature', 'Flaw'] as const;
    const classes = tiers.map(traitTierColorClasses);
    expect(classes.every((c) => c.length > 0)).toBe(true);
    expect(new Set(classes).size).toBe(tiers.length); // all distinct
  });
});
```

- [ ] **Step 2: Run it — expect FAIL.** `npx vitest run src/test/components/warrior/traitDisplay.test.ts`

- [ ] **Step 3: Implement the helpers**

`src/components/warrior/traits/traitDisplay.ts`:

```typescript
import { TRAITS, type TraitTier } from '@/engine/traits';

export interface TraitBadgeMeta {
  id: string;
  name: string;
  tier: TraitTier;
  description: string;
  isFlaw: boolean;
  /** Short label of the restricting style, if class-specific. */
  classTag?: string;
}

const STYLE_LABEL: Record<string, string> = {
  AimedBlow: 'Aimed Blow', BashingAttack: 'Bashing', LungingAttack: 'Lunging',
  ParryLunge: 'Parry-Lunge', ParryRiposte: 'Parry-Riposte', ParryStrike: 'Parry-Strike',
  SlashingAttack: 'Slashing', StrikingAttack: 'Striking', TotalParry: 'Total Parry',
  WallOfSteel: 'Wall of Steel',
};

export function traitBadgeMeta(id: string): TraitBadgeMeta | null {
  const t = TRAITS[id];
  if (!t) return null;
  return {
    id,
    name: t.name,
    tier: t.tier,
    description: t.description,
    isFlaw: t.tier === 'Flaw',
    classTag: t.styles?.length ? STYLE_LABEL[t.styles[0] as string] ?? String(t.styles[0]) : undefined,
  };
}

/** Tailwind classes per tier — mirrors the potential-grade colour ladder; Flaw is a warning. */
export function traitTierColorClasses(tier: TraitTier): string {
  switch (tier) {
    case 'Common':      return 'bg-white/10 text-foreground/80 border-white/15';
    case 'Notable':     return 'bg-sky-500/10 text-sky-300 border-sky-500/25';
    case 'Exceptional': return 'bg-arena-gold/10 text-arena-gold border-arena-gold/25';
    case 'Signature':   return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    case 'Flaw':        return 'bg-destructive/15 text-destructive border-destructive/30';
  }
}
```

> Confirm the color tokens exist: `grep -rn "arena-gold" tailwind.config.* src/index.css` (used by `WarriorDossierTraits`). `sky-*`/`purple-*` are stock Tailwind. If `arena-gold` is the only custom token, the others are safe.

- [ ] **Step 4: Run + typecheck.** `npx vitest run src/test/components/warrior/traitDisplay.test.ts` → PASS; `bunx tsc … ` → 0.

- [ ] **Step 5: Commit**

```bash
git add "src/components/warrior/traits/traitDisplay.ts" "src/test/components/warrior/traitDisplay.test.ts"
git commit -m "feat(ui): pure trait display metadata + tier color helpers"
```

---

## Task 2: The `TraitBadge` component (render test)

**Files:**
- Create: `src/components/warrior/traits/TraitBadge.tsx`
- Create: `src/test/components/warrior/TraitBadge.test.tsx`

- [ ] **Step 1: Write the failing render test**

`src/test/components/warrior/TraitBadge.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TraitBadge } from '@/components/warrior/traits/TraitBadge';

describe('TraitBadge', () => {
  it('renders the trait name', () => {
    render(<TraitBadge traitId="living_wall" />);
    expect(screen.getByText('Living Wall')).toBeInTheDocument();
  });

  it('exposes the description for the tooltip (title attr fallback)', () => {
    render(<TraitBadge traitId="fragile" />);
    // description is reachable as an accessible title even before hover
    const el = screen.getByText('Fragile');
    expect(el.closest('[title]')?.getAttribute('title') ?? '').toMatch(/defense/i);
  });

  it('renders nothing for an unknown trait', () => {
    const { container } = render(<TraitBadge traitId="nope" />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run it — expect FAIL.** `npx vitest run src/test/components/warrior/TraitBadge.test.tsx`

- [ ] **Step 3: Implement the component**

`src/components/warrior/traits/TraitBadge.tsx`:

```tsx
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { traitBadgeMeta, traitTierColorClasses } from './traitDisplay';

interface TraitBadgeProps {
  traitId: string;
  className?: string;
}

/**
 * Renders a single trait as a tier-colored badge with a description tooltip.
 * Display-only: every value maps to real trait data (name, tier, description,
 * class restriction). Returns null for unknown ids so callers can map freely.
 */
export function TraitBadge({ traitId, className }: TraitBadgeProps) {
  const meta = traitBadgeMeta(traitId);
  if (!meta) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* title gives a no-JS / test-accessible fallback for the description */}
        <Badge
          title={meta.description}
          className={`text-[9px] font-black uppercase tracking-widest rounded-none ${traitTierColorClasses(
            meta.tier
          )} ${className ?? ''}`}
        >
          {meta.name}
          {meta.classTag && <span className="ml-1 opacity-70">· {meta.classTag}</span>}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-[220px]">
        <p className="text-xs font-semibold">
          {meta.name} <span className="opacity-60">— {meta.tier}</span>
        </p>
        <p className="text-[11px] text-muted-foreground">{meta.description}</p>
        {meta.classTag && <p className="text-[10px] opacity-60 mt-1">Class trait: {meta.classTag}</p>}
      </TooltipContent>
    </Tooltip>
  );
}
```

> If `Tooltip` requires a `TooltipProvider` ancestor (shadcn default), confirm one wraps the app (`grep -rn "TooltipProvider" src/App.tsx src/main.tsx`). If not present app-wide, wrap the `Tooltip` here in a local `TooltipProvider`. The `title` attr keeps the description reachable regardless.

- [ ] **Step 4: Run + typecheck.** `npx vitest run src/test/components/warrior/TraitBadge.test.tsx` → PASS; `bunx tsc … ` → 0.

- [ ] **Step 5: Commit**

```bash
git add "src/components/warrior/traits/TraitBadge.tsx" "src/test/components/warrior/TraitBadge.test.tsx"
git commit -m "feat(ui): TraitBadge — tier-colored trait with description tooltip"
```

---

## Task 3: Adopt TraitBadge in the dossier

**Files:**
- Modify: `src/components/warrior/dossier/WarriorDossierTraits.tsx`

- [ ] **Step 1: Replace the flat badge mapping**

In `WarriorDossierTraits.tsx`, replace the `warrior.traits.map(...)` block (which renders a fixed-gold `<Badge>` with `TRAITS[t]?.name`) with:

```tsx
{warrior.traits.map((t) => (
  <TraitBadge key={t} traitId={t} />
))}
```

Add `import { TraitBadge } from '@/components/warrior/traits/TraitBadge';` and drop the now-unused `Badge`/`TRAITS` imports if nothing else in the file uses them.

- [ ] **Step 2: Typecheck + the dossier still renders**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.
Run: `npx vitest run src/test/components 2>&1 | tail -4`
Expected: green (no dossier test regressed; the traits now render via TraitBadge).

- [ ] **Step 3: Commit**

```bash
git add "src/components/warrior/dossier/WarriorDossierTraits.tsx"
git commit -m "feat(ui): dossier uses TraitBadge (tier color + description tooltip)"
```

---

## Task 4: Reuse on roster and training screens

**Files:**
- Modify: `src/components/stable/RosterWarriorRow.tsx`
- Modify: `src/pages/Training.tsx`

- [ ] **Step 1: Show traits on the roster row**

In `RosterWarriorRow.tsx`, near the existing badges (after the potential-grade badge, ~line 156), render the warrior's traits compactly:

```tsx
{warrior?.traits?.slice(0, 3).map((t) => (
  <TraitBadge key={t} traitId={t} className="text-[8px]" />
))}
```

Import `TraitBadge` from `@/components/warrior/traits/TraitBadge`. (Cap at 3 = the trait cap, so it never overflows the row.)

- [ ] **Step 2: Show the trainer's reachable pool on the training screen**

On the trait-training picker in `Training.tsx` (the UI that calls `handleAssignTraitTraining` from the System 3 plan), render the candidate pool with `TraitBadge` so the player sees what they might gain, e.g.:

```tsx
{traitTrainingPool(warrior, selectedTrainer).map((t) => (
  <TraitBadge key={t.id} traitId={t.id} />
))}
```

Import `traitTrainingPool` from `@/engine/training/trainingGains/traitTraining` (System 3). This makes the risk/reward legible: the player sees the tier spread and class traits the chosen trainer can reach.

- [ ] **Step 3: Typecheck + full suite + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`
Run: `npx vitest run 2>&1 | tail -4` → green.
```bash
git add "src/components/stable/RosterWarriorRow.tsx" "src/pages/Training.tsx"
git commit -m "feat(ui): reuse TraitBadge on roster rows and the trait-training picker"
```

---

## Self-Review Notes

- **Display-only and honest.** Every value comes from `TRAITS` — name, tier, description, class restriction. No fabricated chrome; the tier color is the only adornment and it encodes a real fact (tier). This satisfies the project's UI-honesty conventions.
- **Pure core, thin component.** All mapping/colour logic is in `traitDisplay.ts` and unit-tested; `TraitBadge` is a thin shadcn wrapper with one render test. The `title` attr makes the description testable and accessible without simulating hover.
- **One component, many call sites.** Dossier, roster, and training screen all reuse it — so the ~98 traits become legible everywhere with a single source of truth.
- **Returns null for unknown ids** so callers can `.map` over raw `traits: string[]` without guarding.

## Verification

1. `npx vitest run src/test/components/warrior/` → helper + render tests green.
2. `TraitBadge` shows name + class tag, tooltip carries the description, tier color differs per tier, unknown id renders nothing.
3. Dossier, roster row, and training picker all render traits via `TraitBadge`.
4. `bunx tsc …` → 0; full `npx vitest run` green.
