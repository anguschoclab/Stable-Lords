/**
 * ArenaSettings accessibility tests — verifies label/input associations
 * via source file inspection (avoids complex component rendering).
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const COMPONENT_PATH = path.resolve(__dirname, '../../components/layout/ArenaSettings.tsx');

describe('ArenaSettings accessibility', () => {
  const source = fs.readFileSync(COMPONENT_PATH, 'utf-8');

  it('source file exists and is non-empty', () => {
    expect(source.length).toBeGreaterThan(100);
  });

  it('has at least one Label with htmlFor', () => {
    expect(source).toMatch(/htmlFor=/);
  });

  it('has at least one input with id', () => {
    expect(source).toMatch(/\bid=/);
  });

  it('each htmlFor value has a matching id', () => {
    const htmlForMatches = source.matchAll(/htmlFor="([^"]+)"/g);
    const htmlForValues = [...htmlForMatches].map((m) => m[1]);
    expect(htmlForValues.length).toBeGreaterThan(0);

    for (const htmlFor of htmlForValues) {
      const idRegex = new RegExp(`id="${htmlFor}"`);
      expect(source, `htmlFor="${htmlFor}" has no matching id`).toMatch(idRegex);
    }
  });
});
