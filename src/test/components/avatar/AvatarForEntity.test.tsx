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
      layers: [
        { category: 'base', src: '/cached.png', z: 0 },
      ],
    });
    const { container } = render(
      <AvatarForEntity entityId="w-1" entityType="warrior" source={warrior} size="md" />
    );
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/cached.png');
  });
});
