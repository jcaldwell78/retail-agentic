/**
 * Responsive utility functions for conditional rendering and styling.
 */

/**
 * Tailwind breakpoint values in pixels
 */
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

/**
 * Get responsive value based on current breakpoint.
 * Useful for conditional rendering without hooks.
 *
 * @param breakpointValues - Object mapping breakpoints to values
 * @param currentWidth - Current window width
 * @returns Value for the current breakpoint
 *
 * @example
 * const columns = getResponsiveValue({
 *   xs: 1,
 *   sm: 2,
 *   md: 3,
 *   lg: 4,
 * }, window.innerWidth);
 */
export function getResponsiveValue<T>(
  breakpointValues: Partial<Record<BreakpointKey, T>>,
  currentWidth: number
): T | undefined {
  const sortedBreakpoints = Object.entries(BREAKPOINTS)
    .sort(([, a], [, b]) => b - a) // Sort descending
    .map(([key]) => key as BreakpointKey);

  for (const breakpoint of sortedBreakpoints) {
    if (currentWidth >= BREAKPOINTS[breakpoint]) {
      const value = breakpointValues[breakpoint];
      if (value !== undefined) {
        return value;
      }
    }
  }

  return undefined;
}

/**
 * Generate responsive class names based on Tailwind pattern.
 *
 * @param baseClass - Base class name
 * @param responsive - Object mapping breakpoints to class values
 * @returns Space-separated class names
 *
 * @example
 * getResponsiveClasses('grid-cols', { xs: '1', md: '2', lg: '3' })
 * // Returns: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
 */
export function getResponsiveClasses(
  baseClass: string,
  responsive: Partial<Record<BreakpointKey, string>>
): string {
  const classes: string[] = [];

  Object.entries(responsive).forEach(([breakpoint, value]) => {
    if (breakpoint === 'xs') {
      classes.push(`${baseClass}-${value}`);
    } else {
      classes.push(`${breakpoint}:${baseClass}-${value}`);
    }
  });

  return classes.join(' ');
}

/**
 * Check if device is touch-enabled
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - IE specific
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Check if device is mobile based on user agent
 * Note: This is a simple heuristic and not 100% reliable
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Get orientation of the device
 */
export function getOrientation(): 'portrait' | 'landscape' | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * Clamp a value between min and max based on viewport width
 * Useful for fluid typography and spacing
 *
 * @param minValue - Minimum value
 * @param maxValue - Maximum value
 * @param minWidth - Minimum viewport width
 * @param maxWidth - Maximum viewport width
 * @param currentWidth - Current viewport width
 * @returns Clamped value
 *
 * @example
 * // Fluid font size between 16px and 24px
 * const fontSize = clampValue(16, 24, 320, 1920, window.innerWidth);
 */
export function clampValue(
  minValue: number,
  maxValue: number,
  minWidth: number,
  maxWidth: number,
  currentWidth: number
): number {
  if (currentWidth <= minWidth) return minValue;
  if (currentWidth >= maxWidth) return maxValue;

  const slope = (maxValue - minValue) / (maxWidth - minWidth);
  return minValue + slope * (currentWidth - minWidth);
}
