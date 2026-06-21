# Pre-Fight Advisor (Predicted Edge) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the player a forecast of how a bout is likely to go — the decisive _predicted_ factors (style matchup, skill/attribute edges, readiness/encumbrance) — on the bout-offer card, _before_ they accept, turning the player from passive watcher into informed strategist.

**Architecture:** Add a pure `buildFightForecast(player, opponent?)` that mirrors the existing post-fight `buildFightAnalysis` but uses only pre-fight knowledge (no `exchangeLog`). Reuse the already-exported `AnalysisFactor` type and `getMatchupBonus`. Render the factors in a new `FightForecastPanel` mounted inside `OfferCard`, which already resolves both the player warrior and the (possibly-`null`/"CLASSIFIED") opponent.

**Tech Stack:** TypeScript, React 18, Vitest, Tailwind/shadcn.

**Key existing facts (verified):**

- Post-fight analysis already exists: `buildFightAnalysis` and the exported `AnalysisFactor` type in `src/engine/narrative/fightAnalysis.ts`; `FightAnalysisPanel` in `src/components/bout-viewer/FightAnalysisPanel.tsx`.
- `getMatchupBonus(attStyle, defStyle)` at `src/constants/combat/combat.ts:291`.
- `OfferCard` (`src/pages/BookingOffice/components/OfferCard.tsx`) already computes `playerWarrior` (line 43) and `opponent` (line 46, from `rivalWarriorMap`, `null` when unscouted → renders "CLASSIFIED"). This is the mount point.
- `Warrior` carries `style`, `attributes` (`Attributes`), `baseSkills?` (`BaseSkills`), `equipment` (with `weapon`), and injury/status fields.
- `BoutOffer` has `warriorIds: WarriorId[]` and `arenaId?`.
- `getWeaponPreferredRange` and weapon suitability helpers exist under `src/engine/weaponSuitability.ts` (`grep` for exact export names).

---

## File Structure

- Create: `src/engine/narrative/fightForecast.ts` — pure `buildFightForecast()` + `FightForecast` type. Reuses `AnalysisFactor`.
- Test: `src/test/engine/fightForecast.test.ts`
- Create: `src/components/bout-viewer/FightForecastPanel.tsx` — presentational panel.
- Test: `src/test/components/FightForecastPanel.test.tsx`
- Modify: `src/pages/BookingOffice/components/OfferCard.tsx` — build the forecast and mount the panel.

---

## Task 1: Build the pure `buildFightForecast` function

**Files:**

- Create: `src/engine/narrative/fightForecast.ts`
- Test: `src/test/engine/fightForecast.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/test/engine/fightForecast.test.ts
import { describe, it, expect } from 'vitest';
import { buildFightForecast } from '@/engine/narrative/fightForecast';

const mkWarrior = (over: Partial<any> = {}) => ({
  id: 'w',
  name: 'Test',
  style: 'Lunging Attack',
  attributes: { ST: 15, CN: 12, SZ: 10, WT: 11, WL: 10, SP: 13, DF: 9 },
  baseSkills: { ATT: 12, PAR: 8, DEF: 9, INI: 11, RIP: 6, DEC: 10 },
  equipment: {},
  injuries: [],
  ...over,
});

describe('buildFightForecast', () => {
  it('reports the style matchup edge when the opponent is known', () => {
    const f = buildFightForecast(
      mkWarrior({ name: 'Aulus', style: 'Lunging Attack' }),
      mkWarrior({ name: 'Bran', style: 'Total Parry' })
    );
    expect(f.styleMatchup.styleA).toBe('Lunging Attack');
    expect(f.styleMatchup.styleD).toBe('Total Parry');
    expect(typeof f.styleMatchup.edge).toBe('number');
    expect(f.opponentKnown).toBe(true);
  });

  it('surfaces the biggest skill edge favoring the stronger fighter', () => {
    const f = buildFightForecast(
      mkWarrior({
        name: 'Aulus',
        baseSkills: { ATT: 16, PAR: 8, DEF: 9, INI: 11, RIP: 6, DEC: 10 },
      }),
      mkWarrior({ name: 'Bran', baseSkills: { ATT: 8, PAR: 8, DEF: 9, INI: 11, RIP: 6, DEC: 10 } })
    );
    const attFactor = f.factors.find((x) => x.label.includes('ATT'));
    expect(attFactor).toBeDefined();
    expect(attFactor!.favored).toBe('A');
  });

  it('produces a player-readiness factor even when the opponent is unknown (CLASSIFIED)', () => {
    const f = buildFightForecast(mkWarrior({ name: 'Aulus' }), null);
    expect(f.opponentKnown).toBe(false);
    // No opponent comparison, but still a non-empty, useful factor list about the player.
    expect(f.factors.length).toBeGreaterThan(0);
    // Style matchup edge is unknown without an opponent style.
    expect(f.styleMatchup.styleD).toBeNull();
  });

  it('flags an injured player warrior as a readiness risk', () => {
    const f = buildFightForecast(
      mkWarrior({ name: 'Aulus', injuries: [{ severity: 'Major', weeksRemaining: 2 }] }),
      mkWarrior({ name: 'Bran' })
    );
    const risk = f.factors.find(
      (x) => x.label.toLowerCase().includes('readiness') || x.label.toLowerCase().includes('injur')
    );
    expect(risk).toBeDefined();
    expect(risk!.favored).toBe('D'); // injury favors the opponent
  });

  it('returns factors ranked by weight, capped at 5', () => {
    const f = buildFightForecast(mkWarrior(), mkWarrior({ style: 'Total Parry' }));
    expect(f.factors.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < f.factors.length; i++) {
      expect(f.factors[i - 1]!.weight).toBeGreaterThanOrEqual(f.factors[i]!.weight);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/engine/fightForecast.test.ts`
