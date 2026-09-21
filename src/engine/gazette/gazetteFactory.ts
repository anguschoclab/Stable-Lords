/**
 * Gazette Factory - Main factory functions for gazette generation
 * Extracted from gazetteNarrative.ts to follow SRP
 */
import type { FightSummary } from '@/types/combat.types';
import type { CrowdMoodType } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { GazetteStory } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';
import { MOOD_TONE } from './gazetteTemplateHelpers';
import {
  computeFightAnalysis,
  detectRivalryMatchup,
  detectGazetteTags,
  detectHotStreakers,
  detectRisingStars,
  detectUpsets,
  detectDebuts,
  buildNamesByFightId,
  type GazetteDetections,
} from './gazetteDetections';
import { generateGazetteHeadline, generateGazetteBody } from './gazetteNarrative';

/**
 * Generates a weekly gazette from fight data.
 */
export function generateWeeklyGazette(
  fights: FightSummary[],
  mood: CrowdMoodType,
  week: number,
  graveyard: Warrior[],
  allFights?: FightSummary[],
  rng?: IRNGService
): GazetteStory {
  const rngService = resolveRng(rng, week * 7919 + 55);
  const storyId = rngService.uuid();
  const moodKey = mood && MOOD_TONE[mood] ? mood : 'Calm';
  const tone = MOOD_TONE[moodKey];

  // Run all detections — single pass over allFights via computeFightAnalysis
  const ctx = allFights ? computeFightAnalysis(fights, allFights) : null;
  const hotStreakers = ctx ? detectHotStreakers(fights, ctx) : [];
  const rivalryPair = ctx ? detectRivalryMatchup(fights, ctx) : null;
  const risingStars = ctx ? detectRisingStars(fights, ctx) : [];
  const upsets = detectUpsets(fights, ctx?.namesByFightId ?? buildNamesByFightId(fights));
  const debuts = ctx ? detectDebuts(fights, ctx) : [];

  const detections: GazetteDetections = {
    tags: [],
    hotStreakers,
    rivalryPair,
    risingStars,
    upsets,
    debuts,
  };

  // Generate tags from detections
  detections.tags = detectGazetteTags(fights, detections);

  // Generate headline and body using helper functions
  const headline = generateGazetteHeadline(detections, fights, week, mood, rngService, tone);
  const body = generateGazetteBody(detections, fights, mood, week, graveyard, rngService, tone);

  return {
    id: storyId as import('@/types/shared.types').NewsId,
    headline,
    body,
    mood,
    tags: detections.tags,
    week,
  };
}
