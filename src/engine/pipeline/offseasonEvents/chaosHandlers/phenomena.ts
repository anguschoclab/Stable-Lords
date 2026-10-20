import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';

import { makeInjury, makeMinorInjury } from '@/engine/injuries/utils';
import {
  withChosenWarrior,
  type OffseasonEventRun,
  warriorOutcome,
  statGrantOutcome,
  grantInsightToken,
} from '../helpers';

/** Handler for the Temporal Anomaly offseason event — time distortion affecting warrior age and stats. */
export function handleTemporalAnomaly(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const xpGained = 35;
      const currentTraits = chosen.traits || [];
      const newTraits = [...currentTraits];
      if (newTraits.length > 0) {
        const removedTraitIndex = Math.floor(rng.next() * newTraits.length);
        newTraits.splice(removedTraitIndex, 1);
      }

      grantInsightToken(run, chosen, {
        type: 'Style',
        detail: 'The temporal anomaly granted a sudden burst of stylistic intuition.',
        origin: 'Temporal Anomaly',
      });

      return statGrantOutcome(chosen, { xp: xpGained }, { updates: { traits: newTraits } });
    },
  });
}

/** Handler for the Cursed Treasure Discovery offseason event — gold with a curse side effect. */
export function handleCursedTreasureDiscovery(run: OffseasonEventRun) {
  const { nextWeek, rng, ctx } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
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

      return statGrantOutcome(
        chosen,
        { fame: -fameLost },
        {
          clampToZero: true,
          injury: newInjury,
          announce: { gold: goldGained, fame: fameLost },
        }
      );
    },
  });
}

/** Handler for the Abyssal Tempest Ritual offseason event — storm ritual granting power at injury risk. */
export function handleAbyssalTempestRitual(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const newInjury = makeMinorInjury(rng, {
        name: 'Abyssal Gaze',
        description: 'Stared too deeply into the void.',
        weeksRange: 2,
        penalties: { SP: -1, CN: -1 },
      });

      return statGrantOutcome(chosen, { xp: 25 }, { injury: newInjury });
    },
  });
}

/** Handler for the Unexplained Monolith offseason event — grants XP and fame at injury risk. */
export function handleUnexplainedMonolith(run: OffseasonEventRun) {
  const { rng, ctx } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const xpGained = 15;
      const fameGained = 10;

      const newInjury = makeMinorInjury(rng, {
        name: 'Monolith Fatigue',
        description: 'Exhausted from touching the unknown.',
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

      return warriorOutcome({
        ...existingUpdate,
        xp: currentXp + xpGained,
        fame: currentFame + fameGained,
        injuries: [...currentInjuries, newInjury],
        traits: newTraits,
      });
    },
  });
}

/** Handler for the Shattered Skies Ritual offseason event — grants XP but adds fatigue. */
export function handleShatteredSkiesRitual(run: OffseasonEventRun) {
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const xpGained = 25;
      const fatigueGained = 15;
      return statGrantOutcome(chosen, { xp: xpGained, fatigue: fatigueGained });
    },
  });
}

/** Handler for the Weeping Skies offseason event — grants XP to a random warrior. */
export function handleWeepingSkies(run: OffseasonEventRun) {
  withChosenWarrior({
    ...run,
    apply: (chosen) => statGrantOutcome(chosen, { xp: 20 }),
  });
}
