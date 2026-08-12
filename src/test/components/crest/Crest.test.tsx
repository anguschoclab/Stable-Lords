import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getFieldPattern } from '@/components/crest/fieldPatterns';
import { StableCrest } from '@/components/crest/StableCrest';
import { Helmet } from '@/components/crest/StableCrest/components/Helmet';
import { Mantling } from '@/components/crest/StableCrest/components/Mantling';
import { ChargeComponent } from '@/components/crest/StableCrest/components/ChargeComponent';
import type { CrestData } from '@/types/crest.types';

vi.mock('@/engine/crest/chargePaths', () => ({
  getChargePathsByType: () => ({
    lion: { path: 'M0,0 L10,10 L20,0 Z', viewBox: '0 0 100 100' },
  }),
}));

const mockCrest: CrestData = {
  shieldShape: 'heater',
  fieldType: 'solid',
  primaryColor: '#ff0000',
  secondaryColor: '#00ff00',
  metalColor: 'gold',
  charge: {
    type: 'animal',
    name: 'lion',
    count: 1,
    posture: 'rampant',
  },
  generation: 1,
} as unknown as CrestData;

describe('getFieldPattern', () => {
  it('renders solid pattern', () => {
    const result = getFieldPattern('solid', { primary: '#ff0000', metal: '#D4AF37' });
    expect(result).toBeDefined();
  });

  it('renders fess pattern', () => {
    const result = getFieldPattern('fess', {
      primary: '#ff0000',
      secondary: '#00ff00',
      metal: '#D4AF37',
    });
    expect(result).toBeDefined();
  });

  it('falls back to solid for unknown type', () => {
    const result = getFieldPattern('unknown' as never, { primary: '#ff0000', metal: '#D4AF37' });
    expect(result).toBeDefined();
  });
});

describe('Helmet', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <svg>
        <Helmet metal="#D4AF37" />
      </svg>
    );
    expect(container.querySelector('g')).toBeInTheDocument();
  });
});

describe('Mantling', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <svg>
        <Mantling color="#ff0000" />
      </svg>
    );
    expect(container.querySelectorAll('path').length).toBeGreaterThan(0);
  });
});

describe('StableCrest', () => {
  it('renders without crashing', () => {
    const { container } = render(<StableCrest crest={mockCrest} size="md" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with mantling and helmet at large size', () => {
    const { container } = render(<StableCrest crest={mockCrest} size="xl" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with numeric size', () => {
    const { container } = render(<StableCrest crest={mockCrest} size={80} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders generation badge when generation > 0', () => {
    render(<StableCrest crest={mockCrest} size="xl" showGenerationBadge />);
    expect(screen.getByText('G1')).toBeInTheDocument();
  });
});

describe('ChargeComponent', () => {
  it('renders without crashing with valid charge', () => {
    const { container } = render(
      <svg>
        <ChargeComponent charge={mockCrest.charge} metal="#D4AF37" />
      </svg>
    );
    expect(container.querySelector('path')).toBeInTheDocument();
  });

  it('renders null for unknown charge name', () => {
    const charge = { ...mockCrest.charge, name: 'nonexistent' } as never;
    const { container } = render(
      <svg>
        <ChargeComponent charge={charge} metal="#D4AF37" />
      </svg>
    );
    expect(container.querySelector('path')).toBeNull();
  });
});
