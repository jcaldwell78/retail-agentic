# Design System Documentation

This document defines the design system for the Retail Agentic platform, including color palettes, typography, spacing, and component guidelines.

## Color Palette

### System Overview

The design system uses CSS custom properties (CSS variables) to enable **dynamic theming per tenant**. All colors are defined in HSL format for maximum flexibility and accessibility.

### Color Tokens

All color tokens are semantic and defined in both light and dark modes:

#### Primary Colors
- **primary**: Main brand color (default: Blue HSL(221.2, 83.2%, 53.3%))
- **primary-foreground**: Text color on primary backgrounds
- **secondary**: Secondary brand color (lighter blue-gray)
- **secondary-foreground**: Text color on secondary backgrounds

#### Background Colors
- **background**: Main background color (white in light mode, dark in dark mode)
- **foreground**: Main text color (dark in light mode, light in dark mode)
- **card**: Card/panel background
- **card-foreground**: Text on cards
- **popover**: Popover/dropdown background
- **popover-foreground**: Text in popovers

#### Interactive States
- **muted**: Subtle background for less prominent elements
- **muted-foreground**: Muted text color
- **accent**: Accent/hover background color
- **accent-foreground**: Text on accent backgrounds

#### Semantic Colors
- **destructive**: Error/danger color (red)
- **destructive-foreground**: Text on destructive backgrounds
- **border**: Border color
- **input**: Input field border color
- **ring**: Focus ring color

### Tenant Customization

Each tenant can customize their brand colors by overriding CSS variables:

```css
/* Example: Tenant-specific color override */
[data-tenant="tenant-1"] {
  --primary: 142 86% 48%;        /* Green */
  --primary-foreground: 0 0% 100%;
}

[data-tenant="tenant-2"] {
  --primary: 24 95% 53%;         /* Orange */
  --primary-foreground: 0 0% 100%;
}
```

### Color Usage Guidelines

1. **Use semantic tokens** instead of hardcoded colors
   - ✅ `text-primary`
   - ❌ `text-blue-600`

2. **Maintain WCAG 2.1 AA contrast ratios**
   - Text on background: minimum 4.5:1
   - Large text: minimum 3:1
   - Interactive elements: minimum 3:1

3. **Test both light and dark modes**
   - All colors must work in both themes
   - Use foreground tokens for text on colored backgrounds

### Color Scales (Extended Palette)

For cases requiring more granular color control, additional color scales can be added:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Semantic colors (already defined)
        primary: { /* ... */ },

        // Extended color scales (optional)
        brand: {
          50: 'hsl(var(--brand-50))',
          100: 'hsl(var(--brand-100))',
          // ... through 900
        },
        success: {
          DEFAULT: 'hsl(142 76% 36%)',
          foreground: 'hsl(0 0% 100%)',
        },
        warning: {
          DEFAULT: 'hsl(48 96% 53%)',
          foreground: 'hsl(0 0% 0%)',
        },
        info: {
          DEFAULT: 'hsl(199 89% 48%)',
          foreground: 'hsl(0 0% 100%)',
        },
      },
    },
  },
};
```

---

## Typography

### Font Families

The design system uses system font stacks for optimal performance and native feel:

```css
:root {
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
               "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Consolas,
               "Liberation Mono", Menlo, monospace;
}
```

### Font Sizes

Tailwind's default type scale is used, with additional sizes for specific use cases:

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `text-xs` | 0.75rem (12px) | 1rem | Small labels, captions |
| `text-sm` | 0.875rem (14px) | 1.25rem | Body text (mobile), labels |
| `text-base` | 1rem (16px) | 1.5rem | Body text (default) |
| `text-lg` | 1.125rem (18px) | 1.75rem | Emphasized text |
| `text-xl` | 1.25rem (20px) | 1.75rem | H5 headings |
| `text-2xl` | 1.5rem (24px) | 2rem | H4 headings |
| `text-3xl` | 1.875rem (30px) | 2.25rem | H3 headings |
| `text-4xl` | 2.25rem (36px) | 2.5rem | H2 headings |
| `text-5xl` | 3rem (48px) | 1 | H1 headings (desktop) |
| `text-6xl` | 3.75rem (60px) | 1 | Hero text |

### Font Weights

| Token | Weight | Usage |
|-------|--------|-------|
| `font-normal` | 400 | Body text, paragraphs |
| `font-medium` | 500 | Emphasized text, navigation |
| `font-semibold` | 600 | Subheadings, labels |
| `font-bold` | 700 | Headings, CTAs |
| `font-extrabold` | 800 | Hero text, impact text |

### Typography Hierarchy

#### Headings

```jsx
// H1 - Page titles
<h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
  Page Title
