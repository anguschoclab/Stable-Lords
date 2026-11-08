import type { StyleStrategy } from '../types';
import { EMPTY_PASSIVE } from './shared';
import {
  TP_PASSIVE_ATT,
  TP_PASSIVE_PAR,
  TP_PASSIVE_INI,
  TP_PASSIVE_NARRATIVE_END_RATIO,
  TP_KILL_LATE_BONUS,
  TP_KILL_MID_BONUS,
  TP_KILL_OPENING_BONUS,
  TP_KILL_LATE_DEC,
  TP_KILL_EARLY_DEC,
  TP_KILL_WINDOW_HP_MULT,
  TP_ANTISYNERGY_SLASH_MULT,
  TP_ANTISYNERGY_OFF_MULT,
  TP_TEMPO_OPENING,
  TP_TEMPO_MID,
  TP_TEMPO_LATE,
  TP_ENDURANCE_MULT,
} from '@/constants/combat';

export const totalParry: StyleStrategy = {
  tempo: {
    opening: TP_TEMPO_OPENING,
    mid: TP_TEMPO_MID,
    late: TP_TEMPO_LATE,
    enduranceMult: TP_ENDURANCE_MULT,
  },
  getPassive: (ctx, m) => ({
    ...EMPTY_PASSIVE,
    mastery: m.tier,
    attBonus: TP_PASSIVE_ATT,
    parBonus: TP_PASSIVE_PAR + (ctx.phase === 'LATE' ? m.bonus : 0),
    iniBonus: TP_PASSIVE_INI,
    hasPassiveNarrative:
      ctx.phase === 'LATE' && ctx.endRatio > TP_PASSIVE_NARRATIVE_END_RATIO,
  }),
  getKillMechanic: (ctx) => ({
    killBonus:
      ctx.phase === 'LATE'
        ? TP_KILL_LATE_BONUS
        : ctx.phase === 'MID'
          ? TP_KILL_MID_BONUS
          : TP_KILL_OPENING_BONUS,
    decBonus: ctx.phase === 'LATE' ? TP_KILL_LATE_DEC : TP_KILL_EARLY_DEC,
    extendedKillWindow: false,
    killWindowHpMult: TP_KILL_WINDOW_HP_MULT,
    killNarrative: 'finds a momentary opening in their own defensive shell!',
  }),
  getAntiSynergy: (off) => {
    let offMult = 1,
      warning;
    if (['Lunge', 'Bash', 'Slash'].includes(off || '')) {
      offMult = off === 'Slash' ? TP_ANTISYNERGY_SLASH_MULT : TP_ANTISYNERGY_OFF_MULT;
      warning = `Total Parry fighters are not built for ${off?.toLowerCase()}`;
    }
    return { offMult, defMult: 1, warning };
  },
};
