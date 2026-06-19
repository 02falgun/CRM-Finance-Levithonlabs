import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { CacheKeys, CacheTTL } from '../cache/cache-keys';

@Injectable()
export class UtilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

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
    return this.cache.wrap(
      CacheKeys.dashboard(tenantId),
      CacheTTL.dashboard,
      () => this.computeDashboardStats(tenantId),
    );
  }

  private async computeDashboardStats(tenantId: string) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // All six reads are independent - run them in a single parallel batch
    // instead of sequential awaits to collapse round-trip latency.
    const [
      revenueSum,
      activeCustomers,
      invoicesIssued,
      totalEbills,
      successEbills,
      recentInvoices,
      weeklyInvoices,
    ] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: {
          tenantId,
          deletedAt: null,
          NOT: { status: { in: ['DRAFT', 'CANCELLED'] } },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.customer.count({
        where: { tenantId, isActive: true, deletedAt: null },
      }),
      this.prisma.invoice.count({
        where: { tenantId, deletedAt: null, NOT: { status: 'DRAFT' } },
      }),
      this.prisma.ebill.count({
        where: { invoice: { tenantId }, deletedAt: null },
      }),
      this.prisma.ebill.count({
        where: { invoice: { tenantId }, syncStatus: 'SUCCESS', deletedAt: null },
      }),
      this.prisma.invoice.findMany({
        where: { tenantId, deletedAt: null },
        include: { customer: true, ebills: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.invoice.findMany({
        where: {
          tenantId,
          createdAt: { gte: weekAgo },
          deletedAt: null,
          NOT: { status: { in: ['DRAFT', 'CANCELLED'] } },
        },
        select: { totalAmount: true, createdAt: true },
      }),
    ]);

    const totalRevenue = Number(revenueSum._sum.totalAmount || 0);
    const syncRate = totalEbills > 0 ? Math.round((successEbills / totalEbills) * 100) : 100;

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

    // Revenue Stream for last 7 days (weeklyInvoices fetched in the batch above)
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
