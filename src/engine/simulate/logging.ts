/**
 * Simulation Logging - Exchange log building and minute events
 */
import type { CombatEvent, ExchangeLogEntry } from '@/types/combat.types';

type Phase = 'OPENING' | 'MID' | 'LATE';

/**
 * Derive a structured `ExchangeLogEntry` from the `CombatEvent[]` emitted by
 * `resolveExchange`. Strictly a read-over-events projection — no resolution
 * logic lives here, which keeps this callable safely on any event stream.
 * Consumers: HighlightLog curation, telemetry aggregation, kill-text tiers.
 */
export function buildExchangeLogEntry(
  exchangeIndex: number,
  minute: number,
  phase: Phase,
  events: CombatEvent[]
): ExchangeLogEntry {
  const entry: ExchangeLogEntry = { exchangeIndex, minute, phase };
  const reasonCodes: string[] = [];
  for (const e of events) {
    switch (e.type) {
      case 'INITIATIVE':
        entry.iniWinner = e.actor;
        break;
      case 'ATTACK':
        if (e.result === 'WHIFF') entry.attResult = 'miss';
        else if (e.metadata?.crit) entry.attResult = 'crit';
        else if (e.result === 'FUMBLE') entry.attResult = 'fumble';
        break;
      case 'DEFENSE':
        if (e.result === 'PARRY') {
          entry.parResult = 'success';
          entry.attResult ??= 'miss';
        } else if (e.result === 'DODGE') {
          entry.defResult = 'dodge';
          entry.attResult ??= 'miss';
        } else if (e.result === 'RIPOSTE') entry.ripResult = 'hit';
        break;
      case 'HIT':
        entry.attResult ??= e.metadata?.crit ? 'crit' : 'hit';
        if (typeof e.value === 'number') entry.damage = (entry.damage ?? 0) + e.value;
        if (e.location) entry.hitLocation = e.location;
        break;
      case 'BOUT_END':
        if (e.metadata?.cause) reasonCodes.push(`CAUSE_${String(e.metadata.cause)}`);
        entry.executionFlag = e.result === 'Kill';
        entry.killWindow ??= e.result === 'Kill';
        break;
      case 'KNOCKDOWN':
        // actor is the fighter who was knocked down (defender of the hit)
        entry.knockdown ??= e.actor;
        break;
      case 'RECOVERY':
        // actor is the fighter who recovers (clears knockedDown at start of exchange)
        entry.recovery ??= e.actor;
        break;
      case 'MOMENTUM_SHIFT':
        // first shift per exchange wins; subsequent parry/riposte swings in same exchange are noise
        entry.momentumShift ??= {
          actor: e.actor,
          to: e.value ?? 0,
          from: (e.metadata?.prev as number) ?? 0,
        };
        break;
    }
  }
  if (reasonCodes.length) entry.reasonCodes = reasonCodes;
  return entry;
}
