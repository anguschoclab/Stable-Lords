import { describe, it, expect } from 'vitest';
import { exportPack, importPack } from '@/lib/importExport';
import { makeGameState } from '@/test/_fixtures/factories';
import { GameStateSchema } from '@/schemas/gameStateSchema';

describe('importExport (G2)', () => {
  it('exports a state pack as JSON', () => {
    const s = makeGameState();
    const out = exportPack(s, 'json');
    const parsed = JSON.parse(out);
    expect(parsed.kind).toBe('stable-lords-pack');
    expect(parsed.state.week).toBe(s.week);
  });

  it('exports a state pack as YAML and round-trips', () => {
    const s = makeGameState();
    const out = exportPack(s, 'yaml');
    expect(out).toContain('kind: stable-lords-pack');
    const back = importPack(out);
    expect(() => GameStateSchema.parse(back.state)).not.toThrow();
    expect(back.state.week).toBe(s.week);
  });

  it('imports JSON text identically', () => {
    const s = makeGameState();
    const back = importPack(exportPack(s, 'json'));
    expect(back.state.fame).toBe(s.fame);
  });

  it('rejects non-pack payloads with a clear error', () => {
    expect(() => importPack('{"foo": 1}')).toThrow(/not a Stable Lords pack/i);
    expect(() => importPack('::: not yaml :::')).toThrow();
  });
});
