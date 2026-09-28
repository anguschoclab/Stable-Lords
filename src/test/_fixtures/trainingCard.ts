import { vi } from 'vitest';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';
import { FightingStyle } from '@/types/shared.types';
import type { Attributes } from '@/types/shared.types';
import { makeWarrior } from '@/test/_fixtures/factories';

/** Shared WarriorTrainingCard test setup — standard warrior + noop props. */
export const makeTrainingWarrior = (overrides: Partial<Warrior> = {}): Warrior =>
  makeWarrior({
    id: 'w1' as WarriorId,
    name: 'Spartacus',
    style: FightingStyle.StrikingAttack,
    baseSkills: { ATT: 10, DEF: 10, INI: 10, PAR: 10, RIP: 10, DEC: 10 },
    career: { wins: 5, losses: 3, kills: 1 },
    fame: 7,
    popularity: 3,
    age: 24,
    potential: { ST: 20, CN: 20, SZ: 10, WT: 20, WL: 20, SP: 20, DF: 20 },
    potentialRevealed: { ST: true, CN: true, SZ: true, WT: true, WL: true, SP: true, DF: true },
    ...overrides,
  } as any);

export const makeTrainingCardProps = (): {
  assignment: undefined;
  seasonalGains: Partial<Record<keyof Attributes, number>>;
  trainers: never[];
  onAssign: (attr: keyof Attributes) => void;
  onAssignRecovery: () => void;
  onClear: () => void;
} => ({
  assignment: undefined,
  seasonalGains: {},
  trainers: [],
  onAssign: vi.fn<(attr: keyof Attributes) => void>(),
  onAssignRecovery: vi.fn<() => void>(),
  onClear: vi.fn<() => void>(),
});
