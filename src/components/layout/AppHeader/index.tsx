import { Link } from '@tanstack/react-router';
import { Swords } from 'lucide-react';
import { type CrowdMood } from '@/engine/bout/crowdMood';
import { MobileNav } from '@/components/layout/MobileNav';
import { ImperialRing } from '@/components/ui/ImperialRing';
import type { WeatherType } from '@/types/state.types';
import { StatusStrip } from './statusStrip';
import { HeaderActions } from './actions';

interface AppHeaderProps {
  week: number;
  day: number;
  isTournamentWeek: boolean;
  treasury: number;
  fame: number;
  crowdMood: CrowdMood;
  weather: WeatherType;
  isSimulating: boolean;
  lastSavedAt: string | null;
  onResetPrompt: () => void;
  returnToTitle: () => void;
}

function HeaderLogo() {
  return (
    <Link
      to="/"
      className="flex items-center gap-4 group active:scale-95 transition-all motion-reduce:transition-none motion-reduce:transform-none duration-300"
    >
      <ImperialRing
        size="md"
        variant="blood"
        className="group-hover:rotate-[225deg] transition-all motion-reduce:transition-none motion-reduce:transform-none duration-700"
      >
        <Swords className="w-5 h-5" />
      </ImperialRing>
      <div className="flex flex-col">
        <span className="font-display font-black text-base tracking-tighter uppercase leading-none group-hover:text-primary transition-colors motion-reduce:transition-none">
          Stable Lords
        </span>
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30">
          Codex Sanguis · v1.0
        </span>
      </div>
    </Link>
  );
}

/**
 *
 */
export function AppHeader(props: AppHeaderProps) {
  const { week, day, isTournamentWeek, treasury, fame } = props;
  const { crowdMood, weather, isSimulating, lastSavedAt, onResetPrompt } = props;
  const { returnToTitle } = props;
  return (
    <header className="h-16 border-b border-white/5 bg-background/90 backdrop-blur-2xl z-50 flex items-center justify-between px-6 sticky top-0 flex-shrink-0 shadow-2xl">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-4">
          <MobileNav />
          <HeaderLogo />
        </div>

        <StatusStrip
          week={week}
          day={day}
          isTournamentWeek={isTournamentWeek}
          isSimulating={isSimulating}
          treasury={treasury}
          fame={fame}
          crowdMood={crowdMood}
          weather={weather}
        />
      </div>

      <HeaderActions
        isSimulating={isSimulating}
        lastSavedAt={lastSavedAt}
        onResetPrompt={onResetPrompt}
        returnToTitle={returnToTitle}
      />
    </header>
  );
}
