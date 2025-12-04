import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Check, AlertCircle, ExternalLink, Plus, Trash2 } from 'lucide-react';

export interface DomainConfig {
  id: string;
  domain: string;
  type: 'primary' | 'alias' | 'subdomain';
  verified: boolean;
  sslEnabled: boolean;
  redirectToHttps: boolean;
  createdAt: string;
  verificationCode?: string;
  dnsRecords?: DNSRecord[];
}

export interface DNSRecord {
  type: 'A' | 'CNAME' | 'TXT';
  name: string;
  value: string;
  status: 'pending' | 'verified' | 'failed';
}

interface DomainConfigurationProps {
  currentDomains?: DomainConfig[];
  onAddDomain?: (domain: Omit<DomainConfig, 'id' | 'createdAt' | 'verified' | 'verificationCode' | 'dnsRecords'>) => void;
  onRemoveDomain?: (domainId: string) => void;
  onVerifyDomain?: (domainId: string) => Promise<boolean>;
  onSetPrimary?: (domainId: string) => void;
  onToggleSSL?: (domainId: string, enabled: boolean) => void;
}

export default function DomainConfiguration({
  currentDomains = [],
  onAddDomain,
  onRemoveDomain,
  onVerifyDomain,
  onSetPrimary,
  onToggleSSL,
}: DomainConfigurationProps) {
  const [domains, setDomains] = useState<DomainConfig[]>(currentDomains);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDomain, setNewDomain] = useState({
    domain: '',
    type: 'alias' as 'alias' | 'subdomain',
    sslEnabled: true,
    redirectToHttps: true,
  });
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddDomain = () => {
    if (!newDomain.domain) {
      setErrorMessage('Domain name is required');
      return;
    }

    // Basic domain validation
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(newDomain.domain)) {
      setErrorMessage('Invalid domain format');
      return;
    }

    // Check for duplicates
    if (domains.some((d) => d.domain === newDomain.domain)) {
      setErrorMessage('Domain already exists');
      return;
    }

    const domainConfig: DomainConfig = {
      id: `domain-${Date.now()}`,
      domain: newDomain.domain,
      type: newDomain.type,
      verified: false,
      sslEnabled: newDomain.sslEnabled,
      redirectToHttps: newDomain.redirectToHttps,
      createdAt: new Date().toISOString(),
      verificationCode: `verify-${Math.random().toString(36).substring(7)}`,
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
          value: `verify-${Math.random().toString(36).substring(7)}`,
          status: 'pending',
        },
      ],
    };

    onAddDomain?.(newDomain);
    setDomains([...domains, domainConfig]);
    setNewDomain({
      domain: '',
      type: 'alias',
      sslEnabled: true,
      redirectToHttps: true,
    });
    setShowAddDialog(false);
    setErrorMessage('');
  };

  const handleRemoveDomain = (domainId: string) => {
    const domain = domains.find((d) => d.id === domainId);
    if (domain?.type === 'primary') {
      setErrorMessage('Cannot remove primary domain');
      return;
    }

    onRemoveDomain?.(domainId);
    setDomains(domains.filter((d) => d.id !== domainId));
  };

  const handleVerifyDomain = async (domainId: string) => {
    setVerifyingDomain(domainId);
    setErrorMessage('');

    try {
      const verified = await onVerifyDomain?.(domainId);
      if (verified) {
        setDomains(
          domains.map((d) =>
            d.id === domainId
              ? {
                  ...d,
                  verified: true,
                  dnsRecords: d.dnsRecords?.map((r) => ({ ...r, status: 'verified' as const })),
                }
              : d
          )
        );
      } else {
        setErrorMessage('Domain verification failed. Please check DNS records.');
      }
    } catch (error) {
      setErrorMessage('Error verifying domain');
    } finally {
      setVerifyingDomain(null);
    }
  };

  const handleSetPrimary = (domainId: string) => {
    const domain = domains.find((d) => d.id === domainId);
    if (!domain?.verified) {
      setErrorMessage('Only verified domains can be set as primary');
      return;
    }

    onSetPrimary?.(domainId);
    setDomains(
      domains.map((d) => ({
        ...d,
        type: d.id === domainId ? ('primary' as const) : d.type === 'primary' ? ('alias' as const) : d.type,
      }))
    );
  };

  const handleToggleSSL = (domainId: string, enabled: boolean) => {
    onToggleSSL?.(domainId, enabled);
    setDomains(domains.map((d) => (d.id === domainId ? { ...d, sslEnabled: enabled } : d)));
  };

  const getStatusBadge = (domain: DomainConfig) => {
    if (domain.verified) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          <Check className="w-3 h-3" />
          Verified
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
        <AlertCircle className="w-3 h-3" />
        Pending Verification
      </span>
    );
  };

  const getTypeBadge = (type: DomainConfig['type']) => {
    const variants = {
      primary: 'bg-blue-100 text-blue-700',
      alias: 'bg-gray-100 text-gray-700',
      subdomain: 'bg-purple-100 text-purple-700',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${variants[type]}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6" data-testid="domain-configuration">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Domain Configuration</h2>
            <p className="text-sm text-gray-600">
              Manage custom domains and SSL certificates
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)} data-testid="add-domain-btn">
          <Plus className="w-4 h-4 mr-2" />
          Add Domain
        </Button>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <Card className="p-4 bg-red-50 border-red-200" data-testid="error-message">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        </Card>
      )}

      {/* Domains List */}
      <div className="space-y-4">
        {domains.map((domain) => (
          <Card key={domain.id} className="p-6" data-testid={`domain-${domain.id}`}>
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{domain.domain}</h3>
                    {getTypeBadge(domain.type)}
                    {getStatusBadge(domain)}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span>SSL:</span>
                      <span className={domain.sslEnabled ? 'text-green-600' : 'text-gray-500'}>
                        {domain.sslEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {domain.redirectToHttps && (
                      <span className="text-gray-500">Force HTTPS</span>
                    )}
                    <span className="text-gray-400">
                      Added {new Date(domain.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {domain.type !== 'primary' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDomain(domain.id)}
                    data-testid={`remove-${domain.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                )}
              </div>

              {/* DNS Records (if not verified) */}
              {!domain.verified && domain.dnsRecords && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">DNS Configuration</h4>
                  <div className="space-y-2">
                    {domain.dnsRecords.map((record, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded-lg font-mono text-sm"
                        data-testid={`dns-record-${index}`}
                      >
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <span className="text-gray-600">Type: </span>
                            <span className="font-semibold">{record.type}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Name: </span>
                            <span className="font-semibold">{record.name}</span>
                          </div>
                          <div className="col-span-3 md:col-span-1">
                            <span className="text-gray-600">Value: </span>
                            <span className="font-semibold break-all">{record.value}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                {!domain.verified && (
                  <Button
                    onClick={() => handleVerifyDomain(domain.id)}
                    disabled={verifyingDomain === domain.id}
                    size="sm"
                    data-testid={`verify-${domain.id}`}
                  >
                    {verifyingDomain === domain.id ? 'Verifying...' : 'Verify Domain'}
                  </Button>
                )}

                {domain.verified && domain.type !== 'primary' && (
                  <Button
                    variant="outline"
                    onClick={() => handleSetPrimary(domain.id)}
                    size="sm"
                    data-testid={`set-primary-${domain.id}`}
                  >
                    Set as Primary
                  </Button>
                )}

                {domain.verified && (
                  <Button
                    variant="outline"
                    onClick={() => handleToggleSSL(domain.id, !domain.sslEnabled)}
                    size="sm"
                    data-testid={`toggle-ssl-${domain.id}`}
                  >
                    {domain.sslEnabled ? 'Disable SSL' : 'Enable SSL'}
                  </Button>
                )}

                <a
                  href={`https://${domain.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  data-testid={`visit-${domain.id}`}
                >
                  Visit Site
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </Card>
        ))}

        {domains.length === 0 && (
          <Card className="p-12 text-center">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No custom domains</h3>
            <p className="text-sm text-gray-500 mb-4">
              Add a custom domain to personalize your store's URL
            </p>
            <Button onClick={() => setShowAddDialog(true)} data-testid="empty-add-domain-btn">
              Add Your First Domain
            </Button>
          </Card>
        )}
      </div>

      {/* Add Domain Dialog */}
      {showAddDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          data-testid="add-domain-dialog"
        >
          <Card className="w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Add Custom Domain</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Domain Name *</label>
                <Input
                  value={newDomain.domain}
                  onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value.toLowerCase() })}
                  placeholder="example.com"
                  data-testid="domain-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your domain without http:// or https://
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Domain Type *</label>
                <select
                  value={newDomain.type}
                  onChange={(e) => setNewDomain({ ...newDomain, type: e.target.value as 'alias' | 'subdomain' })}
                  className="w-full px-3 py-2 border rounded-md"
                  data-testid="domain-type-select"
                >
                  <option value="alias">Alias (alternative domain)</option>
                  <option value="subdomain">Subdomain</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newDomain.sslEnabled}
                    onChange={(e) => setNewDomain({ ...newDomain, sslEnabled: e.target.checked })}
                    data-testid="ssl-enabled-checkbox"
                  />
                  <span className="text-sm font-medium">Enable SSL Certificate</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newDomain.redirectToHttps}
                    onChange={(e) => setNewDomain({ ...newDomain, redirectToHttps: e.target.checked })}
                    disabled={!newDomain.sslEnabled}
                    data-testid="redirect-https-checkbox"
                  />
                  <span className="text-sm font-medium">Force HTTPS Redirect</span>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Next Steps</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Add the domain to your account</li>
                  <li>Configure DNS records at your domain provider</li>
                  <li>Verify domain ownership</li>
                  <li>SSL certificate will be automatically issued</li>
                </ol>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAddDomain}
                  disabled={!newDomain.domain}
                  className="flex-1"
                  data-testid="save-domain-btn"
                >
                  Add Domain
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    setNewDomain({
                      domain: '',
                      type: 'alias',
                      sslEnabled: true,
                      redirectToHttps: true,
                    });
                    setErrorMessage('');
                  }}
                  data-testid="cancel-btn"
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
