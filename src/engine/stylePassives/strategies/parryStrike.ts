import type { StyleStrategy } from '../types';
import { EMPTY_PASSIVE } from './shared';
import {
  PS_PASSIVE_PAR,
  PS_PASSIVE_ATT,
  PS_PASSIVE_COUNTER_ATT,
  PS_KILL_WINDOW_HP_MULT,
  PS_ANTISYNERGY_BASH_MULT,
  PS_TEMPO_OPENING,
  PS_TEMPO_MID,
  PS_TEMPO_LATE,
  PS_ENDURANCE_MULT,
} from '@/constants/combat';

export const parryStrike: StyleStrategy = {
  tempo: {
    opening: PS_TEMPO_OPENING,
    mid: PS_TEMPO_MID,
    late: PS_TEMPO_LATE,
    enduranceMult: PS_ENDURANCE_MULT,
  },
  getPassive: (ctx) => ({
    ...EMPTY_PASSIVE,
    parBonus: PS_PASSIVE_PAR,
    attBonus: PS_PASSIVE_ATT + (ctx.hitsTaken > ctx.hitsLanded ? PS_PASSIVE_COUNTER_ATT : 0),
  }),
  getKillMechanic: () => ({
    killBonus: 0,
    decBonus: 0,
    extendedKillWindow: false,
    killWindowHpMult: PS_KILL_WINDOW_HP_MULT,
    killNarrative: 'blocks and strikes in a single fluid motion!',
  }),
  getAntiSynergy: (_off) => ({
    offMult: _off === 'Bash' ? PS_ANTISYNERGY_BASH_MULT : 1,
    defMult: 1,
  }),
};
