export type News = { title: string; url: string; date: string; source: string; category: string; lineIds: number[]; scheduled: boolean };
export function cleanText(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([a-f\d]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;|&#039;/g, "'").replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}
const publicInterest = /metr�|metrovi|cptm|trem|trens|esta�|�nibus|sptrans|rod�zio|interdi�|alagamento|temporal|chuva|defesa civil|poupatempo|vacina|linha \d|bilhete|tarifa|tr�nsito/i;
const promotion = /governador|prefeito|secret�rio|elei�|partid|recorde de investimento|balan�o|premia|pr�mio|homenagem|conquista/i;
const feedSources = [
  { url: 'https://www.metro.sp.gov.br/feed/', name: 'Metr� de S�o Paulo' },
  { url: 'https://www.agenciasp.sp.gov.br/feed/', name: 'Ag�ncia SP' },
];
export function parseFeed(xml: string, source: string): News[] {
  const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)];
  return items.flatMap(([, item]) => {
    const tag = (name: string) => cleanText(item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] || '');
    const title = tag('title');
    const url = tag('link');
    const timestamp = Date.parse(tag('pubDate'));
    if (timestamp < Date.now() - 30 * 86400000) return [];
    if (source === 'Ag�ncia SP' && !/capital|metropolitan|metr�|cptm|s�o paulo|defesa civil|estado de sp/i.test(title)) return [];
    if (!publicInterest.test(title) || promotion.test(title) || !/^https:\/\//.test(url) || !Number.isFinite(timestamp) || timestamp > Date.now() + 3600000) return [];
    const text = title + ' ' + tag('description');
    const lineIds = [...text.matchAll(/(?:linha[s]?\s+|\b)(1[0-7]|[1-9])\s*[--]\s*(?:Azul|Verde|Vermelha|Amarela|Lil�s|Laranja|Rubi|Diamante|Esmeralda|Turquesa|Coral|Safira|Jade|Prata|Ouro)/gi)].map(m => Number(m[1]));
    const category = /chuva|temporal|alagamento|defesa civil/i.test(title) ? 'Clima' : /metr�|cptm|trem|trens|esta�|�nibus|linha|bilhete|tarifa|rod�zio|tr�nsito|interdi�/i.test(title) ? 'Transporte' : 'Cidade';
    return [{title, url, date: new Date(timestamp).toISOString(), source, category, lineIds: [...new Set(lineIds)], scheduled: /manuten�|interdi�|altera�|obras|opera�[�a]o especial|hor�rio|fim de semana/i.test(title)}];
  });
}
let cache: { time: number; value: { items: News[]; checkedAt: string; errors: string[] } } | undefined;
export async function getNews() {
  if (cache && Date.now() - cache.time < 600000) return cache.value;
  const errors: string[] = [];
  const groups = await Promise.all(feedSources.map(async source => {
    try {
      const response = await fetch(source.url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(String(response.status));
      const xml = await response.text();
      if (!xml.includes('<rss')) throw new Error('Feed inv�lido');
      return parseFeed(xml, source.name);
    } catch { errors.push(source.name); return []; }
  }));
  const items = [...new Map(groups.flat().map(item => [item.url, item])).values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  const value = { items, errors, checkedAt: new Date().toISOString() };
  if (items.length) cache = { time: Date.now(), value };
  return value;
}
