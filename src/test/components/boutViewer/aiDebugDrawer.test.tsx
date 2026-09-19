// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIDebugDrawer } from '@/components/bout-viewer/AIDebugDrawer';
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
});
