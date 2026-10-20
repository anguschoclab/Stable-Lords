import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { listTsFiles } from '@/test/_helpers/fsWalk';
import path from 'node:path';

const SRC = path.resolve(__dirname, '../..');
const SCAN_DIRS = ['components', 'pages', 'hooks', 'routes'];



function sourceFiles(): string[] {
  return SCAN_DIRS.flatMap((dir) => listTsFiles(path.join(SRC, dir))).map((file) =>
    path.relative(SRC, file)
  );
}

/**
 * Codex Sanguis legibility contract: decorative label tracking is capped at
 * 0.15em and no page uses viewport-tall empty states that break mobile flow.
 */
describe('Codex Sanguis legibility contract', () => {
  it('caps label tracking at 0.15em across production UI', () => {
    const trackingPattern = /tracking-\[([0-9]+(?:\.[0-9]+)?)em\]/g;
    const offenders = sourceFiles().flatMap((file) => {
      const source = readFileSync(path.join(SRC, file), 'utf8');
      return [...source.matchAll(trackingPattern)]
        .filter((match) => Number(match[1]) > 0.15)
        .map((match) => `${file}: ${match[0]}`);
    });
    expect(offenders).toEqual([]);
  });

  it('does not use py-48 empty-state blocks in production UI', () => {
    const offenders = sourceFiles().filter((file) =>
      readFileSync(path.join(SRC, file), 'utf8').includes('py-48')
    );
    expect(offenders).toEqual([]);
  });

  it('keeps tabular numeric/readout copy upright', () => {
    const offenders = sourceFiles().flatMap((file) => {
      const source = readFileSync(path.join(SRC, file), 'utf8');
      return source
        .split('\n')
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => line.includes('font-mono') && line.includes('italic'))
        .map(({ line, index }) => `${file}:${index + 1}: ${line.trim()}`);
    });
    expect(offenders).toEqual([]);
  });

  it('does not label a historical standings table as live telemetry', () => {
    const offenders = sourceFiles().filter((file) =>
      readFileSync(path.join(SRC, file), 'utf8').includes('LIVE ARENA FEED')
    );
    expect(offenders).toEqual([]);
  });
});
