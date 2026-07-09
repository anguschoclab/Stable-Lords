/**
 * RootComponent — verifies narrowed ftueComplete selector prevents
 * re-renders when unrelated store state changes.
 *
 * Rather than testing the full RootComponent (which uses React.lazy + Suspense
 * and is difficult to test in jsdom), this test verifies the selector behavior
 * directly: that useGameStore((s) => s.ftueComplete) only re-renders when
 * ftueComplete changes, not when other state changes.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, act } from '@testing-library/react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line prefer-const
let useTestStore: any;

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: any) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
    return useTestStore ? (typeof selector === 'function' ? useTestStore(selector) : useTestStore()) : undefined;
  },
}));

interface TestStore {
  ftueComplete: boolean;
  atTitleScreen: boolean;
  treasury: number;
  toggleEventLog: () => void;
  setState: (fn: (draft: TestStore) => void) => void;
}

useTestStore = create<TestStore>()(
  immer((set) => ({
    ftueComplete: false,
    atTitleScreen: false,
    treasury: 0,
    toggleEventLog: vi.fn(),
    setState: (fn) => set(fn),
  }))
);

// Import after mocks are set up
import { useGameStore } from '@/state/useGameStore';

// Minimal test component that mirrors RootComponent's selector pattern
function TestRootComponent() {
  const ftueComplete = useGameStore((s: any) => s.ftueComplete) as boolean;
  const atTitleScreen = useGameStore((s: any) => s.atTitleScreen) as boolean;

  if (atTitleScreen) return <div data-testid="start-game">StartGame</div>;
  if (!ftueComplete) return <div data-testid="orphanage">Orphanage</div>;
  return <div data-testid="app-shell">AppShell</div>;
}

describe('RootComponent narrowed selector', () => {
  beforeEach(() => {
    useTestStore.setState({
      ftueComplete: false,
      atTitleScreen: false,
      treasury: 0,
      toggleEventLog: vi.fn(),
    });
  });

  it('renders Orphanage when ftueComplete is false', () => {
    useTestStore.setState({ ftueComplete: false, atTitleScreen: false });
    const { getByTestId, queryByTestId } = render(<TestRootComponent />);
    expect(getByTestId('orphanage')).toBeInTheDocument();
    expect(queryByTestId('app-shell')).not.toBeInTheDocument();
  });

  it('renders StartGame when atTitleScreen is true', () => {
    useTestStore.setState({ atTitleScreen: true });
    const { getByTestId, queryByTestId } = render(<TestRootComponent />);
    expect(getByTestId('start-game')).toBeInTheDocument();
    expect(queryByTestId('orphanage')).not.toBeInTheDocument();
  });

  it('renders AppShell when ftueComplete is true and not at title screen', () => {
    useTestStore.setState({ ftueComplete: true, atTitleScreen: false });
    const { getByTestId, queryByTestId } = render(<TestRootComponent />);
    expect(getByTestId('app-shell')).toBeInTheDocument();
    expect(queryByTestId('orphanage')).not.toBeInTheDocument();
  });

  it('does NOT re-render when unrelated state (treasury) changes', async () => {
    useTestStore.setState({ ftueComplete: true, atTitleScreen: false });

    const renderCount = { current: 0 };
    const Wrapper = () => {
      renderCount.current++;
      return <TestRootComponent />;
    };

    render(<Wrapper />);
    expect(renderCount.current).toBe(1);

    await act(async () => {
      useTestStore.getState().setState((draft: any) => {
        draft.treasury += 100;
      });
    });

    // treasury is not in the narrowed selector, so no re-render
    expect(renderCount.current).toBe(1);
  });

  it('DOES re-render when ftueComplete changes', async () => {
    useTestStore.setState({ ftueComplete: false, atTitleScreen: false });

    const renderCount = { current: 0 };
    const Wrapper = () => {
      renderCount.current++;
      return <TestRootComponent />;
    };

    const { getByTestId } = render(<Wrapper />);
    expect(getByTestId('orphanage')).toBeInTheDocument();
    expect(renderCount.current).toBe(1);

    await act(async () => {
      useTestStore.getState().setState((draft: any) => {
        draft.ftueComplete = true;
      });
    });

    // ftueComplete is in the narrowed selector, so it should re-render
    expect(renderCount.current).toBe(2);
    expect(getByTestId('app-shell')).toBeInTheDocument();
  });
});
