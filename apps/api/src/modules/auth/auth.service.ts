import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../integration/mail.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, currentTenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        tenantId: currentTenantId,
        deletedAt: null,
      },
      include: {
        tenant: true,
        roles: {
          where: { deletedAt: null },
          include: {
            role: {
              include: {
                permissions: {
                  where: { deletedAt: null },
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password for this tenant');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is disabled');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Extract roles and flat map permissions list
    const rolesList = user.roles.map(ur => ur.role.name);
    const permissionsList = Array.from(
      new Set(
        user.roles.flatMap(ur => 
          ur.role.permissions.map(rp => rp.permission.action)
        )
      )
    );

    // Generate token containing JWT session data
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      roles: rolesList,
      permissions: permissionsList,
      tenantId: user.tenantId,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: rolesList,
        permissions: permissionsList,
      },
      tenant: {
        id: user.tenant.id,
        subdomain: user.tenant.subdomain,
      },
    };
  }

  async register(dto: RegisterDto) {
    // Check if subdomain already exists
    const existingTenant = await this.prisma.tenant.findFirst({
      where: { subdomain: dto.subdomain, deletedAt: null },
    });

    if (existingTenant) {
      throw new BadRequestException('Subdomain is already taken');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (existingUser) {
      throw new BadRequestException('Email address is already registered');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create Tenant, CompanyProfile, Role, and User in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          subdomain: dto.subdomain,
        },
      });

      await tx.companyProfile.create({
        data: {
          tenantId: tenant.id,
          name: dto.tenantName,
          panNumber: dto.panNumber || '987654321',
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          passwordHash,
          tenantId: tenant.id,
        },
      });

      // Create Admin Role for this Tenant
      const adminRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'TENANT_ADMIN',
          description: 'Tenant Administrator',
        },
      });

      // Map User to Admin Role
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });

      // Add default configurations
      await tx.setting.create({
        data: {
          tenantId: tenant.id,
          key: 'IRD_API_ENDPOINT',
          value: 'http://202.166.117.75:9090/api/bill',
        },
      });

      return { tenant, user };
    });

    const payload = {
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      roles: ['TENANT_ADMIN'],
      permissions: [], // Admin Guard skips check
      tenantId: result.user.tenantId,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        roles: ['TENANT_ADMIN'],
        permissions: [],
      },
      tenant: {
        id: result.tenant.id,
        subdomain: result.tenant.subdomain,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email, deletedAt: null },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException('No account found with this email address');
    }

    // Generate a short-lived token (15 mins) for password reset
    const token = await this.jwtService.signAsync(
      { userId: user.id, type: 'reset' },
      { expiresIn: '15m' }
    );

    // Resolve frontend domain dynamically
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'https://crm.levithonlabs.com';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    // Trigger email notification via integration MailService
    await this.mailService.sendPasswordResetEmail(user.email, token);

    // Save notification log in DB
    await this.prisma.notification.create({
      data: {
        tenantId: user.tenantId,
        type: 'EMAIL',
        recipient: user.email,
        message: `Password reset request. Link: ${resetLink}`,
        status: 'SENT',
      },
    });

    return { message: 'Password reset link has been dispatched to your email' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(dto.token);
      if (payload.type !== 'reset') {
        throw new Error('Invalid token type');
      }
    } catch (error) {
      throw new BadRequestException('The reset link is invalid or has expired');
    }

    const userId = payload.userId;
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User account not found');
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Update password in DB
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Save audit log
    await this.prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'USER_PASSWORD_RESET',
        entityName: 'User',
        entityId: user.id,
        newValue: { message: 'Password reset successfully completed' },
      },
    });

    return { message: 'Password has been updated successfully' };
  }
}
