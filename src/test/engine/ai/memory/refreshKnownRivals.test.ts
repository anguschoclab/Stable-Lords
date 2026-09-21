/**
 * Stage B.0 — refreshKnownRivals: knownRivals is set once at init and never
 * updated (G3). The world churns — expansions add stables, bankruptcy/retirement
 * removes them — memory must track it.
 */
import { describe, it, expect } from 'vitest';
import { refreshKnownRivals } from '@/engine/ai/memory/intelDossier';
import { makeRival, makeOwner, makeGameState } from '@/test/_fixtures/factories';

describe('refreshKnownRivals', () => {
  it('adds newly founded rivals to memory', () => {
    const self = makeRival({ owner: makeOwner({ id: 'own-self' as never }) });
    const established = makeRival({ owner: makeOwner({ id: 'own-old' as never }) });
    const newcomer = makeRival({ owner: makeOwner({ id: 'own-new' as never }) });
    const state = makeGameState({ rivals: [self, established, newcomer] });

    const out = refreshKnownRivals(self, state);
    expect(out).toContain('own-new');
    expect(out).toContain('own-old');
  });

  it('drops rivals that no longer exist', () => {
    const self = makeRival({ owner: makeOwner({ id: 'own-self' as never }) });
    const survivor = makeRival({ owner: makeOwner({ id: 'own-surv' as never }) });
    const state = makeGameState({ rivals: [self, survivor] });

    const out = refreshKnownRivals(self, state);
    expect(out).toEqual(['own-surv']);
  });

  it('never lists the stable itself', () => {
    const self = makeRival({ owner: makeOwner({ id: 'own-self' as never }) });
    const other = makeRival({ owner: makeOwner({ id: 'own-other' as never }) });
    const state = makeGameState({ rivals: [self, other] });
    expect(refreshKnownRivals(self, state)).not.toContain('own-self');
  });

  it('is stable across repeated calls', () => {
    const self = makeRival({ owner: makeOwner({ id: 'own-self' as never }) });
    const a = makeRival({ owner: makeOwner({ id: 'own-a' as never }) });
    const state = makeGameState({ rivals: [self, a] });
    expect(refreshKnownRivals(self, state)).toEqual(refreshKnownRivals(self, state));
  });
});
