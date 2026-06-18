import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateIrdVerificationHash } from '@levithon/nepal-ird-utils';

export interface IrdSubmitResult {
  syncStatus: 'Accepted' | 'Rejected';
  statusCode: number;
  responseRecv: any;
  verifiedHash: string;
}

/**
 * Interface detailing the contract for Nepal IRD CBMS submissions.
 * Swap Mock client with live client easily in AppModule providers.
 */
export interface IrdIntegrationClient {
  submitBill(invoice: any, sellerPan: string): Promise<IrdSubmitResult>;
}

@Injectable()
export class MockIrdClient implements IrdIntegrationClient {
  private readonly logger = new Logger(MockIrdClient.name);

  async submitBill(invoice: any, sellerPan: string): Promise<IrdSubmitResult> {
    this.logger.log(`MockIrdClient: Simulating transmission of Invoice ${invoice.invoiceNo} to IRD Portal`);
    
    // Simulate minor network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const total = Number(invoice.totalAmount);
    const buyerPan = invoice.customer?.panNumber;

    // 1. Validation Logic
    const validationErrors: string[] = [];
    
    if (buyerPan && !/^\d{9}$/.test(buyerPan)) {
      validationErrors.push('Buyer PAN must be exactly 9 digits');
    }
    if (!/^\d{9}$/.test(sellerPan)) {
      validationErrors.push('Seller PAN must be exactly 9 digits');
    }
    if (total <= 0) {
      validationErrors.push('Invoice total amount must be positive');
    }

    const verifiedHash = generateIrdVerificationHash({
      sellerPan,
      buyerPan: buyerPan || '',
      invoiceNo: invoice.invoiceNo,
      totalAmount: total,
      fiscalYear: invoice.fiscalYear,
    });

    if (validationErrors.length > 0) {
      this.logger.warn(`MockIrdClient: Invoice ${invoice.invoiceNo} validation failed: ${validationErrors.join(', ')}`);
      return {
        syncStatus: 'Rejected',
        statusCode: 400,
        responseRecv: {
          status: 'ERROR',
          error_code: 'CBMS-VAL-099',
          message: 'Nepal IRD Schema Validation Failed',
          details: validationErrors,
        },
        verifiedHash,
      };
    }

    // 2. Random Simulation logic (95% Success, 5% rejection for realistic simulation)
    const isSuccess = Math.random() < 0.95;

    if (isSuccess) {
      return {
        syncStatus: 'Accepted',
        statusCode: 200,
        responseRecv: {
          status: 'SUCCESS',
          sync_id: `CBMS-${Math.floor(Math.random() * 900000 + 100000)}`,
          ird_received_time: new Date().toISOString(),
          message: 'Invoice successfully registered with Nepal Inland Revenue Department CBMS portal',
        },
        verifiedHash,
      };
    } else {
      return {
        syncStatus: 'Rejected',
        statusCode: 500,
        responseRecv: {
          status: 'FAILED',
          error_code: 'CBMS-SRV-503',
          message: 'IRD Gateway Timeout / Database connection dropped',
        },
        verifiedHash,
      };
    }
  }
}

@Injectable()
export class EbillingService {
  private readonly logger = new Logger(EbillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly irdClient: MockIrdClient, // Inject client conforming to IrdIntegrationClient
  ) {}

  /**
   * Submission workflow managing: Generated -> Submitted -> Accepted or Rejected
   */
  async submitEbill(invoiceId: string, tenantId: string) {
    // 1. Fetch invoice data
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, deletedAt: null },
      include: {
        customer: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Fetch tenant PAN
    const company = await this.prisma.companyProfile.findUnique({
      where: { tenantId },
    });
    const sellerPan = company?.panNumber || '987654321';

    // 2. Prepare payload (Stage: Generated)
    const payload = {
      seller_pan: sellerPan,
      buyer_pan: invoice.customer?.panNumber || '',
      buyer_name: invoice.customer?.name || 'Walk-in Customer',
      bill_no: invoice.invoiceNo,
      fiscal_year: invoice.fiscalYear,
      bill_date_ad: invoice.billDateAD,
      bill_date_bs: invoice.billDateBS,
      sub_total: Number(invoice.subTotal),
      discount: Number(invoice.discount),
      taxable_amount: Number(invoice.taxableAmt),
      tax_amount: Number(invoice.vatAmount),
      non_taxable_amount: Number(invoice.nonTaxableAmt),
      total_amount: Number(invoice.totalAmount),
      is_printed: invoice.isPrinted,
    };

    // Find or create ebill record
    let ebill = await this.prisma.ebill.findFirst({
      where: { invoiceId, deletedAt: null },
    });

    if (!ebill) {
      ebill = await this.prisma.ebill.create({
        data: {
          invoiceId,
          payloadSent: payload,
          syncStatus: 'Generated', // Transition state 1: Generated
        },
      });
    }

    // Update state to Submitted (Transition state 2: Submitted)
    await this.prisma.ebill.update({
      where: { id: ebill.id },
      data: {
        syncStatus: 'Submitted',
        payloadSent: payload,
      },
    });

    // 3. Submit to Mock Client (Simulates network exchange)
    let result: IrdSubmitResult;
    try {
      result = await this.irdClient.submitBill(invoice, sellerPan);
    } catch (err: any) {
      result = {
        syncStatus: 'Rejected',
        statusCode: 500,
        responseRecv: { error: err.message },
        verifiedHash: 'N/A',
      };
    }

    // 4. Update local record with response (Transition state 3: Accepted / Rejected)
    const updatedEbill = await this.prisma.ebill.update({
      where: { id: ebill.id },
      data: {
        syncStatus: result.syncStatus,
        statusCode: result.statusCode,
        responseRecv: result.responseRecv,
        verifiedHash: result.verifiedHash,
        syncTime: new Date(),
      },
    });

    // If Accepted, auto-mark invoice print lock
    if (result.syncStatus === 'Accepted') {
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          isPrinted: true,
        },
      });
    }

    return updatedEbill;
  }

  /**
   * Get sync status logs for a specific invoice
   */
  async getEbillStatus(invoiceId: string, tenantId: string) {
    const ebill = await this.prisma.ebill.findFirst({
      where: { invoiceId, invoice: { tenantId }, deletedAt: null },
      include: {
        invoice: { select: { invoiceNo: true, totalAmount: true } },
      },
    });

    if (!ebill) {
      throw new NotFoundException('No eBilling compliance log found for this invoice');
    }

    return ebill;
  }

  /**
   * Fetch all compliance sync logs for auditing
   */
  async getSyncLogs(tenantId: string) {
    return this.prisma.ebill.findMany({
      where: { invoice: { tenantId }, deletedAt: null },
      include: {
        invoice: {
          select: {
            invoiceNo: true,
            totalAmount: true,
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { syncTime: 'desc' },
    });
  }
}
