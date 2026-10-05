import { resolveEffectiveTactics } from '../../combat/resolution/resolution';
import type { FighterState } from '../../combat/resolution/types';
import { minuteStatusLine } from '../../narrative';
import type { LoopCtx, Phase } from './types';

/** Pushes the phase banner + tactic-reveal line on phase transitions. */
function emitPhaseHeader(
  c: LoopCtx,
  fA: FighterState,
  fD: FighterState,
  phase: Phase,
  min: number
): void {
  if (c.headless) return;
  const phaseKey = phase.toLowerCase() as 'opening' | 'mid' | 'late';
  const tacticsA = resolveEffectiveTactics(fA.plan, phaseKey);
  const tacticsD = resolveEffectiveTactics(fD.plan, phaseKey);
  c.log.push({
    minute: min,
    text: `— ${phase.charAt(0) + phase.slice(1).toLowerCase()} Phase —`,
    phase,
    offTacticA: tacticsA.offTactic !== 'none' ? tacticsA.offTactic : undefined,
    defTacticA: tacticsA.defTactic !== 'none' ? tacticsA.defTactic : undefined,
    offTacticD: tacticsD.offTactic !== 'none' ? tacticsD.offTactic : undefined,
    defTacticD: tacticsD.defTactic !== 'none' ? tacticsD.defTactic : undefined,
  });
}

/** Pushes the "MINUTE n." marker + status line at each minute boundary. */
function emitMinuteMarker(c: LoopCtx, fA: FighterState, fD: FighterState, min: number): void {
  if (c.headless) return;
  c.log.push({ minute: min, text: `MINUTE ${min}.` });
  c.log.push({
    minute: min,
    text: minuteStatusLine({ rng: c.flavorRng, _minute: min, nameA: c.nameA, nameD: c.nameD, hitsA: fA.hitsLanded, hitsD: fD.hitsLanded }),
  });
}

/**
 * Emit progress markers args.
 */
interface EmitProgressMarkersArgs {
  c: LoopCtx;
  fA: FighterState;
  fD: FighterState;
  phase: Phase;
  min: number;
  lastPhase: string | null;
  lastMinuteMarker: number;
}

/** Emits phase-header and minute-marker beats; returns updated markers. */
export function emitProgressMarkers(args: EmitProgressMarkersArgs): { lastPhase: string | null; lastMinuteMarker: number } {
  const { c, fA, fD, phase, min } = args;
  let { lastPhase, lastMinuteMarker } = args;
  if (phase !== lastPhase) {
    lastPhase = phase;
    emitPhaseHeader(c, fA, fD, phase, min);
  }
  if (min > lastMinuteMarker && min > 1) {
    lastMinuteMarker = min;
    emitMinuteMarker(c, fA, fD, min);
  }
  return { lastPhase, lastMinuteMarker };
}
