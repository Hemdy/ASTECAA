/**
 * ASTECAA Cloudflare Worker Edge Gateway
 * - Direct R2 media serving with edge caching and range requests
 * - CORS preflight handling at the edge with zero round-trip latency
 * - Proxying and edge caching for API endpoints
 */

export interface Env {
  MEDIA_BUCKET?: R2Bucket;
  BACKEND_API_URL: string;
  ALLOWED_ORIGINS: string;
  ENVIRONMENT?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = (env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    const isAllowedOrigin =
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*') ||
      origin.endsWith('.astecaa.org');

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': isAllowedOrigin ? origin : (allowedOrigins[0] || '*'),
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    };

    // 1. Handle CORS Preflight at the Edge
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // 2. Direct Cloudflare R2 Media Serving: /media/*
    if (url.pathname.startsWith('/media/') && env.MEDIA_BUCKET) {
      const key = decodeURIComponent(url.pathname.replace(/^\/media\//, ''));
      if (!key) {
        return new Response('Not Found', { status: 404, headers: corsHeaders });
      }

      // Check R2 object
      const object = await env.MEDIA_BUCKET.get(key, {
        range: request.headers,
        onlyIf: request.headers,
      });

      if (!object) {
        return new Response('Media file not found in R2 storage.', {
          status: 404,
          headers: corsHeaders,
        });
      }

      const headers = new Headers(corsHeaders);
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');

      const status = object.body ? (request.headers.get('range') ? 206 : 200) : 304;
      return new Response(object.body, {
        headers,
        status,
      });
    }

    // 3. Health check at the edge
    if (url.pathname === '/edge-health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'astecaa-cloudflare-edge',
          region: request.cf?.colo || 'edge',
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 4. Proxy API requests to backend API origin
    const backendOrigin = (env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
    const targetUrl = new URL(url.pathname + url.search, backendOrigin);

    const proxyRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      redirect: 'manual',
    });

    try {
      const response = await fetch(proxyRequest);
      const modifiedHeaders = new Headers(response.headers);

      // Merge CORS headers
      for (const [key, val] of Object.entries(corsHeaders)) {
        modifiedHeaders.set(key, val);
      }

      // Edge caching for read-only public CMS data
      if (
        request.method === 'GET' &&
        (url.pathname.startsWith('/api/v1/gallery') ||
          url.pathname.startsWith('/api/v1/timeline') ||
          url.pathname.startsWith('/api/v1/events'))
      ) {
        modifiedHeaders.set('Cache-Control', 'public, max-age=60, s-maxage=300');
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: modifiedHeaders,
      });
    } catch (err: any) {
      return new Response(
        JSON.stringify({
          error: 'Gateway Error',
          message: 'Could not connect to ASTECAA upstream API.',
          details: err.message,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }
  },
};
