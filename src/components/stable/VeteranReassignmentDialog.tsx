import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatBadge } from '@/components/ui/WarriorBadges';
import { GraduationCap } from 'lucide-react';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { convertRetiredToTrainer } from '@/engine/trainers';
import type { Warrior } from '@/types/warrior.types';
import type { FightingStyle } from '@/types/shared.types';

interface VeteranReassignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  convertableRetired: Warrior[];
  onConvert: (warriorId: string) => void;
}

/**
 *
 */
export function VeteranReassignmentDialog({
  open,
  onOpenChange,
  convertableRetired,
  onConvert,
}: VeteranReassignmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-950/95 backdrop-blur-2xl border-white/10 sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0 rounded-none">
        <DialogTitle className="sr-only">Veteran Reassignment</DialogTitle>
        <DialogDescription className="sr-only">Assign veterans as staff</DialogDescription>
        <div className="p-10 border-b border-white/5 bg-primary/5">
          <h3 className="font-display text-3xl font-black uppercase tracking-tight flex items-center gap-6">
            <ImperialRing size="lg" variant="blood">
              <GraduationCap className="h-8 w-8 text-primary" />
            </ImperialRing>
            Veteran Reassignment
          </h3>
        </div>

        <div className="p-10 space-y-6 overflow-y-auto no-scrollbar">
          {convertableRetired.map((w) => {
            const preview = convertRetiredToTrainer(w);
            return (
              <div
                key={w.id}
                className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-black uppercase tracking-tight">{w.name}</span>
                    <StatBadge styleName={w.style as FightingStyle} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest rounded-none">
                      {preview.tier} Staff
                    </Badge>
                    <span className="text-[10px] text-muted-foreground/80 uppercase tracking-widest italic">
                      Specialization: {preview.focus}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => onConvert(w.id)}
                  className="h-10 px-6 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-none"
                >
                  Establish Staff
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
