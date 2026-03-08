/**
 * Stable Lords — Equipment Loadout UI
 * Slot-based equipment selection with style restrictions and encumbrance tracking.
 */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Shield, Swords, HardHat, Shirt, AlertTriangle, Star } from "lucide-react";
import { FightingStyle, STYLE_DISPLAY_NAMES } from "@/types/game";
import {
  type EquipmentLoadout as Loadout,
  type EquipmentSlot,
  type EquipmentItem,
  getAvailableItems,
  getItemById,
  getLoadoutWeight,
  isPreferredWeapon,
  isOverEncumbered,
} from "@/data/equipment";

interface Props {
  loadout: Loadout;
  style: FightingStyle;
  carryCap: number;
  onChange: (loadout: Loadout) => void;
}

const SLOT_CONFIG: { slot: EquipmentSlot; label: string; icon: React.ReactNode }[] = [
  { slot: "weapon", label: "Weapon", icon: <Swords className="h-4 w-4" /> },
  { slot: "armor",  label: "Armor",  icon: <Shirt className="h-4 w-4" /> },
  { slot: "shield", label: "Shield", icon: <Shield className="h-4 w-4" /> },
  { slot: "helm",   label: "Helm",   icon: <HardHat className="h-4 w-4" /> },
];

function SlotSelector({
  slot,
  label,
  icon,
  selectedId,
  style,
  disabled,
  onChange,
}: {
  slot: EquipmentSlot;
  label: string;
  icon: React.ReactNode;
  selectedId: string;
  style: FightingStyle;
  disabled: boolean;
  onChange: (id: string) => void;
}) {
  const items = getAvailableItems(slot, style);
  const selected = getItemById(selectedId);
  const isPreferred = selected && slot === "weapon" && isPreferredWeapon(selected, style);

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
        {isPreferred && (
          <Star className="h-3.5 w-3.5 text-arena-gold fill-arena-gold" />
        )}
      </div>
      <Select value={selectedId} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => {
            const preferred = slot === "weapon" && isPreferredWeapon(item, style);
            return (
              <SelectItem key={item.id} value={item.id}>
                <div className="flex items-center gap-2">
                  <span>{item.name}</span>
                  {item.twoHanded && (
                    <Badge variant="secondary" className="text-[10px] py-0 px-1">2H</Badge>
                  )}
                  {preferred && (
                    <Star className="h-3 w-3 text-arena-gold fill-arena-gold" />
                  )}
                  <span className="text-muted-foreground text-xs ml-auto">wt {item.weight}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {selected && (
        <p className="text-xs text-muted-foreground pl-6">{selected.description}</p>
      )}
      {disabled && (
        <p className="text-xs text-destructive pl-6">Blocked — two-handed weapon equipped</p>
      )}
    </div>
  );
}

export default function EquipmentLoadoutUI({ loadout, style, carryCap, onChange }: Props) {
  const totalWeight = getLoadoutWeight(loadout);
  const overEncumbered = isOverEncumbered(loadout, carryCap);
  const weaponItem = getItemById(loadout.weapon);
  const isTwoHanded = weaponItem?.twoHanded ?? false;

  const handleSlotChange = (slot: EquipmentSlot, id: string) => {
    const next = { ...loadout, [slot]: id };
    // If selecting a two-handed weapon, clear shield
    if (slot === "weapon") {
      const item = getItemById(id);
      if (item?.twoHanded) {
        next.shield = "none_shield";
      }
    }
    onChange(next);
  };

  const encPct = Math.min(100, (totalWeight / Math.max(1, carryCap)) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Equipment Loadout
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {STYLE_DISPLAY_NAMES[style]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Encumbrance bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Encumbrance</span>
            <span className={`font-mono font-semibold ${overEncumbered ? "text-destructive" : ""}`}>
              {totalWeight} / {carryCap}
            </span>
          </div>
          <Progress
            value={encPct}
            className={`h-2.5 ${overEncumbered ? "[&>div]:bg-destructive" : ""}`}
          />
          {overEncumbered && (
            <div className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              Over-encumbered! Speed and initiative will be penalized.
            </div>
          )}
        </div>

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
              disabled={slot === "shield" && isTwoHanded}
              onChange={(id) => handleSlotChange(slot, id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
