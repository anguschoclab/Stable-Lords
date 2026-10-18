// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@/test/_setup/setup';

const hookState = vi.hoisted(() => ({ pendingLoadout: null as any }));

vi.mock('@/pages/StableEquipment/hooks/useStableEquipment', () => ({
  useStableEquipment: () => ({
    activeWarriors: [],
    selectedStyle: 'StrikingAttack',
    targetWarriorId: null,
    targetWarrior: null,
    carryCap: 10,
    recs: [],
    tips: [],
    styleEntries: [['StrikingAttack', 'Striking Attack']],
    handleStyleChange: vi.fn(),
    setTargetWarriorId: vi.fn(),
    handleApply: vi.fn(),
    pendingLoadout: hookState.pendingLoadout,
    commitLoadout: vi.fn(),
    cancelLoadout: vi.fn(),
  }),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  createFileRoute: () => () => ({}),
}));

import StableEquipment from '@/pages/StableEquipment';

describe('StableEquipment page', () => {
  beforeEach(() => {
    hookState.pendingLoadout = null;
  });

  it('renders the page header with "The Armory" title', () => {
    render(<StableEquipment />);
    expect(screen.getByText('The Armory')).toBeInTheDocument();
  });

  it('renders the style select label with htmlFor association', () => {
    const { container } = render(<StableEquipment />);
    const label = container.querySelector('label[for="style-select"]');
    expect(label).toBeInTheDocument();
    expect(label?.textContent).toMatch(/select style/i);
  });

  it('renders the style select trigger with id="style-select"', () => {
    const { container } = render(<StableEquipment />);
    const trigger = container.querySelector('#style-select');
    expect(trigger).toBeInTheDocument();
  });

  it('renders the Style Recommendations section', () => {
    render(<StableEquipment />);
    expect(screen.getByText('Style')).toBeInTheDocument();
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
  });

  it('renders the Style Champions section', () => {
    render(<StableEquipment />);
    expect(screen.getByText('Style Champions')).toBeInTheDocument();
  });

  it('renders a truthful pending loadout review with confirm and cancel actions', () => {
    hookState.pendingLoadout = {
      label: 'Power Build',
      loadout: {
        weapon: 'war_hammer',
        armor: 'padded',
        shield: 'none_shield',
        helm: 'leather_cap',
      },
    };

    render(<StableEquipment />);

    expect(screen.getByText('Pending loadout review')).toBeInTheDocument();
    expect(screen.getByText('Power Build')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm Loadout/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });
});
