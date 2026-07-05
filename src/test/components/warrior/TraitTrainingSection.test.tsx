// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId, Trainer } from '@/types/shared.types';
import type { TrainingAssignment } from '@/types/state.types';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TraitTrainingSection } from '@/components/warrior/TraitTrainingSection';

vi.mock('@/engine/training/trainingGains/traitTraining', () => ({
  traitTrainingPool: vi.fn(() => []),
  canAcquireTrait: vi.fn(() => true),
  TRAIT_CAP: 3,
  TRAIT_TRAIN_WEEKS: 4,
}));

vi.mock('@/components/warrior/traits/TraitBadge', () => ({
  TraitBadge: ({ traitId }: { traitId: string }) => (
    <span data-testid={`trait-badge-${traitId}`}>{traitId}</span>
  ),
}));

function makeWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: 'w1' as WarriorId,
    name: 'Spartacus',
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    baseSkills: { ATT: 10, DEF: 10, INI: 10, PAR: 10, RIP: 10, DEC: 10 },
    derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 0 },
    injuries: [],
    career: { wins: 5, losses: 3, kills: 1 },
    fame: 7,
    popularity: 3,
    titles: [],
    flair: [],
    champion: false,
    status: 'Active',
    age: 24,
    fatigue: 0,
    traits: [],
    ...overrides,
  } as Warrior;
}

const trainers: Trainer[] = [
  { id: 't1', name: 'Coach Bob', tier: 'Novice', focus: 'Aggression', fame: 10, age: 45, contractWeeksLeft: 10 },
  { id: 't2', name: 'Coach Alice', tier: 'Master', focus: 'Defense', fame: 50, age: 55, contractWeeksLeft: 10 },
];

function renderSection(props: {
  warrior?: Warrior;
  assignment?: TrainingAssignment | undefined;
  isRecovery?: boolean;
  onAssignTraitTraining?: (trainerId: string) => void;
  onClear?: () => void;
} = {}) {
  return render(
    <TooltipProvider>
      <TraitTrainingSection
        warrior={props.warrior ?? makeWarrior()}
        assignment={props.assignment}
        isRecovery={props.isRecovery ?? false}
        trainers={trainers}
        onAssignTraitTraining={props.onAssignTraitTraining}
        onClear={props.onClear}
      />
    </TooltipProvider>
  );
}

describe('TraitTrainingSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trait training section when onAssignTraitTraining provided and traitSlotsLeft > 0', () => {
    const { container } = renderSection({ onAssignTraitTraining: vi.fn() });
    expect(container.textContent).toContain('Trait');
  });

  it('does not render when traitSlotsLeft === 0', () => {
    const warrior = makeWarrior({ traits: ['t1', 't2', 't3'] });
    const { container } = renderSection({ warrior, onAssignTraitTraining: vi.fn() });
    expect(container.textContent).not.toContain('Begin Trait Training');
  });

  it('does not render when isRecovery is true', () => {
    const { container } = renderSection({ isRecovery: true, onAssignTraitTraining: vi.fn() });
    expect(container.textContent).not.toContain('Begin Trait Training');
  });

  it('shows In Progress state when isTraitTraining is true', () => {
    const assignment: TrainingAssignment = {
      warriorId: 'w1' as WarriorId,
      type: 'trait',
      trainerId: 't1',
      weeksRemaining: 3,
    };
    const { container } = renderSection({ assignment, onAssignTraitTraining: vi.fn() });
    expect(container.textContent).toContain('In Progress');
  });

  it('shows cancel button when trait training is in progress', () => {
    const onClear = vi.fn();
    const assignment: TrainingAssignment = {
      warriorId: 'w1' as WarriorId,
      type: 'trait',
      trainerId: 't1',
      weeksRemaining: 3,
    };
    const { getByText } = renderSection({ assignment, onAssignTraitTraining: vi.fn(), onClear });
    expect(getByText('CANCEL')).toBeTruthy();
  });

  it('calls onClear when cancel button clicked', () => {
    const onClear = vi.fn();
    const assignment: TrainingAssignment = {
      warriorId: 'w1' as WarriorId,
      type: 'trait',
      trainerId: 't1',
      weeksRemaining: 3,
    };
    const { getByText } = renderSection({ assignment, onAssignTraitTraining: vi.fn(), onClear });
    fireEvent.click(getByText('CANCEL'));
    expect(onClear).toHaveBeenCalled();
  });

  it('shows trainer select dropdown when not in progress', () => {
    const { container } = renderSection({ onAssignTraitTraining: vi.fn() });
    const select = container.querySelector('select');
    expect(select).toBeTruthy();
  });

  it('shows Begin Trait Training button when trainer selected and pool non-empty', async () => {
    const { traitTrainingPool } = await import('@/engine/training/trainingGains/traitTraining');
    vi.mocked(traitTrainingPool).mockReturnValue([
      { id: 'brave', name: 'Brave', tier: 'Common', sign: 'positive', weight: 1 } as any,
    ]);
    const { container } = renderSection({ onAssignTraitTraining: vi.fn() });
    const select = container.querySelector('select')!;
    fireEvent.change(select, { target: { value: 't1' } });
    expect(container.textContent).toContain('Begin Trait Training');
  });

  it('shows No reachable traits message when trainer selected and pool empty', async () => {
    const { traitTrainingPool } = await import('@/engine/training/trainingGains/traitTraining');
    vi.mocked(traitTrainingPool).mockReturnValue([]);
    const { container } = renderSection({ onAssignTraitTraining: vi.fn() });
    const select = container.querySelector('select')!;
    fireEvent.change(select, { target: { value: 't1' } });
    expect(container.textContent).toContain('No reachable traits');
  });

  it('calls onAssignTraitTraining with selected trainer id', async () => {
    const onAssign = vi.fn();
    const { traitTrainingPool } = await import('@/engine/training/trainingGains/traitTraining');
    vi.mocked(traitTrainingPool).mockReturnValue([
      { id: 'brave', name: 'Brave', tier: 'Common', sign: 'positive', weight: 1 } as any,
    ]);
    const { container, getByText } = renderSection({ onAssignTraitTraining: onAssign });
    const select = container.querySelector('select')!;
    fireEvent.change(select, { target: { value: 't1' } });
    fireEvent.click(getByText(/Begin Trait Training/));
    expect(onAssign).toHaveBeenCalledWith('t1');
  });
});
