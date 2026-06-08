import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { SelectItem } from '@/components/ui/select';
import type { WeaponReqResult } from '@/data/equipment';

interface WeaponSelectItemProps {
  item: { id: string; name: string; weight: number; twoHanded?: boolean };
  preferred: boolean;
  req: WeaponReqResult;
}

export function WeaponSelectItem({ item, preferred, req }: WeaponSelectItemProps) {
  return (
    <SelectItem key={item.id} value={item.id}>
      <div className="flex items-center gap-2">
        <span className={!req.met ? 'text-destructive/80' : ''}>{item.name}</span>
        {item.twoHanded && (
          <Badge variant="secondary" className="text-[10px] py-0 px-1">
            2H
          </Badge>
        )}
        {preferred && req.met && <Star className="h-3 w-3 text-arena-gold fill-arena-gold" />}
        {!req.met && (
          <span className="text-muted-foreground text-[9px] font-mono">
            {req.failures.map((f) => `${f.stat}${f.required}`).join('/')}
          </span>
        )}
        <span className="text-muted-foreground text-xs ml-auto">wt {item.weight}</span>
      </div>
    </SelectItem>
  );
}
