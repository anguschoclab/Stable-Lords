import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { makeInjury } from '@/engine/injuries/utils';
import { makeInsightToken } from '@/engine/core/eventHelpers';
import {
  type OffseasonEventNarrative,
  type OffseasonEventContext,
  withChosenWarrior,
} from '../types';

/** Handler for the Temporal Anomaly offseason event — time distortion affecting warrior age and stats. */
export function handleTemporalAnomaly(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior(state, nextWeek, e, rng, ctx, (chosen) => {
    const xpGained = 35;
    const currentTraits = chosen.traits || [];
    const newTraits = [...currentTraits];
    if (newTraits.length > 0) {
      const removedTraitIndex = Math.floor(rng.next() * newTraits.length);
      newTraits.splice(removedTraitIndex, 1);
    }

    ctx.insightTokens.push(
      makeInsightToken(rng, {
        type: 'Style',
        warriorId: chosen.id,
        warriorName: chosen.name,
        detail: 'The temporal anomaly granted a sudden burst of stylistic intuition.',
        origin: 'Temporal Anomaly',
        discoveredWeek: nextWeek,
      })
    );

    return {
      updates: {
        xp: (chosen.xp || 0) + xpGained,
        traits: newTraits,
      },
      announce: {},
    };
  });
}

/** Handler for the Cursed Treasure Discovery offseason event — gold with a curse side effect. */
export function handleCursedTreasureDiscovery(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior(state, nextWeek, e, rng, ctx, (chosen) => {
    const goldGained = 300 + Math.floor(rng.next() * 201);
    const fameLost = 10 + Math.floor(rng.next() * 11);

    ctx.treasuryDelta += goldGained;
    ctx.ledgerEntries.push(
      makeLedgerEntry(rng, nextWeek, 'Cursed Treasure Gained', goldGained, 'other')
    );

    const newInjury = makeInjury(rng, {
      name: 'Curse of Greed',
      description: 'A lingering mystical sickness from cursed gold.',
      severity: 'Moderate',
      weeksBase: 3,
      weeksRange: 2,
      penalties: { WL: -2, CN: -1 },
    });

    return {
      updates: {
        fame: Math.max(0, (chosen.fame || 0) - fameLost),
        injuries: [...(chosen.injuries || []), newInjury],
      },
      announce: { gold: goldGained, fame: fameLost },
    };
  });
}

/** Handler for the Abyssal Tempest Ritual offseason event — storm ritual granting power at injury risk. */
export function handleAbyssalTempestRitual(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior(state, nextWeek, e, rng, ctx, (chosen) => {
    const xpGained = 25;

    const newInjury = makeInjury(rng, {
      name: 'Abyssal Gaze',
      description: 'Stared too deeply into the void.',
      severity: 'Minor',
      weeksBase: 1,
      weeksRange: 2,
      penalties: { SP: -1, CN: -1 },
    });

    return {
      updates: {
        xp: (chosen.xp || 0) + xpGained,
        injuries: [...(chosen.injuries || []), newInjury],
      },
      announce: {},
    };
  });
}

/** Handler for the Unexplained Monolith offseason event — grants XP and fame at injury risk. */
export function handleUnexplainedMonolith(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior(state, nextWeek, e, rng, ctx, (chosen) => {
    const xpGained = 15;
    const fameGained = 10;

    const newInjury = makeInjury(rng, {
      name: 'Monolith Fatigue',
      description: 'Exhausted from touching the unknown.',
      severity: 'Minor',
      weeksBase: 1,
      weeksRange: 1,
      penalties: { SP: -1 },
    });

    const existingUpdate = ctx.rosterUpdates.get(chosen.id) || {};

    const currentXp = existingUpdate.xp ?? chosen.xp ?? 0;
    const currentFame = existingUpdate.fame ?? chosen.fame ?? 0;
    const currentInjuries = existingUpdate.injuries ?? chosen.injuries ?? [];
    const currentTraits = existingUpdate.traits ?? chosen.traits ?? [];

    const newTraits = currentTraits.includes('precise')
      ? currentTraits
      : [...currentTraits, 'precise'];

    return {
      updates: {
        ...existingUpdate,
        xp: currentXp + xpGained,
        fame: currentFame + fameGained,
        injuries: [...currentInjuries, newInjury],
        traits: newTraits,
      },
      announce: {},
    };
  });
}

/** Handler for the Shattered Skies Ritual offseason event — grants XP but adds fatigue. */
export function handleShatteredSkiesRitual(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior(state, nextWeek, e, rng, ctx, (chosen) => {
    const xpGained = 25;
    const fatigueGained = 15;
    return {
      updates: {
        xp: (chosen.xp || 0) + xpGained,
        fatigue: (chosen.fatigue || 0) + fatigueGained,
      },
      announce: {},
    };
  });
}

/** Handler for the Weeping Skies offseason event — grants XP to a random warrior. */
export function handleWeepingSkies(
  state: GameState,
  nextWeek: number,
  e: OffseasonEventNarrative,
  rng: IRNGService,
  ctx: OffseasonEventContext
) {
  withChosenWarrior(state, nextWeek, e, rng, ctx, (chosen) => ({
    updates: { xp: (chosen.xp || 0) + 20 },
    announce: {},
  }));
}
