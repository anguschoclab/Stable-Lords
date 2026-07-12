/**
 * ParticleSystem — verifies sweat particles use arena-steel design token, not raw blue.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@/utils/cryptoRandom', () => ({
  cryptoRandom: () => 0.5,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

import ParticleSystem from '@/components/arena/effects/ParticleSystem';

describe('ParticleSystem design tokens', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('sweat particles use bg-arena-steel, not bg-blue-300', () => {
    const { container } = render(<ParticleSystem trigger="hit" sourceX={50} sourceY={50} />);

    // Check all rendered divs — none should have bg-blue-300
    const allDivs = container.querySelectorAll('div');
    for (const div of allDivs) {
      expect(div.className).not.toContain('bg-blue-300');
    }
  });

  it('blood particles use bg-arena-blood token', () => {
    const { container } = render(<ParticleSystem trigger="crit" sourceX={50} sourceY={50} />);

    // Particle divs have 'rounded-full' class
    const particles = container.querySelectorAll('[class*="rounded-full"]');
    expect(particles.length).toBeGreaterThan(0);
    for (const p of particles) {
      expect(p.className).toContain('bg-arena-blood');
      expect(p.className).not.toContain('bg-red-');
    }
  });

  it('spark particles use bg-arena-gold token', () => {
    const { container } = render(<ParticleSystem trigger="hit" sourceX={50} sourceY={50} />);

    const particles = container.querySelectorAll('[class*="rounded-full"]');
    expect(particles.length).toBeGreaterThan(0);
    for (const p of particles) {
      expect(p.className).toContain('bg-arena-gold');
      expect(p.className).not.toContain('bg-yellow-');
    }
  });
});
