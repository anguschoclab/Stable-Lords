import { describe, it, expect } from 'vitest';
// @ts-expect-error — .mjs scanner has no types
import { collectParamCounts } from '../../../scripts/param-count.mjs';

/**
 * Max-params budget — megaplan ratchet guard.
 *
 * External audit rule: no function may take >5 parameters, where a destructured
 * props object counts its binding elements. The ceiling starts at post-baseline
 * reality and ratchets DOWN per batch — never up. Final target: 0.
 * (fileBudget.test.ts precedent: ceilings only ever tighten.)
 */
const PARAM_VIOLATION_CEILING = 242;

interface ParamViolation {
  file: string;
  name: string;
  line: number;
  destructured: number;
  plainParams: number;
}

describe('megaplan: max-params budget', () => {
  const { violations } = collectParamCounts() as { violations: ParamViolation[] };

  it(`no function exceeds the param budget (ceiling ratcheted ${PARAM_VIOLATION_CEILING} → 0)`, () => {
    expect(
      violations.length,
      `${violations.length} functions exceed the 5-param budget — bundle into options objects, then ratchet the ceiling down:\n${violations
        .map(
          (v) =>
            `  ${v.file}:${v.line} ${v.name} (${v.destructured} destructured / ${v.plainParams} plain)`
        )
        .join('\n')}`
    ).toBeLessThanOrEqual(PARAM_VIOLATION_CEILING);
  });
});
