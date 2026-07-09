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
import { render, act } from '@testing-library/react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

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

// Minimal test component that mirrors RootComponent's selector pattern
let testRenderCount = { current: 0 };
function TestRootComponent() {
  testRenderCount.current++;
  const ftueComplete = useTestStore((s: any) => s.ftueComplete) as boolean;
  const atTitleScreen = useTestStore((s: any) => s.atTitleScreen) as boolean;

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

    testRenderCount = { current: 0 };

    render(<TestRootComponent />);
    expect(testRenderCount.current).toBe(1);

    await act(async () => {
      useTestStore.setState({ treasury: 100 });
    });

    // treasury is not in the narrowed selector, so no re-render
    expect(testRenderCount.current).toBe(1);
  });

  it('DOES re-render when ftueComplete changes', async () => {
    useTestStore.setState({ ftueComplete: false, atTitleScreen: false });

    testRenderCount = { current: 0 };

    const { getByTestId } = render(<TestRootComponent />);
    expect(getByTestId('orphanage')).toBeInTheDocument();
    expect(testRenderCount.current).toBe(1);

    await act(async () => {
      useTestStore.setState({ ftueComplete: true });
    });

    // ftueComplete is in the narrowed selector, so it should re-render
    expect(testRenderCount.current).toBe(2);
    expect(getByTestId('app-shell')).toBeInTheDocument();
  });
});
