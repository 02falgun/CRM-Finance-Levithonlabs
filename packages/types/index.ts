export interface TenantContext {
  tenantId: string;
  name: string;
  subdomain: string;
  panNumber?: string | null;
}

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'SALES_REPRESENTATIVE' | 'BILLING_MANAGER' | 'AUDITOR';
  tenantId: string;
}

export interface LeadDto {
  id: string;
  title: string;
  description?: string | null;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'WON' | 'LOST';
  value: number;
  customerId?: string | null;
}

export interface InvoiceItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface CreateInvoiceDto {
  customerId: string;
  items: InvoiceItemDto[];
  discount?: number;
}

export interface IrdSyncLogDto {
  invoiceId: string;
  payloadSent: any;
  responseRecv: any;
  statusCode: number;
  syncStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
  verifiedHash: string;
  syncTime: string;
}

export interface AuditLogDto {
  id: string;
  userId?: string | null;
  action: string;
  entityName: string;
  entityId?: string | null;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string | null;
  createdAt: string;
}
