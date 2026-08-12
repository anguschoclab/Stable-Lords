import { useMemo, useCallback, useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import type { Trainer } from '@/types/shared.types';
import {
  TRAINER_MAX_PER_STABLE,
  TIER_COST,
  generateHiringPool,
  convertRetiredToTrainer,
  type TrainerTier,
} from '@/engine/trainers';
import { toast } from 'sonner';

/**
 *
 */
export function useTrainers(showBookmarkedOnly: boolean) {
  const {
    trainers,
    hiringPool,
    week,
    retired,
    graveyard,
    treasury,
    setState,
    deductFunds,
    isBookmarked,
    bookmarks,
  } = useGameStore(
    useShallow((s) => ({
      trainers: s.trainers,
      hiringPool: s.hiringPool,
      week: s.week,
      retired: s.retired,
      graveyard: s.graveyard,
      treasury: s.treasury,
      setState: s.setState,
      deductFunds: s.deductFunds,
      isBookmarked: s.isBookmarked,
      bookmarks: s.bookmarks,
    }))
  );

  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  const allTrainers = useMemo(() => trainers ?? [], [trainers]);
  const currentTrainers = useMemo(() => {
    if (!showBookmarkedOnly) return allTrainers;
    return allTrainers.filter((t) => isBookmarked('trainer', t.id));
  }, [allTrainers, showBookmarkedOnly, isBookmarked, bookmarks]);

  const bookmarkedCount = allTrainers.filter((t) => isBookmarked('trainer', t.id)).length;
  const currentHiringPool = useMemo(() => hiringPool ?? [], [hiringPool]);
  const canHire = currentTrainers.length < TRAINER_MAX_PER_STABLE;

  useEffect(() => {
    if (currentHiringPool.length === 0) {
      const pool = generateHiringPool(4, week * 1000 + cryptoRandomInt(0, 2147483647));
      setState((draft) => {
        draft.hiringPool = pool;
      });
    }
  }, [currentHiringPool.length, week, setState]);

  const refreshPool = useCallback(() => {
    const pool = generateHiringPool(4, week * 1000 + cryptoRandomInt(0, 2147483647));
    setState((draft) => {
      draft.hiringPool = pool;
    });
    toast.success('New trainers available.');
  }, [week, setState]);

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

  const convertableRetired = useMemo(
    () => retired.filter((w) => !currentTrainers.some((t) => t.retiredFromWarrior === w.name)),
    [retired, currentTrainers]
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
    [retired, setState]
  );

  return {
    graveyard,
    retired,
    treasury,
    currentTrainers,
    bookmarkedCount,
    currentHiringPool,
    canHire,
    convertDialogOpen,
    setConvertDialogOpen,
    convertableRetired,
    refreshPool,
    hireTrainer,
    fireTrainer,
    convertWarrior,
  };
}
