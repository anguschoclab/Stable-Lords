// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminTools from '@/pages/AdminTools';
import '@/test/_setup/setup';

// Mock useGameStore to avoid store initialization issues
vi.mock('@/state/useGameStore', async (importOriginal) => {
  const actual = (await importOriginal()) as object;
  return {
    ...actual,
    useGameStore: () => ({
      roster: [],
      newsletter: [],
      ledger: [],
      matchHistory: [],
      moodHistory: [],
      graveyard: [],
      retired: [],
      week: 1,
      season: 'Spring',
      year: 1,
      treasury: 500,
      tournaments: [],
      rivals: [],
      arenaHistory: [],
      trainers: [],
      trainingAssignments: [],
      fame: 0,
      ftueComplete: false,
      player: {
        id: 'p1',
        name: 'Player',
        stableName: "Dragon's Hearth",
        fame: 0,
        renown: 0,
        titles: 0,
      },
      setState: vi.fn(),
      doAdvanceWeek: vi.fn().mockResolvedValue(undefined),
      doReset: vi.fn(),
    }),
    reconstructGameState: vi.fn((s: any) => s),
  };
});

describe('AdminTools Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all administrative panels', () => {
    render(<AdminTools />);

    // Check main title (eyebrow and title both say "Administration")
    expect(screen.getAllByText('Administration').length).toBeGreaterThan(0);

    // Check category nav labels are visible
    expect(screen.getByText('System')).toBeDefined();
    expect(screen.getByText('World')).toBeDefined();
    expect(screen.getByText('Telemetry')).toBeDefined();
  });

  it('provides buttons for time skipping', () => {
    render(<AdminTools />);

    // Navigate to the WORLD category tab
    fireEvent.click(screen.getByText('World'));

    const skipWeekBtn = screen.getByRole('button', { name: /Advance 1 Week/i });
    expect(skipWeekBtn).toBeDefined();

    const skipSeasonBtn = screen.getByRole('button', { name: /Advance Season/i });
    expect(skipSeasonBtn).toBeDefined();

    // Test skip week fires without crashing
    fireEvent.click(skipWeekBtn);
  });

  it('provides button for hard reset', () => {
    render(<AdminTools />);

    // The SYSTEM tab (default) shows the Delete All Data button
    const resetBtn = screen.getByRole('button', { name: /Delete All Data/i });
    expect(resetBtn).toBeDefined();
  });

  it('provides button to skip FTUE', () => {
    render(<AdminTools />);

    // Navigate to the WORLD category tab
    fireEvent.click(screen.getByText('World'));

    const skipFtueBtn = screen.getByRole('button', { name: /Bypass FTUE/i });
    expect(skipFtueBtn).toBeDefined();

    // Clicking it should not throw
    fireEvent.click(skipFtueBtn);
  });

  it('renders a JSON state dump', () => {
    render(<AdminTools />);

    // Navigate to Telemetry tab
    fireEvent.click(screen.getByText('Telemetry'));

    // The dump uses nested keys: temporal.week and inventory.treasury
    expect(screen.getByText(/"week":/)).toBeDefined();
    expect(screen.getByText(/"treasury":/)).toBeDefined();
  });
});
