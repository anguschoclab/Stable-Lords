// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIDebugDrawer } from '@/components/bout-viewer/AIDebugDrawer';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { ExchangeLogEntry } from '@/types/combat.types';
import type { WarriorId } from '@/types/shared.types';

const entries: ExchangeLogEntry[] = [
  {
    exchangeIndex: 0,
    minute: 1,
    attackerId: 'a' as WarriorId,
    defenderId: 'd' as WarriorId,
    reasonCodes: ['AI_INTENT_PROBE'],
  },
  {
    exchangeIndex: 1,
    minute: 1,
    attackerId: 'a' as WarriorId,
    defenderId: 'd' as WarriorId,
    reasonCodes: ['AI_INTENT_PRESS', 'CAUSE_LETHAL'],
  },
  {
    exchangeIndex: 5,
    minute: 3,
    attackerId: 'd' as WarriorId,
    defenderId: 'a' as WarriorId,
    reasonCodes: ['AI_INTENT_FINISH'],
  },
];

describe('AIDebugDrawer (H.3)', () => {
  afterEach(() => {
    (globalThis as { __AI_DEBUG?: boolean }).__AI_DEBUG = undefined;
  });

  it('renders nothing when __AI_DEBUG is off', () => {
    const { container } = render(<AIDebugDrawer exchangeLog={entries} />);
    expect(container.firstChild).toBeNull();
  });

  it('lists AI_INTENT_* reason codes per exchange when the dev flag is on', () => {
    (globalThis as { __AI_DEBUG?: boolean }).__AI_DEBUG = true;
    render(<AIDebugDrawer exchangeLog={entries} />);
    expect(screen.getByText(/AI_INTENT_PROBE/)).toBeInTheDocument();
    expect(screen.getByText(/AI_INTENT_PRESS/)).toBeInTheDocument();
    expect(screen.getByText(/AI_INTENT_FINISH/)).toBeInTheDocument();
    // Non-intent codes still render — the drawer is a telemetry dump, not a filter
    expect(screen.getByText(/CAUSE_LETHAL/)).toBeInTheDocument();
  });

  it('renders an honest empty state under the flag when there is no telemetry', () => {
    (globalThis as { __AI_DEBUG?: boolean }).__AI_DEBUG = true;
    render(<AIDebugDrawer exchangeLog={[]} />);
    expect(screen.getByText(/no telemetry/i)).toBeInTheDocument();
  });

  it('shows committed plan values and mask flags beside the exchange log', () => {
    (globalThis as { __AI_DEBUG?: boolean }).__AI_DEBUG = true;
    const wA = makeWarrior({
      name: 'Alpha',
      plan: { OE: 8, AL: 3, killDesire: 5 } as never,
    });
    const wD = makeWarrior({
      name: 'Delta',
      plan: { OE: 2, AL: 9, killDesire: 4 } as never,
      planMasked: true,
    });
    render(<AIDebugDrawer exchangeLog={entries} warriorA={wA} warriorD={wD} />);
    expect(screen.getByTestId('ai-plan-a')).toHaveTextContent(/OE 8.*AL 3/);
    expect(screen.getByTestId('ai-plan-d')).toHaveTextContent(/OE 2.*AL 9/);
    expect(screen.getByTestId('ai-plan-d')).toHaveTextContent(/masked/i);
    expect(screen.getByTestId('ai-plan-a')).not.toHaveTextContent(/masked/i);
  });

  it('pairs scout-belief bands with the committed plan when reports exist', () => {
    (globalThis as { __AI_DEBUG?: boolean }).__AI_DEBUG = true;
    const wA = makeWarrior({ name: 'Alpha', plan: { OE: 8, AL: 3 } as never });
    const wD = makeWarrior({ name: 'Delta', plan: { OE: 2, AL: 9 } as never });
    const scoutReports = [
      {
        id: 'r1',
        warriorName: 'Delta',
        style: 'LungingAttack',
        quality: 'Expert',
        week: 4,
        attributeRanges: {},
        record: '5W-1L',
        knownInjuries: [],
        suspectedOE: 'Low',
        suspectedAL: 'High',
        notes: '',
      },
    ] as never;
    render(
      <AIDebugDrawer exchangeLog={[]} warriorA={wA} warriorD={wD} scoutReports={scoutReports} />
    );
    expect(screen.getByTestId('ai-plan-d')).toHaveTextContent(/scouted.*low/i);
  });
});
