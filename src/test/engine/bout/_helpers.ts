/**
 * Shared mock builders for handleProgressions specs — the minimal GameState /
 * FightOutcome shapes the handler consumes plus the two warrior profiles each
 * spec needs (bare for XP/favorites routing, computed for learn rolls).
 */
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import type { WarriorId, StableId } from '@/types/shared.types';
import { FightingStyle } from '@/types/shared.types';
import type { BaseSkills } from '@/types/shared.types';

/** Bare warrior — no attributes/skills; XP + favorites routing only. */
export const mkBoutWarrior = (overrides: Partial<Warrior> = {}): Warrior =>
  ({
    id: 'warrior-a' as WarriorId,
    name: 'Warrior A',
    fame: 10,
    popularity: 5,
    favorites: {
      weaponId: 'broadsword',
      rhythm: { oe: 5, al: 5 },
      discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
    },
    flair: [],
    career: { wins: 5, losses: 3, kills: 1 },
    ...overrides,
  }) as Warrior;

/** Computed-profile warrior — 21-WT lunger whose learn rolls actually land. */
export const mkLearnWarrior = (overrides: Partial<Warrior> = {}): Warrior =>
  mkBoutWarrior({
    style: FightingStyle.LungingAttack,
    attributes: { ST: 11, CN: 11, SZ: 11, WT: 21, WL: 11, SP: 11, DF: 11 },
    ...overrides,
  });

export const mkBoutState = (overrides: Partial<GameState> = {}): GameState =>
  ({
    week: 1,
    roster: [],
    rivalMap: new Map(),
    warriorToStableMap: new Map(),
    player: { id: 'player-1' as StableId },
    ...overrides,
  }) as unknown as GameState;

export const mkBoutOutcome = (overrides: Partial<FightOutcome> = {}): FightOutcome => ({
  winner: 'A',
  by: 'KO',
  minutes: 5,
  log: [],
  post: { xpA: 100, xpD: 50 },
  ...overrides,
});

export const totalGained = (m?: Partial<Record<keyof BaseSkills, number>>): number =>
  Object.values(m ?? {}).reduce((s, v) => s + (v ?? 0), 0);
