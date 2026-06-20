import { ChevronRight, Target } from 'lucide-react';
import { Link } from '@tanstack/react-router';

/**
 *
 */
export function IntelligenceHubFooter() {
  return (
    <div className="p-4 border-t border-white/5 bg-black/40 flex items-center justify-between relative z-10 mt-auto gap-4">
      <Link
        to="/world/chronicle"
        className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-colors opacity-40 hover:opacity-100 flex items-center gap-2 group"
      >
        Read All{' '}
        <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
      </Link>
      <Link
        to="/world/scouting"
        title="Scout rivals before booking bouts"
        className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-arena-gold/70 hover:text-arena-gold border border-arena-gold/20 hover:border-arena-gold/50 bg-arena-gold/5 hover:bg-arena-gold/10 px-3 py-1.5 transition-all group"
      >
        <Target className="h-3 w-3 shrink-0" />
        Scout Rivals
        <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
