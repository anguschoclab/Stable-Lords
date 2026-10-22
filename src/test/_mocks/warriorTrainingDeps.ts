import { vi } from 'vitest';

/**
 * Shared engine-dependency mocks for WarriorTrainingCard specs.
 * `training(gainChance)` — default return for computeGainChance.
 */
export const training = (gainChance = 0) => ({
  computeGainChance: vi.fn(() => gainChance),
});

export const potential = {
  canGrow: vi.fn(() => true),
};

export const traitTraining = {
  traitTrainingPool: vi.fn(() => []),
  canAcquireTrait: vi.fn(() => false),
  TRAIT_CAP: 3,
};
