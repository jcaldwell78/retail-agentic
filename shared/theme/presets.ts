/**
 * Preset Themes - Distinctive Aesthetic Directions
 *
 * Each preset is carefully designed to avoid generic "AI slop" aesthetics.
 * Bold, memorable, and intentional design choices.
 */

import type { ThemePreset, TenantTheme } from './types';

// ============================================================================
// LUXURY MINIMAL
// ============================================================================
// Refined elegance with generous whitespace, monochrome palette,
// and subtle gold accents. Think high-end fashion boutique.

const luxuryMinimal: ThemePreset = {
  id: 'luxury-minimal',
  name: 'Luxury Minimal',
  description: 'Refined elegance with generous whitespace and subtle gold accents',
  preview: {
    primaryColor: '#1a1a1a',
    accentColor: '#c9a962',
    fontPreview: 'Cormorant Garamond',
  },
  theme: {
    name: 'Luxury Minimal',
    description: 'High-end minimalist aesthetic with sophisticated typography',
    aesthetic: 'luxury-minimal',
    colors: {
      background: '0 0% 99%',
      foreground: '0 0% 9%',
      card: '0 0% 100%',
      cardForeground: '0 0% 9%',
      popover: '0 0% 100%',
      popoverForeground: '0 0% 9%',
      primary: '0 0% 10%',
      primaryForeground: '0 0% 98%',
      secondary: '43 30% 90%',
      secondaryForeground: '0 0% 9%',
      muted: '0 0% 96%',
      mutedForeground: '0 0% 45%',
      accent: '43 54% 59%', // Gold accent
      accentForeground: '0 0% 9%',
      destructive: '0 72% 51%',
      destructiveForeground: '0 0% 98%',
      success: '142 76% 36%',
      successForeground: '0 0% 98%',
      warning: '43 96% 56%',
      warningForeground: '0 0% 9%',
      border: '0 0% 90%',
      input: '0 0% 90%',
      ring: '43 54% 59%',
    },
    colorsDark: {
      background: '0 0% 5%',
      foreground: '0 0% 95%',
      card: '0 0% 8%',
      cardForeground: '0 0% 95%',
      popover: '0 0% 8%',
      popoverForeground: '0 0% 95%',
      primary: '0 0% 95%',
      primaryForeground: '0 0% 9%',
      secondary: '43 20% 15%',
      secondaryForeground: '0 0% 95%',
      muted: '0 0% 15%',
      mutedForeground: '0 0% 60%',
      accent: '43 54% 59%',
      accentForeground: '0 0% 9%',
      border: '0 0% 18%',
      input: '0 0% 18%',
      ring: '43 54% 59%',
    },
    typography: {
      fontDisplay: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
      fontBody: '"Outfit", "DM Sans", system-ui, sans-serif',
      fontMono: '"JetBrains Mono", "Fira Code", monospace',
      fontSizeBase: 16,
      lineHeightBase: 1.7,
      letterSpacingHeadings: '0.02em',
      fontWeightHeadings: 500,
      fontWeightBody: 400,
      fontWeightBold: 600,
    },
    spacing: {
      borderRadius: 0.25,
      containerMaxWidth: '1200px',
      sectionPadding: '6rem',
    },
    effects: {
      shadowStyle: 'subtle',
      enableBackdropBlur: false,
      enableGradients: false,
      animationSpeed: 1.2,
      enablePageTransitions: true,
    },
    hero: {
      gradientStart: '0 0% 10%',
      gradientEnd: '0 0% 15%',
      gradientAngle: 180,
      textColor: '0 0% 98%',
      overlayOpacity: 0,
    },
    googleFonts: ['Cormorant+Garamond:wght@400;500;600', 'Outfit:wght@300;400;500;600'],
  },
};

// ============================================================================
// WARM & ORGANIC
// ============================================================================
// Earth tones, rounded forms, natural textures. Approachable and
// artisanal feel. Think farmer's market or sustainable brand.

