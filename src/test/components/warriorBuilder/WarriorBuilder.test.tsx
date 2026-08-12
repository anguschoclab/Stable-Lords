import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import WarriorBuilder from '@/components/WarriorBuilder';
import { CreateButton } from '@/components/WarriorBuilder/components/CreateButton';
import { SkillsPreview } from '@/components/WarriorBuilder/components/SkillsPreview';

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
  SkillBar: ({ label, value }: { label: string; value: number }) => <div>{label}: {value}</div>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('CreateButton', () => {
  it('renders without crashing', () => {
    const { container } = render(<CreateButton onClick={vi.fn()} disabled={false} status="valid" remaining={0} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    const { container } = render(<CreateButton onClick={vi.fn()} disabled={true} status="invalid" remaining={5} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders roster-full status', () => {
    const { container } = render(<CreateButton onClick={vi.fn()} disabled={true} status="roster-full" remaining={0} />);
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
