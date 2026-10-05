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
  for (const e of events) projectEvent(e, entry, reasonCodes);
  if (reasonCodes.length) entry.reasonCodes = reasonCodes;
  return entry;
}

/**
 * Stage E: project the first condition fire into a side-attributed
 * structure — the reasonCode string alone loses the actor.
 */
function projectConditionFire(e: CombatEvent, entry: ExchangeLogEntry): void {
  const fire = /^CONDITION_(\w+?)(@CORNER)?$/.exec(String(e.result ?? ''));
  if (fire && !entry.conditionFire) {
    entry.conditionFire = {
      actor: e.actor,
      trigger: fire[1] ?? '',
      corner: fire[2] === '@CORNER',
    };
  }
}

/** Fold one CombatEvent into the log entry / reason-code accumulators. */
function projectEvent(
  e: CombatEvent,
  entry: ExchangeLogEntry,
  reasonCodes: string[]
): void {
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
        // Cause-tagged damage (BLEED ticks, ARENA_EVENT hazards) is
        // environmental — it sums into damage but never poses as a weapon
        // result or body location for fightAnalysis.
        if (!e.metadata?.cause) {
          entry.attResult ??= e.metadata?.crit ? 'crit' : 'hit';
          if (e.location) entry.hitLocation = e.location;
        }
        if (typeof e.value === 'number') entry.damage = (entry.damage ?? 0) + e.value;
        break;
      case 'BOUT_END':
        if (e.metadata?.cause) reasonCodes.push(`CAUSE_${String(e.metadata.cause)}`);
        entry.executionFlag = e.result === 'Kill';
        entry.killWindow ??= e.result === 'Kill';
        break;
      case 'AI_INTENT':
        // Stage F: metadata.cause is already 'AI_INTENT_*' — surface verbatim.
        if (e.metadata?.cause) reasonCodes.push(String(e.metadata.cause));
        break;
      case 'STATE_CHANGE': {
        // Psych transitions, desperate-plan activation, and condition-fire
        // annotations (CONDITION_*, CONDITION_*@CORNER) are real engine facts
        // — the debug drawer reads them verbatim from reasonCodes.
        if (e.result) reasonCodes.push(String(e.result));
        projectConditionFire(e, entry);
        break;
      }
      case 'KNOCKDOWN':
        // actor is the fighter who was knocked down (defender of the hit)
        entry.knockdown ??= e.actor;
        break;
      case 'RECOVERY':
        // actor is the fighter who recovers (clears knockedDown at start of exchange)
        entry.recovery ??= e.actor;
        break;
      case 'ARENA_EVENT':
        // Tag-venue hazards surface as ARENA_<ID> so the debug drawer can
        // tell a mist-veil exchange from a clean one.
        if (e.metadata?.arenaEventId) {
          reasonCodes.push(`ARENA_${String(e.metadata.arenaEventId).toUpperCase()}`);
        }
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
