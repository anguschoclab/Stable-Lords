# Post-Fight "Why Did This Happen" Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn each bout's already-computed-but-discarded structured combat data into a player-facing panel that explains the 3–5 factors that actually decided the fight.

**Architecture:** Add a pure builder (`buildFightAnalysis`) that consumes the existing `FightOutcome` (`exchangeLog` + `post`) plus both warriors and produces a compact `FightAnalysis` object. Persist that object on `FightSummary` so it survives into `arenaHistory`, and render it via a new `FightAnalysisPanel` shown both in the live resolution reveal and the historical bout viewer.

**Tech Stack:** TypeScript, React 18, Vitest, Zod (state schema), TanStack Router, Tailwind/shadcn UI.

**Key existing facts (verified):**

- `FightOutcome` (`src/types/combat.types.ts:198`) already carries `exchangeLog?: ExchangeLogEntry[]` and `post?` (xp, hits, kill flags, `causeBucket`, `fatalExchangeIndex`).
- `ExchangeLogEntry` (`src/types/combat.types.ts:158`) carries `iniWinner`, `attResult`, `damage`, `killWindow`, `executionFlag`, `reasonCodes`, `momentumShift`, `endDeltas`.
- `getMatchupBonus(attStyle, defStyle)` exists at `src/constants/combat/combat.ts:291`.
- `BoutResult.outcome` (`src/engine/bout/services/boutProcessorService.ts:35`) holds the full `FightOutcome` at resolution time.
- `FightSummary` (stored in `arenaHistory`) does NOT currently include `exchangeLog` — so the analysis must be summarized onto `FightSummary` to be visible on historical fights.
- `BoutViewer` (`src/components/BoutViewer.tsx`) currently receives `log: MinuteEvent[]` but NOT `exchangeLog`.

---

## File Structure

- Create: `src/engine/narrative/fightAnalysis.ts` — pure `buildFightAnalysis()` builder + `FightAnalysis` type.
- Test: `src/test/engine/fightAnalysis.test.ts`
- Modify: `src/types/combat.types.ts` — add `analysis?: FightAnalysis` to `FightSummary`.
- Modify: `src/engine/core/fightSummaryFactory.ts` — populate `analysis` when building a `FightSummary` from a `BoutResult`.
- Modify: `src/schemas/gameStateSchema.ts` — extend the `FightSummary` zod schema with the optional `analysis` field.
- Create: `src/components/bout-viewer/FightAnalysisPanel.tsx` — presentational panel.
- Test: `src/test/components/FightAnalysisPanel.test.tsx`
- Modify: `src/components/BoutViewer.tsx` — accept and render `analysis`.
- Modify: `src/components/bout-viewer/BoutResolution.tsx` — mount the panel.
- Modify whichever parent passes props to `BoutViewer` in the live reveal path (`src/components/ResolutionReveal.tsx` / `src/components/resolution-reveal/BoutsStep.tsx`) and the historical path (`src/routes/warrior/$id.tsx`) — thread `analysis` through.

---

## Task 1: Define `FightAnalysis` type and the pure builder

**Files:**

