const VIDEO_IDS = new Set([
  '1VIFSHeXNrz0uLuugzlPBy9OIC8kHGOCF',
  '12zkM7CRfm6Oq6cDVDMFQo_wiF_zbKR6I',
  '1nZQ489DgKAsjVAnaNdfJg3ndVujgBsX-',
  '1-0cWzrI4DeMdxKBJPyggBdM004oT85zZ',
]);

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !VIDEO_IDS.has(id)) return new Response('Invalid video', { status: 400 });

  const range = request.headers.get('range');
  if (range && !/^bytes=\d*-\d*$/.test(range)) {
    return new Response('Invalid range', { status: 400 });
  }

  try {
    const upstream = await fetch(
      `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,
      { headers: range ? { Range: range } : {}, cache: 'no-store', signal: request.signal },
    );
    if (upstream.status === 416) {
      const headers = new Headers();
      const contentRange = upstream.headers.get('content-range');
      if (contentRange) headers.set('Content-Range', contentRange);
      await upstream.body?.cancel();
      return new Response(null, { status: 416, headers });
    }
    if (!upstream.ok || !/^video\/mp4(?:;|$)/i.test(upstream.headers.get('content-type') || '')) {
      await upstream.body?.cancel();
      return new Response('Video unavailable', { status: 502 });
    }

    const headers = new Headers({
      'Content-Type': 'video/mp4',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    for (const name of ['content-length', 'content-range', 'accept-ranges']) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return new Response('Video unavailable', { status: 502 });
  }
}
