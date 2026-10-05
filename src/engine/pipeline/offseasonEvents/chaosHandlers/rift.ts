import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';

import { makeInjury } from '@/engine/injuries/utils';
import { withChosenWarrior, withChosenWarriorNews, type OffseasonEventRun, addStat, withAddedInjury, warriorOutcome, grantInsightToken } from '../helpers';

/** Handler for the Chaos Rift offseason event — grants XP, fame, and gold from a chaos crystal. */
export function handleChaosRift(run: OffseasonEventRun) {
  const { nextWeek, rng, ctx } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 25;
    const fameGained = 15;
    const goldGained = 150;

    ctx.treasuryDelta += goldGained;
    ctx.ledgerEntries.push(
      makeLedgerEntry(rng, nextWeek, 'Sold Chaos Crystal', goldGained, 'other')
    );

    grantInsightToken(run, chosen, { type: 'Style', detail: 'Touched the raw essence of the Chaos Rift.', origin: 'Chaos Rift' });

    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained),
        fame: addStat(chosen.fame, fameGained),
      }, { xp: xpGained, fame: fameGained });
  } });
}

/** Handler for the Chaotic Spells offseason event — random magical effects on active warriors. */
export function handleChaoticSpells(run: OffseasonEventRun) {
  const { rng, ctx } = run;
  withChosenWarriorNews({ ...run, apply: (chosen) => {
    const roll = rng.next();

    if (roll < 0.33) {
      const xpGained = 10 + Math.floor(rng.next() * 11);
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
      });
      return `They feel a surge of unnatural energy! (+${xpGained} XP)`;
    }

    if (roll < 0.66) {
      const newInjury = makeInjury(rng, {
        name: 'Arcane Burns',
        description: 'Singed by erratic magic.',
        severity: 'Minor',
        weeksBase: 1,
        weeksRange: 2,
        penalties: { SP: -1, CN: -1 },
      });
      ctx.rosterUpdates.set(chosen.id, { injuries: withAddedInjury(chosen, newInjury) });
      return 'They sustained mild arcane burns. (Minor Injury)';
    }

    const fameLost = 5 + Math.floor(rng.next() * 6);
    ctx.rosterUpdates.set(chosen.id, {
      fame: Math.max(0, (chosen.fame || 0) - fameLost),
    });
    return `They were temporarily turned an embarrassing shade of purple. (-${fameLost} Fame)`;
  } });
}
