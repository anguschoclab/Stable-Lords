/**
 * RootComponent — verifies narrowed ftueComplete selector prevents
 * re-renders when unrelated store state changes.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Mock router
vi.mock('@tanstack/react-router', () => ({
  createRootRoute: (opts: any) => opts,
  Outlet: () => <div data-testid="outlet">Outlet</div>,
  useLocation: () => ({ pathname: '/' }),
}));

// Mock React.lazy to return component directly (no Suspense needed)
vi.mock('react', async () => {
  const react = await import('react');
  return {
    ...react,
    lazy: (loader: any) => {
      const Comp = (props: any) => {
        const [C, setC] = react.useState(null);
        react.useEffect(() => {
          loader().then((m: any) => setC(() => m.default));
        }, []);
        if (!C) return null;
        return react.createElement(C, props);
      };
      return Comp;
    },
  };
});

// Mock lazy components
vi.mock('@/pages/StartGame', () => ({
  default: () => <div data-testid="start-game">StartGame</div>,
}));
vi.mock('@/pages/Orphanage', () => ({
  default: () => <div data-testid="orphanage">Orphanage</div>,
}));
vi.mock('@/components/ResolutionReveal', () => ({
  default: () => null,
}));
vi.mock('@/components/AppShell', () => ({
  default: ({ children }: any) => <div data-testid="app-shell">{children}</div>,
}));
vi.mock('@/pages/NotFound', () => ({
  default: () => <div>NotFound</div>,
}));

// Mock hooks
vi.mock('@/hooks/useCoachTip', () => ({
  useCoachTip: vi.fn(),
}));
vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));
vi.mock('@/hooks/useDeathNotifications', () => ({
  useDeathNotifications: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useTestStore: any = create<TestStore>()(
  immer((set) => ({
    ftueComplete: false,
    atTitleScreen: false,
    treasury: 0,
    toggleEventLog: vi.fn(),
    setState: (fn: any) => set(fn),
  }))
);

// Mock useGameStore
vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: any) => {

    return useTestStore(selector);
  },
  useWorldState: () => {

    return useTestStore();
  },
}));

interface TestStore {
  ftueComplete: boolean;
  atTitleScreen: boolean;
  treasury: number;
  toggleEventLog: () => void;
  setState: (fn: (draft: TestStore) => void) => void;
}


import { Route } from '@/routes/__root';

const RootComponent = (Route as any).component as React.FC;

describe('RootComponent narrowed selector', () => {
  beforeEach(() => {
    useTestStore.setState({
      ftueComplete: false,
      atTitleScreen: false,
      treasury: 0,
      toggleEventLog: vi.fn(),
    });
  });

  it('renders Orphanage when ftueComplete is false', async () => {
    useTestStore.setState({ ftueComplete: false, atTitleScreen: false });
    const { getByTestId, queryByTestId } = render(
      <React.Suspense fallback={null}><RootComponent /></React.Suspense>
    );
    await waitFor(() => expect(getByTestId('orphanage')).toBeInTheDocument());
    expect(queryByTestId('app-shell')).not.toBeInTheDocument();
  });

  it('renders StartGame when atTitleScreen is true', async () => {
    useTestStore.setState({ atTitleScreen: true });
    const { getByTestId, queryByTestId } = render(
      <React.Suspense fallback={null}><RootComponent /></React.Suspense>
    );
    await waitFor(() => expect(getByTestId('start-game')).toBeInTheDocument());
    expect(queryByTestId('orphanage')).not.toBeInTheDocument();
  });

  it('renders AppShell when ftueComplete is true and not at title screen', async () => {
    useTestStore.setState({ ftueComplete: true, atTitleScreen: false });
    const { getByTestId, queryByTestId } = render(
      <React.Suspense fallback={null}><RootComponent /></React.Suspense>
    );
    await waitFor(() => expect(getByTestId('app-shell')).toBeInTheDocument());
    expect(queryByTestId('orphanage')).not.toBeInTheDocument();
  });

  it('does NOT re-render when unrelated state (treasury) changes', async () => {
    useTestStore.setState({ ftueComplete: true, atTitleScreen: false });

    const renderCount = { current: 0 };
    const Wrapper = () => {
      renderCount.current++;
      return (
        <React.Suspense fallback={null}>
          <RootComponent />
        </React.Suspense>
      );
    };

    render(<Wrapper />);
    await waitFor(() => expect(renderCount.current).toBeGreaterThanOrEqual(1));
    const countAfterMount = renderCount.current;

    await act(async () => {
      useTestStore.getState().setState((draft: any) => {
        draft.treasury += 100;
      });
    });

    // treasury is not in the narrowed selector, so no re-render
    expect(renderCount.current).toBe(countAfterMount);
  });
});