- Create: `src/engine/narrative/fightAnalysis.ts`
- Test: `src/test/engine/fightAnalysis.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/test/engine/fightAnalysis.test.ts
import { describe, it, expect } from 'vitest';
import { buildFightAnalysis } from '@/engine/narrative/fightAnalysis';
import type { FightOutcome } from '@/types/combat.types';

const baseWarrior = (over: Partial<any> = {}) => ({
  id: 'w1',
  name: 'Test',
  style: 'Lunging Attack',
  attributes: { ST: 15, CN: 12, SZ: 10, WT: 11, WL: 10, SP: 13, DF: 9 },
  skills: { ATT: 12, PAR: 8, DEF: 9, INI: 11, RIP: 6, DEC: 10 },
  ...over,
});

const outcome = (over: Partial<FightOutcome> = {}): FightOutcome => ({
  winner: 'A',
  by: 'Kill',
  minutes: 7,
  log: [],
  exchangeLog: [
    {
      exchangeIndex: 0,
      minute: 1,
      iniWinner: 'A',
      attResult: 'hit',
      damage: 4,
      endDeltas: { a: -3, d: -5 },
    },
    {
      exchangeIndex: 1,
      minute: 2,
      iniWinner: 'A',
      attResult: 'hit',
      damage: 6,
      endDeltas: { a: -3, d: -6 },
    },
    {
      exchangeIndex: 2,
      minute: 3,
      iniWinner: 'A',
      attResult: 'crit',
      damage: 12,
      killWindow: true,
      executionFlag: true,
      reasonCodes: ['AI_PUSH_FATIGUE'],
    },
  ],
  post: {
    xpA: 10,
    xpD: 2,
    hitsA: 3,
    hitsD: 0,
    gotKillA: true,
    causeBucket: 'trauma',
    fatalExchangeIndex: 2,
  },
  ...over,
});

describe('buildFightAnalysis', () => {
  it('identifies the decisive exchange from the fatal exchange index', () => {
    const a = buildFightAnalysis(
      outcome(),
      baseWarrior({ id: 'A' }),
      baseWarrior({ id: 'D', style: 'Total Parry' })
    );
    expect(a.decisiveExchange.index).toBe(2);
    expect(a.decisiveExchange.reasonCodes).toContain('AI_PUSH_FATIGUE');
  });

  it('reports the style matchup edge in favor of the winner', () => {
    const a = buildFightAnalysis(
      outcome(),
      baseWarrior({ id: 'A', style: 'Lunging Attack' }),
      baseWarrior({ id: 'D', style: 'Total Parry' })
    );
    expect(a.styleMatchup.styleA).toBe('Lunging Attack');
    expect(a.styleMatchup.styleD).toBe('Total Parry');
    expect(typeof a.styleMatchup.edge).toBe('number');
  });

  it('summarizes hits and aggregate damage per side', () => {
    const a = buildFightAnalysis(outcome(), baseWarrior({ id: 'A' }), baseWarrior({ id: 'D' }));
    expect(a.tale.hitsA).toBe(3);
    expect(a.tale.damageA).toBe(22);
    expect(a.tale.damageD).toBe(0);
  });

  it('detects the endurance crossover exchange when one side fatigues first', () => {
    const a = buildFightAnalysis(outcome(), baseWarrior({ id: 'A' }), baseWarrior({ id: 'D' }));
    // D loses endurance faster; crossover should be a non-null exchange index or null
    expect(a.fatigue.fatiguedSide === 'D' || a.fatigue.fatiguedSide === null).toBe(true);
  });

  it('returns a graceful empty-ish analysis when exchangeLog is absent', () => {
    const a = buildFightAnalysis(
      outcome({ exchangeLog: undefined }),
      baseWarrior({ id: 'A' }),
      baseWarrior({ id: 'D' })
    );
    expect(a.decisiveExchange.index).toBeNull();
    expect(a.factors.length).toBeGreaterThan(0); // still produces matchup + outcome factors
  });

  it('produces a ranked, human-readable factors list (3-5 items)', () => {
    const a = buildFightAnalysis(
      outcome(),
      baseWarrior({ id: 'A' }),
      baseWarrior({ id: 'D', style: 'Total Parry' })
    );
    expect(a.factors.length).toBeGreaterThanOrEqual(3);
    expect(a.factors.length).toBeLessThanOrEqual(5);
    a.factors.forEach((f) => {
      expect(typeof f.label).toBe('string');
      expect(typeof f.detail).toBe('string');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/engine/fightAnalysis.test.ts`
Expected: FAIL with "Failed to resolve import '@/engine/narrative/fightAnalysis'".

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/engine/narrative/fightAnalysis.ts
/**
 * Pure builder that distills a resolved FightOutcome into the handful of
 * factors that actually decided the bout. Consumed by FightAnalysisPanel and
 * persisted onto FightSummary so historical fights can explain themselves.
 */
