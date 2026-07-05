// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VitalityRing } from '@/components/ui/VitalityRing';

describe('VitalityRing', () => {
  it('renders an SVG element', () => {
    const { container } = render(<VitalityRing value={75} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders a foreground circle element', () => {
    const { container } = render(<VitalityRing value={75} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(2);
  });

  it('applies stroke-primary class when value > 70', () => {
    const { container } = render(<VitalityRing value={80} />);
    const arc = container.querySelector('[data-testid="vitality-arc"]');
    expect(arc?.getAttribute('class')).toContain('stroke-primary');
  });

  it('applies stroke-arena-gold class when value is 50', () => {
    const { container } = render(<VitalityRing value={50} />);
    const arc = container.querySelector('[data-testid="vitality-arc"]');
    expect(arc?.getAttribute('class')).toContain('stroke-arena-gold');
  });

  it('applies stroke-destructive class when value < 30', () => {
    const { container } = render(<VitalityRing value={20} />);
    const arc = container.querySelector('[data-testid="vitality-arc"]');
    expect(arc?.getAttribute('class')).toContain('stroke-destructive');
  });

  it('does not crash with value=0', () => {
    expect(() => render(<VitalityRing value={0} />)).not.toThrow();
  });

  it('does not crash with value=100', () => {
    expect(() => render(<VitalityRing value={100} />)).not.toThrow();
  });

  it('strokeDashoffset is lower (more fill) for value=100 than value=50', () => {
    const { container: c100 } = render(<VitalityRing value={100} />);
    const { container: c50 } = render(<VitalityRing value={50} />);
    const arc100 = c100.querySelector('[data-testid="vitality-arc"]') as SVGCircleElement;
    const arc50 = c50.querySelector('[data-testid="vitality-arc"]') as SVGCircleElement;
    const offset100 = parseFloat(
      arc100.style.strokeDashoffset || arc100.getAttribute('stroke-dashoffset') || '0'
    );
    const offset50 = parseFloat(
      arc50.style.strokeDashoffset || arc50.getAttribute('stroke-dashoffset') || '0'
    );
    expect(offset100).toBeLessThan(offset50);
  });
});
