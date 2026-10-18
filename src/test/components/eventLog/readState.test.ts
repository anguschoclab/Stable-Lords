import { describe, it, expect } from 'vitest';
import { Sword } from 'lucide-react';
import { countUnreadEvents } from '@/components/eventLog/readState';
import { useGameStore } from '@/state/useGameStore';
import type { GameEvent } from '@/types/eventLog';

function event(id: string): GameEvent {
  return {
    id,
    week: 1,
    type: 'news',
    title: id,
    icon: Sword,
    iconColor: 'text-foreground',
    linkTo: '/stable',
  };
}

describe('event feed read state', () => {
  it('treats every event as unread until a latest-read marker exists', () => {
    expect(countUnreadEvents([event('new'), event('old')], null)).toBe(2);
  });

  it('counts only newer events when the read marker is present', () => {
    const events = [event('newest'), event('newer'), event('read-boundary'), event('old')];
    expect(countUnreadEvents(events, 'read-boundary')).toBe(2);
    expect(countUnreadEvents(events, 'newest')).toBe(0);
  });

  it('marks the current latest event as read through the store', () => {
    useGameStore.getState().markEventLogRead('latest-event');
    expect(useGameStore.getState().eventLogLastReadId).toBe('latest-event');
  });
});