Expected: FAIL — `Failed to resolve import '@/engine/narrative/fightForecast'`.

- [ ] **Step 3: Implement the builder**

```typescript
// src/engine/narrative/fightForecast.ts
/**
 * Pure pre-fight forecast: predicts the decisive factors of a bout BEFORE it is
 * fought, using only information available pre-fight (styles, stats, readiness).
 * Mirrors buildFightAnalysis but without an exchangeLog. Reuses AnalysisFactor.
 */
import type { AnalysisFactor } from '@/engine/narrative/fightAnalysis';
import { getMatchupBonus } from '@/constants/combat/combat';
import type { FightingStyle, Attributes, BaseSkills } from '@/types/shared.types';

export interface FightForecast {
  opponentKnown: boolean;
  styleMatchup: { styleA: string; styleD: string | null; edge: number };
  factors: AnalysisFactor[];
}

/** Minimal structural view of a warrior the forecast needs. */
export interface ForecastWarrior {
  id: string;
  name: string;
  style: string;
  attributes: Attributes;
  baseSkills?: BaseSkills;
  injuries?: { severity?: string; weeksRemaining?: number }[];
}

const SKILL_KEYS: (keyof BaseSkills)[] = ['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC'];
const ZERO_SKILLS: BaseSkills = { ATT: 0, PAR: 0, DEF: 0, INI: 0, RIP: 0, DEC: 0 };

function biggestSkillGap(a: ForecastWarrior, d: ForecastWarrior) {
  const sa = a.baseSkills ?? ZERO_SKILLS;
  const sd = d.baseSkills ?? ZERO_SKILLS;
  let best = { skill: 'ATT' as string, gap: 0, favored: 'A' as 'A' | 'D' };
  for (const k of SKILL_KEYS) {
    const gap = (sa[k] ?? 0) - (sd[k] ?? 0);
    if (Math.abs(gap) > Math.abs(best.gap)) {
      best = { skill: k, gap: Math.abs(gap), favored: gap >= 0 ? 'A' : 'D' };
    }
  }
  return best;
}

function readinessRisk(w: ForecastWarrior): AnalysisFactor | null {
  const active = (w.injuries ?? []).filter((i) => (i.weeksRemaining ?? 0) > 0);
  if (active.length === 0) return null;
  const worst = active.some((i) => i.severity === 'Major' || i.severity === 'Severe');
  return {
    label: 'Readiness',
    detail: `${w.name} carries ${active.length} active injur${active.length === 1 ? 'y' : 'ies'}${worst ? ' (serious)' : ''} into this bout.`,
    favored: 'D',
    weight: worst ? 0.7 : 0.4,
  };
}

export function buildFightForecast(
  player: ForecastWarrior,
  opponent: ForecastWarrior | null
): FightForecast {
  const factors: AnalysisFactor[] = [];

  const edge = opponent
    ? getMatchupBonus(player.style as FightingStyle, opponent.style as FightingStyle)
    : 0;

  if (opponent && edge !== 0) {
    factors.push({
      label: 'Style matchup',
      detail: `${player.style} vs ${opponent.style} favors ${edge > 0 ? player.name : opponent.name} (${edge > 0 ? '+' : ''}${edge}).`,
      favored: edge > 0 ? 'A' : 'D',
      weight: Math.min(1, Math.abs(edge) / 4),
    });
  }

  if (opponent) {
    const gap = biggestSkillGap(player, opponent);
    if (gap.gap >= 3) {
      const who = gap.favored === 'A' ? player.name : opponent.name;
      factors.push({
        label: `${gap.skill} edge`,
        detail: `${who} projects a ${gap.gap}-point ${gap.skill} advantage.`,
        favored: gap.favored,
        weight: Math.min(1, gap.gap / 8),
      });
    }
  }

  const risk = readinessRisk(player);
  if (risk) factors.push(risk);

  if (factors.length === 0) {
    factors.push({
      label: opponent ? 'Even fight' : 'Unknown opponent',
      detail: opponent
        ? `No decisive pre-fight edge — expect a close bout against ${opponent.name}.`
        : `Opponent details are CLASSIFIED. Scout them to forecast the matchup; ${player.name} appears fit to fight.`,
      favored: null,
      weight: 0.1,
    });
  }

  factors.sort((x, y) => y.weight - x.weight);

  return {
    opponentKnown: opponent != null,
    styleMatchup: { styleA: player.style, styleD: opponent?.style ?? null, edge },
    factors: factors.slice(0, 5),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/engine/fightForecast.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/narrative/fightForecast.ts src/test/engine/fightForecast.test.ts
git commit -m "feat(forecast): add pure buildFightForecast builder"
```

