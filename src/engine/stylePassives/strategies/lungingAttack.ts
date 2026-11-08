import type { StyleStrategy } from '../types';
import { EMPTY_PASSIVE } from './shared';
import {
  LU_PASSIVE_LATE_ATT,
  LU_PASSIVE_MID_ATT,
  LU_KILL_OPENING_BONUS,
  LU_KILL_OPENING_DEC,
  LU_KILL_WINDOW_HP_MULT,
  LU_ANTISYNERGY_BASH_MULT,
  LU_ANTISYNERGY_PARRY_MULT,
} from '@/constants/combat';

export const lungingAttack: StyleStrategy = {
  tempo: { opening: 1, mid: 0, late: -1, enduranceMult: 1.02 },
  getPassive: (ctx, m) => {
    const isFirst = ctx.exchange === 0;
    return {
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      iniBonus: isFirst ? m.bonus : 0,
      attBonus: isFirst ? 0 : ctx.phase === 'LATE' ? LU_PASSIVE_LATE_ATT : LU_PASSIVE_MID_ATT,
      hasPassiveNarrative: isFirst,
    };
  },
  getKillMechanic: (ctx) => ({
    killBonus: ctx.phase === 'OPENING' ? LU_KILL_OPENING_BONUS : 0,
    decBonus: ctx.phase === 'OPENING' ? LU_KILL_OPENING_DEC : 0,
    extendedKillWindow: false,
    killWindowHpMult: LU_KILL_WINDOW_HP_MULT,
    killNarrative: 'springs forward with a sudden, lethal thrust!',
  }),
  getAntiSynergy: (off, def) => {
    let offMult = 1,
      defMult = 1,
      warning;
    if (off === 'Bash') {
      offMult = LU_ANTISYNERGY_BASH_MULT;
      warning = 'Lungers lack the weight for effective bashing';
    }
    if (def === 'Parry') {
      defMult = LU_ANTISYNERGY_PARRY_MULT;
      warning = (warning ? warning + '; ' : '') + 'Lungers are overextended for strong parries';
    }
    return { offMult, defMult, warning };
  },
};
