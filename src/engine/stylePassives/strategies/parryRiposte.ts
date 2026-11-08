import type { StyleStrategy } from '../types';
import { EMPTY_PASSIVE } from './shared';
import {
  PR_PASSIVE_OPENING_ATT,
  PR_PASSIVE_PAR,
  PR_PASSIVE_RIP,
  PR_PASSIVE_RIP_STREAK_ADD,
  PR_PASSIVE_RIP_STREAK_COUNT,
  PR_PASSIVE_NARRATIVE_RIPOSTES,
  PR_KILL_BONUS,
  PR_KILL_DEC,
  PR_KILL_WINDOW_HP_MULT,
  PR_ANTISYNERGY_BASH_MULT,
  PR_ANTISYNERGY_DECISE_MULT,
} from '@/constants/combat';

export const parryRiposte: StyleStrategy = {
  // Canon: low endurance burn is a headline PR advantage (Arena 93 ripper
  // articles; STYLE_IDENTITY.fatigueBurn = 'Low'). Was 1.04 — the highest
  // burn in the game — now below 1.0 to match.
  tempo: { opening: 0, mid: 1, late: 0, enduranceMult: 0.94 },
  getPassive: (ctx, m) => ({
    ...EMPTY_PASSIVE,
    mastery: m.tier,
    attBonus: ctx.phase === 'OPENING' ? PR_PASSIVE_OPENING_ATT : 0,
    parBonus: PR_PASSIVE_PAR,
    ripBonus:
      PR_PASSIVE_RIP + (ctx.ripostes >= PR_PASSIVE_RIP_STREAK_COUNT ? PR_PASSIVE_RIP_STREAK_ADD : 0),
    hasPassiveNarrative: ctx.ripostes >= PR_PASSIVE_NARRATIVE_RIPOSTES,
  }),
  getKillMechanic: () => ({
    killBonus: PR_KILL_BONUS,
    decBonus: PR_KILL_DEC,
    extendedKillWindow: false,
    killWindowHpMult: PR_KILL_WINDOW_HP_MULT,
    killNarrative: 'pivots around the attack and delivers a stinging riposte!',
  }),
  getAntiSynergy: (_off) => {
    let offMult = 1,
      warning;
    const defMult = 1;
    if (_off === 'Bash') {
      offMult = PR_ANTISYNERGY_BASH_MULT;
      warning = 'Riposte specialists lack bashing power';
    }
    if (_off === 'Decisiveness') {
      offMult = PR_ANTISYNERGY_DECISE_MULT;
    }
    return { offMult, defMult, warning };
  },
};