const warmOrganic: ThemePreset = {
  id: 'warm-organic',
  name: 'Warm & Organic',
  description: 'Earth tones and natural textures for an artisanal feel',
  preview: {
    primaryColor: '#5d4e37',
    accentColor: '#c4704f',
    fontPreview: 'Fraunces',
  },
  theme: {
    name: 'Warm & Organic',
    description: 'Natural, approachable aesthetic with earthy warmth',
    aesthetic: 'warm-organic',
    colors: {
      background: '36 33% 97%',
      foreground: '28 25% 18%',
      card: '36 30% 99%',
      cardForeground: '28 25% 18%',
      popover: '36 30% 99%',
      popoverForeground: '28 25% 18%',
      primary: '28 25% 29%', // Warm brown
      primaryForeground: '36 33% 97%',
      secondary: '36 25% 88%',
      secondaryForeground: '28 25% 18%',
      muted: '36 20% 93%',
      mutedForeground: '28 15% 45%',
      accent: '16 56% 54%', // Terracotta
      accentForeground: '36 33% 97%',
      destructive: '0 65% 48%',
      destructiveForeground: '0 0% 98%',
      success: '152 60% 36%',
      successForeground: '0 0% 98%',
      warning: '38 92% 50%',
      warningForeground: '28 25% 18%',
      border: '36 20% 85%',
      input: '36 20% 85%',
      ring: '16 56% 54%',
    },
    colorsDark: {
      background: '28 20% 8%',
      foreground: '36 20% 92%',
      card: '28 18% 12%',
      cardForeground: '36 20% 92%',
      popover: '28 18% 12%',
      popoverForeground: '36 20% 92%',
      primary: '36 25% 80%',
      primaryForeground: '28 25% 12%',
      secondary: '28 15% 18%',
      secondaryForeground: '36 20% 92%',
      muted: '28 12% 18%',
      mutedForeground: '36 15% 55%',
      border: '28 15% 22%',
      input: '28 15% 22%',
    },
    typography: {
      fontDisplay: '"Fraunces", "Libre Baskerville", Georgia, serif',
      fontBody: '"Source Sans 3", "Open Sans", system-ui, sans-serif',
      fontMono: '"IBM Plex Mono", "Fira Code", monospace',
      fontSizeBase: 17,
      lineHeightBase: 1.75,
      letterSpacingHeadings: '-0.01em',
      fontWeightHeadings: 600,
      fontWeightBody: 400,
      fontWeightBold: 600,
    },
    spacing: {
      borderRadius: 0.75,
      containerMaxWidth: '1280px',
      sectionPadding: '5rem',
    },
    effects: {
      shadowStyle: 'medium',
      enableBackdropBlur: true,
      enableGradients: true,
      animationSpeed: 1.0,
      enablePageTransitions: true,
    },
    hero: {
      gradientStart: '28 35% 25%',
      gradientEnd: '16 45% 35%',
      gradientAngle: 135,
      textColor: '36 33% 97%',
      overlayOpacity: 0.1,
    },
    googleFonts: ['Fraunces:wght@400;500;600;700', 'Source+Sans+3:wght@300;400;500;600'],
  },
};

// ============================================================================
// BOLD EDITORIAL
// ============================================================================
// Strong typography hierarchy, dramatic layouts, magazine-inspired.
// High contrast with unexpected color pops.

const boldEditorial: ThemePreset = {
  id: 'bold-editorial',
  name: 'Bold Editorial',
  description: 'Magazine-inspired with dramatic typography and bold accents',
  preview: {
    primaryColor: '#0f0f0f',
    accentColor: '#ff3366',
    fontPreview: 'Bebas Neue',
  },
  theme: {
    name: 'Bold Editorial',
    description: 'High-impact editorial design with striking typography',
    aesthetic: 'bold-editorial',
    colors: {
      background: '0 0% 100%',
      foreground: '0 0% 6%',
      card: '0 0% 98%',
      cardForeground: '0 0% 6%',
      popover: '0 0% 100%',
      popoverForeground: '0 0% 6%',
      primary: '0 0% 6%',
      primaryForeground: '0 0% 100%',
      secondary: '0 0% 95%',
      secondaryForeground: '0 0% 6%',
      muted: '0 0% 96%',
      mutedForeground: '0 0% 40%',
      accent: '344 100% 60%', // Hot pink/coral
      accentForeground: '0 0% 100%',
      destructive: '0 84% 60%',
      destructiveForeground: '0 0% 98%',
      success: '160 84% 39%',
      successForeground: '0 0% 98%',
      warning: '45 93% 47%',
      warningForeground: '0 0% 6%',
      border: '0 0% 88%',
      input: '0 0% 88%',
      ring: '344 100% 60%',
    },
    colorsDark: {
      background: '0 0% 4%',
      foreground: '0 0% 96%',
      card: '0 0% 7%',
      cardForeground: '0 0% 96%',
      popover: '0 0% 7%',
      popoverForeground: '0 0% 96%',
      primary: '0 0% 96%',
      primaryForeground: '0 0% 6%',
      secondary: '0 0% 12%',
      secondaryForeground: '0 0% 96%',
      muted: '0 0% 15%',
      mutedForeground: '0 0% 60%',
      border: '0 0% 18%',
      input: '0 0% 18%',
    },
    typography: {
      fontDisplay: '"Bebas Neue", "Oswald", "Impact", sans-serif',
      fontBody: '"Inter Tight", "Barlow", system-ui, sans-serif',
      fontMono: '"Space Mono", "Fira Code", monospace',
      fontSizeBase: 16,
      lineHeightBase: 1.6,
      letterSpacingHeadings: '0.05em',
      fontWeightHeadings: 400,
      fontWeightBody: 400,
      fontWeightBold: 700,
    },
    spacing: {
      borderRadius: 0,
      containerMaxWidth: '1400px',
      sectionPadding: '4rem',
    },
    effects: {
      shadowStyle: 'none',
      enableBackdropBlur: false,
      enableGradients: false,
      animationSpeed: 0.8,
      enablePageTransitions: true,
    },
    hero: {
      gradientStart: '0 0% 6%',
      gradientEnd: '344 80% 25%',
      gradientAngle: 160,
      textColor: '0 0% 100%',
      overlayOpacity: 0,
    },
    googleFonts: ['Bebas+Neue', 'Inter+Tight:wght@300;400;500;600;700'],
  },
};