</h1>

// H2 - Section headings
<h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
  Section Heading
</h2>

// H3 - Subsection headings
<h3 className="text-2xl font-semibold text-foreground">
  Subsection
</h3>

// H4 - Card titles
<h4 className="text-xl font-semibold text-foreground">
  Card Title
</h4>
```

#### Body Text

```jsx
// Default body text
<p className="text-base text-foreground">
  Regular paragraph text.
</p>

// Muted/secondary text
<p className="text-sm text-muted-foreground">
  Secondary information.
</p>

// Small text (captions, labels)
<span className="text-xs text-muted-foreground">
  Caption or label
</span>
```

#### Links

```jsx
// Default link
<a className="text-primary hover:underline">Link Text</a>

// Muted link
<a className="text-muted-foreground hover:text-foreground transition-colors">
  Subtle Link
</a>
```

### Line Height

- **Tight** (`leading-tight`): For headings and display text
- **Normal** (`leading-normal`): For most body text
- **Relaxed** (`leading-relaxed`): For longer reading content

### Letter Spacing

- **Tighter** (`tracking-tighter`): Large display text
- **Tight** (`tracking-tight`): Headings
- **Normal** (default): Body text
- **Wide** (`tracking-wide`): Uppercase labels, buttons

---

## Spacing System

Uses Tailwind's default spacing scale based on 0.25rem (4px) increments:

| Token | Size | Pixels | Usage |
|-------|------|--------|-------|
| `0` | 0 | 0px | No spacing |
| `0.5` | 0.125rem | 2px | Hairline spacing |
| `1` | 0.25rem | 4px | Minimal spacing |
| `2` | 0.5rem | 8px | Tight spacing |
| `3` | 0.75rem | 12px | Small spacing |
| `4` | 1rem | 16px | Default spacing |
| `6` | 1.5rem | 24px | Medium spacing |
| `8` | 2rem | 32px | Large spacing |
| `12` | 3rem | 48px | XL spacing |
| `16` | 4rem | 64px | XXL spacing |
| `24` | 6rem | 96px | Section spacing |

### Common Spacing Patterns

```jsx
// Card padding
<div className="p-6 md:p-8">

// Section spacing
<section className="py-12 md:py-16">

// Stack spacing (vertical rhythm)
<div className="space-y-4">

// Inline spacing (horizontal rhythm)
<div className="space-x-2">

// Grid gap
<div className="grid gap-6">
```

---

## Layout

### Container

Maximum content width with responsive padding:

```jsx
<div className="container mx-auto px-4 md:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Breakpoints

| Breakpoint | Min Width | Description |
|------------|-----------|-------------|
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets, small laptops |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large desktops |

### Grid System

```jsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>

// Flexbox layout
<div className="flex flex-col md:flex-row gap-4">
  {/* Flex items */}
</div>
```

---

## Border Radius

Consistent rounding for all components:

```css
:root {
  --radius: 0.5rem; /* 8px */
}
```

| Token | Size | Usage |
|-------|------|-------|
| `rounded-sm` | calc(var(--radius) - 4px) | Subtle rounding |
| `rounded-md` | calc(var(--radius) - 2px) | Default inputs |
| `rounded-lg` | var(--radius) | Cards, buttons |
| `rounded-full` | 9999px | Pills, avatars |

