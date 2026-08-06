// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@/test/_setup/setup';

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
  }),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  createFileRoute: () => () => ({}),
}));

import StableEquipment from '@/pages/StableEquipment';

describe('StableEquipment page', () => {
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
});