import type { FightOutcome, ExchangeLogEntry } from '@/types/combat.types';
import { getMatchupBonus } from '@/constants/combat/combat';
import type { FightingStyle } from '@/types/shared.types';

/** A single ranked, human-readable reason the fight went the way it did. */
export interface AnalysisFactor {
  /** Short label, e.g. "Style matchup". */
  label: string;
  /** One-sentence plain-English explanation. */
  detail: string;
  /** 'A' | 'D' | null — who this factor favored. */
  favored: 'A' | 'D' | null;
  /** Relative weight 0..1 used only for ordering. */
  weight: number;
}

export interface FightAnalysis {
  styleMatchup: { styleA: string; styleD: string; edge: number };
  decisiveExchange: {
    index: number | null;
    minute: number | null;
    reasonCodes: string[];
    summary: string;
  };
  fatigue: { fatiguedSide: 'A' | 'D' | null; crossoverExchange: number | null };
  tale: {
    hitsA: number;
    hitsD: number;
    damageA: number;
    damageD: number;
    ripostesA: number;
    ripostesD: number;
  };
  factors: AnalysisFactor[];
}

interface AnalysisWarrior {
  id: string;
  name: string;
  style: string;
  attributes: Record<string, number>;
  skills: Record<string, number>;
}

function summarizeTale(log: ExchangeLogEntry[]) {
  let hitsA = 0;
  let hitsD = 0;
  let damageA = 0;
  let damageD = 0;
  let ripostesA = 0;
  let ripostesD = 0;
  for (const e of log) {
    const dmg = e.damage ?? 0;
    const hit = e.attResult === 'hit' || e.attResult === 'crit';
    // attacker side per exchange is whoever won initiative when recorded; fall back to iniWinner
    const side = e.iniWinner ?? 'A';
    if (hit) {
      if (side === 'A') {
        hitsA += 1;
        damageA += dmg;
      } else {
        hitsD += 1;
        damageD += dmg;
      }
    }
    if (e.ripResult === 'hit') {
      if (side === 'A') ripostesD += 1;
      else ripostesA += 1;
    }
  }
  return { hitsA, hitsD, damageA, damageD, ripostesA, ripostesD };
}

function findFatigueCrossover(log: ExchangeLogEntry[]): {
  fatiguedSide: 'A' | 'D' | null;
  crossoverExchange: number | null;
} {
  let cumA = 0;
  let cumD = 0;
  for (const e of log) {
    cumA += e.endDeltas?.a ?? 0;
    cumD += e.endDeltas?.d ?? 0;
    const gap = cumA - cumD; // more negative = A more drained
    if (Math.abs(gap) >= 8) {
      return { fatiguedSide: gap < 0 ? 'A' : 'D', crossoverExchange: e.exchangeIndex };
    }
  }
  const finalGap = cumA - cumD;
  if (Math.abs(finalGap) >= 4) {
    return { fatiguedSide: finalGap < 0 ? 'A' : 'D', crossoverExchange: null };
  }
  return { fatiguedSide: null, crossoverExchange: null };
}

function biggestSkillGap(
  a: AnalysisWarrior,
  d: AnalysisWarrior
): { skill: string; gap: number; favored: 'A' | 'D' } {
  let best = { skill: 'ATT', gap: 0, favored: 'A' as 'A' | 'D' };
  for (const k of Object.keys(a.skills)) {
    const gap = (a.skills[k] ?? 0) - (d.skills[k] ?? 0);
    if (Math.abs(gap) > Math.abs(best.gap)) {
      best = { skill: k, gap: Math.abs(gap), favored: gap >= 0 ? 'A' : 'D' };
    }
  }
  return best;
}

