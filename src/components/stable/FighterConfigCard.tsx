import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FightingStyle, STYLE_DISPLAY_NAMES, STYLE_ABBREV } from '@/types/game';

export interface FighterStats {
  strength: number;
  quickness: number;
  vitality: number;
}

interface FighterConfigCardProps {
  label: string;
  style: FightingStyle;
  setStyle: (s: FightingStyle) => void;
  stats: FighterStats;
  setStats: (s: FighterStats) => void;
}

export function FighterConfigCard({
  label,
  style,
  setStyle,
  stats,
  setStats,
}: FighterConfigCardProps) {
  return (
    <Card>
      <CardHeader className="pb-4 border-b border-border">
        <CardTitle className="font-display text-lg flex items-center justify-between">
          {label}
          <Select value={style} onValueChange={(v) => setStyle(v as FightingStyle)}>
            <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STYLE_DISPLAY_NAMES).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v} ({STYLE_ABBREV[k as FightingStyle]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="space-y-1.5">
            <div className="flex justify-between">
              <Label className="capitalize text-xs text-muted-foreground">{key}</Label>
              <span className="text-xs font-mono">{value}</span>
            </div>
            <Slider
              value={[value]}
              min={1}
              max={30}
              step={1}
              onValueChange={([v]) => setStats({ ...stats, [key]: v })}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
