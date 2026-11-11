export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() || '';
  if (query.length < 2 || query.length > 100) return Response.json({ results: [] });
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=pt&countryCode=BR&format=json`, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error('Busca indisponível');
    return Response.json(await response.json(), { headers: { 'Cache-Control': 'public, max-age=86400' } });
  } catch { return Response.json({ error: 'Não foi possível buscar cidades.' }, { status: 503 }); }
}
