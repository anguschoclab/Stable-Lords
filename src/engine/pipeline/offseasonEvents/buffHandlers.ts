/**
 * Buff offseason events — grant XP, fame, traits, or insights to warriors.
 */

import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import {
  withChosenWarrior,
  type OffseasonEventRun,
  warriorOutcome,
  statGrantOutcome,
  grantInsightToken,
} from './helpers';

/**
 *
 */
export function handleFameBoost(run: OffseasonEventRun) {
  withChosenWarrior({
    ...run,
    apply: (chosen) => statGrantOutcome(chosen, { fame: 25 }, { mirror: true }),
  });
}

/**
 *
 */
export function handleEpiphany(run: OffseasonEventRun) {
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      grantInsightToken(run, chosen, {
        type: 'Attribute',
        targetKey: 'ST',
        detail: 'Discovered a hidden reserve of strength during offseason meditation.',
        origin: 'Epiphany',
      });
      return statGrantOutcome(chosen, { fame: 10, xp: 15 });
    },
  });
}

/**
 *
 */
export function handleBardsSong(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const fameGained = 15 + Math.floor(rng.next() * 20);
      return statGrantOutcome(chosen, { fame: fameGained }, { mirror: true });
    },
  });
}

/**
 *
 */
export function handleMysticVision(run: OffseasonEventRun) {
  withChosenWarrior({
    ...run,
    apply: (chosen) => statGrantOutcome(chosen, { xp: 15, fame: 10 }, { mirror: true }),
  });
}

/**
 *
 */
export function handleStrangeDream(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const xpGained = 5 + Math.floor(rng.next() * 11);
      return statGrantOutcome(chosen, { xp: xpGained }, { mirror: true });
    },
  });
}

/**
 *
 */
export function handleMeteorShower(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const xpGained = 15 + Math.floor(rng.next() * 11);
      const fameGained = 10 + Math.floor(rng.next() * 6);
      return statGrantOutcome(chosen, { xp: xpGained, fame: fameGained }, { mirror: true });
    },
  });
}

/**
 *
 */
export function handleGladiatorOlympics(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const xpGained = 15 + Math.floor(rng.next() * 11);
      const fameGained = 10 + Math.floor(rng.next() * 11);
      return statGrantOutcome(chosen, { xp: xpGained, fame: fameGained }, { mirror: true });
    },
  });
}

/**
 *
 */
export function handleLoyalStrayDog(run: OffseasonEventRun) {
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const xpGained = 10;
      return statGrantOutcome(chosen, { xp: xpGained });
    },
  });
}

/**
 *
 */
export function handleWanderingMystic(run: OffseasonEventRun) {
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const currentTraits = chosen.traits || [];
      const newTraits = currentTraits.includes('chaos_touched')
        ? currentTraits
        : [...currentTraits, 'chaos_touched'];
      return warriorOutcome({
        traits: newTraits,
      });
    },
  });
}

/**
 *
 */
export function handleChaosSpores(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const xpGained = 20 + Math.floor(rng.next() * 11);

      const currentTraits = chosen.traits || [];
      const newTraits = currentTraits.includes('spore_kissed')
        ? currentTraits
        : [...currentTraits, 'spore_kissed'];

      return statGrantOutcome(
        chosen,
        { xp: xpGained },
        { updates: { traits: newTraits }, mirror: true }
      );
    },
  });
}

/**
 *
 */
export function handleChaosWeaversGift(run: OffseasonEventRun) {
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const xpGained = 30;
      grantInsightToken(run, chosen, {
        type: 'Tactic',
        detail: 'A chaotic revelation sparked a new combat tactic.',
        origin: 'Chaos Weaver',
      });
      return statGrantOutcome(chosen, { xp: xpGained }, { mirror: true });
    },
  });
}

/**
 *
 */
export function handleShadowTraining(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const xpGained = 20 + Math.floor(rng.next() * 11);
      const fameLost = 5 + Math.floor(rng.next() * 6);
      return statGrantOutcome(
        chosen,
        { xp: xpGained, fame: -fameLost },
        { clampToZero: true, mirror: true, announce: { fame: fameLost } }
      );
    },
  });
}

/**
 * Handle Offseason Training Camp
 */
export function handleOffseasonTrainingCamp(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const xpGained = 40 + Math.floor(rng.next() * 21);
      return statGrantOutcome(chosen, { xp: xpGained }, { mirror: true });
    },
  });
}

/** Handles the Wandering Merchant "Strange Brew" offseason event outcome. */
export function handleWanderingMerchantStrangeBrew(run: OffseasonEventRun) {
  withChosenWarrior({
    ...run,
    apply: (chosen) => statGrantOutcome(chosen, { xp: 20, fame: 10 }, { mirror: true }),
  });
}

/** Handles the Wandering Blacksmith offseason event outcome. */
export function handleWanderingBlacksmith(run: OffseasonEventRun) {
  const { state, nextWeek, rng, ctx } = run;
  // If the stable is too poor, the blacksmith passes by.
  if ((state.treasury || 0) + ctx.treasuryDelta < 50) return;

  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const xpGained = 20 + Math.floor(rng.next() * 11);
      ctx.treasuryDelta -= 50;
      ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Wandering Blacksmith', -50, 'other'));
      return statGrantOutcome(chosen, { xp: xpGained }, { mirror: true });
    },
  });
}
