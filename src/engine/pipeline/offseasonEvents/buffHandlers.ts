/**
 * Buff offseason events — grant XP, fame, traits, or insights to warriors.
 */

import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { withChosenWarrior, type OffseasonEventRun, addStat, warriorOutcome, grantInsightToken } from './helpers';

/**
 *
 */
export function handleFameBoost(run: OffseasonEventRun) {
  withChosenWarrior({ ...run, apply: (chosen) => ({
    updates: { fame: (chosen.fame || 0) + 25 },
    announce: { fame: 25 },
  }) });
}

/**
 *
 */
export function handleEpiphany(run: OffseasonEventRun) {
  withChosenWarrior({ ...run, apply: (chosen) => {
    grantInsightToken(run, chosen, { type: 'Attribute', targetKey: 'ST', detail: 'Discovered a hidden reserve of strength during offseason meditation.', origin: 'Epiphany' });
    return warriorOutcome({
        fame: addStat(chosen.fame, 10),
        xp: addStat(chosen.xp, 15),
      });
  } });
}

/**
 *
 */
export function handleBardsSong(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const fameGained = 15 + Math.floor(rng.next() * 20);
    return warriorOutcome({
        fame: addStat(chosen.fame, fameGained)
      }, { fame: fameGained });
  } });
}

/**
 *
 */
export function handleMysticVision(run: OffseasonEventRun) {
  withChosenWarrior({ ...run, apply: (chosen) => ({
    updates: {
      xp: (chosen.xp || 0) + 15,
      fame: (chosen.fame || 0) + 10,
    },
    announce: { xp: 15, fame: 10 },
  }) });
}

/**
 *
 */
export function handleStrangeDream(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 5 + Math.floor(rng.next() * 11);
    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained)
      }, { xp: xpGained });
  } });
}

/**
 *
 */
export function handleMeteorShower(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 15 + Math.floor(rng.next() * 11);
    const fameGained = 10 + Math.floor(rng.next() * 6);
    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained),
        fame: addStat(chosen.fame, fameGained),
      }, { xp: xpGained, fame: fameGained });
  } });
}

/**
 *
 */
export function handleGladiatorOlympics(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 15 + Math.floor(rng.next() * 11);
    const fameGained = 10 + Math.floor(rng.next() * 11);
    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained),
        fame: addStat(chosen.fame, fameGained),
      }, { xp: xpGained, fame: fameGained });
  } });
}

/**
 *
 */
export function handleLoyalStrayDog(run: OffseasonEventRun) {
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 10;
    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained)
      });
  } });
}

/**
 *
 */
export function handleWanderingMystic(run: OffseasonEventRun) {
  withChosenWarrior({ ...run, apply: (chosen) => {
    const currentTraits = chosen.traits || [];
    const newTraits = currentTraits.includes('chaos_touched')
      ? currentTraits
      : [...currentTraits, 'chaos_touched'];
    return warriorOutcome({
        traits: newTraits
      });
  } });
}

/**
 *
 */
export function handleChaosSpores(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 20 + Math.floor(rng.next() * 11);

    const currentTraits = chosen.traits || [];
    const newTraits = currentTraits.includes('spore_kissed')
      ? currentTraits
      : [...currentTraits, 'spore_kissed'];

    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained),
        traits: newTraits,
      }, { xp: xpGained });
  } });
}

/**
 *
 */
export function handleChaosWeaversGift(run: OffseasonEventRun) {
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 30;
    grantInsightToken(run, chosen, { type: 'Tactic', detail: 'A chaotic revelation sparked a new combat tactic.', origin: 'Chaos Weaver' });
    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained)
      }, { xp: xpGained });
  } });
}

/**
 *
 */
export function handleShadowTraining(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 20 + Math.floor(rng.next() * 11);
    const fameLost = 5 + Math.floor(rng.next() * 6);
    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained),
        fame: Math.max(0, (chosen.fame || 0) - fameLost),
      }, { xp: xpGained, fame: fameLost });
  } });
}

/**
 * Handle Offseason Training Camp
 */
export function handleOffseasonTrainingCamp(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 40 + Math.floor(rng.next() * 21);
    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained)
      }, { xp: xpGained });
  } });
}

/** Handles the Wandering Merchant "Strange Brew" offseason event outcome. */
export function handleWanderingMerchantStrangeBrew(run: OffseasonEventRun) {
  withChosenWarrior({ ...run, apply: (chosen) => ({
    updates: {
      xp: (chosen.xp || 0) + 20,
      fame: (chosen.fame || 0) + 10,
    },
    announce: { xp: 20, fame: 10 },
  }) });
}

/** Handles the Wandering Blacksmith offseason event outcome. */
export function handleWanderingBlacksmith(run: OffseasonEventRun) {
  const { state, nextWeek, rng, ctx } = run;
  // If the stable is too poor, the blacksmith passes by.
  if ((state.treasury || 0) + ctx.treasuryDelta < 50) return;

  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 20 + Math.floor(rng.next() * 11);
    ctx.treasuryDelta -= 50;
    ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Wandering Blacksmith', -50, 'other'));
    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained)
      }, { xp: xpGained });
  } });
}
