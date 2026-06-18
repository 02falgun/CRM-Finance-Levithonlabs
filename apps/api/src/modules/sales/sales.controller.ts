import { Controller, Post, Get, Patch, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { 
  CreateInvoiceDto, 
  CreateCreditNoteDto, 
  CreateQuotationDto, 
  CreatePaymentDto, 
  CreateTaxDto 
} from './dto/sales.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Request } from 'express';

@ApiTags('Billing & Invoicing Operations')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // --- TAX CONFIGS ---

  @Post('taxes')
  @RequirePermissions('invoice:write')
  @ApiOperation({ summary: 'Create a new tax category rate' })
  async createTax(@Body() dto: CreateTaxDto, @Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.salesService.createTax(dto, tenantId);
  }

  @Get('taxes')
  @RequirePermissions('invoice:read')
  @ApiOperation({ summary: 'Get all tax options' })
  async getTaxes(@Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.salesService.getTaxes(tenantId);
  }

  // --- QUOTATIONS ---

  @Post('quotations')
  @RequirePermissions('invoice:write')
  @ApiOperation({ summary: 'Create a quotation' })
  async createQuotation(@Body() dto: CreateQuotationDto, @Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.salesService.createQuotation(dto, tenantId);
  }

  @Get('quotations')
  @RequirePermissions('invoice:read')
  @ApiOperation({ summary: 'Get all quotations' })
  async getQuotations(@Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.salesService.getQuotations(tenantId);
  }

  @Patch('quotations/:id/status')
  @RequirePermissions('invoice:write')
  @ApiOperation({ summary: 'Update quotation status (Sent, Approved, Rejected, Expired)' })
  async updateQuotationStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Req() req: Request,
  ) {
    const tenantId = req['user'].tenantId;
    return this.salesService.updateQuotationStatus(id, status, tenantId);
  }

  @Post('quotations/:id/convert')
  @RequirePermissions('invoice:write')
  @ApiOperation({ summary: 'Convert quotation into a draft invoice' })
  async convertQuotation(@Param('id') id: string, @Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.salesService.convertQuotationToInvoice(id, tenantId);
  }

  // --- INVOICES ---

  @Post('invoices')
  @RequirePermissions('invoice:write')
  @ApiOperation({ summary: 'Create draft invoice' })
  async createInvoice(@Body() dto: CreateInvoiceDto, @Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.salesService.createInvoice(dto, tenantId);
  }

  @Get('invoices')
  @RequirePermissions('invoice:read')
  @ApiOperation({ summary: 'Get all invoices' })
  async getInvoices(@Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.salesService.getInvoices(tenantId);
  }

  @Get('invoices/:id')
  @RequirePermissions('invoice:read')
  @ApiOperation({ summary: 'Get invoice details by ID' })
  async getInvoiceById(@Param('id') id: string, @Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.salesService.getInvoiceById(id, tenantId);
  }

  @Post('invoices/:id/print')
  @RequirePermissions('invoice:print')
  @ApiOperation({ summary: 'Lock, print, and transmit invoice data to Nepal IRD portal' })
  async registerPrint(@Param('id') id: string, @Req() req: Request) {
    const tenantId = req['user'].tenantId;
    const username = req['user'].name;
    return this.salesService.registerPrint(id, username, tenantId);
  }

  @Post('invoices/:id/credit-notes')
  @RequirePermissions('invoice:void')
  @ApiOperation({ summary: 'Generate a Credit Note to void/cancel an issued bill' })
  async createCreditNote(
    @Param('id') id: string,
    @Body() dto: CreateCreditNoteDto,
    @Req() req: Request,
  ) {
    const tenantId = req['user'].tenantId;
    return this.salesService.createCreditNote(id, dto, tenantId);
  }

  @Delete('invoices/:id')
  @RequirePermissions('invoice:write')
  @ApiOperation({ summary: 'Soft delete a draft invoice' })
  async deleteInvoice(@Param('id') id: string, @Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.salesService.softDeleteInvoice(id, tenantId);
  }

  // --- PAYMENTS ---

  @Get('payments')
  @RequirePermissions('invoice:read')
  @ApiOperation({ summary: 'Get all payments ledger logs' })
  async getPayments(@Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.salesService.getPayments(tenantId);
  }

  @Post('invoices/:id/payments')
  @RequirePermissions('invoice:print')
  @ApiOperation({ summary: 'Receive payment against an invoice' })
  async receivePayment(
    @Param('id') invoiceId: string,
    @Body() dto: CreatePaymentDto,
    @Req() req: Request,
  ) {
    const tenantId = req['user'].tenantId;
    return this.salesService.receivePayment(invoiceId, dto, tenantId);
  }
}
