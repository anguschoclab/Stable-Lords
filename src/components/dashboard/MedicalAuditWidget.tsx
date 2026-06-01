import { HeartPulse, Activity, ShieldAlert } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAtRiskWarriors } from '@/hooks/useAtRiskWarriors';
import { WarriorAuditCard } from './WarriorAuditCard';

export function MedicalAuditWidget() {
  const atRisk = useAtRiskWarriors();

  const criticalCount = atRisk.filter((w) => (w.fatigue ?? 0) > 85 || w.injuries.length > 1).length;

  return (
    <Surface
      variant="glass"
      padding="none"
      className="h-full border-border/10 group overflow-hidden relative flex flex-col shadow-2xl"
    >
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <HeartPulse className="h-48 w-48 text-destructive" />
      </div>

      <div className="p-6 border-b border-white/5 bg-neutral-900/40 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-none bg-destructive/10 border border-destructive/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] group-hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all">
            <ShieldAlert
              className={cn('h-5 w-5 text-destructive', criticalCount > 0 && 'animate-pulse')}
            />
          </div>
          <div>
            <h3 className="font-display text-base font-black uppercase tracking-tight">
              Biological Audit
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
              Nodal Integrity Monitor
            </p>
          </div>
        </div>
        {criticalCount > 0 && (
          <Badge
            variant="destructive"
            className="text-[8px] font-mono font-black h-5 px-2 animate-bounce"
          >
            CRITICAL
          </Badge>
        )}
      </div>

      <div className="p-6 flex-1 relative z-10 custom-scrollbar overflow-y-auto max-h-96">
        {atRisk.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 opacity-20 group-hover:opacity-30 transition-opacity">
            <Activity className="h-12 w-12 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center italic">
              Roster Integrity Nominal
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {atRisk.map((w) => (
              <WarriorAuditCard key={w.id} warrior={w} />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-black/40 flex justify-center relative z-10 mt-auto">
        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-40 flex items-center gap-2">
          Stable Biometrics Active <Activity className="h-3 w-3 text-destructive" />
        </div>
      </div>
    </Surface>
  );
}
