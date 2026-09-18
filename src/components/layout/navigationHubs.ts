import {
  Swords,
  Globe,
  LayoutDashboard,
  BookUser,
  Dumbbell,
  Flame,
  Skull,
  Wrench,
  Coins,
  ScrollText,
  Building2,
  Sunset,
  Trophy,
  Radar,
  Newspaper,
  CalendarClock,
  BrainCircuit,
  UserPlus,
  Bookmark,
} from 'lucide-react';

/**
 * Hubs.
 */
export const HUBS = [
  {
    id: 'stable',
    label: 'Stable',
    icon: Swords,
    to: '/stable',
    pages: [
      { to: '/stable', label: 'Overview', icon: LayoutDashboard, exact: true },
      { to: '/stable/roster', label: 'Roster', icon: BookUser },
      { to: '/stable/training', label: 'Training', icon: Dumbbell },
      { to: '/stable/planner', label: 'Planner', icon: BrainCircuit },
      { to: '/stable/arena', label: 'Arena', icon: Flame },
      { to: '/stable/equipment', label: 'Equipment', icon: Wrench },
      { to: '/stable/bouts', label: 'Bouts', icon: ScrollText },
      { to: '/stable/promoters', label: 'Promoters', icon: Building2 },
      { to: '/stable/trainers', label: 'Trainers', icon: Dumbbell },
      { to: '/stable/finance', label: 'Finance', icon: Coins },
      { to: '/stable/recruit', label: 'Recruit', icon: UserPlus },
      { to: '/stable/offseason', label: 'Offseason', icon: Sunset },
      { to: '/world/tournaments', label: 'Tournaments', icon: CalendarClock },
    ],
  },
  {
    id: 'world',
    label: 'World',
    icon: Globe,
    to: '/world',
    pages: [
      { to: '/world', label: 'Rankings', icon: Trophy, exact: true },
      { to: '/world/arena-leaderboards', label: 'Arenas', icon: Swords },
      { to: '/world/tournaments', label: 'Tournaments', icon: CalendarClock },
      { to: '/world/scouting', label: 'Scouting', icon: Radar },
      { to: '/world/chronicle', label: 'Chronicle', icon: Newspaper },
      { to: '/world/history', label: 'Hall of Fame', icon: Trophy },
      { to: '/world/graveyard', label: 'Graveyard', icon: Skull },
    ],
  },
  {
    id: 'bookmarks',
    label: 'Bookmarks',
    icon: Bookmark,
    to: '/bookmarks',
    pages: [],
  },
] as const;

/**
 * Hub id type.
 */
export type HubId = (typeof HUBS)[number]['id'];
