import { Target, Swords } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import type { ScoutReportData, ScoutQuality } from '@/types/game';
import { STYLE_DISPLAY_NAMES } from '@/types/game';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { NoReportState } from './components/NoReportState';
import { ReportHeader } from './components/ReportHeader';
import { AttributeMatrix } from './components/AttributeMatrix';
import { CombatAnalysis } from './components/CombatAnalysis';
import { ReportNotes } from './components/ReportNotes';
import { UpgradeButton } from './components/UpgradeButton';

interface ScoutReportDetailsProps {
  report: ScoutReportData | null;
  warriorName: string;
  treasury: number;
  onScout: (quality: ScoutQuality) => void;
} /**
   * Scout report details.
   * @param  - {
  report,
  warrior name,
  treasury,
  on scout,
}.
   */

/**
 * Scout report details.
 * @param  - {
  report,
  warrior name,
  treasury,
  on scout,
}.
 */
export function ScoutReportDetails({
  report,
  warriorName,
  treasury,
  onScout,
}: ScoutReportDetailsProps) {
  if (!report) {
    return <NoReportState warriorName={warriorName} treasury={treasury} onScout={onScout} />;
  }

  return (
    <Surface
      variant="glass"
      padding="none"
      className="border-primary/40 shadow-[0_0_40px_rgba(var(--primary-rgb),0.15)] overflow-hidden relative"
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />

      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <ReportHeader report={report} />
        <BookmarkButton entityType="scoutReport" entityId={report.id} size="sm" />
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 opacity-40 group">
              <Target className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground leading-none">
                Combat Style
              </span>
            </div>
            <div className="text-sm font-black uppercase tracking-widest text-foreground ml-5 border-l-2 border-primary/20 pl-3">
              {STYLE_DISPLAY_NAMES[report.style as keyof typeof STYLE_DISPLAY_NAMES] ??
                report.style}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 opacity-40">
              <Swords className="h-3 w-3 text-secondary" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground leading-none">
                Historical Loadout
              </span>
            </div>
            <div className="text-sm font-mono font-black text-foreground ml-5 border-l-2 border-secondary/20 pl-3">
              {report.record}
            </div>
          </div>
        </div>

        <AttributeMatrix attributeRanges={report.attributeRanges} />

        <CombatAnalysis
          suspectedOE={report.suspectedOE}
          suspectedAL={report.suspectedAL}
          knownInjuries={report.knownInjuries}
        />

        <ReportNotes notes={report.notes} />

        <UpgradeButton
          currentQuality={report.quality}
          onUpgrade={() => onScout(report.quality === 'Basic' ? 'Detailed' : 'Expert')}
        />
      </div>
    </Surface>
  );
}
