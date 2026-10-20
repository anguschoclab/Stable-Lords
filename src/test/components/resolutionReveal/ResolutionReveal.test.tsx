// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { GazetteStep } from '@/components/resolution-reveal/GazetteStep';
import { MathStep } from '@/components/resolution-reveal/MathStep';
import { InjuriesStep } from '@/components/resolution-reveal/InjuriesStep';
import { MemorialStep } from '@/components/resolution-reveal/MemorialStep';
import { BoutsStep } from '@/components/resolution-reveal/BoutsStep';
import ResolutionReveal from '@/components/ResolutionReveal';
import type { WarriorId } from '@/types/shared.types';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/scroll-area', () => ({ ...__SHARED_MOCKS.scrollArea }));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

vi.mock('@/components/BoutViewer', () => ({
  default: () => <div data-testid="bout-viewer">BoutViewer</div>,
}));

vi.mock('@/engine/narrative/fightAnalysis', () => ({
  buildFightAnalysis: () => ({ summary: 'test' }),
}));

let mockResolutionState: any;

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: (state: any) => unknown) =>
    selector ? selector(mockResolutionState) : mockResolutionState,
}));

vi.mock('@/lib/AudioManager', () => ({
  audioManager: { play: vi.fn() },
}));

vi.mock('@/data/narrative/uiMeta.json', () => ({
  default: {
    fanfare: {
      report_math: 'Math Report',
      report_combat: 'Combat Report',
      report_combat_empty: 'No bouts this week.',
      report_medical: 'Medical Report',
      gazette_empty: 'Nothing to report.',
      resolution_title: 'Week Results',
      btn_honor: 'Honor the Fallen',
      btn_planning: 'Planning Phase',
      btn_next: 'Next',
      memorial_title: 'In Memoriam',
      memorial_default: 'Fallen in combat.',
    },
    memorials: {
      tributes: ['The arena grows colder with the loss of {{name}}.'],
    },
    meta: { flair: {}, title: {}, injury: {}, status: {} },
    persona: { good: {}, bad: {}, descriptors: { coordination: {} } },
  },
}));

describe('GazetteStep', () => {
  it('renders without crashing with empty gazette', () => {
    const { container } = render(<GazetteStep gazette={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('MathStep', () => {
  it('renders without crashing with null report', () => {
    const { container } = render(<MathStep lastSimulationReport={undefined} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('InjuriesStep', () => {
  it('renders without crashing with empty data', () => {
    const { container } = render(<InjuriesStep injuries={[]} deaths={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders injury text when injuries present', () => {
    render(
      <InjuriesStep injuries={[{ id: 'w1' as WarriorId, name: 'Alice injured' }]} deaths={[]} />
    );
    expect(screen.getByText('Alice injured')).toBeInTheDocument();
  });
});

describe('MemorialStep', () => {
  it('renders without crashing with empty data', () => {
    const { container } = render(<MemorialStep deadWarriors={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('BoutsStep', () => {
  it('renders without crashing with empty bouts', () => {
    const { container } = render(<BoutsStep bouts={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('ResolutionReveal controller', () => {
  beforeEach(() => {
    mockResolutionState = {
      week: 3,
      graveyard: [],
      lastSimulationReport: undefined,
      arenaHistory: [
        {
          pendingResolutionData: {
            gazette: [],
            injuries: [],
            deaths: [],
            bouts: [],
          },
        },
      ],
      setState: (update: (draft: any) => void) => update(mockResolutionState),
    };
  });

  it('presents results as a labelled modal dialog', () => {
    render(<ResolutionReveal />);

    expect(screen.getByRole('dialog', { name: 'Week Results' })).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('dismisses the resolution with Escape after clearing pending data', () => {
    render(<ResolutionReveal />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(mockResolutionState.arenaHistory[0].pendingResolutionData).toBeUndefined();
  });
});
