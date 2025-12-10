/**
 * ThemeEditor - Tenant Theme Configuration Component
 *
 * Allows admins to:
 * 1. Select from 5 preset themes
 * 2. Customize individual parameters
 * 3. Preview changes in real-time
 */

import { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Palette,
  Type,
  Layout,
  Sparkles,
  Eye,
  Check,
  RotateCcw,
  Save,
  Sun,
  Moon,
} from 'lucide-react';
import type {
  TenantTheme,
  ThemePreset,
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeEffects,
  ThemeHero,
} from '../../../../shared/theme/types';
import { themePresets, getPresetTheme, createDefaultTheme } from '../../../../shared/theme/presets';

// ============================================================================
// Types
// ============================================================================

export interface ThemeEditorProps {
  /** Current theme configuration */
  currentTheme?: TenantTheme;
  /** Callback when theme is saved */
  onSave?: (theme: TenantTheme) => void;
  /** Callback for real-time preview updates */
  onPreviewChange?: (theme: TenantTheme) => void;
  /** Whether save is in progress */
  isSaving?: boolean;
}

// ============================================================================
// Color Utilities
// ============================================================================

function hslToHex(hsl: string): string {
  const parts = hsl.split(' ').map((p) => parseFloat(p));
  if (parts.length < 3) return '#000000';

  const h = parts[0];
  const s = parts[1] / 100;
  const l = parts[2] / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// ============================================================================
// Preset Card Component
// ============================================================================

interface PresetCardProps {
  preset: ThemePreset;
  isSelected: boolean;
  onSelect: () => void;
}

function PresetCard({ preset, isSelected, onSelect }: PresetCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`relative text-left p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-blue-600 bg-blue-50 shadow-md'
          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
      }`}
      data-testid={`preset-${preset.id}`}
    >
      {/* Color Preview */}
      <div className="flex gap-2 mb-3">
        <div
          className="w-10 h-10 rounded-full border-2 border-white shadow"
          style={{ backgroundColor: preset.preview.primaryColor }}
        />
        <div
          className="w-10 h-10 rounded-full border-2 border-white shadow"
          style={{ backgroundColor: preset.preview.accentColor }}
        />
        <div
          className="flex-1 h-10 rounded-lg flex items-center justify-center text-xs border"
          style={{
            fontFamily: `${preset.preview.fontPreview}, serif`,
            backgroundColor: preset.preview.primaryColor,
            color: '#fff',
          }}
        >
          Aa
        </div>
      </div>

      {/* Name & Description */}
      <h4 className="font-semibold text-gray-900">{preset.name}</h4>
      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{preset.description}</p>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </button>
  );
}

// ============================================================================
// Color Picker Field
// ============================================================================

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId?: string;
}

function ColorField({ label, value, onChange, testId }: ColorFieldProps) {
  const hexValue = hslToHex(value);

  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          value={hexValue}
          onChange={(e) => onChange(hexToHsl(e.target.value))}
          className="h-10 w-14 rounded border cursor-pointer"
          data-testid={testId}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-sm"
          placeholder="0 0% 0%"
        />
      </div>
    </div>
  );
}

// ============================================================================
// Main Theme Editor Component
// ============================================================================

