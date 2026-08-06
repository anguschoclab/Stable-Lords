// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@/test/_setup/setup';
import { RecruitFilters } from '@/pages/Recruit/components/RecruitFilters';
import { FightingStyle } from '@/types/shared.types';

const defaultProps = {
  activeTiers: new Set(['Common', 'Promising']),
  toggleTier: vi.fn(),
  activeStyle: 'all' as FightingStyle | 'all',
  setActiveStyle: vi.fn(),
  sortBy: 'potential-desc' as const,
  setSortBy: vi.fn(),
  onRefresh: vi.fn(),
  canRefresh: true,
};

describe('RecruitFilters', () => {
  it('renders "Filters" section divider', () => {
    render(<RecruitFilters {...defaultProps} />);
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('renders Tier label', () => {
    render(<RecruitFilters {...defaultProps} />);
    expect(screen.getByText('Tier')).toBeInTheDocument();
  });

  it('renders all 4 tier buttons', () => {
    render(<RecruitFilters {...defaultProps} />);
    expect(screen.getByText('Common')).toBeInTheDocument();
    expect(screen.getByText('Promising')).toBeInTheDocument();
    expect(screen.getByText('Exceptional')).toBeInTheDocument();
    expect(screen.getByText('Prodigy')).toBeInTheDocument();
  });

  it('renders "Fighting Style" label', () => {
    render(<RecruitFilters {...defaultProps} />);
    expect(screen.getByText('Fighting Style')).toBeInTheDocument();
  });

  it('renders "Sort By" label', () => {
    render(<RecruitFilters {...defaultProps} />);
    expect(screen.getByText('Sort By')).toBeInTheDocument();
  });

  it('renders a Select trigger for style', () => {
    render(<RecruitFilters {...defaultProps} />);
    const triggers = screen.getAllByRole('combobox');
    expect(triggers.length).toBeGreaterThanOrEqual(2);
  });

  it('renders Refresh Pool button', () => {
    render(<RecruitFilters {...defaultProps} />);
    expect(screen.getByText(/refresh pool/i)).toBeInTheDocument();
  });

  it('disables refresh button when canRefresh is false', () => {
    render(<RecruitFilters {...defaultProps} canRefresh={false} />);
    const btn = screen.getByText(/refresh pool/i).closest('button');
    expect(btn).toBeDisabled();
  });

  it('calls toggleTier when a tier button is clicked', () => {
    const toggleTier = vi.fn();
    render(<RecruitFilters {...defaultProps} toggleTier={toggleTier} />);
    fireEvent.click(screen.getByText('Common'));
    expect(toggleTier).toHaveBeenCalledWith('Common');
  });

  it('calls onRefresh when refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(<RecruitFilters {...defaultProps} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByText(/refresh pool/i));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('renders tier cost labels', () => {
    render(<RecruitFilters {...defaultProps} />);
    const goldLabels = screen.getAllByText(/G$/);
    expect(goldLabels.length).toBeGreaterThanOrEqual(4);
  });

  it('renders sort option labels', () => {
    render(<RecruitFilters {...defaultProps} />);
    expect(screen.getByText(/potential: high to low/i)).toBeInTheDocument();
  });
});
