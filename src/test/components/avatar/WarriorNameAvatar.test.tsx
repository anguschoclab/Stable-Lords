// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { WarriorNameAvatar } from '@/components/avatar/WarriorNameAvatar';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeTestWarrior } from '@/test/_fixtures/namedWarrior';

describe('WarriorNameAvatar', () => {
  beforeEach(() => {
    const fresh = createFreshState('test');
    useGameStore.getState().loadGame('autosave', fresh);
  });

  it('resolves a roster warrior by name and renders a portrait', () => {
    const warrior = makeTestWarrior('w-abc', 'Aulus', { avatarSeed: 777, age: 25 });
    useGameStore.getState().loadGame('autosave', {
      ...useGameStore.getState(),
      roster: [warrior],
    } as never);
    const { container } = render(<WarriorNameAvatar name="Aulus" />);
    expect(container.querySelectorAll('img').length).toBeGreaterThan(0);
    expect(useGameStore.getState().avatarCache[warrior.id]).toBeDefined();
  });

  it('resolves a roster warrior by id', () => {
    const warrior = makeTestWarrior('w-xyz', 'Brutus', { avatarSeed: 42 });
    useGameStore.getState().loadGame('autosave', {
      ...useGameStore.getState(),
      roster: [warrior],
    } as never);
    const { container } = render(<WarriorNameAvatar warriorId={warrior.id} />);
    expect(container.querySelectorAll('img').length).toBeGreaterThan(0);
  });

  it('resolves dead warriors from the graveyard', () => {
    const dead = makeTestWarrior('w-dead', 'Mortus', {
      avatarSeed: 1,
      status: 'Dead',
    } as never);
    useGameStore.getState().loadGame('autosave', {
      ...useGameStore.getState(),
      roster: [],
      graveyard: [dead],
    } as never);
    const { container } = render(<WarriorNameAvatar warriorId={dead.id} name="Mortus" />);
    expect(container.querySelectorAll('img').length).toBeGreaterThan(0);
  });

  it('prefers warriorId over name when two warriors share a display name', () => {
    const first = makeTestWarrior('w-first', 'Geminus', { avatarSeed: 11 });
    const second = makeTestWarrior('w-second', 'Geminus', { avatarSeed: 22 });
    useGameStore.getState().loadGame('autosave', {
      ...useGameStore.getState(),
      roster: [first, second],
    } as never);
    const { container } = render(<WarriorNameAvatar warriorId={second.id} name="Geminus" />);
    expect(container.querySelectorAll('img').length).toBeGreaterThan(0);
    // The portrait must be cached against the id passed in — the same-name
    // sibling's cache entry must not be what identity resolution produced.
    const cache = useGameStore.getState().avatarCache;
    expect(cache[second.id]).toBeDefined();
    expect(cache[first.id]).toBeUndefined();
  });

  it('renders nothing when the warrior cannot be resolved', () => {
    const { container } = render(<WarriorNameAvatar name="Nobody Named This" />);
    expect(container.firstChild).toBeNull();
  });
});
