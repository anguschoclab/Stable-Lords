import { useSeasonData } from './hooks/useSeasonData';
import { DivisionalStandings } from './components/DivisionalStandings';
import { GrudgeNetwork } from './components/GrudgeNetwork';
import { StyleOfTheSeason } from './components/StyleOfTheSeason';
import { SeasonDeclarations } from './components/SeasonDeclarations';

/**
 *
 */
export function SeasonSynthesis() {
  const { rivals, rivalPerformance, seasonGazette, metaData, grudges, rivalMap, season } =
    useSeasonData();

  if (!rivals?.length) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 px-1">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">
          SEASON SYNTHESIS · {season}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
      </div>

      <DivisionalStandings rivals={rivalPerformance} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <GrudgeNetwork grudges={grudges} rivalMap={rivalMap} />
        <StyleOfTheSeason metaEntries={metaData.metaEntries} topStyle={metaData.topStyle} />
      </div>

      <SeasonDeclarations seasonGazette={seasonGazette} />
    </div>
  );
}
