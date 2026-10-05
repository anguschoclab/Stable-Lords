import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';

import { interpolateData as t } from '@/engine/narrative/templateHelpers';
import { hasInjuries } from '@/engine/injuries/utils';
import { withChosenWarrior, type OffseasonEventRun, addStat, warriorOutcome, grantInsightToken } from '../helpers';
import { isActive } from '@/engine/warrior/warriorStatus';

/**
 *
 */
export function handleWanderingHealer(run: OffseasonEventRun) {
  const { state, nextWeek, e, rng, ctx } = run;
  const goldCost = 50 + Math.floor(rng.next() * 51);
  ctx.treasuryDelta -= goldCost;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Medical Tonics', -goldCost, 'upkeep'));

  const activeInjured = state.roster.filter((w) => isActive(w) && hasInjuries(w));

  const chosen = activeInjured.length > 0 ? rng.pick(activeInjured) : null;
  if (chosen) {
    const remainingInjuries = [...(chosen.injuries || [])];
    if (remainingInjuries.length > 0) {
      const injuryIndex = Math.floor(rng.next() * remainingInjuries.length);
      remainingInjuries.splice(injuryIndex, 1);
    }
    ctx.rosterUpdates.set(chosen.id, {
      injuries: remainingInjuries,
    });

    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(e.newsletter[1] || '', { name: chosen.name, gold: goldCost })],
    });
  } else {
    ctx.newsletterItems.push({
      id: rng.uuid('newsletter'),
      week: nextWeek,
      title: e.title,
      items: [t(e.newsletter[0] || '', { gold: goldCost })],
    });
  }
}

/**
 *
 */

/**
 *
 */
export function handleWanderingFortuneTeller(run: OffseasonEventRun) {
  const { nextWeek, rng, ctx } = run;
  const cost = 30;
  ctx.treasuryDelta -= cost;
  ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Fortune Teller Reading', -cost, 'other'));

  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 15;

    grantInsightToken(run, chosen, { type: 'Style', detail: 'Discovered a hidden rhythm in their fighting style.', origin: 'Wandering Fortune Teller' });

    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained)
      }, { gold: cost });
  } });
}

/**
 *
 */

/**
 *
 */
export function handleDreamweaverVisit(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 15 + Math.floor(rng.next() * 11);

    grantInsightToken(run, chosen, { type: 'Style', detail: 'Dreamweaver vision revealed hidden stylistic knowledge.', origin: 'Dreamweaver' });

    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained)
      }, { xp: xpGained });
  } });
}

/** Handles the Goblin Merchant offseason event outcome. */

/** Handles the Goblin Merchant offseason event outcome. */
export function handleGoblinMerchant(run: OffseasonEventRun) {
  const { nextWeek, rng, ctx } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const cost = 50 + Math.floor(rng.next() * 50);

    const attrs = chosen.attributes;

    ctx.treasuryDelta -= cost;
    ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Strange Herbs', -cost, 'other'));

    return warriorOutcome({
        attributes: {
        ...attrs,
        CN: attrs.CN + 1,
        WL: attrs.WL + 1,
        },
      }, { gold: cost });
  } });
}
