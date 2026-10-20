import { makeMinorInjury } from '@/engine/injuries/utils';
import {
  withChosenWarrior,
  type OffseasonEventRun,
  statGrantOutcome,
  grantInsightToken,
} from '../helpers';

/** Handler for the Suspicious Mushroom Stew offseason event — grants XP but may cause injury. */
export function handleSuspiciousMushroomStew(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const xpGained = 20 + Math.floor(rng.next() * 16);

      const newInjury = makeMinorInjury(rng, {
        name: 'Stomach Ache',
        description: 'A gnawing ache from eating suspicious glowing mushrooms.',
        penalties: { CN: -1, SP: -1 },
      });

      return statGrantOutcome(chosen, { xp: xpGained }, { injury: newInjury, mirror: true });
    },
    healthyOnly: true,
  });
}

/** Handler for the Phantom Sparring Partner offseason event — grants XP but adds fatigue. */
export function handlePhantomSparringPartner(run: OffseasonEventRun) {
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const xpGained = 40;
      const fatigueGained = 10;
      return statGrantOutcome(chosen, { xp: xpGained, fatigue: fatigueGained });
    },
  });
}

/** Handler for the Dreamweavers Mist offseason event — grants XP but causes a minor magic burn. */
export function handleDreamweaversMist(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const newInjury = makeMinorInjury(rng, {
        name: 'Magic Burn',
        description: 'Strange magical blisters that throb in the dark.',
        penalties: { CN: -1 },
      });
      return statGrantOutcome(chosen, { xp: 15 }, { injury: newInjury });
    },
  });
}

/** Handler for the Prismatic Gale Exposure offseason event. */
export function handlePrismaticGaleExposure(run: OffseasonEventRun) {
  const { rng } = run;
  withChosenWarrior({
    ...run,
    apply: (chosen) => {
      const newInjury = makeMinorInjury(rng, {
        name: 'Prismatic Dizziness',
        description: 'Still seeing colors and feeling off-balance.',
        penalties: { SP: -1, CN: -1 },
      });

      grantInsightToken(run, chosen, {
        type: 'Style',
        detail: 'The prismatic winds whispered secrets of movement and flow.',
        origin: 'Prismatic Gale',
      });

      return statGrantOutcome(chosen, { xp: 20 }, { injury: newInjury });
    },
  });
}
