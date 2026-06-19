export interface UserSession {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}

export interface TenantContext {
  id: string;
  subdomain: string;
}

export interface SessionData {
  user: UserSession;
  tenant: TenantContext;
}

function readSessionCookie(): SessionData | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('session='));
  if (!match) return null;
  try {
    const raw = decodeURIComponent(match.split('=').slice(1).join('='));
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getSessionUser(): UserSession | null {
  return readSessionCookie()?.user ?? null;
}

export function getSessionTenant(): TenantContext | null {
  return readSessionCookie()?.tenant ?? null;
}

export function isAuthenticated(): boolean {
  return !!readSessionCookie();
}

export async function clearSession() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore network errors on logout
  }
}

export function hasPermission(permission: string): boolean {
  const user = getSessionUser();
  if (!user) return false;
  if (user.roles.includes('TENANT_ADMIN')) return true;
  return user.permissions.includes(permission);
}

export function hasRole(role: string): boolean {
  const user = getSessionUser();
  if (!user) return false;
  return user.roles.includes(role);
}
