import type { StyleStrategy } from '../types';
import { EMPTY_PASSIVE, scale } from './shared';
import {
  AB_PASSIVE_ATT_TARGETED,
  AB_PASSIVE_ATT_UNTARGETED,
  AB_PASSIVE_PAR,
  AB_PASSIVE_CRIT_TARGETED,
  AB_PASSIVE_CRIT_UNTARGETED,
  AB_PASSIVE_CRIT_LATE_ADD,
  AB_PASSIVE_CRIT_LATE_EXCHANGE,
  AB_PASSIVE_NARRATIVE_EXCHANGE,
  AB_KILL_HEAD_BONUS,
  AB_KILL_TARGETED_BONUS,
  AB_KILL_TARGETED_DEC,
  AB_KILL_WINDOW_HP_MULT,
} from '@/constants/combat';

export const aimedBlow: StyleStrategy = {
  tempo: { opening: 0, mid: 0, late: 1, enduranceMult: 0.94 },
  getPassive: (ctx, m) => {
    const targeted = ctx.targetedLocation && ctx.targetedLocation !== 'Any';
    return {
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      attBonus: scale(targeted ? AB_PASSIVE_ATT_TARGETED : AB_PASSIVE_ATT_UNTARGETED, m),
      parBonus: AB_PASSIVE_PAR,
      critChance: targeted
        ? AB_PASSIVE_CRIT_TARGETED +
          (ctx.exchange > AB_PASSIVE_CRIT_LATE_EXCHANGE ? AB_PASSIVE_CRIT_LATE_ADD : 0)
        : AB_PASSIVE_CRIT_UNTARGETED,
      hasPassiveNarrative: !!(targeted && ctx.exchange > AB_PASSIVE_NARRATIVE_EXCHANGE),
    };
  },
  getKillMechanic: (ctx) => ({
    killBonus:
      ctx.hitLocation === 'head'
        ? AB_KILL_HEAD_BONUS
        : ctx.targetedLocation !== 'Any'
          ? AB_KILL_TARGETED_BONUS
          : 0,
    decBonus: ctx.targetedLocation !== 'Any' ? AB_KILL_TARGETED_DEC : 0,
    extendedKillWindow: ctx.hitLocation === 'head',
    killWindowHpMult: AB_KILL_WINDOW_HP_MULT,
    killNarrative: 'delivers a precise, clinical strike to a vital point!',
  }),
  getAntiSynergy: () => ({ offMult: 1, defMult: 1 }),
};
