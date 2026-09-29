// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/components/ui/tooltip', () => ({ ...__SHARED_MOCKS.tooltip }));

import { WarriorNameTag } from '@/components/ui/WarriorBadges';

describe('WarriorNameTag', () => {
  it('renders the bare name when no epithet is given', () => {
    const { getByText } = render(<WarriorNameTag name="KRAGOS" />);
    expect(getByText('KRAGOS')).toBeInTheDocument();
  });

  it('renders the epithet alongside the name', () => {
    const { container } = render(<WarriorNameTag name="KRAGOS" epithet="the Red" />);
    expect(container.textContent).toContain('KRAGOS');
    expect(container.textContent).toContain('the Red');
  });
});