---

## Shadows

Elevation system using Tailwind shadows:

| Token | Usage |
|-------|-------|
| `shadow-sm` | Subtle elevation (inputs) |
| `shadow` | Default elevation (cards) |
| `shadow-md` | Medium elevation (dropdowns) |
| `shadow-lg` | High elevation (modals) |
| `shadow-xl` | Maximum elevation |

---

## Component States

### Hover

```jsx
<button className="bg-primary hover:bg-primary/90 transition-colors">
  Hover Me
</button>
```

### Focus

```jsx
<input className="ring-2 ring-ring ring-offset-2 focus-visible:outline-none focus-visible:ring-2" />
```

### Disabled

```jsx
<button disabled className="opacity-50 cursor-not-allowed">
  Disabled
</button>
```

### Active/Pressed

```jsx
<button className="active:scale-95 transition-transform">
  Click Me
</button>
```

---

## Animations & Transitions

### Duration

- **Fast**: `duration-150` (150ms) - Micro-interactions
- **Normal**: `duration-200` (200ms) - Default
- **Slow**: `duration-300` (300ms) - Larger transitions

### Easing

- **Default**: `ease-in-out` - Most transitions
- **Ease-out**: `ease-out` - Entrances
- **Ease-in**: `ease-in` - Exits

### Common Animations

```jsx
// Fade in
<div className="animate-in fade-in duration-200">

// Slide in from bottom
<div className="animate-in slide-in-from-bottom duration-300">

// Spin (loading)
<div className="animate-spin">
```

---

## Accessibility Guidelines

### Focus Indicators

All interactive elements must have visible focus states:

```jsx
<button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Accessible Button
</button>
```

### Color Contrast

- **Normal text**: Minimum 4.5:1 ratio
- **Large text** (18pt+): Minimum 3:1 ratio
- **UI components**: Minimum 3:1 ratio

### Touch Targets

Minimum touch target size: **44x44px**

```jsx
// Icon button with adequate touch target
<button className="h-11 w-11 inline-flex items-center justify-center">
  <Icon className="h-5 w-5" />
</button>
```

---

## Tenant Theming

### How It Works

1. **Default theme** is defined in `index.css`
2. **Tenant-specific overrides** are loaded dynamically
3. **CSS variables** are updated based on tenant configuration

### Implementation

```tsx
// Example: Load tenant theme
function applyTenantTheme(tenantConfig: TenantBranding) {
  const root = document.documentElement;

  if (tenantConfig.primaryColor) {
    root.style.setProperty('--primary', tenantConfig.primaryColor);
  }

  if (tenantConfig.fontFamily) {
    root.style.setProperty('--font-sans', tenantConfig.fontFamily);
  }

  // ... other customizations
}
```

### Customizable Properties

Tenants can customize:
- Primary/secondary brand colors
- Logo and favicon
- Font families
- Border radius (rounded vs. sharp corners)
- Spacing scale (compact vs. spacious)

---

## Design Tokens Export

For design tools (Figma, Sketch), export design tokens as JSON:

```json
{
  "colors": {
    "primary": {
      "value": "hsl(221.2, 83.2%, 53.3%)",
      "type": "color"
    }
  },
  "typography": {
    "heading-1": {
      "fontSize": "3rem",
      "lineHeight": "1",
      "fontWeight": "700"
    }
  }
}
```

---

## Component Library

See `/shared/components` for implementation of:
- Buttons (primary, secondary, ghost, destructive)
- Forms (input, textarea, select, checkbox, radio)
- Cards and panels
- Navigation (navbar, sidebar, breadcrumbs)
- Tables and data grids
- Modals and dialogs
- Toasts and notifications
- Loading states (skeletons, spinners)

All components follow this design system and support theming.

---

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [HSL Color Picker](https://hslpicker.com/)
