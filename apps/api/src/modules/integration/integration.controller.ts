import { Controller, Get, Post, Param, Res, UseGuards, Req, NotFoundException, BadRequestException } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PdfService } from './pdf.service';
import { MailService } from './mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Integrations Engine')
@Controller('integration')
export class IntegrationController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('invoice:read')
  @ApiOperation({ summary: 'Download generated invoice PDF ( Nepal IRD compliance layout )' })
  @Get('pdf/invoice/:id')
  async downloadInvoicePdf(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const tenantId = req['user'].tenantId;
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        customer: {
          include: {
            contacts: { where: { deletedAt: null } },
          },
        },
        tenant: true,
        items: { where: { deletedAt: null } },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const pdfBuffer = await this.pdfService.generateInvoicePdf(invoice);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Invoice_${invoice.invoiceNo}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('invoice:read')
  @ApiOperation({ summary: 'Download generated quotation proposal PDF' })
  @Get('pdf/quotation/:id')
  async downloadQuotationPdf(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const tenantId = req['user'].tenantId;
    const quote = await this.prisma.quotation.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        customer: {
          include: {
            contacts: { where: { deletedAt: null } },
          },
        },
        tenant: true,
        items: { where: { deletedAt: null } },
      },
    });

    if (!quote) {
      throw new NotFoundException('Quotation not found');
    }

    const pdfBuffer = await this.pdfService.generateQuotationPdf(quote);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Quotation_${quote.quoteNumber}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('invoice:read')
  @ApiOperation({ summary: 'Download generated payment receipt PDF' })
  @Get('pdf/receipt/:id')
  async downloadReceiptPdf(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const tenantId = req['user'].tenantId;
    const payment = await this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
      include: {
        invoice: {
          include: {
            customer: {
              include: {
                contacts: { where: { deletedAt: null } },
              },
            },
            tenant: true,
          },
        },
      },
    });

    if (!payment || payment.invoice?.tenantId !== tenantId) {
      throw new NotFoundException('Payment record not found');
    }

    const pdfBuffer = await this.pdfService.generateReceiptPdf(payment);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Receipt_${payment.id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('invoice:read')
  @ApiOperation({ summary: 'Download generated system audit reports PDF' })
  @Get('pdf/report/:id')
  async downloadReportPdf(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const tenantId = req['user'].tenantId;
    const report = await this.prisma.report.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!report) {
      throw new NotFoundException('Report record not found');
    }

    const pdfBuffer = await this.pdfService.generateReportPdf(report);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Report_${report.id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('invoice:write')
  @ApiOperation({ summary: 'Email Tax Invoice PDF to customer contact' })
  @Post('email/invoice/:id')
  async emailInvoice(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const tenantId = req['user'].tenantId;
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        customer: {
          include: {
            contacts: { where: { deletedAt: null } },
          },
        },
        tenant: true,
        items: { where: { deletedAt: null } },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const customerEmail = invoice.customer?.contacts?.[0]?.email || 'finance@buyercompany.com';
    const pdfBuffer = await this.pdfService.generateInvoicePdf(invoice);

    await this.mailService.sendInvoiceEmail(customerEmail, invoice, pdfBuffer);

    // Save notification log in DB
    await this.prisma.notification.create({
      data: {
        tenantId,
        type: 'EMAIL',
        recipient: customerEmail,
        message: `Sent invoice ${invoice.invoiceNo} PDF to buyer contact`,
        status: 'SENT',
      },
    });

    return { message: `Invoice successfully dispatched to ${customerEmail}` };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('invoice:write')
  @ApiOperation({ summary: 'Email Quotation Proposal PDF to customer contact' })
  @Post('email/quotation/:id')
  async emailQuotation(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const tenantId = req['user'].tenantId;
    const quote = await this.prisma.quotation.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        customer: {
          include: {
            contacts: { where: { deletedAt: null } },
          },
        },
        tenant: true,
        items: { where: { deletedAt: null } },
      },
    });

    if (!quote) {
      throw new NotFoundException('Quotation not found');
    }

    const customerEmail = quote.customer?.contacts?.[0]?.email || 'procurement@buyercompany.com';
    const pdfBuffer = await this.pdfService.generateQuotationPdf(quote);

    await this.mailService.sendQuotationEmail(customerEmail, quote, pdfBuffer);

    // Save notification log
    await this.prisma.notification.create({
      data: {
        tenantId,
        type: 'EMAIL',
        recipient: customerEmail,
        message: `Sent quotation proposal ${quote.quoteNumber} PDF to buyer contact`,
        status: 'SENT',
      },
    });

    return { message: `Quotation proposal successfully dispatched to ${customerEmail}` };
  }
}
