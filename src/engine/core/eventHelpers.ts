/**
 * Shared event helper for constructing InsightToken objects.
 * Centralizes InsightToken creation to ensure consistent RNG call order
 * (uuid before any other RNG calls) and field population.
 */
import type { InsightToken, InsightTokenType } from '@/types/state.types';
import type { InsightId, WarriorId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

/**
 * Build an InsightToken with RNG-generated id.
 * Consumes one uuid('insight') call — preserves deterministic RNG call order.
 */
export function makeInsightToken(
  rng: IRNGService,
  params: {
    type: InsightTokenType;
    warriorId: WarriorId;
    warriorName: string;
    detail: string;
    discoveredWeek: number;
    targetKey?: string;
    origin?: string;
  }
): InsightToken {
  return {
    id: rng.uuid('insight') as InsightId,
    type: params.type,
    warriorId: params.warriorId,
    warriorName: params.warriorName,
    detail: params.detail,
    targetKey: params.targetKey,
    origin: params.origin,
    discoveredWeek: params.discoveredWeek,
  };
}
