import type { Season, WeatherType, CrowdMoodType, StableId } from '@/types/shared.types';
import type { ArenaPreferences, WorldSlice } from './types';

export const DEFAULT_ARENA_PREFERENCES: ArenaPreferences = {
  defaultViewMode: 'arena',
  audioEnabled: true,
  audioVolume: 0.7,
  effectsEnabled: true,
  screenShakeIntensity: 'medium',
};

export const defaultWorldState: Omit<
  WorldSlice,
  | 'setWeek'
  | 'setArenaPreferences'
  | 'initializeStable'
  | 'appendFight'
  | 'updateBoutOfferStatus'
  | 'respondToBoutOffer'
  | 'clearExpiredOffers'
  | 'updatePromoterHistory'
  | 'replacePromoter'
  | 'updateWarriorStatus'
  | 'renameStable'
  | 'renamePlayer'
> = {
  year: 1,
  week: 1,
  day: 0,
  season: 'Spring' as Season,
  weather: 'Clear' as WeatherType,
  promoters: {},
  boutOffers: {},
  rivals: [],
  gazettes: [],
  scoutReports: [],
  arenaHistory: [],
  newsletter: [],
  hallOfFame: [],
  crowdMood: 'Neutral' as CrowdMoodType,
  moodHistory: [],
  arenaPreferences: DEFAULT_ARENA_PREFERENCES,
  isFTUE: false,
  ftueComplete: false,
  player: {
    id: 'p1' as StableId,
    name: 'Rookie',
    stableName: 'Fresh Stable',
    fame: 0,
    renown: 0,
    titles: 0,
  },
  coachDismissed: [],
  rivalries: [],
  matchHistory: [],
  playerChallenges: [],
  playerAvoids: [],
  ownerGrudges: [],
  phase: 'planning',
  pendingResolutionData: undefined,
};