export function buildFightAnalysis(
  outcome: FightOutcome,
  warriorA: AnalysisWarrior,
  warriorD: AnalysisWarrior
): FightAnalysis {
  const log = outcome.exchangeLog ?? [];
  const edge = getMatchupBonus(warriorA.style as FightingStyle, warriorD.style as FightingStyle);

  const fatalIdx = outcome.post?.fatalExchangeIndex ?? null;
  const decisiveEntry =
    fatalIdx != null ? (log.find((e) => e.exchangeIndex === fatalIdx) ?? null) : null;

  const tale = summarizeTale(log);
  const fatigue = findFatigueCrossover(log);
  const skillGap = biggestSkillGap(warriorA, warriorD);

  const winnerName =
    outcome.winner === 'A' ? warriorA.name : outcome.winner === 'D' ? warriorD.name : 'No one';

  const decisiveExchange = {
    index: decisiveEntry?.exchangeIndex ?? null,
    minute: decisiveEntry?.minute ?? null,
    reasonCodes: decisiveEntry?.reasonCodes ?? [],
    summary:
      decisiveEntry != null
        ? `The bout broke open at minute ${decisiveEntry.minute} (exchange ${decisiveEntry.exchangeIndex}).`
        : `${winnerName} won by ${outcome.by ?? 'decision'}.`,
  };

  const factors: AnalysisFactor[] = [];

  if (edge !== 0) {
    factors.push({
      label: 'Style matchup',
      detail: `${warriorA.style} vs ${warriorD.style} favored ${edge > 0 ? warriorA.name : warriorD.name} (${edge > 0 ? '+' : ''}${edge}).`,
      favored: edge > 0 ? 'A' : 'D',
      weight: Math.min(1, Math.abs(edge) / 4),
    });
  }

  if (skillGap.gap >= 3) {
    const who = skillGap.favored === 'A' ? warriorA.name : warriorD.name;
    factors.push({
      label: `${skillGap.skill} edge`,
      detail: `${who} held a ${skillGap.gap}-point ${skillGap.skill} advantage.`,
      favored: skillGap.favored,
      weight: Math.min(1, skillGap.gap / 8),
    });
  }

  if (fatigue.fatiguedSide) {
    const tiredName = fatigue.fatiguedSide === 'A' ? warriorA.name : warriorD.name;
    factors.push({
      label: 'Endurance',
      detail:
        fatigue.crossoverExchange != null
          ? `${tiredName} began gassing out around exchange ${fatigue.crossoverExchange}.`
          : `${tiredName} finished the more drained fighter.`,
      favored: fatigue.fatiguedSide === 'A' ? 'D' : 'A',
      weight: 0.5,
    });
  }

  const dmgGap = tale.damageA - tale.damageD;
  if (Math.abs(dmgGap) >= 4) {
    factors.push({
      label: 'Damage output',
      detail: `${dmgGap > 0 ? warriorA.name : warriorD.name} dealt ${Math.abs(dmgGap)} more total damage.`,
      favored: dmgGap > 0 ? 'A' : 'D',
      weight: Math.min(1, Math.abs(dmgGap) / 20),
    });
  }

  factors.push({
    label: 'Outcome',
    detail: decisiveExchange.summary,
    favored: outcome.winner,
    weight: 0.1,
  });

  factors.sort((x, y) => y.weight - x.weight);
  const ranked = factors.slice(0, 5);

  return {
    styleMatchup: { styleA: warriorA.style, styleD: warriorD.style, edge },
    decisiveExchange,
    fatigue,
    tale,
    factors: ranked,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/engine/fightAnalysis.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/narrative/fightAnalysis.ts src/test/engine/fightAnalysis.test.ts
git commit -m "feat(analysis): add pure buildFightAnalysis builder"
```

---

## Task 2: Add `analysis` to the `FightSummary` type and zod schema

**Files:**

- Modify: `src/types/combat.types.ts:225-260` (the `FightSummary` interface)
- Modify: `src/schemas/gameStateSchema.ts` (the `FightSummary` schema)
- Test: `src/test/engine/fightSummarySchema.test.ts` (create)

- [ ] **Step 1: Write the failing test**

```typescript
// src/test/engine/fightSummarySchema.test.ts
import { describe, it, expect } from 'vitest';
import { gameStateSchema } from '@/schemas/gameStateSchema';

describe('FightSummary schema accepts analysis', () => {
  it('parses an arenaHistory entry that carries an analysis object', () => {
    // Build a minimal valid game state with one fight that has analysis.
    // Engineer: import a known-good fixture if one exists, else hand-build
    // the smallest object gameStateSchema accepts. The assertion that matters:
    const fight = {
      id: 'f1',
      week: 1,
      title: 'Test',
      warriorIdA: 'a',
      warriorIdD: 'd',
      winner: 'A',
      by: 'Kill',
      styleA: 'Lunging Attack',
      styleD: 'Total Parry',
      createdAt: new Date().toISOString(),
      analysis: {
        styleMatchup: { styleA: 'Lunging Attack', styleD: 'Total Parry', edge: 2 },
        decisiveExchange: { index: 2, minute: 3, reasonCodes: ['AI_PUSH_FATIGUE'], summary: 'x' },
        fatigue: { fatiguedSide: 'D', crossoverExchange: 2 },
        tale: { hitsA: 3, hitsD: 0, damageA: 22, damageD: 0, ripostesA: 0, ripostesD: 0 },
        factors: [{ label: 'Style matchup', detail: 'x', favored: 'A', weight: 0.5 }],
      },
    };
    // Validate just the fight subschema if exported; otherwise assert via the
    // full schema. The pre-change behavior strips `analysis`; post-change keeps it.
    const result = gameStateSchema.shape.arenaHistory.element.safeParse(fight);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.analysis?.styleMatchup.edge).toBe(2);
    }
  });
});
```

> Engineer note: if `gameStateSchema.shape.arenaHistory.element` is not directly accessible because of how the schema is composed, locate the named `FightSummary` zod object in `src/schemas/gameStateSchema.ts` and export it (e.g. `export const fightSummarySchema = ...`), then import that here.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/engine/fightSummarySchema.test.ts`
Expected: FAIL — either `analysis` is stripped (so `result.data.analysis` is undefined) or the element accessor is missing.

