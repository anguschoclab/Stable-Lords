import type {
  GameState,
  Season,
  WeatherType,
  Promoter,
  BoutOffer,
  RivalStableData,
  GazetteStory,
  Owner,
  ScoutReportData,
  CrowdMoodType,
  NewsletterItem,
  HallEntry,
  Rivalry,
  MatchRecord,
  OwnerGrudge,
} from '@/types/state.types';
import { FightSummary } from '@/types/combat.types';
import type {
  WarriorId,
  StableId,
  PromoterId,
  BoutOfferId,
  FightId,
} from '@/types/shared.types';

export interface ArenaPreferences {
  defaultViewMode: 'log' | 'arena';
  audioEnabled: boolean;
  audioVolume: number;
  effectsEnabled: boolean;
  screenShakeIntensity: 'off' | 'low' | 'medium' | 'high';
}

export interface WorldSlice {
  year: number;
  week: number;
  day: number;
  season: Season;
  weather: WeatherType;
  promoters: Record<PromoterId, Promoter>;
  boutOffers: Record<BoutOfferId, BoutOffer>;
  rivals: RivalStableData[];
  gazettes: GazetteStory[];
  scoutReports: ScoutReportData[];
  arenaHistory: FightSummary[];
  newsletter: NewsletterItem[];
  hallOfFame: HallEntry[];
  crowdMood: CrowdMoodType;
  moodHistory: { week: number; mood: CrowdMoodType }[];
  arenaPreferences: ArenaPreferences;
  isFTUE: boolean;
  ftueStep?: number;
  ftueComplete: boolean;
  player: Owner;
  coachDismissed: string[];
  rivalries: Rivalry[];
  matchHistory: MatchRecord[];
  playerChallenges: string[];
  playerAvoids: string[];
  ownerGrudges: OwnerGrudge[];
  phase: 'planning' | 'resolution';
  pendingResolutionData?: GameState['pendingResolutionData'];
  setWeek: (week: number) => void;
  setArenaPreferences: (prefs: Partial<ArenaPreferences>) => void;
  initializeStable: (name: string, stableName: string) => void;
  appendFight: (summary: FightSummary) => void;
  updateBoutOfferStatus: (offerId: BoutOfferId, status: BoutOffer['status']) => void;
  respondToBoutOffer: (
    offerId: BoutOfferId,
    warriorId: WarriorId,
    response: 'Accepted' | 'Declined'
  ) => void;
  clearExpiredOffers: () => void;
  updatePromoterHistory: (promoterId: PromoterId, purse: number, boutId: FightId) => void;
  replacePromoter: (oldId: PromoterId, newPromoter: Promoter) => void;
  updateWarriorStatus: (
    warriorId: WarriorId,
    won: boolean,
    killed: boolean,
    fameDelta: number,
    popDelta: number,
    rivalStableId?: StableId
  ) => void;
  renameStable: (newName: string) => void;
  renamePlayer: (newName: string) => void;
}
