import { Controller, Post, Get, Param, UseGuards, Req, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EbillingService } from './ebilling.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Request } from 'express';

@ApiTags('eBilling Compliance')
@Controller('ebilling')
export class EbillingController {
  constructor(private readonly ebillingService: EbillingService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('invoice:write')
  @ApiOperation({ summary: 'Submit invoice bill details to Nepal IRD portal (Simulated)' })
  @ApiResponse({ status: 200, description: 'Invoice processed with submission status' })
  @Post('submit/:invoiceId')
  async submitBill(
    @Param('invoiceId') invoiceId: string,
    @Req() req: Request,
  ) {
    const tenantId = req['user'].tenantId;
    return this.ebillingService.submitEbill(invoiceId, tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('invoice:read')
  @ApiOperation({ summary: 'Get sync status metadata for a specific invoice eBill' })
  @ApiResponse({ status: 200, description: 'Return log details' })
  @Get('status/:invoiceId')
  async getStatus(
    @Param('invoiceId') invoiceId: string,
    @Req() req: Request,
  ) {
    const tenantId = req['user'].tenantId;
    return this.ebillingService.getEbillStatus(invoiceId, tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('invoice:read')
  @ApiOperation({ summary: 'Get all eBilling sync logs for audit reports' })
  @ApiResponse({ status: 200, description: 'Return logs array' })
  @Get('logs')
  async getSyncLogs(@Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.ebillingService.getSyncLogs(tenantId);
  }

  /**
   * Simulated Nepal Inland Revenue Department (IRD) Portal Endpoint.
   * Receives CBMS JSON submissions and returns standard 200 Accepted or 400/500 errors.
   */
  @ApiOperation({ summary: 'Simulated Nepal IRD Portal receiver endpoint (CBMS Server)' })
  @Post('mock-ird')
  @HttpCode(200)
  async mockIrdPortal(@Body() payload: any) {
    const buyerPan = payload.buyer_pan;
    const sellerPan = payload.seller_pan;
    const total = payload.total_amount;

    const errors: string[] = [];
    if (buyerPan && !/^\d{9}$/.test(buyerPan)) {
      errors.push('Nepal IRD compliance requires 9-digit Buyer PAN');
    }
    if (!/^\d{9}$/.test(sellerPan)) {
      errors.push('Nepal IRD compliance requires 9-digit Seller PAN');
    }
    if (total <= 0) {
      errors.push('Amounts sum total must be positive');
    }

    if (errors.length > 0) {
      return {
        status: 'REJECTED',
        error_code: 'IRD-400-SCHEMA',
        errors,
      };
    }

    return {
      status: 'ACCEPTED',
      sync_id: `CBMS-${Math.floor(Math.random() * 900000 + 100000)}`,
      received_timestamp: new Date().toISOString(),
      message: 'Validated and logged in Inland Revenue Department DB',
    };
  }
}