- [ ] **Step 3: Add the type field**

In `src/types/combat.types.ts`, inside the `FightSummary` interface (after `weather?` at line ~259), add:

```typescript
  /** Compact, persisted explanation of why the fight went the way it did.
   *  Built by buildFightAnalysis() at resolution time. */
  analysis?: import('@/engine/narrative/fightAnalysis').FightAnalysis;
```

- [ ] **Step 4: Add the zod field**

In `src/schemas/gameStateSchema.ts`, find the zod object that defines a single fight (the element type of `arenaHistory`). Add an optional `analysis` field. Use a permissive nested shape so older saves without it still load:

```typescript
const analysisFactorSchema = z.object({
  label: z.string(),
  detail: z.string(),
  favored: z.enum(['A', 'D']).nullable(),
  weight: z.number(),
});

const fightAnalysisSchema = z.object({
  styleMatchup: z.object({ styleA: z.string(), styleD: z.string(), edge: z.number() }),
  decisiveExchange: z.object({
    index: z.number().nullable(),
    minute: z.number().nullable(),
    reasonCodes: z.array(z.string()),
    summary: z.string(),
  }),
  fatigue: z.object({
    fatiguedSide: z.enum(['A', 'D']).nullable(),
    crossoverExchange: z.number().nullable(),
  }),
  tale: z.object({
    hitsA: z.number(),
    hitsD: z.number(),
    damageA: z.number(),
    damageD: z.number(),
    ripostesA: z.number(),
    ripostesD: z.number(),
  }),
  factors: z.array(analysisFactorSchema),
});
```

