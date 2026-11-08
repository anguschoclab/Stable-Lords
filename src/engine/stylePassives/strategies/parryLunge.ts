import type { StyleStrategy } from '../types';
import { EMPTY_PASSIVE, scale } from './shared';
import {
  PL_PASSIVE_COUNTER_ATT,
  PL_PASSIVE_ATT,
  PL_PASSIVE_COUNTER_INI,
  PL_PASSIVE_PAR,
  PL_KILL_WINDOW_HP_MULT,
} from '@/constants/combat';

export const parryLunge: StyleStrategy = {
  tempo: { opening: 0, mid: 2, late: 0, enduranceMult: 1.0 },
  getPassive: (ctx, m) => {
    const counterReady = ctx.hitsTaken > ctx.hitsLanded;
    return {
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      attBonus: scale(counterReady ? PL_PASSIVE_COUNTER_ATT : PL_PASSIVE_ATT, m),
      parBonus: PL_PASSIVE_PAR + m.bonus,
      iniBonus: counterReady ? PL_PASSIVE_COUNTER_INI : 0,
      hasPassiveNarrative: counterReady,
    };
  },
  getKillMechanic: () => ({
    killBonus: 0,
    decBonus: 0,
    extendedKillWindow: false,
    killWindowHpMult: PL_KILL_WINDOW_HP_MULT,
    killNarrative: 'exploits a gap in the defense to strike home!',
  }),
  getAntiSynergy: () => ({ offMult: 1, defMult: 1 }),
};
