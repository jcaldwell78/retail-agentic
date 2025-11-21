# Design Documentation

This directory contains UI/UX design documentation, design systems, and visual guidelines for the retail platform.

## Contents

### Design System
- [Design System](./design-system.md) - Component library, typography, colors, spacing, and layout principles
- [Whitelabel System](./whitelabel.md) - Dynamic theming, tenant branding, and customization guidelines
- [Component Specifications](./components.md) - Detailed specifications for UI components

### Design Assets
- Figma files (link to be added)
- Design tokens
- Icon library
- Image assets

## Design Principles

### 1. Modern and Clean
- Minimalist aesthetic with focus on content
- Generous whitespace
- Clear visual hierarchy
- Consistent spacing and alignment

### 2. Accessibility First (WCAG 2.1 AA)
- Minimum 4.5:1 contrast ratio for text
- Keyboard navigation support
- Screen reader compatibility
- ARIA labels and semantic HTML

### 3. Responsive and Mobile-First
- Design for mobile screens first
- Progressively enhance for tablets and desktops
- Touch-friendly targets (minimum 44x44px)
- Fluid layouts and flexible grids

### 4. Whitelabel Ready
- Themeable color system using CSS custom properties
- Customizable typography
- Tenant-specific branding (logos, colors, fonts)
- Consistent component behavior across themes

### 5. Performance Conscious
- Optimized images and assets
- Lazy loading for off-screen content
- Minimal animation overhead
- Fast perceived performance

## Technology Stack

- **React 18+** - Component library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component primitives
- **Radix UI** - Headless UI components
- **Lucide React** - Icon system

## Component Library

The platform uses **shadcn/ui** built on top of **Radix UI** primitives:

- Pre-built accessible components
- Customizable via Tailwind CSS
- Copy-paste component source code
- No runtime dependency on shadcn/ui

### Core Components
- Button, Input, Select, Checkbox, Radio
- Card, Dialog, Popover, Tooltip
- Table, Tabs, Accordion
- Form validation
- Toast notifications

## Design Workflow

### For New Features

1. **Discovery** - Understand user needs and business requirements
2. **Wireframes** - Low-fidelity layouts and user flows
3. **Visual Design** - High-fidelity mockups with branding
4. **Prototype** - Interactive prototype for testing
5. **Handoff** - Detailed specs for frontend implementation
6. **Review** - Design QA during development

### Design → Development Handoff

Designers provide:
- Figma designs with component specifications
- Design tokens (colors, typography, spacing)
- Interaction details and micro-animations
- Responsive breakpoints and behavior
- Accessibility requirements

Frontend developers implement:
- Pixel-perfect components using Tailwind CSS
- Accessible markup with ARIA labels
- Responsive layouts matching designs
- Interactive states (hover, focus, active, disabled)

## Related Documentation

- [Frontend Development Guide](../development/frontend/README.md) - Implementation patterns
- [UI/UX Designer Agent](./.claude/agents/UI_UX_DESIGNER.md) - AI agent guidelines
- [Frontend Developer Agent](./.claude/agents/FRONTEND_DEVELOPER.md) - Implementation guidelines

## Design Resources

### Tools
- **Figma** - Primary design tool
- **Tailwind CSS IntelliSense** - VS Code extension
- **Contrast Checker** - Accessibility validation
- **Lighthouse** - Performance and accessibility audits

### References
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## For Designers

When creating designs:
1. Follow the established design system
2. Consider whitelabel theming requirements
3. Ensure WCAG 2.1 AA accessibility compliance
4. Design for mobile, tablet, and desktop breakpoints
5. Document interaction patterns and animations
6. Provide clear specifications for implementation