Then add `analysis: fightAnalysisSchema.optional(),` to the fight object schema. If the fight schema is inline, refactor it to a named `export const fightSummarySchema` so the test in Step 1 can import it.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/test/engine/fightSummarySchema.test.ts`
Expected: PASS.

- [ ] **Step 6: Run the full schema/state test suite to confirm no regression**

Run: `npx vitest run src/test/state src/test/engine/fightSummarySchema.test.ts`
Expected: PASS (no existing state-load test breaks).

- [ ] **Step 7: Commit**

```bash
git add src/types/combat.types.ts src/schemas/gameStateSchema.ts src/test/engine/fightSummarySchema.test.ts
git commit -m "feat(analysis): persist FightAnalysis on FightSummary"
```

---

## Task 3: Populate `analysis` when a FightSummary is built from a BoutResult

**Files:**

- Modify: `src/engine/core/fightSummaryFactory.ts`
- Test: `src/test/engine/fightSummaryFactory.test.ts` (create or extend)

> Engineer note: open `src/engine/core/fightSummaryFactory.ts` first and find the function that maps a `BoutResult` (which holds `outcome: FightOutcome`, `a: Warrior`, `d: Warrior`) into a `FightSummary`. That is the single seam where `analysis` must be attached. If summaries are also built elsewhere (grep `warriorIdA:` across `src/engine`), attach there too — but the factory is the canonical site.

- [ ] **Step 1: Write the failing test**

```typescript
// src/test/engine/fightSummaryFactory.test.ts
import { describe, it, expect } from 'vitest';
// Engineer: import the actual exported factory function name from fightSummaryFactory.ts
import { buildFightSummary } from '@/engine/core/fightSummaryFactory';

