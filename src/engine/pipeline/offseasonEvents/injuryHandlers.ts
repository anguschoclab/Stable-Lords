/**
 * Injury offseason events — cause injuries to warriors, sometimes with fame/gold side effects.
 */

import { makeMinorInjury } from '@/engine/injuries/utils';
import { makeLedgerEntry } from '@/engine/impacts/ledgerHelpers';
import { withChosenWarrior, type OffseasonEventRun, statGrantOutcome } from './helpers';

/**
 *
 */
export function handleTavernBrawl(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const fameGained = 10 + Math.floor(rng.next() * 11);

      const newInjury = makeMinorInjury(rng, {
        name: 'Bruised Ribs',
        description: 'Painful but manageable.',
        weeksRange: 2,
        penalties: { CN: -1 },
      });

      return statGrantOutcome(
        chosen,
        { fame: fameGained },
        {
          injury: newInjury,
          mirror: true,
        }
      );
    },
    healthyOnly: true,
  });
}

/**
 *
 */
export function handlePlagueOutbreak(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const fameLost = 5 + Math.floor(rng.next() * 10);

      const newInjury = makeMinorInjury(rng, {
        name: 'Camp Fever',
        description: 'Leaves the victim weak and fatigued.',
        weeksBase: 2,
        weeksRange: 2,
        penalties: { CN: -2, ST: -1 },
      });

      return statGrantOutcome(
        chosen,
        { fame: -fameLost },
        {
          clampToZero: true,
          injury: newInjury,
          announce: { fame: fameLost },
        }
      );
    },
    healthyOnly: true,
  });
}

/**
 *
 */
export function handleWildAnimalAttack(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const fameGained = 5 + Math.floor(rng.next() * 6);

      const newInjury = makeMinorInjury(rng, {
        name: 'Bite Wound',
        description: 'A nasty bite from a wild beast.',
        weeksRange: 2,
        penalties: { CN: -1 },
      });

      return statGrantOutcome(
        chosen,
        { fame: fameGained },
        {
          injury: newInjury,
          mirror: true,
        }
      );
    },
    healthyOnly: true,
  });
}

/**
 *
 */
export function handleGoblinRaid(run: OffseasonEventRun) {
  const { nextWeek, rng, ctx } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const goldLost = 20 + Math.floor(rng.next() * 31);
      ctx.treasuryDelta -= goldLost;
      ctx.ledgerEntries.push(
        makeLedgerEntry(rng, nextWeek, 'Goblin Raid Loss', -goldLost, 'other')
      );

      const newInjury = makeMinorInjury(rng, {
        name: 'Goblin Scratch',
        description: 'Nasty scratch from a tiny spear.',
        weeksRange: 2,
        penalties: { CN: -1 },
      });

      return statGrantOutcome(
        chosen,
        {},
        {
          injury: newInjury,
          announce: { gold: goldLost },
        }
      );
    },
  });
}

/**
 *
 */
export function handleUndergroundPitFight(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const fameGained = 15 + Math.floor(rng.next() * 16);

      const newInjury = makeMinorInjury(rng, {
        name: 'Busted Knuckles',
        description: 'A messy wound from a bare-knuckle pit fight.',
        weeksRange: 3,
        penalties: { SP: -1, CN: -1 },
      });

      return statGrantOutcome(
        chosen,
        { fame: fameGained },
        {
          injury: newInjury,
          mirror: true,
        }
      );
    },
  });
}

/**
 *
 */
export function handleTavernBrawlSurprise(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const fameGained = 15 + Math.floor(rng.next() * 11);

      const newInjury = makeMinorInjury(rng, {
        name: 'Tavern Bruises',
        description: 'Scrapes and bruises from a sudden tavern brawl.',
        penalties: { SP: -1 },
      });

      return statGrantOutcome(
        chosen,
        { fame: fameGained },
        {
          injury: newInjury,
          mirror: true,
        }
      );
    },
  });
}

/**
 *
 */
export function handleSecretFightClub(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const xpGained = 15 + Math.floor(rng.next() * 11);
      const fameGained = 10 + Math.floor(rng.next() * 11);
      const newInjury = makeMinorInjury(rng, {
        name: 'Brawler Bruises',
        description: 'Bruises from an unsanctioned underground brawl.',
        weeksBase: 2,
        weeksRange: 2,
        penalties: { SP: -1 },
      });
      return statGrantOutcome(
        chosen,
        { xp: xpGained, fame: fameGained },
        {
          injury: newInjury,
          mirror: true,
        }
      );
    },
  });
}

/**
 *
 */
export function handleChaoticWeatherExperiment(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const xpGained = 15 + Math.floor(rng.next() * 10);
      const newInjury = makeMinorInjury(rng, {
        name: 'Magic Burns',
        description: 'Minor burns from a wild weather experiment gone wrong.',
        penalties: { SP: -1 },
      });
      return statGrantOutcome(
        chosen,
        { xp: xpGained },
        {
          injury: newInjury,
          mirror: true,
        }
      );
    },
  });
}
