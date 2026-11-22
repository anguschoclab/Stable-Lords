// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CrowdMoodWidget } from '@/pages/arenaHub/crowdMoodWidget';
import { buildMoodTrail } from '@/pages/arenaHub/moodTrail';
import { TooltipProvider } from '@/components/ui/tooltip';
import { makeGameState } from '@/test/_fixtures/factories';
import { useGameStore } from '@/state/useGameStore';
import '@/test/_setup/setup';
import type { CrowdMoodType } from '@/types/shared.types';

const moods = (entries: [number, CrowdMoodType][]) =>
  entries.map(([week, mood]) => ({ week, mood }));

describe('buildMoodTrail', () => {
  it('returns the tail oldest→newest, capped at the limit', () => {
    const history = moods(
      Array.from({ length: 25 }, (_, i) => [i + 1, 'Calm' as CrowdMoodType] as [number, CrowdMoodType])
    );
    const trail = buildMoodTrail(history, 20);
    expect(trail).toHaveLength(20);
    expect(trail[0]!.week).toBe(6);
    expect(trail[19]!.week).toBe(25);
  });

  it('collapses impact-merge duplicates to one cell per week, sorted', () => {
    // Live saves append the same week's entry several times and out of
    // order (impact 'append' merge over pre-computed tails).
    const trail = buildMoodTrail(
      moods([
        [1, 'Calm'],
        [1, 'Calm'],
        [2, 'Festive'],
        [4, 'Calm'],
        [1, 'Calm'],
        [2, 'Festive'],
        [3, 'Bloodthirsty'],
        [4, 'Calm'],
      ])
    );
    expect(trail).toEqual(
      moods([
        [1, 'Calm'],
        [2, 'Festive'],
        [3, 'Bloodthirsty'],
        [4, 'Calm'],
      ])
    );
  });

  it('last write wins when a week carries conflicting moods', () => {
    const trail = buildMoodTrail(
      moods([
        [1, 'Calm'],
        [1, 'Bloodthirsty'],
      ])
    );
    expect(trail).toEqual(moods([[1, 'Bloodthirsty']]));
  });

  it('drops malformed legacy entries', () => {
    const trail = buildMoodTrail([
      { week: 1, mood: 'Festive' as CrowdMoodType },
      { week: 'x' as unknown as number, mood: 'Calm' as CrowdMoodType },
      { week: 2, mood: 'NotAMood' as CrowdMoodType },
      null as unknown as { week: number; mood: CrowdMoodType },
      { week: 3, mood: 'Bloodthirsty' as CrowdMoodType },
    ]);
    expect(trail).toEqual(moods([
      [1, 'Festive'],
      [3, 'Bloodthirsty'],
    ]));
  });

  it('handles empty/undefined history', () => {
    expect(buildMoodTrail(undefined)).toEqual([]);
    expect(buildMoodTrail([])).toEqual([]);
  });
});

describe('CrowdMoodWidget temperament ledger', () => {
  beforeEach(() => {
    useGameStore.setState(
      makeGameState({
        crowdMood: 'Festive',
        moodHistory: moods([
          [8, 'Calm'],
          [9, 'Bloodthirsty'],
          [10, 'Festive'],
        ]),
      }) as never
    );
  });

  it('renders one labelled cell per recorded week', () => {
    render(
      <TooltipProvider>
        <CrowdMoodWidget />
      </TooltipProvider>
    );
    expect(screen.getByLabelText('Week 8: Calm')).toBeTruthy();
    expect(screen.getByLabelText('Week 9: Bloodthirsty')).toBeTruthy();
    expect(screen.getByLabelText('Week 10: Festive')).toBeTruthy();
    expect(screen.getByText('Temperament Ledger')).toBeTruthy();
  });

  it('shows the forming cue under the minimum-data threshold', () => {
    useGameStore.setState(
      makeGameState({
        crowdMood: 'Calm',
        moodHistory: moods([[1, 'Calm']]),
      }) as never
    );
    render(
      <TooltipProvider>
        <CrowdMoodWidget />
      </TooltipProvider>
    );
    expect(screen.getByText('Ledger forms after two resolved weeks')).toBeTruthy();
    expect(screen.queryByRole('listitem')).toBeNull();
  });
});
