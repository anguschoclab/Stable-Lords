# Warrior Contract Transfer Market Implementation Plan (F1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the player **sell a warrior's contract to a rival stable** — rivals bid based on their existing personality policy and the warrior's liability/traits — giving the player an economic lever (the measured bankruptcy death-spiral bleeds ~−238/week with no comeback tool) and making the churn/trait economy player-facing.

**Architecture:** A pure engine module computes per-rival bids by reusing two systems that already exist: `computeWarriorLiability` (`src/engine/warriorValue.ts`) scores the warrior, and `TRAIT_POLICY` (`src/engine/ai/traitPolicy.ts`) gives each personality a bidding temperament (Aggressive/Showman overpay for Signature carriers; Pragmatic lowballs; nobody buys a `Release`-grade washout). A store action executes the transfer: warrior moves from `state.roster` into the buyer's `rival.roster`, treasuries move in both directions, ledger entry recorded. A small dialog surfaces the top bids from the roster row.

**Tech Stack:** TypeScript, React 18, Zustand store (`set((state) => …)` partial-return pattern), Tailwind + shadcn/ui, Bun (`bun`/`bunx` — never npm/node), Vitest + Testing Library.

**Scope:** Selling only (player → rival). **Non-goals:** buying rival warriors, rival-to-rival trades, negotiation/counter-offers, and any combat-math change (`balance.test.ts` stays green). Rivals' own roster caps are respected (no bid from a full stable).

**Grounded facts (do not re-derive):**
- `computeWarriorLiability(warrior): { score: 0–100, factors, recommendation: 'Keep'|'Monitor'|'Release' }` — `src/engine/warriorValue.ts`. Positive-trait value tiers inside it: Common 6 / Notable 10 / Exceptional 16 / Signature 24.
- `TRAIT_POLICY: Record<OwnerPersonality, { cutLiabilityThreshold, trainAppetite, ceiling }>` and `policyFor(personality?)` — `src/engine/ai/traitPolicy.ts`. Personalities: `Aggressive | Methodical | Showman | Pragmatic | Tactician`.
- `TRAITS[id]` exposes `tier` and `styles` — `src/engine/traits.ts`.
- The roster store actions live in `src/state/slices/rosterSlice/actions.ts` using zustand's partial-return pattern; `releaseWarrior` (line ~61) is the reference: `set((state) => { const warrior = state.roster.find(…); …; return { roster: state.roster.filter(…), retired: […] }; })`. The slice interface is `src/state/slices/rosterSlice/types.ts`.
- `state.rivals: RivalStableData[]` with `roster: Warrior[]`, `treasury: number`, `owner.personality`, `owner.stableName` — accessible in the same store state.
- `Warrior.stableId` marks ownership; rival warriors carry their stable's id.
- Roster row UI: `src/components/stable/RosterWarriorRow.tsx` (already renders `TraitBadge`s and a liability badge).

---

## File Structure

- **Create** `src/engine/market/contractMarket.ts` — pure bid computation.
- **Create** `src/test/engine/market/contractMarket.test.ts` — bid tests.
- **Modify** `src/state/slices/rosterSlice/types.ts` — `sellWarriorContract` signature.
- **Modify** `src/state/slices/rosterSlice/actions.ts` — the transfer action.
- **Create** `src/test/state/sellWarriorContract.test.ts` — store action test.
- **Create** `src/components/stable/SellContractDialog.tsx` — bid list + confirm.
- **Modify** `src/components/stable/RosterWarriorRow.tsx` — "Sell contract" entry point.

---

## Task 1: Pure bid computation (TDD)

**Files:**
- Create: `src/engine/market/contractMarket.ts`
- Create: `src/test/engine/market/contractMarket.test.ts`

- [ ] **Step 1: Write the failing test**

