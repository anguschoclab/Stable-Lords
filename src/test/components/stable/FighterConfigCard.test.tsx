// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@/test/_setup/setup';
import { FighterConfigCard, type FighterStats } from '@/components/stable/FighterConfigCard';
import { FightingStyle } from '@/types/shared.types';

const defaultProps = {
  label: 'Fighter Alpha',
  style: FightingStyle.StrikingAttack,
  setStyle: vi.fn(),
  stats: { strength: 10, quickness: 15, vitality: 12 } as FighterStats,
  setStats: vi.fn(),
};

describe('FighterConfigCard', () => {
  it('renders the label prop as card title', () => {
    render(<FighterConfigCard {...defaultProps} />);
    expect(screen.getByText('Fighter Alpha')).toBeInTheDocument();
  });

  it('renders stat labels for each stat key', () => {
    render(<FighterConfigCard {...defaultProps} />);
    expect(screen.getByText('strength')).toBeInTheDocument();
    expect(screen.getByText('quickness')).toBeInTheDocument();
    expect(screen.getByText('vitality')).toBeInTheDocument();
  });

  it('renders stat values as text', () => {
    render(<FighterConfigCard {...defaultProps} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders a Select trigger for style selection', () => {
    render(<FighterConfigCard {...defaultProps} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders Label elements for stat keys (a11y)', () => {
    const { container } = render(<FighterConfigCard {...defaultProps} />);
    const labels = container.querySelectorAll('label');
    expect(labels.length).toBeGreaterThanOrEqual(3);
  });

  it('calls setStyle when a new style is selected', () => {
    const setStyle = vi.fn();
    render(<FighterConfigCard {...defaultProps} setStyle={setStyle} />);
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    expect(trigger).toBeInTheDocument();
  });

  it('renders with correct slider range (min=1, max=30)', () => {
    const { container } = render(<FighterConfigCard {...defaultProps} />);
    const sliders = container.querySelectorAll('[role="slider"]');
    expect(sliders.length).toBe(3);
    for (const slider of sliders) {
      expect(slider).toHaveAttribute('aria-valuemin', '1');
      expect(slider).toHaveAttribute('aria-valuemax', '30');
    }
  });
});
