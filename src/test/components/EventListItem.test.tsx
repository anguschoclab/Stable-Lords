// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventListItem } from '@/components/eventLog/EventListItem';
import type { GameEvent } from '@/types/eventLog';
import { ScrollText } from 'lucide-react';

vi.mock('@/components/EntityLink', () => ({
  WarriorLink: ({ name }: { name: string }) => (
    <span
      data-testid="warrior-link"
      data-name={name}
      aria-label={`Open details for warrior ${name}`}
    >
      {name}
    </span>
  ),
  StableLink: ({ name }: { name: string }) => (
    <span data-testid="stable-link" data-name={name} aria-label={`Open details for stable ${name}`}>
      {name}
    </span>
  ),
}));

function makeEvent(overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 'test-1',
    week: 1,
    type: 'fight',
    title: 'Brutus defeated Cassius',
    subtitle: "Dragon's Hearth hosted the bout",
    icon: ScrollText,
    iconColor: 'text-primary',
    linkTo: '/arena',
    ...overrides,
  };
}

describe('EventListItem', () => {
  it('accepts allStableNames prop and renders stable links', () => {
    render(
      <EventListItem
        event={makeEvent()}
        allWarriorNames={['Brutus', 'Cassius']}
        allStableNames={["Dragon's Hearth"]}
        onClick={() => {}}
      />
    );
    expect(screen.getAllByTestId('warrior-link')).toHaveLength(2);
    expect(screen.getAllByTestId('stable-link')).toHaveLength(1);
  });

  it('stable names are linkified even when entityNames is set', () => {
    render(
      <EventListItem
        event={makeEvent({
          title: "Dragon's Hearth signed Brutus",
          subtitle: '',
          entityNames: ['Brutus'],
        })}
        allWarriorNames={['Brutus', 'Cassius']}
        allStableNames={["Dragon's Hearth"]}
        onClick={() => {}}
      />
    );
    expect(screen.getAllByTestId('warrior-link')).toHaveLength(1);
    expect(screen.getAllByTestId('stable-link')).toHaveLength(1);
  });

  it('existing warrior name linkification still works with allStableNames prop', () => {
    render(
      <EventListItem
        event={makeEvent()}
        allWarriorNames={['Brutus', 'Cassius']}
        allStableNames={["Dragon's Hearth"]}
        onClick={() => {}}
      />
    );
    const warriorLinks = screen.getAllByTestId('warrior-link');
    expect(warriorLinks[0]).toHaveAttribute('data-name', 'Brutus');
    expect(warriorLinks[1]).toHaveAttribute('data-name', 'Cassius');
  });

  it('works without allStableNames prop (backward compatible)', () => {
    render(
      <EventListItem
        event={makeEvent()}
        allWarriorNames={['Brutus', 'Cassius']}
        onClick={() => {}}
      />
    );
    expect(screen.getAllByTestId('warrior-link')).toHaveLength(2);
    expect(screen.queryByTestId('stable-link')).not.toBeInTheDocument();
  });
});