`src/test/engine/market/contractMarket.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeContractBid, collectContractBids } from '@/engine/market/contractMarket';
import type { Warrior } from '@/types/warrior.types';
import type { RivalStableData } from '@/types/state.types';

const warrior = (over: Partial<Warrior> = {}): Warrior =>
  ({
    id: 'w1', name: 'Vex', fame: 40,
    career: { wins: 10, losses: 4, kills: 2 },
    traits: ['quick'], status: 'Active', age: 24,
    attributes: { WT: 12, WL: 12, ST: 12, SP: 12, DF: 12, AG: 12 },
  }) as unknown as Warrior;

const rival = (personality: string, over: Partial<RivalStableData> = {}): RivalStableData =>
  ({
    id: `s_${personality}`,
    owner: { id: `s_${personality}`, name: 'Owner', stableName: `${personality} Hall`,
             fame: 0, renown: 0, titles: 0, personality },
    fame: 0, treasury: 5000, roster: new Array(6).fill(null).map((_, i) => ({ id: `r${i}` })),
    ledger: [], trainingAssignments: [],
    ...over,
  }) as unknown as RivalStableData;

describe('computeContractBid', () => {
  it('bids a positive price for a solid warrior', () => {
    const bid = computeContractBid(warrior(), rival('Pragmatic'));
    expect(bid).not.toBeNull();
    expect(bid!.price).toBeGreaterThan(0);
  });

  it('refuses to bid on a Release-grade washout', () => {
    // 2 flaws + losing record → liability recommendation Release → no buyer.
    const washout = warrior({ traits: ['fragile', 'slow'], fame: 2,
                              career: { wins: 1, losses: 9, kills: 0 } });
    expect(computeContractBid(washout, rival('Aggressive'))).toBeNull();
  });

  it('Signature carriers fetch more from Aggressive/Showman than Pragmatic', () => {
    const star = warrior({ traits: ['living_wall'], fame: 60 }); // Signature class trait
    const showmanBid = computeContractBid(star, rival('Showman'))!.price;
    const pragmaticBid = computeContractBid(star, rival('Pragmatic'))!.price;
    expect(showmanBid).toBeGreaterThan(pragmaticBid);
  });

  it('refuses when the rival cannot afford the bid or the roster is full', () => {
    expect(computeContractBid(warrior(), rival('Showman', { treasury: 10 }))).toBeNull();
    const full = rival('Showman');
    (full as { roster: unknown[] }).roster = new Array(12).fill({ id: 'x' });
    expect(computeContractBid(warrior(), full)).toBeNull();
  });
});

describe('collectContractBids', () => {
  it('returns bids sorted highest first', () => {
    const rivals = [rival('Pragmatic'), rival('Showman'), rival('Methodical')];
    const bids = collectContractBids(warrior({ traits: ['living_wall'] }), rivals);
    expect(bids.length).toBeGreaterThan(0);
    for (let i = 1; i < bids.length; i++) {
      expect(bids[i - 1]!.price).toBeGreaterThanOrEqual(bids[i]!.price);
    }
  });
});
```

- [ ] **Step 2: Run — expect FAIL.** `npx vitest run src/test/engine/market/contractMarket.test.ts` → module not found.

- [ ] **Step 3: Implement**

`src/engine/market/contractMarket.ts`:

