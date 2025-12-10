/**
 * ThemeProvider - Dynamic Tenant Theme System
 *
 * Applies tenant-specific theming via CSS custom properties.
 * Supports preset themes and custom configurations.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  TenantTheme,
  ThemeContextState,
  CSSVariableMap,
} from '../../../shared/theme/types';
import { themeToCSSVariables } from '../../../shared/theme/types';
import { createDefaultTheme } from '../../../shared/theme/presets';

// ============================================================================
// Theme Context
// ============================================================================

const ThemeContext = createContext<ThemeContextState | null>(null);

export function useTheme(): ThemeContextState {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// ============================================================================
// CSS Variable Application
// ============================================================================

function applyThemeVariables(variables: CSSVariableMap): void {
  const root = document.documentElement;
  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

function loadGoogleFonts(fonts: string[]): void {
  if (fonts.length === 0) return;

  const fontQuery = fonts.join('&family=');
  const linkId = 'theme-google-fonts';

  // Remove existing font link
  const existing = document.getElementById(linkId);
  if (existing) {
    existing.remove();
  }

  // Create new font link
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;
  document.head.appendChild(link);
}

function injectCustomCSS(css: string | undefined): void {
  const styleId = 'theme-custom-css';

  // Remove existing custom CSS
  const existing = document.getElementById(styleId);
  if (existing) {
    existing.remove();
  }

  if (!css) return;

  // Create new style element
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = css;
  document.head.appendChild(style);
}

// ============================================================================
// Local Storage Keys
// ============================================================================

const STORAGE_KEY_DARK_MODE = 'theme-dark-mode';

// ============================================================================
// Theme Provider Component
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode;
  /** Initial theme configuration (from tenant API) */
  initialTheme?: TenantTheme;
  /** Allow users to toggle dark mode */
  allowDarkMode?: boolean;
  /** Default to dark mode */
  defaultDarkMode?: boolean;
}

export function ThemeProvider({
  children,
  initialTheme,
  allowDarkMode = true,
  defaultDarkMode = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<TenantTheme>(
    initialTheme ?? createDefaultTheme()
  );

  const [isDarkMode, setIsDarkModeState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultDarkMode;

    // Check localStorage first
    const stored = localStorage.getItem(STORAGE_KEY_DARK_MODE);
    if (stored !== null) {
      return stored === 'true';
    }

    // Check system preference
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return true;
    }

    return defaultDarkMode;
  });

  // Apply theme when it changes
  useEffect(() => {
    const variables = themeToCSSVariables(theme, isDarkMode);
    applyThemeVariables(variables);

    // Apply dark mode class
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Load fonts
    if (theme.googleFonts) {
      loadGoogleFonts(theme.googleFonts);
    }

    // Inject custom CSS
    injectCustomCSS(theme.customCSS);
  }, [theme, isDarkMode]);

  // Listen for system theme changes
  useEffect(() => {
    if (!allowDarkMode) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set preference
      const stored = localStorage.getItem(STORAGE_KEY_DARK_MODE);
      if (stored === null) {
        setIsDarkModeState(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [allowDarkMode]);

  const setDarkMode = useCallback((dark: boolean) => {
    setIsDarkModeState(dark);
    localStorage.setItem(STORAGE_KEY_DARK_MODE, String(dark));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!isDarkMode);
  }, [isDarkMode, setDarkMode]);

  // Expose theme update function (for hot-reloading in admin preview)
  useEffect(() => {
    // @ts-expect-error - Expose for admin preview iframe communication
    window.__updateTheme = (newTheme: TenantTheme) => {
      setTheme(newTheme);
    };
    return () => {
      // @ts-expect-error - Cleanup
      delete window.__updateTheme;
    };
  }, []);

  const contextValue: ThemeContextState = {
    theme,
    isDarkMode,
    setDarkMode,
    toggleDarkMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// Dark Mode Toggle Component
// ============================================================================

import { Moon, Sun } from 'lucide-react';

export function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-md hover:bg-accent transition-colors"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}

// ============================================================================
// Theme Fetcher Hook (for loading tenant theme from API)
// ============================================================================

interface UseLoadTenantThemeResult {
  theme: TenantTheme | null;
  isLoading: boolean;
  error: Error | null;
}

export function useLoadTenantTheme(tenantId?: string): UseLoadTenantThemeResult {
  const [theme, setTheme] = useState<TenantTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTheme() {
      try {
        setIsLoading(true);
        setError(null);

        // TODO: Replace with actual API call
        // const response = await api.get(`/tenants/${tenantId}/theme`);
        // setTheme(response.data);

        // For now, use default theme
        setTheme(createDefaultTheme());
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load theme'));
        setTheme(createDefaultTheme());
      } finally {
        setIsLoading(false);
      }
    }

    fetchTheme();
  }, [tenantId]);

  return { theme, isLoading, error };
}
