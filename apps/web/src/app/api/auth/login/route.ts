import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_INTERNAL_URL, authCookieOptions, sessionCookieOptions } from '../../../../lib/server/config';

export async function POST(req: NextRequest) {
  const { email, password, subdomain } = await req.json();

  const res = await fetch(`${API_INTERNAL_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-subdomain': subdomain || '',
    },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message || 'Authentication failed';
    return NextResponse.json({ message }, { status: res.status });
  }

  const jar = await cookies();
  jar.set('token', data.accessToken, authCookieOptions());
  jar.set('subdomain', data.tenant.subdomain, authCookieOptions());
  jar.set(
    'session',
    encodeURIComponent(JSON.stringify({ user: data.user, tenant: data.tenant })),
    sessionCookieOptions(),
  );

  return NextResponse.json({ user: data.user, tenant: data.tenant });
}
