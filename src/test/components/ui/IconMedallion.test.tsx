// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IconMedallion } from '@/components/ui/IconMedallion';

describe('IconMedallion', () => {
  it('renders the provided icon element', () => {
    const { container } = render(<IconMedallion icon={<span data-testid="custom-icon">X</span>} />);
    const icon = container.querySelector('[data-testid="custom-icon"]');
    expect(icon).toBeInTheDocument();
  });

  it('renders the conic-gradient ring div', () => {
    const { container } = render(<IconMedallion icon={<span>X</span>} />);
    const ringDiv = container.querySelector('.absolute.inset-0.rounded-full');
    expect(ringDiv).toBeInTheDocument();
    const style = ringDiv?.getAttribute('style') || '';
    expect(style).toContain('conic-gradient');
  });

  it('renders the radial-gradient inner circle div', () => {
    const { container } = render(<IconMedallion icon={<span>X</span>} />);
    const innerCircle = container.querySelector('.relative.z-10');
    expect(innerCircle).toBeInTheDocument();
    const style = innerCircle?.getAttribute('style') || '';
    expect(style).toContain('radial-gradient');
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <IconMedallion icon={<span>X</span>} className="custom-test-class" />
    );
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain('custom-test-class');
  });

  it('renders without crashing for any ReactNode icon', () => {
    expect(() => render(<IconMedallion icon={null} />)).not.toThrow();
  });
});
