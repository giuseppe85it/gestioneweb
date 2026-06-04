/**
 * PROMPT 44 — D3: accesso unificato ai legami del ciclo segnalazione/controllo
 * <-> manutenzione e alla traccia di chiusura.
 *
 * Realta' del codice (3 schemi distinti, NON un solo legame):
 *  - `origineTipo` + `origineRefId` + `origineRefKey`  -> back-link manutenzione → sorgente.
 *  - `linkedLavoroId` (string) / `linkedLavoroIds` (array) -> forward-link sorgente → manutenzione.
 *  - `chiusuraDi` + `chiusuraRefId` + `chiusuraData`  -> traccia di chiusura (non un legame).
 *
 * Decisione (PROMPT 44 — conservativa): si mantengono i nomi di campo esistenti.
 * L'unificazione e' di accesso, non di storage. Reader tolleranti + writer canonici.
 */

export type LegameOrigineTipo = "segnalazione" | "controllo" | "manuale" | "evento";

export type LegameOrigine = {
  tipo: LegameOrigineTipo;
  refId: string | null;
  refKey: string | null;
};

export type LegameOrigineRef = {
  tipo: "segnalazione" | "controllo";
  refId: string;
  refKey: string | null;
};

export type ChiusuraTrace = {
  chiusuraDi: string;
  chiusuraRefId: string | null;
  chiusuraData: number | null;
};

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function readText(record: RawRecord, keys: readonly string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function resolveOrigineTipo(value: string): LegameOrigineTipo | null {
  const v = value.toLowerCase();
  if (v === "segnalazione" || v === "controllo" || v === "manuale" || v === "evento") return v;
  return null;
}

function resolveOrigineRefTipo(value: string): LegameOrigineRef["tipo"] | null {
  const tipo = resolveOrigineTipo(value);
  if (tipo === "segnalazione" || tipo === "controllo") return tipo;
  return null;
}

function normalizeLegamiOrigine(legami: readonly LegameOrigineRef[]): LegameOrigineRef[] {
  const result: LegameOrigineRef[] = [];
  const seen = new Set<string>();
  for (const legame of legami) {
    const tipo = resolveOrigineRefTipo(legame.tipo);
    const refId = normalizeText(legame.refId);
    if (!tipo || !refId) continue;
    const refKey = normalizeText(legame.refKey) || null;
    const key = `${tipo}:${refKey ?? ""}:${refId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ tipo, refId, refKey });
  }
  return result;
}

function readLegameOrigineRefEntry(entry: unknown): LegameOrigineRef | null {
  if (!isRecord(entry)) return null;
  const tipo = resolveOrigineRefTipo(readText(entry, ["tipo", "origineTipo"]));
  const refId = readText(entry, ["refId", "origineRefId", "origineId"]);
  if (!tipo || !refId) return null;
  const refKey = readText(entry, ["refKey", "origineRefKey", "origineKey"]) || null;
  return { tipo, refId, refKey };
}

/**
 * Legge il back-link manutenzione → sorgente (`origineTipo/origineRefId/origineRefKey`).
 * Ritorna `null` se la manutenzione non ha origine valida (es. record manuale legacy).
 */
export function readLegameOrigine(record: unknown): LegameOrigine | null {
  if (!isRecord(record)) return null;
  const rawTipo = readText(record, ["origineTipo"]);
  const tipo = resolveOrigineTipo(rawTipo);
  if (!tipo) return null;
  const refId = readText(record, ["origineRefId", "origineId"]) || null;
  const refKey = readText(record, ["origineRefKey", "origineKey"]) || null;
  return { tipo, refId, refKey };
}

export function readLegamiOrigine(record: unknown): LegameOrigineRef[] {
  if (!isRecord(record)) return [];
  const refs = record.origineRefs;
  if (Array.isArray(refs)) {
    const parsed = normalizeLegamiOrigine(
      refs
        .map(readLegameOrigineRefEntry)
        .filter((entry): entry is LegameOrigineRef => entry !== null),
    );
    if (parsed.length > 0) return parsed;
  }
  const legacy = readLegameOrigine(record);
  if (
    legacy &&
    (legacy.tipo === "segnalazione" || legacy.tipo === "controllo") &&
    legacy.refId
  ) {
    return normalizeLegamiOrigine([
      {
        tipo: legacy.tipo,
        refId: legacy.refId,
        refKey: legacy.refKey,
      },
    ]);
  }
  return [];
}

/**
 * Legge il forward-link sorgente → manutenzione: id manutenzioni collegate.
 * Tollerante: `linkedLavoroId` (string) + `linkedLavoroIds` (array). Deduplicato.
 */
export function readLegameLavoro(record: unknown): string[] {
  if (!isRecord(record)) return [];
  const result = new Set<string>();
  const singleId = normalizeText(record.linkedLavoroId);
  if (singleId) result.add(singleId);
  const ids = record.linkedLavoroIds;
  if (Array.isArray(ids)) {
    for (const entry of ids) {
      const id = normalizeText(entry);
      if (id) result.add(id);
    }
  }
  return Array.from(result);
}

/**
 * Legge la traccia di chiusura (`chiusuraDi/chiusuraRefId/chiusuraData`).
 * Ritorna `null` se la traccia non e' presente.
 */
export function readChiusuraTrace(record: unknown): ChiusuraTrace | null {
  if (!isRecord(record)) return null;
  const di = readText(record, ["chiusuraDi"]);
  if (!di) return null;
  const refId = readText(record, ["chiusuraRefId"]) || null;
  const rawData = record.chiusuraData;
  let chiusuraData: number | null = null;
  if (typeof rawData === "number" && Number.isFinite(rawData)) chiusuraData = rawData;
  else if (typeof rawData === "string" && rawData.trim()) {
    const parsed = Date.parse(rawData);
    if (Number.isFinite(parsed)) chiusuraData = parsed;
  }
  return { chiusuraDi: di, chiusuraRefId: refId, chiusuraData };
}

/**
 * Scrive il back-link manutenzione → sorgente sui campi canonici.
 * Non scrive campi diversi da quelli del legame (no merge "creativo").
 */
export function writeLegameOrigine(legame: LegameOrigine): RawRecord {
  const base: RawRecord = {
    origineTipo: legame.tipo,
    origineRefId: legame.refId,
    origineRefKey: legame.refKey,
  };
  if (
    (legame.tipo === "segnalazione" || legame.tipo === "controllo") &&
    normalizeText(legame.refId)
  ) {
    return {
      ...base,
      origineRefs: normalizeLegamiOrigine([
        {
          tipo: legame.tipo,
          refId: normalizeText(legame.refId),
          refKey: normalizeText(legame.refKey) || null,
        },
      ]),
    };
  }
  return base;
}

export function writeLegamiOrigine(legami: readonly LegameOrigineRef[]): RawRecord {
  const dedup = normalizeLegamiOrigine(legami);
  const first = dedup[0] ?? null;
  return {
    origineRefs: dedup,
    origineTipo: first?.tipo ?? null,
    origineRefId: first?.refId ?? null,
    origineRefKey: first?.refKey ?? null,
  };
}

export function addLegameOrigine(record: unknown, legame: LegameOrigineRef): RawRecord {
  return writeLegamiOrigine([...readLegamiOrigine(record), legame]);
}

export function removeLegameOrigine(record: unknown, legame: Partial<LegameOrigineRef>): RawRecord {
  const tipo = legame.tipo ? resolveOrigineRefTipo(legame.tipo) : null;
  const refId = normalizeText(legame.refId);
  const refKey = normalizeText(legame.refKey);
  const next = readLegamiOrigine(record).filter((entry) => {
    if (tipo && entry.tipo !== tipo) return true;
    if (refId && entry.refId !== refId) return true;
    if (refKey && normalizeText(entry.refKey) !== refKey) return true;
    return false;
  });
  return writeLegamiOrigine(next);
}

/**
 * Scrive il forward-link sorgente → manutenzione (canonico).
 * Singolo id → `linkedLavoroId` + `linkedMultiple:false`.
 * Multiplo → `linkedLavoroIds: string[]` + `linkedMultiple:true`.
 */
export function writeLegameLavoro(ids: readonly string[]): RawRecord {
  const dedup = Array.from(new Set(ids.map((id) => normalizeText(id)).filter((id) => id.length > 0)));
  if (dedup.length === 0) {
    return { linkedLavoroId: null, linkedLavoroIds: null, linkedMultiple: false };
  }
  if (dedup.length === 1) {
    return { linkedLavoroId: dedup[0], linkedLavoroIds: null, linkedMultiple: false };
  }
  return { linkedLavoroId: null, linkedLavoroIds: dedup, linkedMultiple: true };
}

/**
 * PROMPT 47 T2 — Identifica un legame orfano: la sorgente ha `linkedLavoroId`/`linkedLavoroIds`
 * valorizzati ma uno o piu' target NON esistono in `manutenzioniSnapshot`.
 *
 * Tollerante:
 * - sorgente senza legami → `false` (non e' orfana, semplicemente non collegata)
 * - sorgente con tutti i target presenti → `false`
 * - sorgente con anche UN solo target assente → `true`
 *
 * Reader puro, non scrive. Usato sia per detection lato UI (badge "Link rotto")
 * sia per pre-verifica lato writer (`sganciaLegameOrfano`).
 */
export function isLegameOrfano(
  sorgente: unknown,
  manutenzioniSnapshot: ReadonlyArray<Record<string, unknown>>,
): boolean {
  const linked = readLegameLavoro(sorgente);
  if (linked.length === 0) return false;
  const set = new Set<string>();
  for (const m of manutenzioniSnapshot) {
    const id = normalizeText(m.id);
    if (id) set.add(id);
  }
  return linked.some((id) => !set.has(id));
}
