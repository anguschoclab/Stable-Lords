import React from 'react';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Award } from 'lucide-react';
import type { Trainer } from '@/types/shared.types';

interface LegacyMentorsTabProps {
  currentTrainers: Trainer[];
}

export function LegacyMentorsTab({ currentTrainers }: LegacyMentorsTabProps) {
  const ranked = [...currentTrainers]
    .map((t) => ({
      t,
      score: (t.legacyWins ?? 0) * 2 + (t.legacyKills ?? 0) * 3 + (t.fame ?? 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (ranked.length === 0) {
    return (
      <Surface
        variant="glass"
        className="py-32 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
      >
        <ImperialRing size="lg" variant="bronze" className="opacity-20">
          <Award className="h-8 w-8" />
        </ImperialRing>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
          No mentor legacy recorded yet.
        </p>
      </Surface>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionDivider label="Legacy Mentors" variant="gold" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ranked.map(({ t, score }, i) => (
          <Surface
            key={t.id}
            variant="glass"
            className="p-6 border-white/5 flex items-center justify-between group hover:bg-white/[0.03] transition-all"
          >
            <div className="flex items-center gap-6">
              <span className="text-3xl font-display font-black text-arena-gold/30 group-hover:text-arena-gold transition-colors w-8 text-center">
                {i + 1}
              </span>
              <div className="flex flex-col">
                <span className="text-[12px] font-black uppercase tracking-tight text-foreground">
                  {t.name}
                </span>
                <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">
                  {t.tier} · {t.focus} SPECIALIST
                </span>
              </div>
            </div>
            <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest">
              <div className="flex flex-col items-center">
                <span className="text-muted-foreground/30 text-[8px] mb-1">Wins</span>
                <span className="text-primary">{t.legacyWins ?? 0}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-muted-foreground/30 text-[8px] mb-1">Kills</span>
                <span className="text-destructive">{t.legacyKills ?? 0}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-muted-foreground/30 text-[8px] mb-1">Score</span>
                <span className="text-arena-gold">{score}</span>
              </div>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}
