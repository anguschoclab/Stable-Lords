// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { makeTestWarrior, makeDefaultPlan } from '@/test/_fixtures/namedWarrior';
import { render, screen, fireEvent } from '@testing-library/react';
import { WarriorSelector } from '@/pages/TrainingPlanner/components/WarriorSelector';
import '@/test/_setup/setup';

const makePlan = makeDefaultPlan;


describe('WarriorSelector (Battle Plans)', () => {
  it('renders warrior names', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    const w2 = makeTestWarrior('w2', 'Beta');
    render(<WarriorSelector warriors={[w1, w2]} selectedId="w1" onSelect={vi.fn()} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows "Plan Set" for warriors with a plan', () => {
    const w1 = makeTestWarrior('w1', 'Alpha', { plan: makePlan() });
    render(<WarriorSelector warriors={[w1]} selectedId="w1" onSelect={vi.fn()} />);
    expect(screen.getByText('Plan Set')).toBeInTheDocument();
  });

  it('shows "No Plan" for warriors without a plan', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    render(<WarriorSelector warriors={[w1]} selectedId="w1" onSelect={vi.fn()} />);
    expect(screen.getByText('No Plan')).toBeInTheDocument();
  });

  it('clicking a warrior button calls onSelect with that warrior id', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    const w2 = makeTestWarrior('w2', 'Beta');
    const onSelect = vi.fn();
    render(<WarriorSelector warriors={[w1, w2]} selectedId="w1" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Beta'));
    expect(onSelect).toHaveBeenCalledWith('w2');
  });

  it('selected warrior has highlighted styling', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    const w2 = makeTestWarrior('w2', 'Beta');
    const { container } = render(
      <WarriorSelector warriors={[w1, w2]} selectedId="w1" onSelect={vi.fn()} />
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons[0]).toHaveClass('bg-white/[0.05]');
    expect(buttons[1]).toHaveClass('opacity-40');
  });

  it('does not accept trainers prop (removed from interface)', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    // TypeScript would error on this at compile time, but verify it renders without trainers
    render(<WarriorSelector warriors={[w1]} selectedId="w1" onSelect={vi.fn()} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('empty warriors array renders nothing without crash', () => {
    const { container } = render(
      <WarriorSelector warriors={[]} selectedId={null} onSelect={vi.fn()} />
    );
    expect(container.querySelector('button')).toBeNull();
  });
});
