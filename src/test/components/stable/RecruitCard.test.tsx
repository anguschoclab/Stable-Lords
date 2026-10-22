// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { PoolWarrior } from '@/engine/recruitment/recruitment';
import type { PotentialScoutReport } from '@/engine/recruitment/recruitScouting';
import { makePoolWarrior as fixturePoolWarrior } from '@/test/_fixtures/factories';

vi.mock('@/components/ui/Surface', () => ({ ...__SHARED_MOCKS.uiSurface }));

vi.mock('@/components/ui/ImperialRing', () => ({ ...__SHARED_MOCKS.uiImperialRing }));

vi.mock('@/components/ui/WarriorBadges', () => ({
  StatBadge: ({ styleName }: { styleName: string }) => (
    <span data-testid="stat-badge">{styleName}</span>
  ),
}));

vi.mock('@/components/ui/badge', () => __SHARED_MOCKS.uiBadge);

vi.mock('@/components/ui/tooltip', () => ({ ...__SHARED_MOCKS.tooltip }));
vi.mock('@/components/avatar', () => ({
  AvatarForEntity: () => <div data-testid="recruit-avatar" />,
}));

import { RecruitCard } from '@/components/stable/RecruitCard';

function makePoolWarrior(overrides: Partial<PoolWarrior> = {}): PoolWarrior {
  return fixturePoolWarrior({
    id: 'pw1',
    name: 'TestRecruit',
    potential: { ST: 20, CN: 20, SZ: 10, WT: 20, WL: 20, SP: 20, DF: 20 },
    ...overrides,
  });
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
  it('renders a small avatar for the recruit', () => {
    const { getByTestId } = render(
      <RecruitCard {...baseProps} warrior={makePoolWarrior()} isScouted={false} />
    );
    expect(getByTestId('recruit-avatar')).toBeInTheDocument();
  });

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
