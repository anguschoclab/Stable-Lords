import { vi } from 'vitest';
import type { BoutOffer } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import { makeWarrior, makeBoutOffer } from '@/test/_fixtures/factories';

/** Shared OfferCard test setup — player warrior, pending offer, base props. */
export const playerWarrior = makeWarrior({ id: 'pw-1' as WarriorId, name: 'My Fighter' });

export const makeOffer = (over: Partial<BoutOffer> = {}): BoutOffer =>
  makeBoutOffer({
    id: 'offer-1' as BoutOffer['id'],
    promoterId: 'prom-1' as BoutOffer['promoterId'],
    warriorIds: [playerWarrior.id, 'rw-1' as WarriorId],
    boutWeek: 5,
    expirationWeek: 6,
    purse: 400,
    hype: 50,
    status: 'Proposed',
    responses: {},
    ...over,
  } as any);

export const makeOfferCardProps = (): {
  promoters: Record<string, { name: string; tier: string; personality: string }>;
  roster: ReturnType<typeof makeWarrior>[];
  rivalWarriorMap: Record<string, never>;
  signedOfferIds: Set<string>;
  onResponse: (offerId: string, warriorId: string | undefined, response: 'Accepted' | 'Declined') => void;
} => ({
  promoters: { 'prom-1': { name: 'Grand Arena', tier: 'Major', personality: 'Showman' } },
  roster: [playerWarrior],
  rivalWarriorMap: {},
  signedOfferIds: new Set<string>(),
  onResponse: vi.fn<(offerId: string, warriorId: string | undefined, response: 'Accepted' | 'Declined') => void>(),
});
