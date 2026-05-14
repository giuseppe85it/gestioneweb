import { getItemSync } from "../../utils/storageSync";
import { formatDateUI } from "../nextDateFormat";

const GOMME_EVENTI_KEY = "@gomme_eventi";

export type TipoEventoChiusuraCompatibile = "gomme_evento";

export type EventoCompatibile = {
  id: string;
  tipoEvento: TipoEventoChiusuraCompatibile;
  targa: string;
  data: number;
  dataLabel: string;
  km: number | null;
  asse: string | null;
  marca: string | null;
  tipo: string | null;
  descrizione: string;
  distanzaGiorni: number;
  suggerito: boolean;
};

type RawRecord = Record<string, unknown>;

const DAY_MS = 24 * 60 * 60 * 1000;
const SUGGESTED_DAYS = 30;

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapList(raw: unknown): RawRecord[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.value)) return raw.value.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.items)) return raw.items.filter(isRecord);
  return [];
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeTarga(value: unknown): string {
  return normalizeText(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDateMs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.abs(value) < 1_000_000_000_000 ? value * 1000 : value;
  }
  if (value && typeof value === "object" && "toMillis" in value) {
    const toMillis = (value as { toMillis?: unknown }).toMillis;
    if (typeof toMillis === "function") {
      const parsed = Number(toMillis.call(value));
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  if (value && typeof value === "object" && "seconds" in value) {
    const seconds = Number((value as { seconds?: unknown }).seconds);
    return Number.isFinite(seconds) ? seconds * 1000 : null;
  }
  const raw = normalizeText(value);
  if (!raw) return null;
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    return Math.abs(numeric) < 1_000_000_000_000 ? numeric * 1000 : numeric;
  }
  const italianDate = raw.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (italianDate) {
    const day = Number(italianDate[1]);
    const month = Number(italianDate[2]) - 1;
    let year = Number(italianDate[3]);
    if (year < 100) year += 2000;
    const parsed = new Date(year, month, day).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function getGommeEventoTimestamp(record: RawRecord): number | null {
  return (
    parseDateMs(record.data) ??
    parseDateMs(record.dataCambio) ??
    parseDateMs(record.timestamp) ??
    parseDateMs(record.ts) ??
    parseDateMs(record.dataOra) ??
    parseDateMs(record.createdAt)
  );
}

function getGommeEventoTarga(record: RawRecord): string {
  return (
    normalizeTarga(record.targetTarga) ||
    normalizeTarga(record.targa) ||
    normalizeTarga(record.targaCamion) ||
    normalizeTarga(record.targaMotrice) ||
    normalizeTarga(record.targaRimorchio)
  );
}

function buildDescrizioneEvento(record: RawRecord, dataLabel: string): string {
  const chunks = [
    "Cambio gomme",
    normalizeText(record.asseLabel || record.asseId),
    normalizeText(record.marca),
    normalizeText(record.tipo),
    normalizeNumber(record.km ?? record.kmMezzo) !== null
      ? `km ${normalizeNumber(record.km ?? record.kmMezzo)}`
      : "",
    dataLabel,
  ].filter(Boolean);
  return chunks.join(" - ");
}

function toEventoCompatibile(
  record: RawRecord,
  targa: string,
  dataRiferimento: number,
): EventoCompatibile | null {
  const id = normalizeText(record.id);
  const eventTarga = getGommeEventoTarga(record);
  const eventTs = getGommeEventoTimestamp(record);
  if (!id || !eventTarga || eventTarga !== targa || eventTs === null) return null;
  if (eventTs < dataRiferimento) return null;

  const distanzaGiorni = Math.floor((eventTs - dataRiferimento) / DAY_MS);
  const dataLabel = formatDateUI(eventTs);
  return {
    id,
    tipoEvento: "gomme_evento",
    targa: eventTarga,
    data: eventTs,
    dataLabel,
    km: normalizeNumber(record.km ?? record.kmMezzo),
    asse: normalizeText(record.asseLabel || record.asseId || record.posizione) || null,
    marca: normalizeText(record.marca) || null,
    tipo: normalizeText(record.tipo || record.tipoIntervento) || null,
    descrizione: buildDescrizioneEvento(record, dataLabel),
    distanzaGiorni,
    suggerito: distanzaGiorni >= 0 && distanzaGiorni <= SUGGESTED_DAYS,
  };
}

export async function getEventiCompatibiliPerChiusura(
  targa: string,
  dataRiferimento: number,
  tipoEvento: TipoEventoChiusuraCompatibile,
): Promise<EventoCompatibile[]> {
  // Quando esisteranno collection eventi dedicate per olio/freni/etc, estendere qui via registry pattern
  // (vedere nota progettuale REPORT_MACCHINA_CHIUSURA_CICLO_EVENTI sezione Aggancio/Sgancio).
  if (tipoEvento !== "gomme_evento") return [];

  const normalizedTarga = normalizeTarga(targa);
  if (!normalizedTarga || !Number.isFinite(dataRiferimento)) return [];

  const raw = await getItemSync(GOMME_EVENTI_KEY);
  return unwrapList(raw)
    .map((record) => toEventoCompatibile(record, normalizedTarga, dataRiferimento))
    .filter((entry): entry is EventoCompatibile => Boolean(entry))
    .sort((left, right) => left.data - right.data);
}
