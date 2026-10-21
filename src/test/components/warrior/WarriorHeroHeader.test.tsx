// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { WarriorId } from '@/types/shared.types';
import { makeSpartacusWarrior } from '@/test/_fixtures/factories';

vi.mock('@/components/ui/Surface', () => ({ ...__SHARED_MOCKS.uiSurface }));
vi.mock('@/components/ui/ImperialRing', () => ({ ...__SHARED_MOCKS.uiImperialRing }));
vi.mock('@/components/ui/EditableText', () => ({
  EditableText: ({ value }: any) => <span>{value}</span>,
}));
vi.mock('@/components/ui/WarriorBadges', () => ({
  TagBadge: ({ tag }: any) => <span>{tag}</span>,
}));
vi.mock('@/components/charts/FormSparkline', () => ({
  FormSparkline: () => <div data-testid="sparkline" />,
}));
vi.mock('@/state/useGameStore', () => ({
  useGameStore: vi.fn(() => vi.fn()),
}));
vi.mock('@/components/avatar', () => ({
  AvatarForEntity: () => <div data-testid="warrior-avatar" />,
  AvatarRerollButton: () => <button data-testid="avatar-reroll">Reroll</button>,
}));

import { WarriorHeroHeader } from '@/components/warrior/WarriorHeroHeader';

const makeWarrior = makeSpartacusWarrior;

describe('WarriorHeroHeader', () => {
  const baseProps = {
    warrior: makeWarrior() as any,
    record: '5W - 3L - 1K',
    streakLabel: null,
    streakVal: 0,
  };

  it('renders "Your Gladiator" for isPlayerOwned warrior', () => {
    render(<WarriorHeroHeader {...baseProps} isPlayerOwned={true} />);
    expect(screen.getByText('Your Gladiator')).toBeInTheDocument();
  });

  it('renders "Rival Gladiator" for non-owned warrior', () => {
    render(<WarriorHeroHeader {...baseProps} isPlayerOwned={false} />);
    expect(screen.getByText('Rival Gladiator')).toBeInTheDocument();
  });

  it('renders "Condition" ring label', () => {
    render(<WarriorHeroHeader {...baseProps} />);
    expect(screen.getByText('Condition')).toBeInTheDocument();
  });

  it('renders "Wounds" ring label', () => {
    render(<WarriorHeroHeader {...baseProps} />);
    expect(screen.getByText('Wounds')).toBeInTheDocument();
  });

  it('renders "Intel Acquired" when insightTokens are present for this warrior', () => {
    render(
      <WarriorHeroHeader
        {...baseProps}
        id="w1"
        insightTokens={[{ warriorId: 'w1' as WarriorId, type: 'weapon', revealed: true } as any]}
      />
    );
    expect(screen.getByText(/Intel Acquired/i)).toBeInTheDocument();
  });

  it('does not render "Intel Acquired" when no insight tokens', () => {
    render(<WarriorHeroHeader {...baseProps} id="w1" insightTokens={[]} />);
    expect(screen.queryByText(/Intel Acquired/i)).not.toBeInTheDocument();
  });

  it('renders derived arena crowns — current and former', () => {
    render(
      <WarriorHeroHeader
        {...baseProps}
        id="w1"
        arenaCrowns={{ current: ['Bloodsands Arena'], past: ['Mudpit Arena'] }}
      />
    );
    expect(screen.getByText(/Champion of Bloodsands Arena/)).toBeInTheDocument();
    expect(screen.getByText(/Former Champion of Mudpit Arena/)).toBeInTheDocument();
  });

  it('renders no crown badges when the warrior holds none', () => {
    render(<WarriorHeroHeader {...baseProps} id="w1" arenaCrowns={{ current: [], past: [] }} />);
    expect(screen.queryByText(/Champion of/)).not.toBeInTheDocument();
  });

  it('renders the warrior avatar and an owned-warrior reroll control', () => {
    const sourceWarrior = makeWarrior();
    render(
      <WarriorHeroHeader
        {...baseProps}
        id={sourceWarrior.id}
        sourceWarrior={sourceWarrior}
        isPlayerOwned
      />
    );
    expect(screen.getByTestId('warrior-avatar')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-reroll')).toBeInTheDocument();
  });

  it('does not render the reroll control for a rival warrior', () => {
    render(
      <WarriorHeroHeader {...baseProps} sourceWarrior={makeWarrior()} isPlayerOwned={false} />
    );
    expect(screen.getByTestId('warrior-avatar')).toBeInTheDocument();
    expect(screen.queryByTestId('avatar-reroll')).not.toBeInTheDocument();
  });
});
