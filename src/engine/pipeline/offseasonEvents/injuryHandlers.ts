/**
 * Injury offseason events — cause injuries to warriors, sometimes with fame/gold side effects.
 */

import { makeInjury } from '@/engine/injuries/utils';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { withChosenWarrior, type OffseasonEventRun, addStat, withAddedInjury, warriorOutcome } from './helpers';

/**
 *
 */
export function handleTavernBrawl(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior(
    { ...run, apply: (chosen) => {
      const fameGained = 10 + Math.floor(rng.next() * 11);

      const newInjury = makeInjury(rng, {
        name: 'Bruised Ribs',
        description: 'Painful but manageable.',
        severity: 'Minor',
        weeksBase: 1,
        weeksRange: 2,
        penalties: { CN: -1 },
      });

      return warriorOutcome({
        fame: addStat(chosen.fame, fameGained),
        injuries: withAddedInjury(chosen, newInjury),
      }, { fame: fameGained });
    }, healthyOnly: true }
  );
}

/**
 *
 */
export function handlePlagueOutbreak(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior(
    { ...run, apply: (chosen) => {
      const fameLost = 5 + Math.floor(rng.next() * 10);

      const newInjury = makeInjury(rng, {
        name: 'Camp Fever',
        description: 'Leaves the victim weak and fatigued.',
        severity: 'Minor',
        weeksBase: 2,
        weeksRange: 2,
        penalties: { CN: -2, ST: -1 },
      });

      return warriorOutcome({
        fame: Math.max(0, (chosen.fame || 0) - fameLost),
        injuries: withAddedInjury(chosen, newInjury),
      }, { fame: fameLost });
    }, healthyOnly: true }
  );
}

/**
 *
 */
export function handleWildAnimalAttack(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior(
    { ...run, apply: (chosen) => {
      const fameGained = 5 + Math.floor(rng.next() * 6);

      const newInjury = makeInjury(rng, {
        name: 'Bite Wound',
        description: 'A nasty bite from a wild beast.',
        severity: 'Minor',
        weeksBase: 1,
        weeksRange: 2,
        penalties: { CN: -1 },
      });

      return warriorOutcome({
        fame: addStat(chosen.fame, fameGained),
        injuries: withAddedInjury(chosen, newInjury),
      }, { fame: fameGained });
    }, healthyOnly: true }
  );
}

/**
 *
 */
export function handleGoblinRaid(run: OffseasonEventRun) {
  const { nextWeek, rng, ctx } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const goldLost = 20 + Math.floor(rng.next() * 31);
    ctx.treasuryDelta -= goldLost;
    ctx.ledgerEntries.push(makeLedgerEntry(rng, nextWeek, 'Goblin Raid Loss', -goldLost, 'other'));

    const newInjury = makeInjury(rng, {
      name: 'Goblin Scratch',
      description: 'Nasty scratch from a tiny spear.',
      severity: 'Minor',
      weeksBase: 1,
      weeksRange: 2,
      penalties: { CN: -1 },
    });

    return warriorOutcome({
        injuries: withAddedInjury(chosen, newInjury)
      }, { gold: goldLost });
  } });
}

/**
 *
 */
export function handleUndergroundPitFight(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const fameGained = 15 + Math.floor(rng.next() * 16);

    const newInjury = makeInjury(rng, {
      name: 'Busted Knuckles',
      description: 'A messy wound from a bare-knuckle pit fight.',
      severity: 'Minor',
      weeksBase: 1,
      weeksRange: 3,
      penalties: { SP: -1, CN: -1 },
    });

    return warriorOutcome({
        fame: addStat(chosen.fame, fameGained),
        injuries: withAddedInjury(chosen, newInjury),
      }, { fame: fameGained });
  } });
}

/**
 *
 */
export function handleTavernBrawlSurprise(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const fameGained = 15 + Math.floor(rng.next() * 11);

    const newInjury = makeInjury(rng, {
      name: 'Tavern Bruises',
      description: 'Scrapes and bruises from a sudden tavern brawl.',
      severity: 'Minor',
      weeksBase: 1,
      weeksRange: 1,
      penalties: { SP: -1 },
    });

    return warriorOutcome({
        fame: addStat(chosen.fame, fameGained),
        injuries: withAddedInjury(chosen, newInjury),
      }, { fame: fameGained });
  } });
}

/**
 *
 */
export function handleSecretFightClub(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 15 + Math.floor(rng.next() * 11);
    const fameGained = 10 + Math.floor(rng.next() * 11);
    const newInjury = makeInjury(rng, {
      name: 'Brawler Bruises',
      description: 'Bruises from an unsanctioned underground brawl.',
      severity: 'Minor',
      weeksBase: 2,
      weeksRange: 2,
      penalties: { SP: -1 },
    });
    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained),
        fame: addStat(chosen.fame, fameGained),
        injuries: withAddedInjury(chosen, newInjury),
      }, { xp: xpGained, fame: fameGained });
  } });
}

/**
 *
 */
export function handleChaoticWeatherExperiment(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 15 + Math.floor(rng.next() * 10);
    const newInjury = makeInjury(rng, {
      name: 'Magic Burns',
      description: 'Minor burns from a wild weather experiment gone wrong.',
      severity: 'Minor',
      weeksBase: 1,
      weeksRange: 1,
      penalties: { SP: -1 },
    });
    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained),
        injuries: withAddedInjury(chosen, newInjury),
      }, { xp: xpGained });
  } });
}
