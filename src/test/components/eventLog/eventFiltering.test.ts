import { describe, it, expect } from 'vitest';
import { Sword } from 'lucide-react';
import { filterEventsByCategory, EVENT_FILTER_CATEGORIES } from '@/components/eventLog/filters';
import type { GameEvent } from '@/types/eventLog';

function event(id: string, type: GameEvent['type']): GameEvent {
  return {
    id,
    week: 1,
    type,
    title: id,
    icon: Sword,
    iconColor: 'text-foreground',
    linkTo: '/stable',
  };
}

describe('event filtering', () => {
  const events = [
    event('fight-1', 'fight'),
    event('kill-1', 'kill'),
    event('death-1', 'death'),
    event('injury-1', 'injury'),
    event('news-1', 'news'),
  ];

  it('returns all events for the all category', () => {
    expect(filterEventsByCategory(events, 'all')).toHaveLength(5);
  });

  it('groups combat results and memorial events into consequences', () => {
    expect(filterEventsByCategory(events, 'consequences').map((e) => e.id)).toEqual([
      'fight-1',
      'kill-1',
      'death-1',
      'injury-1',
    ]);
  });

  it('groups informational events into reports', () => {
    expect(filterEventsByCategory(events, 'reports').map((e) => e.id)).toEqual(['news-1']);
  });

  it('exposes stable ordered categories for the rail UI', () => {
    expect(EVENT_FILTER_CATEGORIES.map((category) => category.id)).toEqual([
      'all',
      'consequences',
      'reports',
    ]);
  });

  it('every EventType lands in a player-facing category', () => {
    const allTypes: GameEvent['type'][] = [
      'fight',
      'kill',
      'death',
      'tournament',
      'news',
      'injury',
      'retirement',
      'training',
      'event',
      'recovery',
    ];
    const feed = allTypes.map((type) => event(`e-${type}`, type));
    const covered = new Set(
      [
        ...filterEventsByCategory(feed, 'consequences'),
        ...filterEventsByCategory(feed, 'reports'),
      ].map((e) => e.type)
    );
    expect([...covered].sort()).toEqual([...allTypes].sort());
  });
});
