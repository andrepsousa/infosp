export type LineStatus = {
  id: number;
  status: string;
  description: string;
  source: string;
  sourceUrl: string;
  confirmedAt: string;
  reportedAt?: string;
};

export type TransportStatus = {
  checkedAt: string;
  lines: LineStatus[];
  errors: string[];
};

const METRO_URL = "https://www.metro.sp.gov.br/wp-content/themes/metrosp/direto-metro.php?embed=1";
const CPTM_URL = "https://api.cptm.sp.gov.br/AppCPTM/v1/Linhas/ObterStatus";
const TRIVIA_URL = "https://www.triviatrens.com.br/helper/owner-line-statuses";
const TIC_URL = "https://www.tictrens.com.br/helper/owner-line-statuses";
const UNI_URL = "https://www.linhauni.com.br/api/status/linhauni";
const MOTIVA_URL = "https://trilhos.motiva.com.br/viamobilidade8e9/situacao-das-linhas/";

const SUPPORTED_LINES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 17]);
const CACHE_MS = 60_000;
let cached: { expiresAt: number; result: TransportStatus } | undefined;
let pending: Promise<TransportStatus> | undefined;

type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonObject
    : {};
}

function plain(value: unknown): string {
  if (typeof value !== "string") return "";
  const entities: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    aacute: "�", atilde: "�", acirc: "�", ccedil: "�", eacute: "�",
    ecirc: "�", iacute: "�", oacute: "�", otilde: "�", ocirc: "�", uacute: "�",
  };
  return value.replace(/<[^>]*>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (match, entity: string) => {
      if (entity.startsWith("#")) {
        const code = entity[1].toLowerCase() === "x"
          ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
        return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
      }
      return entities[entity] ?? match;
    }).replace(/\s+/g, " ").trim();
}

function sourceDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const brazilian = value.match(/(\d{2})\/(\d{2})\/(\d{4})\D+(\d{2}):(\d{2})(?::(\d{2}))?/);
  let iso = value;
  if (brazilian) {
    const [, day, month, year, hour, minute, second = "00"] = brazilian;
    iso = `${year}-${month}-${day}T${hour}:${minute}:${second}-03:00`;
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(iso) && !/(Z|[+-]\d{2}:\d{2})$/i.test(iso)) {
    iso += "-03:00";
  }
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

function line(
  id: number, status: unknown, description: unknown, source: string,
  sourceUrl: string, confirmedAt: string, reportedAt?: string,
): LineStatus | undefined {
  const text = plain(status);
  if (!SUPPORTED_LINES.has(id) || !text || text.length > 150) return undefined;
  return { id, status: text, description: plain(description).slice(0, 3000), source, sourceUrl, confirmedAt, reportedAt };
}

/** Extracts only the current line cards, never news or historical occurrences. */
export function parseMetro(html: string, confirmedAt: string): LineStatus[] {
  const result: LineStatus[] = [];
  for (const match of html.matchAll(/<li\b[^>]*class="linha list-group-item"[^>]*>([\s\S]*?)<\/li>/g)) {
    const card = match[1];
    const id = Number(card.match(/class="linha-numero"[^>]*>(\d+)</)?.[1]);
    const status = card.match(/class="linha-situacao"[^>]*>([^<]+)</)?.[1];
    const description = card.match(/class='description'>([\s\S]*?)<\/div>/)?.[1];
    const reportedAt = sourceDate(card.match(/atualizado em ([\d/: ]+)/)?.[1]);
    // A timestamp is part of this feed's contract. Missing it indicates a changed markup.
    if (!reportedAt) continue;
    const parsed = line(id, status, description, "Metr� � Direto do Metr�", "https://www.metro.sp.gov.br/sua-viagem/direto-metro/", reportedAt, reportedAt);
    if (parsed) result.push(parsed);
  }
  return result;
}

export function parseCptm(data: unknown, confirmedAt: string): LineStatus[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((value) => {
    const row = object(value);
    const id = Number(row.linhaId);
    const reportedAt = sourceDate(row.dataGeracao);
    if (![10, 11, 12].includes(id) || !reportedAt) return [];
    const parsed = line(id, row.status, row.descricao, "CPTM", "https://www.cptm.sp.gov.br/", reportedAt, reportedAt);
    return parsed ? [parsed] : [];
  });
}

