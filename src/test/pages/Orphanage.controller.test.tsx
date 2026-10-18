// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mocks = vi.hoisted(() => ({
  flow: {
    step: 0,
    setStep: vi.fn(),
    stableInput: 'Stable',
    setStableInput: vi.fn(),
    ownerInput: 'Owner',
    setOwnerInput: vi.fn(),
    selected: new Set(['w1']),
    orphanPool: [{ id: 'w1' }],
    boutResult: { outcome: { winner: 'A' } },
    playerPlan: { aggression: 5 },
    setPlayerPlan: vi.fn(),
    planWarrior: { id: 'w1', style: 'Bashing Attack' },
    rerollPool: vi.fn(),
    toggleWarrior: vi.fn(),
    runTutorialBout: vi.fn(async () => undefined),
    finishFTUE: vi.fn(),
    initializeStable: vi.fn(),
    returnToTitle: vi.fn(),
  },
}));

vi.mock('@/pages/orphanage/useFtueFlow', () => ({
  useFtueFlow: () => mocks.flow,
}));

vi.mock('@/engine', () => ({
  defaultPlanForWarrior: vi.fn(() => ({ aggression: 5 })),
}));

vi.mock('@/components/orphanage/StepProgress', () => ({
  default: ({ step, total }: { step: number; total: number }) => (
    <div data-testid="step-progress">{`${step}/${total}`}</div>
  ),
}));

vi.mock('@/components/orphanage/IdentityStep', () => ({
  default: ({ onBack, onSubmit }: any) => (
    <div>
      <div>Identity Step</div>
      <button onClick={onBack}>Identity Back</button>
      <button onClick={onSubmit}>Identity Submit</button>
    </div>
  ),
}));

vi.mock('@/components/orphanage/WarriorSelectionStep', () => ({
  default: ({ onBack, onNext }: any) => (
    <div>
      <div>Warrior Selection Step</div>
      <button onClick={onBack}>Selection Back</button>
      <button onClick={onNext}>Selection Next</button>
    </div>
  ),
}));

vi.mock('@/components/orphanage/PlanStep', () => ({
  default: ({ onBack, onNext }: any) => (
    <div>
      <div>Plan Step</div>
      <button onClick={onBack}>Plan Back</button>
      <button onClick={onNext}>Plan Next</button>
    </div>
  ),
}));

vi.mock('@/components/orphanage/FirstBloodStep', () => ({
  default: ({ onBack, onNext }: any) => (
    <div>
      <div>First Blood Step</div>
      <button onClick={onBack}>Bout Back</button>
      <button onClick={onNext}>Bout Next</button>
    </div>
  ),
}));

vi.mock('@/components/orphanage/StoryBeginsStep', () => ({
  default: ({ onFinish }: any) => (
    <div>
      <div>Story Begins Step</div>
      <button onClick={onFinish}>Finish FTUE</button>
    </div>
  ),
}));

import Orphanage from '@/pages/Orphanage';

function renderStep(step: number) {
  mocks.flow.step = step;
  return render(<Orphanage />);
}

describe('Orphanage FTUE controller', () => {
  it('renders all five named steps', () => {
    const labels = [
      'Identity Step',
      'Warrior Selection Step',
      'Plan Step',
      'First Blood Step',
      'Story Begins Step',
    ];

    labels.forEach((label, step) => {
      const { unmount } = renderStep(step);
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByTestId('step-progress')).toHaveTextContent(`${step}/5`);
      unmount();
    });
  });

  it('commits identity and advances to warrior selection', () => {
    renderStep(0);
    fireEvent.click(screen.getByText('Identity Submit'));

    expect(mocks.flow.initializeStable).toHaveBeenCalledWith('Owner', 'Stable');
    expect(mocks.flow.setStep).toHaveBeenCalledWith(1);
  });

  it('moves between identity, selection, and plan steps', () => {
    renderStep(1);
    fireEvent.click(screen.getByText('Selection Back'));
    expect(mocks.flow.setStep).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByText('Selection Next'));
    expect(mocks.flow.setPlayerPlan).toHaveBeenCalledWith({ aggression: 5 });
    expect(mocks.flow.setStep).toHaveBeenCalledWith(2);
  });

  it('runs the tutorial bout before advancing to the result step', async () => {
    renderStep(2);
    fireEvent.click(screen.getByText('Plan Next'));

    await waitFor(() => {
      expect(mocks.flow.runTutorialBout).toHaveBeenCalledOnce();
      expect(mocks.flow.setStep).toHaveBeenCalledWith(3);
    });
  });

  it('supports result review navigation and finishes the flow', () => {
    renderStep(3);
    fireEvent.click(screen.getByText('Bout Back'));
    expect(mocks.flow.setStep).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByText('Bout Next'));
    expect(mocks.flow.setStep).toHaveBeenCalledWith(4);
  });

  it('finishes through the terminal story step', () => {
    renderStep(4);
    fireEvent.click(screen.getByText('Finish FTUE'));
    expect(mocks.flow.finishFTUE).toHaveBeenCalledOnce();
  });
});
