// All client data calls go through the same-origin Next.js BFF proxy.
// The proxy injects the httpOnly JWT cookie as a Bearer token + tenant header,
// so no token is ever exposed to client JS.
const API_BASE = '/api/proxy';

export async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorJson = await res.json();
      errorMsg = errorJson.message || errorJson.error || errorMsg;
      if (Array.isArray(errorMsg)) {
        errorMsg = errorMsg.join(', ');
      }
    } catch {
      errorMsg = res.statusText || errorMsg;
    }

    if (res.status === 401 && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname !== '/login' && pathname !== '/signup') {
        window.location.href = '/login';
      }
    }

    throw new Error(errorMsg);
  }

  const contentType = res.headers.get('Content-Type') || '';
  if (contentType.includes('application/pdf')) {
    return res.blob();
  }

  return res.json();
}

export const api = {
  get: (path: string, options?: RequestInit) => request(path, { ...options, method: 'GET' }),
  post: (path: string, body?: any, options?: RequestInit) =>
    request(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: (path: string, body?: any, options?: RequestInit) =>
    request(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: (path: string, body?: any, options?: RequestInit) =>
    request(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: (path: string, options?: RequestInit) => request(path, { ...options, method: 'DELETE' }),
};
