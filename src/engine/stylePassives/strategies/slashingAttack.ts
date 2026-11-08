import type { StyleStrategy } from '../types';
import { EMPTY_PASSIVE } from './shared';
import {
  SL_PASSIVE_FLURRY_DMG,
  SL_PASSIVE_FLURRY_HITS,
  SL_PASSIVE_PAR,
  SL_PASSIVE_ATT,
  SL_KILL_FLURRY_BONUS,
  SL_KILL_EXTENDED_HITS,
  SL_KILL_WINDOW_HP_MULT_EXTENDED,
  SL_KILL_WINDOW_HP_MULT,
  SL_ANTISYNERGY_BASH_MULT,
  SL_ANTISYNERGY_PARRY_MULT,
  SL_TEMPO_OPENING,
  SL_TEMPO_MID,
  SL_TEMPO_LATE,
  SL_ENDURANCE_MULT,
} from '@/constants/combat';

export const slashingAttack: StyleStrategy = {
  tempo: {
    opening: SL_TEMPO_OPENING,
    mid: SL_TEMPO_MID,
    late: SL_TEMPO_LATE,
    enduranceMult: SL_ENDURANCE_MULT,
  },
  getPassive: (ctx, m) => {
    const flurryDmg = ctx.hitsLanded >= SL_PASSIVE_FLURRY_HITS ? SL_PASSIVE_FLURRY_DMG : 0;
    return {
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      attBonus: ctx.phase !== 'LATE' ? SL_PASSIVE_ATT + m.bonus : 0,
      parBonus: SL_PASSIVE_PAR,
      dmgBonus: flurryDmg,
      hasPassiveNarrative: ctx.hitsLanded >= SL_PASSIVE_FLURRY_HITS,
    };
  },
  getKillMechanic: (ctx) => ({
    killBonus: ctx.hitsLanded >= SL_PASSIVE_FLURRY_HITS ? SL_KILL_FLURRY_BONUS : 0,
    decBonus: 0,
    extendedKillWindow: ctx.hitsLanded >= SL_KILL_EXTENDED_HITS,
    killWindowHpMult:
      ctx.hitsLanded >= SL_KILL_EXTENDED_HITS
        ? SL_KILL_WINDOW_HP_MULT_EXTENDED
        : SL_KILL_WINDOW_HP_MULT,
    killNarrative: 'overwhelms their foe with a flurry of precise cuts!',
  }),
  getAntiSynergy: (off, def) => {
    let offMult = 1,
      defMult = 1,
      warning;
    if (off === 'Bash') {
      offMult = SL_ANTISYNERGY_BASH_MULT;
      warning = 'Slashers rely on blade edge, not blunt force';
    }
    if (def === 'Parry') {
      defMult = SL_ANTISYNERGY_PARRY_MULT;
      warning = (warning ? warning + '; ' : '') + 'Slashers struggle with disciplined parries';
    }
    return { offMult, defMult, warning };
  },
};
