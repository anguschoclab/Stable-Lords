import { useArenaPreferences, useGameStore } from '@/state/useGameStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Swords, ScrollText, Volume2, Sparkles, Activity } from 'lucide-react'; /**
 * Arena settings.
 */

/**
 * Arena settings.
 */
export default function ArenaSettings() {
  const prefs = useArenaPreferences();
  const setArenaPreferences = useGameStore((s) => s.setArenaPreferences);

  return (
    <Card className="rounded-none border-border/50">
      <CardHeader className="bg-secondary/30">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Swords className="h-5 w-5 text-arena-gold" />
          ARENA_PREFERENCES
        </CardTitle>
        <CardDescription>Configure your combat replay experience</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 py-6">
        {/* Default View Mode */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label
              htmlFor="setting-default-view"
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
            >
              <ScrollText className="h-4 w-4" />
              Default View Mode
            </Label>
            <p className="text-xs text-muted-foreground">
              Choose how bouts are displayed by default
            </p>
          </div>
          <Select
            value={prefs.defaultViewMode}
            onValueChange={(value: 'log' | 'arena') =>
              setArenaPreferences({ defaultViewMode: value })
            }
          >
            <SelectTrigger
              id="setting-default-view"
              aria-label="Default View Mode"
              className="w-40 rounded-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="arena">Arena Replay</SelectItem>
              <SelectItem value="log">Combat Log</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Audio Enabled */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label
              htmlFor="setting-audio-enabled"
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
            >
              <Volume2 className="h-4 w-4" />
              Arena Audio
            </Label>
            <p className="text-xs text-muted-foreground">
              Enable crowd reactions and ambient sounds
            </p>
          </div>
          <Switch
            id="setting-audio-enabled"
            aria-label="Enable Arena Audio"
            checked={prefs.audioEnabled}
            onCheckedChange={(checked) => setArenaPreferences({ audioEnabled: checked })}
          />
        </div>

        {/* Volume Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="setting-audio-volume"
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
            >
              <Volume2 className="h-4 w-4" />
              Crowd Volume
            </Label>
            <span className="text-xs font-mono text-muted-foreground">
              {Math.round(prefs.audioVolume * 100)}%
            </span>
          </div>
          <Slider
            id="setting-audio-volume"
            aria-label="Crowd Volume"
            value={[prefs.audioVolume]}
            min={0}
            max={1}
            step={0.1}
            onValueChange={([value]) => setArenaPreferences({ audioVolume: value })}
            disabled={!prefs.audioEnabled}
          />
        </div>

        {/* Effects Enabled */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label
              htmlFor="setting-effects-enabled"
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
            >
              <Sparkles className="h-4 w-4" />
              Visual Effects
            </Label>
            <p className="text-xs text-muted-foreground">
              Enable particles, weapon trails, and weather
            </p>
          </div>
          <Switch
            id="setting-effects-enabled"
            aria-label="Enable Visual Effects"
            checked={prefs.effectsEnabled}
            onCheckedChange={(checked) => setArenaPreferences({ effectsEnabled: checked })}
          />
        </div>

        {/* Screen Shake Intensity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="setting-screen-shake"
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
            >
              <Activity className="h-4 w-4" />
              Screen Shake
            </Label>
          </div>
          <Select
            value={prefs.screenShakeIntensity}
            onValueChange={(value: 'off' | 'low' | 'medium' | 'high') =>
              setArenaPreferences({ screenShakeIntensity: value })
            }
            disabled={!prefs.effectsEnabled}
          >
            <SelectTrigger
              id="setting-screen-shake"
              aria-label="Screen Shake Intensity"
              className="w-full rounded-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="off">Off</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Intensity of screen shake on critical hits and deaths
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
