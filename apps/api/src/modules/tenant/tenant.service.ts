import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, UpdateSettingDto, CreateTenantUserDto } from './dto/tenant.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(tenantId: string) {
    const profile = await this.prisma.companyProfile.findUnique({
      where: { tenantId },
    });
    if (!profile) {
      throw new NotFoundException('Company profile not configured');
    }
    return profile;
  }

  async updateProfile(dto: UpdateProfileDto, tenantId: string) {
    return this.prisma.companyProfile.upsert({
      where: { tenantId },
      update: {
        ...dto,
      },
      create: {
        tenantId,
        ...dto,
      },
    });
  }

  async getSettings(tenantId: string) {
    return this.prisma.setting.findMany({
      where: { tenantId, deletedAt: null },
    });
  }

  async updateSetting(key: string, dto: UpdateSettingDto, tenantId: string) {
    return this.prisma.setting.upsert({
      where: {
        tenantId_key: {
          tenantId,
          key,
        },
      },
      update: {
        value: dto.value,
      },
      create: {
        tenantId,
        key,
        value: dto.value,
      },
    });
  }

  async getTenantUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        roles: {
          where: { deletedAt: null },
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTenantUser(dto: CreateTenantUserDto, tenantId: string) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const role = await this.prisma.role.findFirst({
      where: { tenantId, name: dto.role, deletedAt: null },
    });
    if (!role) {
      throw new NotFoundException(`Role ${dto.role} not found for this tenant`);
    }

    const passwordHash = await bcrypt.hash('password123', 10);
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId,
          email: dto.email,
          name: dto.name,
          passwordHash,
          isActive: true,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });

      return user;
    });
  }

  async toggleUserActive(userId: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
  }
}

