/**
 * Plan H.7 — `campaignFocus` must survive the persistence schema. Rival
 * campaign roles (CROWN_BID et al.) are written onto warriors by the shard
 * pass; a stripped field would silently drop the role on save/load.
 */
import { describe, it, expect } from 'vitest';
import { WarriorSchema } from '@/schemas/gameStateSchema';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { CampaignFocus } from '@/engine/advisor/types';

const ALL_FOCUS: CampaignFocus[] = [
  'TOURNAMENT_PUSH',
  'PROSPECT_DEV',
  'PURSE_HUNTER',
  'REHABILITATION',
  'VETERAN_TWILIGHT',
  'CROWN_BID',
];

describe('WarriorSchema — campaignFocus roundtrip', () => {
  it('preserves campaignFocus through parse/serialize', () => {
    const w = makeWarrior({ campaignFocus: 'CROWN_BID' });
    const parsed = WarriorSchema.parse(JSON.parse(JSON.stringify(w)));
    expect(parsed.campaignFocus).toBe('CROWN_BID');
  });

  it('accepts every CampaignFocus value rivals can carry', () => {
    for (const focus of ALL_FOCUS) {
      const parsed = WarriorSchema.parse(
        JSON.parse(JSON.stringify(makeWarrior({ campaignFocus: focus })))
      );
      expect(parsed.campaignFocus).toBe(focus);
    }
  });

  it('leaves campaignFocus absent for warriors without a role', () => {
    const parsed = WarriorSchema.parse(JSON.parse(JSON.stringify(makeWarrior())));
    expect(parsed.campaignFocus).toBeUndefined();
  });
});
