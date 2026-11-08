/** §2 Accolade scrolls — year-grouped rolls per award type. */
import type { AnnualAward } from '@/types/state.types';
import {
  AWARD_TITLE,
  by,
  mkBoard,
  numAsc,
  numDesc,
  strAsc,
  type AlmanacBoard,
  type AlmanacInput,
} from './shared';

/** §2 Accolade scrolls — year-grouped award rolls (WotY / KotY / SotY / MVP / tournament rank). */
export function computeAccoladeBoards(input: AlmanacInput): AlmanacBoard[] {
  const awards = input.awards ?? [];
  if (awards.length === 0) return [];

  const byType = new Map<string, { award: AnnualAward; idx: number }[]>();
  awards.forEach((a, idx) => {
    const list = byType.get(a.type) ?? [];
    list.push({ award: a, idx });
    byType.set(a.type, list);
  });

  const boards: AlmanacBoard[] = [];
  for (const [type, entries] of byType) {
    entries.sort(by(numDesc((e) => e.award.year), numAsc((e) => e.idx)));
    boards.push(
      mkBoard(
        `accolade-${type}`,
        AWARD_TITLE[type] ?? type,
        'scroll',
        entries.map(({ award: a }) => ({
          key: `${type}-${a.year}-${a.warriorId ?? a.stableId ?? 'x'}`,
          name: a.warriorName ?? a.stableName ?? 'Unknown',
          sub: `Year ${a.year}`,
          detail: a.reason,
          value: a.value ?? 0,
          warriorId: a.warriorId as string | undefined,
          style: a.style,
        }))
      )
    );
  }
  // Deterministic board order: headline awards first, then by id.
  boards.sort(strAsc((b) => b.id));
  return boards;
}
