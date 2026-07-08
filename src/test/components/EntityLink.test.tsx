/**
 * EntityLink accessibility — verifies SheetDescription with sr-only is present
 * and aria-describedby={undefined} is NOT used.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { WarriorLink, StableLink } from '@/components/EntityLink';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: any) => {
    const state = {
      player: { id: 'p1', name: 'Player', stableName: "Dragon's Hearth" },
      rivals: [{ id: 'r1', name: 'Rival Stable', stableName: 'Wolf Pack' }],
      roster: [{ id: 'w1', name: 'Test Warrior' }],
      retired: [],
      graveyard: [],
    };
    return selector ? selector(state) : state;
  },
  useShallow: (fn: any) => fn,
}));

vi.mock('@/components/ui/sheet', () => ({
  SheetDescription: ({ children, className }: any) => <div data-testid="sheet-description" className={className}>{children}</div>,
  Sheet: ({ children }: any) => <div data-testid="sheet">{children}</div>,
  SheetContent: ({ children, ...props }: any) => (
    <div data-testid="sheet-content" aria-describedby={props['aria-describedby']}>
      {children}
    </div>
  ),
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
  SheetDescription: ({ children, className }: any) => (
    <div data-testid="sheet-description" className={className}>{children}</div>
  ),
  SheetTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
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

vi.mock('@/engine/core/historyResolver', () => ({
  findWarrior: () => ({ id: 'w1' }),
  findStableId: () => 'r1',
}));

describe('EntityLink accessibility', () => {
  it('WarriorLink renders SheetDescription with sr-only class', () => {
    const { getByTestId } = render(<WarriorLink name="Test Warrior" id="w1" />);
    const desc = getByTestId('sheet-description');
    expect(desc).toBeInTheDocument();
    expect(desc.className).toContain('sr-only');
  });

  it('StableLink renders SheetDescription with sr-only class', () => {
    const { getByTestId } = render(<StableLink name="Rival Stable" />);
    const desc = getByTestId('sheet-description');
    expect(desc).toBeInTheDocument();
    expect(desc.className).toContain('sr-only');
  });

  it('WarriorLink does not use aria-describedby={undefined}', () => {
    const { getByTestId } = render(<WarriorLink name="Test Warrior" id="w1" />);
    const content = getByTestId('sheet-content');
    expect(content).not.toHaveAttribute('aria-describedby', 'undefined');
  });

  it('StableLink does not use aria-describedby={undefined}', () => {
    const { getByTestId } = render(<StableLink name="Rival Stable" />);
    const content = getByTestId('sheet-content');
    expect(content).not.toHaveAttribute('aria-describedby', 'undefined');
  });
});