// ============================================================================
// RETRO-MODERN
// ============================================================================
// Nostalgic color palettes meets modern UI. Playful typography,
// geometric patterns, vintage-inspired with contemporary execution.

const retroModern: ThemePreset = {
  id: 'retro-modern',
  name: 'Retro-Modern',
  description: 'Nostalgic vibes with contemporary polish and playful energy',
  preview: {
    primaryColor: '#1e3a5f',
    accentColor: '#f4a261',
    fontPreview: 'Syne',
  },
  theme: {
    name: 'Retro-Modern',
    description: 'Vintage-inspired aesthetic with modern sensibility',
    aesthetic: 'retro-modern',
    colors: {
      background: '45 30% 96%', // Warm cream
      foreground: '210 50% 20%',
      card: '45 25% 99%',
      cardForeground: '210 50% 20%',
      popover: '45 25% 99%',
      popoverForeground: '210 50% 20%',
      primary: '210 52% 25%', // Navy blue
      primaryForeground: '45 30% 96%',
      secondary: '173 58% 39%', // Teal
      secondaryForeground: '45 30% 96%',
      muted: '45 20% 90%',
      mutedForeground: '210 25% 40%',
      accent: '29 87% 67%', // Warm orange/peach
      accentForeground: '210 50% 15%',
      destructive: '4 90% 58%',
      destructiveForeground: '0 0% 98%',
      success: '158 64% 42%',
      successForeground: '0 0% 98%',
      warning: '43 96% 56%',
      warningForeground: '210 50% 15%',
      border: '45 20% 82%',
      input: '45 20% 82%',
      ring: '173 58% 39%',
    },
    colorsDark: {
      background: '210 40% 10%',
      foreground: '45 25% 92%',
      card: '210 35% 14%',
      cardForeground: '45 25% 92%',
      popover: '210 35% 14%',
      popoverForeground: '45 25% 92%',
      primary: '45 30% 85%',
      primaryForeground: '210 50% 15%',
      secondary: '173 50% 50%',
      secondaryForeground: '210 40% 10%',
      muted: '210 30% 18%',
      mutedForeground: '45 15% 60%',
      border: '210 25% 22%',
      input: '210 25% 22%',
    },
    typography: {
      fontDisplay: '"Syne", "Archivo Black", sans-serif',
      fontBody: '"Work Sans", "Nunito Sans", system-ui, sans-serif',
      fontMono: '"Victor Mono", "Fira Code", monospace',
      fontSizeBase: 16,
      lineHeightBase: 1.7,
      letterSpacingHeadings: '0em',
      fontWeightHeadings: 700,
      fontWeightBody: 400,
      fontWeightBold: 600,
    },
    spacing: {
      borderRadius: 1,
      containerMaxWidth: '1320px',
      sectionPadding: '5rem',
    },
    effects: {
      shadowStyle: 'medium',
      enableBackdropBlur: true,
      enableGradients: true,
      animationSpeed: 0.9,
      enablePageTransitions: true,
    },
    hero: {
      gradientStart: '210 52% 25%',
      gradientEnd: '173 58% 39%',
      gradientAngle: 120,
      textColor: '45 30% 96%',
      overlayOpacity: 0.05,
    },
    googleFonts: ['Syne:wght@400;500;600;700;800', 'Work+Sans:wght@300;400;500;600'],
  },
};

