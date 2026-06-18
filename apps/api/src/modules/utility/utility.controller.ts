import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UtilityService } from './utility.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Request } from 'express';

@ApiTags('System Utilities & Auditing')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('utility')
export class UtilityController {
  constructor(private readonly utilityService: UtilityService) {}

  @Get('dashboard')
  @RequirePermissions('report:read')
  @ApiOperation({ summary: 'Get aggregated dashboard analytics stats' })
  async getDashboardStats(@Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.utilityService.getDashboardStats(tenantId);
  }

  @Get('audit-logs')
  @RequirePermissions('report:read')
  @ApiOperation({ summary: 'Get all tenant transaction audit trail history' })
  async getAuditLogs(@Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.utilityService.getAuditLogs(tenantId);
  }

  @Get('notifications')
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'Get all SMS/Email logs history' })
  async getNotifications(@Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.utilityService.getNotifications(tenantId);
  }

  @Get('reports')
  @RequirePermissions('report:read')
  @ApiOperation({ summary: 'Get all generated tax and compliance report history' })
  async getReports(@Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.utilityService.getReports(tenantId);
  }

  @Post('reports/generate')
  @RequirePermissions('report:read')
  @ApiOperation({ summary: 'Request generation of a new financial tax report' })
  async generateReport(
    @Body('title') title: string,
    @Body('type') type: string, // TAX, SALES, AUDIT
    @Body('parameters') parameters: any,
    @Req() req: Request,
  ) {
    const tenantId = req['user'].tenantId;
    return this.utilityService.generateReport(title, type, parameters, tenantId);
  }
}
