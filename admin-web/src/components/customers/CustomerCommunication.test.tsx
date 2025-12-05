import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerCommunication, { CommunicationTemplate, CommunicationCampaign } from './CustomerCommunication';

describe('CustomerCommunication', () => {
  const mockTemplates: CommunicationTemplate[] = [
    {
      id: '1',
      name: 'Welcome Email',
      subject: 'Welcome to our store!',
      body: 'Thanks for joining us, {customer_name}!',
      type: 'email',
      category: 'transactional',
      createdAt: '2024-01-01',
    },
    {
      id: '2',
      name: 'Order Confirmation',
      subject: 'Your order {order_number}',
      body: 'Your order has been confirmed.',
      type: 'email',
      category: 'transactional',
      createdAt: '2024-01-02',
    },
  ];

  const mockCampaigns: CommunicationCampaign[] = [
    {
      id: '1',
      name: 'Summer Sale',
      templateId: '1',
      targetSegmentId: 'vip',
      status: 'sent',
      recipientCount: 500,
      openedCount: 350,
      clickedCount: 150,
      sentAt: '2024-06-01',
    },
    {
      id: '2',
      name: 'New Product Launch',
      templateId: '2',
      status: 'draft',
      recipientCount: 1000,
      openedCount: 0,
      clickedCount: 0,
    },
  ];

  const mockSegments = [
    { id: 'vip', name: 'VIP Customers', customerCount: 500 },
    { id: 'frequent', name: 'Frequent Buyers', customerCount: 1000 },
  ];

  it('renders customer communication component', () => {
    render(<CustomerCommunication />);

    expect(screen.getByTestId('customer-communication')).toBeInTheDocument();
    expect(screen.getByText('Customer Communication')).toBeInTheDocument();
  });

  it('displays campaigns tab by default', () => {
    render(<CustomerCommunication campaigns={mockCampaigns} />);

    expect(screen.getByText('Email & SMS Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Summer Sale')).toBeInTheDocument();
  });

  it('switches to templates tab', async () => {
    const user = userEvent.setup();
    render(<CustomerCommunication templates={mockTemplates} />);

    await user.click(screen.getByTestId('templates-tab'));

    expect(screen.getByText('Message Templates')).toBeInTheDocument();
    expect(screen.getByText('Welcome Email')).toBeInTheDocument();
  });

  it('displays campaign statistics correctly', () => {
    render(<CustomerCommunication campaigns={mockCampaigns} />);

    // Check recipient count
    expect(screen.getByTestId('campaign-1')).toHaveTextContent('500');
    // Check opened count and percentage
    expect(screen.getByTestId('campaign-1')).toHaveTextContent('350');
    expect(screen.getByTestId('campaign-1')).toHaveTextContent('70.0%');
    // Check clicked count and percentage
    expect(screen.getByTestId('campaign-1')).toHaveTextContent('150');
    expect(screen.getByTestId('campaign-1')).toHaveTextContent('30.0%');
  });

  it('displays campaign status badges', () => {
    render(<CustomerCommunication campaigns={mockCampaigns} />);

    const sentBadges = screen.getAllByText('Sent');
    expect(sentBadges.length).toBeGreaterThan(0);
    const draftBadges = screen.getAllByText('Draft');
    expect(draftBadges.length).toBeGreaterThan(0);
  });

  it('shows send button for draft campaigns', () => {
    render(<CustomerCommunication campaigns={mockCampaigns} />);

    expect(screen.getByTestId('send-campaign-2')).toBeInTheDocument();
    expect(screen.queryByTestId('send-campaign-1')).not.toBeInTheDocument();
  });

  it('calls onSendCampaign when send button is clicked', async () => {
    const user = userEvent.setup();
    const onSendCampaign = vi.fn();

    render(
      <CustomerCommunication
        campaigns={mockCampaigns}
        onSendCampaign={onSendCampaign}
      />
    );

    await user.click(screen.getByTestId('send-campaign-2'));

    expect(onSendCampaign).toHaveBeenCalledWith('2');
  });

  it('displays templates with correct information', async () => {
    const user = userEvent.setup();
    render(<CustomerCommunication templates={mockTemplates} />);

    await user.click(screen.getByTestId('templates-tab'));

    expect(screen.getByText('Welcome Email')).toBeInTheDocument();
    expect(screen.getByText('Welcome to our store!')).toBeInTheDocument();
    expect(screen.getByTestId('template-1')).toHaveTextContent('EMAIL');
    expect(screen.getByTestId('template-1')).toHaveTextContent('transactional');
  });

  it('opens create template dialog', async () => {
    const user = userEvent.setup();
    render(<CustomerCommunication />);

    await user.click(screen.getByTestId('templates-tab'));
    await user.click(screen.getByTestId('create-template-btn'));

    expect(screen.getByTestId('create-template-dialog')).toBeInTheDocument();
  });

  it('allows creating a new template', async () => {
    const user = userEvent.setup();
    const onCreateTemplate = vi.fn();

    render(<CustomerCommunication onCreateTemplate={onCreateTemplate} />);

    await user.click(screen.getByTestId('templates-tab'));
    await user.click(screen.getByTestId('create-template-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('create-template-dialog')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('template-name'), 'Test Template');
    await user.type(screen.getByTestId('template-subject'), 'Test Subject');
    await user.type(screen.getByTestId('template-body'), 'Test body content');

    await user.click(screen.getByTestId('save-template'));

    expect(onCreateTemplate).toHaveBeenCalledWith({
      name: 'Test Template',
      subject: 'Test Subject',
      body: 'Test body content',
      type: 'email',
      category: 'marketing',
    });
  });

  it('disables save template button when required fields are empty', async () => {
    const user = userEvent.setup();
    render(<CustomerCommunication />);

    await user.click(screen.getByTestId('templates-tab'));
    await user.click(screen.getByTestId('create-template-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('create-template-dialog')).toBeInTheDocument();
    });

    expect(screen.getByTestId('save-template')).toBeDisabled();

    await user.type(screen.getByTestId('template-name'), 'Test');
    expect(screen.getByTestId('save-template')).toBeDisabled();

    await user.type(screen.getByTestId('template-subject'), 'Subject');
    expect(screen.getByTestId('save-template')).toBeDisabled();

    await user.type(screen.getByTestId('template-body'), 'Body');
    expect(screen.getByTestId('save-template')).not.toBeDisabled();
  });

  it('opens create campaign dialog', async () => {
    const user = userEvent.setup();
    render(<CustomerCommunication />);

    await user.click(screen.getByTestId('create-campaign-btn'));

    expect(screen.getByTestId('create-campaign-dialog')).toBeInTheDocument();
  });

  it('allows creating a new campaign', async () => {
    const user = userEvent.setup();
    const onCreateCampaign = vi.fn();

    render(
      <CustomerCommunication
        templates={mockTemplates}
        segments={mockSegments}
        onCreateCampaign={onCreateCampaign}
      />
    );

    await user.click(screen.getByTestId('create-campaign-btn'));

    await user.type(screen.getByTestId('campaign-name'), 'Test Campaign');
    await user.selectOptions(screen.getByTestId('campaign-template'), '1');
    await user.selectOptions(screen.getByTestId('campaign-segment'), 'vip');

    await user.click(screen.getByTestId('save-campaign'));

    expect(onCreateCampaign).toHaveBeenCalledWith({
      name: 'Test Campaign',
      templateId: '1',
      targetSegmentId: 'vip',
      scheduledAt: undefined,
      status: 'draft',
      recipientCount: 500, // From VIP segment
    });
  });

  it('calculates recipient count from selected segment', async () => {
    const user = userEvent.setup();
    const onCreateCampaign = vi.fn();

    render(
      <CustomerCommunication
        templates={mockTemplates}
        segments={mockSegments}
        onCreateCampaign={onCreateCampaign}
      />
    );

    await user.click(screen.getByTestId('create-campaign-btn'));

    await user.type(screen.getByTestId('campaign-name'), 'Test Campaign');
    await user.selectOptions(screen.getByTestId('campaign-template'), '1');
    await user.selectOptions(screen.getByTestId('campaign-segment'), 'frequent');

    await user.click(screen.getByTestId('save-campaign'));

    expect(onCreateCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientCount: 1000, // From frequent segment
      })
    );
  });

  it('disables save campaign button when required fields are empty', async () => {
    const user = userEvent.setup();
    render(<CustomerCommunication templates={mockTemplates} />);

    await user.click(screen.getByTestId('create-campaign-btn'));

    expect(screen.getByTestId('save-campaign')).toBeDisabled();

    await user.type(screen.getByTestId('campaign-name'), 'Test');
    expect(screen.getByTestId('save-campaign')).toBeDisabled();

    await user.selectOptions(screen.getByTestId('campaign-template'), '1');
    expect(screen.getByTestId('save-campaign')).not.toBeDisabled();
  });

  it('shows empty state when no campaigns exist', () => {
    render(<CustomerCommunication campaigns={[]} />);

    expect(screen.getByText('No campaigns yet')).toBeInTheDocument();
    expect(screen.getByTestId('empty-create-campaign-btn')).toBeInTheDocument();
  });

  it('shows empty state when no templates exist', async () => {
    const user = userEvent.setup();
    render(<CustomerCommunication templates={[]} />);

    await user.click(screen.getByTestId('templates-tab'));

    expect(screen.getByText('No templates yet')).toBeInTheDocument();
    expect(screen.getByTestId('empty-create-template-btn')).toBeInTheDocument();
  });

  it('closes template dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<CustomerCommunication />);

    await user.click(screen.getByTestId('templates-tab'));
    await user.click(screen.getByTestId('create-template-btn'));

    expect(screen.getByTestId('create-template-dialog')).toBeInTheDocument();

    await user.click(screen.getByText('Cancel'));

    expect(screen.queryByTestId('create-template-dialog')).not.toBeInTheDocument();
  });

  it('closes campaign dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<CustomerCommunication />);

    await user.click(screen.getByTestId('create-campaign-btn'));

    expect(screen.getByTestId('create-campaign-dialog')).toBeInTheDocument();

    await user.click(screen.getByText('Cancel'));

    expect(screen.queryByTestId('create-campaign-dialog')).not.toBeInTheDocument();
  });

  it('allows changing template type', async () => {
    const user = userEvent.setup();
    const onCreateTemplate = vi.fn();

    render(<CustomerCommunication onCreateTemplate={onCreateTemplate} />);

    await user.click(screen.getByTestId('templates-tab'));
    await user.click(screen.getByTestId('create-template-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('create-template-dialog')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByTestId('template-type'), 'sms');
    await user.type(screen.getByTestId('template-name'), 'SMS Template');
    // SMS doesn't have subject field, so skip it
    await user.type(screen.getByTestId('template-body'), 'SMS content');

    await user.click(screen.getByTestId('save-template'));

    expect(onCreateTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'sms',
      })
    );
  });

  it('allows changing template category', async () => {
    const user = userEvent.setup();
    const onCreateTemplate = vi.fn();

    render(<CustomerCommunication onCreateTemplate={onCreateTemplate} />);

    await user.click(screen.getByTestId('templates-tab'));
    await user.click(screen.getByTestId('create-template-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('create-template-dialog')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByTestId('template-category'), 'notification');
    await user.type(screen.getByTestId('template-name'), 'Test Template');
    await user.type(screen.getByTestId('template-subject'), 'Subject');
    await user.type(screen.getByTestId('template-body'), 'Body');

    await user.click(screen.getByTestId('save-template'));

    expect(onCreateTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'notification',
      })
    );
  });

  it('displays template creation date', async () => {
    const user = userEvent.setup();
    render(<CustomerCommunication templates={mockTemplates} />);

    await user.click(screen.getByTestId('templates-tab'));

    const template1 = screen.getByTestId('template-1');
    const expectedDate = new Date('2024-01-01').toLocaleDateString();
    expect(template1).toHaveTextContent(expectedDate);
  });

  it('shows campaign scheduled date when applicable', () => {
    const scheduledCampaign: CommunicationCampaign = {
      id: '3',
      name: 'Scheduled Campaign',
      templateId: '1',
      status: 'scheduled',
      scheduledAt: '2024-12-25',
      recipientCount: 100,
      openedCount: 0,
      clickedCount: 0,
    };

    render(<CustomerCommunication campaigns={[scheduledCampaign]} />);

    const campaign3 = screen.getByTestId('campaign-3');
    const expectedDate = new Date('2024-12-25').toLocaleDateString();
    expect(campaign3).toHaveTextContent(expectedDate);
  });

  it('handles campaign with no segment selected', async () => {
    const user = userEvent.setup();
    const onCreateCampaign = vi.fn();

    render(
      <CustomerCommunication
        templates={mockTemplates}
        segments={mockSegments}
        onCreateCampaign={onCreateCampaign}
      />
    );

    await user.click(screen.getByTestId('create-campaign-btn'));

    await user.type(screen.getByTestId('campaign-name'), 'All Customers Campaign');
    await user.selectOptions(screen.getByTestId('campaign-template'), '1');
    // Don't select a segment (leave as "All customers")

    await user.click(screen.getByTestId('save-campaign'));

    expect(onCreateCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        targetSegmentId: undefined,
        recipientCount: 0,
      })
    );
  });
});
