// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId } from '@/types/shared.types';

vi.mock('zustand/react/shallow', () => ({ ...__SHARED_MOCKS.useShallow }));

let mockState: { roster: Warrior[] } = { roster: [] };

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector: (s: unknown) => unknown) => selector(mockState),
}));

import { StyleMeterTable } from '@/components/charts/StyleMeterTable';
import { makeMidWarrior } from '@/test/_fixtures/statWarrior';

/**
 * V20 component-behavior pin (PR #1069).
 *
 * MEGAPLAN-V4: the bolt roster-projection change introduces an explicit
 * `if (!style) continue` guard — pre-merge, a roster entry with a falsy
 * style produced an 'undefined'-keyed ghost row (empty abbrev + bar).
 * Post-merge it is skipped entirely. Parked until the branch lands.
 */
describe('MEGAPLAN-V4: StyleMeterTable roster projection (PR #1069)', () => {
  beforeEach(() => {
    mockState = { roster: [] };
  });

  it('skips warriors with a falsy style instead of rendering a ghost row (MEGAPLAN-V4)', () => {
    mockState = {
      roster: [
        makeMidWarrior({
          id: 'w1' as WarriorId,
          style: FightingStyle.StrikingAttack,
          career: { wins: 3, losses: 1, kills: 0 },
        }),
        makeMidWarrior({
          id: 'w2' as WarriorId,
          style: '' as FightingStyle,
          career: { wins: 9, losses: 0, kills: 0 },
        }),
      ],
    };
    const { container } = render(<StyleMeterTable />);
    expect(container.textContent).toContain('ST');
    expect(container.textContent).not.toContain('9W/0L');
    expect(container.textContent).not.toContain('undefined');
  });
});
