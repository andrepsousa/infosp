import { getNews } from '@/lib/news';
export async function GET() {
  const result = await getNews();
  return Response.json(result, { status: result.items.length ? 200 : 503, headers: { 'Cache-Control': 'public, max-age=300' } });
}