---

## Task 2: Build the `FightForecastPanel` component

**Files:**

- Create: `src/components/bout-viewer/FightForecastPanel.tsx`
- Test: `src/test/components/FightForecastPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/test/components/FightForecastPanel.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FightForecastPanel } from '@/components/bout-viewer/FightForecastPanel';
import type { FightForecast } from '@/engine/narrative/fightForecast';

const known: FightForecast = {
  opponentKnown: true,
  styleMatchup: { styleA: 'Lunging Attack', styleD: 'Total Parry', edge: 2 },
  factors: [
    { label: 'Style matchup', detail: 'LA vs TP favors Aulus (+2).', favored: 'A', weight: 0.5 },
    { label: 'ATT edge', detail: 'Aulus projects a 4-point ATT advantage.', favored: 'A', weight: 0.5 },
  ],
};

const classified: FightForecast = {
  opponentKnown: false,
  styleMatchup: { styleA: 'Lunging Attack', styleD: null, edge: 0 },
  factors: [{ label: 'Unknown opponent', detail: 'Opponent details are CLASSIFIED.', favored: null, weight: 0.1 }],
};

describe('FightForecastPanel', () => {
  it('renders each forecast factor', () => {
    render(<FightForecastPanel forecast={known} nameA="Aulus" nameD="Bran" />);
    expect(screen.getByText('Style matchup')).toBeInTheDocument();
    expect(screen.getByText(/4-point ATT advantage/)).toBeInTheDocument();
  });

  it('shows a scout prompt when the opponent is classified', () => {
    render(<FightForecastPanel forecast={classified} nameA="Aulus" nameD="?" />);
    expect(screen.getByText(/CLASSIFIED/)).toBeInTheDocument();
  });

  it('renders nothing when forecast is undefined', () => {
    const { container } = render(<FightForecastPanel forecast={undefined} nameA="Aulus" nameD="Bran" />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/components/FightForecastPanel.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

```tsx
// src/components/bout-viewer/FightForecastPanel.tsx
/**
 * Pre-fight "predicted edge" panel. Presentational — renders the ranked
 * factors from a FightForecast. Mirrors FightAnalysisPanel in style.
 */
import type { FightForecast } from '@/engine/narrative/fightForecast';

interface FightForecastPanelProps {
  forecast?: FightForecast;
  nameA: string;
  nameD: string;
}

function favoredName(favored: 'A' | 'D' | null, nameA: string, nameD: string): string | null {
  if (favored === 'A') return nameA;
  if (favored === 'D') return nameD;
  return null;
}

