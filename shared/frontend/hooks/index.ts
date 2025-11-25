/**
 * Responsive and utility hooks for React components
 */

// Responsive hooks
export { useMediaQuery } from './useMediaQuery';
export {
  useBreakpoint,
  useBreakpointAbove,
  useBreakpointBelow,
  useCurrentBreakpoint,
  breakpoints,
  type Breakpoint,
} from './useBreakpoint';
export { useWindowSize } from './useWindowSize';

// Keyboard navigation hooks
export {
  useKeyboard,
  useKeyboardShortcut,
  useArrowNavigation,
  useEscapeKey,
  useEnterKey,
} from './useKeyboard';

// Focus management hooks
export {
  useFocusTrap,
  useAutoFocus,
  useListNavigation,
} from './useFocusTrap';
