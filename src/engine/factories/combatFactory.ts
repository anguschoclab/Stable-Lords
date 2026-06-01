/**
 * Combat Factory - Creates fight summaries for testing
 * Extracted from factories.ts to follow SRP
 */
import type { FightSummary } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
import { generateId } from '@/utils/idUtils';

/**
 * Creates a fight summary for testing purposes.
 */
export function makeFightSummary(
  overrides: Partial<FightSummary> = {},
  createdAt: string = '2024-01-01T00:00:00.000Z'
): FightSummary {
  return {
    id: generateId(undefined, 'fight'),
    week: 1,
    a: 'Attacker',
    d: 'Defender',
    warriorIdA: 'warrior-a',
    warriorIdD: 'warrior-d',
    styleA: FightingStyle.BashingAttack,
    styleD: FightingStyle.TotalParry,
    winner: 'A',
    by: 'KO',
    title: 'Practice Match',
    transcript: [],
    createdAt,
    ...overrides,
  };
}
