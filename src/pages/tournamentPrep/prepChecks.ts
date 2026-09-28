import { type WeatherType } from '@/types/shared.types';
import { isActive } from '@/engine/warrior/warriorStatus';
import { hasInjuries, countInjuries } from '@/engine/injuries/utils';
import { getFatigueBand } from '@/engine/core/fatigueUtils';
import { committeeWeatherSkip } from '@/engine/ai/weatherSuitability';
import type { Warrior } from '@/types/state.types';

/** Fight experience — completed bouts (wins + losses). */
export function fightExperience(w: Warrior): number {
  return (w.career?.wins ?? 0) + (w.career?.losses ?? 0);
}

/** A single prep-checklist finding: advisory or blocking. */
export interface PrepIssue {
  label: string;
  blocking: boolean;
}

/** Eligibility checklist for one entrant — mirrors the committee's gates. */
export function prepIssues(w: Warrior, weather: WeatherType | undefined): PrepIssue[] {
  const issues: PrepIssue[] = [];
  if (!isActive(w)) issues.push({ label: 'Inactive', blocking: true });
  if (hasInjuries(w)) {
    issues.push({
      label: `${countInjuries(w)} ${countInjuries(w) === 1 ? 'injury' : 'injuries'}`,
      blocking: false,
    });
  }
  const band = getFatigueBand(w.fatigue ?? 0);
  if (band === 'exhausted') {
    issues.push({ label: 'Exhausted', blocking: false });
  } else if (band === 'elevated') {
    issues.push({ label: 'Fatigued', blocking: false });
  }
  if (weather && committeeWeatherSkip(w, weather)) {
    issues.push({ label: `Weather-averse (${weather})`, blocking: false });
  }
  return issues;
}
