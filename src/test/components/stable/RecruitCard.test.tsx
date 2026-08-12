// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { PoolWarrior, RecruitTier } from '@/engine/recruitment';
import type { PotentialScoutReport } from '@/engine/recruitScouting';
import type { FightingStyle } from '@/types/shared.types';
import type { Attributes, BaseSkills, DerivedStats } from '@/types/game';

vi.mock('@/components/ui/Surface', () => ({
  Surface: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/ImperialRing', () => ({
  ImperialRing: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/WarriorBadges', () => ({
  StatBadge: ({ styleName }: { styleName: string }) => (
    <span data-testid="stat-badge">{styleName}</span>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => (
    <span data-testid="badge" className={className}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => children,
  TooltipTrigger: ({ children }: any) => children,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => children,
}));

import { RecruitCard } from '@/components/stable/RecruitCard';

const baseAttrs: Attributes = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
const baseSkills: BaseSkills = { ATT: 10, DEF: 10, INI: 10, PAR: 10, RIP: 10, DEC: 10 };
const derivedStats: DerivedStats = { hp: 100, endurance: 100, damage: 5, encumbrance: 0 };

function makePoolWarrior(overrides: Partial<PoolWarrior> = {}): PoolWarrior {
  return {
    id: 'pw1',
    name: 'TestRecruit',
    style: 'StrikingAttack' as FightingStyle,
    attributes: { ...baseAttrs },
    potential: { ST: 20, CN: 20, SZ: 10, WT: 20, WL: 20, SP: 20, DF: 20 },
    baseSkills: { ...baseSkills },
    derivedStats: { ...derivedStats },
    tier: 'Common' as RecruitTier,
    cost: 50,
    age: 20,
    lore: 'A young fighter.',
    traits: [],
    addedWeek: 1,
    favorites: {
      weaponId: 'shortsword',
      rhythm: { oe: 5, al: 5 },
      discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
    },
    luckfactor: { ...baseSkills },
    ...overrides,
  };
}

const baseProps = {
  canAfford: true,
  rosterFull: false,
  onRecruit: vi.fn(),
  onScout: vi.fn(),
  canAffordScout: true,
  canAffordBonus: true,
};

describe('RecruitCard', () => {
  it('renders Scout [25G] button when unscouted', () => {
    const { container } = render(
      <RecruitCard {...baseProps} warrior={makePoolWarrior()} isScouted={false} />
    );
    expect(container.textContent).toContain('Scout');
    expect(container.textContent).toContain('25G');
  });

  it('disables Scout button when canAffordScout is false', () => {
    const { container } = render(
      <RecruitCard
        {...baseProps}
        warrior={makePoolWarrior()}
        isScouted={false}
        canAffordScout={false}
      />
    );
    const scoutBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Scout')
    );
    expect(scoutBtn).toBeDisabled();
  });

  it('does not render any potential grade letter (S/A/B/C/D) or POTENTIAL: label when unscouted', () => {
    const { container } = render(
      <RecruitCard {...baseProps} warrior={makePoolWarrior()} isScouted={false} />
    );
    expect(container.textContent).not.toMatch(/POTENTIAL:\s*[SABCDE]/i);
  });

  it('does not render any potential grade letter or POTENTIAL: label when scouted', () => {
    const scoutReport: PotentialScoutReport = {
      recruitId: 'pw1',
      week: 1,
      revealed: { ST: 20, CN: 20 },
      summary: 'Scouts confirm a ST ceiling of 20 (+1 more noted).',
    };
    const { container } = render(
      <RecruitCard {...baseProps} warrior={makePoolWarrior()} isScouted scoutReport={scoutReport} />
    );
    expect(container.textContent).not.toMatch(/POTENTIAL:\s*[SABCDE]/i);
  });

  it('renders scout report summary when scouted', () => {
    const scoutReport: PotentialScoutReport = {
      recruitId: 'pw1',
      week: 1,
      revealed: { ST: 20, CN: 20 },
      summary: 'Scouts confirm a ST ceiling of 20 (+1 more noted).',
    };
    const { container } = render(
      <RecruitCard {...baseProps} warrior={makePoolWarrior()} isScouted scoutReport={scoutReport} />
    );
    expect(container.textContent).toContain('Scouts confirm a ST ceiling of 20');
  });

  it('renders revealed attribute ceilings when scouted', () => {
    const scoutReport: PotentialScoutReport = {
      recruitId: 'pw1',
      week: 1,
      revealed: { ST: 22, WL: 18 },
      summary: 'Scouts confirm a ST ceiling of 22 (+1 more noted).',
    };
    const { container } = render(
      <RecruitCard {...baseProps} warrior={makePoolWarrior()} isScouted scoutReport={scoutReport} />
    );
    expect(container.textContent).toContain('ST');
    expect(container.textContent).toContain('22');
    expect(container.textContent).toContain('WL');
    expect(container.textContent).toContain('18');
  });

  it('renders Sign button and calls onRecruit with bonus=false', () => {
    const onRecruit = vi.fn();
    const { container } = render(
      <RecruitCard
        {...baseProps}
        onRecruit={onRecruit}
        warrior={makePoolWarrior()}
        isScouted={false}
      />
    );
    const signBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Sign')
    );
    expect(signBtn).toBeTruthy();
    fireEvent.click(signBtn!);
    expect(onRecruit).toHaveBeenCalledWith(expect.any(Object), false);
  });

  it('renders + Bonus [50G] button and calls onRecruit with bonus=true', () => {
    const onRecruit = vi.fn();
    const { container } = render(
      <RecruitCard
        {...baseProps}
        onRecruit={onRecruit}
        warrior={makePoolWarrior()}
        isScouted={false}
      />
    );
    const bonusBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Bonus')
    );
    expect(bonusBtn).toBeTruthy();
    fireEvent.click(bonusBtn!);
    expect(onRecruit).toHaveBeenCalledWith(expect.any(Object), true);
  });

  it('calls onScout when Scout button is clicked', () => {
    const onScout = vi.fn();
    const { container } = render(
      <RecruitCard {...baseProps} onScout={onScout} warrior={makePoolWarrior()} isScouted={false} />
    );
    const scoutBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Scout')
    );
    fireEvent.click(scoutBtn!);
    expect(onScout).toHaveBeenCalledWith(expect.any(Object));
  });
});
