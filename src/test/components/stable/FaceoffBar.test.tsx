// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FaceoffBar } from '@/components/stable/FaceoffBar';

describe('FaceoffBar', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <FaceoffBar fighterA={{ hp: 80, max: 100 }} fighterB={{ hp: 60, max: 100 }} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('fighter A fill width = (hpA/maxA)*50%', () => {
    const { container } = render(
      <FaceoffBar fighterA={{ hp: 80, max: 100 }} fighterB={{ hp: 60, max: 100 }} />
    );
    const fillA = container.querySelector('[data-testid="faceoff-fill-a"]') as HTMLElement;
    expect(fillA).toBeInTheDocument();
    expect(fillA.style.width).toBe('40%');
  });

  it('fighter B fill width = (hpB/maxB)*50%', () => {
    const { container } = render(
      <FaceoffBar fighterA={{ hp: 80, max: 100 }} fighterB={{ hp: 60, max: 100 }} />
    );
    const fillB = container.querySelector('[data-testid="faceoff-fill-b"]') as HTMLElement;
    expect(fillB).toBeInTheDocument();
    expect(fillB.style.width).toBe('30%');
  });

  it('applies bg-primary to fighter A fill', () => {
    const { container } = render(
      <FaceoffBar fighterA={{ hp: 80, max: 100 }} fighterB={{ hp: 60, max: 100 }} />
    );
    const fillA = container.querySelector('[data-testid="faceoff-fill-a"]');
    expect(fillA?.className).toContain('bg-primary');
  });

  it('applies bg-destructive to fighter B fill', () => {
    const { container } = render(
      <FaceoffBar fighterA={{ hp: 80, max: 100 }} fighterB={{ hp: 60, max: 100 }} />
    );
    const fillB = container.querySelector('[data-testid="faceoff-fill-b"]');
    expect(fillB?.className).toContain('bg-destructive');
  });

  it('shows 0 width when hpA is 0 (knocked out)', () => {
    const { container } = render(
      <FaceoffBar fighterA={{ hp: 0, max: 100 }} fighterB={{ hp: 60, max: 100 }} />
    );
    const fillA = container.querySelector('[data-testid="faceoff-fill-a"]') as HTMLElement;
    expect(fillA.style.width).toBe('0%');
  });

  it('clamps hpA below 0 to 0 width', () => {
    const { container } = render(
      <FaceoffBar fighterA={{ hp: -10, max: 100 }} fighterB={{ hp: 60, max: 100 }} />
    );
    const fillA = container.querySelector('[data-testid="faceoff-fill-a"]') as HTMLElement;
    expect(fillA.style.width).toBe('0%');
  });

  it('renders custom labels when provided', () => {
    const { container } = render(
      <FaceoffBar
        fighterA={{ hp: 80, max: 100, label: 'Fighter A' }}
        fighterB={{ hp: 60, max: 100, label: 'Fighter B' }}
      />
    );
    expect(container.textContent).toContain('Fighter A');
    expect(container.textContent).toContain('Fighter B');
  });

  it('uses default labels A and B when not provided', () => {
    const { container } = render(
      <FaceoffBar fighterA={{ hp: 80, max: 100 }} fighterB={{ hp: 60, max: 100 }} />
    );
    expect(container.textContent).toContain('A');
    expect(container.textContent).toContain('B');
  });

  it('passes className to root element', () => {
    const { container } = render(
      <FaceoffBar
        fighterA={{ hp: 80, max: 100 }}
        fighterB={{ hp: 60, max: 100 }}
        className="test-cls"
      />
    );
    expect(container.firstChild).toHaveClass('test-cls');
  });

  it('shows 0 width when hpB is 0', () => {
    const { container } = render(
      <FaceoffBar fighterA={{ hp: 80, max: 100 }} fighterB={{ hp: 0, max: 100 }} />
    );
    const fillB = container.querySelector('[data-testid="faceoff-fill-b"]') as HTMLElement;
    expect(fillB.style.width).toBe('0%');
  });

  it('clamps hpB below 0 to 0 width', () => {
    const { container } = render(
      <FaceoffBar fighterA={{ hp: 80, max: 100 }} fighterB={{ hp: -10, max: 100 }} />
    );
    const fillB = container.querySelector('[data-testid="faceoff-fill-b"]') as HTMLElement;
    expect(fillB.style.width).toBe('0%');
  });

  it('shows 0 width when maxA is 0', () => {
    const { container } = render(
      <FaceoffBar fighterA={{ hp: 50, max: 0 }} fighterB={{ hp: 60, max: 100 }} />
    );
    const fillA = container.querySelector('[data-testid="faceoff-fill-a"]') as HTMLElement;
    expect(fillA.style.width).toBe('0%');
  });

  it('shows 0 width when maxB is 0', () => {
    const { container } = render(
      <FaceoffBar fighterA={{ hp: 80, max: 100 }} fighterB={{ hp: 50, max: 0 }} />
    );
    const fillB = container.querySelector('[data-testid="faceoff-fill-b"]') as HTMLElement;
    expect(fillB.style.width).toBe('0%');
  });
});
