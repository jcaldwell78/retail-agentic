import { useMediaQuery } from './useMediaQuery';

/**
 * Tailwind CSS breakpoints
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Custom hook for Tailwind breakpoint detection.
 * Returns an object with boolean values for each breakpoint.
 *
 * @returns Object with breakpoint detection results
 *
 * @example
 * const { isSm, isMd, isLg, isXl, is2xl } = useBreakpoint();
 *
 * if (isMd) {
 *   // Render tablet layout
 * }
 */
export function useBreakpoint() {
  const isSm = useMediaQuery(`(min-width: ${breakpoints.sm})`);
  const isMd = useMediaQuery(`(min-width: ${breakpoints.md})`);
  const isLg = useMediaQuery(`(min-width: ${breakpoints.lg})`);
  const isXl = useMediaQuery(`(min-width: ${breakpoints.xl})`);
  const is2xl = useMediaQuery(`(min-width: ${breakpoints['2xl']})`);

  return {
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    // Convenience flags
    isMobile: !isMd,
    isTablet: isMd && !isLg,
    isDesktop: isLg,
  };
}

/**
 * Hook to check if viewport is above a specific breakpoint.
 *
 * @param breakpoint - Breakpoint to check against
 * @returns boolean indicating if viewport is above breakpoint
 *
 * @example
 * const isAboveMd = useBreakpointAbove('md');
 */
export function useBreakpointAbove(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${breakpoints[breakpoint]})`);
}

/**
 * Hook to check if viewport is below a specific breakpoint.
 *
 * @param breakpoint - Breakpoint to check against
 * @returns boolean indicating if viewport is below breakpoint
 *
 * @example
 * const isBelowLg = useBreakpointBelow('lg');
 */
export function useBreakpointBelow(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(max-width: ${breakpoints[breakpoint]})`);
}

/**
 * Hook to get the current breakpoint name.
 *
 * @returns Current breakpoint name or 'xs' for mobile
 *
 * @example
 * const breakpoint = useCurrentBreakpoint();
 * // Returns: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 */
export function useCurrentBreakpoint(): Breakpoint | 'xs' {
  const { isSm, isMd, isLg, isXl, is2xl } = useBreakpoint();

  if (is2xl) return '2xl';
  if (isXl) return 'xl';
  if (isLg) return 'lg';
  if (isMd) return 'md';
  if (isSm) return 'sm';
  return 'xs';
}
