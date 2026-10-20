/**
 * Contract tests for `statGrantOutcome` — the shared outcome builder that
 * replaces the per-handler `warriorOutcome({ stat: addStat(...) }, announce)`
 * boilerplate duplicated across offseason handlers.
 *
 * The critical invariant: the announce payload is NEWSLETTER DATA, not a
 * stat mirror. Several handlers announce keys that are absent from (or
 * differ from) the applied updates, so statGrantOutcome must take announce
 * semantics explicitly rather than deriving them from grants.
 */
import { describe, it, expect } from 'vitest';
import { makeWarrior } from '@/test/_fixtures/factories';
import {
  statGrantOutcome,
  type StatGrantOutcomeOpts,
} from '@/engine/pipeline/offseasonEvents/helpers';

const chosen = () =>
  makeWarrior({ id: 'w1' as never, name: 'Test Warrior', xp: 100, fame: 50, fatigue: 20 });

describe('statGrantOutcome', () => {
  it('applies a single stat grant with an empty announce by default', () => {
    expect(statGrantOutcome(chosen(), { xp: 10 })).toEqual({
      updates: { xp: 110 },
      announce: {},
    });
  });

  it('applies combined stat grants including negative deltas', () => {
    expect(statGrantOutcome(chosen(), { xp: 15, fame: -10, fatigue: 20 })).toEqual({
      updates: { xp: 115, fame: 40, fatigue: 40 },
      announce: {},
    });
  });

  it('treats undefined current stats as 0', () => {
    const w = makeWarrior({ id: 'w1' as never, name: 'T', xp: undefined, fame: undefined });
    expect(statGrantOutcome(w, { xp: 5, fame: 3 }).updates).toEqual({ xp: 5, fame: 3 });
  });

  it('mirror: true copies the grant deltas into the announce payload', () => {
    expect(statGrantOutcome(chosen(), { fame: 15 }, { mirror: true })).toEqual({
      updates: { fame: 65 },
      announce: { fame: 15 },
    });
  });

  it('explicit announce is used verbatim — grants are never merged into it', () => {
    // e.g. handleWanderingFortuneTeller grants xp but announces only { gold }.
    expect(statGrantOutcome(chosen(), { xp: 15 }, { announce: { gold: 30 } })).toEqual({
      updates: { xp: 115 },
      announce: { gold: 30 },
    });
  });

  it('mirror + announce: explicit values override mirrored ones on collision', () => {
    // e.g. handleShadowTraining grants xp, loses fame, and announces the loss
    // (a positive delta) plus the xp gain.
    const out = statGrantOutcome(chosen(), { xp: 25 }, {
      mirror: true,
      announce: { fame: 8, gold: 5 },
    } satisfies StatGrantOutcomeOpts);
    expect(out.updates).toEqual({ xp: 125 });
    expect(out.announce).toEqual({ xp: 25, fame: 8, gold: 5 });
  });

  it('merges extra update fields; grants win on collision', () => {
    const out = statGrantOutcome(chosen(), { xp: 5 }, { updates: { traits: ['a'], xp: 999 } });
    expect(out.updates).toEqual({ traits: ['a'], xp: 105 });
  });

  it('supports update-only outcomes (e.g. injury + no stat grant)', () => {
    const injuries = [{ id: 'i1', name: 'X' }] as never[];
    const out = statGrantOutcome(chosen(), {}, { updates: { injuries }, announce: { gold: 35 } });
    expect(out.updates).toEqual({ injuries });
    expect(out.announce).toEqual({ gold: 35 });
  });
});
