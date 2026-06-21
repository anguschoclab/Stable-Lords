/**
 * FilterToggleButton — verifies aria-pressed reflects active state.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

interface FilterToggleButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  ariaLabel: string;
}

function FilterToggleButton({ active, onClick, label, ariaLabel }: FilterToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className="filter-toggle"
    >
      {label}
    </button>
  );
}

describe('FilterToggleButton aria-pressed', () => {
  it('sets aria-pressed to true when active', () => {
    render(
      <FilterToggleButton active={true} onClick={() => {}} label="Test" ariaLabel="Test filter" />
    );
    const btn = screen.getByRole('button', { name: 'Test filter' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('sets aria-pressed to false when inactive', () => {
    render(
      <FilterToggleButton active={false} onClick={() => {}} label="Test" ariaLabel="Test filter" />
    );
    const btn = screen.getByRole('button', { name: 'Test filter' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('updates aria-pressed when active prop changes', () => {
    const { rerender } = render(
      <FilterToggleButton active={false} onClick={() => {}} label="Test" ariaLabel="Test filter" />
    );
    let btn = screen.getByRole('button', { name: 'Test filter' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');

    rerender(
      <FilterToggleButton active={true} onClick={() => {}} label="Test" ariaLabel="Test filter" />
    );
    btn = screen.getByRole('button', { name: 'Test filter' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <FilterToggleButton active={false} onClick={onClick} label="Test" ariaLabel="Test filter" />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
