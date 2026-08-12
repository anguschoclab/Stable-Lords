import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import WarriorBuilder from '@/components/WarriorBuilder';
import { CreateButton } from '@/components/WarriorBuilder/components/CreateButton';
import { SkillsPreview } from '@/components/WarriorBuilder/components/SkillsPreview';
import { AttributeSliders } from '@/components/WarriorBuilder/components/AttributeSliders';
import { IdentitySection } from '@/components/WarriorBuilder/components/IdentitySection';
import { PhysicalsPreview } from '@/components/WarriorBuilder/components/PhysicalsPreview';
import { FightingStyle } from '@/types/game';

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      treasury: { gold: 1000 },
      roster: [],
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/components/warrior/WarriorStats', () => ({
  SkillBar: ({ label, value }: { label: string; value: number }) => (
    <div>
      {label}: {value}
    </div>
  ),
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/data/names', () => ({
  randomWarriorName: () => 'RandomWarrior',
}));

vi.mock('@/engine/skillCalc', () => ({
  DAMAGE_LABELS: { BashingAttack: 'Blunt' },
  computeWarriorStats: () => ({
    derivedStats: { hp: 20, endurance: 15, damage: 'BashingAttack', encumbrance: 5 },
    baseSkills: { ATT: 10, PAR: 5, DEF: 8, INI: 7, RIP: 3, DEC: 6 },
  }),
}));

describe('CreateButton', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <CreateButton onClick={vi.fn()} disabled={false} status="valid" remaining={0} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    const { container } = render(
      <CreateButton onClick={vi.fn()} disabled={true} status="invalid" remaining={5} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders roster-full status', () => {
    const { container } = render(
      <CreateButton onClick={vi.fn()} disabled={true} status="roster-full" remaining={0} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('SkillsPreview', () => {
  it('renders without crashing with skills', () => {
    const skills = { ATT: 10, PAR: 5, DEF: 8, INI: 7, RIP: 3, DEC: 6 };
    const { container } = render(<SkillsPreview baseSkills={skills} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('WarriorBuilder', () => {
  it('renders without crashing', () => {
    const { container } = render(<WarriorBuilder onCreateWarrior={vi.fn()} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('AttributeSliders', () => {
  it('renders without crashing', () => {
    const attrs = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 } as never;
    const { container } = render(
      <AttributeSliders attrs={attrs} updateAttr={vi.fn()} total={70} remaining={0} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('IdentitySection', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <IdentitySection
        name="TestWarrior"
        setName={vi.fn()}
        style={FightingStyle.BashingAttack}
        setStyle={vi.fn()}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('PhysicalsPreview', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <PhysicalsPreview hp={20} endurance={15} damage="Blunt" encumbrance={5} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders without damage value', () => {
    const { container } = render(
      <PhysicalsPreview hp={20} endurance={15} damage={undefined} encumbrance={5} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
