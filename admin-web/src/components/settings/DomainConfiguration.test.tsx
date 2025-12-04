import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DomainConfiguration, { DomainConfig } from './DomainConfiguration';

describe('DomainConfiguration', () => {
  const mockDomains: DomainConfig[] = [
    {
      id: 'domain-1',
      domain: 'primary.example.com',
      type: 'primary',
      verified: true,
      sslEnabled: true,
      redirectToHttps: true,
      createdAt: '2024-01-01',
    },
    {
      id: 'domain-2',
      domain: 'shop.example.com',
      type: 'alias',
      verified: false,
      sslEnabled: true,
      redirectToHttps: true,
      createdAt: '2024-02-01',
      verificationCode: 'verify-123',
      dnsRecords: [
        {
          type: 'A',
          name: '@',
          value: '192.168.1.1',
          status: 'pending',
        },
        {
          type: 'TXT',
          name: '_verification',
          value: 'verify-xyz',
          status: 'pending',
        },
      ],
    },
  ];

  it('renders domain configuration component', () => {
    render(<DomainConfiguration />);

    expect(screen.getByTestId('domain-configuration')).toBeInTheDocument();
    expect(screen.getByText('Domain Configuration')).toBeInTheDocument();
  });

  it('displays existing domains', () => {
    render(<DomainConfiguration currentDomains={mockDomains} />);

    expect(screen.getByText('primary.example.com')).toBeInTheDocument();
    expect(screen.getByText('shop.example.com')).toBeInTheDocument();
  });

  it('displays domain type badges', () => {
    render(<DomainConfiguration currentDomains={mockDomains} />);

    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Alias')).toBeInTheDocument();
  });

  it('displays verified status for domains', () => {
    render(<DomainConfiguration currentDomains={mockDomains} />);

    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Pending Verification')).toBeInTheDocument();
  });

  it('displays SSL status', () => {
    render(<DomainConfiguration currentDomains={mockDomains} />);

    const domain1 = screen.getByTestId('domain-domain-1');
    expect(domain1).toHaveTextContent('SSL:');
    expect(domain1).toHaveTextContent('Enabled');
  });

  it('shows DNS records for unverified domains', () => {
    render(<DomainConfiguration currentDomains={mockDomains} />);

    expect(screen.getByText('DNS Configuration')).toBeInTheDocument();
    expect(screen.getByTestId('dns-record-0')).toHaveTextContent('A');
    expect(screen.getByTestId('dns-record-0')).toHaveTextContent('192.168.1.1');
    expect(screen.getByTestId('dns-record-1')).toHaveTextContent('TXT');
  });

  it('hides DNS records for verified domains', () => {
    const verifiedDomain: DomainConfig[] = [
      {
        id: 'domain-1',
        domain: 'verified.example.com',
        type: 'alias',
        verified: true,
        sslEnabled: true,
        redirectToHttps: true,
        createdAt: '2024-01-01',
      },
    ];

    render(<DomainConfiguration currentDomains={verifiedDomain} />);

    expect(screen.queryByText('DNS Configuration')).not.toBeInTheDocument();
  });

  it('opens add domain dialog', async () => {
    const user = userEvent.setup();
    render(<DomainConfiguration />);

    await user.click(screen.getByTestId('add-domain-btn'));

    expect(screen.getByTestId('add-domain-dialog')).toBeInTheDocument();
  });

  it('allows entering domain name', async () => {
    const user = userEvent.setup();
    render(<DomainConfiguration />);

    await user.click(screen.getByTestId('add-domain-btn'));
    await user.type(screen.getByTestId('domain-input'), 'newdomain.com');

    expect(screen.getByTestId('domain-input')).toHaveValue('newdomain.com');
  });

  it('converts domain to lowercase', async () => {
    const user = userEvent.setup();
    render(<DomainConfiguration />);

    await user.click(screen.getByTestId('add-domain-btn'));
    await user.type(screen.getByTestId('domain-input'), 'NEWDOMAIN.COM');

    expect(screen.getByTestId('domain-input')).toHaveValue('newdomain.com');
  });

  it('allows selecting domain type', async () => {
    const user = userEvent.setup();
    render(<DomainConfiguration />);

    await user.click(screen.getByTestId('add-domain-btn'));

    const typeSelect = screen.getByTestId('domain-type-select') as HTMLSelectElement;
    expect(typeSelect.value).toBe('alias');

    await user.selectOptions(typeSelect, 'subdomain');
    expect(typeSelect.value).toBe('subdomain');
  });

  it('allows toggling SSL enabled', async () => {
    const user = userEvent.setup();
    render(<DomainConfiguration />);

    await user.click(screen.getByTestId('add-domain-btn'));

    const sslCheckbox = screen.getByTestId('ssl-enabled-checkbox') as HTMLInputElement;
    expect(sslCheckbox.checked).toBe(true);

    await user.click(sslCheckbox);
    expect(sslCheckbox.checked).toBe(false);
  });

  it('disables HTTPS redirect when SSL is disabled', async () => {
    const user = userEvent.setup();
    render(<DomainConfiguration />);

    await user.click(screen.getByTestId('add-domain-btn'));

    const sslCheckbox = screen.getByTestId('ssl-enabled-checkbox');
    const httpsCheckbox = screen.getByTestId('redirect-https-checkbox') as HTMLInputElement;

    await user.click(sslCheckbox);

    expect(httpsCheckbox).toBeDisabled();
  });

  it('calls onAddDomain when domain is added', async () => {
    const user = userEvent.setup();
    const onAddDomain = vi.fn();

    render(<DomainConfiguration onAddDomain={onAddDomain} />);

    await user.click(screen.getByTestId('add-domain-btn'));
    await user.type(screen.getByTestId('domain-input'), 'newdomain.com');
    await user.click(screen.getByTestId('save-domain-btn'));

    expect(onAddDomain).toHaveBeenCalledWith({
      domain: 'newdomain.com',
      type: 'alias',
      sslEnabled: true,
      redirectToHttps: true,
    });
  });

  it('validates domain format', async () => {
    const user = userEvent.setup();
    render(<DomainConfiguration />);

    await user.click(screen.getByTestId('add-domain-btn'));
    await user.type(screen.getByTestId('domain-input'), 'invalid domain');
    await user.click(screen.getByTestId('save-domain-btn'));

    expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid domain format');
  });

  it('prevents adding duplicate domains', async () => {
    const user = userEvent.setup();
    render(<DomainConfiguration currentDomains={mockDomains} />);

    await user.click(screen.getByTestId('add-domain-btn'));
    await user.type(screen.getByTestId('domain-input'), 'shop.example.com');
    await user.click(screen.getByTestId('save-domain-btn'));

    expect(screen.getByTestId('error-message')).toHaveTextContent('Domain already exists');
  });

  it('disables save button when domain is empty', async () => {
    const user = userEvent.setup();
    render(<DomainConfiguration />);

    await user.click(screen.getByTestId('add-domain-btn'));

    expect(screen.getByTestId('save-domain-btn')).toBeDisabled();
  });

  it('closes dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<DomainConfiguration />);

    await user.click(screen.getByTestId('add-domain-btn'));
    expect(screen.getByTestId('add-domain-dialog')).toBeInTheDocument();

    await user.click(screen.getByTestId('cancel-btn'));
    expect(screen.queryByTestId('add-domain-dialog')).not.toBeInTheDocument();
  });

  it('shows verify button for unverified domains', () => {
    render(<DomainConfiguration currentDomains={mockDomains} />);

    expect(screen.getByTestId('verify-domain-2')).toBeInTheDocument();
    expect(screen.queryByTestId('verify-domain-1')).not.toBeInTheDocument();
  });

  it('calls onVerifyDomain when verify is clicked', async () => {
    const user = userEvent.setup();
    const onVerifyDomain = vi.fn().mockResolvedValue(true);

    render(<DomainConfiguration currentDomains={mockDomains} onVerifyDomain={onVerifyDomain} />);

    await user.click(screen.getByTestId('verify-domain-2'));

    expect(onVerifyDomain).toHaveBeenCalledWith('domain-2');
  });

  it('updates domain status after successful verification', async () => {
    const user = userEvent.setup();
    const onVerifyDomain = vi.fn().mockResolvedValue(true);

    render(<DomainConfiguration currentDomains={mockDomains} onVerifyDomain={onVerifyDomain} />);

    await user.click(screen.getByTestId('verify-domain-2'));

    await waitFor(() => {
      expect(screen.getAllByText('Verified')).toHaveLength(2);
    });
  });

  it('shows error message when verification fails', async () => {
    const user = userEvent.setup();
    const onVerifyDomain = vi.fn().mockResolvedValue(false);

    render(<DomainConfiguration currentDomains={mockDomains} onVerifyDomain={onVerifyDomain} />);

    await user.click(screen.getByTestId('verify-domain-2'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Domain verification failed');
    });
  });

  it('shows verifying state during verification', async () => {
    const user = userEvent.setup();
    let resolveVerify: (value: boolean) => void;
    const verifyPromise = new Promise<boolean>((resolve) => {
      resolveVerify = resolve;
    });

    const onVerifyDomain = vi.fn().mockReturnValue(verifyPromise);

    render(<DomainConfiguration currentDomains={mockDomains} onVerifyDomain={onVerifyDomain} />);

    await user.click(screen.getByTestId('verify-domain-2'));

    expect(screen.getByText('Verifying...')).toBeInTheDocument();

    resolveVerify!(true);

    await waitFor(() => {
      expect(screen.queryByText('Verifying...')).not.toBeInTheDocument();
    });
  });

  it('shows set primary button for verified non-primary domains', () => {
    const verifiedAlias: DomainConfig[] = [
      {
        id: 'domain-1',
        domain: 'verified.example.com',
        type: 'alias',
        verified: true,
        sslEnabled: true,
        redirectToHttps: true,
        createdAt: '2024-01-01',
      },
    ];

    render(<DomainConfiguration currentDomains={verifiedAlias} />);

    expect(screen.getByTestId('set-primary-domain-1')).toBeInTheDocument();
  });

  it('calls onSetPrimary when set primary is clicked', async () => {
    const user = userEvent.setup();
    const onSetPrimary = vi.fn();

    const verifiedAlias: DomainConfig[] = [
      {
        id: 'domain-1',
        domain: 'verified.example.com',
        type: 'alias',
        verified: true,
        sslEnabled: true,
        redirectToHttps: true,
        createdAt: '2024-01-01',
      },
    ];

    render(<DomainConfiguration currentDomains={verifiedAlias} onSetPrimary={onSetPrimary} />);

    await user.click(screen.getByTestId('set-primary-domain-1'));

    expect(onSetPrimary).toHaveBeenCalledWith('domain-1');
  });

  it('prevents setting unverified domain as primary', () => {
    render(<DomainConfiguration currentDomains={mockDomains} />);

    // Try to set unverified domain as primary (should not have button, but test the logic)
    expect(screen.queryByTestId('set-primary-domain-2')).not.toBeInTheDocument();
  });

  it('shows toggle SSL button for verified domains', () => {
    render(<DomainConfiguration currentDomains={mockDomains} />);

    expect(screen.getByTestId('toggle-ssl-domain-1')).toBeInTheDocument();
  });

  it('calls onToggleSSL when SSL toggle is clicked', async () => {
    const user = userEvent.setup();
    const onToggleSSL = vi.fn();

    render(<DomainConfiguration currentDomains={mockDomains} onToggleSSL={onToggleSSL} />);

    await user.click(screen.getByTestId('toggle-ssl-domain-1'));

    expect(onToggleSSL).toHaveBeenCalledWith('domain-1', false); // Toggle from true to false
  });

  it('prevents removing primary domain', () => {
    render(<DomainConfiguration currentDomains={mockDomains} />);

    // Primary domain should not have remove button
    expect(screen.queryByTestId('remove-domain-1')).not.toBeInTheDocument();
  });

  it('allows removing non-primary domains', () => {
    render(<DomainConfiguration currentDomains={mockDomains} />);

    expect(screen.getByTestId('remove-domain-2')).toBeInTheDocument();
  });

  it('calls onRemoveDomain when remove is clicked', async () => {
    const user = userEvent.setup();
    const onRemoveDomain = vi.fn();

    render(<DomainConfiguration currentDomains={mockDomains} onRemoveDomain={onRemoveDomain} />);

    await user.click(screen.getByTestId('remove-domain-2'));

    expect(onRemoveDomain).toHaveBeenCalledWith('domain-2');
  });

  it('shows empty state when no domains', () => {
    render(<DomainConfiguration currentDomains={[]} />);

    expect(screen.getByText('No custom domains')).toBeInTheDocument();
    expect(screen.getByTestId('empty-add-domain-btn')).toBeInTheDocument();
  });

  it('displays visit site link for each domain', () => {
    render(<DomainConfiguration currentDomains={mockDomains} />);

    const visitLink1 = screen.getByTestId('visit-domain-1') as HTMLAnchorElement;
    expect(visitLink1.href).toBe('https://primary.example.com/');
    expect(visitLink1.target).toBe('_blank');
  });

  it('displays Force HTTPS indicator when enabled', () => {
    render(<DomainConfiguration currentDomains={mockDomains} />);

    const domain1 = screen.getByTestId('domain-domain-1');
    expect(domain1).toHaveTextContent('Force HTTPS');
  });

  it('displays domain creation date', () => {
    render(<DomainConfiguration currentDomains={mockDomains} />);

    const domain1 = screen.getByTestId('domain-domain-1');
    expect(domain1).toHaveTextContent('Added 1/1/2024');
  });

  it('shows next steps information in add dialog', async () => {
    const user = userEvent.setup();
    render(<DomainConfiguration />);

    await user.click(screen.getByTestId('add-domain-btn'));

    expect(screen.getByText('Next Steps')).toBeInTheDocument();
    expect(screen.getByText(/Add the domain to your account/)).toBeInTheDocument();
    expect(screen.getByText(/Configure DNS records/)).toBeInTheDocument();
  });
});
