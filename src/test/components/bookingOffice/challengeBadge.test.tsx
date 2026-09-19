// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OfferCard } from '@/pages/BookingOffice/components/OfferCard';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { StableId, WarriorId } from '@/types/shared.types';
import type { BoutOffer } from '@/types/state.types';

vi.mock('@/components/bookmarks/BookmarkButton', () => ({
  BookmarkButton: () => <div data-testid="bookmark" />,
}));
vi.mock('@/components/bout-viewer/FightForecastPanel', () => ({
  FightForecastPanel: () => <div data-testid="forecast" />,
}));
vi.mock('@/engine/narrative/fightForecast', () => ({
  buildFightForecast: () => undefined,
}));

const playerWarrior = makeWarrior({ id: 'pw-1' as WarriorId, name: 'My Fighter' });

function makeOffer(over: Partial<BoutOffer> = {}): BoutOffer {
  return {
    id: 'offer-1' as BoutOffer['id'],
    promoterId: 'prom-1' as BoutOffer['promoterId'],
    warriorIds: [playerWarrior.id, 'rw-1' as WarriorId],
    boutWeek: 5,
    expirationWeek: 6,
    purse: 400,
    hype: 50,
    status: 'Proposed',
    responses: {},
    ...over,
  };
}

const baseProps = {
  promoters: { 'prom-1': { name: 'Grand Arena', tier: 'Major', personality: 'Showman' } },
  roster: [playerWarrior],
  rivalWarriorMap: {},
  signedOfferIds: new Set<string>(),
  onResponse: vi.fn(),
};

describe('OfferCard challenge badge (H.2)', () => {
  it('shows a Rival Challenge badge when the offer carries a rival proposerStableId', () => {
    const offer = makeOffer({ proposerStableId: 'rival-9' as StableId });
    render(<OfferCard offer={offer} {...baseProps} />);
    expect(screen.getByTestId('rival-challenge-badge')).toHaveTextContent(/rival challenge/i);
  });

  it('does not badge promoter-originated offers', () => {
    render(<OfferCard offer={makeOffer()} {...baseProps} />);
    expect(screen.queryByTestId('rival-challenge-badge')).not.toBeInTheDocument();
  });

  it('surfaces a countered offer with the demanded purse bump', () => {
    const offer = makeOffer({
      proposerStableId: 'rival-9' as StableId,
      counterPurseBump: 150,
    });
    render(<OfferCard offer={offer} {...baseProps} />);
    expect(screen.getByTestId('counter-offer-badge')).toHaveTextContent(/150/);
  });
});
