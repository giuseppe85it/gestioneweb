/**
 * BUG 65 — "Aggancia universale" (Fase 0: modello dati).
 *
 * Legame NUOVO e SEPARATO rispetto agli schemi esistenti del ciclo
 * segnalazione/controllo <-> manutenzione (vedi `cicloLegame.ts`).
 *
 * Perche' un campo nuovo e non il riuso di `origineRefs`/`linkedLavoro*`:
 *  - `origineRefs` (LegameOrigineRef) e' un'unione CHIUSA a "segnalazione"/"controllo":
 *    il writer canonico scarta in silenzio qualsiasi altro tipo (perdita dato).
 *  - `linkedLavoro*` ha un ruolo direzionale (sorgente → manutenzione) e riusarlo
 *    per manutenzione↔manutenzione creerebbe ambiguita' di ruolo e falsi "orfani".
 *
 * Quindi i collegamenti universali vivono in un campo dedicato `collegamenti`,
 * ignorato da tutti i lettori esistenti finche' non lo si consuma esplicitamente.
 *
 * Il legame e' generico e bidirezionale: lo stesso campo `collegamenti` puo'
 * stare su una manutenzione, una segnalazione, un controllo (e per i documenti
 * la manutenzione tiene il riferimento al documento). La scrittura simmetrica
 * (su entrambi i record) e' compito del writer (Fase 3): qui solo modello + helper puri.
 */

export type LegameUniversaleTipo = "manutenzione" | "segnalazione" | "controllo" | "documento";

export type LegameUniversaleRef = {
  tipo: LegameUniversaleTipo;
  refId: string;
  /** Storage key della collezione del record collegato (routing in lettura). */
  refKey: string | null;
};

/** Nome del campo additivo sul record. */
export const COLLEGAMENTI_FIELD = "collegamenti" as const;

/** Storage key canonica per ciascun tipo di record collegabile. */
export const REF_KEY_BY_TIPO: Record<LegameUniversaleTipo, string> = {
  manutenzione: "@manutenzioni",
  segnalazione: "@segnalazioni_autisti_tmp",
  controllo: "@controlli_mezzo_autisti",
  documento: "@documenti_mezzi",
};

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function resolveTipo(value: unknown): LegameUniversaleTipo | null {
  const v = normalizeText(value).toLowerCase();
  if (v === "manutenzione" || v === "segnalazione" || v === "controllo" || v === "documento") {
    return v;
  }
  return null;
}

/** Storage key di default per un tipo (usata quando refKey non e' fornita). */
export function defaultRefKeyForTipo(tipo: LegameUniversaleTipo): string {
  return REF_KEY_BY_TIPO[tipo];
}

function readRefEntry(entry: unknown): LegameUniversaleRef | null {
  if (!isRecord(entry)) return null;
  const tipo = resolveTipo(entry.tipo);
  const refId = normalizeText(entry.refId ?? entry.id);
  if (!tipo || !refId) return null;
  const refKey = normalizeText(entry.refKey) || defaultRefKeyForTipo(tipo);
  return { tipo, refId, refKey };
}

/** Deduplica per (tipo + refId), mantenendo il primo refKey valido visto. */
function normalizeCollegamenti(refs: readonly LegameUniversaleRef[]): LegameUniversaleRef[] {
  const result: LegameUniversaleRef[] = [];
  const seen = new Set<string>();
  for (const ref of refs) {
    const tipo = resolveTipo(ref.tipo);
    const refId = normalizeText(ref.refId);
    if (!tipo || !refId) continue;
    const key = `${tipo}:${refId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const refKey = normalizeText(ref.refKey) || defaultRefKeyForTipo(tipo);
    result.push({ tipo, refId, refKey });
  }
  return result;
}

/** Legge la lista dei collegamenti universali da un record (tollerante). */
export function readCollegamenti(record: unknown): LegameUniversaleRef[] {
  if (!isRecord(record)) return [];
  const raw = record[COLLEGAMENTI_FIELD];
  if (!Array.isArray(raw)) return [];
  return normalizeCollegamenti(
    raw.map(readRefEntry).filter((entry): entry is LegameUniversaleRef => entry !== null),
  );
}

/** Patch del solo campo `collegamenti` con la lista normalizzata. */
export function writeCollegamenti(refs: readonly LegameUniversaleRef[]): RawRecord {
  return { [COLLEGAMENTI_FIELD]: normalizeCollegamenti(refs) };
}

/** Aggiunge un collegamento (idempotente per tipo+refId). */
export function addCollegamento(record: unknown, ref: LegameUniversaleRef): RawRecord {
  return writeCollegamenti([...readCollegamenti(record), ref]);
}

/** Rimuove un collegamento per tipo+refId. */
export function removeCollegamento(
  record: unknown,
  ref: Pick<LegameUniversaleRef, "tipo" | "refId">,
): RawRecord {
  const tipo = resolveTipo(ref.tipo);
  const refId = normalizeText(ref.refId);
  const next = readCollegamenti(record).filter(
    (entry) => !(tipo && entry.tipo === tipo && entry.refId === refId),
  );
  return writeCollegamenti(next);
}

/** Vero se il record ha gia' quel collegamento (tipo+refId). */
export function hasCollegamento(
  record: unknown,
  ref: Pick<LegameUniversaleRef, "tipo" | "refId">,
): boolean {
  const tipo = resolveTipo(ref.tipo);
  const refId = normalizeText(ref.refId);
  if (!tipo || !refId) return false;
  return readCollegamenti(record).some((entry) => entry.tipo === tipo && entry.refId === refId);
}
