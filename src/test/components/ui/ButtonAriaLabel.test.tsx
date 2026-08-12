import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';

function renderWithProvider(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe('Button aria-label fallback', () => {
  it('uses explicit aria-label when provided', () => {
    renderWithProvider(<Button aria-label="Custom Label">Click</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom Label');
  });

  it('falls back to tooltip string for aria-label when no explicit aria-label', () => {
    renderWithProvider(<Button tooltip="Save Item">Click</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Save Item');
  });

  it('does not set aria-label when neither aria-label nor string tooltip is provided', () => {
    renderWithProvider(<Button>Click</Button>);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-label');
  });

  it('does not use non-string tooltip for aria-label', () => {
    renderWithProvider(
      <Button tooltip={<span>Complex</span>}>Click</Button>
    );
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-label');
  });
});
