import type { StyleStrategy } from '../types';
import { EMPTY_PASSIVE } from './shared';
import {
  PS_PASSIVE_PAR,
  PS_PASSIVE_ATT,
  PS_PASSIVE_COUNTER_ATT,
  PS_KILL_WINDOW_HP_MULT,
  PS_ANTISYNERGY_BASH_MULT,
} from '@/constants/combat';

export const parryStrike: StyleStrategy = {
  tempo: { opening: 0, mid: 0, late: 0, enduranceMult: 0.96 },
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
