import { useMemo, useState } from 'react';
import { useWorldState } from '@/state/useGameStore';
import { useStableAdvisor } from '@/hooks/useStableAdvisor';

/** Advisor card map + last-week training report + per-week dismissal. */
export function useTrainingPageData(state: ReturnType<typeof useWorldState>) {
  const { cards } = useStableAdvisor();

  const advisorCardMap = useMemo(() => {
    const map = new Map<string, (typeof cards)[0]>();
    for (const c of cards) map.set(c.warriorId, c);
    return map;
  }, [cards]);

  // Training results from the last week pipeline run
  const trainingReportItems = useMemo(() => {
    return (state.newsletter ?? [])
      .filter((n) => n.title === 'Training Report' && n.week === state.week)
      .flatMap((n) => n.items);
  }, [state.newsletter, state.week]);

  const [dismissedWeek, setDismissedWeek] = useState<number | null>(null);
  const showReport = trainingReportItems.length > 0 && dismissedWeek !== state.week;

  return { advisorCardMap, trainingReportItems, showReport, setDismissedWeek };
}
