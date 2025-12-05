/**
 * Multi-tenant types for the Retail Agentic platform
 */

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  status: TenantStatus;
  branding: TenantBranding;
  createdAt: Date;
  updatedAt: Date;
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE'
}

export interface TenantBranding {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily?: string;
  customCss?: string;
}

export interface TenantContext {
  tenantId: string;
  subdomain: string;
}
