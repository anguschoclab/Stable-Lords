// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/EventLog', () => ({
  default: () => <div data-testid="mobile-event-log">EventLog</div>,
}));

import { MobileEventLogSheet } from '@/components/layout/MobileEventLogSheet';

describe('MobileEventLogSheet', () => {
  it('renders the feed as an accessible mobile sheet when open', () => {
    render(<MobileEventLogSheet open onOpenChange={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Arena Feed' })).toBeInTheDocument();
    expect(screen.getByTestId('mobile-event-log')).toBeInTheDocument();
  });
});
