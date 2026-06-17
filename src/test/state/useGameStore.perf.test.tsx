/**
 * useGameStore performance tests.
 * @vitest-environment jsdom
 */
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import '@/test/_setup/setup';

interface TestStore {
  treasury: number;
  week: number;
  crowdMood: string;
  setState: (fn: (draft: TestStore) => void) => void;
}

const useTestStore = create<TestStore>()(
  immer((set) => ({
    treasury: 0,
    week: 1,
    crowdMood: 'Normal',
    setState: (fn) => set(fn),
  }))
);

/**
 * Mock component that tracks renders via ref for performance testing.
 */
const RenderTracker = ({
  selector,
  renderCountRef,
}: {
  selector: (state: any) => any;
  renderCountRef: React.MutableRefObject<number>;
}) => {
  const value = useTestStore(selector);
  renderCountRef.current++;
  return <div data-testid="value">{JSON.stringify(value)}</div>;
};

describe('useGameStore Optimization (Epic 4)', () => {
  beforeEach(() => {
    localStorage.clear();
    useTestStore.setState({ treasury: 0, week: 1, crowdMood: 'Normal' });
  });

  it('re-renders when selected state changes', async () => {
    const renderCountRef = { current: 0 };
    const selector = (s: any) => s.treasury;

    render(<RenderTracker selector={selector} renderCountRef={renderCountRef} />);
    expect(renderCountRef.current).toBe(1);

    await act(async () => {
      useTestStore.getState().setState((draft: any) => {
        draft.treasury += 10;
      });
    });

    expect(renderCountRef.current).toBe(2);
  });

  it('does NOT re-render when unrelated state changes (with precise selector)', async () => {
    const renderCountRef = { current: 0 };
    const selector = (s: any) => s.treasury;

    render(<RenderTracker selector={selector} renderCountRef={renderCountRef} />);
    expect(renderCountRef.current).toBe(1);

    await act(async () => {
      useTestStore.getState().setState((draft: any) => {
        draft.week += 1;
      });
    });

    // Zustand with precise selector (returning primitive) should NOT re-render
    expect(renderCountRef.current).toBe(1);
  });

  it('requires useShallow for object-returning selectors to avoid extra renders', async () => {
    const renderCountWithShallow = { current: 0 };
    const selector = (s: any) => ({ treasury: s.treasury, week: s.week });

    const WithShallow = () => {
      const val = useTestStore(useShallow(selector));
      renderCountWithShallow.current++;
      return <div>{val.treasury}</div>;
    };

    render(<WithShallow />);

    expect(renderCountWithShallow.current).toBe(1);

    await act(async () => {
      useTestStore.getState().setState((draft: any) => {
        draft.crowdMood = 'Bloodthirsty';
      });
    });

    // WithShallow should NOT re-render because the returned object is shallowly equal
    expect(renderCountWithShallow.current).toBe(1);

    await act(async () => {
      useTestStore.getState().setState((draft: any) => {
        draft.treasury += 10;
      });
    });

    // WithShallow SHOULD re-render when selected values change
    expect(renderCountWithShallow.current).toBe(2);
  });
});
