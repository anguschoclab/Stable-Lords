// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { KillAnalyticsPanel } from '@/components/fallen/KillAnalyticsPanel';
import { makeFightSummary, makeWarrior } from '@/test/_fixtures/factories';

describe('KillAnalyticsPanel (G6)', () => {
  it('renders kill metrics from persisted fight + graveyard telemetry', () => {
    const fights = [
      makeFightSummary({
        by: 'Kill',
        winner: 'A',
        styleA: 'Lunging Attack',
        isDeathEvent: true,
      }),
      makeFightSummary({ by: 'KO' }),
    ];
    const graveyard = [
      makeWarrior({ isDead: true, causeOfDeath: 'EXECUTION', killedBy: 'Vortax' }),
    ];
    render(<KillAnalyticsPanel fights={fights} graveyard={graveyard} />);
    expect(screen.getByText(/mechanics of death/i)).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument(); // kill rate 1/2
    expect(screen.getByText('EXECUTION')).toBeInTheDocument();
    expect(screen.getByText(/lunging attack/i)).toBeInTheDocument();
    expect(screen.getByText('Vortax')).toBeInTheDocument();
  });

  it('shows an empty state with no kills and no fallen', () => {
    render(<KillAnalyticsPanel fights={[makeFightSummary({ by: 'Decision' })]} graveyard={[]} />);
    expect(screen.getByText(/no kills recorded/i)).toBeInTheDocument();
  });
});