```typescript
import type { Warrior } from '@/types/warrior.types';
import type { RivalStableData } from '@/types/state.types';
import { computeWarriorLiability } from '@/engine/warriorValue';
import { TRAITS, type TraitTier } from '@/engine/traits';

export interface ContractBid {
  stableId: string;
  stableName: string;
  personality: string;
  price: number;
  /** Human-readable one-liner the dialog can show ("covets the Signature"). */
  rationale: string;
}

/** Max warriors a rival will roster before declining to buy. Knob. */
export const BUYER_ROSTER_CAP = 11;

const TRAIT_MARKET_VALUE: Record<TraitTier, number> = {
  Common: 40, Notable: 80, Exceptional: 160, Signature: 320, Flaw: 0,
};

/** Personality temperament multipliers on the base valuation. */
const PERSONALITY_MULT: Record<string, number> = {
  Aggressive: 1.15, Showman: 1.2, Tactician: 1.0, Methodical: 0.95, Pragmatic: 0.8,
};

function baseValuation(w: Warrior): number {
  const c = w.career ?? { wins: 0, losses: 0, kills: 0 };
  const traitValue = (w.traits ?? [])
    .map((id) => TRAITS[id])
    .reduce((s, t) => s + (t && t.sign === 'positive' ? TRAIT_MARKET_VALUE[t.tier] : 0), 0);
  return 200 + (w.fame ?? 0) * 4 + (c.wins ?? 0) * 30 + traitValue;
}

/**
 * A rival's bid for a player warrior's contract, or null if they won't buy.
 * Reuses the liability scorer (nobody buys a Release-grade washout; liability
 * discounts the price) and the personality policy for temperament.
 */
export function computeContractBid(w: Warrior, rival: RivalStableData): ContractBid | null {
  const liability = computeWarriorLiability(w);
  if (liability.recommendation === 'Release') return null; // damaged goods
  if ((rival.roster?.length ?? 0) > BUYER_ROSTER_CAP) return null; // no room

  const personality = rival.owner?.personality ?? 'Pragmatic';
  let price = baseValuation(w) * (PERSONALITY_MULT[personality] ?? 1.0);

  // Aggressive/Showman chase marquee talent: extra premium for Signature/class traits.
  const hasMarquee = (w.traits ?? []).some((id) => {
    const t = TRAITS[id];
    return t && (t.tier === 'Signature' || (t.styles?.length ?? 0) > 0);
  });
  const covets = hasMarquee && (personality === 'Aggressive' || personality === 'Showman');
  if (covets) price *= 1.25;

  // Liability discounts the price even below the Release cutoff.
  price *= Math.max(0.4, 1 - liability.score / 150);
  price = Math.round(price);

  if ((rival.treasury ?? 0) < price) return null; // can't afford it

  return {
    stableId: rival.id,
    stableName: rival.owner?.stableName ?? 'Unknown Stable',
    personality,
    price,
    rationale: covets
      ? 'covets the marquee talent'
      : liability.recommendation === 'Monitor'
        ? 'sees a discounted fixer-upper'
        : 'makes a fair-market offer',
  };
}

/** All willing buyers, best offer first. */
export function collectContractBids(w: Warrior, rivals: RivalStableData[]): ContractBid[] {
  return rivals
    .map((r) => computeContractBid(w, r))
    .filter((b): b is ContractBid => b !== null)
    .sort((a, b) => b.price - a.price);
}
```

- [ ] **Step 4: Run + typecheck.** Test → PASS (tune `TRAIT_MARKET_VALUE`/multipliers if an ordering case is off — they are knobs; the *ordering* assertions are the contract). `bunx tsc … | grep -c "error TS"` → `0`.

- [ ] **Step 5: Commit**

```bash
git add "src/engine/market/contractMarket.ts" "src/test/engine/market/contractMarket.test.ts"
git commit -m "feat(market): personality-driven contract bids from liability + trait value"
```

---

## Task 2: The `sellWarriorContract` store action (TDD)

**Files:**
- Modify: `src/state/slices/rosterSlice/types.ts`
- Modify: `src/state/slices/rosterSlice/actions.ts`
- Create: `src/test/state/sellWarriorContract.test.ts`

- [ ] **Step 1: Write the failing test**

`src/test/state/sellWarriorContract.test.ts` — locate an existing rosterSlice store test (grep `src/test/state` for `releaseWarrior` or `retireWarrior` usage) and copy its store-bootstrapping pattern (how it creates/initializes the test store). Then:

```typescript
// Bootstrapping: mirror the existing rosterSlice action tests' store setup.
// The assertions below are the contract:

it('moves the warrior to the buyer and moves money both ways', () => {
  // Arrange: store with 1 player warrior (id 'w1'), 1 rival ('s1', treasury 5000),
  // player treasury 100.
  store.getState().sellWarriorContract('w1', 's1', 800);

  const s = store.getState();
  expect(s.roster.find((w) => w.id === 'w1')).toBeUndefined(); // gone from player
  const buyer = s.rivals.find((r) => r.id === 's1')!;
  const sold = buyer.roster.find((w) => w.id === 'w1');
  expect(sold).toBeDefined(); // joined the buyer
  expect(sold!.stableId).toBe('s1'); // ownership re-stamped
  expect(s.treasury).toBe(900); // 100 + 800
  expect(buyer.treasury).toBe(4200); // 5000 - 800
});

it('is a no-op for an unknown warrior or rival', () => {
  const before = store.getState();
  store.getState().sellWarriorContract('nope', 's1', 800);
  expect(store.getState().roster.length).toBe(before.roster.length);
});
```

- [ ] **Step 2: Run — expect FAIL.** `npx vitest run src/test/state/sellWarriorContract.test.ts` → action not a function.

- [ ] **Step 3: Add the signature**

`src/state/slices/rosterSlice/types.ts`, in the `RosterSlice` interface:

```typescript
  /** Sell a warrior's contract to a rival stable at an agreed price. */
  sellWarriorContract: (warriorId: WarriorId, buyerStableId: string, price: number) => void;
```

- [ ] **Step 4: Implement the action**

In `src/state/slices/rosterSlice/actions.ts`, after `releaseWarrior`, following the same `set((state) => …)` partial-return pattern:

```typescript
    sellWarriorContract: (warriorId: WarriorId, buyerStableId: string, price: number) => {
      set((state) => {
        const warrior = state.roster.find((w: Warrior) => w.id === warriorId);
        const buyer = state.rivals.find((r) => r.id === buyerStableId);
        if (!warrior || !buyer) return state;

        const transferred: Warrior = { ...warrior, stableId: buyerStableId };

        return {
          roster: state.roster.filter((w: Warrior) => w.id !== warriorId),
          treasury: state.treasury + price,
          rivals: state.rivals.map((r) =>
            r.id === buyerStableId
              ? { ...r, roster: [...r.roster, transferred], treasury: r.treasury - price }
              : r
          ),
          ledger: [
            ...(state.ledger ?? []),
            {
              week: state.week,
              amount: price,
              description: `Sold ${warrior.name}'s contract to ${buyer.owner?.stableName ?? 'a rival'}`,
              category: 'Income',
            },
          ],
        };
      });
    },
