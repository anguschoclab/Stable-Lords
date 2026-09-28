import { TrendingUp, X, CheckCircle2, AlertTriangle, Heart, Zap } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { StyleMeterTable } from '@/components/charts/StyleMeterTable';
import { cn } from '@/lib/utils';

/** Classifies a training-report line as a gain, injury, or recovery note. */
function classifyItem(msg: string): 'gain' | 'injury' | 'recovery' {
  const lower = msg.toLowerCase();
  if (lower.includes('injur') || lower.includes('hurt') || lower.includes('strain'))
    return 'injury';
  if (lower.includes('recover') || lower.includes('rest')) return 'recovery';
  return 'gain';
}

/** Weekly training-results banner — dismissible per week. */
export function TrainingReportBanner({
  items,
  onDismiss,
}: {
  items: string[];
  onDismiss: () => void;
}) {
  return (
    <Surface variant="glass" className="border-primary/20 overflow-hidden mb-12">
      <div className="flex items-center justify-between px-5 py-3 bg-primary/5 border-b border-white/5">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          <TrendingUp className="h-3.5 w-3.5" />
          Last Week's Report
        </div>
        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 motion-reduce:transition-none"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {items.map((msg, i) => {
          const kind = classifyItem(msg);
          return (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2 px-3 py-2 text-[10px] uppercase font-black tracking-tight',
                kind === 'gain' && 'bg-primary/5 text-primary border border-primary/10',
                kind === 'injury' &&
                  'bg-arena-gold/5 text-arena-gold border border-arena-gold/10',
                kind === 'recovery' &&
                  'bg-arena-pop/5 text-arena-pop border border-arena-pop/10'
              )}
            >
              {kind === 'gain' ? (
                <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
              ) : kind === 'injury' ? (
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              ) : (
                <Heart className="h-3 w-3 mt-0.5 shrink-0" />
              )}
              <span className="leading-snug">{msg}</span>
            </div>
          );
        })}
      </div>
    </Surface>
  );
}

/** Left rail: style meter table + active-drills / med-bay summary tiles. */
export function TrainingSidebar({
  trainingCount,
  recoveryCount,
}: {
  trainingCount: number;
  recoveryCount: number;
}) {
  return (
    <aside className="lg:col-span-4 space-y-12">
      <section>
        <SectionDivider label="Style Breakdown" />
        <div className="mt-8">
          <StyleMeterTable />
        </div>
      </section>

      <section>
        <SectionDivider label="Summary" />
        <div className="mt-8 grid grid-cols-1 gap-4">
          <Surface variant="glass" className="p-6 border-white/5 bg-white/[0.01]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-primary">
                <Zap className="h-4 w-4" />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  Active Drills
                </span>
              </div>
              <span className="text-2xl font-display font-black">{trainingCount}</span>
            </div>
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
              Training in progress. Higher Wits (WT) increases gain probability.
            </p>
          </Surface>

          <Surface variant="glass" className="p-6 border-white/5 bg-white/[0.01]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-destructive">
                <Heart className="h-4 w-4" />
                <span className="text-[9px] font-black uppercase tracking-widest">Med Bay</span>
              </div>
              <span className="text-2xl font-display font-black">{recoveryCount}</span>
            </div>
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
              Warriors in recovery heal injuries faster than natural rest.
            </p>
          </Surface>
        </div>
      </section>
    </aside>
  );
}
