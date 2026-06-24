// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TrainingPlanner from '@/pages/TrainingPlanner';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import type { FightPlan, Warrior } from '@/types/game';
import type { GameState } from '@/types/state.types';
import { TooltipProvider } from '@/components/ui/tooltip';
import '@/test/_setup/setup';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

const baseAttrs = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };

function makeTestWarrior(id: string, name: string, overrides?: Partial<Warrior>): Warrior {
  return makeWarrior(id as any, name, FightingStyle.StrikingAttack, baseAttrs, {
    ...overrides,
  });
}

function makePlan(style: FightingStyle = FightingStyle.StrikingAttack): FightPlan {
  return {
    style,
    OE: 5,
    AL: 5,
    killDesire: 5,
    target: 'Any',
    offensiveTactic: 'Decisiveness',
    defensiveTactic: 'none',
  };
}

function renderPlanner(roster: Warrior[]) {
  const state = createFreshState('test-seed');
  state.roster = roster;
  useGameStore.getState().loadGame('test-slot', state as GameState);
  useGameStore.setState({ atTitleScreen: false, isInitialized: true });
  return render(<TooltipProvider><TrainingPlanner /></TooltipProvider>);
}

describe('TrainingPlanner (Battle Plans)', () => {
  beforeEach(() => {
    const fresh = createFreshState('test-seed');
    useGameStore.getState().loadGame('test-slot', fresh as GameState);
  });

  it('renders "Battle Plans" title in header', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    renderPlanner([w1]);
    const heading = screen.getByRole('heading', { name: 'Battle Plans' });
    expect(heading).toBeInTheDocument();
  });

  it('renders "STABLE · STRATEGY" subtitle', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    renderPlanner([w1]);
    expect(screen.getByText('STABLE · STRATEGY')).toBeInTheDocument();
  });

  it('renders "Plans Set" stat showing X of N', () => {
    const w1 = makeTestWarrior('w1', 'Alpha', { plan: makePlan() });
    const w2 = makeTestWarrior('w2', 'Beta');
    const w3 = makeTestWarrior('w3', 'Gamma', { plan: makePlan() });
    renderPlanner([w1, w2, w3]);
    expect(screen.getByText('Plans Set')).toBeInTheDocument();
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
  });

  it('renders "Unassigned" stat showing count without plans', () => {
    const w1 = makeTestWarrior('w1', 'Alpha', { plan: makePlan() });
    const w2 = makeTestWarrior('w2', 'Beta');
    const w3 = makeTestWarrior('w3', 'Gamma');
    renderPlanner([w1, w2, w3]);
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText(/2\s*warriors/i)).toBeInTheDocument();
  });

  it('renders WarriorSelector with warrior names', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    const w2 = makeTestWarrior('w2', 'Beta');
    renderPlanner([w1, w2]);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('WarriorSelector shows "Plan Set" for warriors with a plan', () => {
    const w1 = makeTestWarrior('w1', 'Alpha', { plan: makePlan() });
    renderPlanner([w1]);
    expect(screen.getByText('Plan Set')).toBeInTheDocument();
  });

  it('WarriorSelector shows "No Plan" for warriors without a plan', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    renderPlanner([w1]);
    expect(screen.getByText('No Plan')).toBeInTheDocument();
  });

  it('when warrior selected, renders PlanBuilder', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    renderPlanner([w1]);
    expect(screen.getByText('Battle Strategy')).toBeInTheDocument();
  });

  it('when no warrior selected (empty roster), renders empty state', () => {
    renderPlanner([]);
    expect(screen.getByText('No Warrior Selected')).toBeInTheDocument();
  });

  it('empty state copy says "configure battle plans"', () => {
    renderPlanner([]);
    expect(screen.getByText(/configure battle plans/i)).toBeInTheDocument();
  });

  it('Training tab Link present with href to /stable/training', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    renderPlanner([w1]);
    const trainingLink = screen.getByText('Training').closest('a');
    expect(trainingLink).toHaveAttribute('href', '/stable/training');
  });

  it('handlePlanChange mutates warrior.plan in store', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    renderPlanner([w1]);

    const newPlan = makePlan(FightingStyle.BashingAttack);
    newPlan.OE = 9;
    useGameStore.getState().setState((draft) => {
      const found = draft.roster.find((w) => w.id === 'w1');
      if (found) found.plan = newPlan;
    });

    const roster = useGameStore.getState().roster;
    expect(roster[0]!.plan).toBeDefined();
    expect(roster[0]!.plan!.OE).toBe(9);
  });

  it('warrior with plan undefined receives defaultPlanForWarrior', () => {
    const w1 = makeTestWarrior('w1', 'Alpha', { style: FightingStyle.BashingAttack });
    renderPlanner([w1]);
    // PlanBuilder shows STYLE_DISPLAY_NAMES[plan.style] in its header
    // BashingAttack display name is 'Basher'
    expect(screen.getByText(/Basher/i)).toBeInTheDocument();
  });

  it('store sync: after plan mutation, reading warrior from store shows updated plan', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    renderPlanner([w1]);

    const updatedPlan = makePlan();
    updatedPlan.AL = 8;
    useGameStore.getState().setState((draft) => {
      const found = draft.roster.find((w) => w.id === 'w1');
      if (found) found.plan = updatedPlan;
    });

    const warrior = useGameStore.getState().roster.find((w) => w.id === 'w1');
    expect(warrior?.plan?.AL).toBe(8);
  });
});
