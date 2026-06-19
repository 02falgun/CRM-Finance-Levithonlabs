import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateCustomerDto, 
  UpdateCustomerDto,
  DeactivateCustomerDto,
  CreateCustomerContactDto, 
  CreateLeadDto, 
  CreateLeadActivityDto, 
  UpdateLeadStatusDto 
} from './dto/crm.dto';
import { validatePan } from '@levithon/nepal-ird-utils';
import { CacheService } from '../cache/cache.service';
import { CacheKeys } from '../cache/cache-keys';

@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  // --- CUSTOMER ACTIONS ---

  async createCustomer(dto: CreateCustomerDto, tenantId: string) {
    if (dto.panNumber && !validatePan(dto.panNumber)) {
      throw new BadRequestException('Nepal PAN must be exactly 9 numeric digits');
    }

    const customer = await this.prisma.customer.create({
      data: {
        ...dto,
        tenantId,
        isActive: true,
      },
    });
    await this.cache.del(CacheKeys.dashboard(tenantId));
    return customer;
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto, tenantId: string) {
    await this.getCustomerById(id, tenantId); // verify exists
    
    if (dto.panNumber && !validatePan(dto.panNumber)) {
      throw new BadRequestException('Nepal PAN must be exactly 9 numeric digits');
    }

    return this.prisma.customer.update({
      where: { id },
      data: dto,
    });
  }

  async deactivateCustomer(id: string, dto: DeactivateCustomerDto, tenantId: string) {
    await this.getCustomerById(id, tenantId); // verify exists
    const updated = await this.prisma.customer.update({
      where: { id },
      data: { isActive: dto.isActive },
    });
    await this.cache.del(CacheKeys.dashboard(tenantId));
    return updated;
  }

  async searchCustomers(query: string, tenantId: string) {
    return this.prisma.customer.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { panNumber: { contains: query } },
        ],
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCustomers(tenantId: string) {
    return this.prisma.customer.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        contacts: { where: { deletedAt: null } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCustomerById(id: string, tenantId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        contacts: { where: { deletedAt: null } },
      },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async getCustomerTimeline(id: string, tenantId: string) {
    await this.getCustomerById(id, tenantId); // verify exists

    // Query 1: Customer Invoices
    const invoices = await this.prisma.invoice.findMany({
      where: { customerId: id, tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    // Query 2: Payments
    const payments = await this.prisma.payment.findMany({
      where: { invoice: { customerId: id, tenantId }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    // Query 3: Lead Activities
    const activities = await this.prisma.leadActivity.findMany({
      where: { lead: { customerId: id, tenantId }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    // Collate into unified timeline array
    const timeline = [
      ...invoices.map(i => ({
        id: i.id,
        type: 'INVOICE',
        title: `Invoice ${i.invoiceNo} Drafted`,
        details: `Subtotal Rs. ${Number(i.subTotal).toLocaleString()} • Status: ${i.status}`,
        date: i.createdAt,
      })),
      ...payments.map(p => ({
        id: p.id,
        type: 'PAYMENT',
        title: `Payment received of Rs. ${Number(p.amount).toLocaleString()}`,
        details: `Gateway: ${p.paymentMode} • Ref ID: ${p.referenceNo || 'None'}`,
        date: p.paidAt,
      })),
      ...activities.map(a => ({
        id: a.id,
        type: 'ACTIVITY',
        title: `Logged Activity: ${a.type}`,
        details: `${a.note} (by ${a.performedBy})`,
        date: a.createdAt,
      })),
    ];

    // Sort descending by date
    return timeline.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async softDeleteCustomer(id: string, tenantId: string) {
    await this.getCustomerById(id, tenantId); // verify exists
    return this.prisma.softDelete('customer', id);
  }

  // --- CUSTOMER CONTACTS ---

  async createContact(customerId: string, dto: CreateCustomerContactDto, tenantId: string) {
    await this.getCustomerById(customerId, tenantId); // verify customer exists
    return this.prisma.customerContact.create({
      data: {
        ...dto,
        customerId,
      },
    });
  }

  async softDeleteContact(id: string, tenantId: string) {
    const contact = await this.prisma.customerContact.findFirst({
      where: { id, deletedAt: null },
      include: { customer: true },
    });

    if (!contact || contact.customer.tenantId !== tenantId) {
      throw new NotFoundException('Contact not found');
    }

    return this.prisma.softDelete('customerContact', id);
  }

  // --- LEAD ACTIONS ---

  async createLead(dto: CreateLeadDto, tenantId: string) {
    if (dto.customerId) {
      await this.getCustomerById(dto.customerId, tenantId);
    }

    const validStages = ['New', 'Contacted', 'Proposal Sent', 'Negotiation', 'Converted', 'Lost'];
    const status = validStages.includes(dto.title) ? dto.title : 'New';

    return this.prisma.lead.create({
      data: {
        title: dto.title,
        description: dto.description || null,
        value: dto.value,
        status,
        customerId: dto.customerId || null,
        tenantId,
      },
    });
  }

  async getLeads(tenantId: string) {
    return this.prisma.lead.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        customer: true,
        activities: { where: { deletedAt: null } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async updateLeadStatus(id: string, dto: UpdateLeadStatusDto, tenantId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const validStages = ['New', 'Contacted', 'Proposal Sent', 'Negotiation', 'Converted', 'Lost'];
    if (!validStages.includes(dto.status)) {
      throw new BadRequestException(`Invalid lead stage. Stages must be one of: ${validStages.join(', ')}`);
    }

    return this.prisma.lead.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async softDeleteLead(id: string, tenantId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return this.prisma.softDelete('lead', id);
  }

  // --- LEAD ACTIVITIES ---

  async createActivity(leadId: string, dto: CreateLeadActivityDto, username: string, tenantId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId, deletedAt: null },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return this.prisma.leadActivity.create({
      data: {
        ...dto,
        leadId,
        performedBy: username,
      },
    });
  }
}
