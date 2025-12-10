/**
 * Tenant Theme System - Type Definitions
 *
 * Comprehensive theming for whitelabel retail storefronts.
 * Supports preset themes and full custom configuration.
 */

// ============================================================================
// Core Color Types
// ============================================================================

/** HSL color format: "hue saturation% lightness%" */
export type HSLColor = string;

/** Hex color format: "#RRGGBB" or "#RGB" */
export type HexColor = string;

/** RGB color format: "r g b" (space-separated values 0-255) */
export type RGBColor = string;

/** CSS color value - can be HSL, hex, or RGB */
export type CSSColor = HSLColor | HexColor | RGBColor;

// ============================================================================
// Theme Color Palette
// ============================================================================

export interface ThemeColors {
  /** Main background color */
  background: CSSColor;
  /** Primary text color */
  foreground: CSSColor;

  /** Card/panel background */
  card: CSSColor;
  /** Text on cards */
  cardForeground: CSSColor;

  /** Popover/dropdown background */
  popover: CSSColor;
  /** Text on popovers */
  popoverForeground: CSSColor;

  /** Primary brand color - buttons, links, accents */
  primary: CSSColor;
  /** Text on primary colored elements */
  primaryForeground: CSSColor;

  /** Secondary actions and elements */
  secondary: CSSColor;
  /** Text on secondary elements */
  secondaryForeground: CSSColor;

  /** Muted backgrounds and text */
  muted: CSSColor;
  /** Muted/secondary text */
  mutedForeground: CSSColor;

  /** Accent highlights */
  accent: CSSColor;
  /** Text on accent elements */
  accentForeground: CSSColor;

  /** Destructive/error states */
  destructive: CSSColor;
  /** Text on destructive elements */
  destructiveForeground: CSSColor;

  /** Success states */
  success: CSSColor;
  /** Text on success elements */
  successForeground: CSSColor;

  /** Warning states */
  warning: CSSColor;
  /** Text on warning elements */
  warningForeground: CSSColor;

  /** Border color */
  border: CSSColor;
  /** Input border color */
  input: CSSColor;
  /** Focus ring color */
  ring: CSSColor;
}

// ============================================================================
// Typography Configuration
// ============================================================================

export interface ThemeTypography {
  /** Display/heading font family */
  fontDisplay: string;
  /** Body text font family */
  fontBody: string;
  /** Monospace font family (code, data) */
  fontMono: string;

  /** Base font size in pixels */
  fontSizeBase: number;
  /** Line height for body text */
  lineHeightBase: number;
  /** Letter spacing for headings */
  letterSpacingHeadings: string;

  /** Font weight for headings */
  fontWeightHeadings: number;
  /** Font weight for body */
  fontWeightBody: number;
  /** Font weight for bold */
  fontWeightBold: number;
}

// ============================================================================
// Spacing & Layout
// ============================================================================

export interface ThemeSpacing {
  /** Border radius in rem */
  borderRadius: number;
  /** Container max width */
  containerMaxWidth: string;
  /** Section padding (vertical) */
  sectionPadding: string;
}

// ============================================================================
// Visual Effects
// ============================================================================

export interface ThemeEffects {
  /** Shadow style: 'none' | 'subtle' | 'medium' | 'dramatic' */
  shadowStyle: 'none' | 'subtle' | 'medium' | 'dramatic';
  /** Enable background blur effects */
  enableBackdropBlur: boolean;
  /** Enable gradient backgrounds */
  enableGradients: boolean;
  /** Animation speed multiplier (0.5 = faster, 2 = slower) */
  animationSpeed: number;
  /** Enable page transitions */
  enablePageTransitions: boolean;
}

// ============================================================================
// Hero/Banner Configuration
// ============================================================================

export interface ThemeHero {
  /** Hero gradient start color */
  gradientStart: CSSColor;
  /** Hero gradient end color */
  gradientEnd: CSSColor;
  /** Gradient direction in degrees */
  gradientAngle: number;
  /** Hero text color */
  textColor: CSSColor;
  /** Overlay opacity (0-1) */
  overlayOpacity: number;
}

