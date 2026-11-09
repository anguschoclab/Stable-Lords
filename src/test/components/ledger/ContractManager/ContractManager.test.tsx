/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { ContractManager } from '@/components/ledger/ContractManager/index';
import { describe, it, expect, vi } from 'vitest';
import { RouterProvider, createRouter, createRootRoute } from '@tanstack/react-router';
import { TooltipProvider } from '@radix-ui/react-tooltip';

// Mock the hook to provide predictable data
vi.mock('@/components/ledger/ContractManager/hooks/useContractData', () => ({
  useContractData: vi.fn(() => ({
    activeTrainers: [],
    totalWeeklyExpense: 0,
    expiringSoonCount: 0,
  })),
  getSalary: vi.fn(() => 100),
  getTierLabel: vi.fn(() => 'Tier 1'),
}));

import { useContractData } from '@/components/ledger/ContractManager/hooks/useContractData';

const router = createRouter({
  routeTree: createRootRoute({
    component: () => (
      <TooltipProvider>
        <ContractManager />
      </TooltipProvider>
    ),
  }),
});

describe('ContractManager', () => {
  it('renders the EmptyContractState when there are no active trainers', async () => {
    vi.mocked(useContractData).mockReturnValue({
      activeTrainers: [],
      totalWeeklyExpense: 0,
      expiringSoonCount: 0,
    });

    render(<RouterProvider router={router} />);
    expect(await screen.findByText('No Active Contracts')).toBeInTheDocument();
  });

  it('renders the table of trainers when there are active trainers', async () => {
    vi.mocked(useContractData).mockReturnValue({
      activeTrainers: [
        {
          id: 't1',
          name: 'Bob the Builder',
          role: 'Combat Coach',
          tier: 1,
          specialty: 'Offense',
          contractWeeksRemaining: 5,
          weeklyCost: 100,
        }
      ] as any,
      totalWeeklyExpense: 100,
      expiringSoonCount: 0,
    });

    render(<RouterProvider router={router} />);
    expect(await screen.findByText('Bob the Builder')).toBeInTheDocument();
    expect(screen.getByText('-100G / Cycle')).toBeInTheDocument();
  });
});
