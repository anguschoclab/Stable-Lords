// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

let viewportWidth = 768;
const pathname = '/stable';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useLocation: () => ({ pathname }),
  };
});

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: (query: string) => {
    const maxWidth = Number(query.match(/max-width:\s*(\d+)px/)?.[1]);
    return Number.isFinite(maxWidth) && viewportWidth <= maxWidth;
  },
}));

const shellState = vi.hoisted(() => ({
  week: 1,
  day: 1,
  isTournamentWeek: false,
  treasury: 900,
  fame: 5,
  crowdMood: 'neutral',
  weather: 'clear',
  doReset: vi.fn(),
  returnToTitle: vi.fn(),
  lastSavedAt: null,
  isSimulating: false,
  isInitialized: true,
  eventLogOpen: false,
  setEventLogOpen: vi.fn(),
  initialize: vi.fn(),
}));

vi.mock('@/state/useGameStore', () => {
  const useGameStore = (selector: (state: typeof shellState) => unknown) => selector(shellState);
  useGameStore.getState = () => shellState;
  return { useGameStore };
});

vi.mock('@/hooks/useRivalryAlerts', () => ({ useRivalryAlerts: vi.fn() }));
vi.mock('@/hooks/useAudioSync', () => ({ useAudioSync: vi.fn() }));
vi.mock('@/hooks/useWeekExecution', () => ({
  useWeekExecution: () => ({ results: null, clearResults: vi.fn() }),
}));

vi.mock('framer-motion', () => {
  const stripMotionProps = ({ children }: { children?: ReactNode }) => children;
  const motion = new Proxy(
    {},
    {
      get: () => stripMotionProps,
    }
  );
  return {
    AnimatePresence: stripMotionProps,
    motion,
  };
});

vi.mock('@/components/layout/LeftNav', () => ({
  LeftNav: () => <nav data-testid="left-nav" />,
}));
vi.mock('@/components/layout/MobileEventLogSheet', () => ({
  MobileEventLogSheet: () => <aside data-testid="mobile-event-log" />,
}));
vi.mock('@/components/layout/AppHeader', () => ({
  AppHeader: () => <header data-testid="app-header" />,
}));
vi.mock('@/components/EventLog', () => ({ default: () => <aside data-testid="event-log" /> }));
vi.mock('@/components/modals/DeathModal', () => ({ DeathModal: () => null }));
vi.mock('@/components/progression/WinScreen', () => ({ WinScreen: () => null }));
vi.mock('@/components/ui/CoachOverlay', () => ({ CoachOverlay: () => null }));
vi.mock('@/components/layout/TacticalBar', () => ({ TacticalBar: () => null }));
vi.mock('@/components/layout/ResetDialog', () => ({ ResetDialog: () => null }));
vi.mock('@/components/layout/ResultsBanner', () => ({ ResultsBanner: () => null }));

import AppShell from '@/components/AppShell';

describe('AppShell responsive boundary', () => {
  afterEach(() => cleanup());

  it('uses the compact navigation shell at the specified 768px mobile boundary', () => {
    viewportWidth = 768;
    render(<AppShell>content</AppShell>);

    expect(screen.queryByTestId('mobile-event-log')).not.toBeNull();
    expect(screen.getByTestId('left-nav').parentElement?.className).toContain('lg:flex');
    expect(screen.queryByText('content')).not.toBeNull();
  });

  it('uses the desktop navigation rail at 1024px', () => {
    viewportWidth = 1024;
    render(<AppShell>content</AppShell>);

    expect(screen.queryByTestId('left-nav')).not.toBeNull();
    expect(screen.queryByTestId('mobile-event-log')).toBeNull();
    expect(screen.queryByText('content')).not.toBeNull();
  });
});
