import { useState, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { bookmarkIdsByType } from '@/state/slices/bookmarksSlice';
import { generateScoutReport, getScoutCost, type ScoutQuality } from '@/engine/scouting/scouting';
import { type ScoutReportData, type Warrior, type RivalStableData } from '@/types/game';
import { SeededRNGService } from '@/utils/random';
import { hashStr } from '@/utils/random';
import { toast } from 'sonner';

/** Purchase a scout report for the target warrior: dedupe, ledger, treasury. */
function purchaseScoutReport(
  activeWarrior: Warrior,
  quality: ScoutQuality,
  deps: {
    treasury: number | undefined;
    week: number;
    scoutReports: ScoutReportData[] | undefined;
    setState: (fn: (draft: GameStore) => void) => void;
  }
): void {
  const { treasury, week, scoutReports, setState } = deps;
  const cost = getScoutCost(quality);
  if ((treasury ?? 0) < cost) {
    toast.error(`Insufficient funds! Scouting requires ${cost}g.`);
    return;
  }

  const rng = new SeededRNGService(week + hashStr(activeWarrior.name));
  const { report } = generateScoutReport(activeWarrior, quality, week, rng);

  // Ensure we don't have duplicate reports for the same warrior
  const newReports = [
    ...(scoutReports ?? []).filter((r: ScoutReportData) => r.warriorName !== activeWarrior.name),
    report as ScoutReportData,
  ];

  setState((draft: GameStore) => {
    draft.scoutReports = newReports;
    draft.treasury = (treasury ?? 0) - cost;
    draft.ledger.push({
      id: String(
        hashStr(`${week}-${activeWarrior.name}-${quality}`)
      ) as import('@/types/shared.types').LedgerEntryId,
      week: week,
      label: `Scouting: ${activeWarrior.name} (${quality})`,
      amount: -cost,
      category: 'other',
    });
  });
  toast.success(`Report filed for ${activeWarrior.name}. (-${cost}g)`);
}

/**
 * Store selection, rival/warrior selection state, and the scout-report
 * purchase action for the Scouting page.
 */
export function useScouting(showBookmarkedOnly: boolean) {
  const { treasury, week, rivals, scoutReports, roster, setState, bookmarks } = useGameStore(
    useShallow((s) => ({
      treasury: s.treasury,
      week: s.week,
      rivals: s.rivals,
      scoutReports: s.scoutReports,
      roster: s.roster,
      setState: s.setState,
      bookmarks: s.bookmarks,
    }))
  );
  const [selectedRivalId, setSelectedRivalId] = useState<string | null>(null);
  const [selectedWarriorId, setSelectedWarriorId] = useState<string | null>(null);

  const allReports = useMemo(() => scoutReports ?? [], [scoutReports]);
  const bookmarkIds = useMemo(() => bookmarkIdsByType(bookmarks), [bookmarks]);
  const filteredReports = useMemo(() => {
    if (!showBookmarkedOnly) return allReports;
    const ids = bookmarkIds.get('scoutReport');
    return allReports.filter((r) => ids?.has(r.id));
  }, [allReports, showBookmarkedOnly, bookmarkIds]);

  const bookmarkedCount = allReports.filter((r) =>
    bookmarkIds.get('scoutReport')?.has(r.id)
  ).length;

  const rivalMap = useMemo(() => {
    const map = new Map<string, RivalStableData>();
    for (const r of rivals ?? []) {
      map.set(r.owner.id as string, r);
    }
    return map;
  }, [rivals]);

  const activeRival = useMemo(
    () => (selectedRivalId ? rivalMap.get(selectedRivalId) : undefined),
    [rivalMap, selectedRivalId]
  );

  const activeWarrior = useMemo(
    () => activeRival?.roster.find((w: Warrior) => w.id === selectedWarriorId),
    [activeRival, selectedWarriorId]
  );

  const handleScout = useCallback(
    (quality: ScoutQuality) => {
      if (!activeWarrior) return;
      purchaseScoutReport(activeWarrior, quality, { treasury, week, scoutReports, setState });
    },
    [treasury, week, scoutReports, setState, activeWarrior]
  );

  const handleSelectRival = useCallback((id: string) => {
    setSelectedRivalId(id);
    setSelectedWarriorId(null);
  }, []);

  const handleSelectWarrior = useCallback((id: string) => {
    setSelectedWarriorId(id);
  }, []);

  return {
    treasury,
    week,
    rivals,
    scoutReports,
    roster,
    selectedRivalId,
    selectedWarriorId,
    filteredReports,
    bookmarkedCount,
    handleScout,
    handleSelectRival,
    handleSelectWarrior,
  };
}
