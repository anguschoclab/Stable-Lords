/**
 * Arena events — environmental hazards and phenomena keyed on arena tags.
 *
 * Evaluated once per exchange by `tickArenaEvents` (called at the tail of
 * `resolveExchange`, alongside the bleed tick). Each event in the registry
 * declares a trigger (heavy_hit / exchange_interval / weather_combo /
 * random), narrative text, and an optional mechanical effect:
 *
 *   damage          → subtracted from BOTH fighters' hp immediately
 *   endurance_drain → subtracted from BOTH fighters' endurance (floors at 0)
 *   initiative_mod  → queued as a one-exchange pending mod on ctx
 *   riposte_mod     → queued as a one-exchange pending mod on ctx
 *
 * Pending mods are written at the end of exchange N and consumed during
 * exchange N+1's initiative/riposte sums; the next tick overwrites them, so
 * a mod lasts exactly one exchange. Weather-onset events latch via
 * `ctx.arenaEventsFired` — they announce the condition once per fight.
 *
 * Randomness: 'random' triggers draw from `ctx.rng` (the bout stream) in
 * registry order — same-seed bouts reproduce identical events.
 */
import { getEventsForArena, shouldTriggerEvent } from '@/constants/arenaEvents';
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState, ResolutionContext } from '../resolution/types';

/** Heaviest single non-bleed hit this exchange — the heavy_hit input. */
function maxHitDamage(events: CombatEvent[]): number {
  let max = 0;
  for (const e of events) {
    if (e.type !== 'HIT') continue;
    if (e.metadata?.cause === 'BLEED') continue;
    if ((e.value ?? 0) > max) max = e.value ?? 0;
  }
  return max;
}

function applyEffect(
  cfg: import('@/constants/arenaEvents').ArenaEventConfig,
  fA: FighterState,
  fD: FighterState,
  pending: { initiativeMod: number; riposteMod: number }
): void {
  const mech = cfg.mechanicalEffect;
  if (!mech) return;
  if (mech.type === 'damage') {
    fA.hp -= mech.value;
    fD.hp -= mech.value;
  } else if (mech.type === 'endurance_drain') {
    fA.endurance = Math.max(0, fA.endurance - mech.value);
    fD.endurance = Math.max(0, fD.endurance - mech.value);
  } else if (mech.type === 'initiative_mod') {
    pending.initiativeMod += mech.value;
  } else if (mech.type === 'riposte_mod') {
    pending.riposteMod += mech.value;
  }
}

/**
 * Evaluate this arena's hostable events against the exchange that just
 * resolved, apply mechanical effects, and append ARENA_EVENT CombatEvents
 * for narration.
 */
export function tickArenaEvents(
  ctx: ResolutionContext,
  fA: FighterState,
  fD: FighterState,
  events: CombatEvent[]
): void {
  ctx.arenaEventCandidates ??= getEventsForArena(ctx.arenaConfig.tags);
  if (ctx.arenaEventCandidates.length === 0) {
    ctx.arenaEventMods = { initiativeMod: 0, riposteMod: 0 };
    return;
  }

  ctx.arenaEventsFired ??= new Set();
  const damage = maxHitDamage(events);
  const pending = { initiativeMod: 0, riposteMod: 0 };

  for (const cfg of ctx.arenaEventCandidates) {
    if (ctx.arenaEventsFired.has(cfg.id)) continue;
    if (!shouldTriggerEvent(cfg, ctx.exchange, damage, ctx.weather, ctx.rng)) continue;

    events.push({
      type: 'ARENA_EVENT',
      actor: 'A',
      value: cfg.mechanicalEffect?.value,
      metadata: {
        arenaEventId: cfg.id,
        narrativeText: cfg.narrativeText,
        effect: cfg.mechanicalEffect?.type,
      },
    });
    if (cfg.triggerCondition === 'weather_combo') ctx.arenaEventsFired.add(cfg.id);
    applyEffect(cfg, fA, fD, pending);
  }

  ctx.arenaEventMods = pending;
}
