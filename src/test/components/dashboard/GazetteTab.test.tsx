// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { GazetteStory } from '@/types/state.types';

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

import { GazetteTab } from '@/components/dashboard/GazetteTab';

function makeStory(overrides: Partial<GazetteStory> = {}): GazetteStory {
  return {
    id: 'g1' as any,
    headline: 'Brutus wins big',
    body: "Brutus of Dragon's Hearth crushed Cassius",
    mood: 'Calm' as any,
    tags: [],
    week: 1,
    ...overrides,
  };
}

describe('GazetteTab', () => {
  beforeEach(() => {
    mockState = {
      roster: [{ id: 'w1', name: 'Brutus' }, { id: 'w2', name: 'Cassius' }],
      graveyard: [],
      retired: [],
      rivals: [{ owner: { stableName: 'Wolf Pack' }, roster: [] }],
      player: { stableName: "Dragon's Hearth" },
    };
  });

  it('warrior names in story.headline render as WarriorLink', () => {
    render(<GazetteTab stories={[makeStory()]} />);
    expect(screen.getAllByTestId('warrior-link').length).toBeGreaterThan(0);
  });

  it('stable names in story.headline render as StableLink', () => {
    render(<GazetteTab stories={[makeStory({ headline: "Dragon's Hearth dominates" })]} />);
    expect(screen.getAllByTestId('stable-link').length).toBeGreaterThan(0);
  });

  it('warrior names in story.body render as WarriorLink', () => {
    render(<GazetteTab stories={[makeStory()]} />);
    const links = screen.getAllByTestId('warrior-link');
    expect(links.some((l) => l.getAttribute('data-name') === 'Brutus')).toBe(true);
    expect(links.some((l) => l.getAttribute('data-name') === 'Cassius')).toBe(true);
  });

  it('stable names in story.body render as StableLink', () => {
    render(<GazetteTab stories={[makeStory()]} />);
    const links = screen.getAllByTestId('stable-link');
    expect(links.some((l) => l.getAttribute('data-name') === "Dragon's Hearth")).toBe(true);
  });

  it('empty stories renders empty state', () => {
    render(<GazetteTab stories={[]} />);
    expect(screen.getByText('No News Yet')).toBeInTheDocument();
  });
});
