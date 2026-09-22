// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OfferActions } from '@/pages/BookingOffice/components/OfferActions';
import { OfferMatchupPanel } from '@/pages/BookingOffice/components/OfferMatchupPanel';
import { OfferCardHeader } from '@/pages/BookingOffice/components/OfferCardHeader';
import { OfferDetailsGrid } from '@/pages/BookingOffice/components/OfferDetailsGrid';
import { makeBoutOffer, makeWarrior } from '@/test/_fixtures/factories';
import { PERSONALITY_CONFIG } from '@/data/promoterPersonalityConfig';
import type { StableId, WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/state.types';

vi.mock('@/components/bookmarks/BookmarkButton', () => ({
  BookmarkButton: () => <div data-testid="bookmark-btn" />,
}));

const baseOffer = () => makeBoutOffer({ boutWeek: 8, purse: 420, hype: 55 });

const freshFatigue = { label: 'Fresh', color: 'text-emerald-400' };
const injuredBadge = { label: 'Injured', color: 'text-red-400' };

describe('OfferActions', () => {
  it('renders signed banner when isSigned', () => {
    render(
      <OfferActions isSigned={true} acceptDisabled={false} onAccept={vi.fn()} onDecline={vi.fn()} />
    );
    expect(screen.getByText('Offer Accepted')).toBeInTheDocument();
    expect(screen.queryByText('Accept Offer')).not.toBeInTheDocument();
  });

  it('wires accept and decline handlers', () => {
    const onAccept = vi.fn();
    const onDecline = vi.fn();
    render(
      <OfferActions
        isSigned={false}
        acceptDisabled={false}
        onAccept={onAccept}
        onDecline={onDecline}
      />
    );
    fireEvent.click(screen.getByText('Accept Offer'));
    fireEvent.click(screen.getAllByRole('button')[1]!);
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it('disables accept when acceptDisabled', () => {
    render(
      <OfferActions isSigned={false} acceptDisabled={true} onAccept={vi.fn()} onDecline={vi.fn()} />
    );
    expect(screen.getByText('Accept Offer')).toBeDisabled();
  });
});

describe('OfferMatchupPanel', () => {
  it('renders fighter and opponent names with stables', () => {
    const w1 = makeWarrior({ name: 'Alpha' });
    const opponent = { ...makeWarrior({ name: 'Beta' }), stableName: 'House Beta' };
    render(
      <OfferMatchupPanel
        playerWarrior={w1}
        fatigueStatus={freshFatigue}
        injuryBadge={null}
        opponent={opponent}
      />
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('House Beta')).toBeInTheDocument();
    expect(screen.getByText(/Fresh \[100%\]/)).toBeInTheDocument();
  });

  it('renders the injury badge when provided', () => {
    render(
      <OfferMatchupPanel
        playerWarrior={makeWarrior()}
        fatigueStatus={freshFatigue}
        injuryBadge={injuredBadge}
        opponent={null}
      />
    );
    expect(screen.getByText(/Injured/)).toBeInTheDocument();
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
    expect(screen.getByText('UNKNOWN STABLE')).toBeInTheDocument();
  });
});

describe('OfferCardHeader', () => {
  it('renders promoter identity and purse', () => {
    render(
      <OfferCardHeader
        offer={baseOffer()}
        promoter={{ name: 'Quintus Maximus', tier: 'Local' }}
        personalityConfig={null}
      />
    );
    expect(screen.getByText('Quintus Maximus')).toBeInTheDocument();
    expect(screen.getByText('420G')).toBeInTheDocument();
    expect(screen.getByText(/Local PROMOTER/i)).toBeInTheDocument();
  });

  it('falls back to External Syndicate when promoter is missing', () => {
    render(<OfferCardHeader offer={baseOffer()} promoter={undefined} personalityConfig={null} />);
    expect(screen.getByText('External Syndicate')).toBeInTheDocument();
  });

  it('renders rival-challenge and counter-offer badges', () => {
    const offer = makeBoutOffer({
      proposerStableId: 'stable-9' as StableId,
      counterPurseBump: 75,
    });
    render(
      <OfferCardHeader offer={offer} promoter={{ name: 'P' }} personalityConfig={null} />
    );
    expect(screen.getByTestId('rival-challenge-badge')).toBeInTheDocument();
    expect(screen.getByTestId('counter-offer-badge')).toHaveTextContent('Countered +75G');
  });

  it('renders personality tag when config is present', () => {
    render(
      <OfferCardHeader
        offer={baseOffer()}
        promoter={{ name: 'P' }}
        personality="Greedy"
        personalityConfig={PERSONALITY_CONFIG.Greedy}
      />
    );
    expect(screen.getByText('Greedy')).toBeInTheDocument();
  });
});

describe('OfferDetailsGrid', () => {
  it('renders fight week and hype', () => {
    render(<OfferDetailsGrid offer={baseOffer()} />);
    expect(screen.getByText('Fight Week')).toBeInTheDocument();
    expect(screen.getByText('Week 8')).toBeInTheDocument();
    expect(screen.getByText('55% Expected Hype')).toBeInTheDocument();
  });

  it('renders arena block when arenaId is set', () => {
    const offer = makeBoutOffer({ arenaId: 'standard_arena' });
    render(<OfferDetailsGrid offer={offer} />);
    expect(screen.getByText('The Proving Grounds')).toBeInTheDocument();
  });

  it('renders arena fit line when playerWarrior is provided', () => {
    const offer = makeBoutOffer({ arenaId: 'standard_arena' });
    const w: Warrior = makeWarrior({ id: 'w-fit' as WarriorId });
    render(<OfferDetailsGrid offer={offer} playerWarrior={w} />);
    expect(screen.getByText('The Proving Grounds')).toBeInTheDocument();
  });
});
