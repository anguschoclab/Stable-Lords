import type { GameState, Warrior, NewsletterItem } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { StateImpact } from '@/engine/impacts';
import {
  BANKRUPTCY_THRESHOLD,
  MIN_BANKRUPTCY_ROSTER,
  DEBT_FLOOR,
  EMERGENCY_LOAN,
} from '@/constants/economy';

/**
 * BankruptcyService - Handles bankruptcy detection and processing.
 * Manages rival stable bankruptcy and removal, and player bankruptcy consequences.
 */
export const BankruptcyService = {
  /**
   * Processes bankruptcy for all rival stables.
   * Removes stables that have gone bankrupt.
   */
  processBankruptcy(
    state: GameState,
    _rng: IRNGService
  ): { updatedState: GameState; bankruptStables: string[] } {
    const updatedState = { ...state };
    const bankruptStables: string[] = [];

    updatedState.rivals = updatedState.rivals.filter((rival) => {
      if (rival.treasury < BANKRUPTCY_THRESHOLD) {
        bankruptStables.push(rival.owner.stableName);
        return false;
      }
      return true;
    });

    return { updatedState, bankruptStables };
  },

  /**
   * Processes player bankruptcy consequences.
   * If treasury < -500, force sell highest-fame warrior, reduce reputation, generate newsletter.
   * Returns StateImpact for integration with the pipeline.
   */
  processPlayerBankruptcy(
    state: GameState,
    rng: IRNGService
  ): { bankrupt: boolean; impact: StateImpact; soldWarrior?: Warrior } {
    if (state.treasury >= BANKRUPTCY_THRESHOLD) {
      return { bankrupt: false, impact: {} };
    }

    const impact: StateImpact = {};

    if (state.roster.length > MIN_BANKRUPTCY_ROSTER) {
      const highestFameWarrior = state.roster.reduce(
        (highest: Warrior | null, warrior: Warrior) => {
          if (!highest || (warrior.fame || 0) > (highest.fame || 0)) {
            return warrior;
          }
          return highest;
        },
        null
      );

      if (highestFameWarrior) {
        impact.rosterRemovals = [highestFameWarrior.id];
        const sellValue = (highestFameWarrior.fame || 0) * 10;

        const newsletterItem: NewsletterItem = {
          id: rng.uuid('newsletter'),
          week: state.week,
          title: 'Bankruptcy Crisis',
          items: [
            `Your stable has gone bankrupt with treasury at ${state.treasury}g.`,
            `${highestFameWarrior.name} has been sold for ${sellValue}g to cover debts.`,
            `Your reputation has suffered (-50 popularity).`,
          ],
        };

        impact.treasuryDelta = sellValue;
        impact.popularityDelta = -50;
        impact.newsletterItems = [newsletterItem];

        return { bankrupt: true, impact, soldWarrior: highestFameWarrior };
      }
    }

    // At roster floor: inject capped emergency loan toward threshold
    const needed = BANKRUPTCY_THRESHOLD - state.treasury;
    const loanAmount = Math.min(needed, EMERGENCY_LOAN);
    // Ensure treasury doesn't fall below DEBT_FLOOR
    const minLoan = Math.max(0, DEBT_FLOOR - state.treasury);
    const finalLoan = Math.max(loanAmount, minLoan);

    const newsletterItems: string[] = [
      `Your stable has gone bankrupt with treasury at ${state.treasury}g.`,
      `Your reputation has suffered (-50 popularity).`,
    ];

    if (finalLoan > 0) {
      impact.treasuryDelta = finalLoan;
      newsletterItems.push(
        `An emergency loan of ${finalLoan}g has been granted to keep your stable afloat.`
      );
    }

    const newsletterItem: NewsletterItem = {
      id: rng.uuid('newsletter'),
      week: state.week,
      title: 'Bankruptcy Crisis',
      items: newsletterItems,
    };

    impact.popularityDelta = -50;
    impact.newsletterItems = [newsletterItem];

    return { bankrupt: true, impact };
  },
} as const;
