import { formatDateTimeUI, formatDateUI } from "../nextDateFormat";
import { parseDataRobusta } from "./parseRobusto";

type RawRecord = Record<string, unknown>;

export type StoriaRecordSegment = {
  data: number | null;
  label: string;
  title: string;
};

export type StoriaRecordData = {
  segnalazione: StoriaRecordSegment | null;
  presaInCarico: StoriaRecordSegment | null;
  esecuzione: StoriaRecordSegment | null;
  statoCorrente: "daFare" | "programmata" | "eseguita" | "chiusa_da_evento";
};

const EMPTY_VALUES = new Set(["", "-", "—", "n/d", "nd"]);

function readText(record: RawRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") {
      const normalized = value.trim();
      if (normalized && !EMPTY_VALUES.has(normalized.toLowerCase())) return normalized;
    }
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function readDate(record: RawRecord, keys: string[]): number | null {
  for (const key of keys) {
    const parsed = parseDataRobusta(record[key]);
    if (parsed !== null) return parsed;
  }
  return null;
}

function formatShortDate(timestamp: number | null): string {
  if (timestamp === null) return "data non disponibile";
  const formatted = formatDateUI(new Date(timestamp));
  return formatted === "-" ? "data non disponibile" : formatted;
}

function formatLongDate(timestamp: number | null): string {
  if (timestamp === null) return "data non disponibile";
  const formatted = formatDateTimeUI(timestamp);
  return formatted === "-" ? "data non disponibile" : formatted;
}

function normalizeStato(value: unknown): StoriaRecordData["statoCorrente"] {
  if (value === "programmata" || value === "eseguita" || value === "chiusa_da_evento") return value;
  return "daFare";
}

export function formatChiusuraEventoTipo(value: unknown): string {
  if (value === "gomme_evento") return "cambio gomme";
  if (value === "manutenzione_eseguita") return "manutenzione eseguita";
  return typeof value === "string" && value.trim() ? value.replace(/_/g, " ") : "evento";
}

export function isSatelliteChiusoDaEvento(record: RawRecord | null | undefined): boolean {
  return Boolean(
    record &&
      record.stato === "chiusa_da_evento" &&
      record.chiusuraDi === "gomme_evento" &&
      typeof record.chiusuraRefId === "string" &&
      record.chiusuraRefId.trim(),
  );
}

function collectEventIds(record: RawRecord | null | undefined): Set<string> {
  const ids = new Set<string>();
  if (!record) return ids;

  ["id", "sourceRecordId", "sourceMaintenanceId", "chiusuraRefId"].forEach((key) => {
    const value = readText(record, [key]);
    if (!value) return;
    ids.add(value);
    const afterColon = value.split(":").pop();
    if (afterColon) ids.add(afterColon);
  });

  return ids;
}