```

> Read the file's actual `LedgerEntry` shape before committing (grep `ledger: [` in `actions.ts` for an existing entry-push, e.g. in a hire/purchase action) and match its exact fields — the entry above is the intent, not necessarily the exact field names. If no action currently writes the ledger from this slice, drop the ledger key and add a `// TODO(ledger)`-free follow-up note in the commit body instead of guessing a shape.

- [ ] **Step 5: Run + typecheck + commit**

Run: `npx vitest run src/test/state/sellWarriorContract.test.ts` → PASS; `bunx tsc … | grep -c "error TS"` → `0`.

```bash
git add "src/state/slices/rosterSlice/types.ts" "src/state/slices/rosterSlice/actions.ts" "src/test/state/sellWarriorContract.test.ts"
git commit -m "feat(market): sellWarriorContract store action — transfer warrior + treasuries"
```

---

## Task 3: The sell dialog + roster entry point

**Files:**
- Create: `src/components/stable/SellContractDialog.tsx`
- Modify: `src/components/stable/RosterWarriorRow.tsx`

UI, not TDD — keep it honest (every number shown is a real bid from `collectContractBids`).

- [ ] **Step 1: The dialog**

`src/components/stable/SellContractDialog.tsx`:

```tsx
import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { collectContractBids } from '@/engine/market/contractMarket';
import { useGameStore } from '@/state/gameStore';
import type { Warrior } from '@/types/warrior.types';

interface SellContractDialogProps {
  warrior: Warrior;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Lists real bids from rival stables; confirming executes the transfer. */
export function SellContractDialog({ warrior, open, onOpenChange }: SellContractDialogProps) {
  const rivals = useGameStore((s) => s.rivals);
  const sellWarriorContract = useGameStore((s) => s.sellWarriorContract);
  const bids = useMemo(() => collectContractBids(warrior, rivals).slice(0, 3), [warrior, rivals]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sell {warrior.name}&apos;s contract</DialogTitle>
        </DialogHeader>
        {bids.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No stable will buy this contract right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {bids.map((b) => (
              <li key={b.stableId} className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{b.stableName}</p>
                  <p className="text-xs text-muted-foreground">{b.rationale}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    sellWarriorContract(warrior.id, b.stableId, b.price);
                    onOpenChange(false);
                  }}
                >
                  Sell for {b.price}g
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

> Verify the store import path/name: grep for how `RosterWarriorRow.tsx` (or any component) reads the store (`useGameStore` vs another hook name) and match it. Same for the `Dialog` primitives — confirm `src/components/ui/dialog.tsx` exports these names (standard shadcn does).

- [ ] **Step 2: Entry point on the roster row**

In `RosterWarriorRow.tsx`, add local state and a trigger near the existing action buttons (match the row's existing button styling):

```tsx
const [sellOpen, setSellOpen] = useState(false);
// …alongside the row's existing action controls:
<Button variant="ghost" size="sm" onClick={() => setSellOpen(true)}>
  Sell contract
</Button>
<SellContractDialog warrior={warrior} open={sellOpen} onOpenChange={setSellOpen} />
```

Import `useState`, `SellContractDialog`, and (if not present) `Button`. If the row has a dropdown/context-menu of actions instead of inline buttons, put "Sell contract" there — follow the file's existing pattern.

- [ ] **Step 3: Typecheck + existing component tests + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`
Run: `npx vitest run src/test/components 2>&1 | tail -4` → green (no roster-row test regressed).

```bash
git add "src/components/stable/SellContractDialog.tsx" "src/components/stable/RosterWarriorRow.tsx"
git commit -m "feat(market): sell-contract dialog with top rival bids on the roster row"
```

---

## Task 4: Full-suite verification

**Files:** none (verification only)

- [ ] **Step 1:** `npx vitest run src/test/engine/economy/balance.test.ts` → green (no combat math touched).
- [ ] **Step 2:** `npx vitest run 2>&1 | tail -4` → all green (suite fully green as of 2026-07-16); `bunx tsc …` → `0`.
- [ ] **Step 3:** `git add -A && git commit -m "test: verify suite green after contract market" || echo "nothing to commit"`

---

## Self-Review Notes

- **Both AI halves were free.** Valuation reuses `computeWarriorLiability`; temperament reuses the personality policy. The feature is mostly plumbing, which is why it's the highest value-per-effort item.
- **The market is honest.** Washouts (`Release`) find no buyer — you cannot dump your 2-flaw liability for gold; that preserves the churn system's teeth. Liability still discounts sub-Release warriors.
- **No new economy loop-holes.** Buyer treasury is debited and roster-capped, so the player can't farm infinite gold selling to one rich rival.
- **Knobs are named** (`TRAIT_MARKET_VALUE`, `PERSONALITY_MULT`, `BUYER_ROSTER_CAP`) and the tests pin *orderings* (Showman > Pragmatic for stars), not exact prices, so tuning won't churn tests.

## Verification

1. `contractMarket.test.ts` → bids positive, washouts refused, Showman > Pragmatic for marquee talent, sorted.
2. `sellWarriorContract.test.ts` → warrior transfers, treasuries move both ways, no-op on bad ids.
3. Dialog shows real bids; selling updates roster + treasury visibly.
4. `balance.test.ts` green; full suite green; typecheck 0.
