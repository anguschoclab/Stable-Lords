import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';

import { makeInjury } from '@/engine/injuries/utils';
import { withChosenWarrior, type OffseasonEventRun, addStat, withAddedInjury, warriorOutcome, grantInsightToken } from '../helpers';

/** Handler for the Temporal Anomaly offseason event — time distortion affecting warrior age and stats. */
export function handleTemporalAnomaly(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 35;
    const currentTraits = chosen.traits || [];
    const newTraits = [...currentTraits];
    if (newTraits.length > 0) {
      const removedTraitIndex = Math.floor(rng.next() * newTraits.length);
      newTraits.splice(removedTraitIndex, 1);
    }

    grantInsightToken(run, chosen, { type: 'Style', detail: 'The temporal anomaly granted a sudden burst of stylistic intuition.', origin: 'Temporal Anomaly' });

    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained),
        traits: newTraits,
      });
  } });
}

/** Handler for the Cursed Treasure Discovery offseason event — gold with a curse side effect. */
export function handleCursedTreasureDiscovery(run: OffseasonEventRun) {
  const { nextWeek, rng, ctx } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
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

    return warriorOutcome({
        fame: Math.max(0, (chosen.fame || 0) - fameLost),
        injuries: withAddedInjury(chosen, newInjury),
      }, { gold: goldGained, fame: fameLost });
  } });
}

/** Handler for the Abyssal Tempest Ritual offseason event — storm ritual granting power at injury risk. */
export function handleAbyssalTempestRitual(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 25;

    const newInjury = makeInjury(rng, {
      name: 'Abyssal Gaze',
      description: 'Stared too deeply into the void.',
      severity: 'Minor',
      weeksBase: 1,
      weeksRange: 2,
      penalties: { SP: -1, CN: -1 },
    });

    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained),
        injuries: withAddedInjury(chosen, newInjury),
      });
  } });
}

/** Handler for the Unexplained Monolith offseason event — grants XP and fame at injury risk. */
export function handleUnexplainedMonolith(run: OffseasonEventRun) {
  const { rng, ctx } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
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

    return warriorOutcome({
        ...existingUpdate,
        xp: currentXp + xpGained,
        fame: currentFame + fameGained,
        injuries: [...currentInjuries, newInjury],
        traits: newTraits,
      });
  } });
}

/** Handler for the Shattered Skies Ritual offseason event — grants XP but adds fatigue. */
export function handleShatteredSkiesRitual(run: OffseasonEventRun) {
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 25;
    const fatigueGained = 15;
    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained),
        fatigue: addStat(chosen.fatigue, fatigueGained),
      });
  } });
}

/** Handler for the Weeping Skies offseason event — grants XP to a random warrior. */
export function handleWeepingSkies(run: OffseasonEventRun) {
  withChosenWarrior({ ...run, apply: (chosen) => ({
    updates: { xp: (chosen.xp || 0) + 20 },
    announce: {},
  }) });
}
