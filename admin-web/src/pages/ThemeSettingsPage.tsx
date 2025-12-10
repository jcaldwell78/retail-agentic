/**
 * ThemeSettingsPage - Admin page for configuring store theme
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeEditor from '@/components/settings/ThemeEditor';
import type { TenantTheme } from '../../../shared/theme/types';

export default function ThemeSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTheme = async (theme: TenantTheme) => {
    setIsSaving(true);
    try {
      // TODO: Save theme to backend API
      console.log('Saving theme:', theme);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Success notification would go here
    } catch (error) {
      console.error('Failed to save theme:', error);
      // Error notification would go here
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewChange = (theme: TenantTheme) => {
    // For live preview, could send to an iframe or use postMessage
    // to communicate with a preview window
    console.log('Preview theme changed:', theme.name);
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="theme-settings-page">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/settings">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Settings
            </Button>
          </Link>
        </div>

        {/* Theme Editor */}
        <ThemeEditor
          onSave={handleSaveTheme}
          onPreviewChange={handlePreviewChange}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
