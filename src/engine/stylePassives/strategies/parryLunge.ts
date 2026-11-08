import type { StyleStrategy } from '../types';
import { EMPTY_PASSIVE, scale } from './shared';
import {
  PL_PASSIVE_COUNTER_ATT,
  PL_PASSIVE_ATT,
  PL_PASSIVE_COUNTER_INI,
  PL_PASSIVE_PAR,
  PL_KILL_WINDOW_HP_MULT,
  PL_TEMPO_OPENING,
  PL_TEMPO_MID,
  PL_TEMPO_LATE,
  PL_ENDURANCE_MULT,
} from '@/constants/combat';

export const parryLunge: StyleStrategy = {
  tempo: {
    opening: PL_TEMPO_OPENING,
    mid: PL_TEMPO_MID,
    late: PL_TEMPO_LATE,
    enduranceMult: PL_ENDURANCE_MULT,
  },
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
