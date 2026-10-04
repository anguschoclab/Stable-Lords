/**
 * ComparisonBar — grouped sideA/sideB props API (max-params refactor contract).
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComparisonBar } from '@/components/scouting/ComparisonBar';

const sides = (a: number, b: number) => ({
  sideA: { value: a, color: 'bg-primary' },
  sideB: { value: b, color: 'bg-accent' },
});

describe('ComparisonBar', () => {
  it('renders the label and both side values', () => {
    render(<ComparisonBar label="WINS" maxVal={10} {...sides(7, 3)} />);
    expect(screen.getByText('WINS')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('highlights the winning side with its text color class', () => {
    render(<ComparisonBar label="KILLS" maxVal={10} {...sides(9, 2)} />);
    expect(screen.getByText('9')).toHaveClass('text-primary');
    expect(screen.getByText('2')).not.toHaveClass('text-accent');
  });

  it('highlights sideB when it leads', () => {
    render(<ComparisonBar label="FAME" maxVal={10} {...sides(1, 8)} />);
    expect(screen.getByText('8')).toHaveClass('text-accent');
    expect(screen.getByText('1')).not.toHaveClass('text-primary');
  });

  it('renders zero percentages without dividing by zero', () => {
    render(<ComparisonBar label="WINS" maxVal={0} {...sides(0, 0)} />);
    expect(screen.getByText('WINS')).toBeInTheDocument();
  });
});
