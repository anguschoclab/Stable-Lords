import { makePageStoreState } from '@/test/_fixtures/storeState';
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import Tournaments from '@/pages/Tournaments';
import '@/test/_setup/setup';

import { useGameStore } from '@/state/useGameStore';

const fakeStoreState = makePageStoreState();

// We mock @tanstack/react-router to avoid setting up a full router context
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: any) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
}));

// Mock context hook removed - using actual store + renderWithGameState

describe('Tournaments Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Inject fake state into the real store — vi.mock's importOriginal arg
    // does not exist under bun:test.
    useGameStore.setState({ ...fakeStoreState } as never);
  });

  it('renders recruit operatives button when criteria are met', () => {
    const { getByText, getByRole } = render(<Tournaments />);

    // Check main title
    expect(getByText(/Seasonal Campaigns/)).toBeDefined();

    // Check Recruit Units button is present when tournament is null
    const recruitBtn = getByRole('button', { name: /Recruit Warriors/i });
    expect(recruitBtn).toBeDefined();
  });
});
