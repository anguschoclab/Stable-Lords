/**
 * Arena events — environmental hazards and phenomena keyed on arena tags.
 *
 * Evaluated once per exchange by `tickArenaEvents` (called at the tail of
 * `resolveExchange`, alongside the bleed tick). Each event in the registry
 * declares a trigger (heavy_hit / exchange_interval / weather_combo /
 * random), narrative text, and an optional mechanical effect:
 *
 *   damage          → subtracted from BOTH fighters' hp immediately, with a
 *                     cause-tagged HIT per victim for the log/narrator
 *   endurance_drain → subtracted from BOTH fighters' endurance (floors at 0)
 *   initiative_mod  → queued as a one-exchange pending mod on ctx
 *   riposte_mod     → queued as a one-exchange pending mod on ctx
 *
 * Pending mods are written at the end of exchange N and consumed during
 * exchange N+1's initiative/riposte sums; the next tick overwrites them, so
 * a mod lasts exactly one exchange. `ctx.arenaEventModSources` records the
 * firing hazard names in parallel so the next exchange's narration can
 * attribute the swing. Weather-onset events latch via `ctx.arenaEventsFired`
 * — they announce the condition once per fight.
 *
 * Randomness: 'random' triggers draw from `ctx.rng` (the bout stream) in
 * registry order — same-seed bouts reproduce identical events.
 */
import { getEventsForArena, shouldTriggerEvent } from '@/constants/arenaEvents';
import type { ArenaEventConfig } from '@/constants/arenaEvents';
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState, ResolutionContext } from '../resolution/types';
import { emitDownedBoutEnd } from './downedFighterEnd';

/**
 * Heaviest single untagged hit this exchange — the heavy_hit input.
 * Cause-tagged hits (BLEED ticks, ARENA_EVENT hazard damage) are
 * environmental, not weapon blows, and never count toward heavy_hit.
 */
function heaviestHit(events: CombatEvent[]): CombatEvent | undefined {
  let best: CombatEvent | undefined;
  for (const e of events) {
    if (e.type !== 'HIT' || e.metadata?.cause) continue;
    if ((e.value ?? 0) > (best?.value ?? 0)) best = e;
  }
  return best;
}

interface ApplyEffectArgs {
  cfg: ArenaEventConfig;
  fA: FighterState;
  fD: FighterState;
  pending: { initiativeMod: number; riposteMod: number };
  sources: { initiative: string[]; riposte: string[] };
  events: CombatEvent[];
}

function applyEffect(args: ApplyEffectArgs): void {
  const { cfg, fA, fD, pending, sources, events } = args;
  const mech = cfg.mechanicalEffect;
  if (!mech) return;
  if (mech.type === 'damage') {
    fA.hp -= mech.value;
    fD.hp -= mech.value;
    // Cause-tagged HIT per victim — environmental damage the log/narrator
    // can attribute without masquerading as a weapon result. No location:
    // hazard damage has no body part.
    for (const victim of [fA, fD]) {
      events.push({
        type: 'HIT',
        actor: victim.label,
        target: victim.label,
        value: mech.value,
        metadata: {
          cause: 'ARENA_EVENT',
          arenaEventId: cfg.id,
          hazardName: cfg.name,
          appliedDamage: mech.value,
        },
      });
    }
  } else if (mech.type === 'endurance_drain') {
    fA.endurance = Math.max(0, fA.endurance - mech.value);
    fD.endurance = Math.max(0, fD.endurance - mech.value);
  } else if (mech.type === 'initiative_mod') {
    pending.initiativeMod += mech.value;
    sources.initiative.push(cfg.name);
  } else if (mech.type === 'riposte_mod') {
    pending.riposteMod += mech.value;
    sources.riposte.push(cfg.name);
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
  const boutEnded = events.some((e) => e.type === 'BOUT_END');
  if (ctx.arenaEventCandidates.length === 0 || boutEnded) {
    ctx.arenaEventMods = { initiativeMod: 0, riposteMod: 0 };
    ctx.arenaEventModSources = { initiative: [], riposte: [] };
    return;
  }

  ctx.arenaEventsFired ??= new Set();
  const trigger = heaviestHit(events);
  const damage = trigger?.value ?? 0;
  const pending = { initiativeMod: 0, riposteMod: 0 };
  const sources = { initiative: [] as string[], riposte: [] as string[] };

  for (const cfg of ctx.arenaEventCandidates) {
    if (ctx.arenaEventsFired.has(cfg.id)) continue;
    if (!shouldTriggerEvent(cfg, ctx.exchange, damage, ctx.weather, ctx.rng)) continue;

    events.push({
      type: 'ARENA_EVENT',
      // A heavy_hit trigger is attributed to the fighter whose blow set the
      // hazard off; ambient triggers have no actor (default 'A').
      actor: cfg.triggerCondition === 'heavy_hit' ? (trigger?.actor ?? 'A') : 'A',
      value: cfg.mechanicalEffect?.value,
      metadata: {
        arenaEventId: cfg.id,
        hazardName: cfg.name,
        narrativeText: cfg.narrativeText,
        effect: cfg.mechanicalEffect?.type,
      },
    });
    if (cfg.triggerCondition === 'weather_combo') ctx.arenaEventsFired.add(cfg.id);
    applyEffect({ cfg: cfg, fA: fA, fD: fD, pending: pending, sources: sources, events: events });
  }

  ctx.arenaEventMods = pending;
  ctx.arenaEventModSources = sources;

  // Hazard damage incapacitates like any other damage: a fighter dropped to
  // ≤0 hp cannot continue — emit BOUT_END so the loop doesn't run another
  // exchange with a downed fighter. Both down = mutual incapacitation draw.
  emitDownedBoutEnd(fA, fD, events, 'ARENA_HAZARD');
}
