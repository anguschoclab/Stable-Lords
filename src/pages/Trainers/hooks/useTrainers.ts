import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { bookmarkIdsByType } from '@/state/slices/bookmarksSlice';
import { TRAINER_MAX_PER_STABLE } from '@/engine/trainers/trainers';
import { useHiringPool } from './useHiringPool';
import { useTrainerActions } from './useTrainerActions';

/**
 * Trainer-directory state: current roster of coaches, filtered by bookmark
 * when requested, plus the hiring pool and hire/fire/convert actions.
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
      bookmarks: s.bookmarks,
    }))
  );

  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  const allTrainers = useMemo(() => trainers ?? [], [trainers]);
  const bookmarkIds = useMemo(() => bookmarkIdsByType(bookmarks), [bookmarks]);
  const currentTrainers = useMemo(() => {
    if (!showBookmarkedOnly) return allTrainers;
    const ids = bookmarkIds.get('trainer');
    return allTrainers.filter((t) => ids?.has(t.id));
  }, [allTrainers, showBookmarkedOnly, bookmarkIds]);

  const bookmarkedCount = allTrainers.filter((t) => bookmarkIds.get('trainer')?.has(t.id)).length;
  const canHire = currentTrainers.length < TRAINER_MAX_PER_STABLE;

  const { currentHiringPool, refreshPool } = useHiringPool(hiringPool, week, setState);
  const { hireTrainer, fireTrainer, convertWarrior } = useTrainerActions({
    setState,
    deductFunds,
    retired,
    setConvertDialogOpen,
  });

  const convertableRetired = useMemo(
    () => retired.filter((w) => !currentTrainers.some((t) => t.retiredFromWarrior === w.name)),
    [retired, currentTrainers]
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
