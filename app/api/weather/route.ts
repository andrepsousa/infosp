export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const latitude = Number(params.get('lat'));
  const longitude = Number(params.get('lon'));
  if (!params.has('lat') || !params.has('lon') || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return Response.json({ error: 'Localização inválida.' }, { status: 400 });
  }
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({ latitude: latitude.toFixed(2), longitude: longitude.toFixed(2), current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m', hourly: 'temperature_2m,precipitation_probability,weather_code', daily: 'temperature_2m_max,temperature_2m_min', timezone: 'America/Sao_Paulo', forecast_days: '2' }).toString();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Clima indisponível');
    const data = await response.json() as Record<string, unknown>;
    return Response.json({ ...data, fetchedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'public, max-age=600' } });
  } catch { return Response.json({ error: 'Não foi possível atualizar o clima.' }, { status: 503 }); }
}
