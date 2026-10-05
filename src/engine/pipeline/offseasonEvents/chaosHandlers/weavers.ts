

import { makeInjury } from '@/engine/injuries/utils';
import { interpolateData as t } from '@/engine/narrative/templateHelpers';
import { TRAITS, type TraitDef } from '@/engine/traits';
import { pickActiveWarrior, withChosenWarrior, type OffseasonEventRun, withAddedInjury, warriorOutcome, grantInsightToken } from '../helpers';

/** Handler for the Shadow Tournament offseason event — unsanctioned fights with injury risk. */
export function handleShadowTournament(run: OffseasonEventRun) {
  const { state, nextWeek, e, rng, ctx } = run;
  const chosen = pickActiveWarrior(state, rng);
  if (chosen) {
    const roll = rng.next();
    let effectMsg: string;

    if (roll < 0.5) {
      // Success
      const xpGained = 30 + Math.floor(rng.next() * 21);
      const fameGained = 20 + Math.floor(rng.next() * 11);
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
        fame: (chosen.fame || 0) + fameGained,
      });
      effectMsg = `${t(e.newsletter[0] || '', { name: chosen.name, xp: xpGained, fame: fameGained })}`;
    } else {
      // Failure
      const fameLost = 10 + Math.floor(rng.next() * 11);
      const newInjury = makeInjury(rng, {
        name: 'Shadow Bruises',
        description: 'A lingering supernatural bruise from the shadow tournament.',
        severity: 'Moderate',
        weeksBase: 3,
        weeksRange: 2,
        penalties: { CN: -1, WL: -1 },
      });
      ctx.rosterUpdates.set(chosen.id, {
        fame: Math.max(0, (chosen.fame || 0) - fameLost),
        injuries: [...(chosen.injuries || []), newInjury],
      });
      effectMsg = `${t(e.newsletter[1] || '', { name: chosen.name, fame: fameLost })}`;
    }

    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [effectMsg],
    });
  }
}

/** Handler for the Chaos Weaver's Game offseason event — gambles warrior traits for rewards. */
export function handleChaosWeaversGame(run: OffseasonEventRun) {
  const { state, nextWeek, e, rng, ctx } = run;
  const chosen = pickActiveWarrior(state, rng);
  if (chosen) {
    if (rng.next() > 0.5) {
      // Win
      const xpGained = 25;
      ctx.rosterUpdates.set(chosen.id, {
        xp: (chosen.xp || 0) + xpGained,
      });

      // Manually push the exact narrative line to avoid rng picking the "Lose" line
      // We know e.newsletter[0] is the "Win" line
      const template = e.newsletter[0] || '';
      ctx.newsletterItems.push({
        id: rng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [t(template, { name: chosen.name, xp: xpGained })],
      });
    } else {
      // Lose
      const newInjury = makeInjury(rng, {
        name: 'Mystic Bruises',
        description: 'A lingering supernatural bruise.',
        severity: 'Minor',
        weeksBase: 2,
        weeksRange: 1,
        penalties: { CN: -1 },
      });
      ctx.rosterUpdates.set(chosen.id, { injuries: withAddedInjury(chosen, newInjury) });

      // Manually push the exact narrative line to avoid rng picking the "Win" line
      // We know e.newsletter[1] is the "Lose" line
      const template = e.newsletter[1] || '';
      ctx.newsletterItems.push({
        id: rng.uuid('newsletter'),
        week: nextWeek,
        title: e.title,
        items: [t(template, { name: chosen.name })],
      });
    }
  }
}

/** Handler for the Chaos Weaver Visit offseason event — bestows or removes traits. */
export function handleChaosWeaverVisit(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const positiveTraits = Object.values(TRAITS).filter(
      (td): td is TraitDef => td !== undefined && td.sign === 'positive'
    );
    const grantedTrait = rng.pick(positiveTraits);
    if (!grantedTrait) return;

    grantInsightToken(run, chosen, { type: 'Style', detail: `Touched by the Chaos Weaver — gained ${grantedTrait.name}.`, origin: 'Chaos Weaver' });

    return warriorOutcome({
        traits: [...(chosen.traits || []), grantedTrait.id]
      }, { trait: grantedTrait.name });
  } });
}

/** Handler for the Chaos Weaver's Prophecy offseason event — foretells a warrior's destiny. */
export function handleChaosWeaversProphecy(run: OffseasonEventRun) {
  const { state, nextWeek, e, rng, ctx } = run;
  const chosen = pickActiveWarrior(state, rng);
  if (chosen) {
    const xpGained = 50;
    ctx.rosterUpdates.set(chosen.id, {
      xp: (chosen.xp || 0) + xpGained,
    });

    const newInjury = makeInjury(rng, {
      name: 'Prophetic Madness',
      description: 'The Chaos Weaver shared a prophecy. The mind reels.',
      severity: 'Minor',
      weeksBase: 2,
      weeksRange: 1,
      penalties: { CN: -1 },
    });

    const currentUpdates = ctx.rosterUpdates.get(chosen.id) || {};
    ctx.rosterUpdates.set(chosen.id, {
      ...currentUpdates,
      injuries: [...(chosen.injuries || []), newInjury],
    });

    const template = e.newsletter[0] || '';
    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(template, { name: chosen.name, xp: xpGained })],
    });
  }
}
