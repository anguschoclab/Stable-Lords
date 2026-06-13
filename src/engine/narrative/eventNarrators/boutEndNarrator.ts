import { NarrativeTemplateEngine } from '../narrativeTemplateEngine';
import { getWeaponDisplayName, getWeaponType } from '../narrativeUtils';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

export function narrateBoutEnd(
  rng: IRNGService,
  by: string,
  winnerName: string,
  loserName: string,
  weaponId?: string
): string[] {
  const wName = getWeaponDisplayName(weaponId);
  const wType = getWeaponType(weaponId);

  const categoryMap: Record<string, string> = {
    Kill: 'Kill',
    KO: 'KO',
    Stoppage: 'Stoppage',
    Exhaustion: 'Exhaustion',
    Surrender: 'Surrender',
    Incapacitated: 'Incapacitated',
  };

  const category = categoryMap[by] || 'KO';
  const conclusionPath = ['conclusions', category];
  const conclusion =
    NarrativeTemplateEngine.getFromArchive(rng, conclusionPath) || '{{winner}} defeats {{loser}}.';
  const conclusionText = NarrativeTemplateEngine.interpolateTemplate(conclusion, {
    winner: winnerName,
    loser: loserName,
  });

  if (by === 'Kill') {
    const fatalBlowTemplate =
      NarrativeTemplateEngine.getFromArchive(rng, ['strikes', wType, 'fatal']) ||
      NarrativeTemplateEngine.getFromArchive(rng, ['strikes', 'generic']);
    const fatalBlow = NarrativeTemplateEngine.interpolateTemplate(fatalBlowTemplate, {
      attacker: winnerName,
      defender: loserName,
      weapon: wName,
    });
    return [fatalBlow, conclusionText];
  }

  return [conclusionText];
}
