// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TooltipProvider } from '@/components/ui/tooltip';

const playback = vi.hoisted(() => ({
  visibleCount: 2,
  totalEvents: 4,
  isPlaying: false,
  isComplete: false,
  speed: 1,
  setSpeed: vi.fn(),
  reset: vi.fn(),
  skipToEnd: vi.fn(),
  togglePlay: vi.fn(),
}));

vi.mock('@/hooks/useBoutPlayback', () => ({ useBoutPlayback: () => playback }));
vi.mock('@/state/useGameStore', () => ({
  useArenaPreferences: () => ({ defaultViewMode: 'arena' }),
  useGameStore: (selector: any) =>
    selector
      ? selector({ scoutReports: {}, setArenaPreferences: vi.fn() })
      : { scoutReports: {}, setArenaPreferences: vi.fn() },
}));
vi.mock('@/components/arena/ArenaView', () => ({
  default: () => <div>Arena View</div>,
}));
vi.mock('@/components/arena/TacticalLogView', () => ({
  default: () => <div>Tactical Log View</div>,
}));
vi.mock('@/components/arena/HighlightLog', () => ({
  default: () => <div>Highlight Log</div>,
}));
vi.mock('@/components/bout-viewer/FightAnalysisPanel', () => ({
  FightAnalysisPanel: () => <div>Fight Analysis</div>,
}));
vi.mock('@/components/bout-viewer/CornerAnalysisPanel', () => ({
  CornerAnalysisPanel: () => <div>Corner Analysis</div>,
}));
vi.mock('@/components/bout-viewer/AIDebugDrawer', () => ({
  AIDebugDrawer: () => <div>AI Debug Drawer</div>,
}));

import BoutViewer from '@/components/BoutViewer';

const log = [
  { minute: 1, text: 'Opening exchange', type: 'attack' },
  { minute: 2, text: 'Counter', type: 'defense' },
] as any[];

function renderViewer() {
  return render(
    <TooltipProvider>
      <BoutViewer
        nameA="Aulus"
        nameD="Brutus"
        styleA="BashingAttack"
        styleD="TotalParry"
        log={log}
        winner={null}
        by={null}
      />
    </TooltipProvider>
  );
}

describe('BoutViewer controller', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(min-width: 768px)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it('exposes named live, highlight, and result/analysis regions', () => {
    renderViewer();

    expect(screen.getByRole('region', { name: /Live bout/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Bout highlights/i })).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: /Bout result and analysis/i })
    ).toBeInTheDocument();
  });

  it('uses instant scrolling when reduced motion is preferred', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    renderViewer();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'nearest' });
  });
});