function isGommeRecord(record: RawRecord | null | undefined): boolean {
  if (!record) return false;
  if (readText(record, ["gommeInterventoTipo"])) return true;
  const text = [
    readText(record, ["descrizione"]),
    readText(record, ["sottotipo"]),
    readText(record, ["tipo"]),
    readText(record, ["evento"]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\b(gomma|gomme|pneumatico|pneumatici|ruota|ruote|gommista)\b/.test(text);
}

export function findSatelliteChiusoDaEventoForRecord<T extends RawRecord>(
  record: RawRecord | null | undefined,
  candidates: T[],
): T | null {
  const eventIds = collectEventIds(record);
  const byId =
    eventIds.size === 0
      ? null
      : candidates.find((candidate) => {
          if (!isSatelliteChiusoDaEvento(candidate)) return false;
          const refId = readText(candidate, ["chiusuraRefId"]);
          return Boolean(refId && eventIds.has(refId));
        }) ?? null;

  if (byId) return byId;
  if (!record || !isGommeRecord(record)) return null;

  const recordTarga = readText(record, ["targa", "mezzoTarga"]);
  const recordTs = readDate(record, ["data", "timestamp", "dataEsecuzione", "createdAt"]);
  if (!recordTarga || recordTs === null) return null;

  const candidatesByDate = candidates
    .filter((candidate) => {
      if (!isSatelliteChiusoDaEvento(candidate)) return false;
      if (readText(candidate, ["targa", "mezzoTarga"]) !== recordTarga) return false;
      return isGommeRecord(candidate);
    })
    .map((candidate) => {
      const originTs = readDate(candidate, [
        "dataInserimento",
        "createdAt",
        "timestamp",
        "data",
        "dataProgrammata",
      ]);
      if (originTs === null) return null;
      const distance = recordTs - originTs;
      return distance >= 0 && distance <= 30 * 24 * 60 * 60 * 1000
        ? { candidate, distance }
        : null;
    })
    .filter((entry): entry is { candidate: T; distance: number } => Boolean(entry))
    .sort((left, right) => left.distance - right.distance);

  return candidatesByDate[0]?.candidate ?? null;
}

export function getStoriaRecord(
  record: RawRecord,
  options: { eventoRecord?: RawRecord | null } = {},
): StoriaRecordData {
  const statoCorrente = normalizeStato(record.stato);
  const eventoRecord = options.eventoRecord ?? null;

  const autore = readText(record, [
    "segnalatoDa",
    "autistaNome",
    "nomeAutista",
    "autista",
    "badgeAutista",
    "badge",
  ]);
  const origineTipo = readText(record, ["origineTipo"]);
  const origineData = readDate(record, [
    "dataInserimento",
    "createdAt",
    "timestamp",
    "data",
    "dataProgrammata",
  ]);
  const presaData = readDate(record, [
    "dataPresaInCarico",
    "presaInCaricoData",
    "presaInCaricoAt",
    "dataInCarico",
    "updatedAt",
  ]);
  const presaDa = readText(record, ["presaInCaricoDa", "inCaricoA", "assegnatoA", "operatore"]);

  const eventoLabel = formatChiusuraEventoTipo(record.chiusuraDi);
  const eventoData =
    statoCorrente === "chiusa_da_evento"
      ? readDate(eventoRecord ?? {}, ["data", "timestamp", "dataCambio", "createdAt"]) ??
        readDate(record, ["chiusuraData", "dataEsecuzione", "data"])
      : readDate(record, ["dataEsecuzione", "data"]);

  const segnalazione =
    origineTipo === "segnalazione" || origineTipo === "controllo" || autore
      ? {
          data: origineData,
          label:
            origineTipo === "controllo"
              ? `Controllo KO${autore ? ` di ${autore}` : ""} del ${formatShortDate(origineData)}`
              : `Segnalata${autore ? ` da ${autore}` : ""} il ${formatShortDate(origineData)}`,
          title:
            origineTipo === "controllo"
              ? `Controllo KO${autore ? ` di ${autore}` : ""} del ${formatLongDate(origineData)}`
              : `Segnalata${autore ? ` da ${autore}` : ""} il ${formatLongDate(origineData)}`,
        }
      : null;

  const presaInCarico = presaData
    ? {
        data: presaData,
        label: `Presa in carico${presaDa ? ` da ${presaDa}` : ""} il ${formatShortDate(presaData)}`,
        title: `Presa in carico${presaDa ? ` da ${presaDa}` : ""} il ${formatLongDate(presaData)}`,
      }
    : null;

  let esecuzione: StoriaRecordSegment | null = null;
  if (statoCorrente === "chiusa_da_evento") {
    esecuzione = {
      data: eventoData,
      label: `Risolta dal ${eventoLabel} del ${formatShortDate(eventoData)}`,
      title: `Risolta dal ${eventoLabel} del ${formatLongDate(eventoData)}`,
    };
  } else if (statoCorrente === "eseguita") {
    esecuzione = {
      data: eventoData,
      label: `Eseguita il ${formatShortDate(eventoData)}`,
      title: `Eseguita il ${formatLongDate(eventoData)}`,
    };
  } else if (statoCorrente === "programmata") {
    esecuzione = {
      data: readDate(record, ["dataProgrammata", "data"]),
      label: "Programmata, ancora da eseguire",
      title: "Manutenzione programmata, ancora da eseguire",
    };
  } else {
    esecuzione = {
      data: null,
      label: "Ancora da eseguire",
      title: "Manutenzione ancora da eseguire",
    };
  }

  return {
    segnalazione,
    presaInCarico,
    esecuzione,
    statoCorrente,
  };
}

export function formatStoriaRecordInline(storia: StoriaRecordData): string | null {
  const segments = [storia.segnalazione, storia.presaInCarico, storia.esecuzione]
    .filter((segment): segment is StoriaRecordSegment => Boolean(segment))
    .map((segment) => segment.label);
  return segments.length > 0 ? segments.join(" - ") : null;
}
