/**
 * SeededRNG Service
 * Re-exports SeededRNG for backward compatibility.
 * SeededRNG now implements IRNGService directly, so this wrapper is no longer needed.
 * @deprecated Use SeededRNG from @/utils/random directly
 */
import { SeededRNG } from '@/utils/random';

export { SeededRNG };

// Re-export as SeededRNGService for backward compatibility
export const SeededRNGService = SeededRNG;
