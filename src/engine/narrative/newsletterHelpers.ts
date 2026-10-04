import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { NewsletterItem } from '@/types/shared.types';
import { interpolateData as t } from './templateHelpers';

/**
 *
 */
export interface MakeNewsletterItemArgs {
  rng: IRNGService;
  week: number;
  title: string;
  templates: string[];
  data: Record<string, string | number>;
  category?: NewsletterItem['category'];
}

/**
 * Creates a NewsletterItem from a template pool and data map.
 * Consumes one `rng.uuid('newsletter')` then one `rng.pick(templates)`.
 */
export function makeNewsletterItem(args: MakeNewsletterItemArgs): NewsletterItem {
  const { rng, week, title, templates, data } = args;
  const { category } = args;
  const id = rng.uuid('newsletter');
  const template = rng.pick(templates) || '';
  return {
    id,
    week,
    title,
    items: [t(template, data)],
    ...(category ? { category } : {}),
  };
}

/**
 *
 */
export interface PushNewsletterItemArgs {
  target: NewsletterItem[];
  rng: IRNGService;
  week: number;
  title: string;
  templates: string[];
  data: Record<string, string | number>;
  category?: NewsletterItem['category'];
}

/**
 * Convenience wrapper that pushes a newsletter item into the target array.
 * Preserves the same RNG call order as `makeNewsletterItem`.
 */
export function pushNewsletterItem(args: PushNewsletterItemArgs): void {
  const { target, rng, week, title, templates } = args;
  const { data, category } = args;
  target.push(makeNewsletterItem({ rng: rng, week: week, title: title, templates: templates, data: data, category: category }));
}
