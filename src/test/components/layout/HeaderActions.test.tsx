// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HeaderActions } from '@/components/layout/AppHeader/actions';

vi.mock('@/components/layout/PrimaryCtaButton', () => ({
  PrimaryCtaButton: () => <button type="button">Primary CTA</button>,
}));

vi.mock('@/lib/AudioManager', () => ({
  audioManager: { setMuted: vi.fn() },
}));

function renderActions(compact: boolean) {
  return render(
    <TooltipProvider>
      <HeaderActions
        compact={compact}
        isSimulating={false}
        lastSavedAt="2026-01-01T12:00:00.000Z"
        onResetPrompt={vi.fn()}
        returnToTitle={vi.fn()}
      />
    </TooltipProvider>
  );
}

describe('HeaderActions compact shell', () => {
  it('keeps the CTA and feed visible while moving session controls into a labelled sheet', () => {
    renderActions(true);

    expect(screen.getByRole('button', { name: 'Primary CTA' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open arena feed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open session controls' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mute audio' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Exit to title' })).not.toBeInTheDocument();
  });

  it('exposes labelled session controls inside the compact sheet', () => {
    renderActions(true);

    fireEvent.click(screen.getByRole('button', { name: 'Open session controls' }));

    expect(screen.getByRole('dialog', { name: 'Session Controls' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mute audio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expunge Ledger' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exit to title' })).toBeInTheDocument();
  });
});
