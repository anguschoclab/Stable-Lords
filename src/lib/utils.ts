import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';/**
 * Cn.
 * @param inputs - Inputs.
 * @returns The result.
 */


/**
 * Cn.
 * @param inputs - Inputs.
 * @returns The result.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
