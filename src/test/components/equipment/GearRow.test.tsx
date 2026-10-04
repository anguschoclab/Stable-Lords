/**
 * GearRow — grouped status prop API (max-params refactor contract).
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Swords } from 'lucide-react';
import { GearRow } from '@/pages/StableEquipment/components/GearRow';

describe('GearRow', () => {
  it('renders name and encumbrance weight', () => {
    render(<GearRow icon={Swords} name="Longsword" weight={5} />);
    expect(screen.getByText('Longsword')).toBeInTheDocument();
    expect(screen.getByText('+5E')).toBeInTheDocument();
  });

  it('marks blocked gear as conflicted', () => {
    render(<GearRow icon={Swords} name="Tower Shield" weight={9} status={{ blocked: true }} />);
    expect(screen.getByText(/CONFLICT/)).toBeInTheDocument();
  });

  it('styles requirement errors destructively', () => {
    render(<GearRow icon={Swords} name="Maul" weight={12} status={{ error: true }} />);
    expect(screen.getByText('Maul')).toHaveClass('text-destructive');
  });

  it('applies the highlight background when high', () => {
    const { container } = render(<GearRow icon={Swords} name="Helm" weight={2} high />);
    expect(container.firstChild).toHaveClass('bg-white/[0.03]');
  });
});
