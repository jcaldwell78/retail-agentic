import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, MessageSquare, Send } from 'lucide-react';

export interface CommunicationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'email' | 'sms';
  category: 'marketing' | 'transactional' | 'notification';
  createdAt: string;
}

export interface CommunicationCampaign {
  id: string;
  name: string;
  templateId: string;
  targetSegmentId?: string;
  targetCustomerIds?: string[];
  scheduledAt?: string;
  sentAt?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  recipientCount: number;
  openedCount: number;
  clickedCount: number;
}

interface CustomerCommunicationProps {
  templates?: CommunicationTemplate[];
  campaigns?: CommunicationCampaign[];
  segments?: Array<{ id: string; name: string; customerCount: number }>;
  onCreateTemplate?: (template: Omit<CommunicationTemplate, 'id' | 'createdAt'>) => void;
  onCreateCampaign?: (campaign: Omit<CommunicationCampaign, 'id' | 'sentAt' | 'openedCount' | 'clickedCount'>) => void;
  onSendCampaign?: (campaignId: string) => void;
}

export default function CustomerCommunication({
  templates = [],
  campaigns = [],
  segments = [],
  onCreateTemplate,
  onCreateCampaign,
  onSendCampaign,
}: CustomerCommunicationProps) {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates'>('campaigns');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    body: '',
    type: 'email' as 'email' | 'sms',
    category: 'marketing' as 'marketing' | 'transactional' | 'notification',
  });

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    templateId: '',
    targetSegmentId: '',
    scheduledAt: '',
    status: 'draft' as 'draft' | 'scheduled',
    recipientCount: 0,
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject) return;

    onCreateTemplate?.(newTemplate);
    setNewTemplate({
      name: '',
      subject: '',
      body: '',
      type: 'email',
      category: 'marketing',
    });
    setShowTemplateDialog(false);
  };

  const handleCreateCampaign = () => {
    if (!newCampaign.name || !newCampaign.templateId) return;

    const selectedSegment = segments.find((s) => s.id === newCampaign.targetSegmentId);
    const recipientCount = selectedSegment?.customerCount || 0;

    onCreateCampaign?.({
      ...newCampaign,
      recipientCount,
      targetSegmentId: newCampaign.targetSegmentId || undefined,
      scheduledAt: newCampaign.scheduledAt || undefined,
    });
    setNewCampaign({
      name: '',
      templateId: '',
      targetSegmentId: '',
      scheduledAt: '',
      status: 'draft',
      recipientCount: 0,
    });
    setShowCampaignDialog(false);
  };

  const getStatusBadge = (status: CommunicationCampaign['status']) => {
    const variants = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      sending: 'bg-yellow-100 text-yellow-700',
      sent: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6" data-testid="customer-communication">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Customer Communication</h2>
            <p className="text-sm text-gray-600">
              Engage customers with targeted campaigns
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'campaigns'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            data-testid="campaigns-tab"
          >
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'templates'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            data-testid="templates-tab"
          >
            Templates
          </button>
        </div>
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Email & SMS Campaigns</h3>
            <Button onClick={() => setShowCampaignDialog(true)} data-testid="create-campaign-btn">
              <Send className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>

          {campaigns.length > 0 ? (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="p-5" data-testid={`campaign-${campaign.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{campaign.name}</h4>
                        {getStatusBadge(campaign.status)}
                      </div>

                      <div className="grid grid-cols-4 gap-4 mt-4">
                        <div>
                          <div className="text-sm text-gray-600">Recipients</div>
                          <div className="text-lg font-semibold">{campaign.recipientCount.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Opened</div>
                          <div className="text-lg font-semibold">
                            {campaign.openedCount.toLocaleString()}
                            <span className="text-sm text-gray-500 ml-1">
                              ({campaign.recipientCount > 0
                                ? ((campaign.openedCount / campaign.recipientCount) * 100).toFixed(1)
                                : 0}%)
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Clicked</div>
                          <div className="text-lg font-semibold">
                            {campaign.clickedCount.toLocaleString()}
                            <span className="text-sm text-gray-500 ml-1">
                              ({campaign.recipientCount > 0
                                ? ((campaign.clickedCount / campaign.recipientCount) * 100).toFixed(1)
                                : 0}%)
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">
                            {campaign.sentAt ? 'Sent' : campaign.scheduledAt ? 'Scheduled' : 'Created'}
                          </div>
                          <div className="text-sm font-medium">
                            {campaign.sentAt
                              ? new Date(campaign.sentAt).toLocaleDateString()
                              : campaign.scheduledAt
                              ? new Date(campaign.scheduledAt).toLocaleDateString()
                              : 'Draft'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {campaign.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => onSendCampaign?.(campaign.id)}
                        data-testid={`send-campaign-${campaign.id}`}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Now
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Create your first campaign to engage with your customers
              </p>
              <Button onClick={() => setShowCampaignDialog(true)} data-testid="empty-create-campaign-btn">
                Create Campaign
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Message Templates</h3>
            <Button onClick={() => setShowTemplateDialog(true)} data-testid="create-template-btn">
              + New Template
            </Button>
          </div>

          {templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="p-5" data-testid={`template-${template.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold">{template.name}</h4>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {template.type.toUpperCase()}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {template.category}
                        </span>
                      </div>
                    </div>
                    {template.type === 'email' ? (
                      <Mail className="w-5 h-5 text-gray-400" />
                    ) : (
                      <MessageSquare className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {template.type === 'email' && (
                      <div>
                        <div className="text-gray-600">Subject:</div>
                        <div className="font-medium">{template.subject}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-gray-600">Message:</div>
                      <div className="text-gray-900 line-clamp-3">{template.body}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                    Created {new Date(template.createdAt).toLocaleDateString()}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Create reusable templates for your campaigns
              </p>
              <Button onClick={() => setShowTemplateDialog(true)} data-testid="empty-create-template-btn">
                Create Template
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Create Template Dialog */}
      {showTemplateDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          data-testid="create-template-dialog"
        >
          <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Message Template</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Template Name *</label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                  data-testid="template-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type *</label>
                  <select
                    value={newTemplate.type}
                    onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value as 'email' | 'sms' })}
                    className="w-full px-3 py-2 border rounded-md"
                    data-testid="template-type"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) =>
                      setNewTemplate({
                        ...newTemplate,
                        category: e.target.value as 'marketing' | 'transactional' | 'notification',
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    data-testid="template-category"
                  >
                    <option value="marketing">Marketing</option>
                    <option value="transactional">Transactional</option>
                    <option value="notification">Notification</option>
                  </select>
                </div>
              </div>

              {newTemplate.type === 'email' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Subject *</label>
                  <Input
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    placeholder="Email subject line"
                    data-testid="template-subject"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Message Body *
                  <span className="text-gray-500 text-xs ml-2">
                    (Use {'{customer_name}'}, {'{order_number}'}, etc. for personalization)
                  </span>
                </label>
                <textarea
                  value={newTemplate.body}
                  onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                  placeholder="Your message content..."
                  rows={8}
                  className="w-full px-3 py-2 border rounded-md"
                  data-testid="template-body"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateTemplate}
                  disabled={!newTemplate.name || !newTemplate.subject || !newTemplate.body}
                  className="flex-1"
                  data-testid="save-template"
                >
                  Create Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTemplateDialog(false);
                    setNewTemplate({
                      name: '',
                      subject: '',
                      body: '',
                      type: 'email',
                      category: 'marketing',
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create Campaign Dialog */}
      {showCampaignDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          data-testid="create-campaign-dialog"
        >
          <Card className="w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Create Campaign</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Name *</label>
                <Input
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="e.g., Summer Sale Announcement"
                  data-testid="campaign-name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Select Template *</label>
                <select
                  value={newCampaign.templateId}
                  onChange={(e) => setNewCampaign({ ...newCampaign, templateId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  data-testid="campaign-template"
                >
                  <option value="">Choose a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target Segment (Optional)</label>
                <select
                  value={newCampaign.targetSegmentId}
                  onChange={(e) => setNewCampaign({ ...newCampaign, targetSegmentId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  data-testid="campaign-segment"
                >
                  <option value="">All customers</option>
                  {segments.map((segment) => (
                    <option key={segment.id} value={segment.id}>
                      {segment.name} ({segment.customerCount.toLocaleString()} customers)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  value={newCampaign.scheduledAt}
                  onChange={(e) => setNewCampaign({ ...newCampaign, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  data-testid="campaign-schedule"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to save as draft
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateCampaign}
                  disabled={!newCampaign.name || !newCampaign.templateId}
                  className="flex-1"
                  data-testid="save-campaign"
                >
                  {newCampaign.scheduledAt ? 'Schedule Campaign' : 'Create Draft'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCampaignDialog(false);
                    setNewCampaign({
                      name: '',
                      templateId: '',
                      targetSegmentId: '',
                      scheduledAt: '',
                      status: 'draft',
                      recipientCount: 0,
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
