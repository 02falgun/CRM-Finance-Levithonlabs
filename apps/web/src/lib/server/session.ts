import { cookies } from 'next/headers';

export interface ServerUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}

export interface ServerTenant {
  id: string;
  subdomain: string;
}

export interface ServerSession {
  user: ServerUser;
  tenant: ServerTenant;
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = Buffer.from(part, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<ServerSession | null> {
  const jar = await cookies();
  const token = jar.get('token')?.value;
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  return {
    user: {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
    },
    tenant: {
      id: payload.tenantId,
      subdomain: jar.get('subdomain')?.value || '',
    },
  };
}

export function hasPermission(session: ServerSession | null, permission: string): boolean {
  if (!session) return false;
  if (session.user.roles.includes('TENANT_ADMIN')) return true;
  return session.user.permissions.includes(permission);
}
