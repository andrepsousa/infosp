'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Cloud, CloudRain, Download, House, LocateFixed, Map as MapIcon, MapPin, Moon, Newspaper, RefreshCw, Search, Settings, Share2, Star, Sun, TrainFront, Umbrella, Wind, X, ZoomIn, ZoomOut } from 'lucide-react';
import { connections, lines, normalize, stationsFor, type Line } from '@/lib/network';
import type { News } from '@/lib/news';

type Tab = 'home' | 'weather' | 'lines' | 'news';
type Place = { name: string; latitude: number; longitude: number; admin1?: string };
type Preferences = { name: string; favorites: number[]; place: Place; returnTime: string };
type Status = { id: number; status: string; description: string; source: string; sourceUrl: string; confirmedAt: string };
type StatusData = { lines: Status[]; checkedAt: string; errors: string[] };
type Weather = { current: { temperature_2m: number; apparent_temperature: number; weather_code: number; relative_humidity_2m: number; wind_speed_10m: number; is_day: number }; hourly: { time: string[]; temperature_2m: number[]; precipitation_probability: number[]; weather_code: number[] }; daily: { temperature_2m_max: number[]; temperature_2m_min: number[] }; fetchedAt: string };
const defaults: Preferences = { name: '', favorites: [], place: { name: 'São Paulo', latitude: -23.55, longitude: -46.63 }, returnTime: '18:00' };
const tabs = [{ id: 'home', label: 'Início', icon: House }, { id: 'weather', label: 'Clima', icon: Sun }, { id: 'lines', label: 'Linhas', icon: TrainFront }, { id: 'news', label: 'Notícias', icon: Newspaper }] as const;
const officialMap = 'https://www.metro.sp.gov.br/sua-viagem/mapa-da-rede/';
const dateLabel = (value: string) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' });
const timeLabel = (value: string) => new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
function readSaved<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } }
function save(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Continue with session state when storage is unavailable. */ } }
function weatherLabel(code: number) { if (code === 0) return 'Céu limpo'; if (code < 4) return 'Entre nuvens'; if (code < 50) return 'Neblina'; if (code < 70) return 'Chuva'; if (code < 80) return 'Neve'; if (code < 95) return 'Pancadas de chuva'; return 'Trovoadas'; }
function WeatherIcon({ code, night = false, size = 24 }: { code: number; night?: boolean; size?: number }) { const Icon = code >= 50 ? CloudRain : code > 0 ? Cloud : night ? Moon : Sun; return <Icon size={size} strokeWidth={1.5} />; }
function freshness(status?: Status) { return !!status && Number.isFinite(Date.parse(status.confirmedAt)) && Date.now() - Date.parse(status.confirmedAt) < 15 * 60000; }
function tone(status?: Status) { if (!freshness(status)) return 'unknown'; if (/normal/i.test(status!.status)) return 'normal'; if (/encerrad/i.test(status!.status)) return 'closed'; return 'warning'; }
function xml(value: string) { return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!)); }
function lineMap(line: Line, selected: string) {
  const list = stationsFor(line);
  const height = 116 + list.length * 54;
  const nodes = list.map((station, i) => {
    const y = 95 + i * 54;
    const active = selected === station;
    const links = connections(station, line.id);
    return `${active ? `<rect x="15" y="${y - 21}" width="465" height="46" rx="12" fill="#ecf8ed"/>` : ''}<circle cx="42" cy="${y}" r="${links.length ? 9 : 6}" fill="white" stroke="${line.color}" stroke-width="3"/><text x="65" y="${y + 5}" font-family="Arial,sans-serif" font-size="15" font-weight="${active ? '700' : '400'}" fill="#172b25">${xml(station)}</text>${links.map((l, j) => `<rect x="${355 + j * 24}" y="${y - 10}" width="21" height="21" rx="5" fill="${l.color}"/><text x="${365.5 + j * 24}" y="${y + 5}" text-anchor="middle" font-family="Arial" font-size="11" fill="white">${l.id}</text>`).join('')}`;
  }).join('');
  // Line 17 has a branch after Brooklin Paulista.
  const end = line.id === 17 ? list.length - 2 : list.length - 1;
  const branch = line.id === 17 ? `<path d="M42 ${95 + 5 * 54} L24 ${95 + 5 * 54 + 20} V${95 + 7 * 54} H42" fill="none" stroke="${line.color}" stroke-width="5"/>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="${height}" viewBox="0 0 500 ${height}"><rect width="500" height="${height}" rx="18" fill="white"/><text x="25" y="35" font-family="Arial" font-weight="700" font-size="20" fill="${line.color}">${line.id} · ${xml(line.name)}</text><text x="25" y="57" font-family="Arial" font-size="11" fill="#65786e">Esquema de estações • base STM, julho de 2026</text><path d="M42 95 V${95 + end * 54}" stroke="${line.color}" stroke-width="6"/>${branch}${nodes}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function InfoSP() {
  const [tab, setTab] = useState<Tab>('home');
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [ready, setReady] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [settings, setSettings] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [cities, setCities] = useState<Place[]>([]);
  const [cityBusy, setCityBusy] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherError, setWeatherError] = useState(false);
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [statusError, setStatusError] = useState(false);
  const [news, setNews] = useState<News[]>([]);
  const [newsLoaded, setNewsLoaded] = useState(false);
  const [newsError, setNewsError] = useState(false);
  const [newsChecked, setNewsChecked] = useState('');
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(true);
  const [query, setQuery] = useState('');
  const [lineFilter, setLineFilter] = useState('Todas');
  const [newsFilter, setNewsFilter] = useState('Todas');
  const [detail, setDetail] = useState<Line | null>(null);
  const [selectedStation, setSelectedStation] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [expandedLine, setExpandedLine] = useState<Line | null>(null);
  const [installHelp, setInstallHelp] = useState(false);
  const [installPlatform, setInstallPlatform] = useState('other');
  const [zoom, setZoom] = useState(1);
  const [mapsSaved, setMapsSaved] = useState(false);
  const [savingMap, setSavingMap] = useState(false);
  const [toast, setToast] = useState('');
  const [, tick] = useState(0);
  const weatherRequest = useRef(0);
  const statusRequest = useRef(false);
  const newsRequest = useRef(false);

  useEffect(() => {
    const saved = readSaved<Partial<Preferences>>('vai-preferences', {});
    const value = { ...defaults, ...saved, favorites: Array.isArray(saved.favorites) ? saved.favorites.filter(id => lines.some(l => l.id === id)) : [] };
    setPrefs(value); setNameInput(value.name); setOnboarding(!value.name); setReady(true);
    setStatusData(readSaved('vai-status', null));
    const cached = readSaved<{ items: News[]; checkedAt: string } | null>('vai-news', null);
    if (cached) { setNews(cached.items); setNewsChecked(cached.checkedAt); }
    setOnline(navigator.onLine);
    const installed = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    setInstallPlatform(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'ios' : /Android/.test(navigator.userAgent) ? 'android' : 'other');
    setInstallHelp(!installed && !readSaved('infosp-install-help-seen', false));
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener('online', sync); window.addEventListener('offline', sync);
    const interval = setInterval(() => tick(v => v + 1), 60000);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    if ('caches' in window) caches.open('vai-maps-v1').then(cache => cache.match('/rede-oficial.png')).then(result => setMapsSaved(!!result)).catch(() => {});
    return () => { window.removeEventListener('online', sync); window.removeEventListener('offline', sync); clearInterval(interval); };
  }, []);
  function updatePrefs(next: Partial<Preferences>) { setPrefs(current => { const value = { ...current, ...next }; save('vai-preferences', value); return value; }); }
  async function loadWeather() {
    const request = ++weatherRequest.current;
    const key = `vai-weather-${prefs.place.latitude.toFixed(2)}-${prefs.place.longitude.toFixed(2)}`;
    setWeather(readSaved<Weather | null>(key, null)); setWeatherError(false);
    try {
      const params = new URLSearchParams({ latitude: prefs.place.latitude.toFixed(2), longitude: prefs.place.longitude.toFixed(2), current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m', hourly: 'temperature_2m,precipitation_probability,weather_code', daily: 'temperature_2m_max,temperature_2m_min', timezone: 'America/Sao_Paulo', forecast_days: '2' });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: AbortSignal.timeout(14000) });
      if (!response.ok) throw new Error();
      const result: Weather = await response.json();
      result.fetchedAt = new Date().toISOString();
      if (!result.current || !result.hourly) throw new Error();
      if (request === weatherRequest.current) { setWeather(result); save(key, result); }
    } catch { if (request === weatherRequest.current) setWeatherError(true); }
  }
  async function loadStatus() {
    if (statusRequest.current) return;
    statusRequest.current = true; setBusy(true);
    try {
      const response = await fetch('/api/lines', { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error();
      const result: StatusData = await response.json();
      if (!Array.isArray(result.lines)) throw new Error();
      setStatusData(result); save('vai-status', result); setStatusError(false);
    } catch { setStatusError(true); }
    finally { setBusy(false); statusRequest.current = false; }
  }
  async function loadNews() {
    if (newsRequest.current) return;
    newsRequest.current = true;
    try {
      const response = await fetch('/api/news', { signal: AbortSignal.timeout(16000) });
      if (!response.ok) throw new Error();
      const result = await response.json() as { items: News[]; checkedAt: string; errors: string[] };
      setNews(result.items); setNewsChecked(result.checkedAt); setNewsError(result.errors.length > 0); save('vai-news', result);
    } catch { setNewsError(true); }
    finally { setNewsLoaded(true); newsRequest.current = false; }
  }
  useEffect(() => { if (ready) void loadWeather(); }, [ready, prefs.place.latitude, prefs.place.longitude, online]);
  useEffect(() => {
    if (!ready) return;
    void loadStatus(); void loadNews();
    const update = () => { if (document.visibilityState === 'visible' && navigator.onLine) void loadStatus(); };
    const interval = setInterval(update, 120000);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', update); };
  }, [ready, online]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    if (cityQuery.trim().length < 2) { setCities([]); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setCityBusy(true);
      try { const response = await fetch(`/api/cities?q=${encodeURIComponent(cityQuery)}`, { signal: controller.signal }); if (!response.ok) throw new Error(); const result = await response.json() as { results?: Place[] }; setCities(result.results || []); }
      catch { if (!controller.signal.aborted) setToast('Busca indisponível. Tente novamente.'); }
      finally { if (!controller.signal.aborted) setCityBusy(false); }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [cityQuery]);
  useEffect(() => {
    document.body.style.overflow = onboarding || settings || locationOpen || detail || mapOpen || installHelp || expandedLine ? 'hidden' : '';
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { if (expandedLine) { setExpandedLine(null); return; } if (installHelp && !onboarding) { dismissInstallHelp(); return; } setSettings(false); setLocationOpen(false); setDetail(null); setMapOpen(false); } };
    document.addEventListener('keydown', escape);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', escape); };
  }, [onboarding, settings, locationOpen, detail, mapOpen, installHelp, expandedLine]);
  function go(next: Tab) { setTab(next); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function toggleFavorite(id: number) { updatePrefs({ favorites: prefs.favorites.includes(id) ? prefs.favorites.filter(n => n !== id) : [...prefs.favorites, id] }); }
  function openLine(line: Line, station = '') { setSelectedStation(station); setDetail(line); }
  function choosePlace(place: Place) { updatePrefs({ place: { name: place.name, latitude: place.latitude, longitude: place.longitude, admin1: place.admin1 } }); setLocationOpen(false); setCityQuery(''); }
  function geolocate() {
    if (!navigator.geolocation) { setToast('Localização não disponível. Escolha uma cidade.'); return; }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(position => { choosePlace({ name: 'Minha localização', latitude: position.coords.latitude, longitude: position.coords.longitude }); setGeoBusy(false); }, () => { setGeoBusy(false); setToast('Não foi possível obter a localização. Você pode escolher a cidade.'); }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  }
  async function saveMaps() {
    setSavingMap(true);
    try {
    await navigator.serviceWorker.ready;
    const shell = await caches.open('vai-shell-v2');
    const resources = performance.getEntriesByType('resource').map(entry => entry.name).filter(value => {
      const url = new URL(value);
      return url.origin === location.origin && /\.(js|css)$/.test(url.pathname);
    });
    await shell.addAll(['/', ...new Set(resources)]);
    const cache = await caches.open('vai-maps-v1'); await cache.addAll(['/rede-oficial.png', '/rede-oficial.pdf']); setMapsSaved(true); setToast('Mapa salvo neste aparelho para consultar sem internet.'); }
    catch { setToast('Não foi possível salvar o mapa. Tente novamente com conexão.'); }
    finally { setSavingMap(false); }
  }
  async function shareLine(line: Line) {
    const status = statusData?.lines.find(item => item.id === line.id);
    const text = `Linha ${line.id}–${line.name}: ${freshness(status) ? status!.status : 'Sem informação recente'}.${status ? ` Última informação: ${status.status}. Fonte: ${status.source}, ${dateLabel(status.confirmedAt)} às ${timeLabel(status.confirmedAt)}. ${status.description} ${status.sourceUrl}` : ''}`;
    try { if (navigator.share) await navigator.share({ title: `Linha ${line.id}–${line.name}`, text }); else { await navigator.clipboard.writeText(text); setToast('Situação copiada. Cole no WhatsApp ou onde preferir.'); } }
    catch (error) { if ((error as Error).name !== 'AbortError') setToast('Compartilhamento indisponível neste navegador.'); }
  }
  const favorites = lines.filter(line => prefs.favorites.includes(line.id));
  const affected = favorites.filter(line => tone(statusData?.lines.find(item => item.id === line.id)) === 'warning');
  const nowSP = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date()).replace(' ', 'T');
  const nextHours = weather?.hourly.time.map((time, index) => ({ time, index })).filter(item => item.time >= nowSP.slice(0, 13) + ':00').slice(0, 8) || [];
  const returnIndex = weather?.hourly.time.findIndex(time => time.slice(11, 13) === prefs.returnTime.slice(0, 2) && time >= nowSP.slice(0, 13) + ':00') ?? -1;
  const weatherStale = !!weather && (weatherError || !online || Date.now() - Date.parse(weather.fetchedAt) > 3600000);
  const scheduled = news.filter(item => item.scheduled && Date.now() - Date.parse(item.date) < 7 * 86400000);
  const filteredLines = lines.filter(line => (lineFilter !== 'Favoritas' || prefs.favorites.includes(line.id)) && (!query || normalize(`${line.id} ${line.name} ${stationsFor(line).join(' ')}`).includes(normalize(query))));
  const featuredNews = ['Transporte', 'Cidade', 'Clima'].flatMap(category => {
    const item = news.find(article => article.category === category);
    return item ? [item] : [];
  });
  const homeNews = [...featuredNews, ...news.filter(item => !featuredNews.includes(item))].slice(0, 3);
  const filteredNews = news.filter(item => newsFilter === 'Todas' || (newsFilter === 'Programadas' ? item.scheduled : item.category === newsFilter));
  function editSettings() { setNameInput(prefs.name); setSettings(true); }
  function dismissInstallHelp() { save('infosp-install-help-seen', true); setInstallHelp(false); }
  function showMap() { setZoom(1); setMapOpen(true); }

  function LineCard({ line }: { line: Line }) {
    const status = statusData?.lines.find(item => item.id === line.id);
    return <div className="line-card"><button className="line-main" onClick={() => openLine(line)}><span className="line-number" style={{ background: line.color }}>{line.id}</span><span className="line-text"><strong>{line.name}</strong><span className={`status ${tone(status)}`}><i />{freshness(status) ? status!.status : 'Sem informação recente'}</span></span><ChevronRight size={16} className="muted" /></button><button className={`favorite ${prefs.favorites.includes(line.id) ? 'selected' : ''}`} aria-label={`${prefs.favorites.includes(line.id) ? 'Remover' : 'Adicionar'} linha ${line.id} ${prefs.favorites.includes(line.id) ? 'dos' : 'aos'} favoritos`} aria-pressed={prefs.favorites.includes(line.id)} onClick={() => toggleFavorite(line.id)}><Star size={20} fill={prefs.favorites.includes(line.id) ? 'currentColor' : 'none'} /></button></div>;
  }
  function NewsCard({ item }: { item: News }) { return <a className="news-card" href={item.url} target="_blank" rel="noopener noreferrer"><div className={`news-symbol ${item.category.toLowerCase()}`}>{item.category === 'Clima' ? <CloudRain /> : item.category === 'Cidade' ? <MapPin /> : <TrainFront />}</div><div><span className="eyebrow">{item.category} · {dateLabel(item.date)}</span><h3>{item.title}</h3><span className="news-source">{item.source} <ArrowUpRight size={13} /></span></div></a>; }
  function WeatherCard({ expanded = false }: { expanded?: boolean }) { return <section className={`weather-card ${expanded ? 'expanded' : ''}`}><div className="weather-top"><button className="location-button" onClick={() => setLocationOpen(true)}><MapPin size={16} />{prefs.place.name}<ChevronRight size={15} /></button><span>{weatherStale ? 'Última consulta' : 'Agora'}</span></div>{weather ? <><div className="weather-main"><div><div className="temperature">{Math.round(weather.current.temperature_2m)}<span>°</span></div><p>{weatherLabel(weather.current.weather_code)}</p></div><div className="weather-art"><WeatherIcon code={weather.current.weather_code} night={!weather.current.is_day} size={98} /></div></div><div className="weather-meta"><span>Sensação de {Math.round(weather.current.apparent_temperature)}°</span><span><ArrowUpRight size={14} />{Math.round(weather.daily.temperature_2m_max[0])}° <ArrowDown size={14} />{Math.round(weather.daily.temperature_2m_min[0])}°</span></div><div className="hourly">{nextHours.slice(0, expanded ? 8 : 5).map(({time,index}) => <div key={time}><span>{time.slice(11,16)}</span><WeatherIcon code={weather.hourly.weather_code[index]} /><strong>{Math.round(weather.hourly.temperature_2m[index])}°</strong><small>{weather.hourly.precipitation_probability[index]}%</small></div>)}</div><div className="weather-foot">{weatherStale ? 'Dados salvos · ' : 'Consultado às '}{timeLabel(weather.fetchedAt)}<a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo ↗</a></div></> : <div className="weather-empty"><Cloud size={65} strokeWidth={1} /><h3>{weatherError ? 'Clima indisponível no momento' : 'Consultando o clima…'}</h3><p>Previsão para {prefs.place.name}</p><button className="subtle" onClick={loadWeather}>Atualizar previsão</button></div>}</section>; }
  function ReturnCard() { return <section className="return-card"><div className="section-title"><h2><Umbrella size={19} />Na hora de voltar</h2><input aria-label="Horário da volta" type="time" value={prefs.returnTime} onChange={e => updatePrefs({ returnTime: e.target.value })} /></div>{weather && returnIndex >= 0 ? <><strong>{weather.hourly.precipitation_probability[returnIndex]}% de chance de chuva</strong><p>{Math.round(weather.hourly.temperature_2m[returnIndex])}° · {weatherLabel(weather.hourly.weather_code[returnIndex])} · {weather.hourly.time[returnIndex].slice(0,10) === nowSP.slice(0,10) ? 'Hoje' : 'Amanhã'}{weatherStale ? ' · previsão salva' : ''}</p></> : <p>A previsão para seu horário aparece aqui quando o clima carregar.</p>}</section>; }

  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#" onClick={e => { e.preventDefault(); go('home'); }}><span className="brand-icon"><TrainFront size={24} /></span>info<span className="brand-sp">sp</span><span className="brand-dot">.</span></a><span className="sidebar-caption">Seu dia pela cidade.</span><nav aria-label="Navegação principal">{tabs.map(({id,label,icon:Icon}) => <button key={id} onClick={() => go(id)} className={tab === id ? 'active' : ''} aria-current={tab === id ? 'page' : undefined}><Icon size={21}/>{label}{tab === id && <span className="nav-dot"/>}</button>)}</nav><div className="sidebar-bottom"><span className="city-mini"><MapPin size={16}/>São Paulo e região</span><button onClick={editSettings}><Settings size={18}/>Preferências</button></div></aside>
    <div className="main-shell"><header className="topbar"><span className="mobile-brand">info<span>sp.</span></span><span className="desktop-date">{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',timeZone:'America/Sao_Paulo'})}</span><div className="top-actions"><span className={`connection ${online ? '' : 'offline'}`}><i/>{online ? 'Conectado' : 'Sem conexão'}</span><button className="avatar" aria-label="Abrir preferências" onClick={editSettings}>{prefs.name ? prefs.name.slice(0,1).toUpperCase() : <Settings size={20}/>}</button></div></header>
    <main>
      {!online && <div className="notice">Você está sem internet. Consulte os mapas salvos e confira os horários dos últimos dados.</div>}
      {tab === 'home' && <><div className="page-heading"><div><span className="eyebrow">SÃO PAULO, NO SEU RITMO</span><h1>Olá{prefs.name ? `, ${prefs.name}` : ''}<span className="greeting-dot">.</span></h1><p>Seu dia começa bem informado.</p></div><button className="icon-button" aria-label="Atualizar clima e linhas" onClick={() => {void loadWeather();void loadStatus();}}><RefreshCw size={20} className={busy ? 'spin' : ''}/></button></div>
      {affected.length > 0 && <button className="alert-banner" onClick={() => openLine(affected[0])}><TrainFront/><span><strong>Atenção no seu trajeto</strong><br/>{affected.map(l => `${l.id}–${l.name}`).join(', ')} com alteração na operação.</span><ChevronRight/></button>}
      <div className="home-grid"><div className="weather-column"><WeatherCard/><ReturnCard/></div><section className="favorites-section"><div className="section-title"><h2>Minhas linhas <Star size={17}/></h2><button className="text-button" onClick={() => go('lines')}>Ver todas <ArrowRight size={16}/></button></div>{favorites.length ? <div className="line-stack">{favorites.map(line => <LineCard key={line.id} line={line}/>)}</div> : <div className="empty-favorites"><div className="empty-star"><Star size={27}/></div><h3>Seu trajeto, mais perto.</h3><p>Marque as linhas que você usa e acompanhe a operação por aqui.</p><button className="primary" onClick={() => go('lines')}>Escolher minhas linhas <ArrowRight size={16}/></button></div>}<p className="caption">{statusError ? 'Atualização indisponível. Tente novamente.' : statusData ? `Consulta às ${timeLabel(statusData.checkedAt)} · atualização automática` : 'Consultando as operadoras…'}</p><button className="map-teaser" onClick={showMap}><div className="map-mini"><i/><i/><i/><i/></div><span><strong>A cidade se conecta.</strong><small>Explore o mapa completo da rede</small></span><ArrowUpRight size={23}/></button></section></div>
      <section className="news-section"><div className="section-title"><div><span className="eyebrow">NO SEU CAMINHO</span><h2>O que acontece na cidade</h2></div><button className="text-button" onClick={() => go('news')}>Ver notícias <ArrowRight size={16}/></button></div><div className="news-grid">{homeNews.map(item => <NewsCard key={item.url} item={item}/>)}{!news.length && <p className="empty-message">{newsLoaded ? 'Notícias indisponíveis no momento. Tente atualizar em instantes.' : 'Buscando atualizações de transporte e da cidade…'}</p>}</div></section>
      {scheduled.length > 0 && <section className="scheduled-section"><div className="section-title"><h2>Mudanças programadas</h2><button className="text-button" onClick={() => {setNewsFilter('Programadas');go('news');}}>Ver avisos <ArrowRight size={16}/></button></div><p className="caption">Avisos publicados nos últimos 7 dias. Confira datas e trechos na fonte.</p>{scheduled.slice(0,2).map(item => <NewsCard key={item.url} item={item}/>)}</section>}</>}
      {tab === 'weather' && <><div className="page-heading"><div><span className="eyebrow">ANTES DE SAIR</span><h1>Clima</h1><p>O tempo agora e nas próximas horas.</p></div><button className="icon-button" aria-label="Atualizar clima" onClick={loadWeather}><RefreshCw size={20}/></button></div><div className="climate-grid"><WeatherCard expanded/><div><ReturnCard/>{weather && <div className="weather-facts"><div><Wind/><span>Vento<strong>{Math.round(weather.current.wind_speed_10m)} km/h</strong></span></div><div><Umbrella/><span>Umidade<strong>{weather.current.relative_humidity_2m}%</strong></span></div></div>}<button className="wide-button" onClick={() => setLocationOpen(true)}><LocateFixed size={18}/>Alterar localização<ChevronRight size={18}/></button><p className="caption">Previsão baseada em modelos meteorológicos. Horários exibidos no fuso de São Paulo.</p></div></div></>}
      {tab === 'lines' && <><div className="page-heading"><div><span className="eyebrow">METRÔ E TRENS METROPOLITANOS</span><h1>Como estão as linhas?</h1><p>Acompanhe a operação e encontre sua estação.</p></div><button className="icon-button" aria-label="Atualizar situação das linhas" disabled={busy} onClick={loadStatus}><RefreshCw size={20} className={busy ? 'spin' : ''}/></button></div><div className="line-tools"><label className="search-box"><Search size={20}/><input aria-label="Buscar estação ou linha" placeholder="Busque uma estação ou linha" value={query} onChange={e => setQuery(e.target.value)}/>{query && <button aria-label="Limpar busca" onClick={() => setQuery('')}><X size={18}/></button>}</label><button className="secondary" onClick={showMap}><MapIcon size={18}/>Mapa da rede</button></div><div className="filter-row">{['Todas','Favoritas'].map(filter => <button key={filter} className={lineFilter === filter ? 'chip active' : 'chip'} onClick={() => setLineFilter(filter)}>{filter === 'Favoritas' && <Star size={14}/ >}{filter}</button>)}<span className="caption">{statusData ? `Consultado às ${timeLabel(statusData.checkedAt)}` : 'Consultando…'}</span></div>{statusError && <div className="notice">Não foi possível atualizar. Confira a fonte de cada linha.</div>}<div className="lines-grid">{filteredLines.map(line => <div key={line.id}><LineCard line={line}/>{query && stationsFor(line).filter(station => normalize(station).includes(normalize(query))).map(station => <button className="station-result" key={station} onClick={() => openLine(line,station)}><MapPin size={15}/>{station}<ChevronRight size={15}/></button>)}</div>)}</div>{!filteredLines.length && <p className="empty-message">{lineFilter === 'Favoritas' && !favorites.length ? 'Toque na estrela de uma linha para favoritar.' : 'Nenhuma linha ou estação encontrada. Tente outro nome.'}</p>}<p className="caption sources-note">Estados informados pelas operadoras. Informações com mais de 15 minutos são sinalizadas como antigas. Base dos mapas e estações · STM, julho de 2026.</p><button className="wide-button" onClick={saveMaps} disabled={savingMap}><Download size={18}/>{savingMap ? 'Salvando mapa…' : mapsSaved ? 'Atualizar mapa salvo para uso offline' : 'Salvar mapa da rede para usar offline'}{mapsSaved && <Check size={18}/>}</button></>}
      {tab === 'news' && <><div className="page-heading"><div><span className="eyebrow">INFORMAÇÃO QUE FAZ DIFERENÇA</span><h1>No seu caminho</h1><p>Transporte, clima e serviços para o dia a dia.</p></div><button className="icon-button" aria-label="Atualizar notícias" onClick={loadNews}><RefreshCw size={20}/></button></div><div className="filter-row scroll-row">{['Todas','Transporte','Cidade','Clima','Programadas'].map(filter => <button className={newsFilter === filter ? 'chip active' : 'chip'} key={filter} onClick={() => setNewsFilter(filter)}>{filter}</button>)}</div><p className="caption">{newsChecked ? `Fontes consultadas em ${dateLabel(newsChecked)} às ${timeLabel(newsChecked)}. ` : ''}Seleção automática de comunicados de utilidade pública.</p>{newsError && <div className="notice">Algumas fontes estão indisponíveis. Confira a data de publicação de cada notícia.</div>}<div className="news-list">{filteredNews.map(item => <NewsCard key={item.url} item={item}/>)}</div>{!filteredNews.length && <p className="empty-message">{newsLoaded ? 'Nenhuma publicação disponível neste filtro.' : 'Carregando notícias…'}</p>}<div className="editorial-note"><h3>Informação com origem</h3><p>Publicações das fontes oficiais, selecionadas por assunto e impacto na rotina. Cada título leva ao comunicado original. Os filtros automáticos podem precisar de ajustes.</p><a href="https://www.sptrans.com.br/noticias/" target="_blank" rel="noreferrer">Avisos da SPTrans <ArrowUpRight size={14}/></a><a href="https://www.cetsp.com.br/" target="_blank" rel="noreferrer">Trânsito e interdições · CET <ArrowUpRight size={14}/></a></div></>}
      <footer><span>info<span className="brand-sp">sp.</span></span><p>Informações para seguir em frente.</p><button onClick={editSettings}>Preferências e fontes</button></footer>
    </main></div>
    <nav className="bottom-nav" aria-label="Navegação no celular">{tabs.map(({id,label,icon:Icon}) => <button key={id} onClick={() => go(id)} className={tab === id ? 'active' : ''} aria-current={tab === id ? 'page' : undefined}><Icon size={22}/><span>{label}</span></button>)}</nav>
    {toast && <div className="toast" role="status">{toast}</div>}
    {onboarding && <div className="overlay"><section className="dialog welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-title"><span className="welcome-icon"><TrainFront size={34}/></span><span className="eyebrow">BEM-VINDO AO INFOSP</span><h2 id="welcome-title">A cidade muda.<br/>Vá bem informado.</h2><p>Clima, transporte e notícias úteis para acompanhar seu dia.</p><form onSubmit={e => {e.preventDefault();if(nameInput.trim()){updatePrefs({name:nameInput.trim().slice(0,40)});setOnboarding(false);}}}><label htmlFor="first-name">Como podemos te chamar?</label><input id="first-name" autoFocus autoComplete="given-name" placeholder="Seu primeiro nome" value={nameInput} maxLength={40} onChange={e => setNameInput(e.target.value)} required/><button className="primary" type="submit">Vamos começar <ArrowRight size={18}/></button></form><small>Seu nome e suas preferências ficam neste aparelho.</small></section></div>}
    {settings && <div className="overlay" onClick={() => setSettings(false)}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={e => e.stopPropagation()}><div className="section-title"><h2 id="settings-title">Do seu jeito</h2><button autoFocus className="icon-button" aria-label="Fechar preferências" onClick={() => setSettings(false)}><X/></button></div><form onSubmit={e => {e.preventDefault();if(nameInput.trim()){updatePrefs({name:nameInput.trim()});setSettings(false);}}}><label htmlFor="edit-name">Seu nome</label><input id="edit-name" maxLength={40} value={nameInput} onChange={e => setNameInput(e.target.value)} required/><label htmlFor="return-time">Horário habitual de volta</label><input id="return-time" type="time" value={prefs.returnTime} onChange={e => updatePrefs({returnTime:e.target.value})}/><button className="primary">Salvar preferências</button></form><button className="wide-button" onClick={() => {setSettings(false);setLocationOpen(true);}}><MapPin size={18}/>{prefs.place.name}<ChevronRight size={16}/></button><div className="editorial-note"><h3>Sobre seus dados</h3><p>Nome, favoritas e cidade ficam salvos neste navegador. A localização é solicitada ao tocar em “Usar minha localização” e usada para consultar o clima.</p><button className="text-button" onClick={() => {setSettings(false);setInstallHelp(true);}}><Download size={17}/>Como adicionar à tela inicial</button><h3>Instalar no celular</h3><p>No iPhone, use Compartilhar → Adicionar à Tela de Início. No Android, use a opção de instalação do navegador.</p><h3>Fontes</h3><p>Clima · Open-Meteo. Mapas · STM/Metrô, julho de 2026. Situação · operadoras indicadas em cada linha. Notícias · Metrô e Agência SP.</p></div></section></div>}
    {locationOpen && <div className="overlay" onClick={() => setLocationOpen(false)}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="location-title" onClick={e => e.stopPropagation()}><div className="section-title"><h2 id="location-title">Onde você está?</h2><button className="icon-button" aria-label="Fechar localização" onClick={() => setLocationOpen(false)}><X/></button></div><button className="primary" onClick={geolocate} disabled={geoBusy}><LocateFixed size={18}/>{geoBusy ? 'Localizando…' : 'Usar minha localização'}</button><p className="caption">Ou escolha uma cidade brasileira.</p><label className="search-box"><Search size={18}/><input autoFocus aria-label="Nome da cidade" placeholder="Nome da cidade" value={cityQuery} onChange={e => setCityQuery(e.target.value)}/></label>{cityBusy && <p>Buscando cidades…</p>}{cities.map((city,index) => <button key={`${city.latitude}-${index}`} className="city-result" onClick={() => choosePlace(city)}><MapPin size={17}/><span><strong>{city.name}</strong><small>{city.admin1}</small></span><ChevronRight size={16}/></button>)}{!cityBusy && cityQuery.length > 1 && !cities.length && <p className="caption">Nenhuma cidade encontrada.</p>}</section></div>}
    {detail && <div className="overlay" onClick={() => setDetail(null)}><section className="dialog line-dialog" role="dialog" aria-modal="true" aria-labelledby="line-title" onClick={e => e.stopPropagation()}><div className="section-title"><button autoFocus className="icon-button" aria-label="Voltar para linhas" onClick={() => setDetail(null)}><ChevronLeft/></button><span className="eyebrow">{detail.operator}</span><button className={`favorite ${prefs.favorites.includes(detail.id) ? 'selected' : ''}`} aria-label="Favoritar linha" aria-pressed={prefs.favorites.includes(detail.id)} onClick={() => toggleFavorite(detail.id)}><Star fill={prefs.favorites.includes(detail.id) ? 'currentColor' : 'none'}/></button></div><h2 id="line-title" className="detail-title"><span className="line-number" style={{background:detail.color}}>{detail.id}</span>Linha {detail.name}</h2>{(() => {const status=statusData?.lines.find(item=>item.id===detail.id);return <div className={`detail-status ${tone(status)}`}><strong>{freshness(status) ? status!.status : 'Sem informação recente'}</strong>{status ? <><p>{!freshness(status) && `Última situação informada: ${status.status}. `}{status.description}</p><small>Confirmado na fonte em {dateLabel(status.confirmedAt)} às {timeLabel(status.confirmedAt)}</small><a href={status.sourceUrl} target="_blank" rel="noreferrer">{status.source} <ArrowUpRight size={14}/></a></> : <p>A fonte não forneceu uma atualização verificável nesta consulta.</p>}</div>;})()}<button className="wide-button" onClick={() => shareLine(detail)}><Share2 size={17}/>Compartilhar situação</button>{detail.note && <p className="notice">{detail.note}</p>}<div className="section-title"><h3>Estações e conexões</h3><a href={lineMap(detail,selectedStation)} download={`linha-${detail.id}.svg`} aria-label="Baixar mapa desta linha"><Download size={19}/></a></div><p className="caption">Toque em uma estação para destacar no mapa.</p><div className="line-map-scroll"><img className="line-map-image" draggable={false} src={lineMap(detail,selectedStation)} alt={`Mapa completo da linha ${detail.id} ${detail.name}, com estações e conexões`}/></div><button className="text-button" onClick={() => {setZoom(1);setExpandedLine(detail);}}><ZoomIn size={17}/>Ampliar mapa da linha</button><div className="station-list">{stationsFor(detail).map(station => <button key={station} className={station === selectedStation ? 'active' : ''} onClick={() => setSelectedStation(station)}><span>{station}</span><span>{connections(station,detail.id).map(line => <span className="connection-badge" style={{background:line.color}} key={line.id}>{line.id}</span>)}</span></button>)}</div><a className="source-link" href={officialMap} target="_blank" rel="noreferrer">Base cartográfica · STM, julho de 2026 <ArrowUpRight size={14}/></a></section></div>}

    {installHelp && !onboarding && <div className="overlay" onClick={dismissInstallHelp}><section className="dialog welcome" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={e => e.stopPropagation()}><img className="install-icon" src="/infosp-192.png" alt=""/><h2 id="install-title">infosp na tela inicial</h2><p>Acesse o clima e suas linhas com um toque, como um aplicativo.</p>{installPlatform !== 'android' && <p className="install-step"><strong>iPhone · Safari</strong>Toque em Compartilhar e depois em “Adicionar à Tela de Início”. Confirme em “Adicionar”.</p>}{installPlatform !== 'ios' && <p className="install-step"><strong>Android · Chrome</strong>Abra o menu ⋮ e toque em “Adicionar à tela inicial” ou “Instalar aplicativo”.</p>}<button autoFocus className="primary" onClick={dismissInstallHelp}>Entendi <Check size={18}/></button><small>Você encontra esta dica novamente em Preferências.</small></section></div>}
    {expandedLine && <div className="overlay map-overlay"><section className="map-dialog" role="dialog" aria-modal="true" aria-labelledby="line-map-title"><div className="map-toolbar"><div><h2 id="line-map-title">Linha {expandedLine.id} · {expandedLine.name}</h2><span className="caption">Amplie e mova o mapa nesta visualização.</span></div><button autoFocus className="icon-button" aria-label="Voltar às estações" onClick={() => setExpandedLine(null)}><X/></button></div><div className="map-controls"><button className="icon-button" aria-label="Diminuir mapa da linha" disabled={zoom<=1} onClick={() => setZoom(Math.max(1,zoom-.5))}><ZoomOut size={19}/></button><span>{Math.round(zoom*100)}%</span><button className="icon-button" aria-label="Ampliar mapa da linha" disabled={zoom>=4} onClick={() => setZoom(Math.min(4,zoom+.5))}><ZoomIn size={19}/></button></div><div className="network-map-scroll"><img draggable={false} src={lineMap(expandedLine,selectedStation)} style={{width: String(zoom*100)+'%',maxWidth:'none'}} alt={`Mapa completo da linha ${expandedLine.id} ${expandedLine.name}`}/></div></section></div>}
    {mapOpen && <div className="overlay map-overlay"><section className="map-dialog" role="dialog" aria-modal="true" aria-labelledby="map-title"><div className="map-toolbar"><div><h2 id="map-title">Toda a rede, conectada.</h2><span className="caption">Mapa oficial STM · julho de 2026</span></div><button autoFocus className="icon-button" aria-label="Fechar mapa" onClick={() => setMapOpen(false)}><X/></button></div><div className="map-controls"><button className="icon-button" aria-label="Diminuir mapa" onClick={() => setZoom(Math.max(1,zoom-.5))} disabled={zoom<=1}><ZoomOut size={19}/></button><span>{Math.round(zoom*100)}%</span><button className="icon-button" aria-label="Ampliar mapa" onClick={() => setZoom(Math.min(4,zoom+.5))} disabled={zoom>=4}><ZoomIn size={19}/></button><button className="text-button" onClick={saveMaps} disabled={savingMap}><Download size={17}/>{savingMap ? 'Salvando…' : mapsSaved ? 'Salvo offline' : 'Salvar offline'}</button><a className="text-button" href="/rede-oficial.pdf" download>PDF <ArrowUpRight size={15}/></a></div><div className="network-map-scroll"><img src="/rede-oficial.png" style={{width:`${zoom*100}%`,maxWidth:'none'}} alt="Mapa integrado de metrô e trens de São Paulo com todas as estações e integrações, STM julho de 2026"/></div></section></div>}
  </div>;
}
