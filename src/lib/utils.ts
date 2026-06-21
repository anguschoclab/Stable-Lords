import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge'; /**
                                           * Cn.
                                           */

/**
 * Cn.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
