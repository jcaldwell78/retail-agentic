import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Eye, Code, Save, RotateCcw } from 'lucide-react';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  category: 'order' | 'account' | 'marketing' | 'system';
  variables: string[];
  isDefault: boolean;
  lastModified: string;
}

interface EmailTemplateCustomizationProps {
  templates?: EmailTemplate[];
  onSaveTemplate?: (id: string, template: Partial<EmailTemplate>) => void;
  onResetTemplate?: (id: string) => void;
  onPreviewTemplate?: (id: string, template: Partial<EmailTemplate>) => void;
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: 'order-confirmation',
    name: 'Order Confirmation',
    subject: 'Order #{order_number} Confirmed',
    htmlContent: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6;">
  <h1>Thank you for your order!</h1>
  <p>Hi {customer_name},</p>
  <p>We've received your order #{order_number} and are getting it ready.</p>
  <h2>Order Details</h2>
  <p>{order_items}</p>
  <p><strong>Total: ${'{'}total_amount{'}'}</strong></p>
  <p>We'll send you another email when your order ships.</p>
  <p>Thanks,<br>{store_name}</p>
</body>
</html>`,
    textContent: 'Thank you for your order!\n\nHi {customer_name},\n\nWe\'ve received your order #{order_number}...',
    category: 'order',
    variables: ['customer_name', 'order_number', 'order_items', 'total_amount', 'store_name'],
    isDefault: true,
    lastModified: '2024-01-01',
  },
  {
    id: 'order-shipped',
    name: 'Order Shipped',
    subject: 'Your order #{order_number} has shipped',
    htmlContent: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6;">
  <h1>Your order is on its way!</h1>
  <p>Hi {customer_name},</p>
  <p>Great news! Your order #{order_number} has shipped.</p>
  <p><strong>Tracking Number:</strong> {tracking_number}</p>
  <p><strong>Carrier:</strong> {carrier_name}</p>
  <p>Track your package: <a href="{tracking_url}">Click here</a></p>
  <p>Thanks,<br>{store_name}</p>
</body>
</html>`,
    textContent: 'Your order is on its way!\n\nHi {customer_name},\n\nYour order #{order_number} has shipped...',
    category: 'order',
    variables: ['customer_name', 'order_number', 'tracking_number', 'carrier_name', 'tracking_url', 'store_name'],
    isDefault: true,
    lastModified: '2024-01-01',
  },
  {
    id: 'welcome-email',
    name: 'Welcome Email',
    subject: 'Welcome to {store_name}!',
    htmlContent: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6;">
  <h1>Welcome to {store_name}!</h1>
  <p>Hi {customer_name},</p>
  <p>Thanks for joining us! We're excited to have you as part of our community.</p>
  <p>As a welcome gift, here's a special discount code for your first order:</p>
  <p style="font-size: 24px; font-weight: bold; color: #007bff;">{discount_code}</p>
  <p>Happy shopping!</p>
  <p>Best regards,<br>{store_name} Team</p>
</body>
</html>`,
    textContent: 'Welcome to {store_name}!\n\nHi {customer_name},\n\nThanks for joining us...',
    category: 'account',
    variables: ['customer_name', 'store_name', 'discount_code'],
    isDefault: true,
    lastModified: '2024-01-01',
  },
  {
    id: 'password-reset',
    name: 'Password Reset',
    subject: 'Reset your password',
    htmlContent: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6;">
  <h1>Password Reset Request</h1>
  <p>Hi {customer_name},</p>
  <p>We received a request to reset your password. Click the button below to create a new password:</p>
  <p style="margin: 20px 0;">
    <a href="{reset_url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
  </p>
  <p>If you didn't request this, you can safely ignore this email.</p>
  <p>This link will expire in {expiry_hours} hours.</p>
  <p>Best regards,<br>{store_name} Team</p>
</body>
</html>`,
    textContent: 'Password Reset Request\n\nHi {customer_name},\n\nClick this link to reset your password: {reset_url}...',
    category: 'account',
    variables: ['customer_name', 'reset_url', 'expiry_hours', 'store_name'],
    isDefault: true,
    lastModified: '2024-01-01',
  },
];

