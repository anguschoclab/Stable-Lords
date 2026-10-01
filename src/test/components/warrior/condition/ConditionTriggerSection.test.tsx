// @vitest-environment jsdom
/**
 * Stage E-R — the player-facing condition editor exposes the new
 * opponent-state and psych triggers, with the correct value input per type.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@/test/_setup/setup';
import { ConditionTriggerSection } from '@/components/warrior/condition/ConditionTriggerSection';
import type { PlanCondition } from '@/types/shared.types';

function cond(trigger: PlanCondition['trigger']): PlanCondition {
  return { trigger, override: {} };
}

function renderSection(c: PlanCondition) {
  return render(
    <ConditionTriggerSection cond={c} idx={0} onTriggerChange={vi.fn()} onValueChange={vi.fn()} />
  );
}

describe('ConditionTriggerSection — trigger coverage', () => {
  it('offers every engine trigger type, including the opponent-state and psych triggers', () => {
    renderSection(cond({ type: 'HP_BELOW', value: 35 }));
    const select = screen.getByLabelText('Condition trigger type');
    const values = Array.from(select.querySelectorAll('option')).map((o) => o.value);

    for (const type of [
      'HP_BELOW',
      'HP_ABOVE',
      'MOMENTUM_LEAD',
      'MOMENTUM_DEFICIT',
      'PHASE_IS',
      'ENDURANCE_BELOW',
      'OPPONENT_HP_BELOW',
      'OPPONENT_ENDURANCE_BELOW',
      'OPPONENT_MOMENTUM_LEAD',
      'PSYCH_IS',
    ]) {
      expect(values).toContain(type);
    }
  });

  it('renders the psych-state picker for PSYCH_IS', () => {
    renderSection(cond({ type: 'PSYCH_IS', value: 'Desperate' }));
    const psych = screen.getByLabelText('Condition trigger psych state');
    const values = Array.from(psych.querySelectorAll('option')).map((o) => o.value);
    expect(values).toContain('Desperate');
    expect(values).toContain('InTheZone');
  });

  it('renders a bounded integer picker for momentum triggers', () => {
    renderSection(cond({ type: 'OPPONENT_MOMENTUM_LEAD', value: 2 }));
    const select = screen.getByLabelText('Condition trigger phase or value');
    const values = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    expect(values).toEqual(['1', '2', '3']);
  });

  it('renders a percent input for opponent HP/endurance triggers', () => {
    const { container } = renderSection(cond({ type: 'OPPONENT_HP_BELOW', value: 40 }));
    const input = container.querySelector('input[type="number"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('max', '100');
  });
});
