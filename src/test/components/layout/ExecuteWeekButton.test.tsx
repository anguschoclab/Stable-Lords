import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

let mockExecuteWeek = vi.fn();
let mockHandleStartAutosim = vi.fn();

vi.mock('@/hooks/useWeekExecution', () => ({
  useWeekExecution: vi.fn(),
}));

import { useGameStore } from '@/state/useGameStore';

import { ExecuteWeekButton } from '@/components/layout/ExecuteWeekButton';
import { useWeekExecution } from '@/hooks/useWeekExecution';

const defaultHookValue = () => ({
  executeWeek: (...args: any[]) => mockExecuteWeek(...args),
  running: false,
  results: [],
  clearResults: vi.fn(),
  fightReadyCount: 0,
  matchCardLength: 0,
  handleStartAutosim: (...args: any[]) => mockHandleStartAutosim(...args),
  autosimming: false,
  autosimProgress: null,
  autosimResult: null,
  setAutosimResult: vi.fn(),
  gameState: {} as any,
});

describe('ExecuteWeekButton', () => {
  beforeEach(async () => {
    mockExecuteWeek = vi.fn();
    mockHandleStartAutosim = vi.fn();
    vi.mocked(useWeekExecution).mockImplementation(defaultHookValue);
    // Reset store state back to defaults after async tests may have mutated it.
    // (vi.mock's importOriginal arg does not exist under bun:test — inject
    // state into the real store instead.)
    useGameStore.setState({ week: 5, isTournamentWeek: false, day: 0, isSimulating: false } as never);
  });

  it('renders "ADVANCE WEEK 5" with correct week number', () => {
    render(<ExecuteWeekButton />);
    expect(screen.getByText(/ADVANCE WEEK 5/i)).toBeTruthy();
  });

  it('renders "ADVANCE DAY" label when isTournamentWeek=true', async () => {
    useGameStore.setState({ week: 5, isTournamentWeek: true, day: 2, isSimulating: false } as never);
    render(<ExecuteWeekButton />);
    expect(screen.getByText(/ADVANCE DAY/i)).toBeTruthy();
  });

  it('renders loading state when running=true', () => {
    vi.mocked(useWeekExecution).mockReturnValue({
      ...defaultHookValue(),
      running: true,
    });
    render(<ExecuteWeekButton />);
    expect(screen.getByText(/Resolving/i)).toBeTruthy();
  });

  it('button is disabled when running=true', () => {
    vi.mocked(useWeekExecution).mockReturnValue({
      ...defaultHookValue(),
      running: true,
    });
    render(<ExecuteWeekButton />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('button is disabled when isSimulating=true', async () => {
    useGameStore.setState({ week: 5, isTournamentWeek: false, day: 0, isSimulating: true } as never);
    render(<ExecuteWeekButton />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('calls executeWeek when clicked', () => {
    render(<ExecuteWeekButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockExecuteWeek).toHaveBeenCalledOnce();
  });

  it('does not contain an anchor/link element', () => {
    render(<ExecuteWeekButton />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
