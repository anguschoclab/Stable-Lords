/**
 * Stable Lords — Equipment Loadout UI
 * Slot-based equipment selection with style restrictions, encumbrance tracking,
 * and canonical weapon requirement checks with visible penalty warnings.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Swords, HardHat, Shirt, XCircle } from 'lucide-react';
import { FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/game';
import {
  type EquipmentLoadout as Loadout,
  type EquipmentSlot,
  getItemById,
  getLoadoutWeight,
  isOverEncumbered,
  validateLoadout,
} from '@/data/equipment';
import { SlotSelector, EncumbranceBar } from './equipment';

interface Props {
  loadout: Loadout;
  style: FightingStyle;
  carryCap: number;
  /** Warrior attributes for weapon requirement checks */
  warriorAttrs?: { ST: number; SZ: number; WT: number; DF: number };
  onChange: (loadout: Loadout) => void;
}

const SLOT_CONFIG: { slot: EquipmentSlot; label: string; icon: React.ReactNode }[] = [
  { slot: 'weapon', label: 'Weapon', icon: <Swords className="h-4 w-4" /> },
  { slot: 'armor', label: 'Armor', icon: <Shirt className="h-4 w-4" /> },
  { slot: 'shield', label: 'Shield', icon: <Shield className="h-4 w-4" /> },
  { slot: 'helm', label: 'Helm', icon: <HardHat className="h-4 w-4" /> },
];

/**
 *
 */
export default function EquipmentLoadoutUI({
  loadout,
  style,
  carryCap,
  warriorAttrs,
  onChange,
}: Props) {
  const totalWeight = getLoadoutWeight(loadout);
  const overEncumbered = isOverEncumbered(loadout, carryCap);
  const weaponItem = getItemById(loadout.weapon);
  const isTwoHanded = weaponItem?.twoHanded ?? false;
  const loadoutIssues = validateLoadout(loadout);

  const handleSlotChange = (slot: EquipmentSlot, id: string) => {
    const next = { ...loadout, [slot]: id };
    if (slot === 'weapon') {
      const item = getItemById(id);
      if (item?.twoHanded) {
        next.shield = 'none_shield';
      }
    }
    onChange(next);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Equipment Loadout
          </CardTitle>
          <div className="flex items-center gap-2">
            {warriorAttrs && (
              <Badge variant="outline" className="text-[10px] font-mono">
                ST{warriorAttrs.ST} SZ{warriorAttrs.SZ} WT{warriorAttrs.WT} DF{warriorAttrs.DF}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {STYLE_DISPLAY_NAMES[style]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Hard-block loadout validation — surfaces illegal combos (e.g. two-handed + shield). */}
        {loadoutIssues.length > 0 && (
          <div className="space-y-1.5">
            {loadoutIssues.map((issue) => (
              <div
                key={issue.code}
                className="flex items-start gap-2 p-2 border border-destructive/40 bg-destructive/10 rounded-none text-destructive"
              >
                <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="text-xs font-semibold">{issue.message}</span>
              </div>
            ))}
          </div>
        )}

        <EncumbranceBar
          totalWeight={totalWeight}
          carryCap={carryCap}
          overEncumbered={overEncumbered}
        />

        {/* Slots */}
        <div className="grid gap-4 sm:grid-cols-2">
          {SLOT_CONFIG.map(({ slot, label, icon }) => (
            <SlotSelector
              key={slot}
              slot={slot}
              label={label}
              icon={icon}
              selectedId={loadout[slot]}
              style={style}
              disabled={slot === 'shield' && isTwoHanded}
              warriorAttrs={warriorAttrs}
              onChange={(id) => handleSlotChange(slot, id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
