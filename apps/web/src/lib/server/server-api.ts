import { cookies } from 'next/headers';
import { API_INTERNAL_URL } from './config';

export class ServerApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ServerApiError';
    this.status = status;
  }
}

interface ServerFetchOptions {
  method?: string;
  body?: unknown;
  tags?: string[];
  revalidate?: number;
}

export async function serverFetch<T = any>(
  path: string,
  opts: ServerFetchOptions = {},
): Promise<T> {
  const jar = await cookies();
  const token = jar.get('token')?.value;
  const subdomain = jar.get('subdomain')?.value;

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (subdomain) headers['x-tenant-subdomain'] = subdomain;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const url = `${API_INTERNAL_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    next:
      opts.revalidate !== undefined || opts.tags
        ? { revalidate: opts.revalidate, tags: opts.tags }
        : undefined,
    cache: opts.revalidate === undefined && !opts.tags ? 'no-store' : undefined,
  });

  if (!res.ok) {
    let message = 'Request failed';
    try {
      const j = await res.json();
      message = Array.isArray(j.message) ? j.message.join(', ') : j.message || message;
    } catch {
      message = res.statusText || message;
    }
    throw new ServerApiError(message, res.status);
  }

  const contentType = res.headers.get('Content-Type') || '';
  return (contentType.includes('application/json') ? res.json() : res.text()) as Promise<T>;
}
