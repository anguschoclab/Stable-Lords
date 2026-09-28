import { useCallback } from 'react';
import type { Trainer } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { GameStore } from '@/state/store.types';
import {
  TIER_COST,
  convertRetiredToTrainer,
  type TrainerTier,
} from '@/engine/trainers/trainers';
import { toast } from 'sonner';

type SetState = GameStore['setState'];
type DeductFunds = GameStore['deductFunds'];

interface TrainerActionsDeps {
  setState: SetState;
  deductFunds: DeductFunds;
  retired: Warrior[];
  setConvertDialogOpen: (open: boolean) => void;
}

/**
 * Trainer mutations: hire from the pool, fire from the stable, convert a
 * retired warrior into a coach.
 */
export function useTrainerActions({
  setState,
  deductFunds,
  retired,
  setConvertDialogOpen,
}: TrainerActionsDeps) {
  const hireTrainer = useCallback(
    (trainer: Trainer) => {
      const cost = TIER_COST[trainer.tier as TrainerTier] ?? 50;
      if (!deductFunds(cost, `Hire: ${trainer.name}`, 'trainer')) {
        toast.error(`Not enough gold. ${trainer.name} costs ${cost}G.`);
        return;
      }
      setState((draft) => {
        draft.trainers.push(trainer);
        draft.hiringPool = draft.hiringPool.filter((t) => t.id !== trainer.id);
      });
      toast.success(`${trainer.name} has signed with your stable.`);
    },
    [deductFunds, setState]
  );

  const fireTrainer = useCallback(
    (trainerId: string) => {
      setState((draft) => {
        draft.trainers = draft.trainers.filter((t) => t.id !== trainerId);
      });
    },
    [setState]
  );

  const convertWarrior = useCallback(
    (warriorId: string) => {
      const warrior = retired.find((w) => w.id === warriorId);
      if (!warrior) return;
      const trainer = convertRetiredToTrainer(warrior);
      setState((draft) => {
        draft.trainers.push(trainer);
      });
      toast.success(`${warrior.name} retired to coaching. Specialization: ${trainer.focus}.`);
      setConvertDialogOpen(false);
    },
    [retired, setState, setConvertDialogOpen]
  );

  return { hireTrainer, fireTrainer, convertWarrior };
}
