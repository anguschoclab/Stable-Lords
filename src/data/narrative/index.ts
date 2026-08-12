import combatPbp from './combatPbp.json';
import combatStrikes from './combatStrikes.json';
import combatKillText from './combatKillText.json';
import combatConclusions from './combatConclusions.json';
import combatPassives from './combatPassives.json';
import gazetteData from './gazette.json';
import recruitmentData from './recruitment.json';
import offseasonData from './offseason.json';
import announcerData from './announcer.json';
import uiMetaData from './uiMeta.json';
import type { NarrativeContent } from '@/types/narrative.types';

export const narrativeContent: NarrativeContent = {
  pbp: (combatPbp as any).pbp,
  strikes: (combatStrikes as any).strikes,
  kill_text: (combatKillText as any).kill_text,
  conclusions: (combatConclusions as any).conclusions,
  passives: (combatPassives as any).passives,
  crowd_reactions: (combatPbp as any).crowd_reactions,
  gazette: (gazetteData as any).gazette,
  ux_metadata: (gazetteData as any).ux_metadata,
  recruitment: (recruitmentData as any).recruitment,
  offseason_events: (offseasonData as any).offseason_events,
  events: (offseasonData as any).events,
  blurbs: (announcerData as any).blurbs,
  commentary: (announcerData as any).commentary,
  recap: (announcerData as any).recap,
  fanfare: (uiMetaData as any).fanfare,
  meta: (uiMetaData as any).meta,
  persona: (uiMetaData as any).persona,
  memorials: (uiMetaData as any).memorials,
};

export async function loadCombatNarrative(): Promise<void> {
  // Stub — real lazy-loading implemented in Phase 3
}
