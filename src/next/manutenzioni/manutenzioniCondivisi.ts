// Aiutanti e tipi CONDIVISI del modulo Manutenzioni (madre + satelliti).
// Codice spostato 1:1 da NextManutenzioniPage.tsx (regola "moduli a satelliti"):
// nessun cambio di comportamento, solo ricollocazione.
import type { CSSProperties } from "react";
import type {
  NextManutenzioneOrigineTipo,
  NextManutenzioneStato,
  NextManutenzioneUrgenza,
  NextManutenzioniLegacyDatasetRecord,
} from "../domain/nextManutenzioniDomain";
import type {
  NextAutistiControlloSectionItem,
  NextAutistiSegnalazioneSectionItem,
} from "../domain/nextAutistiDomain";
import { formatDateTimeUI } from "../nextDateFormat";
import { parseAnyDate, toDisplay } from "../helpers/dateUnica";

export type TipoVoce = "mezzo" | "compressore" | "attrezzature";

export type DaFareUrgenzaFilter = "tutte" | NextManutenzioneUrgenza;
export type DaFareOrigineFilter = "tutte" | NextManutenzioneOrigineTipo;

export type SegnalazioniDaFareGroup = {
  key: string;
  gruppoId: string | null;
  targa: string;
  segnalazioni: NextAutistiSegnalazioneSectionItem[];
};

export type ManutenzioniDaFareGroup = {
  key: string;
  gruppoId: string;
  targa: string;
  manutenzioni: NextManutenzioniLegacyDatasetRecord[];
};

export type ManutenzioniOperativeGrouped = {
  gruppi: ManutenzioniDaFareGroup[];
  libere: NextManutenzioniLegacyDatasetRecord[];
  altre: NextManutenzioniLegacyDatasetRecord[];
};

export type SegnalazioniDaFareTargaGroup = {
  targa: string;
  gruppi: SegnalazioniDaFareGroup[];
  libere: NextAutistiSegnalazioneSectionItem[];
};

export type ControlliKoDaFareTargaGroup = {
  targa: string;
  controlli: NextAutistiControlloSectionItem[];
};

export type LavoroGruppoRetryState = {
  manutenzioneId: string;
  failedIds: string[];
};

