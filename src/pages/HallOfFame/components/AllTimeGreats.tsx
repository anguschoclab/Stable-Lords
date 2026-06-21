import { Card, CardContent } from '@/components/ui/card';
import { Crown, Star, Flame } from 'lucide-react';
import { InducteeCard } from '../InducteeCard';
import type { Warrior } from '@/types/game';

interface AllTimeGreatsProps {
  warriors: Warrior[];
  fights: Parameters<typeof InducteeCard>[0]['fights'];
}

/**
 *
 */
export function AllTimeGreats({ warriors, fights }: AllTimeGreatsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-end gap-3 border-b-2 border-accent/30 pb-2">
        <h2 className="font-display text-xl text-foreground leading-none flex items-center gap-2">
          <Flame className="h-5 w-5 text-arena-gold" /> All-Time Greats
        </h2>
        <span className="text-[10px] text-muted-foreground font-mono mb-0.5 uppercase">
          First Annual Inductions at Week 52
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {warriors.length > 0 ? (
          warriors.map((w, i) => (
            <InducteeCard
              key={w.id}
              warrior={w}
              title={i === 0 ? 'RANK #1' : `RANK #${i + 1}`}
              icon={
                i === 0 ? (
                  <Crown className="h-4 w-4 text-arena-gold" />
                ) : (
                  <Star className="h-4 w-4 text-muted-foreground" />
                )
              }
              fights={fights}
            />
          ))
        ) : (
          <Card className="border-dashed col-span-full">
            <CardContent className="py-12 text-center">
              <Crown className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground text-sm uppercase font-black tracking-widest">
                Awaiting First Legends...
              </p>
              <p className="text-muted-foreground text-[10px] mt-1">
                The sands remember no one yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
