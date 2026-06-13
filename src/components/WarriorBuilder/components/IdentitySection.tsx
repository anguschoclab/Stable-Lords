import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dices } from 'lucide-react';
import { randomWarriorName } from '@/data/names';
import { FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/game';

interface IdentitySectionProps {
  name: string;
  setName: (n: string) => void;
  style: FightingStyle;
  setStyle: (s: FightingStyle) => void;
}

export function IdentitySection({ name, setName, style, setStyle }: IdentitySectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg">Identity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Warrior Name</Label>
          <div className="flex gap-1.5">
            <Input
              placeholder="Enter name (2+ characters)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              className="font-mono uppercase flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => setName(randomWarriorName())}
              title="Random name"
              aria-label="Randomize warrior name"
              className="shrink-0"
            >
              <Dices className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Fighting Style</Label>
          <Select value={style} onValueChange={(v) => setStyle(v as FightingStyle)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(FightingStyle).map((s) => (
                <SelectItem key={s} value={s}>
                  {STYLE_DISPLAY_NAMES[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
