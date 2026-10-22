// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { GazetteStep } from '@/components/resolution-reveal/GazetteStep';
import { StewardStep } from '@/components/resolution-reveal/StewardStep';
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
      report_steward: "The Steward's Report",
      report_combat: 'Bout Results',
      report_combat_empty: 'No bouts this week.',
      report_medical: 'The Infirmary Report',
      report_gazette: 'The Weekly Gazette',
      report_steward_empty: 'No training gains or age marks this week.',
      gazette_empty: 'Nothing to report.',
      resolution_title: 'Week in Review',
      btn_honor: 'Honor the Fallen',
      btn_planning: 'Planning Phase',
      btn_next: 'Next',
      memorial_title: 'In Memoriam',
      memorial_default: 'Fallen in combat.',
      step_gazette: 'The Gazette',
      step_infirmary: 'The Infirmary',
      step_bouts: 'The Bouts',
      step_steward: "Steward's Report",
      step_memorial: 'The Graveyard',
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

describe('StewardStep', () => {
  it('renders without crashing with null report', () => {
    const { container } = render(<StewardStep stewardReport={undefined} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the steward title and empty-state copy when there is nothing to report', () => {
    render(<StewardStep stewardReport={undefined} />);
    expect(screen.getByText("The Steward's Report")).toBeInTheDocument();
    expect(screen.getByText('No training gains or age marks this week.')).toBeInTheDocument();
  });

  it('renders the empty-state copy when the report has no gains or aging events', () => {
    render(
      <StewardStep
        stewardReport={
          { treasuryChange: 0, trainingGains: [], agingEvents: [] } as never
        }
      />
    );
    expect(screen.getByText('No training gains or age marks this week.')).toBeInTheDocument();
  });

  it('lists training gains instead of the empty state when present', () => {
    render(
      <StewardStep
        stewardReport={
          {
            treasuryChange: 40,
            trainingGains: [{ warriorId: 'w1', warriorName: 'Alice', attr: 'ATK', gain: 2 }],
            agingEvents: [],
          } as never
        }
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('No training gains or age marks this week.')).not.toBeInTheDocument();
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

  it('renders both casualty sections when deaths and injuries present', () => {
    render(
      <InjuriesStep
        injuries={[{ id: 'w1' as WarriorId, name: 'Alice injured' }]}
        deaths={[{ id: 'w2' as WarriorId, name: 'Bob fell' }]}
      />
    );
    expect(screen.getByText('Fallen Warriors')).toBeInTheDocument();
    expect(screen.getByText('Bob fell')).toBeInTheDocument();
    expect(screen.getByText('Injured Roster')).toBeInTheDocument();
    expect(screen.getByText('Alice injured')).toBeInTheDocument();
  });

  it('renders neither casualty section when both lists are empty', () => {
    render(<InjuriesStep injuries={[]} deaths={[]} />);
    expect(screen.queryByText('Fallen Warriors')).not.toBeInTheDocument();
    expect(screen.queryByText('Injured Roster')).not.toBeInTheDocument();
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
      stewardReport: undefined,
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

    expect(screen.getByRole('dialog', { name: 'Week in Review' })).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('labels the step badges with their in-world report names', () => {
    render(<ResolutionReveal />);

    expect(screen.getByText('1. The Gazette')).toBeInTheDocument();
    expect(screen.getByText('2. The Infirmary')).toBeInTheDocument();
    expect(screen.getByText('3. The Bouts')).toBeInTheDocument();
    expect(screen.getByText("4. Steward's Report")).toBeInTheDocument();
    expect(screen.queryByText('5. The Graveyard')).not.toBeInTheDocument();
  });

  it('adds the graveyard badge only when the week produced deaths', () => {
    mockResolutionState.arenaHistory[0].pendingResolutionData.deaths = [
      { id: 'w9', name: 'Fallen One' },
    ];
    render(<ResolutionReveal />);

    expect(screen.getByText('5. The Graveyard')).toBeInTheDocument();
  });

  it('dismisses the resolution with Escape after clearing pending data', () => {
    render(<ResolutionReveal />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(mockResolutionState.arenaHistory[0].pendingResolutionData).toBeUndefined();
  });
});
