

import { makeInjury } from '@/engine/injuries/utils';
import { withChosenWarrior, type OffseasonEventRun, addStat, withAddedInjury, warriorOutcome, grantInsightToken } from '../helpers';

/** Handler for the Suspicious Mushroom Stew offseason event — grants XP but may cause injury. */
export function handleSuspiciousMushroomStew(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior(
    { ...run, apply: (chosen) => {
      const xpGained = 20 + Math.floor(rng.next() * 16);

      const newInjury = makeInjury(rng, {
        name: 'Stomach Ache',
        description: 'A gnawing ache from eating suspicious glowing mushrooms.',
        severity: 'Minor',
        weeksBase: 1,
        weeksRange: 1,
        penalties: { CN: -1, SP: -1 },
      });

      return warriorOutcome({
        xp: addStat(chosen.xp, xpGained),
        injuries: withAddedInjury(chosen, newInjury),
      }, { xp: xpGained });
    }, healthyOnly: true }
  );
}

/** Handler for the Phantom Sparring Partner offseason event — grants XP but adds fatigue. */
export function handlePhantomSparringPartner(run: OffseasonEventRun) {
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 40;
    const fatigueGained = 10;
    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained),
        fatigue: addStat(chosen.fatigue, fatigueGained),
      });
  } });
}

/** Handler for the Dreamweavers Mist offseason event — grants XP but causes a minor magic burn. */
export function handleDreamweaversMist(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 15;
    const newInjury = makeInjury(rng, {
      name: 'Magic Burn',
      description: 'Strange magical blisters that throb in the dark.',
      severity: 'Minor',
      weeksBase: 1,
      weeksRange: 1,
      penalties: { CN: -1 },
    });
    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained),
        injuries: withAddedInjury(chosen, newInjury),
      });
  } });
}

/** Handler for the Prismatic Gale Exposure offseason event. */
export function handlePrismaticGaleExposure(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({ ...run, apply: (chosen) => {
    const xpGained = 20;

    const newInjury = makeInjury(rng, {
      name: 'Prismatic Dizziness',
      description: 'Still seeing colors and feeling off-balance.',
      severity: 'Minor',
      weeksBase: 1,
      weeksRange: 1,
      penalties: { SP: -1, CN: -1 },
    });

    grantInsightToken(run, chosen, { type: 'Style', detail: 'The prismatic winds whispered secrets of movement and flow.', origin: 'Prismatic Gale' });

    return warriorOutcome({
        xp: addStat(chosen.xp, xpGained),
        injuries: withAddedInjury(chosen, newInjury),
      });
  } });
}
