import type { LedgerEntry } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { LedgerEntryId } from '@/types/shared.types';

/**
 * Creates a ledger entry with an RNG-generated id.
 * Consumes one `rng.uuid('ledger')` call — deterministic when seeded.
 */
export function makeLedgerEntry(
  rng: IRNGService,
  week: number,
  label: string,
  amount: number,
  category: LedgerEntry['category']
): LedgerEntry {
  return {
    id: rng.uuid('ledger') as LedgerEntryId,
    week,
    label,
    amount,
    category,
  };
}
