import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UtilityService {
  constructor(private readonly prisma: PrismaService) {}

  // --- AUDIT LOGS ---

  async getAuditLogs(tenantId: string) {
    return this.prisma.auditLog.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- NOTIFICATIONS ---

  async getNotifications(tenantId: string) {
    return this.prisma.notification.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async sendMockNotification(type: string, recipient: string, message: string, tenantId: string) {
    return this.prisma.notification.create({
      data: {
        tenantId,
        type,
        recipient,
        message,
        status: 'SENT',
      },
    });
  }

  // --- REPORTS ---

  async getReports(tenantId: string) {
    return this.prisma.report.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateReport(title: string, type: string, parameters: any, tenantId: string) {
    // Mock generating static report PDF link
    const fileUrl = `https://s3.amazonaws.com/levithon-reports/${tenantId}/${type.toLowerCase()}-${Date.now()}.pdf`;

    return this.prisma.report.create({
      data: {
        tenantId,
        title,
        type,
        parameters,
        fileUrl,
      },
    });
  }

  async getDashboardStats(tenantId: string) {
    // 1. Total Revenue (total amount of non-cancelled, non-draft invoices)
    const revenueSum = await this.prisma.invoice.aggregate({
      where: {
        tenantId,
        deletedAt: null,
        NOT: {
          status: { in: ['DRAFT', 'CANCELLED'] }
        }
      },
      _sum: {
        totalAmount: true
      }
    });
    const totalRevenue = Number(revenueSum._sum.totalAmount || 0);

    // 2. Active Customers Count
    const activeCustomers = await this.prisma.customer.count({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null
      }
    });

    // 3. Invoices Issued Count (non-draft invoices)
    const invoicesIssued = await this.prisma.invoice.count({
      where: {
        tenantId,
        deletedAt: null,
        NOT: { status: 'DRAFT' }
      }
    });

    // 4. IRD Compliance Sync Success rate
    const totalEbills = await this.prisma.ebill.count({
      where: {
        invoice: { tenantId },
        deletedAt: null
      }
    });
    const successEbills = await this.prisma.ebill.count({
      where: {
        invoice: { tenantId },
        syncStatus: 'SUCCESS',
        deletedAt: null
      }
    });
    const syncRate = totalEbills > 0 ? Math.round((successEbills / totalEbills) * 100) : 100;

    // 5. Recent Transactions
    const recentInvoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        deletedAt: null
      },
      include: {
        customer: true,
        ebills: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const recentTransactions = recentInvoices.map(inv => {
      const ebill = inv.ebills?.[0];
      return {
        id: inv.id,
        customer: inv.customer.name,
        billNo: inv.invoiceNo,
        amount: Number(inv.totalAmount),
        status: ebill ? ebill.syncStatus : (inv.status === 'DRAFT' ? 'DRAFT' : 'PENDING'),
        date: inv.createdAt
      };
    });

    // 6. Revenue Stream for last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyInvoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: { gte: weekAgo },
        deletedAt: null,
        NOT: {
          status: { in: ['DRAFT', 'CANCELLED'] }
        }
      },
      select: {
        totalAmount: true,
        createdAt: true
      }
    });

    const dailySums: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      dailySums[dayLabel] = 0;
    }

    weeklyInvoices.forEach(inv => {
      const dayLabel = new Date(inv.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
      if (dayLabel in dailySums) {
        dailySums[dayLabel] += Number(inv.totalAmount);
      }
    });

    const chartData = Object.keys(dailySums).map(day => ({
      day,
      amount: dailySums[day]
    }));

    return {
      totalRevenue,
      activeCustomers,
      invoicesIssued,
      syncRate,
      recentTransactions,
      chartData
    };
  }
}
