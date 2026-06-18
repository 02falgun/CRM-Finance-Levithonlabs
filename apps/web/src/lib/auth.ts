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
  token: string;
  user: UserSession;
  tenant: TenantContext;
}

export function saveSession(data: SessionData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', data.token);
  localStorage.setItem('subdomain', data.tenant.subdomain);
  localStorage.setItem('user', JSON.stringify(data.user));
  localStorage.setItem('tenant', JSON.stringify(data.tenant));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('subdomain');
  localStorage.removeItem('user');
  localStorage.removeItem('tenant');
}

export function getSessionUser(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function getSessionTenant(): TenantContext | null {
  if (typeof window === 'undefined') return null;
  const tenant = localStorage.getItem('tenant');
  if (!tenant) return null;
  try {
    return JSON.parse(tenant);
  } catch {
    return null;
  }
}

export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
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

export function isAuthenticated(): boolean {
  return !!getSessionToken() && !!getSessionUser();
}