export function FightForecastPanel({ forecast, nameA, nameD }: FightForecastPanelProps) {
  if (!forecast) return null;

  return (
    <div className="mt-2 rounded-none border border-white/10 bg-black/40 p-3 space-y-2">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-arena-gold">
        Predicted Edge
      </h4>
      <ul className="space-y-1.5">
        {forecast.factors.map((f, i) => {
          const who = favoredName(f.favored, nameA, nameD);
          return (
            <li key={i} className="flex gap-2 items-start text-xs">
              <span className="min-w-[6.5rem] font-bold uppercase text-[10px] text-muted-foreground">
                {f.label}
              </span>
              <span className="text-foreground/90">
                {f.detail}
                {who ? <span className="ml-1 text-[10px] text-arena-gold">→ {who}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

> Engineer note: match the surrounding `OfferCard` visual idiom (it uses `bg-black/40`, `border-white/10`, uppercase micro-labels, `arena-gold`/`arena-blood` accents). Adjust classes to fit if the card uses a shared `Surface`/`Card`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/components/FightForecastPanel.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/bout-viewer/FightForecastPanel.tsx src/test/components/FightForecastPanel.test.tsx
git commit -m "feat(forecast): add FightForecastPanel component"
```

---

## Task 3: Mount the forecast in `OfferCard`

**Files:**

- Modify: `src/pages/BookingOffice/components/OfferCard.tsx`

> Engineer note: `OfferCard` already computes `playerWarrior` (line ~43) and `opponent` (line ~46, may be `null`). Build the forecast from those and render the panel near the opponent block (around line ~142 where `opponent?.name || 'CLASSIFIED'` renders).

- [ ] **Step 1: Import the builder and panel**

At the top of `src/pages/BookingOffice/components/OfferCard.tsx`:

```tsx
import { buildFightForecast } from '@/engine/narrative/fightForecast';
import { FightForecastPanel } from '@/components/bout-viewer/FightForecastPanel';
```

- [ ] **Step 2: Compute the forecast**

After `playerWarrior` and `opponent` are resolved, add:

```tsx
const forecast = playerWarrior ? buildFightForecast(playerWarrior, opponent ?? null) : undefined;
```

> `playerWarrior`/`opponent` are full `Warrior` objects; `ForecastWarrior` is a structural subset, so they pass directly with no cast (same pattern as `buildFightAnalysis`).

- [ ] **Step 3: Render the panel**

Inside the offer card body, below the opponent name/stable block, add:

```tsx
<FightForecastPanel
  forecast={forecast}
  nameA={playerWarrior?.name ?? 'Your fighter'}
  nameD={opponent?.name ?? 'Opponent'}
/>
```

- [ ] **Step 4: Type-check**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep "OfferCard" || echo "OfferCard clean"`
Expected: `OfferCard clean`.

- [ ] **Step 5: Manual smoke test**

Run: `bun run dev`, open the booking office (`/stable/bouts`). Each offer card shows a "Predicted Edge" block: a real matchup forecast when the opponent is known, and a scout prompt when the opponent is "CLASSIFIED".

- [ ] **Step 6: Commit**

```bash
git add src/pages/BookingOffice/components/OfferCard.tsx
git commit -m "feat(forecast): show predicted edge on bout offer cards"
```

---

## Self-Review Notes (for the implementer)

- **DRY with post-fight analysis:** the forecast reuses `AnalysisFactor` and the same factor-ranking idea. Do NOT duplicate `getMatchupBonus` logic — import it.
- **Fog of war is respected:** when `opponent` is `null` (unscouted → "CLASSIFIED"), the forecast shows only player-readiness and a scout prompt. This is intentional — it makes scouting valuable rather than giving away hidden info. If product later wants style-only (no exact stats) for partially-scouted opponents, extend `buildFightForecast` to accept a `revealLevel` — out of scope here.
- **No engine/runtime change:** this is pure additive UI + a pure function. It cannot affect simulation outcomes.

## Verification (done by reviewer after implementation)

1. `npx vitest run src/test/engine/fightForecast.test.ts src/test/components/FightForecastPanel.test.tsx` — pass.
2. `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -E "fightForecast|FightForecastPanel|OfferCard"` — no errors.
3. Manual: a known-opponent offer shows a real predicted edge; a CLASSIFIED offer shows the scout prompt; the panel disappears for offers with no player warrior resolved.
4. Confirm no new `as any` / `as unknown as` casts were introduced and `getMatchupBonus` is reused (not reimplemented).
