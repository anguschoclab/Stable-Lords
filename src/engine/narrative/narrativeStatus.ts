/**
 * Narrative Status - Status and feedback narration functions
 * Extracted from narrativePBP.ts to follow SRP
 */
import { getFromArchive, interpolateTemplate } from './narrativePBPUtils';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

/**
 * Generates damage severity line.
 */
export function damageSeverityLine(
  rng: IRNGService,
  damage: number,
  maxHp: number,
  defenderName?: string
): string | null {
  const ratio = damage / maxHp;
  if (ratio >= 0.35)
    return interpolateTemplate(getFromArchive(rng, ['pbp', 'damage_severity', 'deadly']), {
      defender: defenderName,
    });
  if (ratio >= 0.25)
    return interpolateTemplate(getFromArchive(rng, ['pbp', 'damage_severity', 'terrific']), {
      defender: defenderName,
    });
  if (ratio >= 0.15)
    return interpolateTemplate(getFromArchive(rng, ['pbp', 'damage_severity', 'powerful']), {
      defender: defenderName,
    });
  if (ratio <= 0.05)
    return interpolateTemplate(getFromArchive(rng, ['pbp', 'damage_severity', 'glancing']), {
      defender: defenderName,
    });
  return null;
}

/**
 * Generates state change line.
 */
export function stateChangeLine(
  rng: IRNGService,
  name: string,
  hpRatio: number,
  prevHpRatio: number
): string | null {
  let cat = '';
  if (hpRatio <= 0.2 && prevHpRatio > 0.2) cat = 'severe';
  else if (hpRatio <= 0.4 && prevHpRatio > 0.4) cat = 'desperate';
  else if (hpRatio <= 0.6 && prevHpRatio > 0.6) cat = 'serious';

  if (cat) {
    const template = getFromArchive(rng, ['pbp', 'status_changes', cat]);
    return interpolateTemplate(template, { name });
  }
  return null;
}

/**
 * Generates fatigue line.
 */
export function fatigueLine(_rng: IRNGService, name: string, endRatio: number): string | null {
  if (endRatio <= 0.15) return `${name} is tired and barely able to defend himself!`;
  if (endRatio <= 0.3) return `${name} is breathing heavily.`;
  return null;
}

/**
 * Generates crowd reaction line.
 */
export function crowdReaction(
  rng: IRNGService,
  loserName: string,
  winnerName: string,
  hpRatio: number
): string | null {
  if (rng.next() > 0.25) return null;
  const isDeadly = hpRatio <= 0.1;
  const mood = isDeadly ? 'gasp' : hpRatio <= 0.3 ? 'encourage' : rng.next() < 0.5 ? 'boo' : 'cheer';
  const template =
    getFromArchive(rng, ['pbp', 'reactions', mood]) ||
    getFromArchive(rng, [
      'pbp',
      'reactions',
      mood === 'boo' ? 'negative' : mood === 'cheer' ? 'positive' : 'encourage',
    ]);
  return interpolateTemplate(template, { name: loserName, attacker: winnerName });
}

/**
 * Generates minute status line.
 */
export function minuteStatusLine(
  rng: IRNGService,
  _minute: number,
  nameA: string,
  nameD: string,
  hitsA: number,
  hitsD: number
): string {
  if (hitsA > hitsD + 3) return `${nameA} is beating his opponent!`;
  if (hitsD > hitsA + 3) return `${nameD} is beating his opponent!`;
  return getFromArchive(rng, ['pbp', 'pacing', 'stalemate']);
}
