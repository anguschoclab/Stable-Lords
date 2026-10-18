import { describe, it, expect } from 'vitest';
import { getWarriorReturnContext } from '@/pages/WarriorDetail/returnContext';

describe('warrior detail return context', () => {
  it('returns player-owned warriors to the roster', () => {
    expect(getWarriorReturnContext({ isPlayerOwned: true })).toEqual({
      to: '/stable/roster',
      label: 'Back to Roster',
    });
  });

  it('returns rival warriors to their stable dossier when ownership is known', () => {
    expect(
      getWarriorReturnContext({ isPlayerOwned: false, ownerStableId: 'rival-1' })
    ).toEqual({
      to: '/world/stable/rival-1',
      label: 'Back to Stable',
    });
  });

  it('falls back to scouting when a rival warrior has no known stable', () => {
    expect(getWarriorReturnContext({ isPlayerOwned: false })).toEqual({
      to: '/world/scouting',
      label: 'Back to Scouting',
    });
  });
});
