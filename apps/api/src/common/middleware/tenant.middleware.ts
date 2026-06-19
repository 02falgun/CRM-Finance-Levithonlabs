import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { CacheService } from '../../modules/cache/cache.service';
import { CacheKeys, CacheTTL } from '../../modules/cache/cache-keys';

interface CachedTenant {
  id: string;
  subdomain: string;
  isActive: boolean;
  companyProfile: { name: string; panNumber: string | null } | null;
}

declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        name: string;
        subdomain: string;
        panNumber: string | null;
      };
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Resolve tenant subdomain from custom header or host domain
    let subdomain = req.headers['x-tenant-subdomain'] as string;

    if (!subdomain) {
      const host = req.headers.host || '';
      // E.g., demo.levithonlabs.com -> demo
      const parts = host.split('.');
      if (parts.length > 2) {
        subdomain = parts[0];
      }
    }

    // Default fallback to "demo" for testing/direct IP calls
    if (!subdomain) {
      subdomain = 'demo';
    }

    // 2. Resolve tenant (cache-aside: avoids a DB round-trip on every request)
    const tenant = await this.cache.wrap<CachedTenant | null>(
      CacheKeys.tenant(subdomain),
      CacheTTL.tenant,
      () =>
        this.prisma.tenant.findUnique({
          where: { subdomain },
          select: {
            id: true,
            subdomain: true,
            isActive: true,
            companyProfile: {
              select: {
                name: true,
                panNumber: true,
              },
            },
          },
        }),
    );

    if (!tenant) {
      throw new NotFoundException(`Tenant with subdomain '${subdomain}' not found.`);
    }

    if (!tenant.isActive) {
      throw new NotFoundException(`Tenant with subdomain '${subdomain}' is suspended.`);
    }

    // 3. Inject tenant context to Request object
    req.tenant = {
      id: tenant.id,
      name: tenant.companyProfile?.name || 'Unknown Company',
      subdomain: tenant.subdomain,
      panNumber: tenant.companyProfile?.panNumber || null,
    };
    next();
  }
}
