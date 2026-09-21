// @vitest-environment jsdom
/**
 * A5 — WeaponTrail wiring: ArenaView flashes a weapon trail on attack events,
 * typed by the attacker's equipped weapon and directed by the actor side.
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import ArenaView from '@/components/arena/ArenaView';
import { weaponTrailTypeFor } from '@/components/arena/effects/weaponTrailType';
import type { MinuteEvent } from '@/types/combat.types';
import { FightingStyle } from '@/types/shared.types';

vi.mock('@/hooks/useArenaAnimation', () => ({
  useArenaAnimation: () => ({
    fighterA: {},
    fighterD: {},
    bubbles: [],
    hpA: 50,
    hpD: 50,
    fpA: 10,
    fpD: 10,
    removeBubble: () => {},
  }),
}));

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (sel: (s: Record<string, unknown>) => unknown) =>
    sel({ season: 'Spring' }),
  useArenaPreferences: () => ({
    effectsEnabled: true,
    screenShakeIntensity: 'low',
  }),
}));

vi.mock('@/components/arena/ArenaBackground', () => ({ default: () => null }));
vi.mock('@/components/arena/ArenaAudio', () => ({ default: () => null }));
vi.mock('@/components/arena/SpeechBubbles', () => ({ default: () => null }));
vi.mock('@/components/arena/FighterPair', () => ({ default: () => null }));
vi.mock('@/components/arena/MiniCombatLog', () => ({ default: () => null }));
vi.mock('@/components/arena/crowd/CrowdReactions', () => ({ default: () => null }));
vi.mock('@/components/arena/effects/ParticleSystem', () => ({ default: () => null }));
vi.mock('@/components/arena/effects/ScreenShake', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const hitEvent = (actor: 'A' | 'D'): MinuteEvent => ({
  minute: 1,
  text: 'Alpha strikes Bravo for damage',
  events: [{ type: 'HIT', actor, value: 5 }],
});

const baseProps = {
  nameA: 'Alpha',
  nameD: 'Bravo',
  styleA: FightingStyle.StrikingAttack,
  styleD: FightingStyle.BashingAttack,
  winner: null,
  visibleCount: 1,
  weaponIdA: 'greatsword',
  weaponIdD: 'mace',
};

describe('weaponTrailTypeFor', () => {
  it('classifies weapons by damage profile', () => {
    expect(weaponTrailTypeFor('greatsword')).toBe('slash');
    expect(weaponTrailTypeFor('mace')).toBe('bash');
    expect(weaponTrailTypeFor('long_spear')).toBe('pierce');
    expect(weaponTrailTypeFor('fist')).toBe('fist');
    expect(weaponTrailTypeFor(undefined)).toBe('fist');
  });
});

describe('ArenaView weapon trail (A5)', () => {
  it('renders a trail on an attack event from side A', () => {
    const { container } = render(
      <ArenaView {...baseProps} log={[hitEvent('A')]} />
    );
    const path = container.querySelector('svg path');
    expect(path).not.toBeNull();
    expect(path?.getAttribute('class')).toContain('stroke-slate-300');
  });

  it('renders a trail for the defender-side attacker with its weapon class', () => {
    const { container } = render(
      <ArenaView {...baseProps} log={[hitEvent('D')]} />
    );
    const path = container.querySelector('svg path');
    expect(path?.getAttribute('class')).toContain('stroke-orange-400');
  });

  it('renders no trail on non-attack events', () => {
    const status: MinuteEvent = { minute: 1, text: '— Phase: OPENING —' };
    const { container } = render(<ArenaView {...baseProps} log={[status]} />);
    expect(container.querySelector('svg path')).toBeNull();
  });

  it('renders no trail when weapon ids are unavailable', () => {
    const { container } = render(
      <ArenaView
        nameA="Alpha"
        nameD="Bravo"
        styleA={FightingStyle.StrikingAttack}
        styleD={FightingStyle.BashingAttack}
        winner={null}
        visibleCount={1}
        log={[hitEvent('A')]}
      />
    );
    expect(container.querySelector('svg path')).toBeNull();
  });
});
