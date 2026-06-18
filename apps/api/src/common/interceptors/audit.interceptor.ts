import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, tenant, user, ip } = request;
    const userAgent = request.headers['user-agent'];

    // Only log mutations (POST, PUT, PATCH, DELETE)
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    return next.handle().pipe(
      tap(async (response) => {
        if (!isMutation) return;

        try {
          // Determine entity details if possible from response or body
          let entityName = 'Unknown';
          let entityId = null;

          if (response) {
            entityId = response.id || null;
            // Guess entity name from URL path
            const pathParts = url.split('/');
            // E.g., /api/crm/leads -> Leads
            if (pathParts.length > 2) {
              entityName = pathParts[2].toUpperCase();
            }
          }

          // Create audit log entry
          await this.prisma.auditLog.create({
            data: {
              tenantId: tenant?.id || null,
              userId: user?.userId || null,
              action: `${method}_${entityName}`,
              entityName,
              entityId: entityId ? String(entityId) : null,
              newValue: body ? JSON.parse(JSON.stringify(body)) : null,
              oldValue: null, // In production, query previous state if needed
              ipAddress: ip || null,
              userAgent: userAgent || null,
            },
          });
        } catch (error: any) {
          console.error('Failed to save audit log:', error.message);
        }
      }),
    );
  }
}