// ============================================================================
// INDUSTRIAL REFINED
// ============================================================================
// Dark mode excellence with high contrast, sharp typography,
// utilitarian elegance. Tech-forward, professional.

const industrialRefined: ThemePreset = {
  id: 'industrial-refined',
  name: 'Industrial Refined',
  description: 'Dark mode elegance with sharp typography and high contrast',
  preview: {
    primaryColor: '#e4e4e7',
    accentColor: '#22d3ee',
    fontPreview: 'Space Grotesk',
  },
  theme: {
    name: 'Industrial Refined',
    description: 'Tech-forward dark aesthetic with utilitarian precision',
    aesthetic: 'industrial-refined',
    colors: {
      // Light mode (inverted industrial)
      background: '240 10% 96%',
      foreground: '240 10% 10%',
      card: '240 8% 98%',
      cardForeground: '240 10% 10%',
      popover: '240 8% 98%',
      popoverForeground: '240 10% 10%',
      primary: '240 10% 10%',
      primaryForeground: '240 10% 96%',
      secondary: '240 6% 90%',
      secondaryForeground: '240 10% 10%',
      muted: '240 6% 93%',
      mutedForeground: '240 5% 45%',
      accent: '187 92% 50%', // Cyan
      accentForeground: '240 10% 10%',
      destructive: '0 84% 60%',
      destructiveForeground: '0 0% 98%',
      success: '142 71% 45%',
      successForeground: '0 0% 98%',
      warning: '48 96% 53%',
      warningForeground: '240 10% 10%',
      border: '240 6% 85%',
      input: '240 6% 85%',
      ring: '187 92% 50%',
    },
    colorsDark: {
      background: '240 10% 6%',
      foreground: '240 6% 93%',
      card: '240 8% 9%',
      cardForeground: '240 6% 93%',
      popover: '240 8% 9%',
      popoverForeground: '240 6% 93%',
      primary: '240 6% 93%',
      primaryForeground: '240 10% 6%',
      secondary: '240 5% 16%',
      secondaryForeground: '240 6% 93%',
      muted: '240 5% 16%',
      mutedForeground: '240 5% 55%',
      accent: '187 92% 50%',
      accentForeground: '240 10% 6%',
      border: '240 5% 18%',
      input: '240 5% 18%',
    },
    typography: {
      fontDisplay: '"Space Grotesk", "Manrope", system-ui, sans-serif',
      fontBody: '"Inter", "SF Pro Display", system-ui, sans-serif',
      fontMono: '"JetBrains Mono", "Fira Code", monospace',
      fontSizeBase: 15,
      lineHeightBase: 1.65,
      letterSpacingHeadings: '-0.02em',
      fontWeightHeadings: 600,
      fontWeightBody: 400,
      fontWeightBold: 600,
    },
    spacing: {
      borderRadius: 0.5,
      containerMaxWidth: '1440px',
      sectionPadding: '4rem',
    },
    effects: {
      shadowStyle: 'dramatic',
      enableBackdropBlur: true,
      enableGradients: true,
      animationSpeed: 0.7,
      enablePageTransitions: true,
    },
    hero: {
      gradientStart: '240 10% 6%',
      gradientEnd: '187 50% 15%',
      gradientAngle: 145,
      textColor: '240 6% 93%',
      overlayOpacity: 0,
    },
    googleFonts: ['Space+Grotesk:wght@400;500;600;700', 'Inter:wght@300;400;500;600'],
  },
};

// ============================================================================
// Export All Presets
// ============================================================================

export const themePresets: ThemePreset[] = [
  luxuryMinimal,
  warmOrganic,
  boldEditorial,
  retroModern,
  industrialRefined,
];

export const themePresetsMap: Record<string, ThemePreset> = {
  'luxury-minimal': luxuryMinimal,
  'warm-organic': warmOrganic,
  'bold-editorial': boldEditorial,
  'retro-modern': retroModern,
  'industrial-refined': industrialRefined,
};

export function getPresetTheme(id: string): ThemePreset | undefined {
  return themePresetsMap[id];
}

export function createDefaultTheme(): TenantTheme {
  const now = new Date().toISOString();
  return {
    id: 'default',
    ...luxuryMinimal.theme,
    createdAt: now,
    updatedAt: now,
  };
}