// ============================================================================
// Complete Theme Configuration
// ============================================================================

export interface TenantTheme {
  /** Unique theme identifier */
  id: string;
  /** Display name for the theme */
  name: string;
  /** Theme description */
  description: string;
  /** Theme category/aesthetic direction */
  aesthetic: ThemeAesthetic;

  /** Light mode colors */
  colors: ThemeColors;
  /** Dark mode colors (optional - falls back to inverted light) */
  colorsDark?: Partial<ThemeColors>;

  /** Typography settings */
  typography: ThemeTypography;

  /** Spacing and layout */
  spacing: ThemeSpacing;

  /** Visual effects */
  effects: ThemeEffects;

  /** Hero section styling */
  hero: ThemeHero;

  /** Custom CSS to inject (advanced users) */
  customCSS?: string;

  /** Google Fonts to load */
  googleFonts?: string[];

  /** Theme creation timestamp */
  createdAt: string;
  /** Last modification timestamp */
  updatedAt: string;
}

// ============================================================================
// Theme Aesthetic Categories
// ============================================================================

export type ThemeAesthetic =
  | 'luxury-minimal'
  | 'warm-organic'
  | 'bold-editorial'
  | 'retro-modern'
  | 'industrial-refined'
  | 'custom';

export interface ThemePreset {
  id: ThemeAesthetic;
  name: string;
  description: string;
  preview: {
    primaryColor: string;
    accentColor: string;
    fontPreview: string;
  };
  theme: Omit<TenantTheme, 'id' | 'createdAt' | 'updatedAt'>;
}

// ============================================================================
// Tenant Theme Assignment
// ============================================================================

export interface TenantThemeConfig {
  /** Tenant ID */
  tenantId: string;
  /** Active theme ID (preset ID or custom theme ID) */
  activeThemeId: string;
  /** Whether using a preset or custom theme */
  isPreset: boolean;
  /** Custom theme overrides (when using preset as base) */
  customOverrides?: Partial<TenantTheme>;
  /** Enable dark mode toggle for customers */
  allowDarkMode: boolean;
  /** Default to dark mode */
  defaultDarkMode: boolean;
}

// ============================================================================
// Theme Context State
// ============================================================================

export interface ThemeContextState {
  theme: TenantTheme;
  isDarkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
}

// ============================================================================
// CSS Variable Generation
// ============================================================================

export type CSSVariableMap = Record<string, string>;

export function themeToCSSVariables(theme: TenantTheme, isDark: boolean): CSSVariableMap {
  const colors = isDark && theme.colorsDark
    ? { ...theme.colors, ...theme.colorsDark }
    : theme.colors;

  return {
    '--background': colors.background,
    '--foreground': colors.foreground,
    '--card': colors.card,
    '--card-foreground': colors.cardForeground,
    '--popover': colors.popover,
    '--popover-foreground': colors.popoverForeground,
    '--primary': colors.primary,
    '--primary-foreground': colors.primaryForeground,
    '--secondary': colors.secondary,
    '--secondary-foreground': colors.secondaryForeground,
    '--muted': colors.muted,
    '--muted-foreground': colors.mutedForeground,
    '--accent': colors.accent,
    '--accent-foreground': colors.accentForeground,
    '--destructive': colors.destructive,
    '--destructive-foreground': colors.destructiveForeground,
    '--success': colors.success,
    '--success-foreground': colors.successForeground,
    '--warning': colors.warning,
    '--warning-foreground': colors.warningForeground,
    '--border': colors.border,
    '--input': colors.input,
    '--ring': colors.ring,
    '--radius': `${theme.spacing.borderRadius}rem`,
    '--font-display': theme.typography.fontDisplay,
    '--font-body': theme.typography.fontBody,
    '--font-mono': theme.typography.fontMono,
    '--hero-gradient-start': theme.hero.gradientStart,
    '--hero-gradient-end': theme.hero.gradientEnd,
    '--hero-gradient-angle': `${theme.hero.gradientAngle}deg`,
    '--hero-text': theme.hero.textColor,
    '--animation-speed': `${theme.effects.animationSpeed}`,
  };
}
