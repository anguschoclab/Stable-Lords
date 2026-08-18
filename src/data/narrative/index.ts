import type { NarrativeContent } from '@/types/narrative.types';

// Non-combat files are eagerly imported (small, needed at startup)
import gazetteData from './gazette.json';
import recruitmentData from './recruitment.json';
import offseasonData from './offseason.json';
import announcerData from './announcer.json';
import uiMetaData from './uiMeta.json';

// Combat files are lazy-loaded via loadCombatNarrative()
let combatCache: Promise<void> | null = null;

export const narrativeContent: NarrativeContent = {
  // Non-combat data (available immediately)
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
  // Combat data (undefined until loadCombatNarrative() resolves)
  pbp: undefined as any,
  strikes: undefined as any,
  conclusions: undefined as any,
  passives: undefined as any,
  kill_text: undefined as any,
  crowd_reactions: undefined as any,
};

export function loadCombatNarrative(): Promise<void> {
  if (combatCache) return combatCache;
  combatCache = (async () => {
    const [pbpData, strikesData, killTextData, conclusionsData, passivesData] = await Promise.all([
      import('./combatPbp.json'),
      import('./combatStrikes.json'),
      import('./combatKillText.json'),
      import('./combatConclusions.json'),
      import('./combatPassives.json'),
    ]);
    narrativeContent.pbp = (pbpData as any).default.pbp;
    narrativeContent.crowd_reactions = (pbpData as any).default.crowd_reactions;
    narrativeContent.strikes = (strikesData as any).default.strikes;
    narrativeContent.kill_text = (killTextData as any).default.kill_text;
    narrativeContent.conclusions = (conclusionsData as any).default.conclusions;
    narrativeContent.passives = (passivesData as any).default.passives;
  })();
  return combatCache;
}