export default function EmailTemplateCustomization({
  templates = defaultTemplates,
  onSaveTemplate,
  onResetTemplate,
  onPreviewTemplate,
}: EmailTemplateCustomizationProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(templates[0] || null);
  const [editedTemplate, setEditedTemplate] = useState<EmailTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSelectTemplate = (template: EmailTemplate) => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Do you want to discard them?')) {
        return;
      }
    }
    setSelectedTemplate(template);
    setEditedTemplate(null);
    setHasChanges(false);
  };

  const handleEdit = (field: keyof EmailTemplate, value: string) => {
    const current = editedTemplate || selectedTemplate;
    if (!current) return;

    const updated = { ...current, [field]: value };
    setEditedTemplate(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!selectedTemplate || !editedTemplate) return;

    onSaveTemplate?.(selectedTemplate.id, {
      subject: editedTemplate.subject,
      htmlContent: editedTemplate.htmlContent,
      textContent: editedTemplate.textContent,
    });

    setSelectedTemplate(editedTemplate);
    setEditedTemplate(null);
    setHasChanges(false);
  };

  const handleReset = () => {
    if (!selectedTemplate) return;

    if (confirm('Are you sure you want to reset this template to its default?')) {
      onResetTemplate?.(selectedTemplate.id);
      setEditedTemplate(null);
      setHasChanges(false);
    }
  };

  const handlePreview = () => {
    if (!selectedTemplate) return;

    const template = editedTemplate || selectedTemplate;
    onPreviewTemplate?.(selectedTemplate.id, template);
    setShowPreview(true);
  };

  const current = editedTemplate || selectedTemplate;

  const getCategoryColor = (category: EmailTemplate['category']) => {
    const colors = {
      order: 'bg-blue-100 text-blue-700',
      account: 'bg-green-100 text-green-700',
      marketing: 'bg-purple-100 text-purple-700',
      system: 'bg-gray-100 text-gray-700',
    };
    return colors[category];
  };

  return (
    <div className="space-y-6" data-testid="email-template-customization">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Email Template Customization</h2>
            <p className="text-sm text-gray-600">
              Customize email templates for your store
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Template List */}
        <div className="col-span-12 md:col-span-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Email Templates</h3>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                  data-testid={`template-${template.id}`}
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(template.category)}`}>
                      {template.category}
                    </span>
                    {!template.isDefault && (
                      <span className="text-xs text-orange-600">Modified</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Editor */}
        <div className="col-span-12 md:col-span-8">
          {current ? (
            <div className="space-y-4">
              {/* Template Info */}
              <Card className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{current.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Last modified: {new Date(current.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreview}
                      data-testid="preview-btn"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    {!current.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        data-testid="reset-btn"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium mb-2">Subject Line</label>
                  <Input
                    value={current.subject}
                    onChange={(e) => handleEdit('subject', e.target.value)}
                    data-testid="subject-input"
                  />
                </div>
              </Card>

              {/* Content Editor */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Email Content</h4>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'html' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('html')}
                      data-testid="html-mode-btn"
                    >
                      <Code className="w-4 h-4 mr-2" />
                      HTML
                    </Button>
                    <Button
                      variant={viewMode === 'text' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('text')}
                      data-testid="text-mode-btn"
                    >
                      Text
                    </Button>
                  </div>
                </div>

                {viewMode === 'html' ? (
                  <textarea
                    value={current.htmlContent}
                    onChange={(e) => handleEdit('htmlContent', e.target.value)}
                    className="w-full h-96 px-3 py-2 border rounded-md font-mono text-sm"
                    data-testid="html-editor"
                  />
                ) : (
                  <textarea
                    value={current.textContent}
                    onChange={(e) => handleEdit('textContent', e.target.value)}
                    className="w-full h-96 px-3 py-2 border rounded-md font-mono text-sm"
                    data-testid="text-editor"
                  />
                )}
              </Card>

              {/* Variables */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Available Variables</h4>
                <div className="flex flex-wrap gap-2">
                  {current.variables.map((variable) => (
                    <code
                      key={variable}
                      className="px-3 py-1 bg-gray-100 rounded text-sm font-mono"
                      data-testid={`variable-${variable}`}
                    >
                      {'{'}
                      {variable}
                      {'}'}
                    </code>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Use these variables in your template. They will be replaced with actual values when sending emails.
                </p>
              </Card>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div>
                  {hasChanges && (
                    <span className="text-sm text-orange-600 font-medium">Unsaved changes</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditedTemplate(null);
                      setHasChanges(false);
                    }}
                    disabled={!hasChanges}
                    data-testid="discard-btn"
                  >
                    Discard
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    data-testid="save-btn"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a template to customize</p>
            </Card>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && current && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          data-testid="preview-modal"
        >
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Email Preview</h3>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              <div className="mb-4 pb-4 border-b">
                <div className="text-sm text-gray-600">Subject:</div>
                <div className="font-medium">{current.subject}</div>
              </div>
              <div
                dangerouslySetInnerHTML={{ __html: current.htmlContent }}
                className="prose max-w-none"
                data-testid="preview-content"
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
