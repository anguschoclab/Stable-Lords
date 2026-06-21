import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkillBar } from '@/components/warrior/WarriorStats';

interface SkillsPreviewProps {
  baseSkills: Record<string, number> | object;
}

/**
 *
 */
export function SkillsPreview({ baseSkills }: SkillsPreviewProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg">Base Skills Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(baseSkills).map(([key, val]) => (
          <SkillBar key={key} label={key} value={val as number} max={20} />
        ))}
      </CardContent>
    </Card>
  );
}
