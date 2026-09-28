// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockStateRef } from '@/test/_mocks/gameStoreSelector';

vi.mock('@/state/useGameStore', async () => await import('@/test/_mocks/gameStoreSelector'));
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { NewsletterItem } from '@/types/state.types';


vi.mock('zustand/react/shallow', async () => await import('@/test/_mocks/useShallow'));

vi.mock('@/components/EntityLink', async () => await import('@/test/_mocks/entityLinks'));

vi.mock('@/components/ui/scroll-area', async () => await import('@/test/_mocks/scrollArea'));

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
    mockStateRef.current = {
      roster: [
        { id: 'w1', name: 'Brutus' },
        { id: 'w2', name: 'Cassius' },
      ],
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
