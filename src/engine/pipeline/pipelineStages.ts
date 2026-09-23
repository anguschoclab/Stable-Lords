import type { GameState } from '@/types/state.types';
import type { StateImpact } from '@/engine/impacts';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

/**
 * Stable Lords — Weekly Pipeline Stage Declarations
 *
 * Every pass declares the StateImpact keys it writes and optional ordering
 * constraints (`after`). Passes within a resolution stage all read the same
 * snapshot; their impacts merge in declaration order. Stages resolve
 * sequentially: 'core' → 'world' → 'content'.
 *
 * The validator enforces:
 *  - `after` constraints are respected by declaration order
 *    (guards the RecruitmentPass→RivalStrategyPass class of regressions —
 *    the draft pool must be refilled before the AI draft drains it).
 *  - No two passes in the same stage write the same `replace`-strategy key:
 *    same-snapshot replace writes silently clobber the earlier pass
 *    (real bug caught in review: ProgressionPass and NarrativePass both wrote
 *    `gazettes` in one group — Narrative's full-array replace dropped the
 *    progression gazette. Splitting content into its own stage fixed it).
 *
 * `append`/`accumulate`/`mapMerge`/`dictMerge` collisions are legal — merges
 * are deterministic in declaration order and disjoint-key safe.
 */

export type WeekStage = 'core' | 'world' | 'content';

export interface WeekPassSpec {
  id: string;
  stage: WeekStage;
  run: (state: GameState, ctx: WeekPipelineContext) => StateImpact;
  /** StateImpact keys this pass may write. */
  writes: (keyof StateImpact)[];
  /** Pass ids that must resolve in an earlier-or-equal position. */
  after?: string[];
  /** Player-facing content — skipped when headless or playerStopped. */
  playerFacing?: boolean;
}

export interface WeekPipelineContext {
  currentWeek: number;
  nextWeek: number;
  nextYear: number;
  rootRng: IRNGService;
  /** Suppresses UI-facing output inside passes that read it (rival strategy newsletters). */
  headless?: boolean;
}

/** 'replace'-strategy keys — destructive under same-snapshot writes. */
const EXCLUSIVE_STRATEGY_KEYS: ReadonlySet<keyof StateImpact> = new Set([
  'matchHistory',
  'seasonalGrowth',
  'tournaments',
  'recruitPool',
  'realmRankings',
  'promoters',
  'trainers',
  'hiringPool',
  'gazettes',
  'ownerGrudges',
  'rivalries',
  'trainingAssignments',
  'lastSimulationReport',
  'isTournamentWeek',
  'activeTournamentId',
  'day',
  'week',
  'season',
  'weather',
  'crowdMood',
  'progression',
]);

const STAGE_ORDER: Record<WeekStage, number> = { core: 0, world: 1, content: 2 };

export interface PipelineValidationIssue {
  kind: 'exclusive-write-collision' | 'ordering' | 'unknown-after';
  message: string;
  passIds: string[];
}

/**
 * Validates a declared pass table. Returns issues; an empty array means the
 * pipeline is legal. Intended for a boot-time assert and unit tests.
 */
export function validatePipelinePasses(specs: WeekPassSpec[]): PipelineValidationIssue[] {
  const issues: PipelineValidationIssue[] = [];
  const indexById = new Map<string, number>();
  specs.forEach((s, i) => indexById.set(s.id, i));

  // Exclusive write collisions within a resolution stage.
  const writersByStage = new Map<WeekStage, Map<keyof StateImpact, string[]>>();
  for (const spec of specs) {
    let byKey = writersByStage.get(spec.stage);
    if (!byKey) writersByStage.set(spec.stage, (byKey = new Map()));
    for (const key of spec.writes) {
      if (!EXCLUSIVE_STRATEGY_KEYS.has(key)) continue;
      const list = byKey.get(key) ?? [];
      list.push(spec.id);
      byKey.set(key, list);
    }
  }
  for (const [stage, byKey] of writersByStage) {
    for (const [key, ids] of byKey) {
      if (ids.length > 1) {
        issues.push({
          kind: 'exclusive-write-collision',
          message: `Stage '${stage}': passes [${ids.join(', ')}] all write '${key}' — same-snapshot replace writes clobber each other`,
          passIds: ids,
        });
      }
    }
  }

  // Ordering constraints.
  for (const spec of specs) {
    for (const dep of spec.after ?? []) {
      const depIdx = indexById.get(dep);
      const specIdx = indexById.get(spec.id)!;
      if (depIdx === undefined) {
        issues.push({
          kind: 'unknown-after',
          message: `Pass '${spec.id}' declares after='${dep}' which is not a registered pass`,
          passIds: [spec.id],
        });
        continue;
      }
      const depStage = STAGE_ORDER[specs[depIdx]!.stage];
      const specStage = STAGE_ORDER[spec.stage];
      const violated = depStage > specStage || (depStage === specStage && depIdx >= specIdx);
      if (violated) {
        issues.push({
          kind: 'ordering',
          message: `Pass '${spec.id}' must run after '${dep}' but is declared earlier in the same resolution stage`,
          passIds: [dep, spec.id],
        });
      }
    }
  }

  return issues;
}
