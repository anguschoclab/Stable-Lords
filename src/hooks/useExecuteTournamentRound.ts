import { useCallback } from 'react';
import { toast } from 'sonner';
import { audioManager } from '@/lib/AudioManager';
import { useGameStore } from '@/state/useGameStore';
import type { TournamentEntry } from '@/types/state.types';

/**
 * Resolves the next round of the live tournament bracket.
 *
 * This IS the canonical day tick: it delegates to `doAdvanceDay`, which runs
 * `TickOrchestrator.advanceDay` in the engine worker under
 * `engineSession`'s serialization + epoch guard — canonical
 * `tournamentDaySeed` seeding, day-counter progression (so the week can
 * reach day 7 and roll over), newsletter entries, and resolution display
 * data all come with it. A bespoke `engineProxy.resolveTournamentRound`
 * call would bypass the epoch guard and diverge on seeds.
 */
export function useExecuteTournamentRound({
  tournament,
}: {
  tournament: TournamentEntry | null | undefined;
}) {
  return useCallback(async () => {
    if (!tournament || useGameStore.getState().isSimulating) return;

    try {
      // doAdvanceDay swallows worker failures internally — detect them by
      // whether the clock actually moved (or the bracket finished).
      const before = useGameStore.getState();
      const beforeKey = `${before.absoluteWeek ?? 0}:${before.week}:${before.day}`;
      await useGameStore.getState().doAdvanceDay();
      const after = useGameStore.getState();
      const updated = (after.tournaments || []).find((t) => t.id === tournament.id);
      const advanced =
        `${after.absoluteWeek ?? 0}:${after.week}:${after.day}` !== beforeKey;
      if (!advanced && !updated?.completed) {
        toast.error('Resolution failed.');
        return;
      }
      audioManager.play('clash');
      toast.success(updated?.completed ? 'Tournament complete.' : 'Round resolved.');
    } catch (error) {
      console.error('Tournament resolution failed:', error);
      toast.error('Resolution failed.');
    }
  }, [tournament]);
}
