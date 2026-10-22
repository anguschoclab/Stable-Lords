// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AvatarRerollButton } from '@/components/avatar/AvatarRerollButton';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { AvatarConfig } from '@/types/avatar.types';
import { TEST_AVATAR_CONFIG } from '@/test/_fixtures/avatarData';

describe('AvatarRerollButton', () => {
  const config: AvatarConfig = TEST_AVATAR_CONFIG;

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
