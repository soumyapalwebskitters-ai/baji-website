import { catalogOrigin } from '@/lib/catalog';
export async function GET(request: Request) {
  const source = new URL(request.url).searchParams.get('url');
  try {
    const url = new URL(source || '');
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || !['drive.google.com', 'drive.usercontent.google.com'].includes(url.hostname)) return new Response('Invalid image', { status: 400 });
    const response = await fetch(`${catalogOrigin}/api/gallery-image?url=${encodeURIComponent(url.href)}`, { signal: AbortSignal.timeout(20000) });
    if (!response.ok || !/^image\/(jpeg|png|webp|gif|avif)(;|$)/.test(response.headers.get('content-type') || '')) return new Response('Image unavailable', { status: 502 });
    return new Response(response.body, { headers: { 'Content-Type': response.headers.get('content-type')!, 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return new Response('Image unavailable', { status: 502 }); }
}
