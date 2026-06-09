import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Star } from 'lucide-react';
import {
  type EquipmentSlot,
  getAvailableItems,
  getItemById,
  isPreferredWeapon,
  checkWeaponRequirements,
  type WeaponReqResult,
} from '@/data/equipment';
import { FightingStyle } from '@/types/game';
import { WeaponRequirementBadge } from './WeaponRequirementBadge';
import { WeaponRequirementDetails } from './WeaponRequirementDetails';
import { WeaponGroupHeader } from './WeaponGroupHeader';
import { WeaponSelectItem } from './WeaponSelectItem';

interface SlotSelectorProps {
  slot: EquipmentSlot;
  label: string;
  icon: ReactNode;
  selectedId: string;
  style: FightingStyle;
  disabled: boolean;
  warriorAttrs?: { ST: number; SZ: number; WT: number; DF: number };
  onChange: (id: string) => void;
}

function groupWeaponsByStatus(
  items: ReturnType<typeof getAvailableItems>,
  style: FightingStyle,
  warriorAttrs: { ST: number; SZ: number; WT: number; DF: number }
) {
  const annotated = items.map((item) => {
    const preferred = isPreferredWeapon(item, style);
    const req = checkWeaponRequirements(item.id, warriorAttrs);
    return { item, preferred, req };
  });

  return annotated.reduce(
    (acc, a) => {
      if (a.preferred && a.req.met) acc.classReady.push(a);
      if (!a.preferred && a.req.met) acc.offClassReady.push(a);
      if (a.preferred && !a.req.met) acc.classUnmet.push(a);
      return acc;
    },
    {
      classReady: [] as typeof annotated,
      offClassReady: [] as typeof annotated,
      classUnmet: [] as typeof annotated,
    }
  );
}

/**
 *
 */
export function SlotSelector({
  slot,
  label,
  icon,
  selectedId,
  style,
  disabled,
  warriorAttrs,
  onChange,
}: SlotSelectorProps) {
  const items = getAvailableItems(slot, style);
  const selected = getItemById(selectedId);
  const isPreferred = selected && slot === 'weapon' && isPreferredWeapon(selected, style);
  const reqResult: WeaponReqResult | null =
    slot === 'weapon' && warriorAttrs ? checkWeaponRequirements(selectedId, warriorAttrs) : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
        {selected && selected.weight > 0 && (
          <Badge variant="outline" className="text-xs ml-auto font-mono">
            {selected.weight} enc
          </Badge>
        )}
        {isPreferred && <Star className="h-3.5 w-3.5 text-arena-gold fill-arena-gold" />}
      </div>
      <Select value={selectedId} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(() => {
            if (slot !== 'weapon' || !warriorAttrs) {
              return items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <span>{item.name}</span>
                </SelectItem>
              ));
            }

            const { classReady, offClassReady, classUnmet } = groupWeaponsByStatus(
              items,
              style,
              warriorAttrs
            );

            return (
              <>
                {classReady.length > 0 && (
                  <>
                    <WeaponGroupHeader type="class" />
                    {classReady.map(({ item, preferred, req }) => (
                      <WeaponSelectItem key={item.id} item={item} preferred={preferred} req={req} />
                    ))}
                  </>
                )}
                {offClassReady.length > 0 && (
                  <>
                    <WeaponGroupHeader type="available" />
                    {offClassReady.map(({ item, preferred, req }) => (
                      <WeaponSelectItem key={item.id} item={item} preferred={preferred} req={req} />
                    ))}
                  </>
                )}
                {classUnmet.length > 0 && (
                  <>
                    <WeaponGroupHeader type="unmet" />
                    {classUnmet.map(({ item, preferred, req }) => (
                      <WeaponSelectItem key={item.id} item={item} preferred={preferred} req={req} />
                    ))}
                  </>
                )}
              </>
            );
          })()}
        </SelectContent>
      </Select>
      {selected && <p className="text-xs text-muted-foreground pl-6">{selected.description}</p>}
      {reqResult && (
        <div className="pl-6">
          <WeaponRequirementBadge reqResult={reqResult} />
        </div>
      )}
      {reqResult && !reqResult.met && <WeaponRequirementDetails reqResult={reqResult} />}
      {disabled && (
        <p className="text-xs text-destructive pl-6">Blocked — two-handed weapon equipped</p>
      )}
    </div>
  );
}
