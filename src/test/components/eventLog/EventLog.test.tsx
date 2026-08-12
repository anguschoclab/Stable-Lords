import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeekDivider } from '@/components/eventLog/WeekDivider';
import { EVENT_ICONS } from '@/components/eventLog/constants';
import { processFightEvents } from '@/components/eventLog/eventProcessors';
import type { FightSummary } from '@/types/game';

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
    expect(EVENT_ICONS.fight).toBeDefined();
    expect(EVENT_ICONS.kill).toBeDefined();
    expect(EVENT_ICONS.death).toBeDefined();
    expect(EVENT_ICONS.recruit).toBeDefined();
    expect(EVENT_ICONS.tournament).toBeDefined();
    expect(EVENT_ICONS.news).toBeDefined();
    expect(EVENT_ICONS.event).toBeDefined();
    expect(EVENT_ICONS.injury).toBeDefined();
    expect(EVENT_ICONS.retirement).toBeDefined();
    expect(EVENT_ICONS.training).toBeDefined();
    expect(EVENT_ICONS.recovery).toBeDefined();
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
      {
        id: 'f1' as never,
        title: 'Alice vs Bob',
        winner: 'A',
        by: 'KO',
        week: 1,
        warriorIdA: 'w1' as never,
        warriorIdD: 'w2' as never,
        styleA: 'Bashing Attack',
        styleD: 'Parry',
        createdAt: '2024-01-01',
      },
    ];
    const result = processFightEvents(fights);
    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe('fight');
    expect(result[0]!.title).toContain('Alice');
  });

  it('marks kill events correctly', () => {
    const fights: FightSummary[] = [
      {
        id: 'f2' as never,
        title: 'Carol vs Dave',
        winner: 'D',
        by: 'Kill',
        week: 2,
        warriorIdA: 'w3' as never,
        warriorIdD: 'w4' as never,
        styleA: 'Striking Attack',
        styleD: 'Evasion',
        createdAt: '2024-01-02',
      },
    ];
    const result = processFightEvents(fights);
    expect(result[0]!.type).toBe('kill');
  });
});
