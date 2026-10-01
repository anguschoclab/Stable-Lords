/**
 * MEGAPLAN-V9 gate — EntityLink render stability.
 *
 * Characterizes the perf contract the EntityLink synthesis must meet:
 * subscribing to a resolved *primitive id* must shield the component from
 * unrelated store churn (graveyard growth, roster edits elsewhere). The
 * current implementation selects five large slices via useShallow, so any
 * reference change in player/rivals/roster/graveyard/retired re-renders —
 * these tests are RED until the memoized atomic-selector version lands.
 *
 * Uses a real zustand store behind a mocked '@/state/useGameStore' so actual
 * subscription semantics (selector + Object.is equality) are exercised.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import React from 'react';
import type { ReactNode } from 'react';

const storeRef = vi.hoisted(() => ({
  store: null as unknown as {
    (selector?: (s: any) => any): any;
    setState: (p: any) => void;
    getState: () => any;
  },
}));

vi.mock('@/state/useGameStore', async () => {
  const { create } = await import('zustand');
  const store = create<any>(() => ({
    player: { id: 'p1', name: 'Player', stableName: "Dragon's Hearth" },
    rivals: [{ id: 'r1', name: 'Wolf Pack', owner: { stableName: 'Wolf Pack' } }],
    roster: [
      { id: 'w1', name: 'Test Warrior' },
      { id: 'w2', name: 'Other Warrior' },
    ],
    retired: [],
    graveyard: [],
    treasury: 0,
  }));
  storeRef.store = store as any;
  return { useGameStore: store };
});

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: any) => <div data-testid="sheet">{children}</div>,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
  SheetDescription: ({ children }: any) => <div>{children}</div>,
  SheetTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/WarriorDossier', () => ({
  WarriorDossier: () => <div>Warrior Dossier</div>,
}));
vi.mock('@/components/StableDossier', () => ({
  StableDossier: () => <div>Stable Dossier</div>,
}));

// Real historyResolver — the synthesis must preserve real resolution.
vi.mock('@/engine/core/historyResolver', async () => {
  const actual = await vi.importActual<any>('@/engine/core/historyResolver');
  return actual;
});

import { WarriorLink, StableLink } from '@/components/EntityLink';

const renderCounts = { warrior: 0, stable: 0 };
const onWarriorRender = () => {
  renderCounts.warrior++;
};
const onStableRender = () => {
  renderCounts.stable++;
};

describe('EntityLink render stability (MEGAPLAN-V9)', () => {
  it('WarriorLink resolves and does not re-render on unrelated slice churn', () => {
    renderCounts.warrior = 0;
    render(
      <React.Profiler id="w" onRender={onWarriorRender}>
        <WarriorLink name="Test Warrior" />
      </React.Profiler>
    );
    expect(renderCounts.warrior).toBe(1);

    act(() => {
      // Mutate a slice the link is subscribed to but which does not change
      // this warrior's resolved id — graveyard append changes the reference.
      storeRef.store.setState({ graveyard: [{ id: 'g1', name: 'Dead' }] });
    });
    expect(renderCounts.warrior).toBe(1);

    act(() => {
      // Touch an unrelated roster entry — resolved id still 'w1'.
      storeRef.store.setState({
        roster: [
          { id: 'w1', name: 'Test Warrior' },
          { id: 'w2', name: 'Renamed Warrior' },
        ],
      });
    });
    expect(renderCounts.warrior).toBe(1);
  });

  it('WarriorLink re-renders when the resolved id actually changes', () => {
    renderCounts.warrior = 0;
    render(
      <React.Profiler id="w" onRender={onWarriorRender}>
        <WarriorLink name="Test Warrior" />
      </React.Profiler>
    );
    const before = renderCounts.warrior;
    act(() => {
      storeRef.store.setState({
        roster: [{ id: 'w99', name: 'Test Warrior' }],
      });
    });
    expect(renderCounts.warrior).toBeGreaterThan(before);
  });

  it('StableLink stays mounted across unrelated churn and resolves player stable', () => {
    renderCounts.stable = 0;
    render(
      <React.Profiler id="s" onRender={onStableRender}>
        <StableLink name="Wolf Pack" />
      </React.Profiler>
    );
    expect(renderCounts.stable).toBe(1);

    act(() => {
      storeRef.store.setState({ treasury: 999, retired: [{ id: 'x1' }] });
    });
    expect(renderCounts.stable).toBe(1);
  });

  it('WarriorLink falls back to plain span for unresolvable names', () => {
    const { container } = render(<WarriorLink name="Nobody Known" />);
    expect(container.querySelector('span')).toBeTruthy();
    expect(container.textContent).toContain('Nobody Known');
  });
});
