/**
 * StableDetail performance tests — verify useShallow selector prevents
 * unnecessary re-renders when unrelated store state changes.
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import '@/test/_setup/setup';

interface TestStore {
  rivals: any[];
  arenaHistory: any[];
  week: number;
  treasury: number;
  crowdMood: string;
  setState: (fn: (draft: TestStore) => void) => void;
}

const useTestStore = create<TestStore>()(
  immer((set) => ({
    rivals: [],
    arenaHistory: [],
    week: 1,
    treasury: 1000,
    crowdMood: 'Normal',
    setState: (fn) => set(fn),
  }))
);

const RenderTracker = ({ renderCountRef }: { renderCountRef: React.MutableRefObject<number> }) => {
  const { rivals, arenaHistory } = useTestStore(
    useShallow((s) => ({ rivals: s.rivals, arenaHistory: s.arenaHistory }))
  );
  renderCountRef.current++;
  return (
    <div data-testid="render-tracker">
      <span data-testid="rivals-count">{rivals.length}</span>
      <span data-testid="history-count">{arenaHistory.length}</span>
    </div>
  );
};

describe('StableDetail useShallow optimization', () => {
  beforeEach(() => {
    useTestStore.setState({
      rivals: [],
      arenaHistory: [],
      week: 1,
      treasury: 1000,
      crowdMood: 'Normal',
    });
  });

  it('does not re-render when unrelated state changes', async () => {
    const renderCountRef = { current: 0 };
    render(<RenderTracker renderCountRef={renderCountRef} />);
    expect(renderCountRef.current).toBe(1);

    await act(async () => {
      useTestStore.getState().setState((draft) => {
        draft.week += 1;
      });
    });

    expect(renderCountRef.current).toBe(1);
  });

  it('does not re-render when treasury changes', async () => {
    const renderCountRef = { current: 0 };
    render(<RenderTracker renderCountRef={renderCountRef} />);
    expect(renderCountRef.current).toBe(1);

    await act(async () => {
      useTestStore.getState().setState((draft) => {
        draft.treasury -= 100;
      });
    });

    expect(renderCountRef.current).toBe(1);
  });

  it('does not re-render when crowdMood changes', async () => {
    const renderCountRef = { current: 0 };
    render(<RenderTracker renderCountRef={renderCountRef} />);
    expect(renderCountRef.current).toBe(1);

    await act(async () => {
      useTestStore.getState().setState((draft) => {
        draft.crowdMood = 'Bloodthirsty';
      });
    });

    expect(renderCountRef.current).toBe(1);
  });

  it('re-renders when rivals array changes', async () => {
    const renderCountRef = { current: 0 };
    render(<RenderTracker renderCountRef={renderCountRef} />);
    expect(renderCountRef.current).toBe(1);

    await act(async () => {
      useTestStore.getState().setState((draft) => {
        draft.rivals = [...draft.rivals, { id: 'rival-1' }];
      });
    });

    expect(renderCountRef.current).toBe(2);
  });

  it('re-renders when arenaHistory changes', async () => {
    const renderCountRef = { current: 0 };
    render(<RenderTracker renderCountRef={renderCountRef} />);
    expect(renderCountRef.current).toBe(1);

    await act(async () => {
      useTestStore.getState().setState((draft) => {
        draft.arenaHistory = [...draft.arenaHistory, { id: 'bout-1' }];
      });
    });

    expect(renderCountRef.current).toBe(2);
  });

  it('useShallow prevents re-render when same reference returned', async () => {
    const renderCountRef = { current: 0 };
    render(<RenderTracker renderCountRef={renderCountRef} />);
    expect(renderCountRef.current).toBe(1);

    await act(async () => {
      useTestStore.getState().setState((draft) => {
        // Modify rivals in-place (immer produces new state but the
        // useShallow selector returns the same array reference if
        // the array identity hasn't changed in the draft)
        draft.week = 99;
      });
    });

    expect(renderCountRef.current).toBe(1);
  });
});
