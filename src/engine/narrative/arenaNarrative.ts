/**
 * Arena narrative — lore-flavored prose describing an arena's character and
 * its real gameplay effects (surface modifiers, zone penalties, size, tags).
 * Every line maps to an actual ArenaConfig field — no invented flavor that
 * doesn't affect a bout.
 */
import type { ArenaConfig, ArenaTag } from '@/types/shared.types';
import { getArenaById } from '@/data/arenas';

const SIZE_PROSE: Record<ArenaConfig['size'], string> = {
  cramped:
    'A cramped pit — fighters open at knife range, long weapons are worthless, and every hit drives the loser toward the walls.',
  standard: 'A standard fighting ground with the full range ladder available.',
  open: 'A wide, open ground with room to maneuver.',
};

const TAG_PROSE: Partial<Record<ArenaTag, string>> = {
  indoor: 'Fought under cover, safe from the worst of the weather.',
  elevated: 'The ground sits high — footing and nerve both matter up here.',
  water: 'Standing water makes the footing treacherous.',
  uneven: 'Uneven ground punishes lunging footwork.',
  ruins: 'Broken stone and rubble litter the fighting floor.',
  magical: 'An unnatural presence hangs over the grounds.',
  living: 'The arena itself seems alive and hostile.',
  cursed: 'A curse clings to this place; fighters feel it in their bones.',
  premium: "The realm's premium venue — the crowds expect spectacle.",
};

function zonePenaltyProse(zone: string, penalty: number): string {
  const sev = penalty <= -4 ? 'badly exposed' : penalty <= -2 ? 'vulnerable' : 'slightly exposed';
  const where =
    zone === 'Corner'
      ? 'cornered against the walls'
      : zone === 'Edge'
        ? 'driven to the edge'
        : zone === 'Obstacle'
          ? 'forced onto the obstacles'
          : 'in the center';
  return `Fighters are ${sev} when ${where} (${penalty} DEF).`;
}

function surfaceProse(arena: ArenaConfig): string[] {
  const lines: string[] = [];
  const { initiativeMod, enduranceMult, riposteMod } = arena.surfaceMod;
  if (initiativeMod !== 0) {
    lines.push(
      initiativeMod > 0
        ? `The footing quickens the first step (+${initiativeMod} initiative).`
        : `The footing dulls the first step (${initiativeMod} initiative).`
    );
  }
  if (enduranceMult !== 1) {
    lines.push(
      enduranceMult > 1
        ? `The ground saps stamina — endurance drains ${Math.round((enduranceMult - 1) * 100)}% faster than normal.`
        : `The ground is forgiving — endurance lasts longer than normal.`
    );
  }
  if (riposteMod !== 0) {
    lines.push(
      riposteMod > 0
        ? `The surface rewards counter-fighters (+${riposteMod} riposte).`
        : `The surface stifles counter-attacks (${riposteMod} riposte).`
    );
  }
  return lines;
}

/**
 * Lore-ish prose for an arena card: its name, its description, then every
 * real mechanical effect translated into readable lines.
 */
export function describeArenaEffects(arenaId: string): string[] {
  const arena = getArenaById(arenaId);
  const lines: string[] = [`${arena.name} — ${arena.description}`];

  lines.push(SIZE_PROSE[arena.size]);

  for (const line of surfaceProse(arena)) lines.push(line);

  for (const [zone, penalty] of Object.entries(arena.zoneDef)) {
    if (typeof penalty === 'number' && penalty !== 0) {
      lines.push(zonePenaltyProse(zone, penalty));
    }
  }

  for (const tag of arena.tags) {
    const prose = TAG_PROSE[tag];
    if (prose) lines.push(prose);
  }

  for (const mod of arena.weatherMods ?? []) {
    for (const [zone, penalty] of Object.entries(mod.zoneDef ?? {})) {
      const base = arena.zoneDef[zone as keyof typeof arena.zoneDef];
      if (typeof penalty === 'number' && penalty !== base) {
        lines.push(`In ${mod.weatherType.toLowerCase()} weather, ${zonePenaltyProse(zone, penalty)}`);
      }
    }
    const s = mod.surfaceMod;
    if (!s) continue;
    if (s.initiativeMod !== undefined && s.initiativeMod !== arena.surfaceMod.initiativeMod) {
      lines.push(
        `In ${mod.weatherType.toLowerCase()} weather the footing changes (${s.initiativeMod} initiative).`
      );
    }
    if (s.enduranceMult !== undefined && s.enduranceMult !== arena.surfaceMod.enduranceMult) {
      lines.push(
        `In ${mod.weatherType.toLowerCase()} weather the ground turns harsher — endurance drains ${Math.round((s.enduranceMult - 1) * 100)}% faster than normal.`
      );
    }
    if (s.riposteMod !== undefined && s.riposteMod !== arena.surfaceMod.riposteMod) {
      lines.push(
        `In ${mod.weatherType.toLowerCase()} weather counter-attacks suffer (${s.riposteMod} riposte).`
      );
    }
  }

  return lines;
}
