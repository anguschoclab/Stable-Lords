import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TraitBadge } from '@/components/warrior/traits/TraitBadge';

describe('TraitBadge', () => {
  it('renders the trait name', () => {
    render(
      <TooltipProvider>
        <TraitBadge traitId="living_wall" />
      </TooltipProvider>
    );
    expect(screen.getByText('Living Wall')).toBeInTheDocument();
  });

  it('exposes the description for the tooltip (title attr fallback)', () => {
    render(
      <TooltipProvider>
        <TraitBadge traitId="fragile" />
      </TooltipProvider>
    );
    const el = screen.getByText('Fragile');
    expect(el.closest('[title]')?.getAttribute('title') ?? '').toMatch(/defense/i);
  });

  it('renders nothing for an unknown trait', () => {
    const { container } = render(
      <TooltipProvider>
        <TraitBadge traitId="nope" />
      </TooltipProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });
});
