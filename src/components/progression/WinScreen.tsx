import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { motion } from 'framer-motion';
import { Crown, Trophy, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WinScreen() {
  const { progression, fame, roster, acknowledgeWin, doReset } = useGameStore(
    useShallow((s) => ({
      progression: s.progression,
      fame: s.fame,
      roster: s.roster,
      acknowledgeWin: s.acknowledgeWin,
      doReset: s.doReset,
    }))
  );

  if (!progression || progression.status !== 'won' || progression.acknowledgedWin) {
    return null;
  }

  const completedObjectives = progression.objectives.filter((o) => o.completed);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#0a0a0b] border-2 border-arena-gold/30 rounded-none shadow-[0_0_50px_rgba(212,175,55,0.2)] overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-arena-gold to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-arena-gold to-transparent" />

        <div className="p-8 space-y-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <Crown className="h-12 w-12 text-arena-gold" />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-arena-gold/60">
                Championship
              </span>
              <h1 className="font-display font-black text-4xl tracking-tight text-arena-gold">
                Realm Champion
              </h1>
              <span className="text-sm text-muted-foreground/60">
                Year {progression.wonYear} · Week {progression.wonWeek}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
              Objectives Completed
            </span>
            {completedObjectives.map((obj) => (
              <div
                key={obj.id}
                className="flex items-center gap-3 px-4 py-2 border-l-2 border-arena-gold/40 bg-arena-gold/5"
              >
                <Check className="h-4 w-4 text-arena-gold shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-arena-gold">{obj.label}</span>
                  <span className="text-[10px] text-muted-foreground/50">{obj.description}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/5">
            <div className="flex flex-col items-center gap-1">
              <Trophy className="h-4 w-4 text-arena-fame" />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                Fame
              </span>
              <span className="font-display font-black text-xl text-foreground">{fame}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Crown className="h-4 w-4 text-arena-fame" />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                Warriors
              </span>
              <span className="font-display font-black text-xl text-foreground">
                {roster.length}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Trophy className="h-4 w-4 text-arena-fame" />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                Standing
              </span>
              <span className="font-display font-black text-xl text-arena-gold">#1</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={acknowledgeWin}
              className={cn(
                'flex-1 px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em]',
                'bg-primary text-primary-foreground hover:bg-primary/90',
                'transition-colors duration-300'
              )}
            >
              Continue Legacy
            </button>
            <button
              onClick={doReset}
              className={cn(
                'flex items-center justify-center gap-2 px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em]',
                'border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20',
                'transition-colors duration-300'
              )}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New Game
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
