// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, renderHook, act } from '@testing-library/react';
import WarriorBuilder from '@/components/WarriorBuilder';
import { useWarriorBuilderState } from '@/components/WarriorBuilder/hooks/useWarriorBuilderState';
import { FIGHTER_CONCEPTS } from '@/data/fighterConcepts';
import { ATTRIBUTE_KEYS, STYLE_DISPLAY_NAMES } from '@/types/game';
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
      player: { crest: { primaryColor: '#111111', secondaryColor: '#222222' } },
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/components/avatar', () => ({
  Avatar: () => <div data-testid="builder-avatar" />,
}));
vi.mock('@/components/avatar/useAvatarCatalog', () => ({ useAvatarCatalog: () => true }));
vi.mock('@/engine/avatar/avatarGenerator', () => ({
  generateAvatar: () => ({
    seed: 1,
    entityType: 'warrior',
    gender: 'neutral',
    ageGroup: 'adult',
    primaryColor: '#111111',
    layers: [],
  }),
}));

vi.mock('@/components/warrior/WarriorStats', () => ({
  SkillBar: ({ label, value }: { label: string; value: number }) => (
    <div>
      {label}: {value}
    </div>
  ),
}));

vi.mock('@/components/ui/tooltip', () => ({ ...__SHARED_MOCKS.tooltip }));

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

vi.mock('@/engine/warrior/skillCalc', () => ({
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
    const { container, getByTestId } = render(<WarriorBuilder onCreateWarrior={vi.fn()} />);
    expect(container.firstChild).toBeInTheDocument();
    expect(getByTestId('builder-avatar')).toBeInTheDocument();
  });

  it('sanitizes markdown/HTML metacharacters out of created warrior names', () => {
    const onCreate = vi.fn();
    const { container, getByRole } = render(<WarriorBuilder onCreateWarrior={onCreate} />);
    const nameInput = container.querySelector('#warrior-name')!;
    fireEvent.change(nameInput, { target: { value: 'Evil](javascript:x)[n' } });
    fireEvent.click(getByRole('button', { name: /recruit warrior/i }));
    expect(onCreate).toHaveBeenCalledOnce();
    const created = onCreate.mock.calls[0]![0] as { name: string };
    expect(created.name).toBe('EVILJAVASCRIPTXN');
  });

  it('keeps Create disabled for symbol-only names', () => {
    const onCreate = vi.fn();
    const { container, getByRole } = render(<WarriorBuilder onCreateWarrior={onCreate} />);
    fireEvent.change(container.querySelector('#warrior-name')!, {
      target: { value: '<>:[](){}' },
    });
    expect(getByRole('button', { name: /name required/i })).toBeDisabled();
    expect(onCreate).not.toHaveBeenCalled();
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

describe('useWarriorBuilderState — fighter concept presets', () => {
  const hook = () =>
    renderHook(() =>
      useWarriorBuilderState({ onCreateWarrior: vi.fn(), maxRoster: 10, currentRosterSize: 0 })
    );

  it('applies the concept style and scaled spread', () => {
    const { result } = hook();
    const style = FightingStyle.AimedBlow;
    const concept = FIGHTER_CONCEPTS[style].concepts[0]!;
    act(() => result.current.applyConcept(style, concept));
    expect(result.current.style).toBe(style);
    expect(result.current.attrs).toEqual(concept.stats);
    expect(ATTRIBUTE_KEYS.reduce((s, k) => s + result.current.attrs[k], 0)).toBe(70);
  });

  it('copies the shared concept stats — slider edits never corrupt module data', () => {
    const { result } = hook();
    const style = FightingStyle.BashingAttack;
    const concept = FIGHTER_CONCEPTS[style].concepts[0]!;
    const before = concept.stats.ST;
    act(() => result.current.applyConcept(style, concept));
    act(() => result.current.updateAttr('ST', before === 25 ? 24 : before + 1));
    expect(concept.stats.ST).toBe(before);
  });

  it('makes the form valid once the warrior is named', () => {
    const { result } = hook();
    const style = FightingStyle.ParryRiposte;
    const concept = FIGHTER_CONCEPTS[style].concepts[0]!;
    act(() => result.current.setName('Preset Warrior'));
    act(() => result.current.applyConcept(style, concept));
    expect(result.current.isValid).toBe(true);
    expect(result.current.remaining).toBe(0);
  });
});

describe('IdentitySection', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <IdentitySection
        name="TestWarrior"
        style={FightingStyle.BashingAttack}
        actions={{ setName: vi.fn(), setStyle: vi.fn() }}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the fighter concept picker when applyConcept is provided', () => {
    const style = FightingStyle.AimedBlow;
    const concept = FIGHTER_CONCEPTS[style].concepts[0]!;
    const { getByText } = render(
      <IdentitySection
        name="TestWarrior"
        style={style}
        actions={{ setName: vi.fn(), setStyle: vi.fn(), applyConcept: vi.fn() }}
      />
    );
    expect(getByText('Fighter Concept')).toBeInTheDocument();
    expect(getByText(`${STYLE_DISPLAY_NAMES[style]} — ${concept.name}`)).toBeInTheDocument();
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
