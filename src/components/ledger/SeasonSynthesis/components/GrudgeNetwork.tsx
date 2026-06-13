import { Surface } from '@/components/ui/Surface';
import { Flame } from 'lucide-react';
import type { OwnerGrudge } from '@/types/state.types';

interface GrudgeNetworkProps {
  grudges: OwnerGrudge[];
  rivalMap: Map<string, string>;
}

export function GrudgeNetwork({ grudges, rivalMap }: GrudgeNetworkProps) {
  return (
    <Surface variant="glass" padding="none" className="border-arena-blood/20 overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-arena-blood/5 flex items-center gap-3">
        <div className="p-1.5 rounded-none bg-arena-blood/10 border border-arena-blood/20">
          <Flame className="h-3.5 w-3.5 text-arena-blood" />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-arena-blood">
          Grudge Network
        </h3>
        <span className="ml-auto text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
          {grudges.length} active
        </span>
      </div>
      <div className="p-4 space-y-2">
        {grudges.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/40 italic py-4 text-center uppercase tracking-widest">
            No active grudges
          </p>
        ) : (
          grudges.map((g) => {
            const stableA = rivalMap.get(g.ownerIdA) ?? g.ownerIdA;
            const stableB = rivalMap.get(g.ownerIdB) ?? g.ownerIdB;
            return (
              <div
                key={`${g.ownerIdA}-${g.ownerIdB}`}
                className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border border-white/5"
              >
                <div className="flex items-center gap-2 text-[10px] font-black min-w-0">
                  <span className="text-foreground/70 truncate">{stableA}</span>
                  <span className="text-muted-foreground/40 shrink-0">vs</span>
                  <span className="text-foreground/70 truncate">{stableB}</span>
                </div>
                <div className="flex items-center gap-0.5 shrink-0 ml-2">
                  {Array.from({ length: g.intensity }).map((_, j) => (
                    <Flame
                      key={j}
                      className="h-2.5 w-2.5 text-arena-blood"
                      style={{ opacity: 0.4 + j * 0.12 }}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Surface>
  );
}
