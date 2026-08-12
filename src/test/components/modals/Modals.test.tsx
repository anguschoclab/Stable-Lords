import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeathModalHeader } from '@/components/modals/death-modal/DeathModalHeader';
import { DeathModalFooter } from '@/components/modals/death-modal/DeathModalFooter';
import { DeathModalWarriorInfo } from '@/components/modals/death-modal/DeathModalWarriorInfo';
import { DeathModalPaperDoll } from '@/components/modals/death-modal/DeathModalPaperDoll';
import type { Warrior } from '@/types/warrior.types';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/PaperDoll', () => ({
  PaperDoll: () => <div data-testid="paper-doll">PaperDoll</div>,
}));

const mockWarrior = {
  name: 'Brutus',
  style: 'Bashing Attack',
  age: 25,
  deathWeek: 10,
  deathCause: 'Slain by rival',
  career: { wins: 5, losses: 3 },
} as unknown as Warrior;

describe('DeathModalHeader', () => {
  it('renders without crashing', () => {
    render(<DeathModalHeader />);
    expect(screen.getByText('THE SANDS CLAIM ANOTHER')).toBeInTheDocument();
  });
});

describe('DeathModalFooter', () => {
  it('renders acknowledge button', () => {
    const onAcknowledge = vi.fn();
    render(<DeathModalFooter onAcknowledge={onAcknowledge} />);
    expect(screen.getByText(/MEMORIALIZE & CONTINUE/i)).toBeInTheDocument();
  });

  it('calls onAcknowledge when button clicked', () => {
    const onAcknowledge = vi.fn();
    render(<DeathModalFooter onAcknowledge={onAcknowledge} />);
    fireEvent.click(screen.getByText(/MEMORIALIZE & CONTINUE/i));
    expect(onAcknowledge).toHaveBeenCalled();
  });
});

describe('DeathModalWarriorInfo', () => {
  it('renders warrior name in uppercase', () => {
    render(<DeathModalWarriorInfo warrior={mockWarrior} />);
    expect(screen.getByText('BRUTUS')).toBeInTheDocument();
  });

  it('renders style and age', () => {
    render(<DeathModalWarriorInfo warrior={mockWarrior} />);
    expect(screen.getByText(/Bashing Attack.*Year 25/i)).toBeInTheDocument();
  });

  it('renders career record', () => {
    render(<DeathModalWarriorInfo warrior={mockWarrior} />);
    expect(screen.getByText(/5W.*3L/i)).toBeInTheDocument();
  });

  it('renders death cause', () => {
    render(<DeathModalWarriorInfo warrior={mockWarrior} />);
    expect(screen.getByText(/Slain by rival/i)).toBeInTheDocument();
  });

  it('renders default death cause when not provided', () => {
    const warrior = { ...mockWarrior, deathCause: undefined } as unknown as Warrior;
    render(<DeathModalWarriorInfo warrior={warrior} />);
    expect(screen.getByText(/honorable combat/i)).toBeInTheDocument();
  });
});

describe('DeathModalPaperDoll', () => {
  it('renders without crashing', () => {
    const { container } = render(<DeathModalPaperDoll />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders paper doll mock', () => {
    render(<DeathModalPaperDoll />);
    expect(screen.getByTestId('paper-doll')).toBeInTheDocument();
  });
});
