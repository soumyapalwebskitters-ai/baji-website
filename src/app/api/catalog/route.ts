import { getCatalog } from '@/lib/catalog';
export async function GET() {
  try { return Response.json(await getCatalog(), { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return Response.json({ error: 'The collection could not be loaded. Please try again shortly.' }, { status: 503 }); }
}