// ⚠️ Questa normalizeText fa MAIUSCOLO e toglie gli spazi (per confronti targa).
// NON è la normalizeText dei file domain (che fa lowercase): non unificarle.
export function normalizeText(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

/** Targa mostrata per un controllo KO: motrice se valida, altrimenti rimorchio. */
export function controlloKoDisplayTarga(item: NextAutistiControlloSectionItem): string {
  const motrice = normalizeText(item.targaMotrice ?? "");
  if (motrice && motrice !== "-") return motrice;
  const rimorchio = normalizeText(item.targaRimorchio ?? "");
  if (rimorchio && rimorchio !== "-") return rimorchio;
  return "";
}

export function normalizeFreeText(value: string) {
  return value.trim();
}

export function buildDescrizioneSnippet(value: string, limit = 140) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 3)}...`;
}

export const URGENZA_BADGE_STYLE: Record<NextManutenzioneUrgenza, CSSProperties> = {
  alta: {
    background: "#fee2e2",
    color: "#991b1b",
    borderColor: "#fecaca",
  },
  media: {
    background: "#fef3c7",
    color: "#92400e",
    borderColor: "#fde68a",
  },
  bassa: {
    background: "#f3f4f6",
    color: "#374151",
    borderColor: "#e5e7eb",
  },
};

// Badge "Collegata (N)": indigo tenue, in linea con la tavolozza pastello degli
// altri badge della card; tenuto come costante come gli altri stili badge.
export const COLLEGATA_BADGE_STYLE: CSSProperties = {
  background: "#e0e7ff",
  color: "#3730a3",
};

export function resolveMaintenanceStato(item: NextManutenzioniLegacyDatasetRecord): NextManutenzioneStato {
  if (
    item.stato === "programmata" ||
    item.stato === "eseguita" ||
    item.stato === "chiusa_da_evento"
  ) {
    return item.stato;
  }
  return "daFare";
}

export function formatMaintenanceStatoLabel(stato: NextManutenzioneStato): string {
  if (stato === "programmata") return "PROGRAMMATA";
  if (stato === "eseguita") return "ESEGUITA";
  if (stato === "chiusa_da_evento") return "CHIUSA DA EVENTO";
  return "DA FARE";
}

export function formatChiusuraEventoTipo(value: string | null | undefined): string {
  if (value === "gomme_evento") return "cambio gomme";
  if (value === "manutenzione_eseguita") return "manutenzione eseguita";
  return value ? value.replace(/_/g, " ") : "evento";
}

export function buildChiusuraDaEventoTitle(item: NextManutenzioniLegacyDatasetRecord): string | undefined {
  if (resolveMaintenanceStato(item) !== "chiusa_da_evento") return undefined;
  const evento = formatChiusuraEventoTipo(item.chiusuraDi);
  const data = item.chiusuraData ? formatDateTimeUI(item.chiusuraData) : "-";
  return data && data !== "-"
    ? `Chiusa dal ${evento} del ${data}`
    : `Chiusa dal ${evento}`;
}

export function getMaintenanceStatoBadgeStyle(stato: NextManutenzioneStato): CSSProperties | undefined {
  if (stato !== "chiusa_da_evento") return undefined;
  return { background: "#f3f4f6", color: "#374151", borderColor: "#d1d5db" };
}

export function resolveMaintenanceUrgenza(item: NextManutenzioniLegacyDatasetRecord): NextManutenzioneUrgenza {
  return item.urgenza ?? "bassa";
}

export function resolveMaintenanceOrigine(item: NextManutenzioniLegacyDatasetRecord): NextManutenzioneOrigineTipo {
  return item.origineTipo ?? "manuale";
}

export function formatMaintenanceOrigineLabel(value: NextManutenzioneOrigineTipo): string {
  if (value === "controllo") return "Controllo KO";
  if (value === "segnalazione") return "Segnalazione";
  return "Manuale";
}

export function formatDaFareDateLabel(item: NextManutenzioniLegacyDatasetRecord): string {
  const value = item.dataProgrammata || item.data || item.dataEsecuzione || null;
  return toDisplay(value) || value || "-";
}

export function formatSegnalazioneDateLabel(item: NextAutistiSegnalazioneSectionItem): string {
  if (!item.timestamp) return "-";
  return formatDateTimeUI(item.timestamp);
}

export function resolveSegnalazioneAutoreReale(
  item: NextAutistiSegnalazioneSectionItem,
): string | null {
  return normalizeFreeText(item.autistaNome ?? "") || normalizeFreeText(item.badgeAutista ?? "") || null;
}

export function formatSegnalazioneAutore(item: NextAutistiSegnalazioneSectionItem): string {
  return resolveSegnalazioneAutoreReale(item) || "Autista";
}

export function getLegacyDateTimestamp(value: string | null | undefined) {
  return parseAnyDate(value)?.getTime() ?? 0;
}

export function formatDateShort(value: string | null | undefined) {
  return toDisplay(value) || value || "Nessuna";
}

export function formatDateFull(value: string | null | undefined) {
  return toDisplay(value) || value || "DA VERIFICARE";
}

export function formatNumberIt(value: number | null | undefined) {
  if (value == null) return "DA VERIFICARE";
  return new Intl.NumberFormat("it-IT").format(value);
}

export function readOrigineText(data: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
  }
  return null;
}

export function readOrigineDateText(data: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = data[key];
    if (value == null || value === "") continue;
    const formatted = formatDateTimeUI(value as Parameters<typeof formatDateTimeUI>[0]);
    if (formatted !== "-") return formatted;
  }
  return null;
}

export function readOrigineFotoUrls(data: Record<string, unknown>): string[] {
  const urls = new Set<string>();
  const push = (value: unknown) => {
    if (typeof value === "string" && /^(blob:|data:|https?:)/i.test(value.trim())) {
      urls.add(value.trim());
    }
  };
  push(data.fotoUrl);
  push(data.fotoDataUrl);
  [data.fotoUrls, data.images, data.foto].forEach((value) => {
    if (!Array.isArray(value)) return;
    value.forEach((entry) => {
      if (typeof entry === "string") {
        push(entry);
        return;
      }
      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        push(record.url);
        push(record.dataUrl);
      }
    });
  });
  return [...urls];
}

export function formatGruppoManutenzioneLabel(gruppo: ManutenzioniDaFareGroup): string {
  const snippets = gruppo.manutenzioni
    .slice(0, 2)
    .map((item) => buildDescrizioneSnippet(item.descrizione, 34))
    .filter(Boolean);
  const content = snippets.length > 0 ? snippets.join(" / ") : "senza descrizione";
  return `${gruppo.targa} - ${content} (${gruppo.manutenzioni.length})`;
}
