import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { 
  CreateCustomerDto, 
  UpdateCustomerDto,
  DeactivateCustomerDto,
  CreateCustomerContactDto, 
  CreateLeadDto, 
  CreateLeadActivityDto, 
  UpdateLeadStatusDto 
} from './dto/crm.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Request } from 'express';

@ApiTags('CRM Operations')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // --- CUSTOMER ENDPOINTS ---

  @Post('customers')
  @RequirePermissions('lead:write')
  @ApiOperation({ summary: 'Create a new customer profile' })
  async createCustomer(@Body() dto: CreateCustomerDto, @Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.crmService.createCustomer(dto, tenantId);
  }

  @Get('customers/search')
  @RequirePermissions('lead:read')
  @ApiOperation({ summary: 'Search customers by name or PAN number' })
  async searchCustomers(@Query('q') query: string, @Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.crmService.searchCustomers(query || '', tenantId);
  }

  @Get('customers')
  @RequirePermissions('lead:read')
  @ApiOperation({ summary: 'Get all customers' })
  async getCustomers(@Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.crmService.getCustomers(tenantId);
  }

  @Get('customers/:id')
  @RequirePermissions('lead:read')
  @ApiOperation({ summary: 'Get customer details by ID' })
  async getCustomerById(@Param('id') id: string, @Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.crmService.getCustomerById(id, tenantId);
  }

  @Patch('customers/:id')
  @RequirePermissions('lead:write')
  @ApiOperation({ summary: 'Update customer details' })
  async updateCustomer(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @Req() req: Request,
  ) {
    const tenantId = req['user'].tenantId;
    return this.crmService.updateCustomer(id, dto, tenantId);
  }

  @Patch('customers/:id/deactivate')
  @RequirePermissions('lead:write')
  @ApiOperation({ summary: 'Deactivate / toggle customer active status' })
  async deactivateCustomer(
    @Param('id') id: string,
    @Body() dto: DeactivateCustomerDto,
    @Req() req: Request,
  ) {
    const tenantId = req['user'].tenantId;
    return this.crmService.deactivateCustomer(id, dto, tenantId);
  }

  @Get('customers/:id/timeline')
  @RequirePermissions('lead:read')
  @ApiOperation({ summary: 'Get customer activity log history timeline' })
  async getCustomerTimeline(@Param('id') id: string, @Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.crmService.getCustomerTimeline(id, tenantId);
  }

  @Delete('customers/:id')
  @RequirePermissions('lead:write')
  @ApiOperation({ summary: 'Soft delete a customer' })
  async deleteCustomer(@Param('id') id: string, @Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.crmService.softDeleteCustomer(id, tenantId);
  }

  // --- CUSTOMER CONTACTS ---

  @Post('customers/:id/contacts')
  @RequirePermissions('lead:write')
  @ApiOperation({ summary: 'Create a contact person for customer' })
  async createContact(
    @Param('id') customerId: string,
    @Body() dto: CreateCustomerContactDto,
    @Req() req: Request,
  ) {
    const tenantId = req['user'].tenantId;
    return this.crmService.createContact(customerId, dto, tenantId);
  }

  @Delete('contacts/:id')
  @RequirePermissions('lead:write')
  @ApiOperation({ summary: 'Soft delete a customer contact' })
  async deleteContact(@Param('id') id: string, @Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.crmService.softDeleteContact(id, tenantId);
  }

  // --- LEADS ENDPOINTS ---

  @Post('leads')
  @RequirePermissions('lead:write')
  @ApiOperation({ summary: 'Create a lead' })
  async createLead(@Body() dto: CreateLeadDto, @Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.crmService.createLead(dto, tenantId);
  }

  @Get('leads')
  @RequirePermissions('lead:read')
  @ApiOperation({ summary: 'Get all leads' })
  async getLeads(@Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.crmService.getLeads(tenantId);
  }

  @Patch('leads/:id/status')
  @RequirePermissions('lead:write')
  @ApiOperation({ summary: 'Update lead pipeline stage' })
  async updateLeadStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
    @Req() req: Request,
  ) {
    const tenantId = req['user'].tenantId;
    return this.crmService.updateLeadStatus(id, dto, tenantId);
  }

  @Post('leads/:id/activities')
  @RequirePermissions('lead:write')
  @ApiOperation({ summary: 'Log a lead activity note/meeting' })
  async createActivity(
    @Param('id') leadId: string,
    @Body() dto: CreateLeadActivityDto,
    @Req() req: Request,
  ) {
    const tenantId = req['user'].tenantId;
    const username = req['user'].name;
    return this.crmService.createActivity(leadId, dto, username, tenantId);
  }

  @Delete('leads/:id')
  @RequirePermissions('lead:write')
  @ApiOperation({ summary: 'Soft delete a sales lead' })
  async deleteLead(@Param('id') id: string, @Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.crmService.softDeleteLead(id, tenantId);
  }
}
