import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_INTERNAL_URL } from '../../../../lib/server/config';

async function forward(req: NextRequest, segments: string[]) {
  const jar = await cookies();
  const token = jar.get('token')?.value;
  const subdomain = jar.get('subdomain')?.value;

  const path = segments.map(encodeURIComponent).join('/');
  const search = req.nextUrl.search || '';
  const url = `${API_INTERNAL_URL}/${path}${search}`;

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (subdomain) headers['x-tenant-subdomain'] = subdomain;

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  let body: string | undefined;
  if (hasBody) {
    body = await req.text();
    const ct = req.headers.get('Content-Type');
    if (ct) headers['Content-Type'] = ct;
  }

  const apiRes = await fetch(url, {
    method: req.method,
    headers,
    body,
    cache: 'no-store',
  });

  const contentType = apiRes.headers.get('Content-Type') || '';

  // Stream binary (PDF) responses straight through.
  if (!contentType.includes('application/json') && !contentType.includes('text/')) {
    const buf = await apiRes.arrayBuffer();
    return new NextResponse(buf, {
      status: apiRes.status,
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Disposition': apiRes.headers.get('Content-Disposition') || '',
      },
    });
  }

  const text = await apiRes.text();
  return new NextResponse(text, {
    status: apiRes.status,
    headers: { 'Content-Type': contentType || 'application/json' },
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
