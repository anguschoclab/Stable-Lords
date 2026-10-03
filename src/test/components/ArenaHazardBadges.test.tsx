// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArenaHazardBadges } from '@/components/arena/ArenaHazardBadges';
import '@/test/_setup/setup';

describe('ArenaHazardBadges', () => {
  it('renders nothing when neither water nor cursed tags are present', () => {
    const { container } = render(<ArenaHazardBadges tags={['outdoor', 'open']} />);
    expect(container.textContent).not.toContain('WATER HAZARD');
    expect(container.textContent).not.toContain('CURSED GROUND');
  });

  it('renders WATER HAZARD for water tag', () => {
    render(<ArenaHazardBadges tags={['water']} />);
    expect(screen.getByText('WATER HAZARD')).toBeTruthy();
  });

  it('renders CURSED GROUND for cursed tag', () => {
    render(<ArenaHazardBadges tags={['cursed']} />);
    expect(screen.getByText('CURSED GROUND')).toBeTruthy();
  });

  it('renders both badges when both tags are present', () => {
    render(<ArenaHazardBadges tags={['water', 'cursed']} />);
    expect(screen.getByText('WATER HAZARD')).toBeTruthy();
    expect(screen.getByText('CURSED GROUND')).toBeTruthy();
  });

  it('applies the requested size class', () => {
    render(<ArenaHazardBadges tags={['water']} size="md" />);
    const badge = screen.getByText('WATER HAZARD');
    expect(badge.className).toContain('text-[9px]');
  });
});
