import { describe, it, expect } from 'vitest';
import {
  validatePipelinePasses,
  type WeekPassSpec,
} from '@/engine/pipeline/pipelineStages';
import { WEEK_PIPELINE_PASSES } from '@/engine/pipeline/services/weekPipelineService';

function spec(overrides: Partial<WeekPassSpec> & { id: string }): WeekPassSpec {
  return { stage: 'world', run: () => ({}), writes: [], ...overrides };
}

describe('validatePipelinePasses', () => {
  it('accepts the production pipeline table', () => {
    expect(validatePipelinePasses(WEEK_PIPELINE_PASSES)).toEqual([]);
  });

  it('flags two passes writing the same replace-strategy key in one stage', () => {
    const specs = [
      spec({ id: 'a', writes: ['gazettes'] }),
      spec({ id: 'b', writes: ['gazettes'] }),
    ];
    const issues = validatePipelinePasses(specs);
    expect(issues.some((i) => i.kind === 'exclusive-write-collision')).toBe(true);
    expect(issues[0]?.passIds).toEqual(['a', 'b']);
  });

  it('allows disjoint-key writers and mergeable-key collisions', async () => {
    const specs = [
      spec({ id: 'a', writes: ['boutOffers', 'treasuryDelta'] }),
      spec({ id: 'b', writes: ['boutOffers', 'newsletterItems'] }),
    ];
    // boutOffers is dictMerge (disjoint keys merge fine); treasuryDelta is
    // accumulate — neither is exclusive.
    expect(validatePipelinePasses(specs)).toEqual([]);
  });

  it('flags an `after` dependency that is declared later in the same stage', () => {
    const specs = [
      spec({ id: 'consumer', writes: [], after: ['producer'] }),
      spec({ id: 'producer', writes: [] }),
    ];
    const issues = validatePipelinePasses(specs);
    expect(issues.some((i) => i.kind === 'ordering')).toBe(true);
  });

  it('flags `after` dependencies on unknown passes', () => {
    const specs = [spec({ id: 'a', after: ['ghost'] })];
    const issues = validatePipelinePasses(specs);
    expect(issues.some((i) => i.kind === 'unknown-after')).toBe(true);
  });

  it('allows `after` deps satisfied by an earlier stage', () => {
    const specs = [
      spec({ id: 'producer', stage: 'core', writes: ['recruitPool'] }),
      spec({ id: 'consumer', stage: 'world', writes: [], after: ['producer'] }),
    ];
    expect(validatePipelinePasses(specs)).toEqual([]);
  });
});

describe('WEEK_PIPELINE_PASSES declarations', () => {
  it('declares every pass exactly once', () => {
    const ids = WEEK_PIPELINE_PASSES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps RecruitmentPass before RivalStrategyPass (draft-pool ordering)', () => {
    const idx = (id: string) => WEEK_PIPELINE_PASSES.findIndex((p) => p.id === id);
    expect(idx('recruitment')).toBeGreaterThanOrEqual(0);
    expect(idx('rivalStrategy')).toBeGreaterThan(idx('recruitment'));
  });

  it('keeps player-facing passes in the content stage so headless/stop skips only them', () => {
    const contentIds = WEEK_PIPELINE_PASSES.filter((p) => p.stage === 'content').map(
      (p) => p.id
    );
    expect(contentIds).toContain('event');
    expect(contentIds).toContain('narrative');
    const worldIds = WEEK_PIPELINE_PASSES.filter((p) => p.stage === 'world').map(
      (p) => p.id
    );
    // The world must keep evolving when the player is stopped.
    expect(worldIds).toContain('world');
    expect(worldIds).toContain('rivalStrategy');
    expect(worldIds).toContain('rankings');
  });
});
