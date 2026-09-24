// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OfferCard } from '@/pages/BookingOffice/components/OfferCard';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { WarriorId } from '@/types/shared.types';
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

describe('OfferCard Council Badges (Task 4.2)', () => {
  it('renders Council Pick badge when isCouncilPick is true', () => {
    const offer = makeOffer();
    render(<OfferCard offer={offer} {...baseProps} isCouncilPick={true} />);

    const badge = screen.getByTestId('council-pick-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/Council Pick/i);
  });

  it('renders Council Warning badge when councilWarning is present and not picked', () => {
    const offer = makeOffer();
    render(
      <OfferCard
        offer={offer}
        {...baseProps}
        isCouncilPick={false}
        councilWarning="High Lethality Hazard"
      />
    );

    const badge = screen.getByTestId('council-warning-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/High Lethality Hazard/i);
  });

  it('does not render Council Warning when isCouncilPick is true even if warning passed', () => {
    const offer = makeOffer();
    render(
      <OfferCard
        offer={offer}
        {...baseProps}
        isCouncilPick={true}
        councilWarning="Minor Style Disadvantage"
      />
    );

    expect(screen.getByTestId('council-pick-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('council-warning-badge')).not.toBeInTheDocument();
  });
});

describe('OfferCard signed-state derivation', () => {
  it('shows the signed banner when the offer status is Signed, even without a local click', () => {
    const offer = makeOffer({
      status: 'Signed',
      responses: { 'pw-1': 'Accepted', 'rw-1': 'Accepted' } as BoutOffer['responses'],
    });
    render(<OfferCard offer={offer} {...baseProps} />);

    expect(screen.getByText(/Offer Accepted/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /accept offer/i })).not.toBeInTheDocument();
  });

  it('shows the signed banner when the player response is already Accepted (council/autopilot)', () => {
    // The council autopilot accepts offers outside the Booking Office — the
    // local signedOfferIds click-tracker is empty, but the persisted response
    // must still render the signed banner.
    const offer = makeOffer({
      status: 'Proposed',
      responses: { 'pw-1': 'Accepted', 'rw-1': 'Pending' } as BoutOffer['responses'],
    });
    render(<OfferCard offer={offer} {...baseProps} />);

    expect(screen.getByText(/Offer Accepted/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /accept offer/i })).not.toBeInTheDocument();
  });
});
