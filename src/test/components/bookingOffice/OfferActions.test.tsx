// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OfferActions } from '@/pages/BookingOffice/components/OfferActions';
import { TooltipProvider } from '@/components/ui/tooltip';
import { unsignedActionProps } from '@/test/_fixtures/offerCard';

describe('OfferActions', () => {
  it('exposes the reason an offer cannot be accepted', () => {
    render(
      <TooltipProvider>
        <OfferActions
          isSigned={false}
          acceptDisabled
          acceptDisabledReason="Warrior is injured"
          onAccept={vi.fn()}
          onDecline={vi.fn()}
        />
      </TooltipProvider>
    );

    const accept = screen.getByRole('button', { name: /accept offer — warrior is injured/i });
    expect(accept).toBeDisabled();
  });

  it('keeps accept available and decline actionable for unsigned offers', () => {
    const onAccept = vi.fn();
    const onDecline = vi.fn();
    render(<OfferActions {...unsignedActionProps(onAccept, onDecline)} />);

    fireEvent.click(screen.getByRole('button', { name: /accept offer/i }));
    fireEvent.click(screen.getByRole('button', { name: /decline offer/i }));

    expect(onAccept).toHaveBeenCalledOnce();
    expect(onDecline).toHaveBeenCalledOnce();
  });
});
