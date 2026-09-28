import type { ArenaTitle } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { CareerRecord } from '@/types/warrior.types';

/** Shared zero-based CareerRecord builder used by championship tests. */
export function makeCareerRecord(over: Partial<CareerRecord> = {}): CareerRecord {
  return { wins: 0, losses: 0, kills: 0, ...over } as CareerRecord;
}

/** Shared arena/championship test helpers — venue warrior record + title holder. */
export function makeVenueWarrior(
  id: string,
  rec: { wins: number; losses?: number; kills?: number; arenaId?: string; age?: number },
) {
  const wins = rec.wins;
  const losses = rec.losses ?? 0;
  const kills = rec.kills ?? 0;
  const arenaId = rec.arenaId ?? 'standard_arena';
  return makeWarrior({
    id: id as WarriorId,
    ...(rec.age !== undefined ? { age: rec.age } : {}),
    career: { wins, losses, kills, byArena: { [arenaId]: { wins, losses, kills } } },
  });
}

/** make Arena Title. */
export function makeArenaTitle(
  championId: string | null,
  opts: { defenses?: number } & Partial<ArenaTitle> = {},
): ArenaTitle {
  const { defenses = 0, ...over } = opts;
  return {
    champion: championId
      ? { warriorId: championId as WarriorId, startedAbsoluteWeek: 1, defenses, lastActivityWeek: 1 }
      : null,
    status: 'active',
    history: [],
    refusals: 0,
    deferrals: 0,
    noContenderStreak: 0,
    declinedContenders: {},
    ...over,
  };
}
