// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeekDivider } from '@/components/eventLog/WeekDivider';
import { EVENT_ICONS } from '@/components/eventLog/constants';
import { processFightEvents } from '@/components/eventLog/eventProcessors';
import { ALL_EVENT_TYPES } from '@/test/_fixtures/eventLog';
import type { FightSummary } from '@/types/game';
import { makeAliceBobFight, makeCarolDaveFight } from '@/test/_fixtures/factories';


describe('WeekDivider', () => {
  it('renders week number', () => {
    render(<WeekDivider week={5} />);
    expect(screen.getByText('Week 5')).toBeInTheDocument();
  });

  it('renders week 0', () => {
    render(<WeekDivider week={0} />);
    expect(screen.getByText('Week 0')).toBeInTheDocument();
  });
});

describe('EVENT_ICONS', () => {
  it('has icons for all event types', () => {
    for (const type of ALL_EVENT_TYPES) {
      expect(EVENT_ICONS[type], type).toBeDefined();
    }
  });

  it('covers exactly the EventType union — no dead entries', () => {
    expect(Object.keys(EVENT_ICONS).sort()).toEqual([...ALL_EVENT_TYPES].sort());
  });

  it('has icon and color for each type', () => {
    for (const [, val] of Object.entries(EVENT_ICONS)) {
      expect(val.icon).toBeDefined();
      expect(val.color).toBeDefined();
    }
  });
});

describe('processFightEvents', () => {
  it('processes empty array', () => {
    const result = processFightEvents([]);
    expect(result).toEqual([]);
  });

  it('processes fight events correctly', () => {
    const fights: FightSummary[] = [
      makeAliceBobFight(),
    ];
    const result = processFightEvents(fights);
    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe('fight');
    expect(result[0]!.title).toContain('Alice');
  });

  it('marks kill events correctly', () => {
    const fights: FightSummary[] = [
      makeCarolDaveFight(),
    ];
    const result = processFightEvents(fights);
    expect(result[0]!.type).toBe('kill');
  });
});
