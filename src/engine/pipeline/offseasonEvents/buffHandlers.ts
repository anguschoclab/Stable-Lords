/**
 * Buff offseason events — grant XP, fame, traits, or insights to warriors.
 */
import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { makeInsightToken } from '@/engine/core/eventHelpers';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import {
  type OffseasonEventNarrative,
  type OffseasonEventContext,
  withChosenWarrior,
} from './types';

/**
 *
 */
export function handleFameBoost(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior({ state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply: (chosen) => ({
    updates: { fame: (chosen.fame || 0) + 25 },
    announce: { fame: 25 },
  }) });
}

/**
 *
 */
export function handleEpiphany(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior({ state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply: (chosen) => {
    ctx.insightTokens.push(
      makeInsightToken(rng, {
        type: 'Attribute',
        targetKey: 'ST',
        warriorId: chosen.id,
        warriorName: chosen.name,
        detail: 'Discovered a hidden reserve of strength during offseason meditation.',
        origin: 'Epiphany',
        discoveredWeek: nextWeek,
      })
    );
    return {
      updates: {
        fame: (chosen.fame || 0) + 10,
        xp: (chosen.xp || 0) + 15,
      },
      announce: {},
    };
  } });
}

/**
 *
 */
export function handleBardsSong(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior({ state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply: (chosen) => {
    const fameGained = 15 + Math.floor(rng.next() * 20);
    return {
      updates: { fame: (chosen.fame || 0) + fameGained },
      announce: { fame: fameGained },
    };
  } });
}

/**
 *
 */
export function handleMysticVision(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior({ state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply: (chosen) => ({
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
export function handleStrangeDream(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior({ state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply: (chosen) => {
    const xpGained = 5 + Math.floor(rng.next() * 11);
    return {
      updates: { xp: (chosen.xp || 0) + xpGained },
      announce: { xp: xpGained },
    };
  } });
}

/**
 *
 */
export function handleMeteorShower(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior({ state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply: (chosen) => {
    const xpGained = 15 + Math.floor(rng.next() * 11);
    const fameGained = 10 + Math.floor(rng.next() * 6);
    return {
      updates: {
        xp: (chosen.xp || 0) + xpGained,
        fame: (chosen.fame || 0) + fameGained,
      },
      announce: { xp: xpGained, fame: fameGained },
    };
  } });
}

/**
 *
 */
export function handleGladiatorOlympics(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior({ state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply: (chosen) => {
    const xpGained = 15 + Math.floor(rng.next() * 11);
    const fameGained = 10 + Math.floor(rng.next() * 11);
    return {
      updates: {
        xp: (chosen.xp || 0) + xpGained,
        fame: (chosen.fame || 0) + fameGained,
      },
      announce: { xp: xpGained, fame: fameGained },
    };
  } });
}

/**
 *
 */
export function handleLoyalStrayDog(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior({ state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply: (chosen) => {
    const xpGained = 10;
    return {
      updates: { xp: (chosen.xp || 0) + xpGained },
      announce: {},
    };
  } });
}

/**
 *
 */
export function handleWanderingMystic(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior({ state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply: (chosen) => {
    const currentTraits = chosen.traits || [];
    const newTraits = currentTraits.includes('chaos_touched')
      ? currentTraits
      : [...currentTraits, 'chaos_touched'];
    return {
      updates: { traits: newTraits },
      announce: {},
    };
  } });
}

/**
 *
 */
export function handleChaosSpores(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior({ state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply: (chosen) => {
    const xpGained = 20 + Math.floor(rng.next() * 11);

    const currentTraits = chosen.traits || [];
    const newTraits = currentTraits.includes('spore_kissed')
      ? currentTraits
      : [...currentTraits, 'spore_kissed'];

    return {
      updates: {
        xp: (chosen.xp || 0) + xpGained,
        traits: newTraits,
      },
      announce: { xp: xpGained },
    };
  } });
}

/**
 *
 */
export function handleChaosWeaversGift(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior({ state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply: (chosen) => {
    const xpGained = 30;
    ctx.insightTokens.push(
      makeInsightToken(rng, {
        type: 'Tactic',
        warriorId: chosen.id,
        warriorName: chosen.name,
        detail: 'A chaotic revelation sparked a new combat tactic.',
        origin: 'Chaos Weaver',
        discoveredWeek: nextWeek,
      })
    );
    return {
      updates: { xp: (chosen.xp || 0) + xpGained },
      announce: { xp: xpGained },
    };
  } });
}

/**
 *
 */
export function handleShadowTraining(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior({ state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply: (chosen) => {
    const xpGained = 20 + Math.floor(rng.next() * 11);
    const fameLost = 5 + Math.floor(rng.next() * 6);
    return {
      updates: {
        xp: (chosen.xp || 0) + xpGained,
        fame: Math.max(0, (chosen.fame || 0) - fameLost),
      },
      announce: { xp: xpGained, fame: fameLost },
    };
  } });
}

/**
 * Handle Offseason Training Camp
 */
export function handleOffseasonTrainingCamp(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior({ state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply: (chosen) => {
    const xpGained = 40 + Math.floor(rng.next() * 21);
    return {
      updates: { xp: (chosen.xp || 0) + xpGained },
      announce: { xp: xpGained },
    };
  } });
}

/** Handles the Wandering Merchant "Strange Brew" offseason event outcome. */
export function handleWanderingMerchantStrangeBrew(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior({ state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply: (chosen) => ({
    updates: {
      xp: (chosen.xp || 0) + 20,
      fame: (chosen.fame || 0) + 10,
    },
    announce: { xp: 20, fame: 10 },
  }) });
}

/** Handles the Wandering Blacksmith offseason event outcome. */
export function handleWanderingBlacksmith(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  // If the stable is too poor, the blacksmith passes by.
  if ((state.treasury || 0) + ctx.treasuryDelta < 50) return;

  withChosenWarrior({ state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply: (chosen) => {
    const xpGained = 20 + Math.floor(rng.next() * 11);
    ctx.treasuryDelta -= 50;
    ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Wandering Blacksmith', -50, 'other'));
    return {
      updates: { xp: (chosen.xp || 0) + xpGained },
      announce: { xp: xpGained },
    };
  } });
}
