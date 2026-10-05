

import { makeInjury } from '@/engine/injuries/utils';
import { withChosenWarriorNews, type OffseasonEventRun, withAddedInjury, grantInsightToken } from '../helpers';

/** Handler for the Abyssal Bargain offseason event — trades gold for warrior power at a cost. */
export function handleAbyssalBargain(run: OffseasonEventRun) {
  const { rng, ctx } = run;
  withChosenWarriorNews({ ...run, apply: (chosen) => {
    const roll = rng.next();

    if (roll < 0.6) {
      // They accept the bargain
      const xpGained = 40 + Math.floor(rng.next() * 21);
      const fameLost = 15 + Math.floor(rng.next() * 11);
      const newInjury = makeInjury(rng, {
        name: 'Soul Rot',
        description: 'A lingering supernatural curse.',
        severity: 'Moderate',
        weeksBase: 3,
        weeksRange: 2,
        penalties: { CN: -2, WL: -2 },
      });

      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
        fame: Math.max(0, (chosen.fame || 0) - fameLost),
        injuries: [...(chosen.injuries || []), newInjury],
      });
      return `They accepted the bargain. Power surges within them, but their soul feels tarnished. (+${xpGained} XP, -${fameLost} Fame, Moderate Injury)`;
    }

    // They refuse
    const fameGained = 15 + Math.floor(rng.next() * 11);
    ctx.rosterUpdates.set(chosen.id, {
      fame: (chosen.fame || 0) + fameGained,
    });
    return `They bravely refused the shadowed figure! The town applauds their moral fortitude. (+${fameGained} Fame)`;
  } });
}

/** Handler for the Fey Trickster offseason event — random boon or bane from a fey visitor. */
export function handleFeyTrickster(run: OffseasonEventRun) {
  const { rng, ctx } = run;
  withChosenWarriorNews({ ...run, apply: (chosen) => {
    const roll = rng.next();

    if (roll < 0.6) {
      // Solved riddle
      const xpGained = 20 + Math.floor(rng.next() * 16);
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
      });
      grantInsightToken(run, chosen, { type: 'Style', detail: 'A fey trickster taught them an impossible maneuver.', origin: 'Fey Trickster' });
      return `They solved the riddle! They gain strange insights. (+${xpGained} XP, Insight Gained)`;
    }

    // Tricked
    const newInjury = makeInjury(rng, {
      name: 'Fey Prank',
      description: 'A deeply embarrassing magical prank.',
      severity: 'Minor',
      weeksBase: 1,
      weeksRange: 1,
      penalties: { WL: -1, SP: -1 },
    });
    ctx.rosterUpdates.set(chosen.id, { injuries: withAddedInjury(chosen, newInjury) });
    return `They were made a fool of, suffering minor hexes. (Minor Injury)`;
  } });
}

/** Handler for the Rogue Alchemist offseason event — offers experimental potions with side effects. */
export function handleRogueAlchemist(run: OffseasonEventRun) {
  const { rng, ctx } = run;
  withChosenWarriorNews({ ...run, apply: (chosen) => {
    const roll = rng.next();

    if (roll < 0.5) {
      // Success
      const xpGained = 20 + Math.floor(rng.next() * 11);
      const fameGained = 5 + Math.floor(rng.next() * 6);
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
        fame: (chosen.fame || 0) + fameGained,
      });
      return `It was a mutagenic success! They feel incredibly powerful. (+${xpGained} XP, +${fameGained} Fame)`;
    }

    // Failure
    const newInjury = makeInjury(rng, {
      name: 'Alchemical Sickness',
      description: 'Nausea, cold sweats, and strange bodily humming.',
      severity: 'Minor',
      weeksBase: 1,
      weeksRange: 2,
      penalties: { SP: -1, CN: -1 },
    });
    ctx.rosterUpdates.set(chosen.id, { injuries: withAddedInjury(chosen, newInjury) });
    return `It tasted like battery acid. They are violently ill. (Minor Injury)`;
  } });
}
