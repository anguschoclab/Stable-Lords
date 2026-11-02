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
import { STYLE_ARCHETYPE } from '@/engine/factories/statGeneration';
import { FIGHTER_CONCEPTS, type FighterConcept } from '@/data/fighterConcepts';

interface IdentitySectionProps {
  name: string;
  style: FightingStyle;
  personality?: string;
  actions: {
    setName: (n: string) => void;
    setStyle: (s: FightingStyle) => void;
    applyConcept?: (style: FightingStyle, concept: FighterConcept) => void;
  };
}

/** Flat list of every fighter concept: "Style — Concept". */
const CONCEPT_OPTIONS = Object.values(FightingStyle).flatMap((s) =>
  FIGHTER_CONCEPTS[s].concepts.map((concept, index) => ({
    value: `${s}::${index}`,
    label: `${STYLE_DISPLAY_NAMES[s]} — ${concept.name}`,
    style: s,
    concept,
  }))
);

/**
 *
 */
export function IdentitySection({ name, style, personality, actions }: IdentitySectionProps) {
  const { setName, setStyle, applyConcept } = actions;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg">Identity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="warrior-name">Warrior Name</Label>
          <div className="flex gap-1.5">
            <Input
              id="warrior-name"
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
              onClick={() =>
                setName(randomWarriorName({ archetype: STYLE_ARCHETYPE[style], personality }))
              }
              tooltip="Random name"
              aria-label="Randomize warrior name"
              className="shrink-0"
            >
              <Dices className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fighting-style">Fighting Style</Label>
          <Select value={style} onValueChange={(v) => setStyle(v as FightingStyle)}>
            <SelectTrigger id="fighting-style" aria-label="Fighting Style">
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
        {applyConcept && (
          <div className="space-y-1.5">
            <Label htmlFor="fighter-concept">Fighter Concept</Label>
            <Select
              value=""
              onValueChange={(v) => {
                const option = CONCEPT_OPTIONS.find((o) => o.value === v);
                if (option) applyConcept(option.style, option.concept);
              }}
            >
              <SelectTrigger id="fighter-concept" aria-label="Fighter Concept">
                <SelectValue placeholder="Apply a canon build…" />
              </SelectTrigger>
              <SelectContent>
                {CONCEPT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
