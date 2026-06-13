import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { NewsletterItem } from '@/types/shared.types';
import { interpolateData as t } from './templateHelpers';

/**
 * Creates a NewsletterItem from a template pool and data map.
 * Consumes one `rng.uuid('newsletter')` then one `rng.pick(templates)`.
 */
export function makeNewsletterItem(
  rng: IRNGService,
  week: number,
  title: string,
  templates: string[],
  data: Record<string, string | number>,
  category?: NewsletterItem['category']
): NewsletterItem {
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
 * Convenience wrapper that pushes a newsletter item into the target array.
 * Preserves the same RNG call order as `makeNewsletterItem`.
 */
export function pushNewsletterItem(
  target: NewsletterItem[],
  rng: IRNGService,
  week: number,
  title: string,
  templates: string[],
  data: Record<string, string | number>,
  category?: NewsletterItem['category']
): void {
  target.push(makeNewsletterItem(rng, week, title, templates, data, category));
}