describe('fightSummaryFactory attaches analysis', () => {
  it('includes analysis built from the outcome exchangeLog', () => {
    // Engineer: construct a minimal BoutResult-shaped fixture matching the
    // factory's actual signature. Key assertion:
    const summary = buildFightSummary(/* boutResult fixture, week, etc. */);
    expect(summary.analysis).toBeDefined();
    expect(summary.analysis?.styleMatchup).toBeDefined();
    expect(summary.analysis?.factors.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/engine/fightSummaryFactory.test.ts`
Expected: FAIL — `summary.analysis` is `undefined`.

- [ ] **Step 3: Wire the builder into the factory**

At the top of `src/engine/core/fightSummaryFactory.ts`:

```typescript
import { buildFightAnalysis } from '@/engine/narrative/fightAnalysis';
```

Inside the function that returns the `FightSummary` object, before the return, compute:

```typescript
const analysis = buildFightAnalysis(
  boutResult.outcome,
  {
    id: boutResult.a.id,
    name: boutResult.a.name,
    style: boutResult.a.style,
    attributes: boutResult.a.attributes,
    skills: boutResult.a.skills,
  },
  {
    id: boutResult.d.id,
    name: boutResult.d.name,
    style: boutResult.d.style,
    attributes: boutResult.d.attributes,
    skills: boutResult.d.skills,
  }
);
```

> Engineer note: use the actual local variable names for the bout result and the two warriors in that file. Add `analysis,` to the returned `FightSummary` object literal.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/engine/fightSummaryFactory.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the bout/simulate suite to confirm no regression**

Run: `npx vitest run src/test/engine`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/engine/core/fightSummaryFactory.ts src/test/engine/fightSummaryFactory.test.ts
git commit -m "feat(analysis): attach FightAnalysis in fightSummaryFactory"
```

---

## Task 4: Build the `FightAnalysisPanel` presentational component

**Files:**

- Create: `src/components/bout-viewer/FightAnalysisPanel.tsx`
- Test: `src/test/components/FightAnalysisPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/test/components/FightAnalysisPanel.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FightAnalysisPanel } from '@/components/bout-viewer/FightAnalysisPanel';
import type { FightAnalysis } from '@/engine/narrative/fightAnalysis';

const analysis: FightAnalysis = {
  styleMatchup: { styleA: 'Lunging Attack', styleD: 'Total Parry', edge: 2 },
  decisiveExchange: { index: 2, minute: 3, reasonCodes: ['AI_PUSH_FATIGUE'], summary: 'Broke open at minute 3.' },
  fatigue: { fatiguedSide: 'D', crossoverExchange: 2 },
  tale: { hitsA: 3, hitsD: 0, damageA: 22, damageD: 0, ripostesA: 0, ripostesD: 0 },
  factors: [
    { label: 'Style matchup', detail: 'LA vs TP favored Aulus (+2).', favored: 'A', weight: 0.5 },
    { label: 'Damage output', detail: 'Aulus dealt 22 more total damage.', favored: 'A', weight: 0.9 },
    { label: 'Outcome', detail: 'Broke open at minute 3.', favored: 'A', weight: 0.1 },
  ],
};

describe('FightAnalysisPanel', () => {
  it('renders each ranked factor label and detail', () => {
    render(<FightAnalysisPanel analysis={analysis} nameA="Aulus" nameD="Bran" />);
    expect(screen.getByText('Style matchup')).toBeInTheDocument();
    expect(screen.getByText(/22 more total damage/)).toBeInTheDocument();
  });

  it('renders the decisive-exchange summary', () => {
    render(<FightAnalysisPanel analysis={analysis} nameA="Aulus" nameD="Bran" />);
    expect(screen.getByText(/Broke open at minute 3/)).toBeInTheDocument();
  });

  it('renders nothing when analysis is undefined', () => {
    const { container } = render(<FightAnalysisPanel analysis={undefined} nameA="Aulus" nameD="Bran" />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/components/FightAnalysisPanel.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

```tsx
// src/components/bout-viewer/FightAnalysisPanel.tsx
/**
 * Player-facing "why did this happen" panel. Renders the ranked decisive
 * factors from a FightAnalysis. Purely presentational — no store access.
 */
import type { FightAnalysis } from '@/engine/narrative/fightAnalysis';
import { Surface } from '@/components/ui/Surface';

interface FightAnalysisPanelProps {
  analysis?: FightAnalysis;
  nameA: string;
  nameD: string;
}

function favoredName(favored: 'A' | 'D' | null, nameA: string, nameD: string): string | null {
  if (favored === 'A') return nameA;
  if (favored === 'D') return nameD;
  return null;
}

export function FightAnalysisPanel({ analysis, nameA, nameD }: FightAnalysisPanelProps) {
  if (!analysis) return null;

  return (
    <Surface className="p-4 space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Why it went this way
      </h3>

      <ul className="space-y-2">
        {analysis.factors.map((f, i) => {
          const who = favoredName(f.favored, nameA, nameD);
          return (
            <li key={i} className="flex gap-3 items-start">
              <span className="mt-0.5 inline-block min-w-[7rem] text-xs font-medium text-primary">
                {f.label}
              </span>
              <span className="text-sm text-foreground/90">
                {f.detail}
                {who ? <span className="ml-1 text-xs text-muted-foreground">→ {who}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-muted-foreground border-t border-border/40">
        <div>
          {nameA}: {analysis.tale.hitsA} hits · {analysis.tale.damageA} dmg
        </div>
        <div>
          {nameD}: {analysis.tale.hitsD} hits · {analysis.tale.damageD} dmg
        </div>
      </div>
    </Surface>
  );
}
```

> Engineer note: confirm `Surface` is the right shared wrapper by checking `src/components/ui/Surface` (used by `BoutViewer.tsx`). If the project prefers `Card` from shadcn, match whatever `BoutResolution.tsx` already uses.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/components/FightAnalysisPanel.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/bout-viewer/FightAnalysisPanel.tsx src/test/components/FightAnalysisPanel.test.tsx
git commit -m "feat(analysis): add FightAnalysisPanel component"
```

---

## Task 5: Thread `analysis` into BoutViewer and mount the panel

**Files:**

- Modify: `src/components/BoutViewer.tsx` (props interface + render)
- Modify: `src/components/bout-viewer/BoutResolution.tsx` (mount point)

- [ ] **Step 1: Add the prop to BoutViewer**

In `src/components/BoutViewer.tsx`, add to `BoutViewerProps`:

```typescript
  analysis?: import('@/engine/narrative/fightAnalysis').FightAnalysis;
```

Destructure `analysis` from props alongside `nameA`, `nameD`, etc.

- [ ] **Step 2: Render the panel**

Import at top of `BoutViewer.tsx`:

```typescript
import { FightAnalysisPanel } from './bout-viewer/FightAnalysisPanel';
```

Render it after the bout result/controls block (place it near `BoutResolution`):

```tsx
<FightAnalysisPanel analysis={analysis} nameA={nameA} nameD={nameD} />
```

- [ ] **Step 3: Manual smoke test in the running app**

Run: `bun run dev` and open `http://localhost:8080`. Advance a week with at least one player bout, open the resolution reveal, and confirm the "Why it went this way" panel appears with factor rows. (No automated test here — this is a render-wiring step verified visually.)

- [ ] **Step 4: Commit**

```bash
git add src/components/BoutViewer.tsx src/components/bout-viewer/BoutResolution.tsx
git commit -m "feat(analysis): render FightAnalysisPanel inside BoutViewer"
```

---

## Task 6: Pass `analysis` from both call sites (live reveal + historical viewer)

**Files:**

- Modify: live reveal path — `src/components/resolution-reveal/BoutsStep.tsx` and/or `src/components/ResolutionReveal.tsx`
- Modify: historical path — `src/routes/warrior/$id.tsx` (warrior detail fight history → BoutViewer)

> Engineer note: grep for every place that renders `<BoutViewer` (`grep -rn "<BoutViewer" src`). Each call site must pass `analysis`. Live reveal has it on `BoutResult.outcome` → build via `buildFightAnalysis` on the fly OR read the already-attached `summary.analysis`. Historical call sites read `FightSummary.analysis` directly (now persisted from Task 3).

- [ ] **Step 1: Live reveal — pass analysis**

In the component that maps bout results to `<BoutViewer .../>` (e.g. `BoutsStep.tsx`), if it has a `FightSummary`, pass `analysis={summary.analysis}`. If it only has the raw `BoutResult`, import and call:

```typescript
import { buildFightAnalysis } from '@/engine/narrative/fightAnalysis';
// ...
const analysis = buildFightAnalysis(bout.outcome, bout.a, bout.d);
```

and pass `analysis={analysis}`.

- [ ] **Step 2: Historical viewer — pass analysis**

In `src/routes/warrior/$id.tsx` (or whichever component renders a past fight via `<BoutViewer`), pass `analysis={fight.analysis}` where `fight` is the `FightSummary` from `arenaHistory`.

- [ ] **Step 3: Manual smoke test**

Run: `bun run dev`. Confirm BOTH paths show the panel: (a) the week-advance reveal, (b) a warrior's past fight opened from their detail page.

- [ ] **Step 4: Type-check the whole app**

Run: `npx tsc --noEmit --project tsconfig.app.json`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/resolution-reveal src/components/ResolutionReveal.tsx src/routes/warrior/\$id.tsx
git commit -m "feat(analysis): supply analysis to live and historical bout viewers"
```

---

## Self-Review Notes (for the implementer)

- **Backward compatibility:** old saves have no `analysis` on historical fights; `analysis` is optional everywhere and the panel renders nothing when absent. Historical fights from before this change simply won't show the panel — acceptable.
- **Single source of truth:** `buildFightAnalysis` is the only place analysis logic lives. Do not duplicate factor logic in the component.
- **The `iniWinner`-as-attacker heuristic** in `summarizeTale` is an approximation; if `ExchangeLogEntry` later gains an explicit `attackerSide`, switch to it. Note this with a code comment.

## Verification (done by reviewer after implementation)

1. `npx vitest run src/test/engine/fightAnalysis.test.ts src/test/components/FightAnalysisPanel.test.tsx src/test/engine/fightSummaryFactory.test.ts src/test/engine/fightSummarySchema.test.ts` — all pass.
2. `npx tsc --noEmit --project tsconfig.app.json` — clean.
3. Manual: advance a week, confirm the panel explains a real fight; open a historical fight, confirm persisted analysis renders.
4. Confirm no new `as any` / `as unknown as` casts were introduced.
