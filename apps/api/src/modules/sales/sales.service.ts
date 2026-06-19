import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateInvoiceDto, 
  CreateCreditNoteDto, 
  CreateQuotationDto, 
  CreatePaymentDto, 
  CreateTaxDto 
} from './dto/sales.dto';
import { getFiscalYear, convertADToBS, generateIrdVerificationHash } from '@levithon/nepal-ird-utils';
import { CacheService } from '../cache/cache.service';
import { CacheKeys } from '../cache/cache-keys';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  private async invalidateDashboard(tenantId: string) {
    await this.cache.del(CacheKeys.dashboard(tenantId));
  }

  // --- TAX CONFIG ACTIONS ---

  async createTax(dto: CreateTaxDto, tenantId: string) {
    return this.prisma.tax.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async getTaxes(tenantId: string) {
    return this.prisma.tax.findMany({
      where: { tenantId, deletedAt: null },
    });
  }

  // --- QUOTATION ACTIONS ---

  async createQuotation(dto: CreateQuotationDto, tenantId: string) {
    // Verify customer exists
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId, deletedAt: null },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Fetch applicable taxes
    const taxIds = dto.items.filter(i => i.taxId).map(i => i.taxId!);
    const taxes = await this.prisma.tax.findMany({
      where: { id: { in: taxIds }, tenantId, deletedAt: null },
    });

    let subTotal = 0;
    let taxAmount = 0;
    let totalAmount = 0;

    const itemsData = dto.items.map(item => {
      const price = Number(item.unitPrice);
      const qty = item.quantity;
      const itemSub = price * qty;
      subTotal += itemSub;

      let itemTax = 0;
      if (item.taxId) {
        const tax = taxes.find(t => t.id === item.taxId);
        if (tax && !tax.isExempt) {
          itemTax = itemSub * (Number(tax.rate) / 100);
        }
      }

      taxAmount += itemTax;
      totalAmount += (itemSub + itemTax);

      return {
        description: item.description,
        quantity: qty,
        unitPrice: price,
        totalPrice: itemSub + itemTax,
      };
    });

    const quoteCount = await this.prisma.quotation.count({
      where: { tenantId, deletedAt: null },
    });
    const quoteNumber = `QT-${new Date().getFullYear()}-${String(quoteCount + 1).padStart(4, '0')}`;

    return this.prisma.quotation.create({
      data: {
        tenantId,
        customerId: customer.id,
        quoteNumber,
        status: 'DRAFT', // DRAFT, SENT, APPROVED, REJECTED, EXPIRED
        validUntil: new Date(dto.validUntil),
        subTotal,
        taxAmount,
        totalAmount,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });
  }

  async getQuotations(tenantId: string) {
    return this.prisma.quotation.findMany({
      where: { tenantId, deletedAt: null },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateQuotationStatus(id: string, status: string, tenantId: string) {
    const quote = await this.prisma.quotation.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!quote) {
      throw new NotFoundException('Quotation not found');
    }

    const valid = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'];
    if (!valid.includes(status)) {
      throw new BadRequestException(`Status must be one of: ${valid.join(', ')}`);
    }

    return this.prisma.quotation.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Convert Quotation into Invoice draft.
   */
  async convertQuotationToInvoice(id: string, tenantId: string) {
    const quote = await this.prisma.quotation.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        items: { where: { deletedAt: null } },
        customer: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Quotation not found');
    }

    if (quote.status === 'APPROVED') {
      throw new BadRequestException('Quotation is already converted or approved');
    }

    // Generate next invoice sequence
    const year = new Date().getFullYear();
    const invoiceCount = await this.prisma.invoice.count({
      where: { tenantId, deletedAt: null },
    });
    const seqStr = String(invoiceCount + 1).padStart(4, '0');
    const invoiceNo = `INV-${year}-${seqStr}`;

    const dateAD = new Date();
    const dateBS = convertADToBS(dateAD);

    // Map quotation items to invoice items (assume taxable VAT 13% for converted quotes)
    const invoiceItemsData = quote.items.map(item => {
      const price = Number(item.unitPrice);
      const qty = item.quantity;
      const subtotal = price * qty;
      const vat = subtotal * 0.13;

      return {
        description: item.description,
        quantity: qty,
        unitPrice: price,
        discount: 0,
        taxableAmt: subtotal,
        vatAmount: vat,
        totalPrice: subtotal + vat,
      };
    });

    const subTotal = Number(quote.subTotal);
    const vatAmount = subTotal * 0.13;
    const totalAmount = subTotal + vatAmount;

    // Database transaction to convert quote and lock status
    const result = await this.prisma.$transaction(async (tx) => {
      // Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          customerId: quote.customerId,
          invoiceNo,
          fiscalYear: getFiscalYear(),
          billDateAD: dateAD,
          billDateBS: dateBS,
          subTotal,
          discount: 0,
          taxableAmt: subTotal,
          vatAmount,
          nonTaxableAmt: 0,
          totalAmount,
          status: 'DRAFT',
          convertedFromQuoteId: quote.id,
          items: {
            create: invoiceItemsData,
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // Update Quotation Status
      await tx.quotation.update({
        where: { id: quote.id },
        data: { status: 'APPROVED' },
      });

      return invoice;
    });

    await this.invalidateDashboard(tenantId);
    return result;
  }

  // --- INVOICE ACTIONS ---

  async createInvoice(dto: CreateInvoiceDto, tenantId: string) {
    // 1. Verify customer exists
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId, deletedAt: null },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // 2. Fetch company profile to get Seller PAN
    const profile = await this.prisma.companyProfile.findUnique({
      where: { tenantId },
    });
    if (!profile) {
      throw new BadRequestException('Configure company profile settings before generating invoices');
    }

    // 3. Fetch applicable taxes
    const taxIds = dto.items.filter(i => i.taxId).map(i => i.taxId!);
    const taxes = await this.prisma.tax.findMany({
      where: { id: { in: taxIds }, tenantId, deletedAt: null },
    });

    // 4. Calculations
    let subTotal = 0;
    let totalDiscount = 0;
    let taxableAmt = 0;
    let vatAmount = 0;
    let nonTaxableAmt = 0;
    let totalAmount = 0;

    const invoiceItemsData = dto.items.map(item => {
      const price = Number(item.unitPrice);
      const qty = item.quantity;
      const itemSubtotal = price * qty;
      
      const disc = item.discount || 0;
      const itemTaxable = itemSubtotal - disc;

      subTotal += itemSubtotal;
      totalDiscount += disc;

      let itemVat = 0;
      let itemTotal = 0;

      let isExempt = true;
      let taxRate = 0;

      if (item.taxId) {
        const tax = taxes.find(t => t.id === item.taxId);
        if (tax) {
          isExempt = tax.isExempt;
          taxRate = Number(tax.rate);
        }
      }

      if (!isExempt) {
        itemVat = itemTaxable * (taxRate / 100);
        taxableAmt += itemTaxable;
        vatAmount += itemVat;
        itemTotal = itemTaxable + itemVat;
      } else {
        nonTaxableAmt += itemTaxable;
        itemTotal = itemTaxable;
      }

      totalAmount += itemTotal;

      return {
        description: item.description,
        quantity: qty,
        unitPrice: price,
        discount: disc,
        taxableAmt: itemTaxable,
        vatAmount: itemVat,
        totalPrice: itemTotal,
      };
    });

    // Deduct general invoice discount if provided
    const generalDiscount = dto.discount || 0;
    if (generalDiscount > 0) {
      totalDiscount += generalDiscount;
      totalAmount = Math.max(0, totalAmount - generalDiscount);
    }

    // Formats sequential sequence: INV-YYYY-NNNN
    const year = new Date().getFullYear();
    const invoiceCount = await this.prisma.invoice.count({
      where: { tenantId, deletedAt: null },
    });
    const seqStr = String(invoiceCount + 1).padStart(4, '0');
    const invoiceNo = `INV-${year}-${seqStr}`;

    const dateAD = new Date();
    const dateBS = convertADToBS(dateAD);

    const created = await this.prisma.invoice.create({
      data: {
        tenantId,
        customerId: customer.id,
        invoiceNo,
        fiscalYear: getFiscalYear(),
        billDateAD: dateAD,
        billDateBS: dateBS,
        subTotal,
        discount: totalDiscount,
        taxableAmt,
        vatAmount,
        nonTaxableAmt,
        totalAmount,
        status: 'DRAFT',
        items: {
          create: invoiceItemsData,
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });
    await this.invalidateDashboard(tenantId);
    return created;
  }

  async getInvoices(tenantId: string) {
    return this.prisma.invoice.findMany({
      where: { tenantId, deletedAt: null },
      include: { 
        customer: true,
        payments: { where: { deletedAt: null } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoiceById(id: string, tenantId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        items: { where: { deletedAt: null } },
        customer: true,
        payments: { where: { deletedAt: null } },
        ebills: { where: { deletedAt: null } },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  async registerPrint(id: string, username: string, tenantId: string) {
    const invoice = await this.getInvoiceById(id, tenantId);

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot print a cancelled invoice');
    }

    const profile = await this.prisma.companyProfile.findUnique({
      where: { tenantId },
    });

    const verificationHash = generateIrdVerificationHash({
      sellerPan: profile?.panNumber || '000000000',
      buyerPan: invoice.customer.panNumber,
      invoiceNo: invoice.invoiceNo,
      totalAmount: Number(invoice.totalAmount),
      fiscalYear: invoice.fiscalYear,
    });

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        isPrinted: true,
        status: invoice.status === 'DRAFT' ? 'SENT' : invoice.status,
        printedBy: username,
        printedTime: new Date(),
      },
    });

    // Simulate IRD CBMS Sync trigger (registers log under Ebill table)
    await this.syncEbillWithIrd(invoice, profile?.panNumber || '987654321', verificationHash);

    await this.invalidateDashboard(tenantId);

    return {
      invoice: updatedInvoice,
      verificationHash,
      message: 'Invoice printed and locked on portal',
    };
  }

  async createCreditNote(invoiceId: string, dto: CreateCreditNoteDto, tenantId: string) {
    const invoice = await this.getInvoiceById(invoiceId, tenantId);

    if (invoice.status === 'DRAFT') {
      throw new BadRequestException('Draft invoices do not require a credit note. Delete directly.');
    }
    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Invoice is already cancelled');
    }

    const dateAD = new Date();
    const dateBS = convertADToBS(dateAD);

    const creditNotesCount = await this.prisma.creditNote.count({
      where: { invoice: { tenantId }, deletedAt: null },
    });
    const cnSerial = String(creditNotesCount + 1).padStart(4, '0');
    const creditNoteNo = `CN-${invoice.fiscalYear.replace('/', '')}-${cnSerial}`;

    // Perform database transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const creditNote = await tx.creditNote.create({
        data: {
          invoiceId,
          creditNoteNo,
          reason: dto.reason,
          refundAmount: invoice.totalAmount,
          returnDateAD: dateAD,
          returnDateBS: dateBS,
          irdSyncStatus: 'PENDING',
        },
      });

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: 'CANCELLED' },
      });

      return creditNote;
    });

    await this.invalidateDashboard(tenantId);
    return result;
  }

  // --- PAYMENT MATCHING ---

  async receivePayment(invoiceId: string, dto: CreatePaymentDto, tenantId: string) {
    const invoice = await this.getInvoiceById(invoiceId, tenantId);

    if (invoice.status === 'DRAFT') {
      throw new BadRequestException('Cannot pay against draft invoices. Lock and issue them first.');
    }
    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot pay against a cancelled invoice');
    }

    // Validate payment methods
    const validModes = ['CASH', 'BANK_TRANSFER', 'ESEWA', 'KHALTI', 'IME_PAY', 'QR', 'CHEQUE'];
    if (!validModes.includes(dto.paymentMode.toUpperCase())) {
      throw new BadRequestException(`Payment mode must be one of: ${validModes.join(', ')}`);
    }

    // Add payment log
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        amount: dto.amount,
        paymentMode: dto.paymentMode.toUpperCase(),
        referenceNo: dto.referenceNo || null,
      },
    });

    // Calculate total paid amount
    const totalPayments = await this.prisma.payment.aggregate({
      where: { invoiceId, deletedAt: null },
      _sum: { amount: true },
    });
    const sumPaid = Number(totalPayments._sum.amount || 0);

    let nextStatus = 'SENT';
    if (sumPaid >= Number(invoice.totalAmount)) {
      nextStatus = 'PAID';
    } else if (sumPaid > 0) {
      nextStatus = 'PARTIAL_PAID';
    }

    // Update status
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: nextStatus },
    });

    await this.invalidateDashboard(tenantId);
    return payment;
  }

  async softDeleteInvoice(id: string, tenantId: string) {
    const invoice = await this.getInvoiceById(id, tenantId);
    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Only draft invoices can be soft-deleted. Issued bills must be voided via Credit Note.');
    }
    return this.prisma.softDelete('invoice', id);
  }

  async getPayments(tenantId: string) {
    return this.prisma.payment.findMany({
      where: {
        invoice: {
          tenantId,
        },
        deletedAt: null,
      },
      include: {
        invoice: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- INTERNAL EBILL SYNC LOGIC ---

  private async syncEbillWithIrd(invoice: any, sellerPan: string, verificationHash: string) {
    const payload = {
      seller_pan: sellerPan,
      buyer_pan: invoice.customer.panNumber || '',
      buyer_name: invoice.customer.name,
      bill_no: invoice.invoiceNo,
      fiscal_year: invoice.fiscalYear,
      bill_date: invoice.billDateBS,
      amount: Number(invoice.subTotal),
      discount: Number(invoice.discount),
      taxable_amount: Number(invoice.taxableAmt),
      tax_amount: Number(invoice.vatAmount),
      total_amount: Number(invoice.totalAmount),
      is_printed: true,
      entered_by: invoice.printedBy || 'billing_clerk',
      verification_hash: verificationHash,
    };

    try {
      await this.prisma.ebill.create({
        data: {
          invoiceId: invoice.id,
          payloadSent: payload,
          responseRecv: { status: 'SUCCESS', sync_id: `CBMS-${Math.floor(Math.random() * 999999)}` },
          statusCode: 200,
          syncStatus: 'SUCCESS',
          verifiedHash: verificationHash,
        },
      });
    } catch (err: any) {
      await this.prisma.ebill.create({
        data: {
          invoiceId: invoice.id,
          payloadSent: payload,
          responseRecv: { error: err.message },
          statusCode: 500,
          syncStatus: 'FAILED',
          verifiedHash: verificationHash,
        },
      });
    }
  }
}
