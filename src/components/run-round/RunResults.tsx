import type { BoutResult } from '@/engine/bout';
import { RunResultsSummary } from './RunResultsSummary';
import { BoutRow } from './BoutRow';

interface RunResultsProps {
  results: BoutResult[];
  expandedId: string | null;
  onToggleExpand: (id: string | null) => void;
} /**
 * Run results.
 * @param - { results, expanded id, on toggle expand }.
 */

/**
 * Run results.
 * @param - { results, expanded id, on toggle expand }.
 */
export function RunResults({ results, expandedId, onToggleExpand }: RunResultsProps) {
  if (results.length === 0) return null;

  const { deaths, KOs } = results.reduce(
    (acc, r) => {
      if (r.outcome.by === 'Kill') acc.deaths++;
      if (r.outcome.by === 'KO') acc.KOs++;
      return acc;
    },
    { deaths: 0, KOs: 0 }
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <RunResultsSummary deaths={deaths} KOs={KOs} />
      <div className="grid grid-cols-1 gap-3">
        {results.map((res, idx) => {
          const id = `res_${idx}`;
          return (
            <BoutRow
              key={id}
              res={res}
              id={id}
              isExpanded={expandedId === id}
              onToggleExpand={onToggleExpand}
            />
          );
        })}
      </div>
    </div>
  );
}
