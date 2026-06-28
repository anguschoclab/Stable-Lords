// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FaceoffBar } from '@/components/stable/FaceoffBar';

describe('FaceoffBar', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <FaceoffBar hpA={80} maxA={100} hpB={60} maxB={100} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('fighter A fill width = (hpA/maxA)*50%', () => {
    const { container } = render(
      <FaceoffBar hpA={80} maxA={100} hpB={60} maxB={100} />
    );
    const fillA = container.querySelector('[data-testid="faceoff-fill-a"]') as HTMLElement;
    expect(fillA).toBeInTheDocument();
    expect(fillA.style.width).toBe('40%');
  });

  it('fighter B fill width = (hpB/maxB)*50%', () => {
    const { container } = render(
      <FaceoffBar hpA={80} maxA={100} hpB={60} maxB={100} />
    );
    const fillB = container.querySelector('[data-testid="faceoff-fill-b"]') as HTMLElement;
    expect(fillB).toBeInTheDocument();
    expect(fillB.style.width).toBe('30%');
  });

  it('applies bg-primary to fighter A fill', () => {
    const { container } = render(
      <FaceoffBar hpA={80} maxA={100} hpB={60} maxB={100} />
    );
    const fillA = container.querySelector('[data-testid="faceoff-fill-a"]');
    expect(fillA?.className).toContain('bg-primary');
  });

  it('applies bg-destructive to fighter B fill', () => {
    const { container } = render(
      <FaceoffBar hpA={80} maxA={100} hpB={60} maxB={100} />
    );
    const fillB = container.querySelector('[data-testid="faceoff-fill-b"]');
    expect(fillB?.className).toContain('bg-destructive');
  });

  it('shows 0 width when hpA is 0 (knocked out)', () => {
    const { container } = render(
      <FaceoffBar hpA={0} maxA={100} hpB={60} maxB={100} />
    );
    const fillA = container.querySelector('[data-testid="faceoff-fill-a"]') as HTMLElement;
    expect(fillA.style.width).toBe('0%');
  });

  it('clamps hpA below 0 to 0 width', () => {
    const { container } = render(
      <FaceoffBar hpA={-10} maxA={100} hpB={60} maxB={100} />
    );
    const fillA = container.querySelector('[data-testid="faceoff-fill-a"]') as HTMLElement;
    expect(fillA.style.width).toBe('0%');
  });
});
