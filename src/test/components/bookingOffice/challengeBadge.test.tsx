// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OfferCard } from '@/pages/BookingOffice/components/OfferCard';
import type { StableId } from '@/types/shared.types';
import { makeOffer, makeOfferCardProps } from '@/test/_fixtures/offerCard';

vi.mock('@/components/bookmarks/BookmarkButton', () => ({ ...__SHARED_MOCKS.bookmarkButton }));
vi.mock('@/components/bout-viewer/FightForecastPanel', () => ({ ...__SHARED_MOCKS.fightForecast }));
vi.mock('@/engine/narrative/fightForecast', () => ({ ...__SHARED_MOCKS.fightForecastEngine }));

const baseProps = makeOfferCardProps();

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
