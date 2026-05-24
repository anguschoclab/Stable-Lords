/**
 * Simulation Narrative - Intro, events, and bout end narration
 */
import {
  generateWarriorIntro,
  battleOpener,
  conservingLine,
} from '../narrativePBP';
import { weatherOpeningLine } from '../combat/mechanics/weatherEffects';
import { arenaIntroLine } from '../narrativePBP';
import type { MinuteEvent } from '@/types/combat.types';
import type { FightPlan } from '@/types/combat.types';
import type { Warrior } from '@/types/warrior.types';
import type { WeatherType } from '@/types/shared.types';
import { DEFAULT_LOADOUT } from '@/data/equipment';

/**
 * Generate introduction narrative for both fighters.
 */
export function generateIntroductions(
  rng: () => number,
  nameA: string,
  nameD: string,
  planA: FightPlan,
  planD: FightPlan,
  warriorA?: Warrior,
  warriorD?: Warrior,
  weather: WeatherType = 'Clear',
  arenaId: string = 'standard_arena',
  arenaConfig?: any // eslint-disable-line @typescript-eslint/no-explicit-any
): MinuteEvent[] {
  const log: MinuteEvent[] = [];

  const weaponA = (warriorA?.equipment ?? DEFAULT_LOADOUT).weapon;
  const weaponD = (warriorD?.equipment ?? DEFAULT_LOADOUT).weapon;

  const introA = generateWarriorIntro(
    rng,
    {
      name: nameA,
      style: planA.style,
      weaponId: weaponA,
      armorId: (warriorA?.equipment ?? DEFAULT_LOADOUT).armor,
      helmId: (warriorA?.equipment ?? DEFAULT_LOADOUT).helm,
      attributes: warriorA?.attributes,
      backupWeaponId: (warriorA?.equipment as { backup?: string } | undefined)?.backup,
    },
    warriorA?.attributes?.SZ
  );
  const introD = generateWarriorIntro(
    rng,
    {
      name: nameD,
      style: planD.style,
      weaponId: weaponD,
      armorId: (warriorD?.equipment ?? DEFAULT_LOADOUT).armor,
      helmId: (warriorD?.equipment ?? DEFAULT_LOADOUT).helm,
      attributes: warriorD?.attributes,
      backupWeaponId: (warriorD?.equipment as { backup?: string } | undefined)?.backup,
    },
    warriorD?.attributes?.SZ
  );

  introA.forEach((line) => log.push({ minute: 0, text: line }));
  log.push({ minute: 0, text: '' });
  introD.forEach((line) => log.push({ minute: 0, text: line }));
  log.push({ minute: 0, text: '' });

  const weatherLine = weatherOpeningLine(weather);
  if (weatherLine) log.push({ minute: 0, text: `☁ ${weather.toUpperCase()} — ${weatherLine}` });

  if (arenaId !== 'standard_arena' && arenaConfig) {
    log.push({ minute: 0, text: arenaIntroLine(arenaConfig) });
  }

  log.push({ minute: 1, text: battleOpener(rng) });
  if (planA.OE <= 3) log.push({ minute: 1, text: conservingLine(nameA) });
  if (planD.OE <= 3) log.push({ minute: 1, text: conservingLine(nameD) });

  return log;
}
