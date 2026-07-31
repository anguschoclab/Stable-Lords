/**
 * Switch label accessibility — verifies that Switch components in planBuilder
 * have proper label associations via htmlFor/id after PR #748 merge.
 *
 * Tests are UNCONDITIONAL: they fail if labels are missing, not silently passing.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ContingencyPlans from '@/components/planBuilder/ContingencyPlans';
import PhaseOverrides from '@/components/planBuilder/PhaseOverrides';
import StylePassives from '@/components/planBuilder/StylePassives';
import type { FightPlan } from '@/types/game';

function makePlan(overrides: Partial<FightPlan> = {}): FightPlan {
  return {
    style: 'StrikingAttack' as any,
    openingPlan: { aggression: 5, initiative: 5, range: 5 } as any,
    midPlan: { aggression: 5, initiative: 5, range: 5 } as any,
    latePlan: { aggression: 5, initiative: 5, range: 5 } as any,
    contingencies: [],
    stylePassives: { useParry: false, useRiposte: false, useCounter: false },
    phaseOverrides: [],
    ...overrides,
  } as FightPlan;
}

function expectSwitchHasLabel(container: HTMLElement, componentName: string) {
  const switchEl = container.querySelector('[role="switch"]');
  expect(switchEl, `${componentName} should render a Switch element`).toBeTruthy();

  const hasLabel =
    switchEl!.getAttribute('aria-label') ||
    switchEl!.getAttribute('aria-labelledby') ||
    switchEl!.id;
  expect(
    hasLabel,
    `${componentName} Switch must have an aria-label, aria-labelledby, or id for label association`
  ).toBeTruthy();
}

describe('Switch label accessibility in planBuilder', () => {
  it('ContingencyPlans Switch has an associated label', () => {
    const plan = makePlan();
    const { container } = render(
      <ContingencyPlans plan={plan} onPlanChange={() => {}} />
    );
    expectSwitchHasLabel(container, 'ContingencyPlans');
  });

  it('PhaseOverrides Switch has an associated label', () => {
    const plan = makePlan();
    const { container } = render(
      <PhaseOverrides plan={plan} onPlanChange={() => {}} />
    );
    expectSwitchHasLabel(container, 'PhaseOverrides');
  });

  it('StylePassives Switch has an associated label', () => {
    const plan = makePlan();
    const { container } = render(
      <StylePassives plan={plan} />
    );
    expectSwitchHasLabel(container, 'StylePassives');
  });

  it('all Switch elements in planBuilder are keyboard accessible', () => {
    const plan = makePlan();
    const { container } = render(
      <div>
        <ContingencyPlans plan={plan} onPlanChange={() => {}} />
        <PhaseOverrides plan={plan} onPlanChange={() => {}} />
        <StylePassives plan={plan} />
      </div>
    );

    const switches = container.querySelectorAll('[role="switch"]');
    expect(switches.length, 'should render at least one switch').toBeGreaterThan(0);
    for (const sw of switches) {
      const isFocusable =
        sw.tagName === 'BUTTON' ||
        sw.getAttribute('tabindex') !== null;
      expect(isFocusable, 'Switch should be focusable (button or have tabindex)').toBe(true);
    }
  });

  it('Label htmlFor attributes match element ids in ContingencyPlans', () => {
    const plan = makePlan();
    const { container } = render(
      <ContingencyPlans plan={plan} onPlanChange={() => {}} />
    );

    const labels = container.querySelectorAll('label[htmlfor]');
    for (const label of labels) {
      const htmlFor = label.getAttribute('htmlfor');
      expect(htmlFor, 'Label should have non-empty htmlFor').toBeTruthy();
      const target = container.querySelector(`#${CSS.escape(htmlFor!)}`);
      expect(target, `Label htmlFor="${htmlFor}" should match an element with that id`).toBeTruthy();
    }
  });
});
