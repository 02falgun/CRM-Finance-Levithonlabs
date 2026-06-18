import { Controller, Get, Post, Patch, Put, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { UpdateProfileDto, UpdateSettingDto, CreateTenantUserDto } from './dto/tenant.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Request } from 'express';

@ApiTags('Tenant Settings & Profile')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('profile')
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'Get current company profile settings' })
  async getProfile(@Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.tenantService.getProfile(tenantId);
  }

  @Patch('profile')
  @RequirePermissions('user:write')
  @ApiOperation({ summary: 'Update company profile configuration details' })
  async updateProfile(@Body() dto: UpdateProfileDto, @Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.tenantService.updateProfile(dto, tenantId);
  }

  @Get('settings')
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'Get all tenant setting configuration keys' })
  async getSettings(@Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.tenantService.getSettings(tenantId);
  }

  @Put('settings/:key')
  @RequirePermissions('user:write')
  @ApiOperation({ summary: 'Update or create custom tenant configuration key' })
  async updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
    @Req() req: Request,
  ) {
    const tenantId = req['user'].tenantId;
    return this.tenantService.updateSetting(key, dto, tenantId);
  }

  @Get('users')
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'Get all tenant users list' })
  async getTenantUsers(@Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.tenantService.getTenantUsers(tenantId);
  }

  @Post('users')
  @RequirePermissions('user:write')
  @ApiOperation({ summary: 'Create a new user within the tenant' })
  async createTenantUser(@Body() dto: CreateTenantUserDto, @Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.tenantService.createTenantUser(dto, tenantId);
  }

  @Patch('users/:id/toggle-active')
  @RequirePermissions('user:write')
  @ApiOperation({ summary: 'Toggle user active status' })
  async toggleUserActive(@Param('id') id: string, @Req() req: Request) {
    const tenantId = req['user'].tenantId;
    return this.tenantService.toggleUserActive(id, tenantId);
  }
}