export function parseOwnerFeed(data: unknown, confirmedAt: string, owner: "trivia" | "uni"): LineStatus[] {
  const response = object(data);
  const group = object(response.data);
  const reportedAt = sourceDate(group.dateUpdate);
  if (response.status !== true || !Array.isArray(group.listItem) || !reportedAt) return [];
  const source = owner === "trivia" ? "Trivia Trens" : "LinhaUni";
  const sourceUrl = owner === "trivia" ? "https://www.triviatrens.com.br/" : "https://www.linhauni.com.br/";
  const allowed = owner === "trivia" ? [11, 12, 13] : [6];
  return group.listItem.flatMap((value) => {
    const row = object(value);
    const id = Number(row.code);
    if (!allowed.includes(id)) return [];
    const parsed = line(id, row.status, row.description, source, sourceUrl, reportedAt, reportedAt);
    return parsed ? [parsed] : [];
  });
}

export function parseTic(data: unknown, confirmedAt: string): LineStatus[] {
  const response = object(data);
  if (response.status !== true || !Array.isArray(response.data)) return [];
  const row = object(response.data.find((value) => object(value).type === "line"));
  const status = object(row.status);
  // The operator's current-status endpoint has no publication timestamp.
  // confirmedAt records when its response was actually retrieved.
  const parsed = line(7, status.name, row.description, "TIC Trens", "https://www.tictrens.com.br/", confirmedAt);
  return parsed ? [parsed] : [];
}

export function parseMotiva(html: string, confirmedAt: string): LineStatus[] {
  const result: LineStatus[] = [];
  const panels = [...html.matchAll(/<div\b[^>]*role="tabpanel"[^>]*>/g)];
  for (let index = 0; index < panels.length; index++) {
    const opening = panels[index];
    // The panel's data layer has the line identity, independent from its generated ID.
    const decoded = opening[0].replace(/&#34;/g, '"');
    const id = Number(decoded.match(/"dc:title":"([89])\s*-\s*(?:Diamante|Esmeralda)"/)?.[1]);
    if (id !== 8 && id !== 9) continue;
    const panel = html.slice(opening.index, panels[index + 1]?.index ?? html.length);
    const entries = [...panel.matchAll(/class="post-time">([^<]+)<\/p>\s*<h2 class="post-title">([^<]+)<\/h2>\s*<div class="post-description">([\s\S]*?)<\/div>/g)]
      .map((entry) => ({ status: entry[2], description: entry[3], reportedAt: sourceDate(entry[1]) }))
      .filter((entry) => entry.reportedAt)
      .sort((a, b) => b.reportedAt!.localeCompare(a.reportedAt!));
    const latest = entries[0];
    if (!latest) continue;
    const parsed = line(id, latest.status, latest.description, "ViaMobilidade", MOTIVA_URL, confirmedAt, latest.reportedAt);
    if (parsed) result.push(parsed);
  }
  return result;
}

async function upstream(url: string): Promise<{ text: string; confirmedAt: string }> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(7000),
    headers: { Accept: "application/json,text/html;q=0.9", "Cache-Control": "no-cache" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  if (text.length > 3_000_000) throw new Error("Resposta excedeu o limite esperado");
  return { text, confirmedAt: new Date().toISOString() };
}

async function refresh(): Promise<TransportStatus> {
  const sources = [
    { name: "Metr�", url: METRO_URL, parse: parseMetro },
    { name: "CPTM", url: CPTM_URL, parse: (text: string, at: string) => parseCptm(JSON.parse(text), at) },
    { name: "Trivia Trens", url: TRIVIA_URL, parse: (text: string, at: string) => parseOwnerFeed(JSON.parse(text), at, "trivia") },
    { name: "TIC Trens", url: TIC_URL, parse: (text: string, at: string) => parseTic(JSON.parse(text), at) },
    { name: "LinhaUni", url: UNI_URL, parse: (text: string, at: string) => parseOwnerFeed(JSON.parse(text), at, "uni") },
    { name: "ViaMobilidade", url: MOTIVA_URL, parse: parseMotiva },
  ];
  const outcomes = await Promise.allSettled(sources.map(async (source) => {
    const response = await upstream(source.url);
    const lines = source.parse(response.text, response.confirmedAt);
    if (!lines.length) throw new Error("Formato de resposta n�o reconhecido");
    return lines;
  }));
  const lines = new Map<number, LineStatus>();
  const errors: string[] = [];
  outcomes.forEach((outcome, index) => {
    if (outcome.status === "rejected") {
      errors.push(`N�o foi poss�vel confirmar a situa��o na fonte ${sources[index].name}.`);
      return;
    }
    for (const item of outcome.value) lines.set(item.id, item);
  });
  return { checkedAt: new Date().toISOString(), lines: [...lines.values()].sort((a, b) => a.id - b.id), errors };
}

export async function getTransportStatus(): Promise<TransportStatus> {
  if (cached && cached.expiresAt > Date.now()) return cached.result;
  if (pending) return pending;
  pending = refresh().then((result) => {
    cached = { expiresAt: Date.now() + CACHE_MS, result };
    return result;
  }).finally(() => { pending = undefined; });
  return pending;
}
