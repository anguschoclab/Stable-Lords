// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

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

vi.mock('@/components/ui/Surface', () => ({
  Surface: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

import { GazetteArticle } from '@/components/gazette/GazetteArticle';

describe('GazetteArticle', () => {
  beforeEach(() => {
    mockState = {
      roster: [{ id: 'w1', name: 'Brutus' }, { id: 'w2', name: 'Cassius' }],
      graveyard: [],
      retired: [],
      rivals: [{ owner: { stableName: 'Wolf Pack' }, roster: [] }],
      player: { stableName: "Dragon's Hearth" },
    };
  });

  it('mainHeadline rendered with LinkifiedText (warrior names clickable)', () => {
    render(
      <GazetteArticle
        issue={{
          week: 1,
          mainHeadline: 'Brutus wins championship',
          mainStory: 'Test story',
          sideStories: [],
        }}
        season="Summer"
      />
    );
    expect(screen.getAllByTestId('warrior-link').length).toBeGreaterThan(0);
  });

  it('mainStory passed to MarkdownReader with entity names', () => {
    render(
      <GazetteArticle
        issue={{
          week: 1,
          mainHeadline: 'Test headline',
          mainStory: 'Brutus fought Cassius in the arena',
          sideStories: [],
        }}
        season="Summer"
      />
    );
    expect(screen.getAllByTestId('warrior-link').length).toBeGreaterThan(0);
  });

  it('sideStories passed to MarkdownReader with entity names', () => {
    render(
      <GazetteArticle
        issue={{
          week: 1,
          mainHeadline: 'Test headline',
          mainStory: 'Test story',
          sideStories: ['Brutus signed new contract'],
        }}
        season="Summer"
      />
    );
    expect(screen.getAllByTestId('warrior-link').length).toBeGreaterThan(0);
  });

  it('stable names in headline render as StableLink', () => {
    render(
      <GazetteArticle
        issue={{
          week: 1,
          mainHeadline: "Dragon's Hearth dominates the arena",
          mainStory: 'Test story',
          sideStories: [],
        }}
        season="Summer"
      />
    );
    expect(screen.getAllByTestId('stable-link').length).toBeGreaterThan(0);
  });
});
