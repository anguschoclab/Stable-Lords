/**
 * Style card — everything there is to tweak about one fighting style, on one
 * screen: penalty/floor rows, matchup-matrix row & column, tempo, identity,
 * the style's exported constants, and sampled passive/kill-mechanic outputs.
 *
 *   bun run scripts/style-card.ts WS     # one style's card
 *   bun run scripts/style-card.ts        # all-styles tempo table
 *   LAB='{"penD":{"WS":[0,0,0,1,0,0]}}' bun run scripts/style-card.ts WS
 */
import {
  STYLE_PENALTIES,
  STYLE_SKILL_FLOORS,
} from '@/engine/warrior/skillBreakpoints';
import { getMatchupBonus, STYLE_ORDER } from '@/constants/combat';
import {
  getTempoBonus,
  getEnduranceMult,
  getStylePassive,
  getKillMechanic,
  getStyleIdentity,
} from '@/engine/stylePassives';
import { applyLabOverrides, STYLE_CODE, STYLE_KEY } from './lab-overrides';
import { logger } from '@/utils/logger';

import * as ab from '@/constants/combat/combat/styles/ab';
import * as ba from '@/constants/combat/combat/styles/ba';
import * as lu from '@/constants/combat/combat/styles/lu';
import * as pl from '@/constants/combat/combat/styles/pl';
import * as pr from '@/constants/combat/combat/styles/pr';
import * as ps from '@/constants/combat/combat/styles/ps';
import * as sl from '@/constants/combat/combat/styles/sl';
import * as st from '@/constants/combat/combat/styles/st';
import * as tp from '@/constants/combat/combat/styles/tp';
import * as ws from '@/constants/combat/combat/styles/ws';

applyLabOverrides();

const STYLE_CONSTS: Record<string, Record<string, unknown>> = {
  AB: ab,
  BA: ba,
  LU: lu,
  PL: pl,
  PR: pr,
  PS: ps,
  SL: sl,
  ST: st,
  TP: tp,
  WS: ws,
};

const SKILLS = ['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC'];
const CODES = STYLE_ORDER.map((s) => STYLE_CODE[s]);

function rowOf(label: string, row: readonly number[]): string {
  return `${label.padEnd(8)}${row.map((v) => String(v).padStart(4)).join('')}   ${SKILLS.map((s) => s.padStart(4)).join('')}`;
}

function printTempoTable(): void {
  logger.log('    open mid late  end×  burn       identity');
  for (const s of STYLE_ORDER) {
    const id = getStyleIdentity(s);
    logger.log(
      `${STYLE_CODE[s].padEnd(4)}${String(getTempoBonus(s, 'OPENING')).padStart(4)}${String(getTempoBonus(s, 'MID')).padStart(4)}${String(getTempoBonus(s, 'LATE')).padStart(5)}` +
        `${getEnduranceMult(s).toFixed(2).padStart(6)}  ${id.fatigueBurn.padEnd(10)} ${id.tagline}`
    );
  }
}

function printCard(code: string): void {
  const style = STYLE_KEY[code]!;
  const id = getStyleIdentity(style);
  logger.log(`=== ${code} — ${style} ===`);
  logger.log(
    `identity: ${id.voice} · ${id.attackFreq} · ${id.killBias} · ${id.fatigueBurn} burn — "${id.tagline}"`
  );

  logger.log('\npower   [level layer — same table for every style]');
  logger.log(rowOf('penalty', STYLE_PENALTIES[style]));
  logger.log(rowOf('floor', STYLE_SKILL_FLOORS[style]));

  logger.log(`\nmatchup  ${CODES.map((c) => c.padStart(4)).join('')}`);
  logger.log(
    `${'vs'.padEnd(8)}${STYLE_ORDER.map((o) => String(getMatchupBonus(style, o)).padStart(4)).join('')}`
  );
  logger.log(
    `${'by'.padEnd(8)}${STYLE_ORDER.map((o) => String(getMatchupBonus(o, style)).padStart(4)).join('')}`
  );

  logger.log(
    `\ntempo    opening ${getTempoBonus(style, 'OPENING')} · mid ${getTempoBonus(style, 'MID')} · late ${getTempoBonus(style, 'LATE')} · endurance ×${getEnduranceMult(style)}`
  );

  logger.log(`\nconstants (src/constants/combat/combat/styles/${code.toLowerCase()}.ts)`);
  for (const [name, value] of Object.entries(STYLE_CONSTS[code] ?? {})) {
    logger.log(`  ${name} = ${typeof value === 'object' ? JSON.stringify(value) : value}`);
  }

  const base = {
    hitsLanded: 0,
    hitsTaken: 0,
    ripostes: 0,
    consecutiveHits: 0,
    hpRatio: 1,
    endRatio: 1,
    opponentStyle: style,
  };
  const passiveAt = (phase: 'OPENING' | 'MID' | 'LATE', exchange: number, extra = {}) =>
    getStylePassive(style, { ...base, phase, exchange, ...extra });
  logger.log('\npassive  @ opening | mid(bruised) | late(flurry)');
  for (const p of [
    passiveAt('OPENING', 0),
    passiveAt('MID', 12, { hitsTaken: 3, hitsLanded: 1, consecutiveHits: 1 }),
    passiveAt('LATE', 20, { hitsLanded: 5, consecutiveHits: 5, ripostes: 3 }),
  ]) {
    const { mastery, hasPassiveNarrative, ...rest } = p;
    const nz = Object.entries(rest).filter(([, v]) => v !== 0);
    logger.log(
      `  ${mastery.padEnd(10)}${nz.length ? nz.map(([k, v]) => `${k}:${v}`).join(' ') : '(silent)'}${hasPassiveNarrative ? '  +narrative' : ''}`
    );
  }
  logger.log('\nkill mechanic @ opening | mid(5 hits, head aim)');
  for (const k of [
    getKillMechanic(style, {
      phase: 'OPENING',
      hitsLanded: 0,
      consecutiveHits: 0,
      hitLocation: 'chest',
    }),
    getKillMechanic(style, {
      phase: 'MID',
      hitsLanded: 5,
      consecutiveHits: 3,
      targetedLocation: 'Head',
      hitLocation: 'head',
    }),
  ]) {
    const { killNarrative, ...rest } = k;
    logger.log(`  ${JSON.stringify(rest)}  "${killNarrative}"`);
  }
}

const code = (process.argv[2] ?? '').toUpperCase();
if (code && STYLE_KEY[code]) {
  printCard(code);
} else {
  if (code) logger.log(`unknown style code '${code}' — expected one of ${CODES.join(' ')}`);
  printTempoTable();
  logger.log(`\nrun 'bun run scripts/style-card.ts <code>' for a full card`);
}
