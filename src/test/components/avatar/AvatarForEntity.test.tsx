// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { AvatarForEntity } from '@/components/avatar/AvatarForEntity';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeTestWarrior } from '@/test/_fixtures/namedWarrior';

describe('AvatarForEntity', () => {
  beforeEach(() => {
    const fresh = createFreshState('test');
    useGameStore.getState().loadGame('autosave', fresh);
  });

  const warrior = makeTestWarrior('w-1', 'Aulus', { avatarSeed: 12345, age: 25 });

  it('renders a portrait for a warrior', () => {
    const { container } = render(
      <AvatarForEntity entityId="w-1" entityType="warrior" source={warrior} size="md" />
    );
    expect(container.querySelectorAll('img').length).toBeGreaterThan(0);
  });

  it('caches the generated avatar in the store', () => {
    render(<AvatarForEntity entityId="w-1" entityType="warrior" source={warrior} size="md" />);
    expect(useGameStore.getState().avatarCache['w-1']).toBeDefined();
  });

  it('reads a cached avatar without regenerating', () => {
    useGameStore.getState().setAvatar('w-1', {
      seed: 999,
      entityType: 'warrior',
      gender: 'fem',
      ageGroup: 'adult',
      primaryColor: '#000000',
      layers: [{ category: 'base', src: '/cached.png', z: 0 }],
    });
    const { container } = render(
      <AvatarForEntity entityId="w-1" entityType="warrior" source={warrior} size="md" />
    );
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/cached.png');
  });

  it('resolves a dead/retired rival warrior to its stable crest, not the player crest (V16/F4)', () => {
    // The roster scan only sees live rosters — a fallen rival warrior must
    // still resolve its stable's colors through `stableId`.
    const fresh = createFreshState('test-crest');
    fresh.rivals = [
      {
        id: 'rival-9',
        owner: {
          id: 'rival-9',
          name: 'R',
          stableName: 'Rivals',
          fame: 0,
          renown: 0,
          titles: 0,
          personality: 'Pragmatic',
        },
        fame: 0,
        treasury: 0,
        roster: [],
        ledger: [],
        trainingAssignments: [],
        crest: {
          shieldShape: 'heater',
          fieldType: 'plain',
          primaryColor: '#112233',
          metalColor: 'argent',
          charge: { kind: 'none' },
          generation: 0,
        },
      },
    ] as never;
    useGameStore.getState().loadGame('autosave', fresh);

    const fallen = makeTestWarrior('w-fallen', 'Fallen', {
      avatarSeed: 777,
      stableId: 'rival-9',
    } as never);
    render(<AvatarForEntity entityId="w-fallen" entityType="warrior" source={fallen} size="md" />);
    expect(useGameStore.getState().avatarCache['w-fallen']?.primaryColor).toBe('#112233');
  });
});
