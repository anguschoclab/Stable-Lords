import { StateCreator } from 'zustand';
import { LedgerEntry, Promoter, BoutOffer, RankingEntry, AnnualAward } from '@/types/state.types';
import { canTransact as _canTransact } from '@/utils/economyUtils';
import type { GameStore } from '@/state/useGameStore';
import { generateId } from '@/utils/idUtils';
import {
  type PromoterId,
  type BoutOfferId,
  type WarriorId,
  type LedgerEntryId,
} from '@/types/shared.types';/**
                               * Defines the shape of economy slice.
                               */


/**
 * Defines the shape of economy slice.
 */
export interface EconomySlice {
  treasury: number;
  ledger: LedgerEntry[];
  fame: number;
  popularity: number;
  promoters: Record<PromoterId, Promoter>;
  boutOffers: Record<BoutOfferId, BoutOffer>;
  realmRankings: Record<WarriorId, RankingEntry>;
  awards: AnnualAward[];
  rosterBonus: number;
  addFunds: (amount: number, label: string, category: LedgerEntry['category']) => void;
  deductFunds: (amount: number, label: string, category: LedgerEntry['category']) => boolean;
}/**
  * Create economy slice.
  * @param set - Set.
  * @param get - Get.
  * @returns The result.
  */


/**
 * Create economy slice.
 * @param set - Set.
 * @param get - Get.
 * @returns The result.
 */
export const createEconomySlice: StateCreator<GameStore, [], [], EconomySlice> = (set, get) => ({
  treasury: 0,
  ledger: [],
  fame: 0,
  popularity: 0,
  promoters: {},
  boutOffers: {},
  realmRankings: {},
  awards: [],
  rosterBonus: 0,

  addFunds: (amount, label, category) => {
    set((state: GameStore) => ({
      treasury: state.treasury + amount,
      ledger: [
        ...state.ledger,
        {
          id: generateId() as LedgerEntryId,
          week: state.week,
          label,
          amount,
          category,
        },
      ],
    }));
  },

  deductFunds: (amount, label, category) => {
    if (!_canTransact(get().treasury, amount)) {
      return false;
    }

    set((state: GameStore) => ({
      treasury: state.treasury - amount,
      ledger: [
        ...state.ledger,
        {
          id: generateId() as LedgerEntryId,
          week: state.week,
          label,
          amount: -amount,
          category,
        },
      ],
    }));
    return true;
  },
});
