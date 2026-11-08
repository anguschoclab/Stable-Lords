/**
 * Canon endurance burn order (Arena 93 doctrine): styles spend their pools
 * at different rates — LU burns hottest, TP coldest:
 *   LU > WS > SL > BA > PL > ST > PR > AB > PS > TP
 * Pinned against the per-style tempo enduranceMult constants.
 */
import { describe, it, expect } from 'vitest';
import { LU_ENDURANCE_MULT } from '@/constants/combat/combat/styles/lu';
import { WS_ENDURANCE_MULT } from '@/constants/combat/combat/styles/ws';
import { SL_ENDURANCE_MULT } from '@/constants/combat/combat/styles/sl';
import { BA_ENDURANCE_MULT } from '@/constants/combat/combat/styles/ba';
import { PL_ENDURANCE_MULT } from '@/constants/combat/combat/styles/pl';
import { ST_ENDURANCE_MULT } from '@/constants/combat/combat/styles/st';
import { PR_ENDURANCE_MULT } from '@/constants/combat/combat/styles/pr';
import { AB_ENDURANCE_MULT } from '@/constants/combat/combat/styles/ab';
import { PS_ENDURANCE_MULT } from '@/constants/combat/combat/styles/ps';
import { TP_ENDURANCE_MULT } from '@/constants/combat/combat/styles/tp';

const CANON_ORDER = [
  ['LU', LU_ENDURANCE_MULT],
  ['WS', WS_ENDURANCE_MULT],
  ['SL', SL_ENDURANCE_MULT],
  ['BA', BA_ENDURANCE_MULT],
  ['PL', PL_ENDURANCE_MULT],
  ['ST', ST_ENDURANCE_MULT],
  ['PR', PR_ENDURANCE_MULT],
  ['AB', AB_ENDURANCE_MULT],
  ['PS', PS_ENDURANCE_MULT],
  ['TP', TP_ENDURANCE_MULT],
] as const;

describe('canon endurance burn order', () => {
  it('strictly follows LU>WS>SL>BA>PL>ST>PR>AB>PS>TP', () => {
    for (let i = 0; i < CANON_ORDER.length - 1; i++) {
      const [hot, hotMult] = CANON_ORDER[i]!;
      const [cold, coldMult] = CANON_ORDER[i + 1]!;
      expect(
        hotMult,
        `${hot} (${hotMult}) must burn hotter than ${cold} (${coldMult})`
      ).toBeGreaterThan(coldMult);
    }
  });
});
