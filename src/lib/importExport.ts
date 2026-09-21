/**
 * Import/Export packs — serialize the full GameState to JSON or YAML for
 * save transfer / sharing, and parse them back with schema validation.
 */
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { GameState } from '@/types/state.types';
import { GameStateSchema } from '@/schemas/gameStateSchema';
import { stripNonSerializable } from '@/state/serialization';

const PACK_KIND = 'stable-lords-pack';
const PACK_VERSION = 1;

/** A serialized save pack envelope. */
export interface StableLordsPack {
  kind: typeof PACK_KIND;
  version: number;
  exportedAt: string;
  state: GameState;
}

/**
 * Export pack.
 */
export function exportPack(state: GameState, format: 'json' | 'yaml'): string {
  const pack: StableLordsPack = {
    kind: PACK_KIND,
    version: PACK_VERSION,
    exportedAt: new Date().toISOString(),
    state: stripNonSerializable(state) as GameState,
  };
  return format === 'yaml' ? stringifyYaml(pack) : JSON.stringify(pack, null, 2);
}

/**
 * Import pack — parses JSON or YAML, validates the embedded state against
 * GameStateSchema, and returns the normalized pack.
 */
export function importPack(text: string): StableLordsPack {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    try {
      raw = parseYaml(text);
    } catch {
      throw new Error('File is neither valid JSON nor YAML.');
    }
  }
  if (
    typeof raw !== 'object' ||
    raw === null ||
    (raw as Record<string, unknown>).kind !== PACK_KIND
  ) {
    throw new Error('File is not a Stable Lords pack.');
  }
  const pack = raw as StableLordsPack;
  // Throws ZodError on malformed state — caller surfaces the message.
  pack.state = GameStateSchema.parse(pack.state) as GameState;
  return pack;
}
