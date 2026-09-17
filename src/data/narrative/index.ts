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
  gazette: gazetteData.gazette,
  ux_metadata: gazetteData.ux_metadata,
  recruitment: recruitmentData.recruitment,
  offseason_events: offseasonData.offseason_events,
  events: offseasonData.events,
  blurbs: announcerData.blurbs,
  commentary: announcerData.commentary,
  recap: announcerData.recap,
  fanfare: uiMetaData.fanfare,
  meta: uiMetaData.meta,
  persona: uiMetaData.persona,
  memorials: uiMetaData.memorials,
  // Combat data (undefined until loadCombatNarrative() resolves)
  pbp: undefined,
  strikes: undefined,
  conclusions: undefined,
  passives: undefined,
  kill_text: undefined,
  crowd_reactions: undefined,
};

export function loadCombatNarrative(): Promise<void> {
  if (combatCache) return combatCache;
  combatCache = (async () => {
    const [pbpData, strikesData, killTextData, conclusionsData, passivesData] =
      await Promise.all([
        import('./combatPbp.json'),
        import('./combatStrikes.json'),
        import('./combatKillText.json'),
        import('./combatConclusions.json'),
        import('./combatPassives.json'),
      ]);
    narrativeContent.pbp = pbpData.default.pbp;
    narrativeContent.crowd_reactions = pbpData.default.crowd_reactions;
    narrativeContent.strikes = strikesData.default.strikes;
    narrativeContent.kill_text = killTextData.default.kill_text;
    narrativeContent.conclusions = conclusionsData.default.conclusions;
    narrativeContent.passives = passivesData.default.passives;
  })();
  return combatCache;
}
