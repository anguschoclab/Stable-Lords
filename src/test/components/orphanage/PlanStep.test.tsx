// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@/test/_setup/setup';
import PlanStep from '@/components/orphanage/PlanStep';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { defaultPlanForWarrior } from '@/engine';
import { FightingStyle } from '@/types/shared.types';
import type { FightPlan } from '@/types/shared.types';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const warrior = makeWarrior('w1' as any, 'Varak', FightingStyle.LungingAttack, {
  ST: 12,
  CN: 10,
  SZ: 10,
  WT: 12,
  WL: 12,
  SP: 12,
  DF: 10,
});

const plan: FightPlan = {
  ...defaultPlanForWarrior(warrior),
  OE: 5,
  AL: 6,
  killDesire: 5,
  offensiveTactic: 'Lunge',
  defensiveTactic: 'Dodge',
};

describe('PlanStep — sliders', () => {
  it('renders "Offensive Effort" label', () => {
    render(
      <PlanStep
        warrior={warrior}
        plan={plan}
        onPlanChange={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />
    );
    expect(screen.getByText(/offensive effort/i)).toBeInTheDocument();
  });

  it('renders "Activity Level" label', () => {
    render(
      <PlanStep
        warrior={warrior}
        plan={plan}
        onPlanChange={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />
    );
    expect(screen.getByText(/activity level/i)).toBeInTheDocument();
  });

  it('renders "Kill Desire" label', () => {
    render(
      <PlanStep
        warrior={warrior}
        plan={plan}
        onPlanChange={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />
    );
    expect(screen.getByText(/kill desire/i)).toBeInTheDocument();
  });

  it('displays current OE value', () => {
    const p = { ...plan, OE: 7 };
    render(
      <PlanStep
        warrior={warrior}
        plan={p}
        onPlanChange={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />
    );
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('displays current AL value', () => {
    const p = { ...plan, AL: 4 };
    render(
      <PlanStep
        warrior={warrior}
        plan={p}
        onPlanChange={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />
    );
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('displays current KD value', () => {
    const p = { ...plan, killDesire: 9 };
    render(
      <PlanStep
        warrior={warrior}
        plan={p}
        onPlanChange={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />
    );
    expect(screen.getByText('9')).toBeInTheDocument();
  });
});

describe('PlanStep — tactic buttons', () => {
  it('renders all 8 tactic buttons', () => {
    render(
      <PlanStep
        warrior={warrior}
        plan={plan}
        onPlanChange={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />
    );
    const tacticLabels = ['Lunge', 'Slash', 'Bash', 'DEC', 'Dodge', 'Parry', 'Riposte', 'RESP'];
    for (const label of tacticLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('clicking offensive tactic calls onPlanChange with offensiveTactic set', () => {
    const onPlanChange = vi.fn();
    render(
      <PlanStep
        warrior={warrior}
        plan={plan}
        onPlanChange={onPlanChange}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Slash'));
    expect(onPlanChange).toHaveBeenCalledWith(
      expect.objectContaining({ offensiveTactic: 'Slash' })
    );
  });

  it('clicking defensive tactic calls onPlanChange with defensiveTactic set', () => {
    const onPlanChange = vi.fn();
    render(
      <PlanStep
        warrior={warrior}
        plan={plan}
        onPlanChange={onPlanChange}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Riposte'));
    expect(onPlanChange).toHaveBeenCalledWith(
      expect.objectContaining({ defensiveTactic: 'Riposte' })
    );
  });

  it('active offensive tactic button has bg-arena-blood/20 class', () => {
    const p = { ...plan, offensiveTactic: 'Lunge' as const };
    render(
      <PlanStep
        warrior={warrior}
        plan={p}
        onPlanChange={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />
    );
    const btn = screen.getByText('Lunge').closest('button');
    expect(btn?.className).toMatch(/bg-arena-blood\/20/);
  });

  it('inactive tactic button does NOT have bg-arena-blood/20 class', () => {
    const p = { ...plan, offensiveTactic: 'Lunge' as const };
    render(
      <PlanStep
        warrior={warrior}
        plan={p}
        onPlanChange={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />
    );
    const btn = screen.getByText('Slash').closest('button');
    expect(btn?.className).not.toMatch(/bg-arena-blood\/20/);
  });
});

describe('PlanStep — navigation', () => {
  it('clicking "To the Arena" calls onNext', () => {
    const onNext = vi.fn();
    render(
      <PlanStep
        warrior={warrior}
        plan={plan}
        onPlanChange={vi.fn()}
        onBack={vi.fn()}
        onNext={onNext}
      />
    );
    fireEvent.click(screen.getByText(/to the arena/i));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('clicking Back calls onBack', () => {
    const onBack = vi.fn();
    render(
      <PlanStep
        warrior={warrior}
        plan={plan}
        onPlanChange={vi.fn()}
        onBack={onBack}
        onNext={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText(/back/i));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