export default function ThemeEditor({
  currentTheme,
  onSave,
  onPreviewChange,
  isSaving = false,
}: ThemeEditorProps) {
  const [theme, setTheme] = useState<TenantTheme>(
    currentTheme ?? createDefaultTheme()
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
    currentTheme?.aesthetic ?? 'luxury-minimal'
  );
  const [isCustomized, setIsCustomized] = useState(false);
  const [previewDarkMode, setPreviewDarkMode] = useState(false);
  const [saved, setSaved] = useState(false);

  // Notify parent of preview changes
  useEffect(() => {
    onPreviewChange?.(theme);
  }, [theme, onPreviewChange]);

  // Select a preset theme
  const handlePresetSelect = useCallback((presetId: string) => {
    const preset = getPresetTheme(presetId);
    if (!preset) return;

    const now = new Date().toISOString();
    setTheme({
      id: `theme-${presetId}`,
      ...preset.theme,
      createdAt: now,
      updatedAt: now,
    });
    setSelectedPresetId(presetId);
    setIsCustomized(false);
  }, []);

  // Update colors
  const updateColor = useCallback((colorKey: keyof ThemeColors, value: string) => {
    setTheme((prev) => ({
      ...prev,
      colors: { ...prev.colors, [colorKey]: value },
      updatedAt: new Date().toISOString(),
    }));
    setIsCustomized(true);
  }, []);

  // Update dark mode colors
  const updateDarkColor = useCallback((colorKey: keyof ThemeColors, value: string) => {
    setTheme((prev) => ({
      ...prev,
      colorsDark: { ...prev.colorsDark, [colorKey]: value },
      updatedAt: new Date().toISOString(),
    }));
    setIsCustomized(true);
  }, []);

  // Update typography
  const updateTypography = useCallback(
    <K extends keyof ThemeTypography>(key: K, value: ThemeTypography[K]) => {
      setTheme((prev) => ({
        ...prev,
        typography: { ...prev.typography, [key]: value },
        updatedAt: new Date().toISOString(),
      }));
      setIsCustomized(true);
    },
    []
  );

  // Update spacing
  const updateSpacing = useCallback(
    <K extends keyof ThemeSpacing>(key: K, value: ThemeSpacing[K]) => {
      setTheme((prev) => ({
        ...prev,
        spacing: { ...prev.spacing, [key]: value },
        updatedAt: new Date().toISOString(),
      }));
      setIsCustomized(true);
    },
    []
  );

  // Update effects
  const updateEffects = useCallback(
    <K extends keyof ThemeEffects>(key: K, value: ThemeEffects[K]) => {
      setTheme((prev) => ({
        ...prev,
        effects: { ...prev.effects, [key]: value },
        updatedAt: new Date().toISOString(),
      }));
      setIsCustomized(true);
    },
    []
  );

  // Update hero
  const updateHero = useCallback(
    <K extends keyof ThemeHero>(key: K, value: ThemeHero[K]) => {
      setTheme((prev) => ({
        ...prev,
        hero: { ...prev.hero, [key]: value },
        updatedAt: new Date().toISOString(),
      }));
      setIsCustomized(true);
    },
    []
  );

  // Reset to preset
  const handleReset = useCallback(() => {
    if (selectedPresetId) {
      handlePresetSelect(selectedPresetId);
    }
  }, [selectedPresetId, handlePresetSelect]);

  // Save theme
  const handleSave = useCallback(() => {
    const finalTheme: TenantTheme = {
      ...theme,
      aesthetic: isCustomized ? 'custom' : (selectedPresetId as TenantTheme['aesthetic']),
      updatedAt: new Date().toISOString(),
    };
    onSave?.(finalTheme);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [theme, isCustomized, selectedPresetId, onSave]);

  return (
    <div className="space-y-6" data-testid="theme-editor">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Palette className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Store Theme</h2>
            <p className="text-sm text-gray-600">
              Customize your storefront appearance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewDarkMode(!previewDarkMode)}
            data-testid="toggle-preview-mode"
          >
            {previewDarkMode ? (
              <Sun className="w-4 h-4 mr-2" />
            ) : (
              <Moon className="w-4 h-4 mr-2" />
            )}
            {previewDarkMode ? 'Light Preview' : 'Dark Preview'}
          </Button>
        </div>
      </div>

      {/* Preset Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Choose a Theme Style
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {themePresets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isSelected={selectedPresetId === preset.id && !isCustomized}
              onSelect={() => handlePresetSelect(preset.id)}
            />
          ))}
        </div>
        {isCustomized && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <span className="text-sm text-amber-800">
              Theme has been customized from the base preset
            </span>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Preset
            </Button>
          </div>
        )}
      </Card>

      {/* Customization Tabs */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Layout className="w-5 h-5" />
          Customize Parameters
          <span className="text-sm font-normal text-gray-500 ml-2">
            (optional)
          </span>
        </h3>

        <Tabs defaultValue="colors" className="space-y-4">
          <TabsList>
            <TabsTrigger value="colors" data-testid="tab-colors">
              <Palette className="w-4 h-4 mr-2" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="typography" data-testid="tab-typography">
              <Type className="w-4 h-4 mr-2" />
              Typography
            </TabsTrigger>
            <TabsTrigger value="layout" data-testid="tab-layout">
              <Layout className="w-4 h-4 mr-2" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="effects" data-testid="tab-effects">
              <Sparkles className="w-4 h-4 mr-2" />
              Effects
            </TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Light Mode Colors */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  Light Mode
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <ColorField
                    label="Background"
                    value={theme.colors.background}
                    onChange={(v) => updateColor('background', v)}
                    testId="color-background"
                  />
                  <ColorField
                    label="Foreground"
                    value={theme.colors.foreground}
                    onChange={(v) => updateColor('foreground', v)}
                    testId="color-foreground"
                  />
                  <ColorField
                    label="Primary"
                    value={theme.colors.primary}
                    onChange={(v) => updateColor('primary', v)}
                    testId="color-primary"
                  />
                  <ColorField
                    label="Accent"
                    value={theme.colors.accent}
                    onChange={(v) => updateColor('accent', v)}
                    testId="color-accent"
                  />
                  <ColorField
                    label="Secondary"
                    value={theme.colors.secondary}
                    onChange={(v) => updateColor('secondary', v)}
                    testId="color-secondary"
                  />
                  <ColorField
                    label="Muted"
                    value={theme.colors.muted}
                    onChange={(v) => updateColor('muted', v)}
                    testId="color-muted"
                  />
                  <ColorField
                    label="Border"
                    value={theme.colors.border}
                    onChange={(v) => updateColor('border', v)}
                    testId="color-border"
                  />
                  <ColorField
                    label="Ring (Focus)"
                    value={theme.colors.ring}
                    onChange={(v) => updateColor('ring', v)}
                    testId="color-ring"
                  />
                </div>
              </div>

              {/* Dark Mode Colors */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  Dark Mode
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <ColorField
                    label="Background"
                    value={theme.colorsDark?.background ?? theme.colors.background}
                    onChange={(v) => updateDarkColor('background', v)}
                    testId="dark-color-background"
                  />
                  <ColorField
                    label="Foreground"
                    value={theme.colorsDark?.foreground ?? theme.colors.foreground}
                    onChange={(v) => updateDarkColor('foreground', v)}
                    testId="dark-color-foreground"
                  />
                  <ColorField
                    label="Primary"
                    value={theme.colorsDark?.primary ?? theme.colors.primary}
                    onChange={(v) => updateDarkColor('primary', v)}
                    testId="dark-color-primary"
                  />
                  <ColorField
                    label="Accent"
                    value={theme.colorsDark?.accent ?? theme.colors.accent}
                    onChange={(v) => updateDarkColor('accent', v)}
                    testId="dark-color-accent"
                  />
                  <ColorField
                    label="Border"
                    value={theme.colorsDark?.border ?? theme.colors.border}
                    onChange={(v) => updateDarkColor('border', v)}
                    testId="dark-color-border"
                  />
                  <ColorField
                    label="Card"
                    value={theme.colorsDark?.card ?? theme.colors.card}
                    onChange={(v) => updateDarkColor('card', v)}
                    testId="dark-color-card"
                  />
                </div>
              </div>
            </div>

            {/* Hero Gradient Colors */}
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">Hero Section</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ColorField
                  label="Gradient Start"
                  value={theme.hero.gradientStart}
                  onChange={(v) => updateHero('gradientStart', v)}
                  testId="hero-gradient-start"
                />
                <ColorField
                  label="Gradient End"
                  value={theme.hero.gradientEnd}
                  onChange={(v) => updateHero('gradientEnd', v)}
                  testId="hero-gradient-end"
                />
                <div className="space-y-1">
                  <Label className="text-sm">Gradient Angle</Label>
                  <Input
                    type="number"
                    min={0}
                    max={360}
                    value={theme.hero.gradientAngle}
                    onChange={(e) =>
                      updateHero('gradientAngle', parseInt(e.target.value) || 0)
                    }
                    data-testid="hero-gradient-angle"
                  />
                </div>
                <ColorField
                  label="Text Color"
                  value={theme.hero.textColor}
                  onChange={(v) => updateHero('textColor', v)}
                  testId="hero-text-color"
                />
              </div>
            </div>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Display Font (Headings)</Label>
                <Input
                  value={theme.typography.fontDisplay}
                  onChange={(e) => updateTypography('fontDisplay', e.target.value)}
                  placeholder='"Playfair Display", serif'
                  data-testid="font-display"
                />
                <p className="text-xs text-gray-500">
                  Used for h1-h6 headings
                </p>
              </div>
              <div className="space-y-2">
                <Label>Body Font</Label>
                <Input
                  value={theme.typography.fontBody}
                  onChange={(e) => updateTypography('fontBody', e.target.value)}
                  placeholder='"Inter", sans-serif'
                  data-testid="font-body"
                />
                <p className="text-xs text-gray-500">
                  Used for paragraphs and UI text
                </p>
              </div>
              <div className="space-y-2">
                <Label>Monospace Font</Label>
                <Input
                  value={theme.typography.fontMono}
                  onChange={(e) => updateTypography('fontMono', e.target.value)}
                  placeholder='"Fira Code", monospace'
                  data-testid="font-mono"
                />
                <p className="text-xs text-gray-500">
                  Used for code and data
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Base Font Size (px)</Label>
                <Input
                  type="number"
                  min={12}
                  max={24}
                  value={theme.typography.fontSizeBase}
                  onChange={(e) =>
                    updateTypography('fontSizeBase', parseInt(e.target.value) || 16)
                  }
                  data-testid="font-size-base"
                />
              </div>
              <div className="space-y-2">
                <Label>Line Height</Label>
                <Input
                  type="number"
                  min={1}
                  max={2.5}
                  step={0.05}
                  value={theme.typography.lineHeightBase}
                  onChange={(e) =>
                    updateTypography('lineHeightBase', parseFloat(e.target.value) || 1.5)
                  }
                  data-testid="line-height"
                />
              </div>
              <div className="space-y-2">
                <Label>Heading Weight</Label>
                <Select
                  value={String(theme.typography.fontWeightHeadings)}
                  onValueChange={(v) => updateTypography('fontWeightHeadings', parseInt(v))}
                >
                  <SelectTrigger data-testid="heading-weight">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400">400 (Normal)</SelectItem>
                    <SelectItem value="500">500 (Medium)</SelectItem>
                    <SelectItem value="600">600 (Semi-bold)</SelectItem>
                    <SelectItem value="700">700 (Bold)</SelectItem>
                    <SelectItem value="800">800 (Extra-bold)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Letter Spacing (Headings)</Label>
                <Input
                  value={theme.typography.letterSpacingHeadings}
                  onChange={(e) =>
                    updateTypography('letterSpacingHeadings', e.target.value)
                  }
                  placeholder="-0.02em"
                  data-testid="letter-spacing"
                />
              </div>
            </div>

            {/* Font Preview */}
            <div className="border rounded-lg p-6 bg-gray-50">
              <h5 className="text-sm font-medium text-gray-500 mb-4">Preview</h5>
              <div
                style={{
                  fontFamily: theme.typography.fontDisplay,
                  fontSize: '2rem',
                  fontWeight: theme.typography.fontWeightHeadings,
                  letterSpacing: theme.typography.letterSpacingHeadings,
                }}
              >
                Heading Text Preview
              </div>
              <div
                style={{
                  fontFamily: theme.typography.fontBody,
                  fontSize: `${theme.typography.fontSizeBase}px`,
                  lineHeight: theme.typography.lineHeightBase,
                }}
                className="mt-2 text-gray-600"
              >
                Body text preview. The quick brown fox jumps over the lazy dog.
                This is how your product descriptions and content will appear.
              </div>
            </div>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Border Radius (rem)</Label>
                <Input
                  type="number"
                  min={0}
                  max={2}
                  step={0.125}
                  value={theme.spacing.borderRadius}
                  onChange={(e) =>
                    updateSpacing('borderRadius', parseFloat(e.target.value) || 0)
                  }
                  data-testid="border-radius"
                />
                <p className="text-xs text-gray-500">
                  0 = sharp corners, 1 = rounded
                </p>
              </div>
              <div className="space-y-2">
                <Label>Container Max Width</Label>
                <Input
                  value={theme.spacing.containerMaxWidth}
                  onChange={(e) => updateSpacing('containerMaxWidth', e.target.value)}
                  placeholder="1280px"
                  data-testid="container-max-width"
                />
              </div>
              <div className="space-y-2">
                <Label>Section Padding</Label>
                <Input
                  value={theme.spacing.sectionPadding}
                  onChange={(e) => updateSpacing('sectionPadding', e.target.value)}
                  placeholder="5rem"
                  data-testid="section-padding"
                />
              </div>
            </div>

            {/* Layout Preview */}
            <div className="border rounded-lg p-6 bg-gray-50">
              <h5 className="text-sm font-medium text-gray-500 mb-4">Preview</h5>
              <div className="flex gap-4 items-center">
                <div
                  className="w-20 h-12 bg-blue-600"
                  style={{ borderRadius: `${theme.spacing.borderRadius}rem` }}
                />
                <div
                  className="w-20 h-12 bg-blue-600"
                  style={{ borderRadius: `${theme.spacing.borderRadius}rem` }}
                />
                <div
                  className="w-20 h-12 bg-blue-600"
                  style={{ borderRadius: `${theme.spacing.borderRadius}rem` }}
                />
                <span className="text-sm text-gray-500">
                  Border radius: {theme.spacing.borderRadius}rem
                </span>
              </div>
            </div>
          </TabsContent>

          {/* Effects Tab */}
          <TabsContent value="effects" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Shadow Style</Label>
                  <Select
                    value={theme.effects.shadowStyle}
                    onValueChange={(v) =>
                      updateEffects('shadowStyle', v as ThemeEffects['shadowStyle'])
                    }
                  >
                    <SelectTrigger data-testid="shadow-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="subtle">Subtle</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="dramatic">Dramatic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Animation Speed</Label>
                  <Input
                    type="number"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={theme.effects.animationSpeed}
                    onChange={(e) =>
                      updateEffects('animationSpeed', parseFloat(e.target.value) || 1)
                    }
                    data-testid="animation-speed"
                  />
                  <p className="text-xs text-gray-500">
                    0.5 = fast, 1 = normal, 2 = slow
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={theme.effects.enableBackdropBlur}
                    onChange={(e) =>
                      updateEffects('enableBackdropBlur', e.target.checked)
                    }
                    className="w-4 h-4 rounded"
                    data-testid="enable-backdrop-blur"
                  />
                  <span className="text-sm font-medium">Enable backdrop blur effects</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={theme.effects.enableGradients}
                    onChange={(e) =>
                      updateEffects('enableGradients', e.target.checked)
                    }
                    className="w-4 h-4 rounded"
                    data-testid="enable-gradients"
                  />
                  <span className="text-sm font-medium">Enable gradient backgrounds</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={theme.effects.enablePageTransitions}
                    onChange={(e) =>
                      updateEffects('enablePageTransitions', e.target.checked)
                    }
                    className="w-4 h-4 rounded"
                    data-testid="enable-page-transitions"
                  />
                  <span className="text-sm font-medium">Enable page transitions</span>
                </label>
              </div>
            </div>

            {/* Shadow Preview */}
            <div className="border rounded-lg p-6 bg-gray-50">
              <h5 className="text-sm font-medium text-gray-500 mb-4">Shadow Preview</h5>
              <div className="flex gap-6 items-center">
                {(['none', 'subtle', 'medium', 'dramatic'] as const).map((style) => (
                  <div
                    key={style}
                    className={`w-24 h-24 bg-white rounded-lg flex items-center justify-center text-xs capitalize ${
                      style === theme.effects.shadowStyle
                        ? 'ring-2 ring-blue-500'
                        : ''
                    }`}
                    style={{
                      boxShadow:
                        style === 'none'
                          ? 'none'
                          : style === 'subtle'
                          ? '0 1px 3px rgba(0,0,0,0.1)'
                          : style === 'medium'
                          ? '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                          : '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                    }}
                  >
                    {style}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Live Preview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Live Preview
        </h3>
        <div
          className="rounded-lg overflow-hidden border"
          style={{
            background: previewDarkMode
              ? `hsl(${theme.colorsDark?.background ?? theme.colors.background})`
              : `hsl(${theme.colors.background})`,
            color: previewDarkMode
              ? `hsl(${theme.colorsDark?.foreground ?? theme.colors.foreground})`
              : `hsl(${theme.colors.foreground})`,
          }}
        >
          {/* Hero Preview */}
          <div
            className="p-8 text-center"
            style={{
              background: `linear-gradient(${theme.hero.gradientAngle}deg, hsl(${theme.hero.gradientStart}), hsl(${theme.hero.gradientEnd}))`,
              color: `hsl(${theme.hero.textColor})`,
            }}
          >
            <h2
              style={{
                fontFamily: theme.typography.fontDisplay,
                fontWeight: theme.typography.fontWeightHeadings,
                letterSpacing: theme.typography.letterSpacingHeadings,
                fontSize: '1.75rem',
              }}
            >
              Your Store Name
            </h2>
            <p
              className="mt-2 opacity-90"
              style={{ fontFamily: theme.typography.fontBody }}
            >
              Discover our exclusive collection
            </p>
          </div>

          {/* Content Preview */}
          <div className="p-6 space-y-4">
            <div className="flex gap-4">
              {/* Product Card Preview */}
              <div
                className="flex-1 p-4 rounded"
                style={{
                  background: previewDarkMode
                    ? `hsl(${theme.colorsDark?.card ?? theme.colors.card})`
                    : `hsl(${theme.colors.card})`,
                  borderRadius: `${theme.spacing.borderRadius}rem`,
                  boxShadow:
                    theme.effects.shadowStyle === 'none'
                      ? 'none'
                      : theme.effects.shadowStyle === 'subtle'
                      ? '0 1px 3px rgba(0,0,0,0.1)'
                      : theme.effects.shadowStyle === 'medium'
                      ? '0 4px 6px -1px rgba(0,0,0,0.1)'
                      : '0 20px 25px -5px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  className="w-full h-24 mb-3 rounded"
                  style={{
                    background: `hsl(${theme.colors.muted})`,
                    borderRadius: `${theme.spacing.borderRadius}rem`,
                  }}
                />
                <div
                  style={{
                    fontFamily: theme.typography.fontDisplay,
                    fontWeight: theme.typography.fontWeightHeadings,
                  }}
                >
                  Product Name
                </div>
                <div
                  className="text-sm mt-1"
                  style={{
                    fontFamily: theme.typography.fontBody,
                    color: `hsl(${theme.colors.mutedForeground})`,
                  }}
                >
                  $129.00
                </div>
                <button
                  className="mt-3 w-full py-2 px-4 text-sm font-medium"
                  style={{
                    background: `hsl(${theme.colors.primary})`,
                    color: `hsl(${theme.colors.primaryForeground})`,
                    borderRadius: `${theme.spacing.borderRadius}rem`,
                    fontFamily: theme.typography.fontBody,
                  }}
                >
                  Add to Cart
                </button>
              </div>

              {/* Another Product Card */}
              <div
                className="flex-1 p-4 rounded"
                style={{
                  background: previewDarkMode
                    ? `hsl(${theme.colorsDark?.card ?? theme.colors.card})`
                    : `hsl(${theme.colors.card})`,
                  borderRadius: `${theme.spacing.borderRadius}rem`,
                  boxShadow:
                    theme.effects.shadowStyle === 'none'
                      ? 'none'
                      : theme.effects.shadowStyle === 'subtle'
                      ? '0 1px 3px rgba(0,0,0,0.1)'
                      : '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  className="w-full h-24 mb-3 rounded"
                  style={{
                    background: `hsl(${theme.colors.muted})`,
                    borderRadius: `${theme.spacing.borderRadius}rem`,
                  }}
                />
                <div
                  style={{
                    fontFamily: theme.typography.fontDisplay,
                    fontWeight: theme.typography.fontWeightHeadings,
                  }}
                >
                  Another Product
                </div>
                <div
                  className="text-sm mt-1"
                  style={{
                    fontFamily: theme.typography.fontBody,
                    color: `hsl(${theme.colors.mutedForeground})`,
                  }}
                >
                  $89.00
                </div>
                <button
                  className="mt-3 w-full py-2 px-4 text-sm font-medium"
                  style={{
                    background: `hsl(${theme.colors.accent})`,
                    color: `hsl(${theme.colors.accentForeground})`,
                    borderRadius: `${theme.spacing.borderRadius}rem`,
                    fontFamily: theme.typography.fontBody,
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        {isCustomized && (
          <Button variant="outline" onClick={handleReset} data-testid="reset-btn">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Preset
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving} data-testid="save-theme-btn">
          {isSaving ? (
            'Saving...'
          ) : saved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Theme
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
