const categories = ['Transporte', 'Cidade', 'Clima'] as const;
type NewsCategory = typeof categories[number];
export type News = { title: string; url: string; date: string; source: string; category: NewsCategory; lineIds: number[]; scheduled: boolean };
export function cleanText(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([a-f\d]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;|&#039;/g, "'").replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}
const weatherTopic = /\b(?:previsao do tempo|boletim meteorologico|defesa civil|chuvas?|temporais?|alagamentos?|enchentes?|vendavais?|rajadas de vento|onda de calor|frente fria)\b/;
const cityTopic = /\b(?:poupatempo|vacin\w*|mutir(?:ao|oes)|ubs|upa|testagem|saude|atendimento (?:gratuito|ao publico)|cursos? gratuitos?|vagas de emprego|feirao de empregos|bom prato|servicos? publicos?|inscricoes? abertas|abastecimento de agua|falta de agua|falta de energia|coleta de lixo)\b/;
const transportTopic = /\b(?:metro|metrovi\w*|cptm|trens?|onibus|sptrans|rodizio|interdi\w*|linha \d+|bilhetes?|tarifas?|transito|ferrovi\w*|monotrilho|rodovias?|estac(?:ao|oes))\b/;
const promotion = /\b(?:governador\w*|prefeit[oa]s?|secretari[oa]s?|eleic\w*|partidar\w*|partido\w*|recorde de investimento|balanco de gestao|premiac\w*|premios?|homenage\w*)\b/;
const localArea = /\b(?:capital paulista|capital|grande sp|grande sao paulo|metropolitana|sao paulo|cptm|sptrans|metro|zona (?:norte|sul|leste|oeste)|abc paulista|osasco|guarulhos|santo andre|sao bernardo do campo|sao caetano do sul|maua|taboao da serra|barueri|carapicuiba|diadema|mogi das cruzes)\b/;
const statewide = /\b(?:todo o estado|estado de sao paulo|estado de sp|(?:em|de|do) sp|paulistas)\b/;
const elsewhere = /\b(?:interior|litoral|baixada santista|campinas|sorocaba|bauru|ribeirao preto|sao jose do rio preto|vale do paraiba)\b/;
const fold = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const agency = 'Agência SP';
const feedSources = [
  { url: 'https://www.metro.sp.gov.br/feed/', name: 'Metrô de São Paulo' },
  { url: 'https://www.agenciasp.sp.gov.br/feed/', name: agency },
  { url: 'https://www.agenciasp.sp.gov.br/tag/poupatempo/feed/', name: agency },
  { url: 'https://www.agenciasp.sp.gov.br/tag/vacinacao/feed/', name: agency },
  { url: 'https://www.agenciasp.sp.gov.br/tag/defesa-civil/feed/', name: agency },
];

function classify(text: string): NewsCategory | undefined {
  if (weatherTopic.test(text)) return 'Clima';
  if (cityTopic.test(text)) return 'Cidade';
  if (transportTopic.test(text)) return 'Transporte';
}

export function parseFeed(xml: string, source: string): News[] {
  const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)];
  const now = Date.now();
  return items.flatMap(([, item]) => {
    const tag = (name: string) => cleanText(item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] || '');
    const title = tag('title');
    const url = tag('link');
    const timestamp = Date.parse(tag('pubDate'));
    const headline = fold(title);
    if (!title || !/^https:\/\//.test(url) || !Number.isFinite(timestamp) ||
        timestamp < now - 30 * 86400000 || timestamp > now + 3600000 || promotion.test(headline)) return [];

    const summary = tag('description');
    const text = fold(`${title} ${summary}`);
    const category = classify(headline) ?? classify(fold(summary));
    if (!category) return [];
    const sectionNames = [...item.matchAll(/<category\b[^>]*>([\s\S]*?)<\/category>/gi)]
      .map(([, section]) => cleanText(section)).join(' ');
    if (source === agency && !localArea.test(`${text} ${fold(sectionNames)}`) &&
        !(statewide.test(text) && !elsewhere.test(text)) && !/\bpoupatempo\b/.test(headline)) return [];

    const lineIds = [...text.matchAll(/(?:linha[s]?\s+|\b)(1[0-7]|[1-9])\s*[-–—]\s*(?:azul|verde|vermelha|amarela|lilas|laranja|rubi|diamante|esmeralda|turquesa|coral|safira|jade|prata|ouro)\b/g)]
      .map((match) => Number(match[1]));
    const scheduled = /\b(?:manutenc\w*|interdic\w*|alterac\w*|obras|operacao especial|horarios?|fim de semana)\b/.test(headline);
    return [{ title, url, date: new Date(timestamp).toISOString(), source, category, lineIds: [...new Set(lineIds)], scheduled }];
  });
}
let cache: { time: number; value: { items: News[]; checkedAt: string; errors: string[] } } | undefined;
export async function getNews() {
  if (cache && Date.now() - cache.time < 600000) return cache.value;
  const groups = await Promise.all(feedSources.map(async source => {
    try {
      const response = await fetch(source.url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(String(response.status));
      const xml = await response.text();
      if (!xml.includes('<rss')) throw new Error('Feed inválido');
      return { items: parseFeed(xml, source.name), error: null };
    } catch { return { items: [], error: source.name }; }
  }));
  const errors = [...new Set(groups.flatMap(group => group.error ? [group.error] : []))];
  const newestFirst = (a: News, b: News) => b.date.localeCompare(a.date);
  const sorted = [...new Map(groups.flatMap(group => group.items).map(item => [item.url, item])).values()].sort(newestFirst);
  const diverse = categories.flatMap(category => sorted.filter(item => item.category === category).slice(0, 5));
  const selected = new Set(diverse);
  const items = [...diverse, ...sorted.filter(item => !selected.has(item))].slice(0, 30).sort(newestFirst);
  const value = { items, errors, checkedAt: new Date().toISOString() };
  if (items.length) cache = { time: Date.now(), value };
  return value;
}
