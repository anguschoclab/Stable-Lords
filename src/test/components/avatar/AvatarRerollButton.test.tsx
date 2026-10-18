// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AvatarRerollButton } from '@/components/avatar/AvatarRerollButton';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { AvatarConfig } from '@/types/avatar.types';

describe('AvatarRerollButton', () => {
  const config: AvatarConfig = {
    entityId: 'w-1',
    entityType: 'warrior',
    seed: 12345,
    name: 'Aulus',
    age: 25,
  };

  beforeEach(() => {
    const fresh = createFreshState('test');
    useGameStore.getState().loadGame('autosave', fresh);
  });

  it('rerolls the avatar when clicked', () => {
    const first = useGameStore.getState().ensureAvatar(config);
    render(<AvatarRerollButton config={config} />);
    const button = screen.getByRole('button', { name: /reroll portrait/i });
    fireEvent.click(button);
    const cached = useGameStore.getState().avatarCache['w-1'];
    expect(cached).toBeDefined();
    expect(cached?.seed).not.toBe(first.seed);
  });
});
