// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { NewsletterItem } from '@/types/state.types';

let mockState: any = {};

vi.mock('@/state/useGameStore', () => ({
  useGameStore: vi.fn((selector?: any) => (selector ? selector(mockState) : mockState)),
}));

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: any) => fn,
}));

vi.mock('@/components/EntityLink', () => ({
  WarriorLink: ({ name }: { name: string }) => (
    <span data-testid="warrior-link" data-name={name} aria-label={`Open details for warrior ${name}`}>
      {name}
    </span>
  ),
  StableLink: ({ name }: { name: string }) => (
    <span data-testid="stable-link" data-name={name} aria-label={`Open details for stable ${name}`}>
      {name}
    </span>
  ),
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}));

import { BriefingTab } from '@/components/dashboard/BriefingTab';

function makeReport(overrides: Partial<NewsletterItem> = {}): NewsletterItem {
  return {
    id: 'n1',
    week: 1,
    title: 'Brutus scout report',
    items: ['Brutus showed strong form', "Dragon's Hearth sent scouts"],
    ...overrides,
  };
}

describe('BriefingTab', () => {
  beforeEach(() => {
    mockState = {
      roster: [{ id: 'w1', name: 'Brutus' }, { id: 'w2', name: 'Cassius' }],
      graveyard: [],
      retired: [],
      rivals: [{ owner: { stableName: 'Wolf Pack' }, roster: [] }],
      player: { stableName: "Dragon's Hearth" },
    };
  });

  it('warrior names in report.title render as WarriorLink', () => {
    render(<BriefingTab reports={[makeReport()]} />);
    expect(screen.getAllByTestId('warrior-link').length).toBeGreaterThan(0);
  });

  it('warrior names in report.items render as WarriorLink', () => {
    render(<BriefingTab reports={[makeReport()]} />);
    const links = screen.getAllByTestId('warrior-link');
    expect(links.some((l) => l.getAttribute('data-name') === 'Brutus')).toBe(true);
  });

  it('stable names in report.title render as StableLink', () => {
    render(<BriefingTab reports={[makeReport({ title: "Dragon's Hearth briefing" })]} />);
    expect(screen.getAllByTestId('stable-link').length).toBeGreaterThan(0);
  });

  it('empty reports renders empty state', () => {
    render(<BriefingTab reports={[]} />);
    expect(screen.getByText('No News')).toBeInTheDocument();
  });
});
