import { Fragment, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRef } from "react";
import type { FormEvent, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NextMappaStoricoPage from "./NextMappaStoricoPage";
import {
  readNextInventarioSnapshot,
  type NextInventarioReadOnlyItem,
} from "./domain/nextInventarioDomain";
import {
  deleteNextManutenzioneBusinessRecord,
  getNextManutenzioneOrigineRecord,
  readNextManutenzioniDaFareAndProgrammataGlobalSnapshot,
  readNextManutenzioniWorkspaceSnapshot,
  saveNextManutenzioneBusinessRecord,
  type NextManutenzioneGommeInterventoTipo,
  type NextManutenzioneGommePerAsseRecord,
  type NextManutenzioneGommeStraordinarioRecord,
  type NextManutenzioneOrigineTipo,
  type NextManutenzioneOrigineRecord,
  type NextManutenzioneStato,
  type NextManutenzioneUrgenza,
  type NextManutenzioniLegacyDatasetRecord,
  type NextManutenzioniLegacyMaterialRecord,
  type NextManutenzioniMezzoOption,
} from "./domain/nextManutenzioniDomain";
import {
  buildNextGommeStraordinarieEvents,
  buildNextGommeStateByAsse,
  getNextAssiOptionsForCategoria,
  isNextCategoriaMotorizzata,
  normalizeNextAssiCoinvolti,
  type NextManutenzioneAsseCoinvoltoId,
} from "./domain/nextManutenzioniGommeDomain";
import { readNextRifornimentiReadOnlySnapshot } from "./domain/nextRifornimentiDomain";
import {
  readNextAnagraficheFlottaSnapshot,
  type NextMezzoListItem,
} from "./nextAnagraficheFlottaDomain";
import { formatDateTimeUI } from "./nextDateFormat";
import {
  fromUserInput,
  parseAnyDate,
  toDisplay,
  toISO,
} from "./helpers/dateUnica";
import { buildNextDossierPath } from "./nextStructuralPaths";
import { NextAggancioEventoModal } from "./components/NextAggancioEventoModal";
import {
  NextAgganciaLegameModal,
  type AgganciaLegameSorgente,
} from "./components/NextAgganciaLegameModal";
import type { EventoCompatibile } from "./helpers/eventiCompatibili";
import {
  getManutenzioniPerAggancio,
  type ManutenzioneCandidataAggancio,
} from "./helpers/manutenzioniPerAggancio";
import { getDataRiferimentoRecord } from "./helpers/parseRobusto";
import { isSatelliteChiusoDaEvento } from "./helpers/storiaRecord";
import { readLegamiOrigine } from "./helpers/cicloLegame";
import { isNextSegnalazioneOperativa } from "./helpers/segnalazioniOperative";
import { readNextUnifiedStorageDocument } from "./domain/nextUnifiedReadRegistryDomain";
import { buildFraseStoria, recordChiusoFromRaw } from "./helpers/frasestoriaRecord";
import { FraseStoriaRecord } from "./components/FraseStoriaRecord";
import { OfficinaAutocomplete } from "./components/OfficinaAutocomplete";
import {
  readNextOfficineSnapshot,
  type NextOfficinaReadOnlyItem,
} from "./domain/nextOfficineDomain";
import {
  readNextColleghiSnapshot,
  type NextCollegaReadOnlyItem,
} from "./domain/nextColleghiDomain";
import {
  readNextAutistiReadOnlySnapshot,
  type NextAutistiSegnalazioneSectionItem,
} from "./domain/nextAutistiDomain";
import {
  chiudiManutenzioneDaEvento,
  riapriESganciaSegnalazione,
  sganciaManutenzioneDaEvento,
} from "./writers/nextChiusuraEventoWriter";
import {
  aggiungiAGruppo,
  creaGruppoSegnalazioni,
  rimuoviDaGruppo,
} from "./writers/gruppoSegnalazioniWriter";
import {
  aggiungiAGruppoManutenzioni,
  creaGruppoManutenzioni,
  rimuoviDaGruppoManutenzioni,
} from "./writers/gruppoManutenzioniWriter";
import { agganciaSegnalazioniAManutenzioneEsistenteBatch } from "./writers/agganciaSegnalazioneAManutenzioneEsistenteWriter";
import { createManutenzioneDaFareFromSegnalazione } from "./writers/nextManutenzioneDaFareCreateWriter";
import { deleteSegnalazioneAutista } from "./writers/nextSegnalazioneDeleteWriter";
import PdfPreviewModal from "../components/PdfPreviewModal";
import { openPreview, revokePdfPreviewUrl } from "../utils/pdfPreview";
import {
  readNextManutenzioniScadenzeSnapshot,
  type NextManutenzioneScadenzaItem,
} from "./domain/nextManutenzioniScadenzeDomain";
import { saveScadenzaManutenzione } from "./nextManutenzioniScadenzeWriter";
import "./next-mappa-storico.css";
import "../pages/Manutenzioni.css";

type TipoVoce = "mezzo" | "compressore" | "attrezzature";
type PdfSubjectSelection = TipoVoce | "tutti";
type SottoTipo = "motrice" | "trattore";
type ViewTab = "dafare" | "dashboard" | "form" | "pdf" | "mappa";
type PdfPeriodFilter = "ultimo-mese" | "tutto" | `mese:${string}`;
type DaFareUrgenzaFilter = "tutte" | NextManutenzioneUrgenza;
type DaFareOrigineFilter = "tutte" | NextManutenzioneOrigineTipo;
type InterventoUiSubtype =
  | "tagliando"
  | "tagliando completo"
  | "gomme"
  | "gomme-straordinario"
  | "riparazione"
  | "altro";

type MaterialeManutenzione = NextManutenzioniLegacyMaterialRecord;
type AsseCoinvoltoId = NextManutenzioneAsseCoinvoltoId;

type CompletionSaveOverrides = {
  completionFornitore?: string;
  completionData?: string;
  completionKm?: string;
};

const COMPLETION_KM_REQUIRED_CATEGORIES = new Set([
  "motrice 2 assi",
  "motrice 3 assi",
  "motrice 4 assi",
  "trattore stradale",
]);

const INITIAL_STATE_TOGGLE_ACTIVE_STYLE: CSSProperties = {
  background: "#dcfce7",
  borderColor: "#22c55e",
  color: "#166534",
  boxShadow: "0 0 0 1px rgba(34, 197, 94, 0.35)",
};

type MaterialeInventario = {
  id: string;
  label: string;
  quantitaTotale: number;
  unita: string;
  fornitoreLabel?: string | null;
};

type MezzoPreview = {
  id: string;
  targa: string;
  label: string;
  categoria: string | null;
  marcaModello: string | null;
  autistaNome: string | null;
  fotoUrl: string | null;
};

type PdfMetricInfo = {
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel?: string;
  secondaryValue?: string;
  deltaLabel?: string;
  deltaValue?: string;
};

type PdfModalLayout = "data" | "month" | "type";

type PdfImageData = {
  dataUrl: string;
  format: "JPEG" | "PNG";
  widthPx: number;
  heightPx: number;
  byteSize: number;
};

type PdfContainPlacement = {
  drawX: number;
  drawY: number;
  drawW: number;
  drawH: number;
};

type PdfOriginNotesById = Record<string, string>;

type PdfDocWithPlugins = {
  addFileToVFS(fileName: string, fileData: string): void;
  addFont(
    postScriptName: string,
    id: string,
    fontStyle: "normal" | "bold" | "italic" | "bolditalic",
    fontWeight?: string | number,
  ): void;
  setFont(fontName: string, fontStyle?: "normal" | "bold" | "italic" | "bolditalic"): void;
  __nextUnicodeFontReady?: boolean;
};

type PageLoadData = {
  storico: NextManutenzioniLegacyDatasetRecord[];
  mezzi: NextManutenzioniMezzoOption[];
  segnalazioniAutisti: NextAutistiSegnalazioneSectionItem[];
  materialiInventario: MaterialeInventario[];
  mezzoPreview: MezzoPreview[];
  kmUltimoByTarga: Record<string, number | null>;
  lavoriInAttesaByTarga: Record<string, number>;
  // Mappa id->record GREZZO delle origini (segnalazioni/controlli), per costruire
  // la frase storia coerentemente in dashboard/lista/PDF come fa il dettaglio.
  origineRawById: Map<string, Record<string, unknown>>;
};

type SegnalazioniDaFareGroup = {
  key: string;
  gruppoId: string | null;
  targa: string;
  segnalazioni: NextAutistiSegnalazioneSectionItem[];
};

type ManutenzioniDaFareGroup = {
  key: string;
  gruppoId: string;
  targa: string;
  manutenzioni: NextManutenzioniLegacyDatasetRecord[];
};

type ManutenzioniOperativeGrouped = {
  gruppi: ManutenzioniDaFareGroup[];
  libere: NextManutenzioniLegacyDatasetRecord[];
  altre: NextManutenzioniLegacyDatasetRecord[];
};

type SegnalazioniDaFareTargaGroup = {
  targa: string;
  gruppi: SegnalazioniDaFareGroup[];
  libere: NextAutistiSegnalazioneSectionItem[];
};

type LavoroGruppoRetryState = {
  manutenzioneId: string;
  failedIds: string[];
};

type AgganciaSegnalazioneModalState = {
  sorgente: AgganciaLegameSorgente;
  candidati: ManutenzioneCandidataAggancio[];
  busy: boolean;
};

const PDF_SUBJECT_ORDER: TipoVoce[] = ["mezzo", "compressore", "attrezzature"];
const PDF_SUBJECT_LABELS: Record<TipoVoce, { singular: string; plural: string }> = {
  mezzo: { singular: "Mezzo", plural: "Mezzi" },
  compressore: { singular: "Compressore", plural: "Compressori" },
  attrezzature: { singular: "Attrezzatura", plural: "Attrezzature" },
};

type CreaManutenzioneSegnalazioneModalState = {
  item: NextAutistiSegnalazioneSectionItem;
  sourceRecord: Record<string, unknown>;
  descrizione: string;
  urgenza: Extract<NextManutenzioneUrgenza, "alta" | "media">;
  busy: boolean;
};

const PDF_UNICODE_FONT_URL =
  "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf";
const PDF_UNICODE_FONT_FILE = "Roboto-Regular.ttf";
const PDF_UNICODE_FONT_FAMILY = "RobotoUnicode";
const PDF_IMAGE_MAX_LONG_SIDE_PX = 1200;
const PDF_IMAGE_JPEG_QUALITY = 0.85;
const PDF_IMAGE_COMPRESSION = "SLOW" as const;
const PDF_HEADER_BLACK_RGB = [26, 26, 26] as const;

let pdfUnicodeFontBase64Promise: Promise<string | null> | null = null;

const TAGLIANDO_COMPONENTI = [
  "olio motore",
  "olio idraulico",
  "filtri",
  "cinghie",
  "lubrificazione",
];

function todayLabel() {
  return toISO(new Date()) ?? "";
}

function normalizeText(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeFreeText(value: string) {
  return value.trim();
}

function getLegacyDateTimestamp(value: string | null | undefined) {
  return parseAnyDate(value)?.getTime() ?? 0;
}

function buildMonthFilterKey(value: string | null | undefined): PdfPeriodFilter | null {
  const parsed = parseAnyDate(value);
  if (!parsed) return null;
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  return `mese:${parsed.getFullYear()}-${month}`;
}

function formatMonthFilterLabel(filter: PdfPeriodFilter) {
  if (filter === "ultimo-mese") return "Ultimo mese";
  if (filter === "tutto") return "Tutto";
  const [, key] = filter.split(":");
  const [yearRaw, monthRaw] = key.split("-");
  return toDisplay(`${yearRaw}-${monthRaw}-01`) || key;
}

function formatDateDigitsInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatDateShort(value: string | null | undefined) {
  return toDisplay(value) || value || "Nessuna";
}

function formatDateFull(value: string | null | undefined) {
  return toDisplay(value) || value || "DA VERIFICARE";
}

function formatNumberIt(value: number | null | undefined) {
  if (value == null) return "DA VERIFICARE";
  return new Intl.NumberFormat("it-IT").format(value);
}

function resolvePdfMaintenanceTypeLabel(item: NextManutenzioniLegacyDatasetRecord) {
  if (
    item.gommeInterventoTipo === "ordinario" ||
    item.gommeInterventoTipo === "straordinario" ||
    (item.gommePerAsse?.length ?? 0) > 0 ||
    (item.assiCoinvolti?.length ?? 0) > 0
  ) {
    return "gomme";
  }

  if (item.tipo === "compressore") return "compressore";
  if (item.tipo === "attrezzature") return "attrezzature";
  return item.tipo || "altro";
}

function resolvePdfListTitle(count: number) {
  if (count <= 1) return "Ultima manutenzione";
  if (count === 2) return "Ultime 2 manutenzioni";
  return "Ultime 3 manutenzioni";
}

function buildPdfPeriodRangeLabel(items: NextManutenzioniLegacyDatasetRecord[]) {
  if (!items.length) return "DA VERIFICARE";
  const sorted = [...items].sort(
    (left, right) =>
      getMaintenancePdfSortTimestamp(left) -
      getMaintenancePdfSortTimestamp(right),
  );
  return `${formatMaintenancePdfDateLabel(sorted[0])} – ${formatMaintenancePdfDateLabel(sorted[sorted.length - 1])}`;
}

function buildDescrizioneSnippet(value: string, limit = 140) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 3)}...`;
}

function formatMaintenanceImporto(
  item: Pick<
    NextManutenzioniLegacyDatasetRecord,
    "importo" | "sourceDocumentCurrency"
  >,
) {
  if (item.importo == null) return null;
  const amount = item.importo.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (item.sourceDocumentCurrency === "CHF") {
    return `CHF ${amount}`;
  }
  if (item.sourceDocumentCurrency === "EUR") {
    return `€ ${amount}`;
  }
  return amount;
}

function parseImportoInput(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

const URGENZA_PRIORITY: Record<NextManutenzioneUrgenza, number> = {
  alta: 3,
  media: 2,
  bassa: 1,
};

const URGENZA_BADGE_STYLE: Record<NextManutenzioneUrgenza, CSSProperties> = {
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

function resolveMaintenanceStato(item: NextManutenzioniLegacyDatasetRecord): NextManutenzioneStato {
  if (
    item.stato === "programmata" ||
    item.stato === "eseguita" ||
    item.stato === "chiusa_da_evento"
  ) {
    return item.stato;
  }
  return "daFare";
}

function normalizeCompletionCategory(value: string | null | undefined): string {
  return normalizeFreeText(value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function requiresKmForCompletionCategory(value: string | null | undefined): boolean {
  return COMPLETION_KM_REQUIRED_CATEGORIES.has(normalizeCompletionCategory(value));
}

function isStructuredGommeInterventoTipo(value: NextManutenzioneGommeInterventoTipo | null | undefined): boolean {
  return value === "ordinario" || value === "straordinario";
}

function formatMaintenanceStatoLabel(stato: NextManutenzioneStato): string {
  if (stato === "programmata") return "PROGRAMMATA";
  if (stato === "eseguita") return "ESEGUITA";
  if (stato === "chiusa_da_evento") return "CHIUSA DA EVENTO";
  return "DA FARE";
}

// PROMPT 44 — D6: etichetta che distingue il "vero daFare" (esplicito) dai
// record legacy senza stato (55/73), mostrandoli come "STORICO". Usato dove
// renderizzi il valore per l'utente; per i filtri interni continua a passare
// per `resolveMaintenanceStato` (che collassa null → "daFare").
function formatMaintenanceStatoLabelDisplay(item: NextManutenzioniLegacyDatasetRecord): string {
  const raw = item.stato;
  if (raw === "programmata") return "PROGRAMMATA";
  if (raw === "eseguita") return "ESEGUITA";
  if (raw === "chiusa_da_evento") return "CHIUSA DA EVENTO";
  if (raw === "daFare") return "DA FARE";
  return "STORICO";
}

function formatChiusuraEventoTipo(value: string | null | undefined): string {
  if (value === "gomme_evento") return "cambio gomme";
  if (value === "manutenzione_eseguita") return "manutenzione eseguita";
  return value ? value.replace(/_/g, " ") : "evento";
}

function buildChiusuraDaEventoTitle(item: NextManutenzioniLegacyDatasetRecord): string | undefined {
  if (resolveMaintenanceStato(item) !== "chiusa_da_evento") return undefined;
  const evento = formatChiusuraEventoTipo(item.chiusuraDi);
  const data = item.chiusuraData ? formatDateTimeUI(item.chiusuraData) : "-";
  return data && data !== "-"
    ? `Chiusa dal ${evento} del ${data}`
    : `Chiusa dal ${evento}`;
}

function getMaintenanceStatoBadgeStyle(stato: NextManutenzioneStato): CSSProperties | undefined {
  if (stato !== "chiusa_da_evento") return undefined;
  return { background: "#f3f4f6", color: "#374151", borderColor: "#d1d5db" };
}

function resolveMaintenanceUrgenza(item: NextManutenzioniLegacyDatasetRecord): NextManutenzioneUrgenza {
  return item.urgenza ?? "bassa";
}

function resolveMaintenanceOrigine(item: NextManutenzioniLegacyDatasetRecord): NextManutenzioneOrigineTipo {
  return item.origineTipo ?? "manuale";
}

function formatMaintenanceOrigineLabel(value: NextManutenzioneOrigineTipo): string {
  if (value === "controllo") return "Controllo KO";
  if (value === "segnalazione") return "Segnalazione";
  return "Manuale";
}

function readOrigineText(data: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
  }
  return null;
}

function readOrigineDateText(data: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = data[key];
    if (value == null || value === "") continue;
    const formatted = formatDateTimeUI(value as Parameters<typeof formatDateTimeUI>[0]);
    if (formatted !== "-") return formatted;
  }
  return null;
}

function readOrigineFotoUrls(data: Record<string, unknown>): string[] {
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

function buildOrigineDetails(record: NextManutenzioneOrigineRecord): Array<{ label: string; value: string }> {
  const data = record.data;
  const details: Array<{ label: string; value: string }> = [];
  const push = (label: string, keys: string[]) => {
    const value = readOrigineText(data, keys);
    if (value) details.push({ label, value });
  };
  const pushDate = (label: string, keys: string[]) => {
    const value = readOrigineDateText(data, keys);
    if (value) details.push({ label, value });
  };

  push("Targa", ["targa", "targaCamion", "targaMotrice", "targaRimorchio"]);
  push("Autista", ["autistaNome", "nomeAutista", "autista", "badgeAutista", "badge"]);
  pushDate("Data", ["data", "createdAt", "timestamp", "date"]);
  push("Problema", ["tipoProblema", "tipo", "categoria"]);
  push("Descrizione", ["descrizione", "note", "messaggio"]);
  if (record.origineTipo === "controllo") {
    const check = data.check;
    if (check && typeof check === "object") {
      const koList = Object.entries(check as Record<string, unknown>)
        .filter(([, value]) => value === false)
        .map(([key]) => key.toUpperCase());
      if (koList.length > 0) {
        details.push({ label: "KO", value: koList.join(", ") });
      }
    }
    push("Target", ["target"]);
  }
  return details;
}

function buildPdfOriginNote(
  item: NextManutenzioniLegacyDatasetRecord,
  origineRecord: NextManutenzioneOrigineRecord | null,
): string | null {
  if (item.origineTipo !== "segnalazione" && item.origineTipo !== "controllo") return null;
  const data = origineRecord?.data ?? {};
  const autore =
    readOrigineText(data, ["autistaNome", "nomeAutista", "autista", "badgeAutista", "badge"]) ??
    item.segnalatoDa ??
    null;
  if (!autore) return null;

  const dateLabel =
    readOrigineDateText(data, ["data", "createdAt", "timestamp", "date", "dataInserimento"]) ??
    "data non disponibile";

  if (item.origineTipo === "controllo") {
    return `Controllo KO di ${autore} del ${dateLabel}`;
  }
  return `Segnalato da ${autore} il ${dateLabel}`;
}

function buildPdfDescrizioneWithOrigin(
  item: NextManutenzioniLegacyDatasetRecord,
  notesById: PdfOriginNotesById,
): string {
  const base = buildPdfDescrizione(item);
  const originNote = notesById[item.id];
  const withOrigin = originNote ? `${base}\n${originNote}` : base;
  const noteEsecuzione = item.noteEsecuzione?.trim();
  return noteEsecuzione ? `${withOrigin}\nCosa è stato fatto: ${noteEsecuzione}` : withOrigin;
}

function formatDaFareDateLabel(item: NextManutenzioniLegacyDatasetRecord): string {
  const value = item.dataProgrammata || item.data || item.dataEsecuzione || null;
  return toDisplay(value) || value || "-";
}

function formatMaintenancePdfDateLabel(item: NextManutenzioniLegacyDatasetRecord): string {
  const value = getMaintenancePdfDateValue(item);
  if (value) return formatDateFull(value);
  const stato = resolveMaintenanceStato(item);
  return stato === "daFare" || stato === "programmata" ? "in programma" : "-";
}

function isPdfOperativeMaintenance(item: NextManutenzioniLegacyDatasetRecord): boolean {
  const stato = resolveMaintenanceStato(item);
  return stato === "daFare" || stato === "programmata";
}

function isPdfClosedByExternalEvent(item: NextManutenzioniLegacyDatasetRecord): boolean {
  return isSatelliteChiusoDaEvento(item as unknown as Record<string, unknown>);
}

function normalizePdfDateCandidate(value: unknown): string | null {
  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return null;
    if (/^\d{10,13}$/.test(raw)) {
      return toDisplay(Number(raw)) || null;
    }
    return raw;
  }
  return toDisplay(value) || null;
}

function getMaintenancePdfDateValue(item: NextManutenzioniLegacyDatasetRecord): string | null {
  const raw = item as unknown as Record<string, unknown>;
  const candidates = isPdfClosedByExternalEvent(item)
    ? [
        raw.chiusuraData,
        item.dataEsecuzione,
        item.data,
        raw.dataInserimento,
        raw.createdAt,
        raw.timestamp,
      ]
    : isPdfOperativeMaintenance(item)
    ? [
        item.dataProgrammata,
        raw.dataInserimento,
        raw.createdAt,
        raw.timestamp,
        item.data,
        item.dataEsecuzione,
      ]
    : [
        item.data,
        item.dataEsecuzione,
        item.dataProgrammata,
        raw.dataInserimento,
        raw.createdAt,
        raw.timestamp,
      ];

  for (const candidate of candidates) {
    const normalized = normalizePdfDateCandidate(candidate);
    if (normalized) return normalized;
  }
  return null;
}

function formatPdfChiusuraDateLabel(item: NextManutenzioniLegacyDatasetRecord): string {
  const raw = item as unknown as Record<string, unknown>;
  const value = normalizePdfDateCandidate(raw.chiusuraData) ?? normalizePdfDateCandidate(item.dataEsecuzione);
  return value ? formatDateFull(value) : "DA VERIFICARE";
}

function buildPdfClosedExternalOriginLabel(
  item: NextManutenzioniLegacyDatasetRecord,
  notesById: PdfOriginNotesById,
): string {
  return notesById[item.id] ?? formatMaintenancePdfDateLabel(item);
}

function getMaintenancePdfSortTimestamp(item: NextManutenzioniLegacyDatasetRecord): number {
  return getLegacyDateTimestamp(getMaintenancePdfDateValue(item));
}

function buildPdfFileName(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return `${normalized || "quadro-manutenzioni"}.pdf`;
}

function formatPdfGenerationDate() {
  return formatDateTimeUI(new Date());
}

function getPdfImageFormat(mimeType: string | null | undefined): "JPEG" | "PNG" {
  return mimeType?.toLowerCase().includes("png") ? "PNG" : "JPEG";
}

function estimateDataUrlByteSize(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

async function getPdfUnicodeFontBase64(): Promise<string | null> {
  if (!pdfUnicodeFontBase64Promise) {
    pdfUnicodeFontBase64Promise = (async () => {
      try {
        const response = await fetch(PDF_UNICODE_FONT_URL);
        if (!response.ok) return null;
        const buffer = await response.arrayBuffer();
        return arrayBufferToBase64(buffer);
      } catch {
        return null;
      }
    })();
  }

  return pdfUnicodeFontBase64Promise;
}

function normalizePdfFallbackText(value: string): string {
  return value
    .replace(/Δ/g, "Delta")
    .replace(/[–—]/g, "-")
    .replace(/€/g, "EUR");
}

function toPdfText(value: string, fontReady: boolean): string {
  return fontReady ? value : normalizePdfFallbackText(value);
}

function fitPdfSingleLineText(
  doc: { getTextWidth(text: string): number },
  value: string,
  maxWidth: number,
) {
  const normalized = value.trim();
  if (!normalized || maxWidth <= 0 || doc.getTextWidth(normalized) <= maxWidth) {
    return normalized;
  }

  let candidate = normalized;
  while (candidate.length > 1 && doc.getTextWidth(`${candidate}…`) > maxWidth) {
    candidate = candidate.slice(0, -1).trimEnd();
  }

  return candidate.length < normalized.length ? `${candidate}…` : normalized;
}

async function ensurePdfUnicodeFont(doc: PdfDocWithPlugins): Promise<boolean> {
  if (doc.__nextUnicodeFontReady) {
    doc.setFont(PDF_UNICODE_FONT_FAMILY, "normal");
    return true;
  }

  try {
    const fontBase64 = await getPdfUnicodeFontBase64();
    if (!fontBase64) {
      console.warn("Font Unicode PDF non disponibile: fallback Helvetica.");
      return false;
    }

    doc.addFileToVFS(PDF_UNICODE_FONT_FILE, fontBase64);
    doc.addFont(PDF_UNICODE_FONT_FILE, PDF_UNICODE_FONT_FAMILY, "normal");
    doc.addFont(PDF_UNICODE_FONT_FILE, PDF_UNICODE_FONT_FAMILY, "bold");
    doc.__nextUnicodeFontReady = true;
    doc.setFont(PDF_UNICODE_FONT_FAMILY, "normal");
    return true;
  } catch (error) {
    console.warn("Registrazione font Unicode PDF fallita:", error);
    return false;
  }
}

async function loadImageElement(source: string): Promise<HTMLImageElement | null> {
  return await new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

function renderImageElementToPdfData(image: HTMLImageElement): PdfImageData | null {
  const sourceWidth = image.naturalWidth || image.width || 0;
  const sourceHeight = image.naturalHeight || image.height || 0;
  if (!sourceWidth || !sourceHeight) return null;

  const resizeRatio = Math.min(1, PDF_IMAGE_MAX_LONG_SIDE_PX / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * resizeRatio));
  const height = Math.max(1, Math.round(sourceHeight * resizeRatio));

  const canvas = renderImageToPdfCanvas(image, sourceWidth, sourceHeight, width, height);
  if (!canvas) return null;

  const dataUrl = canvas.toDataURL("image/jpeg", PDF_IMAGE_JPEG_QUALITY);
  return {
    dataUrl,
    format: "JPEG",
    widthPx: width,
    heightPx: height,
    byteSize: estimateDataUrlByteSize(dataUrl),
  };
}

function calculatePdfContainPlacement(args: {
  boxX: number;
  boxY: number;
  boxW: number;
  boxH: number;
  imgW: number;
  imgH: number;
}): PdfContainPlacement {
  if (args.imgW <= 0 || args.imgH <= 0 || args.boxW <= 0 || args.boxH <= 0) {
    return {
      drawX: args.boxX,
      drawY: args.boxY,
      drawW: args.boxW,
      drawH: args.boxH,
    };
  }

  const scale = Math.min(args.boxW / args.imgW, args.boxH / args.imgH);
  const drawW = args.imgW * scale;
  const drawH = args.imgH * scale;

  return {
    drawX: args.boxX + (args.boxW - drawW) / 2,
    drawY: args.boxY + (args.boxH - drawH) / 2,
    drawW,
    drawH,
  };
}

function createPdfImageCanvas(width: number, height: number): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return null;

  canvas.width = width;
  canvas.height = height;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  return canvas;
}

function drawPdfImageToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
): HTMLCanvasElement | null {
  const canvas = createPdfImageCanvas(width, height);
  if (!canvas) return null;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, width, height);
  return canvas;
}

function renderImageToPdfCanvas(
  image: HTMLImageElement,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): HTMLCanvasElement | null {
  let currentCanvas = drawPdfImageToCanvas(image, sourceWidth, sourceHeight);
  if (!currentCanvas) return null;

  let currentWidth = sourceWidth;
  let currentHeight = sourceHeight;

  while (currentWidth / 2 > targetWidth && currentHeight / 2 > targetHeight) {
    const nextWidth = Math.max(targetWidth, Math.round(currentWidth / 2));
    const nextHeight = Math.max(targetHeight, Math.round(currentHeight / 2));
    const nextCanvas = drawPdfImageToCanvas(currentCanvas, nextWidth, nextHeight);
    if (!nextCanvas) return null;
    currentCanvas = nextCanvas;
    currentWidth = nextWidth;
    currentHeight = nextHeight;
  }

  if (currentWidth !== targetWidth || currentHeight !== targetHeight) {
    return drawPdfImageToCanvas(currentCanvas, targetWidth, targetHeight);
  }

  return currentCanvas;
}

async function loadPdfImageData(url: string): Promise<PdfImageData | null> {
  try {
    const normalizedUrl = url.trim();
    if (!normalizedUrl) return null;

    const response = await fetch(normalizedUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) return null;

    const blobUrl = URL.createObjectURL(blob);
    try {
      const image = await loadImageElement(blobUrl);
      if (!image) return null;

      const renderedImageData = renderImageElementToPdfData(image);
      if (renderedImageData) return renderedImageData;

      const fallbackDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Errore lettura immagine PDF."));
        reader.readAsDataURL(blob);
      });

      return {
        dataUrl: fallbackDataUrl,
        format: getPdfImageFormat(blob.type),
        widthPx: image.naturalWidth || image.width || 0,
        heightPx: image.naturalHeight || image.height || 0,
        byteSize: estimateDataUrlByteSize(fallbackDataUrl),
      };
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  } catch {
    return null;
  }
}

function isGommeStraordinarieKeyword(value: string) {
  const normalized = value.toUpperCase();
  return (
    normalized.includes("FORAT") ||
    normalized.includes("DANN") ||
    normalized.includes("URGENT") ||
    normalized.includes("STRAORD") ||
    normalized.includes("SINGOL")
  );
}

function deriveUiSubtype(item: {
  descrizione: string;
  gommeInterventoTipo?: NextManutenzioneGommeInterventoTipo;
  gommePerAsse?: NextManutenzioneGommePerAsseRecord[];
  assiCoinvolti?: string[];
}): InterventoUiSubtype {
  if (item.gommeInterventoTipo === "straordinario") return "gomme-straordinario";
  if (
    item.gommeInterventoTipo === "ordinario" ||
    (item.gommePerAsse?.length ?? 0) > 0 ||
    (item.assiCoinvolti?.length ?? 0) > 0
  ) {
    return "gomme";
  }

  const normalized = item.descrizione.toUpperCase();
  if ((normalized.includes("GOMME") || normalized.includes("PNEUM")) && isGommeStraordinarieKeyword(normalized)) {
    return "gomme-straordinario";
  }
  if (normalized.includes("CAMBIO GOMME")) return "gomme";
  if (normalized.includes("TAGLIANDO")) return "tagliando completo";
  if (normalized.includes("RIPARAZ")) return "riparazione";
  return "altro";
}

function mapMezzoPreview(
  mezzo: NextMezzoListItem,
  fallbackByTarga: Map<string, NextManutenzioniMezzoOption>,
): MezzoPreview {
  const fallback = fallbackByTarga.get(normalizeText(mezzo.targa));
  const brandModel = normalizeFreeText(mezzo.marcaModello || [mezzo.marca, mezzo.modello].filter(Boolean).join(" "));

  return {
    id: mezzo.id,
    targa: normalizeText(mezzo.targa),
    label: fallback?.label || `${normalizeText(mezzo.targa)} - ${brandModel || "Mezzo"}`,
    categoria: normalizeFreeText(mezzo.categoria) || fallback?.categoria || null,
    marcaModello: brandModel || null,
    autistaNome: normalizeFreeText(mezzo.autistaNome || "") || null,
    fotoUrl: mezzo.fotoUrl ?? null,
  };
}

function mapInventoryItem(item: NextInventarioReadOnlyItem): MaterialeInventario {
  const label = normalizeFreeText(item.descrizione || "");
  return {
    id: item.id,
    label: label || "MATERIALE SENZA DESCRIZIONE",
    quantitaTotale: item.quantita ?? 0,
    unita: item.unita ?? "pz",
    fornitoreLabel: item.fornitore ?? null,
  };
}

function buildMisuraLabel(item: NextManutenzioniLegacyDatasetRecord) {
  if (item.tipo === "mezzo") {
    return item.km != null ? `${item.km} KM` : "-";
  }
  if (item.tipo === "compressore") {
    return item.ore != null ? `${item.ore} ORE` : "-";
  }
  if (item.ore != null) {
    return `${item.ore} ORE`;
  }
  if (item.km != null) {
    return `${item.km} KM`;
  }
  return "-";
}

function resolveMissingInterventoMetricLabel(
  subjectType: TipoVoce,
  categoria?: string | null,
) {
  if (subjectType === "mezzo" && isNextCategoriaMotorizzata(categoria)) {
    return "— (km da inserire)";
  }
  return "—";
}

function formatMetricValue(value: number | null | undefined, suffix: "KM" | "ORE") {
  if (value == null) return "DA VERIFICARE";
  return `${formatNumberIt(value)} ${suffix}`;
}

function buildPdfMetricInfo(args: {
  subjectType: TipoVoce;
  latestItem: NextManutenzioniLegacyDatasetRecord;
  currentKm: number | null;
  currentOre: number | null;
  categoria?: string | null;
}): PdfMetricInfo | null {
  if (args.subjectType === "mezzo") {
    const currentKm = args.currentKm;
    const interventoKm = args.latestItem.km ?? null;
    const deltaKm =
      currentKm !== null && interventoKm !== null
        ? currentKm - interventoKm
        : null;
    const deltaValue =
      deltaKm === null
        ? "—"
        : deltaKm < 0
          ? "—"
          : deltaKm === 0
            ? "0"
            : `+${formatNumberIt(deltaKm)}`;

    return {
      primaryLabel: "Km attuali",
      primaryValue: formatMetricValue(currentKm, "KM"),
      secondaryLabel: "Km intervento",
      secondaryValue:
        interventoKm !== null
          ? formatMetricValue(interventoKm, "KM")
          : resolveMissingInterventoMetricLabel(args.subjectType, args.categoria),
      deltaLabel: "Δ km",
      deltaValue,
    };
  }

  if (args.subjectType === "compressore") {
    const currentOre = args.currentOre;
    const interventoOre = args.latestItem.ore ?? null;
    const deltaOre =
      currentOre !== null && interventoOre !== null
        ? currentOre - interventoOre
        : null;
    const deltaValue =
      deltaOre === null
        ? "—"
        : deltaOre < 0
          ? "—"
          : deltaOre === 0
            ? "0"
            : `+${formatNumberIt(deltaOre)}`;

    return {
      primaryLabel: "Ore attuali",
      primaryValue: formatMetricValue(currentOre, "ORE"),
      secondaryLabel: "Ore intervento",
      secondaryValue: formatMetricValue(interventoOre, "ORE"),
      deltaLabel: "Δ ore",
      deltaValue,
    };
  }

  if (args.latestItem.ore != null) {
    return {
      primaryLabel: "Ore record",
      primaryValue: formatMetricValue(args.latestItem.ore, "ORE"),
    };
  }

  if (args.latestItem.km != null) {
    return {
      primaryLabel: "Km record",
      primaryValue: formatMetricValue(args.latestItem.km, "KM"),
    };
  }

  return null;
}

function resolvePdfMetricColumnLabel(items: NextManutenzioniLegacyDatasetRecord[]) {
  const types = Array.from(new Set(items.map((item) => item.tipo)));
  if (types.length === 1) {
    if (types[0] === "mezzo") return "Km";
    if (types[0] === "compressore") return "Ore";
    return "Misura";
  }
  return "Km/Ore";
}

function parseNullableNumberInput(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function isUiSubtypeGommeOrdinario(value: InterventoUiSubtype) {
  return value === "gomme";
}

function isUiSubtypeGommeStraordinario(value: InterventoUiSubtype) {
  return value === "gomme-straordinario";
}

function isUiSubtypeGomme(value: InterventoUiSubtype) {
  return isUiSubtypeGommeOrdinario(value) || isUiSubtypeGommeStraordinario(value);
}

function buildGommePerAssePayload(args: {
  assiCoinvolti: AsseCoinvoltoId[];
  data: string;
  km: string;
  isMotorizzato: boolean;
}): NextManutenzioneGommePerAsseRecord[] {
  const dataCambio = normalizeFreeText(args.data) || null;
  const kmCambio = args.isMotorizzato ? parseNullableNumberInput(args.km) : null;

  return args.assiCoinvolti.map((asseId) => ({
    asseId,
    dataCambio,
    kmCambio,
  }));
}

function buildGommeStraordinarioPayload(args: {
  asseId: AsseCoinvoltoId | "";
  quantita: string;
  motivo: string;
}): NextManutenzioneGommeStraordinarioRecord | null {
  const asseId = args.asseId || null;
  const quantita = parseNullableNumberInput(args.quantita);
  const motivo = normalizeFreeText(args.motivo) || null;

  if (!asseId && quantita === null && !motivo) {
    return null;
  }

  return {
    asseId,
    quantita,
    motivo,
  };
}

function buildPdfDescrizione(item: NextManutenzioniLegacyDatasetRecord) {
  if (item.gommeInterventoTipo === "straordinario") {
    const motivo = item.gommeStraordinario?.motivo || "Evento gomme straordinario";
    return `[STRAORDINARIO] ${motivo} - ${item.descrizione}`;
  }
  if (
    item.gommeInterventoTipo === "ordinario" ||
    (item.gommePerAsse?.length ?? 0) > 0 ||
    (item.assiCoinvolti?.length ?? 0) > 0
  ) {
    return `[ORDINARIO] ${item.descrizione}`;
  }
  return item.descrizione;
}

function buildPdfTableMetricValue(
  item: NextManutenzioniLegacyDatasetRecord,
  categoria?: string | null,
) {
  if (item.tipo === "mezzo") {
    return item.km !== null
      ? formatNumberIt(item.km)
      : resolveMissingInterventoMetricLabel(item.tipo, categoria);
  }
  if (item.tipo === "compressore") {
    return item.ore !== null ? formatNumberIt(item.ore) : "—";
  }
  if (item.ore !== null) {
    return formatNumberIt(item.ore);
  }
  if (item.km !== null) {
    return formatNumberIt(item.km);
  }
  return "—";
}

function mapLegacyRecordToGommeReadModel(item: NextManutenzioniLegacyDatasetRecord) {
  const pdfDate = getMaintenancePdfDateValue(item);
  return {
    id: item.id,
    mezzoTarga: item.targa,
    targa: item.targa,
    data: pdfDate,
    dataLabel: pdfDate,
    timestamp: getLegacyDateTimestamp(pdfDate),
    descrizione: item.descrizione ?? null,
    tipo: item.tipo ?? null,
    km: item.km ?? null,
    ore: item.ore ?? null,
    fornitore: item.fornitore ?? null,
    materialiCount: item.materiali?.length ?? 0,
    assiCoinvolti: normalizeNextAssiCoinvolti(item.assiCoinvolti),
    gommePerAsse: item.gommePerAsse ?? [],
    gommeInterventoTipo: item.gommeInterventoTipo ?? null,
    gommeStraordinario: item.gommeStraordinario ?? null,
    isCambioGommeDerived:
      (item.gommePerAsse?.length ?? 0) > 0 ||
      item.descrizione.toUpperCase().includes("GOMME") ||
      item.descrizione.toUpperCase().includes("PNEUM"),
    stato: resolveMaintenanceStato(item),
    dataProgrammata: item.dataProgrammata ?? null,
    origineTipo: item.origineTipo ?? null,
    origineRefId: item.origineRefId ?? null,
    origineRefKey: item.origineRefKey ?? null,
    segnalatoDa: item.segnalatoDa ?? null,
    chiusuraDi: item.chiusuraDi ?? null,
    chiusuraRefId: item.chiusuraRefId ?? null,
    chiusuraData: item.chiusuraData ?? null,
    sourceDataset: "@manutenzioni",
    sourceRecordId: item.id,
    sourceOrigin: "manuale",
    quality: "source_direct" as const,
    flags: [],
  };
}

function toMaterialiTemp(items: NextManutenzioniLegacyDatasetRecord["materiali"]): MaterialeManutenzione[] {
  if (!items?.length) return [];
  return items.map((item, index) => ({
    id: item.id || `materiale:${index}`,
    label: item.label,
    quantita: item.quantita,
    unita: item.unita,
    fromInventario: item.fromInventario,
    refId: item.refId,
  }));
}

async function readPageData(): Promise<PageLoadData> {
  const [
    workspace,
    inventorySnapshot,
    flottaSnapshot,
    rifornimentiSnapshot,
    manutenzioniDaFare,
    autistiSnapshot,
    segnalazioniDoc,
    controlliDoc,
  ] = await Promise.all([
    readNextManutenzioniWorkspaceSnapshot(),
    readNextInventarioSnapshot({ includeCloneOverlays: false }),
    readNextAnagraficheFlottaSnapshot({ includeClonePatches: false }),
    readNextRifornimentiReadOnlySnapshot(),
    readNextManutenzioniDaFareAndProgrammataGlobalSnapshot(),
    readNextAutistiReadOnlySnapshot(Date.now(), {
      includeLocalClone: false,
      includeStorageOverlay: false,
    }),
    readNextUnifiedStorageDocument({ key: "@segnalazioni_autisti_tmp" }),
    readNextUnifiedStorageDocument({ key: "@controlli_mezzo_autisti" }),
  ]);

  // Indicizza per id i record GREZZI di origine (segnalazioni + controlli), una
  // volta sola: serve a dashboard/lista/PDF per la frase storia cross-letta.
  const origineRawById = new Map<string, Record<string, unknown>>();
  for (const record of [...segnalazioniDoc.records, ...controlliDoc.records]) {
    const id = String((record as Record<string, unknown>).id ?? "").trim();
    if (id) origineRawById.set(id, record as Record<string, unknown>);
  }

  const fallbackByTarga = new Map(
    workspace.mezzi.map((mezzo) => [normalizeText(mezzo.targa), mezzo] as const),
  );
  const mezzoPreview = flottaSnapshot.items.map((item) => mapMezzoPreview(item, fallbackByTarga));

  const kmUltimoByTarga = rifornimentiSnapshot.items.reduce<Record<string, number | null>>((acc, item) => {
    const targa = normalizeText(item.mezzoTarga || item.targa || "");
    if (!targa || item.km == null) return acc;
    const currentTimestamp = item.timestampRicostruito ?? item.timestamp ?? 0;
    const previousValue = acc[targa];
    if (previousValue == null) {
      acc[targa] = item.km;
      return acc;
    }
    const previousRow = rifornimentiSnapshot.items.find(
      (entry) =>
        normalizeText(entry.mezzoTarga || entry.targa || "") === targa
        && entry.km === previousValue,
    );
    const previousTimestamp = previousRow?.timestampRicostruito ?? previousRow?.timestamp ?? 0;
    if (currentTimestamp >= previousTimestamp) {
      acc[targa] = item.km;
    }
    return acc;
  }, {});

  const lavoriInAttesaByTarga = manutenzioniDaFare.reduce<Record<string, number>>((acc, item) => {
    const targa = normalizeText(item.targa || "");
    if (!targa) return acc;
    acc[targa] = (acc[targa] ?? 0) + 1;
    return acc;
  }, {});

  return {
    storico: workspace.storico,
    mezzi: workspace.mezzi,
    segnalazioniAutisti: autistiSnapshot.segnalazioniRows,
    materialiInventario: inventorySnapshot.items.map(mapInventoryItem),
    mezzoPreview,
    kmUltimoByTarga,
    lavoriInAttesaByTarga,
    origineRawById,
  };
}

export default function NextManutenzioniPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [view, setView] = useState<ViewTab>("dafare");
  const [origineModalRecord, setOrigineModalRecord] = useState<NextManutenzioneOrigineRecord | null>(null);
  const [origineModalLoading, setOrigineModalLoading] = useState(false);
  const [origineModalError, setOrigineModalError] = useState<string | null>(null);
  const [storico, setStorico] = useState<NextManutenzioniLegacyDatasetRecord[]>([]);
  const [mezzi, setMezzi] = useState<NextManutenzioniMezzoOption[]>([]);
  const [segnalazioniAutisti, setSegnalazioniAutisti] = useState<NextAutistiSegnalazioneSectionItem[]>([]);
  const [origineRawById, setOrigineRawById] = useState<Map<string, Record<string, unknown>>>(new Map());
  const [mezzoPreview, setMezzoPreview] = useState<MezzoPreview[]>([]);
  const [materialiInventario, setMaterialiInventario] = useState<MaterialeInventario[]>([]);
  const [kmUltimoByTarga, setKmUltimoByTarga] = useState<Record<string, number | null>>({});
  const [lavoriInAttesaByTarga, setLavoriInAttesaByTarga] = useState<Record<string, number>>({});

  const [selectedTarga, setSelectedTarga] = useState("");
  const [selectedDetailRecordId, setSelectedDetailRecordId] = useState<string | null>(null);
  const manualTargaSelectionRef = useRef(false);
  const [aggancioManutenzioneRecord, setAggancioManutenzioneRecord] =
    useState<NextManutenzioniLegacyDatasetRecord | null>(null);
  const [aggancioManutenzioneBusy, setAggancioManutenzioneBusy] = useState(false);
  const [ricercaMezzo, setRicercaMezzo] = useState("");
  const [pdfSubjectType, setPdfSubjectType] = useState<PdfSubjectSelection>("mezzo");
  const [pdfPeriodFilter, setPdfPeriodFilter] = useState<PdfPeriodFilter>("ultimo-mese");
  const [pdfIncludeOperative, setPdfIncludeOperative] = useState(true);
  const [pdfOriginNotesById, setPdfOriginNotesById] = useState<PdfOriginNotesById>({});
  const pdfOriginNotesCacheRef = useRef<PdfOriginNotesById>({});
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState("quadro-manutenzioni.pdf");
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Anteprima PDF quadro manutenzioni");
  const [modalOpenForTarga, setModalOpenForTarga] = useState<string | null>(null);
  const [pdfModalLayout, setPdfModalLayout] = useState<PdfModalLayout>("data");
  // PROMPT 42 — T1: record selezionato per la modale di conferma eliminazione dal Quadro.
  const [pdfDeleteCandidate, setPdfDeleteCandidate] =
    useState<NextManutenzioniLegacyDatasetRecord | null>(null);
  const [pdfDeleteBusy, setPdfDeleteBusy] = useState(false);
  const [daFareUrgenzaFilter, setDaFareUrgenzaFilter] = useState<DaFareUrgenzaFilter>("tutte");
  const [daFareOrigineFilter, setDaFareOrigineFilter] = useState<DaFareOrigineFilter>("tutte");
  const [daFareMenuId, setDaFareMenuId] = useState<string | null>(null);
  const [segnalazioniDaFareExpanded, setSegnalazioniDaFareExpanded] = useState(false);
  const [segnalazioneMenuId, setSegnalazioneMenuId] = useState<string | null>(null);
  const [gruppoSegnalazioneMenuId, setGruppoSegnalazioneMenuId] = useState<string | null>(null);
  const [agganciaSegnalazioneModal, setAgganciaSegnalazioneModal] =
    useState<AgganciaSegnalazioneModalState | null>(null);
  const [creaManutenzioneSegnalazioneModal, setCreaManutenzioneSegnalazioneModal] =
    useState<CreaManutenzioneSegnalazioneModalState | null>(null);
  const [selectedSegnalazioneIds, setSelectedSegnalazioneIds] = useState<string[]>([]);
  const [selectedGruppoSegnalazioneIds, setSelectedGruppoSegnalazioneIds] = useState<Record<string, string[]>>({});
  const [selectedManutenzioneLiberaIds, setSelectedManutenzioneLiberaIds] = useState<string[]>([]);
  const [gruppoManutenzioneBusyKey, setGruppoManutenzioneBusyKey] = useState<string | null>(null);
  const gruppoManutenzioneBusyRef = useRef(false);
  const [origineInlineMap, setOrigineInlineMap] = useState<Record<string, NextManutenzioneOrigineRecord>>({});

  const [targa, setTarga] = useState("");
  const [tipo, setTipo] = useState<TipoVoce>("mezzo");
  const [uiSubtype, setUiSubtype] = useState<InterventoUiSubtype>("altro");
  const [fornitore, setFornitore] = useState("");
  const [km, setKm] = useState("");
  const [ore, setOre] = useState("");
  const [sottotipo, setSottotipo] = useState<SottoTipo>("motrice");
  const [descrizione, setDescrizione] = useState("");
  const [eseguito, setEseguito] = useState("");
  const [noteEsecuzione, setNoteEsecuzione] = useState("");
  const [draftSegnalatoDa, setDraftSegnalatoDa] = useState("");
  const [data, setData] = useState(todayLabel());
  const [importo, setImporto] = useState("");
  const [createAsDaFare, setCreateAsDaFare] = useState(true);
  const [draftUrgenza, setDraftUrgenza] = useState<NextManutenzioneUrgenza>("media");
  const [materialeSearch, setMaterialeSearch] = useState("");
  const [materialiTemp, setMaterialiTemp] = useState<MaterialeManutenzione[]>([]);
  const [assiCoinvolti, setAssiCoinvolti] = useState<AsseCoinvoltoId[]>([]);
  const [gommeStraordinarioMotivo, setGommeStraordinarioMotivo] = useState("");
  const [gommeStraordinarioAsseId, setGommeStraordinarioAsseId] = useState<AsseCoinvoltoId | "">("");
  const [gommeStraordinarioQuantita, setGommeStraordinarioQuantita] = useState("");
  const [quantitaTemp, setQuantitaTemp] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  // Fase B: scadenze del mezzo, per collegare un'esecuzione alla scadenza.
  const [scadenzeAll, setScadenzeAll] = useState<NextManutenzioneScadenzaItem[]>([]);
  const [selectedScadenzaId, setSelectedScadenzaId] = useState("");
  const [completionRecordId, setCompletionRecordId] = useState<string | null>(null);
  const [completionModalRecord, setCompletionModalRecord] =
    useState<NextManutenzioniLegacyDatasetRecord | null>(null);
  const [lavoroGruppoRetryState, setLavoroGruppoRetryState] = useState<LavoroGruppoRetryState | null>(null);
  const [completionDraftFornitore, setCompletionDraftFornitore] = useState("");
  const [completionDraftData, setCompletionDraftData] = useState(todayLabel());
  const [completionDraftKm, setCompletionDraftKm] = useState("");
  // PROMPT 42 — T2: officine dell'anagrafica per i suggerimenti dell'autocomplete.
  const [officine, setOfficine] = useState<NextOfficinaReadOnlyItem[]>([]);
  const [autisti, setAutisti] = useState<NextCollegaReadOnlyItem[]>([]);
  const requestedTarga = useMemo(
    () => normalizeText(new URLSearchParams(location.search).get("targa") ?? ""),
    [location.search],
  );
  const requestedRecordId = useMemo(
    () => normalizeFreeText(new URLSearchParams(location.search).get("recordId") ?? ""),
    [location.search],
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const pageData = await readPageData();
        if (cancelled) return;

        setStorico(pageData.storico);
        setMezzi(pageData.mezzi);
        setSegnalazioniAutisti(pageData.segnalazioniAutisti);
        setMezzoPreview(pageData.mezzoPreview);
        setMaterialiInventario(pageData.materialiInventario);
        setKmUltimoByTarga(pageData.kmUltimoByTarga);
        setLavoriInAttesaByTarga(pageData.lavoriInAttesaByTarga);
        setOrigineRawById(pageData.origineRawById);
      } catch (loadError) {
        console.error("Errore caricamento Manutenzioni NEXT:", loadError);
        if (cancelled) return;
        setStorico([]);
        setMezzi([]);
        setSegnalazioniAutisti([]);
        setMezzoPreview([]);
        setMaterialiInventario([]);
        setKmUltimoByTarga({});
        setLavoriInAttesaByTarga({});
        setOrigineRawById(new Map());
        setError("Impossibile leggere il dataset reale di manutenzioni.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshData() {
    const pageData = await readPageData();
    setStorico(pageData.storico);
    setMezzi(pageData.mezzi);
    setSegnalazioniAutisti(pageData.segnalazioniAutisti);
    setMezzoPreview(pageData.mezzoPreview);
    setMaterialiInventario(pageData.materialiInventario);
    setKmUltimoByTarga(pageData.kmUltimoByTarga);
    setLavoriInAttesaByTarga(pageData.lavoriInAttesaByTarga);
    setOrigineRawById(pageData.origineRawById);
  }

  // Risolve i record GREZZI di origine (segnalazioni/controlli) collegati a una
  // manutenzione, dalla mappa caricata una sola volta. Cosi' dashboard/lista/PDF
  // costruiscono la frase storia leggendo la segnalazione reale, come il dettaglio.
  function resolveSourceRecordsForItem(
    item: Record<string, unknown>,
  ): Record<string, unknown>[] {
    const legami = readLegamiOrigine(item);
    const out: Record<string, unknown>[] = [];
    for (const legame of legami) {
      const rec = origineRawById.get(legame.refId);
      if (rec) out.push(rec);
    }
    return out;
  }

  useEffect(() => {
    return () => {
      revokePdfPreviewUrl(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  // PROMPT 42 — T2: carica le officine dell'anagrafica per i suggerimenti
  // dell'autocomplete del campo Officina. Read-only, nessuna scrittura @officine.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const snapshot = await readNextOfficineSnapshot({ includeCloneOverlays: false });
        if (!cancelled) setOfficine(snapshot.items);
      } catch {
        if (!cancelled) setOfficine([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const snapshot = await readNextColleghiSnapshot({ includeCloneOverlays: false });
        if (!cancelled) setAutisti(snapshot.items);
      } catch {
        if (!cancelled) setAutisti([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function resolvePdfOriginNotesForItems(
    items: NextManutenzioniLegacyDatasetRecord[],
  ): Promise<PdfOriginNotesById> {
    const targetItems = items.filter(
      (item) =>
        (item.origineTipo === "segnalazione" || item.origineTipo === "controllo") &&
        item.origineRefKey &&
        item.origineRefId,
    );
    if (targetItems.length === 0) return {};

    const cache = { ...pdfOriginNotesCacheRef.current };
    let changed = false;

    await Promise.all(
      targetItems.map(async (item) => {
        if (cache[item.id]) return;
        let note = buildPdfOriginNote(item, null);
        try {
          const origineRecord = await getNextManutenzioneOrigineRecord(item.origineRefKey, item.origineRefId);
          note = buildPdfOriginNote(item, origineRecord);
        } catch (originError) {
          console.warn("Origine manutenzione non disponibile per PDF:", item.id, originError);
        }
        if (note && item.origineRefs && item.origineRefs.length > 1) {
          note = `${note} (+${item.origineRefs.length - 1} origini)`;
        }
        if (!note) return;
        cache[item.id] = note;
        changed = true;
      }),
    );

    if (changed) {
      pdfOriginNotesCacheRef.current = cache;
      setPdfOriginNotesById(cache);
    }

    return targetItems.reduce<PdfOriginNotesById>((acc, item) => {
      if (cache[item.id]) acc[item.id] = cache[item.id];
      return acc;
    }, {});
  }

  useEffect(() => {
    if (view !== "pdf") return;
    void resolvePdfOriginNotesForItems(storico);
  }, [storico, view]);

  async function openManutenzioniPdfPreview(blob: Blob, fileName: string, title: string) {
    const preview = await openPreview({
      source: blob,
      fileName,
      previousUrl: pdfPreviewUrl,
    });
    setPdfPreviewUrl(preview.url);
    setPdfPreviewFileName(preview.fileName);
    setPdfPreviewTitle(title);
    setPdfPreviewOpen(true);
  }

  const activeTarga = normalizeText(selectedTarga || targa);

  // Fase B: carica le scadenze del mezzo (riusabile dopo un aggiornamento).
  async function reloadScadenze() {
    try {
      const snapshot = await readNextManutenzioniScadenzeSnapshot();
      setScadenzeAll(snapshot.items);
    } catch (err) {
      console.error("Errore caricamento scadenze:", err);
    }
  }

  useEffect(() => {
    void reloadScadenze();
  }, []);

  // Azzero la scadenza selezionata quando cambio mezzo (la lista cambia).
  useEffect(() => {
    setSelectedScadenzaId("");
  }, [activeTarga]);

  const normTargaCompare = (value: string) =>
    normalizeText(value).toUpperCase().replace(/\s+/g, "");

  const scadenzeDelMezzo = useMemo(
    () =>
      scadenzeAll.filter(
        (s) => s.attiva && normTargaCompare(s.targa) === normTargaCompare(activeTarga),
      ),
    [scadenzeAll, activeTarga],
  );
  const mezzoPreviewByTarga = useMemo(
    () => new Map(mezzoPreview.map((mezzo) => [mezzo.targa, mezzo] as const)),
    [mezzoPreview],
  );
  const mezzoSelezionato = useMemo(
    () => mezzi.find((mezzo) => mezzo.targa === activeTarga) ?? null,
    [activeTarga, mezzi],
  );
  const mezzoPreviewSelezionato = useMemo(
    () => mezzoPreview.find((mezzo) => mezzo.targa === activeTarga) ?? null,
    [activeTarga, mezzoPreview],
  );
  const categoriaTecnica = mezzoPreviewSelezionato?.categoria ?? mezzoSelezionato?.categoria ?? null;
  const assiDisponibili = useMemo(
    () => getNextAssiOptionsForCategoria(categoriaTecnica),
    [categoriaTecnica],
  );
  const categoriaMotorizzata = useMemo(
    () => isNextCategoriaMotorizzata(categoriaTecnica),
    [categoriaTecnica],
  );
  const completionRecordTarga = normalizeText(completionModalRecord?.targa ?? "");
  const completionCategoriaTecnica = useMemo(() => {
    if (!completionRecordTarga) return categoriaTecnica;
    const preview = mezzoPreviewByTarga.get(completionRecordTarga);
    const fallback = mezzi.find((mezzo) => mezzo.targa === completionRecordTarga) ?? null;
    return preview?.categoria ?? fallback?.categoria ?? null;
  }, [categoriaTecnica, completionRecordTarga, mezzoPreviewByTarga, mezzi]);
  const completionKmRequired = useMemo(
    () =>
      Boolean(
        completionModalRecord &&
          isStructuredGommeInterventoTipo(completionModalRecord.gommeInterventoTipo) &&
          requiresKmForCompletionCategory(completionCategoriaTecnica),
      ),
    [completionCategoriaTecnica, completionModalRecord],
  );
  const storicoMezzo = useMemo(
    () => storico.filter((item) => item.targa === activeTarga),
    [activeTarga, storico],
  );
  const storicoMezzoSatellitiEvento = useMemo(
    () =>
      storicoMezzo.filter((item) =>
        isSatelliteChiusoDaEvento(item as unknown as Record<string, unknown>),
      ),
    [storicoMezzo],
  );
  const storicoMezzoVisibile = useMemo(
    () =>
      storicoMezzo.filter(
        (item) => !isSatelliteChiusoDaEvento(item as unknown as Record<string, unknown>),
      ),
    [storicoMezzo],
  );
  const storicoMezzoOrdinato = useMemo(
    () =>
      [...storicoMezzoVisibile].sort(
        (left, right) =>
          getLegacyDateTimestamp(right.data || right.dataEsecuzione || right.dataProgrammata) -
          getLegacyDateTimestamp(left.data || left.dataEsecuzione || left.dataProgrammata),
      ),
    [storicoMezzoVisibile],
  );
  const materialiSuggeriti = useMemo(() => {
    const query = normalizeFreeText(materialeSearch).toUpperCase();
    if (!query) return [];
    return materialiInventario
      .filter(
        (item) =>
          item.label.toUpperCase().includes(query)
          || (item.fornitoreLabel ?? "").toUpperCase().includes(query),
      )
      .slice(0, 5);
  }, [materialeSearch, materialiInventario]);
  const lavoriApertiMezzo = lavoriInAttesaByTarga[activeTarga] ?? 0;
  const kmUltimoRifornimento = kmUltimoByTarga[activeTarga] ?? null;
  const latestRecord = storicoMezzoOrdinato[0] ?? null;
  const selectedDetailRecord = useMemo(
    () => storico.find((item) => item.id === selectedDetailRecordId) ?? null,
    [selectedDetailRecordId, storico],
  );
  useEffect(() => {
    const refs =
      selectedDetailRecord?.origineRefs && selectedDetailRecord.origineRefs.length > 0
        ? selectedDetailRecord.origineRefs
        : selectedDetailRecord?.origineRefKey &&
            selectedDetailRecord.origineRefId &&
            selectedDetailRecord.origineTipo
          ? [
              {
                tipo: selectedDetailRecord.origineTipo,
                refKey: selectedDetailRecord.origineRefKey,
                refId: selectedDetailRecord.origineRefId,
              },
            ]
          : [];
    if (refs.length === 0) {
      setOrigineInlineMap({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const next: Record<string, NextManutenzioneOrigineRecord> = {};
      for (const ref of refs) {
        try {
          const rec = await getNextManutenzioneOrigineRecord(ref.refKey, ref.refId);
          if (rec) next[`${ref.refKey}:${ref.refId}`] = rec;
        } catch {
          // Best-effort: la scheda resta apribile anche se il dettaglio inline non e' leggibile.
        }
      }
      if (!cancelled) setOrigineInlineMap(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDetailRecord]);
  const ultimiInterventi = useMemo(() => storicoMezzoOrdinato.slice(0, 5), [storicoMezzoOrdinato]);
  const manutenzioniOperative = useMemo(
    () =>
      storico.filter((item) => {
        const stato = resolveMaintenanceStato(item);
        return stato === "daFare" || stato === "programmata";
      }),
    [storico],
  );
  const manutenzioniOperativeFiltrate = useMemo(
    () =>
      [...manutenzioniOperative]
        .filter((item) => {
          const itemTarga = normalizeText(item.targa);
          if (activeTarga && itemTarga !== activeTarga) return false;
          if (daFareUrgenzaFilter !== "tutte" && resolveMaintenanceUrgenza(item) !== daFareUrgenzaFilter) {
            return false;
          }
          if (daFareOrigineFilter !== "tutte" && resolveMaintenanceOrigine(item) !== daFareOrigineFilter) {
            return false;
          }
          return true;
        })
        .sort((left, right) => {
          const priorityDelta =
            URGENZA_PRIORITY[resolveMaintenanceUrgenza(right)] -
            URGENZA_PRIORITY[resolveMaintenanceUrgenza(left)];
          if (priorityDelta !== 0) return priorityDelta;
          const rightTs = getLegacyDateTimestamp(right.dataProgrammata || right.data || right.dataEsecuzione);
          const leftTs = getLegacyDateTimestamp(left.dataProgrammata || left.data || left.dataEsecuzione);
          if (rightTs !== leftTs) return rightTs - leftTs;
          return right.id.localeCompare(left.id);
        }),
    [activeTarga, daFareOrigineFilter, daFareUrgenzaFilter, manutenzioniOperative],
  );
  const manutenzioniOperativeGrouped = useMemo<ManutenzioniOperativeGrouped>(() => {
    const gruppi: ManutenzioniDaFareGroup[] = [];
    const libere: NextManutenzioniLegacyDatasetRecord[] = [];
    const altre: NextManutenzioniLegacyDatasetRecord[] = [];

    for (const item of manutenzioniOperativeFiltrate) {
      const stato = resolveMaintenanceStato(item);
      if (stato !== "daFare") {
        altre.push(item);
        continue;
      }

      const gruppoId = normalizeFreeText(item.gruppoManutenzioneId ?? "");
      if (!gruppoId) {
        libere.push(item);
        continue;
      }

      const targaKey = normalizeText(item.targa);
      const groupKey = `${targaKey}:${gruppoId}`;
      let gruppo = gruppi.find((entry) => entry.key === groupKey);
      if (!gruppo) {
        gruppo = {
          key: groupKey,
          gruppoId,
          targa: targaKey,
          manutenzioni: [],
        };
        gruppi.push(gruppo);
      }
      gruppo.manutenzioni.push(item);
    }

    return {
      gruppi: gruppi
        .filter((gruppo) => gruppo.manutenzioni.length > 0)
        .sort((left, right) => left.key.localeCompare(right.key, "it")),
      libere,
      altre,
    };
  }, [manutenzioniOperativeFiltrate]);
  const segnalazioniEleggibili = useMemo(
    () =>
      segnalazioniAutisti
        .filter((item) => {
          if (!isNextSegnalazioneOperativa(item)) return false;
          const itemTarga = normalizeText(item.targa ?? "");
          if (activeTarga && itemTarga !== activeTarga) return false;
          return true;
        })
        .sort((left, right) => {
          const leftTarga = normalizeText(left.targa ?? "");
          const rightTarga = normalizeText(right.targa ?? "");
          if (leftTarga !== rightTarga) return leftTarga.localeCompare(rightTarga, "it");
          return (right.timestamp ?? 0) - (left.timestamp ?? 0);
        }),
    [activeTarga, segnalazioniAutisti],
  );
  const segnalazioniDaFareByTarga = useMemo<SegnalazioniDaFareTargaGroup[]>(() => {
    const byTarga = new Map<string, SegnalazioniDaFareTargaGroup>();
    for (const segnalazione of segnalazioniEleggibili) {
      const targaKey = normalizeText(segnalazione.targa ?? "");
      if (!targaKey) continue;
      let entry = byTarga.get(targaKey);
      if (!entry) {
        entry = { targa: targaKey, gruppi: [], libere: [] };
        byTarga.set(targaKey, entry);
      }
      const gruppoId = normalizeFreeText(segnalazione.gruppoSegnalazioneId ?? "");
      if (!gruppoId) {
        entry.libere.push(segnalazione);
        continue;
      }
      const groupKey = `${targaKey}:${gruppoId}`;
      let gruppo = entry.gruppi.find((item) => item.key === groupKey);
      if (!gruppo) {
        gruppo = {
          key: groupKey,
          gruppoId,
          targa: targaKey,
          segnalazioni: [],
        };
        entry.gruppi.push(gruppo);
      }
      gruppo.segnalazioni.push(segnalazione);
    }
    return Array.from(byTarga.values())
      .map((entry) => ({
        ...entry,
        gruppi: entry.gruppi
          .filter((gruppo) => gruppo.segnalazioni.length > 0)
          .sort((left, right) => left.key.localeCompare(right.key, "it")),
        libere: entry.libere.sort((left, right) => (right.timestamp ?? 0) - (left.timestamp ?? 0)),
      }))
      .sort((left, right) => left.targa.localeCompare(right.targa, "it"));
  }, [segnalazioniEleggibili]);
  const ultimeManutenzioniMezzo = useMemo(
    () => storicoMezzoOrdinato.filter((item) => item.tipo === "mezzo").slice(0, 4),
    [storicoMezzoOrdinato],
  );
  const ultimeManutenzioniMezzoSenzaUltimo = useMemo(() => {
    const ultimoRecord = ultimeManutenzioniMezzo[0] ?? null;
    if (!ultimoRecord) return [];
    return ultimeManutenzioniMezzo.filter((item) => item.id !== ultimoRecord.id);
  }, [ultimeManutenzioniMezzo]);
  const ultimeManutenzioniCompressore = useMemo(
    () => storicoMezzoOrdinato.filter((item) => item.tipo === "compressore").slice(0, 4),
    [storicoMezzoOrdinato],
  );
  const ultimeManutenzioniCompressoreSenzaUltimo = useMemo(() => {
    const ultimoRecord = ultimeManutenzioniCompressore[0] ?? null;
    if (!ultimoRecord) return [];
    return ultimeManutenzioniCompressore.filter((item) => item.id !== ultimoRecord.id);
  }, [ultimeManutenzioniCompressore]);
  const latestGommeKmCambio = useMemo(() => {
    const record = storicoMezzoOrdinato.find(
      (item) =>
        item.gommeInterventoTipo !== "straordinario" &&
        ((item.gommePerAsse?.length ?? 0) > 0 || (item.assiCoinvolti?.length ?? 0) > 0),
    );
    if (!record) return null;
    return record.gommePerAsse?.[0]?.kmCambio ?? record.km ?? null;
  }, [storicoMezzoOrdinato]);
  const gommePerAsseDraft = useMemo(
    () =>
      isUiSubtypeGommeOrdinario(uiSubtype)
        ? buildGommePerAssePayload({
            assiCoinvolti,
            data,
            km,
            isMotorizzato: categoriaMotorizzata,
          })
        : [],
    [assiCoinvolti, categoriaMotorizzata, data, km, uiSubtype],
  );
  const gommeStraordinarioDraft = useMemo(
    () =>
      isUiSubtypeGommeStraordinario(uiSubtype)
        ? buildGommeStraordinarioPayload({
            asseId: gommeStraordinarioAsseId,
            quantita: gommeStraordinarioQuantita,
            motivo: gommeStraordinarioMotivo,
          })
        : null,
    [gommeStraordinarioAsseId, gommeStraordinarioMotivo, gommeStraordinarioQuantita, uiSubtype],
  );
  const monthOptions = useMemo(() => {
    const seen = new Set<string>();
    const items: PdfPeriodFilter[] = [];
    [...storico]
      .sort(
        (left, right) =>
          getMaintenancePdfSortTimestamp(right) -
          getMaintenancePdfSortTimestamp(left),
      )
      .forEach((item) => {
        const filter = buildMonthFilterKey(getMaintenancePdfDateValue(item));
        if (!filter || seen.has(filter)) return;
        seen.add(filter);
        items.push(filter);
      });
    return items;
  }, [storico]);
  const pdfFilteredItems = useMemo(() => {
    const now = new Date();
    const lastMonthThreshold = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).getTime();

    return [...storico]
      .filter((item) => pdfSubjectType === "tutti" || item.tipo === pdfSubjectType)
      .filter((item) => {
        const itemTarga = normalizeText(item.targa);
        return !activeTarga || itemTarga === activeTarga;
      })
      .filter((item) => {
        const isOperative = isPdfOperativeMaintenance(item);
        if (pdfIncludeOperative && isOperative) return true;
        const pdfDate = getMaintenancePdfDateValue(item);
        const timestamp = getLegacyDateTimestamp(pdfDate);
        if (pdfPeriodFilter === "tutto") return true;
        if (pdfPeriodFilter === "ultimo-mese") return timestamp >= lastMonthThreshold;
        return buildMonthFilterKey(pdfDate) === pdfPeriodFilter;
      })
      .sort((left, right) => {
        const leftOperative = pdfIncludeOperative && isPdfOperativeMaintenance(left);
        const rightOperative = pdfIncludeOperative && isPdfOperativeMaintenance(right);
        if (leftOperative !== rightOperative) return rightOperative ? 1 : -1;
        const timestampDelta =
          getMaintenancePdfSortTimestamp(right) -
          getMaintenancePdfSortTimestamp(left);
        if (timestampDelta !== 0) return timestampDelta;
        return right.id.localeCompare(left.id);
      });
  }, [activeTarga, pdfIncludeOperative, pdfPeriodFilter, pdfSubjectType, storico]);
  const latestMetricByTargaAndTipo = useMemo(() => {
    const sortedItems = [...storico].sort(
      (left, right) =>
        getMaintenancePdfSortTimestamp(right) -
        getMaintenancePdfSortTimestamp(left),
    );
    const byKey = new Map<string, { km: number | null; ore: number | null }>();

    sortedItems.forEach((item) => {
      const key = `${item.tipo}:${normalizeText(item.targa)}`;
      const current = byKey.get(key) ?? { km: null, ore: null };
      if (current.km === null && item.km != null) {
        current.km = item.km;
      }
      if (current.ore === null && item.ore != null) {
        current.ore = item.ore;
      }
      byKey.set(key, current);
    });

    return byKey;
  }, [storico]);
  const pdfGroupedResults = useMemo(() => {
    const grouped = new Map<string, { subjectType: TipoVoce; targa: string; items: NextManutenzioniLegacyDatasetRecord[] }>();
    pdfFilteredItems.forEach((item) => {
      const targaKey = normalizeText(item.targa);
      const key = pdfSubjectType === "tutti" ? `${item.tipo}:${targaKey}` : targaKey;
      const current = grouped.get(key) ?? { subjectType: item.tipo, targa: targaKey, items: [] };
      current.items.push(item);
      grouped.set(key, current);
    });

    return [...grouped.values()].map(({ subjectType, targa: targaKey, items }) => {
      const maintenanceItems = items.map(mapLegacyRecordToGommeReadModel);
      const categoria = mezzoPreview.find((entry) => entry.targa === targaKey)?.categoria ?? null;
      const currentMetrics = latestMetricByTargaAndTipo.get(`${subjectType}:${targaKey}`) ?? {
        km: null,
        ore: null,
      };

      return {
        subjectType,
        targa: targaKey,
        latest: items[0],
        items,
        mezzo: mezzoPreview.find((entry) => entry.targa === targaKey) ?? null,
        total: items.length,
        currentKm: kmUltimoByTarga[targaKey] ?? null,
        currentOre: currentMetrics.ore,
        metricInfo: buildPdfMetricInfo({
          subjectType,
          latestItem: items[0],
          currentKm: kmUltimoByTarga[targaKey] ?? null,
          currentOre: currentMetrics.ore,
          categoria,
        }),
        gommePerAsse:
          subjectType === "mezzo"
            ? buildNextGommeStateByAsse({
                categoria,
                maintenanceItems,
                kmAttuali: kmUltimoByTarga[targaKey] ?? null,
              })
            : [],
        gommeStraordinarie:
          subjectType === "mezzo"
            ? buildNextGommeStraordinarieEvents({
                categoria,
                maintenanceItems,
              })
            : [],
      };
    });
  }, [kmUltimoByTarga, latestMetricByTargaAndTipo, mezzoPreview, pdfFilteredItems, pdfSubjectType]);
  const ricercaRapida = normalizeFreeText(ricercaMezzo).toUpperCase();
  const mezziSelezionabili = useMemo(() => {
    if (!ricercaRapida) return mezzi;
    return mezzi.filter((mezzo) => {
      const preview = mezzoPreviewByTarga.get(normalizeText(mezzo.targa));
      const haystack = [
        mezzo.label,
        mezzo.targa,
        mezzo.categoria,
        preview?.marcaModello,
        preview?.autistaNome,
      ]
        .filter(Boolean)
        .join(" ")
        .toUpperCase();

      return haystack.includes(ricercaRapida);
    });
  }, [mezzi, mezzoPreviewByTarga, ricercaRapida]);
  const pdfVisibleResults = useMemo(() => {
    if (!ricercaRapida) return pdfGroupedResults;
    return pdfGroupedResults.filter((result) => {
      const pageHaystack = [
        result.targa,
        result.mezzo?.marcaModello,
        result.mezzo?.label,
        result.mezzo?.autistaNome,
      ]
        .filter(Boolean)
        .join(" ")
        .toUpperCase();
      const matchesPageSearch = !ricercaRapida || pageHaystack.includes(ricercaRapida);
      return matchesPageSearch;
    });
  }, [pdfGroupedResults, ricercaRapida]);
  const pdfVisibleItems = useMemo(() => {
    const visibleKeys = new Set(pdfVisibleResults.map((result) => `${result.subjectType}:${normalizeText(result.targa)}`));
    return pdfFilteredItems.filter((item) => visibleKeys.has(`${item.tipo}:${normalizeText(item.targa)}`));
  }, [pdfFilteredItems, pdfVisibleResults]);
  const pdfVisibleSections = useMemo(
    () =>
      PDF_SUBJECT_ORDER.map((subjectType) => ({
        subjectType,
        title: PDF_SUBJECT_LABELS[subjectType].plural,
        results: pdfVisibleResults.filter((result) => result.subjectType === subjectType),
      })).filter((section) => section.results.length > 0),
    [pdfVisibleResults],
  );
  const pdfModalResult = useMemo(() => {
    if (!modalOpenForTarga) return null;
    const [subjectType, ...targaParts] = modalOpenForTarga.split(":");
    if (targaParts.length > 0 && PDF_SUBJECT_ORDER.includes(subjectType as TipoVoce)) {
      const targaKey = targaParts.join(":");
      return (
        pdfVisibleResults.find((result) => result.subjectType === subjectType && result.targa === targaKey) ??
        null
      );
    }
    return pdfVisibleResults.find((result) => result.targa === modalOpenForTarga) ?? null;
  }, [modalOpenForTarga, pdfVisibleResults]);
  const pdfModalPeriodLabel = useMemo(
    () => (pdfModalResult ? buildPdfPeriodRangeLabel(pdfModalResult.items) : "DA VERIFICARE"),
    [pdfModalResult],
  );
  const pdfModalMonthGroups = useMemo(() => {
    if (!pdfModalResult) return [];
    const grouped = new Map<string, NextManutenzioniLegacyDatasetRecord[]>();
    pdfModalResult.items.forEach((item) => {
      const parsed = parseAnyDate(getMaintenancePdfDateValue(item));
      const key = parsed ? `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}` : "senza-data";
      const current = grouped.get(key) ?? [];
      current.push(item);
      grouped.set(key, current);
    });

    return [...grouped.entries()].map(([key, items]) => {
      const [yearRaw, monthRaw] = key.split("-");
      const label =
        key !== "senza-data"
          ? toDisplay(`${yearRaw}-${monthRaw}-01`) || key
          : "Senza data";
      return {
        key,
        label: `${label} – ${items.length} ${items.length === 1 ? "manutenzione" : "manutenzioni"}`,
        items,
      };
    });
  }, [pdfModalResult]);
  const pdfModalTypeGroups = useMemo(() => {
    if (!pdfModalResult) return [];
    const grouped = new Map<string, NextManutenzioniLegacyDatasetRecord[]>();
    pdfModalResult.items.forEach((item) => {
      const key = resolvePdfMaintenanceTypeLabel(item);
      const current = grouped.get(key) ?? [];
      current.push(item);
      grouped.set(key, current);
    });

    return [...grouped.entries()].map(([label, items]) => ({
      key: label,
      label,
      icon: label.slice(0, 1).toUpperCase(),
      countLabel: `${items.length} ${items.length === 1 ? "intervento" : "interventi"}`,
      items,
    }));
  }, [pdfModalResult]);
  const contextPlaceholder = !activeTarga && !mezzoPreviewSelezionato;

  useEffect(() => {
    if (manualTargaSelectionRef.current) {
      return;
    }

    if (!requestedTarga || mezzi.length === 0) {
      return;
    }

    const matchedMezzo = mezzi.find((mezzo) => normalizeText(mezzo.targa) === requestedTarga);
    if (!matchedMezzo) {
      return;
    }

    setSelectedTarga((current) => (current === requestedTarga ? current : requestedTarga));
    setTarga((current) => (current === requestedTarga ? current : requestedTarga));
    if (requestedRecordId) {
      setView("mappa");
    } else {
      setSelectedDetailRecordId(null);
      setView("dashboard");
    }
    setNotice(null);
  }, [mezzi, requestedRecordId, requestedTarga]);

  // Apertura robusta: recordId senza targa ricava il mezzo dal record letto.
  useEffect(() => {
    if (manualTargaSelectionRef.current) {
      return;
    }

    if (!requestedRecordId || loading) {
      return;
    }

    const matchedRecord = storico.find((item) => item.id === requestedRecordId);
    if (!matchedRecord) {
      setSelectedDetailRecordId(null);
      setView("dafare");
      setNotice("Record manutenzione non trovato.");
      return;
    }

    const matchedTarga = normalizeText(matchedRecord.targa);
    setSelectedTarga((current) => (current === matchedTarga ? current : matchedTarga));
    setTarga((current) => (current === matchedTarga ? current : matchedTarga));
    setSelectedDetailRecordId((current) => (current === requestedRecordId ? current : requestedRecordId));
    setView("mappa");
    setNotice(null);
  }, [loading, requestedRecordId, storico]);

  useEffect(() => {
    if (manualTargaSelectionRef.current) {
      return;
    }

    if (!requestedTarga || !requestedRecordId) {
      return;
    }

    if (!storicoMezzoOrdinato.some((item) => item.id === requestedRecordId)) {
      return;
    }

    setSelectedDetailRecordId((current) => (current === requestedRecordId ? current : requestedRecordId));
    setView("mappa");
    setNotice(null);
  }, [requestedRecordId, requestedTarga, storicoMezzoOrdinato]);

  useEffect(() => {
    if (modalOpenForTarga && !pdfModalResult) {
      setModalOpenForTarga(null);
      setPdfModalLayout("data");
    }
  }, [modalOpenForTarga, pdfModalResult]);

  useEffect(() => {
    if (!modalOpenForTarga) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalOpenForTarga(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpenForTarga]);

  useEffect(() => {
    const validAssi = new Set(assiDisponibili.map((asse) => asse.id));
    setAssiCoinvolti((current) => {
      const next = current.filter((asseId) => validAssi.has(asseId));
      return next.length === current.length ? current : next;
    });
  }, [assiDisponibili]);

  useEffect(() => {
    if (!selectedDetailRecordId) return;
    if (!storicoMezzoOrdinato.some((item) => item.id === selectedDetailRecordId)) {
      setSelectedDetailRecordId(null);
    }
  }, [selectedDetailRecordId, storicoMezzoOrdinato]);

  function handleSelectContextTarga(value: string) {
    const normalized = normalizeText(value);
    manualTargaSelectionRef.current = true;
    setSelectedTarga(normalized);
    setTarga(normalized);
    setNotice(null);
  }

  function openDetailForRecord(item: NextManutenzioniLegacyDatasetRecord) {
    const normalized = normalizeText(item.targa);
    setSelectedTarga(normalized);
    setTarga(normalized);
    setSelectedDetailRecordId(item.id);
    setNotice(null);
    setView("mappa");
  }

  async function handleOpenOrigineRef(origineRefKey: string | null | undefined, origineRefId: string | null | undefined) {
    if (!origineRefKey || !origineRefId) return;
    try {
      setOrigineModalLoading(true);
      setOrigineModalError(null);
      const record = await getNextManutenzioneOrigineRecord(origineRefKey, origineRefId);
      if (!record) {
        setOrigineModalRecord(null);
        setOrigineModalError("Origine non trovata.");
        return;
      }
      setOrigineModalRecord(record);
    } catch (error) {
      console.error("Errore lettura origine manutenzione:", error);
      setOrigineModalRecord(null);
      setOrigineModalError("Lettura origine non riuscita.");
    } finally {
      setOrigineModalLoading(false);
    }
  }

  async function handleRiapriOrigineSegnalazione(origineRefId: string | null | undefined) {
    const segnalazioneId = normalizeText(origineRefId ?? "");
    if (!segnalazioneId) {
      setNotice("ID segnalazione origine mancante.");
      return;
    }
    const confirmed = window.confirm(
      "Riaprire questa segnalazione e sganciarla dalle manutenzioni collegate?",
    );
    if (!confirmed) return;
    try {
      setSaving(true);
      setNotice(null);
      const result = await riapriESganciaSegnalazione(segnalazioneId);
      await refreshData();
      if (!result.ok) {
        setNotice(result.error || "Segnalazione riaperta con esito parziale.");
        return;
      }
      setNotice("Segnalazione riaperta e sganciata.");
    } catch (error) {
      console.error("Errore riapertura segnalazione origine:", error);
      setNotice("Errore riapertura segnalazione.");
    } finally {
      setSaving(false);
    }
  }

  function renderPdfRows(args: {
    subjectType: TipoVoce;
    items: NextManutenzioniLegacyDatasetRecord[];
    currentKm: number | null;
    currentOre: number | null;
    categoria?: string | null;
    showType: boolean;
    showSupplier: boolean;
    showActions?: boolean;
    variant: "list" | "modal";
  }) {
    const dateClass = args.variant === "list" ? "man2-pdf-list__date" : "man2-pdf-modal__date";
    const metricClass = args.variant === "list" ? "man2-pdf-list__metric" : "man2-pdf-modal__metric";
    const deltaClass = args.variant === "list" ? "man2-pdf-list__delta" : "man2-pdf-modal__delta";
    const descClass = args.variant === "list" ? "man2-pdf-list__desc" : "man2-pdf-modal__desc";

    return args.items.map((item) => {
      const rowMetricInfo = buildPdfMetricInfo({
        subjectType: args.subjectType,
        latestItem: item,
        currentKm: args.currentKm,
        currentOre: args.currentOre,
        categoria: args.categoria,
      });

      return (
        <tr key={`${item.id}-${args.variant}-${args.showSupplier ? "supplier" : "compact"}`}>
          <td className={dateClass}>{formatMaintenancePdfDateLabel(item)}</td>
          <td>
            <span className="man2-pdf-list__pill">{formatMaintenanceStatoLabelDisplay(item)}</span>
          </td>
          <td className={metricClass}>{buildPdfTableMetricValue(item, args.categoria)}</td>
          <td className={deltaClass}>{rowMetricInfo?.deltaValue ?? "—"}</td>
          {args.showType ? (
            <td>
              <span className="man2-pdf-list__pill">{resolvePdfMaintenanceTypeLabel(item)}</span>
            </td>
          ) : null}
          <td className={descClass}>{buildPdfDescrizione(item) || "—"}</td>
          {args.showSupplier ? <td>{item.fornitore || "—"}</td> : null}
          {args.showActions ? (
            <td className="man2-pdf-row__delete-cell">
              <button
                type="button"
                className="man2-btn man2-btn--danger"
                onClick={() => setPdfDeleteCandidate(item)}
                aria-label={`Elimina manutenzione ${item.descrizione}`}
              >
                Elimina
              </button>
            </td>
          ) : null}
        </tr>
      );
    });
  }

  function resetForm(nextTarga?: string) {
    const currentTarga = nextTarga ?? activeTarga;
    setTipo("mezzo");
    setUiSubtype("altro");
    setFornitore("");
    setKm("");
    setOre("");
    setSottotipo("motrice");
    setDescrizione("");
    setEseguito("");
    setNoteEsecuzione("");
    setDraftSegnalatoDa("");
    setData(todayLabel());
    setImporto("");
    setCreateAsDaFare(true);
    setDraftUrgenza("media");
    setMaterialeSearch("");
    setMaterialiTemp([]);
    setAssiCoinvolti([]);
    setGommeStraordinarioMotivo("");
    setGommeStraordinarioAsseId("");
    setGommeStraordinarioQuantita("");
    setQuantitaTemp("");
    setEditingId(null);
    setCompletionRecordId(null);
    setCompletionModalRecord(null);
    setCompletionDraftFornitore("");
    setCompletionDraftData(todayLabel());
    setCompletionDraftKm("");
    setTarga(currentTarga);
  }

  function handleAddMateriale(
    label: string,
    quantitaValue: number,
    unitaValue: string,
    fromInventario: boolean,
    refId?: string,
  ) {
    if (!label.trim() || !quantitaValue) {
      window.alert("Inserisci almeno nome materiale e quantita.");
      return;
    }

    const nuovo: MaterialeManutenzione = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: label.trim().toUpperCase(),
      quantita: quantitaValue,
      unita: unitaValue || "pz",
      fromInventario,
      ...(refId ? { refId } : {}),
    };

    setMaterialiTemp((current) => [...current, nuovo]);
    setMaterialeSearch("");
    setQuantitaTemp("");
  }

  function handleRemoveMateriale(id: string) {
    setMaterialiTemp((current) => current.filter((item) => item.id !== id));
  }

  function loadEditState(item: NextManutenzioniLegacyDatasetRecord) {
    setEditingId(item.id);
    setCompletionRecordId(null);
    setSelectedTarga(item.targa);
    setSelectedDetailRecordId(item.id);
    setTarga(item.targa);
    setTipo(item.tipo);
    setFornitore(item.fornitore ?? "");
    setKm(item.km != null ? String(item.km) : "");
    setOre(item.ore != null ? String(item.ore) : "");
    setSottotipo(item.sottotipo ?? "motrice");
    setUiSubtype(deriveUiSubtype(item));
    setDescrizione(item.descrizione);
    setEseguito(item.eseguito ?? "");
    setNoteEsecuzione(item.noteEsecuzione ?? "");
    setDraftSegnalatoDa(item.segnalatoDa ?? "");
    setData(item.data);
    setImporto(item.importo != null ? String(item.importo) : "");
    setCreateAsDaFare(false);
    setDraftUrgenza(item.urgenza ?? "media");
    setMaterialiTemp(toMaterialiTemp(item.materiali));
    setAssiCoinvolti(
      normalizeNextAssiCoinvolti(
        item.gommeInterventoTipo !== "straordinario" && item.gommePerAsse?.length
          ? item.gommePerAsse.map((entry) => entry.asseId)
          : item.assiCoinvolti,
      ),
    );
    setGommeStraordinarioMotivo(item.gommeStraordinario?.motivo ?? "");
    setGommeStraordinarioAsseId(item.gommeStraordinario?.asseId ?? "");
    setGommeStraordinarioQuantita(
      item.gommeStraordinario?.quantita != null ? String(item.gommeStraordinario.quantita) : "",
    );
  }

  function handleEdit(item: NextManutenzioniLegacyDatasetRecord) {
    loadEditState(item);
    setView("form");
    setNotice("Modifica caricata dal dataset reale.");
  }

  function handleCompleteDaFare(item: NextManutenzioniLegacyDatasetRecord) {
    loadEditState(item);
    setCompletionRecordId(item.id);
    setCompletionModalRecord(item);
    setCompletionDraftFornitore(item.fornitore ?? "");
    setCompletionDraftData(todayLabel());
    setCompletionDraftKm(item.km != null ? String(item.km) : "");
    setEseguito(item.eseguitoDa ?? item.eseguito ?? "");
    setNotice(null);
  }

  function closeCompletionModal() {
    const nextTarga = completionModalRecord?.targa ?? activeTarga;
    resetForm(nextTarga);
    setCompletionModalRecord(null);
  }

  async function handleConfirmCompletionModal() {
    if (!completionModalRecord) return;
    await handleSave({
      completionFornitore: completionDraftFornitore,
      completionData: completionDraftData,
      completionKm: completionDraftKm,
    });
  }

  async function handleDelete(record: Pick<NextManutenzioniLegacyDatasetRecord, "id">): Promise<void> {
    const recordId = String(record.id ?? "").trim();
    if (!recordId) {
      setError("Eliminazione manutenzione non riuscita: record non valido.");
      return;
    }

    const confirmed = window.confirm(
      "Eliminare questa manutenzione?\n\n"
      + "Questa operazione e' IRREVERSIBILE.\n"
      + "I materiali scaricati torneranno in inventario e le consegne collegate verranno rimosse.",
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      setError(null);
      setNotice(null);
      const ok = await deleteNextManutenzioneBusinessRecord(recordId);
      if (!ok) {
        throw new Error("Delete manutenzione fallita.");
      }
      setSelectedDetailRecordId(null);
      await refreshData();
      setNotice("Manutenzione eliminata dal dataset reale.");
    } catch (deleteError) {
      console.error("Errore eliminazione manutenzione:", deleteError);
      setError("Eliminazione manutenzione non riuscita.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmPdfDelete(): Promise<void> {
    const record = pdfDeleteCandidate;
    if (!record) return;
    const recordId = String(record.id ?? "").trim();
    try {
      setPdfDeleteBusy(true);
      setError(null);
      setNotice(null);
      const ok = await deleteNextManutenzioneBusinessRecord(recordId, {
        targa: record.targa ?? null,
        data: record.data ?? null,
        descrizione: record.descrizione ?? null,
        stato: record.stato ?? null,
      });
      if (!ok) {
        setError("Eliminazione manutenzione non riuscita: record non trovato nel dataset.");
        return;
      }
      setPdfDeleteCandidate(null);
      setSelectedDetailRecordId(null);
      await refreshData();
      setNotice("Manutenzione eliminata dal dataset reale.");
    } catch (deleteError) {
      console.error("Errore eliminazione manutenzione dal Quadro:", deleteError);
      setError("Eliminazione manutenzione non riuscita.");
    } finally {
      setPdfDeleteBusy(false);
    }
  }

  function getManutenzioneAggancioTimestamp(record: NextManutenzioniLegacyDatasetRecord): number {
    return getDataRiferimentoRecord(record as unknown as Record<string, unknown>);
  }

  async function handleConfirmAggancioManutenzione(evento: EventoCompatibile): Promise<void> {
    const record = aggancioManutenzioneRecord;
    if (!record) return;
    try {
      setAggancioManutenzioneBusy(true);
      setError(null);
      setNotice(null);
      const result = await chiudiManutenzioneDaEvento(record.id, "gomme_evento", evento.id, undefined, {
        targa: (record as { targa?: string | null }).targa ?? null,
        data: (record as { data?: string | null }).data ?? null,
        descrizione: (record as { descrizione?: string | null }).descrizione ?? null,
        stato: (record as { stato?: string | null }).stato ?? null,
      });
      if (!result.ok) {
        throw new Error(result.error || "Aggancio evento non riuscito.");
      }
      setAggancioManutenzioneRecord(null);
      await refreshData();
      setSelectedDetailRecordId(record.id);
      setNotice("Manutenzione chiusa collegandola al cambio gomme selezionato.");
    } catch (aggancioError) {
      console.error("Errore aggancio evento manutenzione:", aggancioError);
      setError("Aggancio evento non riuscito.");
    } finally {
      setAggancioManutenzioneBusy(false);
    }
  }

  async function handleSganciaManutenzione(record: Pick<NextManutenzioniLegacyDatasetRecord, "id">): Promise<void> {
    const recordId = String(record.id ?? "").trim();
    if (!recordId) return;
    if (!window.confirm("Sganciare il cambio gomme collegato e riaprire la manutenzione come da fare?")) {
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setNotice(null);
      const result = await sganciaManutenzioneDaEvento(recordId, "daFare");
      if (!result.ok) {
        throw new Error(result.error || "Sgancio evento non riuscito.");
      }
      await refreshData();
      setSelectedDetailRecordId(recordId);
      setNotice("Evento sganciato. La manutenzione e' tornata da fare.");
    } catch (sgancioError) {
      console.error("Errore sgancio evento manutenzione:", sgancioError);
      setError("Sgancio evento non riuscito.");
    } finally {
      setSaving(false);
    }
  }

  function handleUiSubtypeChange(nextSubtype: InterventoUiSubtype) {
    setUiSubtype(nextSubtype);
    if (nextSubtype === "tagliando completo" && !descrizione.trim()) {
      setDescrizione("TAGLIANDO - ");
    }
    if (!isUiSubtypeGommeOrdinario(nextSubtype)) {
      setAssiCoinvolti([]);
    }
    if (!isUiSubtypeGommeStraordinario(nextSubtype)) {
      setGommeStraordinarioMotivo("");
      setGommeStraordinarioAsseId("");
      setGommeStraordinarioQuantita("");
    }
  }

  function toggleAsseCoinvolto(asseId: AsseCoinvoltoId) {
    setAssiCoinvolti((current) =>
      current.includes(asseId)
        ? current.filter((entry) => entry !== asseId)
        : [...current, asseId],
    );
  }

  async function handleSave(overrides: CompletionSaveOverrides = {}) {
    const normalizedTarga = normalizeText(targa);
    const normalizedDescrizione = normalizeFreeText(descrizione);
    const sourceRecord = editingId ? storico.find((item) => item.id === editingId) ?? null : null;
    const isCompletionSave = Boolean(completionRecordId && completionRecordId === editingId);
    const effectiveFornitore =
      isCompletionSave && overrides.completionFornitore !== undefined ? overrides.completionFornitore : fornitore;
    const effectiveDataInput =
      isCompletionSave && overrides.completionData !== undefined ? overrides.completionData : data;
    const effectiveKmInput = isCompletionSave && overrides.completionKm !== undefined ? overrides.completionKm : km;
    const normalizedData = toISO(effectiveDataInput) ?? fromUserInput(effectiveDataInput);
    const normalizedImporto = parseImportoInput(importo);
    const isCompletionGomme = isCompletionSave && isStructuredGommeInterventoTipo(sourceRecord?.gommeInterventoTipo);
    const completionRequiresKm =
      isCompletionGomme && requiresKmForCompletionCategory(completionCategoriaTecnica ?? categoriaTecnica);
    const effectiveKmNumber = parseNullableNumberInput(effectiveKmInput);
    const effectiveGommePerAsseDraft =
      isCompletionSave && isUiSubtypeGommeOrdinario(uiSubtype)
        ? buildGommePerAssePayload({
            assiCoinvolti,
            data: effectiveDataInput,
            km: effectiveKmInput,
            isMotorizzato: requiresKmForCompletionCategory(completionCategoriaTecnica ?? categoriaTecnica),
          })
        : gommePerAsseDraft;
    const selectedStato: NextManutenzioneStato = sourceRecord
      ? isCompletionSave
        ? "eseguita"
        : sourceRecord.stato ?? "daFare"
      : createAsDaFare
        ? "daFare"
        : "eseguita";

    if (!normalizedTarga || !normalizedDescrizione || !normalizedData) {
      window.alert("Compila almeno TARGA, DESCRIZIONE e DATA nel formato GG/MM/AAAA.");
      return;
    }

    if (importo.trim() && normalizedImporto === null) {
      window.alert("Inserisci un importo valido.");
      return;
    }

    if (isCompletionSave && completionRequiresKm && effectiveKmNumber === null) {
      window.alert("Per completare un intervento gomme su motrice o trattore devi inserire i KM.");
      return;
    }

    if (!isCompletionSave && !createAsDaFare && tipo === "mezzo" && categoriaMotorizzata && !km) {
      const confirmed = window.confirm("Non hai inserito i KM. Vuoi continuare lo stesso?");
      if (!confirmed) return;
    }

    if (!isCompletionSave && !createAsDaFare && tipo !== "mezzo" && !ore) {
      const confirmed = window.confirm("Non hai inserito le ORE. Vuoi continuare lo stesso?");
      if (!confirmed) return;
    }

    if (!isCompletionSave && !createAsDaFare && isUiSubtypeGommeOrdinario(uiSubtype) && assiCoinvolti.length === 0) {
      window.alert("Per il cambio gomme ordinario devi selezionare almeno un asse.");
      return;
    }

    if (!isCompletionSave && !createAsDaFare && isUiSubtypeGommeStraordinario(uiSubtype) && !normalizeFreeText(gommeStraordinarioMotivo)) {
      window.alert("Per l'evento gomme straordinario seleziona un motivo esplicito.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setNotice(null);
      const wasEditing = Boolean(editingId);
      const activeTargaBeforeSave = activeTarga;
      const savedRecord = await saveNextManutenzioneBusinessRecord({
        editingSourceId: editingId,
        editingSourceFingerprint: sourceRecord
          ? {
              targa: sourceRecord.targa ?? null,
              data: sourceRecord.data ?? null,
              descrizione: sourceRecord.descrizione ?? null,
              stato: sourceRecord.stato ?? null,
            }
          : null,
        targa: normalizedTarga,
        tipo,
        fornitore: !sourceRecord && createAsDaFare ? null : normalizeFreeText(effectiveFornitore) || null,
        km: effectiveKmInput ? Number(effectiveKmInput) : null,
        ore: ore ? Number(ore) : null,
        sottotipo: tipo === "compressore" ? sottotipo : null,
        descrizione: normalizedDescrizione,
        eseguito: normalizeFreeText(eseguito) || null,
        noteEsecuzione: normalizeFreeText(noteEsecuzione) || null,
        data: normalizedData,
        stato: selectedStato,
        importo: normalizedImporto,
        materiali: createAsDaFare ? [] : materialiTemp,
        assiCoinvolti: isUiSubtypeGommeOrdinario(uiSubtype) ? assiCoinvolti : [],
        gommePerAsse: isUiSubtypeGommeOrdinario(uiSubtype) ? effectiveGommePerAsseDraft : [],
        gommeInterventoTipo: isUiSubtypeGomme(uiSubtype)
          ? isUiSubtypeGommeStraordinario(uiSubtype)
            ? "straordinario"
            : "ordinario"
          : null,
        gommeStraordinario: isUiSubtypeGommeStraordinario(uiSubtype) ? gommeStraordinarioDraft : null,
        ...(sourceRecord
          ? {
              // Per le manutenzioni ESEGUITE la data di esecuzione deve seguire
              // SEMPRE `data` (sia in completamento che in modifica), altrimenti i
              // due campi divergono e dashboard/dettaglio mostrano date diverse.
              dataEsecuzione:
                isCompletionSave || selectedStato === "eseguita" ? normalizedData : sourceRecord.dataEsecuzione ?? null,
              dataProgrammata: sourceRecord.dataProgrammata ?? null,
              origineTipo: sourceRecord.origineTipo ?? null,
              origineRefId: sourceRecord.origineRefId ?? null,
              origineRefKey: sourceRecord.origineRefKey ?? null,
              segnalatoDa: sourceRecord.segnalatoDa ?? null,
              eseguitoDa: isCompletionSave
                ? normalizeFreeText(effectiveFornitore) || null
                : sourceRecord.eseguitoDa ?? null,
              urgenza: sourceRecord.urgenza ?? null,
              sourceDocumentId: sourceRecord.sourceDocumentId ?? null,
            }
          : {}),
        ...(createAsDaFare && !sourceRecord
          ? {
              eseguito: null,
              dataEsecuzione: null,
              dataProgrammata: null,
              origineTipo: "manuale" as const,
              origineRefId: null,
              origineRefKey: null,
              segnalatoDa: normalizeFreeText(draftSegnalatoDa) || null,
              eseguitoDa: null,
              urgenza: draftUrgenza,
            }
          : {}),
      });
      await refreshData();

      // Fase B: se richiesto, registra questa esecuzione sulla scadenza collegata
      // (ultima esecuzione = data/km dell'intervento) e ricalcola la prossima.
      let scadenzaAggiornata = false;
      if (selectedStato === "eseguita" && selectedScadenzaId) {
        const scad = scadenzeAll.find((s) => s.id === selectedScadenzaId);
        if (scad) {
          const rec = scad.record;
          try {
            await saveScadenzaManutenzione({
              id: rec.id,
              targa: rec.targa,
              tipo: rec.tipo,
              label: rec.label,
              base: rec.base,
              intervalloMesi: rec.intervalloMesi ?? null,
              intervalloKm: rec.intervalloKm ?? null,
              intervalloOre: rec.intervalloOre ?? null,
              ultimaEsecuzioneData: rec.base.includes("tempo") ? normalizedData : rec.ultimaEsecuzioneData ?? null,
              ultimaEsecuzioneKm:
                rec.base.includes("km") && effectiveKmNumber != null
                  ? effectiveKmNumber
                  : rec.ultimaEsecuzioneKm ?? null,
              ultimaEsecuzioneOre: rec.base.includes("ore") && ore ? Number(ore) : rec.ultimaEsecuzioneOre ?? null,
              prossimaScadenzaDataManuale: null,
              prossimaScadenzaKmManuale: null,
              prossimaScadenzaOreManuale: null,
              note: rec.note ?? null,
              attiva: rec.attiva,
            });
            await reloadScadenze();
            scadenzaAggiornata = true;
          } catch (scadErr) {
            console.error("Errore aggiornamento scadenza collegata:", scadErr);
          }
        }
      }
      setSelectedScadenzaId("");

      setSelectedDetailRecordId(savedRecord.id);
      resetForm(activeTargaBeforeSave);
      setCompletionModalRecord(null);
      setCompletionDraftFornitore("");
      setCompletionDraftData(todayLabel());
      setCompletionDraftKm("");
      setView(isCompletionSave ? "mappa" : createAsDaFare ? "dafare" : "dashboard");
      const baseNotice = isCompletionSave
        ? "Manutenzione completata e marcata come eseguita."
        : createAsDaFare
          ? "Manutenzione da fare creata."
          : wasEditing
            ? "Manutenzione aggiornata in modo compatibile con il legacy."
            : "Manutenzione salvata in modo compatibile con il legacy.";
      setNotice(scadenzaAggiornata ? `${baseNotice} Scadenza del mezzo aggiornata.` : baseNotice);
    } catch (saveError) {
      console.error("Errore salvataggio manutenzione:", saveError);
      setError("Salvataggio manutenzione non riuscito.");
    } finally {
      setSaving(false);
    }
  }

  async function exportPdfForItems(items: NextManutenzioniLegacyDatasetRecord[], title: string) {
    if (!items.length) {
      window.alert("Non ci sono manutenzioni da esportare.");
      return;
    }

    const { default: JsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new JsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const docWithTable = doc as typeof doc & PdfDocWithPlugins & { lastAutoTable?: { finalY?: number } };
    const fontReady = await ensurePdfUnicodeFont(docWithTable);
    const pdfBodyFont = fontReady ? PDF_UNICODE_FONT_FAMILY : "helvetica";
    const setPdfFont = (style: "normal" | "bold" = "normal") => {
      doc.setFont(fontReady ? PDF_UNICODE_FONT_FAMILY : "helvetica", style);
    };
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const topMargin = 24;
    const bottomMargin = 14;
    const uniqueTarghe = Array.from(new Set(items.map((item) => normalizeText(item.targa)).filter(Boolean)));
    const orderedTarghe = [...uniqueTarghe].sort((left, right) => left.localeCompare(right, "it"));
    const singleTarga = pdfSubjectType !== "tutti" && orderedTarghe.length === 1 ? orderedTarghe[0] : null;
    const periodLabel = buildPdfPeriodRangeLabel(items);
    const generatedLabel = formatPdfGenerationDate();
    const misuraColumnLabel = resolvePdfMetricColumnLabel(items);
    const pdfOriginNotes = {
      ...pdfOriginNotesById,
      ...(await resolvePdfOriginNotesForItems(items)),
    };
    const fileName = buildPdfFileName(title);
    let y = topMargin;

    const buildPdfExportGroup = (subjectType: TipoVoce, targaKey: string) => {
      const groupedRecords = items
        .filter((item) => item.tipo === subjectType && normalizeText(item.targa) === targaKey)
        .sort((left, right) => {
          const leftOperative = pdfIncludeOperative && isPdfOperativeMaintenance(left);
          const rightOperative = pdfIncludeOperative && isPdfOperativeMaintenance(right);
          if (leftOperative !== rightOperative) return rightOperative ? 1 : -1;
          const timestampDelta =
            getMaintenancePdfSortTimestamp(right) - getMaintenancePdfSortTimestamp(left);
          if (timestampDelta !== 0) return timestampDelta;
          return right.id.localeCompare(left.id);
        });
      const closedByExternalRecords = groupedRecords.filter(isPdfClosedByExternalEvent);
      const visibleRecords = groupedRecords.filter((item) => !isPdfClosedByExternalEvent(item));
      const currentMetrics = latestMetricByTargaAndTipo.get(`${subjectType}:${targaKey}`) ?? {
        km: null,
        ore: null,
      };

      return {
        subjectType,
        targa: targaKey,
        items: visibleRecords,
        closedByExternalItems: closedByExternalRecords,
        latest: visibleRecords[0] ?? groupedRecords[0] ?? null,
        mezzo: mezzoPreviewByTarga.get(targaKey) ?? null,
        currentKm: kmUltimoByTarga[targaKey] ?? null,
        currentOre: currentMetrics.ore,
      };
    };

    const groupedItems =
      pdfSubjectType === "tutti"
        ? PDF_SUBJECT_ORDER.flatMap((subjectType) => {
            const subjectTarghe = Array.from(
              new Set(
                items
                  .filter((item) => item.tipo === subjectType)
                  .map((item) => normalizeText(item.targa))
                  .filter(Boolean),
              ),
            ).sort((left, right) => left.localeCompare(right, "it"));
            return subjectTarghe.map((targaKey) => buildPdfExportGroup(subjectType, targaKey));
          })
        : orderedTarghe.map((targaKey) => buildPdfExportGroup(pdfSubjectType, targaKey));

    const photoDataByTarga = new Map(
      await Promise.all(
        groupedItems.map(async (group) => [
          group.targa,
          group.mezzo?.fotoUrl ? await loadPdfImageData(group.mezzo.fotoUrl) : null,
        ] as const),
      ),
    );

    const decoratePages = (titleLabel: string) => {
      const totalPages = doc.getNumberOfPages();
      for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
        doc.setPage(pageIndex);
        setPdfFont("bold");
        doc.setFontSize(11);
        doc.setTextColor(26, 26, 26);
        doc.text(toPdfText(`${titleLabel} – Periodo: ${periodLabel}`, fontReady), margin, 10);

        setPdfFont("normal");
        doc.setFontSize(8.5);
        doc.setTextColor(107, 114, 128);
        doc.text(toPdfText(`Generato il ${generatedLabel}`, fontReady), pageWidth - margin, 10, {
          align: "right",
        });
        doc.setDrawColor(26, 26, 26);
        doc.setLineWidth(0.35);
        doc.line(margin, 14, pageWidth - margin, 14);
        doc.text(toPdfText(`Pagina ${pageIndex} di ${totalPages}`, fontReady), pageWidth - margin, pageHeight - 6, {
          align: "right",
        });
      }
    };

    const checkPage = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - bottomMargin) {
        doc.addPage();
        y = topMargin;
      }
    };

    const setPdfHeaderBlackFill = () => {
      doc.setFillColor(...PDF_HEADER_BLACK_RGB);
    };

    const drawPdfContainedImage = (args: {
      photoData: PdfImageData;
      boxX: number;
      boxY: number;
      boxW: number;
      boxH: number;
      radius: number;
      borderLineWidth: number;
    }) => {
      const placement = calculatePdfContainPlacement({
        boxX: args.boxX,
        boxY: args.boxY,
        boxW: args.boxW,
        boxH: args.boxH,
        imgW: args.photoData.widthPx,
        imgH: args.photoData.heightPx,
      });

      setPdfHeaderBlackFill();
      doc.rect(args.boxX, args.boxY, args.boxW, args.boxH, "F");
      doc.addImage(
        args.photoData.dataUrl,
        args.photoData.format,
        placement.drawX,
        placement.drawY,
        placement.drawW,
        placement.drawH,
        undefined,
        PDF_IMAGE_COMPRESSION,
      );
      doc.setDrawColor(201, 168, 106);
      doc.setLineWidth(args.borderLineWidth);
      doc.roundedRect(args.boxX, args.boxY, args.boxW, args.boxH, args.radius, args.radius);
    };

    const renderClosedByExternalTable = (
      closedItems: NextManutenzioniLegacyDatasetRecord[],
      notesById: PdfOriginNotesById,
    ) => {
      if (closedItems.length === 0) return;
      checkPage(22);
      setPdfFont("bold");
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.text(toPdfText("Manutenzioni risolte tramite eventi esterni", fontReady), margin, y);
      y += 4;

      autoTable(doc as Parameters<typeof autoTable>[0], {
        startY: y,
        margin: { left: margin, right: margin, top: topMargin, bottom: bottomMargin },
        head: [[
          toPdfText("Data origine", fontReady),
          toPdfText("Data chiusura", fontReady),
          toPdfText("Descrizione", fontReady),
          toPdfText("Risolto da", fontReady),
        ]],
        body: closedItems.map((item) => [
          toPdfText(buildPdfClosedExternalOriginLabel(item, notesById), fontReady),
          toPdfText(formatPdfChiusuraDateLabel(item), fontReady),
          toPdfText(
            `${buildPdfDescrizione(item)}\n${buildFraseStoria(
              recordChiusoFromRaw(item as unknown as Record<string, unknown>, undefined, {
                sourceRecords: resolveSourceRecordsForItem(item as unknown as Record<string, unknown>),
              }),
            )}`,
            fontReady,
          ),
          toPdfText(buildChiusuraDaEventoTitle(item) ?? "Evento esterno", fontReady),
        ]),
        styles: {
          font: pdfBodyFont,
          fontSize: 8,
          cellPadding: 2.4,
          lineColor: [229, 231, 235],
          lineWidth: 0.1,
          overflow: "linebreak",
          valign: "middle",
        },
        headStyles: {
          font: pdfBodyFont,
          fillColor: [75, 85, 99],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        bodyStyles: {
          font: pdfBodyFont,
          textColor: [37, 35, 32],
        },
        columnStyles: {
          0: { cellWidth: 48 },
          1: { cellWidth: 38 },
          2: { cellWidth: 126 },
          3: { cellWidth: 54 },
        },
        rowPageBreak: "avoid",
      });

      y = (docWithTable.lastAutoTable?.finalY ?? y) + 8;
    };

    const pageContentHeight = pageHeight - topMargin - bottomMargin;
    const estimateTextLineCount = (value: string, maxWidth: number) => {
      setPdfFont("normal");
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(toPdfText(value || "—", fontReady), maxWidth);
      return Array.isArray(lines) ? Math.max(1, lines.length) : 1;
    };
    const estimateMainPdfRowHeight = (item: NextManutenzioniLegacyDatasetRecord) => {
      const descriptionLines = estimateTextLineCount(buildPdfDescrizioneWithOrigin(item, pdfOriginNotes), 98);
      return Math.max(8.4, descriptionLines * 3.4 + 5.2);
    };
    const estimateExternalPdfRowHeight = (item: NextManutenzioniLegacyDatasetRecord) => {
      const description = `${buildPdfDescrizione(item)}\n${buildFraseStoria(
        recordChiusoFromRaw(item as unknown as Record<string, unknown>, undefined, {
          sourceRecords: resolveSourceRecordsForItem(item as unknown as Record<string, unknown>),
        }),
      )}`;
      const descriptionLines = estimateTextLineCount(description, 122);
      return Math.max(8.4, descriptionLines * 3.4 + 5.2);
    };
    const estimatePdfGroupTableHeight = (group: (typeof groupedItems)[number]) =>
      9 + group.items.reduce((total, item) => total + estimateMainPdfRowHeight(item), 0);
    const estimateClosedByExternalTableHeight = (closedItems: NextManutenzioniLegacyDatasetRecord[]) => {
      if (closedItems.length === 0) return 0;
      return 4 + 9 + closedItems.reduce((total, item) => total + estimateExternalPdfRowHeight(item), 0) + 8;
    };
    const estimatePdfGroupHeaderHeight = (group: (typeof groupedItems)[number]) =>
      photoDataByTarga.get(group.targa) ? 24 : 18;
    const estimatePdfGroupBlockHeight = (group: (typeof groupedItems)[number]) =>
      estimatePdfGroupHeaderHeight(group) +
      4 +
      estimatePdfGroupTableHeight(group) +
      10 +
      estimateClosedByExternalTableHeight(group.closedByExternalItems);
    const estimatePdfGroupAnchorHeight = (group: (typeof groupedItems)[number]) =>
      estimatePdfGroupHeaderHeight(group) +
      4 +
      9 +
      (group.items[0] ? estimateMainPdfRowHeight(group.items[0]) : 8.4);
    const ensurePdfGroupStartsTogether = (group: (typeof groupedItems)[number]) => {
      const blockHeight = estimatePdfGroupBlockHeight(group);
      const neededHeight =
        blockHeight <= pageContentHeight ? blockHeight : estimatePdfGroupAnchorHeight(group);
      checkPage(neededHeight);
    };
    const ensurePdfSectionTitleWithFirstGroup = (group: (typeof groupedItems)[number]) => {
      const sectionTitleHeight = 7;
      const blockHeight = estimatePdfGroupBlockHeight(group);
      const firstGroupHeight =
        blockHeight <= pageContentHeight ? blockHeight : estimatePdfGroupAnchorHeight(group);
      checkPage(sectionTitleHeight + firstGroupHeight);
    };

    if (singleTarga) {
      const group = groupedItems[0];
      if (group) {
        ensurePdfGroupStartsTogether(group);
      }
      const mezzoPdf = group?.mezzo ?? null;
      const photoData = photoDataByTarga.get(singleTarga) ?? null;
      const metricInfo =
        group?.latest
              ? buildPdfMetricInfo({
                  subjectType: group.subjectType,
                  latestItem: group.latest,
                  currentKm: group.currentKm,
                  currentOre: group.currentOre,
                  categoria: group.mezzo?.categoria ?? null,
                })
          : null;

      checkPage(photoData ? 54 : 48);
      const heroTop = y;
      const heroHeight = photoData ? 50 : 44;
      const heroWidth = pageWidth - margin * 2;
      const heroRight = margin + heroWidth;
      setPdfHeaderBlackFill();
      doc.roundedRect(margin, heroTop, heroWidth, heroHeight, 4, 4, "F");
      doc.setFillColor(201, 168, 106);
      doc.rect(margin, heroTop, 4, heroHeight, "F");

      let titleStartX = margin + 10;
      if (photoData) {
        drawPdfContainedImage({
          photoData,
          boxX: margin + 8,
          boxY: heroTop + 8,
          boxW: 42,
          boxH: 31.5,
          radius: 2,
          borderLineWidth: 0.7,
        });
        titleStartX = margin + 56;
      }

      const heroInnerRight = heroRight - 10;
      const statsGap = 8;
      const titleGap = 10;
      const minStatsAreaWidth = photoData ? 112 : 120;
      const availableHeroTextWidth = heroInnerRight - titleStartX;
      const titleBlockWidth = Math.min(
        92,
        Math.max(72, availableHeroTextWidth - minStatsAreaWidth - titleGap),
      );
      const statsStartX = titleStartX + titleBlockWidth + titleGap;
      const statsAreaWidth = Math.max(92, heroInnerRight - statsStartX);
      const statWidth = Math.max(42, (statsAreaWidth - statsGap) / 2);

      doc.setFont("courier", "bold");
      doc.setFontSize(24);
      doc.setTextColor(201, 168, 106);
      doc.text(
        fitPdfSingleLineText(doc, toPdfText(singleTarga, fontReady), titleBlockWidth),
        titleStartX,
        heroTop + 18,
      );

      setPdfFont("bold");
      doc.setFontSize(13);
      doc.setTextColor(231, 229, 228);
      doc.text(
        fitPdfSingleLineText(
          doc,
          toPdfText(mezzoPdf?.marcaModello ?? mezzoPdf?.label ?? "DA VERIFICARE", fontReady),
          titleBlockWidth,
        ),
        titleStartX,
        heroTop + 28,
      );
      const stats = [
        {
          label: metricInfo?.primaryLabel ?? (group.subjectType === "compressore" ? "Ore attuali" : "Km attuali"),
          value: metricInfo?.primaryValue ?? "DA VERIFICARE",
        },
        {
          label: "Autista",
          value: mezzoPdf?.autistaNome || "DA VERIFICARE",
        },
        {
          label: "Ultima manutenzione",
          value: group?.latest ? formatMaintenancePdfDateLabel(group.latest) : "DA VERIFICARE",
        },
        {
          label: "Interventi periodo",
          value: String(group?.items.length ?? 0),
        },
      ];

      stats.forEach((stat, index) => {
        const columnIndex = index % 2;
        const rowIndex = Math.floor(index / 2);
        const cellX = statsStartX + columnIndex * (statWidth + statsGap);
        const cellY = heroTop + 13 + rowIndex * 16;
        setPdfFont("bold");
        doc.setFontSize(7.2);
        doc.setTextColor(201, 168, 106);
        doc.text(
          fitPdfSingleLineText(doc, toPdfText(stat.label.toUpperCase(), fontReady), statWidth),
          cellX,
          cellY,
        );
        setPdfFont("bold");
        doc.setFontSize(10.5);
        doc.setTextColor(255, 255, 255);
        doc.text(
          fitPdfSingleLineText(doc, toPdfText(stat.value, fontReady), statWidth),
          cellX,
          cellY + 6,
          { maxWidth: statWidth },
        );
      });

      y = heroTop + heroHeight + 8;

      autoTable(doc as Parameters<typeof autoTable>[0], {
        startY: y,
        margin: { left: margin, right: margin, top: topMargin, bottom: bottomMargin },
        head: [[
          toPdfText("Data", fontReady),
          toPdfText("Stato", fontReady),
          toPdfText(misuraColumnLabel, fontReady),
          toPdfText(metricInfo?.deltaLabel ?? "Δ km", fontReady),
          toPdfText("Tipo", fontReady),
          toPdfText("Descrizione", fontReady),
          toPdfText("Officina", fontReady),
        ]],
        body: (group?.items ?? []).map((item) => {
          const rowMetricInfo = buildPdfMetricInfo({
            subjectType: group.subjectType,
            latestItem: item,
            currentKm: group?.currentKm ?? null,
            currentOre: group?.currentOre ?? null,
            categoria: group?.mezzo?.categoria ?? null,
          });

          return [
            toPdfText(formatMaintenancePdfDateLabel(item), fontReady),
            toPdfText(formatMaintenanceStatoLabelDisplay(item), fontReady),
            toPdfText(buildPdfTableMetricValue(item, group?.mezzo?.categoria ?? null), fontReady),
            toPdfText(rowMetricInfo?.deltaValue ?? "—", fontReady),
            toPdfText(resolvePdfMaintenanceTypeLabel(item), fontReady),
            toPdfText(buildPdfDescrizioneWithOrigin(item, pdfOriginNotes), fontReady),
            toPdfText(item.fornitore || "—", fontReady),
          ];
        }),
        styles: {
          font: pdfBodyFont,
          fontSize: 8,
          cellPadding: 2.6,
          lineColor: [222, 214, 203],
          lineWidth: 0.1,
          overflow: "linebreak",
          valign: "middle",
        },
        headStyles: {
          font: pdfBodyFont,
          fillColor: [55, 65, 81],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [249, 245, 238],
        },
        bodyStyles: {
          font: pdfBodyFont,
          textColor: [37, 35, 32],
        },
        columnStyles: {
          0: { cellWidth: 26 },
          1: { cellWidth: 24 },
          2: { cellWidth: 22 },
          3: { cellWidth: 22 },
          4: { cellWidth: 28 },
          5: { cellWidth: 102 },
          6: { cellWidth: 32 },
        },
        didParseCell: (hookData) => {
          if (hookData.section === "body" && hookData.column.index === 3) {
            hookData.cell.styles.textColor = [22, 101, 52];
            hookData.cell.styles.fontStyle = "bold";
          }
        },
        rowPageBreak: "avoid",
      });

      y = (docWithTable.lastAutoTable?.finalY ?? y) + 8;
      renderClosedByExternalTable(group?.closedByExternalItems ?? [], pdfOriginNotes);

      decoratePages("Scheda manutenzioni mezzo");
      await openManutenzioniPdfPreview(
        doc.output("blob") as Blob,
        fileName,
        "Anteprima PDF scheda manutenzioni mezzo",
      );
      return;
    }

    const renderPdfGroup = (group: (typeof groupedItems)[number]) => {
      ensurePdfGroupStartsTogether(group);
      const photoData = photoDataByTarga.get(group.targa) ?? null;
      const metricInfo =
        group.latest
          ? buildPdfMetricInfo({
              subjectType: group.subjectType,
              latestItem: group.latest,
              currentKm: group.currentKm,
              currentOre: group.currentOre,
              categoria: group.mezzo?.categoria ?? null,
            })
          : null;
      const groupMisuraColumnLabel = resolvePdfMetricColumnLabel(group.items);
      const sectionHeight = photoData ? 24 : 18;
      checkPage(sectionHeight + 18);
      const sectionTop = y;
      const sectionWidth = pageWidth - margin * 2;

      setPdfHeaderBlackFill();
      doc.roundedRect(margin, sectionTop, sectionWidth, sectionHeight, 3, 3, "F");
      doc.setFillColor(201, 168, 106);
      doc.rect(margin, sectionTop, 4, sectionHeight, "F");

      let currentX = margin + 8;
      if (photoData) {
        drawPdfContainedImage({
          photoData,
          boxX: currentX,
          boxY: sectionTop + 4.5,
          boxW: 20,
          boxH: 15,
          radius: 1.5,
          borderLineWidth: 0.4,
        });
        currentX += 24;
      }

      const availableWidth = pageWidth - margin - currentX - 4;
      const columnWidth = availableWidth / 4;
      const sectionFields = [
        { label: "Targa", value: group.targa },
        {
          label: pdfSubjectType === "tutti" ? PDF_SUBJECT_LABELS[group.subjectType].singular : "Mezzo",
          value: group.mezzo?.marcaModello ?? group.mezzo?.label ?? "DA VERIFICARE",
        },
        { label: "Autista", value: group.mezzo?.autistaNome || "DA VERIFICARE" },
        {
          label: metricInfo?.primaryLabel ?? (group.subjectType === "compressore" ? "Ore attuali" : "Km attuali"),
          value:
            group.subjectType === "compressore"
              ? metricInfo?.primaryValue ?? "DA VERIFICARE"
              : group.subjectType === "attrezzature" && pdfSubjectType === "tutti"
                ? metricInfo?.primaryValue ?? "DA VERIFICARE"
              : group.currentKm !== null
                ? formatNumberIt(group.currentKm)
                : "DA VERIFICARE",
        },
      ];

      sectionFields.forEach((field, index) => {
        const x = currentX + index * columnWidth;
        setPdfFont("bold");
        doc.setFontSize(7.5);
        doc.setTextColor(201, 168, 106);
        doc.text(toPdfText(field.label.toUpperCase(), fontReady), x, sectionTop + 8);
        setPdfFont("bold");
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text(toPdfText(field.value, fontReady), x, sectionTop + 14, { maxWidth: columnWidth - 4 });
      });

      y = sectionTop + sectionHeight + 4;

      autoTable(doc as Parameters<typeof autoTable>[0], {
        startY: y,
        margin: { left: margin, right: margin, top: topMargin, bottom: bottomMargin },
        head: [[
          toPdfText("Data", fontReady),
          toPdfText("Stato", fontReady),
          toPdfText(groupMisuraColumnLabel, fontReady),
          toPdfText(metricInfo?.deltaLabel ?? "Δ km", fontReady),
          toPdfText("Tipo", fontReady),
          toPdfText("Descrizione", fontReady),
          toPdfText("Officina", fontReady),
        ]],
        body: group.items.map((item) => {
          const rowMetricInfo = buildPdfMetricInfo({
            subjectType: group.subjectType,
            latestItem: item,
            currentKm: group.currentKm,
            currentOre: group.currentOre,
            categoria: group.mezzo?.categoria ?? null,
          });

          return [
            toPdfText(formatMaintenancePdfDateLabel(item), fontReady),
            toPdfText(formatMaintenanceStatoLabelDisplay(item), fontReady),
            toPdfText(buildPdfTableMetricValue(item, group.mezzo?.categoria ?? null), fontReady),
            toPdfText(rowMetricInfo?.deltaValue ?? "—", fontReady),
            toPdfText(resolvePdfMaintenanceTypeLabel(item), fontReady),
            toPdfText(buildPdfDescrizioneWithOrigin(item, pdfOriginNotes), fontReady),
            toPdfText(item.fornitore || "—", fontReady),
          ];
        }),
        styles: {
          font: pdfBodyFont,
          fontSize: 8,
          cellPadding: 2.4,
          lineColor: [229, 231, 235],
          lineWidth: 0.1,
          overflow: "linebreak",
          valign: "middle",
        },
        headStyles: {
          font: pdfBodyFont,
          fillColor: [55, 65, 81],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [249, 245, 238],
        },
        bodyStyles: {
          font: pdfBodyFont,
          textColor: [37, 35, 32],
        },
        columnStyles: {
          0: { cellWidth: 26 },
          1: { cellWidth: 24 },
          2: { cellWidth: 22 },
          3: { cellWidth: 22 },
          4: { cellWidth: 28 },
          5: { cellWidth: 102 },
          6: { cellWidth: 32 },
        },
        didParseCell: (hookData) => {
          if (hookData.section === "body" && hookData.column.index === 3) {
            hookData.cell.styles.textColor = [22, 101, 52];
            hookData.cell.styles.fontStyle = "bold";
          }
        },
        rowPageBreak: "avoid",
      });

      y = (docWithTable.lastAutoTable?.finalY ?? y) + 10;
      renderClosedByExternalTable(group.closedByExternalItems, pdfOriginNotes);
    };

    if (pdfSubjectType === "tutti") {
      PDF_SUBJECT_ORDER.forEach((subjectType) => {
        const sectionGroups = groupedItems.filter((group) => group.subjectType === subjectType);
        if (sectionGroups.length === 0) return;

        ensurePdfSectionTitleWithFirstGroup(sectionGroups[0]);
        setPdfFont("bold");
        doc.setFontSize(14);
        doc.setTextColor(26, 26, 26);
        doc.text(toPdfText(PDF_SUBJECT_LABELS[subjectType].plural, fontReady), margin, y);
        y += 7;

        sectionGroups.forEach(renderPdfGroup);
      });
    } else {
      groupedItems.forEach(renderPdfGroup);
    }

    decoratePages("Quadro manutenzioni");
    await openManutenzioniPdfPreview(
      doc.output("blob") as Blob,
      fileName,
      "Anteprima PDF quadro manutenzioni",
    );
  }

  function renderContextBar() {
    const contextBlocks = [
      { label: "Targa", value: mezzoPreviewSelezionato?.targa || activeTarga || "-" },
      {
        label: "Modello",
        value: mezzoPreviewSelezionato?.marcaModello ?? mezzoPreviewSelezionato?.label ?? "-",
      },
      {
        label: "Autista solito",
        value: mezzoPreviewSelezionato?.autistaNome || "DA VERIFICARE",
      },
      {
        label: "KM attuali",
        value: activeTarga ? formatNumberIt(kmUltimoRifornimento) : "-",
      },
      {
        label: "Ultima manutenzione",
        value: activeTarga ? (latestRecord ? formatDateShort(latestRecord.data) : "Nessuna") : "-",
      },
    ];

    if (contextPlaceholder) {
      return (
        <div className="man2-context-bar">
          {contextBlocks.map((item, index) => (
            <Fragment key={item.label}>
              <div className="man2-ctx-item">
                <span className="man2-ctx-label">{item.label}</span>
                <span className="man2-ctx-value">{item.value}</span>
              </div>
              {index < contextBlocks.length - 1 ? <div className="man2-ctx-divider" /> : null}
            </Fragment>
          ))}
        </div>
      );
    }

    return (
      <div className="man2-context-bar">
        {contextBlocks.map((item, index) => (
          <Fragment key={item.label}>
            <div className="man2-ctx-item">
              <span className="man2-ctx-label">{item.label}</span>
              <span className="man2-ctx-value">{item.value}</span>
            </div>
            {index < contextBlocks.length - 1 ? <div className="man2-ctx-divider" /> : null}
          </Fragment>
        ))}
      </div>
    );
  }

  function formatSegnalazioneDateLabel(item: NextAutistiSegnalazioneSectionItem): string {
    if (!item.timestamp) return "-";
    return formatDateTimeUI(item.timestamp);
  }

  function resolveSegnalazioneAutoreReale(
    item: NextAutistiSegnalazioneSectionItem,
  ): string | null {
    return normalizeFreeText(item.autistaNome ?? "") || normalizeFreeText(item.badgeAutista ?? "") || null;
  }

  function formatSegnalazioneAutore(item: NextAutistiSegnalazioneSectionItem): string {
    return resolveSegnalazioneAutoreReale(item) || "Autista";
  }

  function buildSegnalazioneManutenzioneDescrizione(item: NextAutistiSegnalazioneSectionItem): string {
    const tipoProblema = normalizeFreeText(item.tipo || "-") || "-";
    const descrizioneSegnalazione = normalizeFreeText(item.descrizione || "-") || "-";
    return `Segnalazione: ${tipoProblema} - ${descrizioneSegnalazione}`;
  }

  function buildSegnalazioneWriterRecord(
    item: NextAutistiSegnalazioneSectionItem,
    sourceRecord: Record<string, unknown> | null,
    urgenza: Extract<NextManutenzioneUrgenza, "alta" | "media">,
  ): Record<string, unknown> {
    return {
      ...(sourceRecord ?? {}),
      id: item.id,
      targa: item.targa ?? sourceRecord?.targa ?? null,
      targaCamion: item.targaCamion ?? sourceRecord?.targaCamion ?? null,
      targaRimorchio: item.targaRimorchio ?? sourceRecord?.targaRimorchio ?? null,
      tipoProblema: item.tipo,
      descrizione: item.descrizione,
      autistaNome: item.autistaNome ?? sourceRecord?.autistaNome ?? null,
      badgeAutista: item.badgeAutista ?? sourceRecord?.badgeAutista ?? null,
      flagVerifica: urgenza === "alta",
    };
  }

  function clearSegnalazioneSelectionEverywhere(id: string) {
    setSelectedSegnalazioneIds((current) => current.filter((entry) => entry !== id));
    setSelectedGruppoSegnalazioneIds((current) => {
      const next: Record<string, string[]> = {};
      Object.entries(current).forEach(([key, ids]) => {
        next[key] = ids.filter((entry) => entry !== id);
      });
      return next;
    });
  }

  function buildSegnalatoDaGruppo(items: NextAutistiSegnalazioneSectionItem[]): string {
    const seen = new Set<string>();
    const names: string[] = [];
    items.forEach((item) => {
      const autore = resolveSegnalazioneAutoreReale(item);
      if (!autore) return;
      const key = autore.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      names.push(autore);
    });
    return names.length > 0 ? names.join(", ") : "Autisti";
  }

  function toggleSegnalazioneLiberaSelection(id: string) {
    setSelectedSegnalazioneIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  function toggleGruppoSegnalazioneSelection(groupKey: string, id: string) {
    setSelectedGruppoSegnalazioneIds((current) => {
      const existing = current[groupKey] ?? [];
      const nextIds = existing.includes(id)
        ? existing.filter((entry) => entry !== id)
        : [...existing, id];
      return {
        ...current,
        [groupKey]: nextIds,
      };
    });
  }

  function clearSegnalazioniLibereSelection(ids: readonly string[]) {
    const removed = new Set(ids);
    setSelectedSegnalazioneIds((current) => current.filter((id) => !removed.has(id)));
  }

  function clearGruppoSegnalazioniSelection(groupKey: string, ids: readonly string[]) {
    const removed = new Set(ids);
    setSelectedGruppoSegnalazioneIds((current) => ({
      ...current,
      [groupKey]: (current[groupKey] ?? []).filter((id) => !removed.has(id)),
    }));
  }

  function toggleManutenzioneLiberaSelection(id: string) {
    setSelectedManutenzioneLiberaIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  function clearManutenzioniLibereSelection(ids: readonly string[]) {
    const removed = new Set(ids);
    setSelectedManutenzioneLiberaIds((current) => current.filter((id) => !removed.has(id)));
  }

  function formatGruppoManutenzioneLabel(gruppo: ManutenzioniDaFareGroup): string {
    const snippets = gruppo.manutenzioni
      .slice(0, 2)
      .map((item) => buildDescrizioneSnippet(item.descrizione, 34))
      .filter(Boolean);
    const content = snippets.length > 0 ? snippets.join(" / ") : "senza descrizione";
    return `${gruppo.targa} - ${content} (${gruppo.manutenzioni.length})`;
  }

  async function handleCreaGruppoManutenzioni(targaValue: string, manutenzioneIds: string[]) {
    if (gruppoManutenzioneBusyRef.current) return;
    if (manutenzioneIds.length === 0) {
      setError("Seleziona almeno due manutenzioni da fare non raggruppate.");
      return;
    }
    const busyKey = `crea:${targaValue}:${manutenzioneIds.join(",")}`;
    try {
      gruppoManutenzioneBusyRef.current = true;
      setGruppoManutenzioneBusyKey(busyKey);
      setError(null);
      setNotice(null);
      const result = await creaGruppoManutenzioni(manutenzioneIds);
      if (!result.ok) {
        setError(result.error ?? "Creazione gruppo manutenzioni non riuscita.");
        return;
      }
      clearManutenzioniLibereSelection(manutenzioneIds);
      await refreshData();
      setNotice(`Gruppo manutenzioni creato per ${targaValue}.`);
    } catch (groupError) {
      console.error("Errore creazione gruppo manutenzioni:", groupError);
      setError("Creazione gruppo manutenzioni non riuscita.");
    } finally {
      gruppoManutenzioneBusyRef.current = false;
      setGruppoManutenzioneBusyKey(null);
    }
  }

  async function handleAggiungiAGruppoManutenzioni(
    gruppoId: string,
    targaValue: string,
    manutenzioneIds: string[],
  ) {
    if (gruppoManutenzioneBusyRef.current) return;
    if (!gruppoId) {
      setError("Gruppo manutenzioni non valido.");
      return;
    }
    if (manutenzioneIds.length === 0) {
      setError("Seleziona almeno una manutenzione da fare non raggruppata.");
      return;
    }
    const busyKey = `aggiungi:${gruppoId}:${manutenzioneIds.join(",")}`;
    try {
      gruppoManutenzioneBusyRef.current = true;
      setGruppoManutenzioneBusyKey(busyKey);
      setError(null);
      setNotice(null);
      const result = await aggiungiAGruppoManutenzioni(gruppoId, manutenzioneIds);
      if (!result.ok) {
        setError(result.error ?? "Aggiunta al gruppo manutenzioni non riuscita.");
        return;
      }
      clearManutenzioniLibereSelection(manutenzioneIds);
      await refreshData();
      setNotice(`Manutenzioni aggiunte al gruppo ${targaValue}.`);
    } catch (groupError) {
      console.error("Errore aggiunta gruppo manutenzioni:", groupError);
      setError("Aggiunta al gruppo manutenzioni non riuscita.");
    } finally {
      gruppoManutenzioneBusyRef.current = false;
      setGruppoManutenzioneBusyKey(null);
    }
  }

  async function handleRimuoviDaGruppoManutenzioni(groupKey: string, manutenzioneId: string) {
    if (gruppoManutenzioneBusyRef.current) return;
    const busyKey = `rimuovi:${groupKey}:${manutenzioneId}`;
    try {
      gruppoManutenzioneBusyRef.current = true;
      setGruppoManutenzioneBusyKey(busyKey);
      setError(null);
      setNotice(null);
      const result = await rimuoviDaGruppoManutenzioni([manutenzioneId]);
      if (!result.ok) {
        setError(result.error ?? "Rimozione dal gruppo manutenzioni non riuscita.");
        return;
      }
      await refreshData();
      setNotice("Manutenzione rimossa dal gruppo.");
    } catch (groupError) {
      console.error("Errore rimozione gruppo manutenzioni:", groupError);
      setError("Rimozione dal gruppo manutenzioni non riuscita.");
    } finally {
      gruppoManutenzioneBusyRef.current = false;
      setGruppoManutenzioneBusyKey(null);
    }
  }

  async function handleCreaGruppoSegnalazioni(targaValue: string, segnalazioneIds: string[]) {
    if (segnalazioneIds.length === 0) {
      setError("Seleziona almeno una segnalazione non raggruppata.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setNotice(null);
      const result = await creaGruppoSegnalazioni(segnalazioneIds);
      if (!result.ok) {
        setError(result.error ?? "Creazione gruppo non riuscita.");
        return;
      }
      clearSegnalazioniLibereSelection(segnalazioneIds);
      await refreshData();
      setNotice(`Gruppo segnalazioni creato per ${targaValue}.`);
    } catch (groupError) {
      console.error("Errore creazione gruppo segnalazioni:", groupError);
      setError("Creazione gruppo non riuscita.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAggiungiAGruppo(gruppoId: string | null, targaValue: string, segnalazioneIds: string[]) {
    if (!gruppoId) {
      setError("Gruppo segnalazioni non valido.");
      return;
    }
    if (segnalazioneIds.length === 0) {
      setError("Seleziona almeno una segnalazione non raggruppata.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setNotice(null);
      const result = await aggiungiAGruppo(gruppoId, segnalazioneIds);
      if (!result.ok) {
        setError(result.error ?? "Aggiunta al gruppo non riuscita.");
        return;
      }
      clearSegnalazioniLibereSelection(segnalazioneIds);
      await refreshData();
      setNotice(`Segnalazioni aggiunte al gruppo ${targaValue}.`);
    } catch (groupError) {
      console.error("Errore aggiunta gruppo segnalazioni:", groupError);
      setError("Aggiunta al gruppo non riuscita.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRimuoviDaGruppo(groupKey: string, segnalazioneId: string) {
    try {
      setSaving(true);
      setError(null);
      setNotice(null);
      const result = await rimuoviDaGruppo([segnalazioneId]);
      if (!result.ok) {
        setError(result.error ?? "Rimozione dal gruppo non riuscita.");
        return;
      }
      clearGruppoSegnalazioniSelection(groupKey, [segnalazioneId]);
      await refreshData();
      setNotice("Segnalazione rimossa dal gruppo.");
    } catch (groupError) {
      console.error("Errore rimozione gruppo segnalazioni:", groupError);
      setError("Rimozione dal gruppo non riuscita.");
    } finally {
      setSaving(false);
    }
  }

  function getSegnalazioniTargetGruppo(gruppo: SegnalazioniDaFareGroup): NextAutistiSegnalazioneSectionItem[] {
    const selectedIds = selectedGruppoSegnalazioneIds[gruppo.key] ?? [];
    if (selectedIds.length === 0) return gruppo.segnalazioni;
    const selectedSet = new Set(selectedIds);
    return gruppo.segnalazioni.filter((item) => selectedSet.has(item.id));
  }

  function buildLavoroDaGruppoDescrizione(items: NextAutistiSegnalazioneSectionItem[]): string {
    return items
      .map((item) => {
        const tipoLabel = normalizeFreeText(item.tipo);
        const descrizioneLabel = normalizeFreeText(item.descrizione);
        return [tipoLabel, descrizioneLabel].filter(Boolean).join(" - ");
      })
      .filter(Boolean)
      .join(" + ");
  }

  async function agganciaSegnalazioniALavoroDaGruppo(manutenzioneId: string, ids: string[]) {
    return agganciaSegnalazioniAManutenzioneEsistenteBatch({
      manutenzioneTargetId: manutenzioneId,
      sorgenti: ids.map((id) => ({
        sorgenteId: id,
        sorgenteTipo: "segnalazione",
      })),
    });
  }

  async function handleCreaLavoroDaGruppo(gruppo: SegnalazioniDaFareGroup) {
    const targetItems = getSegnalazioniTargetGruppo(gruppo);
    const targetIds = targetItems.map((item) => item.id);
    const descrizioneLavoro = buildLavoroDaGruppoDescrizione(targetItems);
    if (!gruppo.gruppoId || targetItems.length === 0 || !descrizioneLavoro) {
      setError("Gruppo segnalazioni non valido per creare il lavoro.");
      return;
    }
    const conferma = window.confirm(
      `Creare un lavoro Da fare per ${gruppo.targa} con ${targetItems.length} segnalazioni?\n\n` +
        `${targetItems.map((item) => `- ${item.tipo} - ${item.descrizione}`).join("\n")}\n\n` +
        `Descrizione lavoro:\n${descrizioneLavoro}`,
    );
    if (!conferma) return;

    try {
      const oldestSegnalazioneTimestamp = targetItems.reduce<number | null>((oldest, item) => {
        if (item.timestamp == null) return oldest;
        if (oldest == null) return item.timestamp;
        return item.timestamp < oldest ? item.timestamp : oldest;
      }, null);
      const dataInserimentoLavoro = toISO(oldestSegnalazioneTimestamp) ?? todayLabel();
      setSaving(true);
      setError(null);
      setNotice(null);
      setLavoroGruppoRetryState(null);
      const savedRecord = await saveNextManutenzioneBusinessRecord({
        targa: gruppo.targa,
        tipo: "mezzo",
        fornitore: null,
        km: null,
        ore: null,
        sottotipo: null,
        descrizione: descrizioneLavoro,
        eseguito: null,
        data: dataInserimentoLavoro,
        dataEsecuzione: null,
        dataProgrammata: null,
        stato: "daFare",
        importo: null,
        materiali: [],
        assiCoinvolti: [],
        gommePerAsse: [],
        gommeInterventoTipo: null,
        gommeStraordinario: null,
        origineTipo: "manuale",
        origineRefId: null,
        origineRefKey: null,
        segnalatoDa: buildSegnalatoDaGruppo(targetItems),
        eseguitoDa: null,
        urgenza: "media",
      });
      const aggancio = await agganciaSegnalazioniALavoroDaGruppo(savedRecord.id, targetIds);
      await refreshData();
      clearGruppoSegnalazioniSelection(gruppo.key, targetIds);
      setSelectedDetailRecordId(savedRecord.id);
      if (aggancio.failures.length > 0) {
        setLavoroGruppoRetryState({
          manutenzioneId: savedRecord.id,
          failedIds: aggancio.failures.map((failure) => failure.sorgenteId),
        });
        setNotice(null);
      } else {
        setNotice("Lavoro Da fare creato e segnalazioni agganciate.");
      }
    } catch (createError) {
      console.error("Errore creazione lavoro da gruppo segnalazioni:", createError);
      setError("Creazione lavoro da gruppo non riuscita.");
    } finally {
      setSaving(false);
      setGruppoSegnalazioneMenuId(null);
    }
  }

  async function handleRetryAggancioLavoroGruppo() {
    if (!lavoroGruppoRetryState) return;
    const retry = lavoroGruppoRetryState;
    try {
      setSaving(true);
      setError(null);
      setNotice(null);
      const result = await agganciaSegnalazioniALavoroDaGruppo(retry.manutenzioneId, retry.failedIds);
      await refreshData();
      if (result.failures.length > 0) {
        setLavoroGruppoRetryState({
          manutenzioneId: retry.manutenzioneId,
          failedIds: result.failures.map((failure) => failure.sorgenteId),
        });
      } else {
        setLavoroGruppoRetryState(null);
        setNotice("Aggancio segnalazioni completato.");
      }
    } catch (retryError) {
      console.error("Errore retry aggancio lavoro gruppo:", retryError);
      setError("Riprova aggancio segnalazioni non riuscita.");
    } finally {
      setSaving(false);
    }
  }

  async function handleOpenAgganciaSegnalazione(item: NextAutistiSegnalazioneSectionItem) {
    const targaSegnalazione = normalizeText(item.targa ?? "");
    if (!targaSegnalazione) {
      setError("Targa segnalazione non disponibile per l'aggancio.");
      return;
    }
    const sorgente: AgganciaLegameSorgente = {
      id: item.id,
      targa: targaSegnalazione,
      tipo: "segnalazione",
      descrizione: item.descrizione ?? "",
    };
    setAgganciaSegnalazioneModal({ sorgente, candidati: [], busy: true });
    setError(null);
    setNotice(null);
    try {
      const candidati = await getManutenzioniPerAggancio(targaSegnalazione);
      setAgganciaSegnalazioneModal({ sorgente, candidati, busy: false });
    } catch (loadError) {
      console.error("Errore caricamento candidati aggancio segnalazione:", loadError);
      setAgganciaSegnalazioneModal(null);
      setError("Caricamento manutenzioni candidate non riuscito.");
    }
  }

  async function handleConfirmAgganciaSegnalazione(manutenzioneTargetId: string) {
    const modal = agganciaSegnalazioneModal;
    if (!modal) return;
    setAgganciaSegnalazioneModal({ ...modal, busy: true });
    setError(null);
    setNotice(null);
    try {
      const result = await agganciaSegnalazioniAManutenzioneEsistenteBatch({
        manutenzioneTargetId,
        sorgenti: [
          {
            sorgenteId: modal.sorgente.id,
            sorgenteTipo: "segnalazione",
          },
        ],
      });
      await refreshData();
      if (result.failures.length > 0) {
        setError(result.failures[0]?.error ?? "Aggancio segnalazione non riuscito.");
      } else {
        clearSegnalazioniLibereSelection([modal.sorgente.id]);
        setSelectedGruppoSegnalazioneIds((current) => {
          const next = { ...current };
          for (const key of Object.keys(next)) {
            next[key] = next[key].filter((id) => id !== modal.sorgente.id);
          }
          return next;
        });
        setNotice("Segnalazione agganciata alla manutenzione.");
      }
      setAgganciaSegnalazioneModal(null);
    } catch (attachError) {
      console.error("Errore aggancio segnalazione a manutenzione:", attachError);
      setError("Aggancio segnalazione non riuscito.");
      setAgganciaSegnalazioneModal({ ...modal, busy: false });
    }
  }

  async function handleOpenCreaManutenzioneSegnalazione(item: NextAutistiSegnalazioneSectionItem) {
    const fallbackRecord = buildSegnalazioneWriterRecord(item, null, "media");
    let sourceRecord = fallbackRecord;
    try {
      const origineRecord = await getNextManutenzioneOrigineRecord("@segnalazioni_autisti_tmp", item.id);
      if (origineRecord?.data) {
        const rawUrgenza = origineRecord.data.flagVerifica === true ? "alta" : "media";
        sourceRecord = buildSegnalazioneWriterRecord(item, origineRecord.data, rawUrgenza);
      }
    } catch (loadError) {
      console.warn("Record segnalazione origine non disponibile, uso riga normalizzata:", loadError);
    }
    const urgenza = sourceRecord.flagVerifica === true ? "alta" : "media";
    setCreaManutenzioneSegnalazioneModal({
      item,
      sourceRecord: buildSegnalazioneWriterRecord(item, sourceRecord, urgenza),
      descrizione: buildSegnalazioneManutenzioneDescrizione(item),
      urgenza,
      busy: false,
    });
    setError(null);
    setNotice(null);
  }

  async function handleSubmitCreaManutenzioneSegnalazione(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const modal = creaManutenzioneSegnalazioneModal;
    if (!modal || modal.busy) return;
    const descrizioneOverride = normalizeFreeText(modal.descrizione);
    if (!descrizioneOverride) {
      setError("Descrizione manutenzione obbligatoria.");
      return;
    }
    setCreaManutenzioneSegnalazioneModal({ ...modal, busy: true });
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const sourceRecord = buildSegnalazioneWriterRecord(
        modal.item,
        modal.sourceRecord,
        modal.urgenza,
      );
      const result = await createManutenzioneDaFareFromSegnalazione(
        sourceRecord,
        descrizioneOverride,
      );
      if (!result.ok) {
        throw new Error(result.error || "Creazione manutenzione non riuscita.");
      }
      await refreshData();
      clearSegnalazioneSelectionEverywhere(modal.item.id);
      setCreaManutenzioneSegnalazioneModal(null);
      if (result.manutenzioneId) {
        setSelectedDetailRecordId(result.manutenzioneId);
      }
      setNotice("Manutenzione Da fare creata dalla segnalazione.");
    } catch (createError) {
      console.error("Errore creazione manutenzione da segnalazione:", createError);
      setError(
        createError instanceof Error
          ? createError.message
          : "Creazione manutenzione non riuscita.",
      );
      setCreaManutenzioneSegnalazioneModal({ ...modal, busy: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSegnalazione(item: NextAutistiSegnalazioneSectionItem) {
    await handleDeleteSegnalazioneById(item.id);
  }

  async function handleDeleteSegnalazioneById(segnalazioneId: string) {
    // NB: l'id segnalazione e' un UUID case-sensitive. NON usare normalizeText
    // (che e' il normalizzatore TARGHE e mette in maiuscolo): va solo trimmato.
    const id = (segnalazioneId ?? "").trim();
    if (!id) {
      setError("ID segnalazione mancante.");
      return;
    }
    const confirmed = window.confirm(
      "Eliminare definitivamente questa segnalazione?\n\n"
        + "La segnalazione e le sue foto verranno cancellate in modo irreversibile anche dalla madre.\n"
        + "Se e' collegata a una manutenzione, verra' rimosso solo il riferimento di origine dalla manutenzione.",
    );
    if (!confirmed) return;
    try {
      setSaving(true);
      setError(null);
      setNotice(null);
      const result = await deleteSegnalazioneAutista({ segnalazioneId: id });
      if (!result.ok) {
        throw new Error(result.error || "Eliminazione segnalazione non riuscita.");
      }
      await refreshData();
      clearSegnalazioneSelectionEverywhere(id);
      setNotice("Segnalazione eliminata.");
    } catch (deleteError) {
      console.error("Errore eliminazione segnalazione:", deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Eliminazione segnalazione non riuscita.",
      );
    } finally {
      setSaving(false);
    }
  }

  function renderSegnalazioneRow(args: {
    item: NextAutistiSegnalazioneSectionItem;
    checked: boolean;
    onToggle: () => void;
    action?: ReactNode;
  }) {
    const { item, checked, onToggle, action } = args;
    return (
      <label key={item.id} className="man2-grp-row">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Seleziona segnalazione ${item.descrizione}`}
        />
        <span className="man2-grp-row__body">
          <span className="man2-grp-row__title">{buildDescrizioneSnippet(item.descrizione, 110)}</span>
          <span className="man2-grp-row__meta">
            {[
              formatSegnalazioneAutore(item),
              formatSegnalazioneDateLabel(item),
              item.tipo ? `Tipo ${item.tipo}` : null,
            ]
              .filter(Boolean)
              .join(" - ")}
          </span>
        </span>
        {action ? <span className="man2-grp-row__action">{action}</span> : null}
      </label>
    );
  }

  function renderSegnalazioneNonRaggruppataMenu(args: {
    item: NextAutistiSegnalazioneSectionItem;
    targaGroup: SegnalazioniDaFareTargaGroup;
    selectedFreeIdsForTarga: string[];
  }) {
    const { item, targaGroup, selectedFreeIdsForTarga } = args;
    const menuId = `segnalazione-libera:${item.id}`;
    const targetGroup = targaGroup.gruppi[0] ?? null;
    const selectedIds = selectedFreeIdsForTarga.length > 0 ? selectedFreeIdsForTarga : [item.id];
    return (
      <span className="man2-row-menu">
        <button
          type="button"
          className="man2-row-menu__trigger"
          aria-label={`Azioni segnalazione ${item.descrizione}`}
          aria-expanded={segnalazioneMenuId === menuId}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setSegnalazioneMenuId((current) => (current === menuId ? null : menuId));
          }}
        >
          ⋮
        </button>
        {segnalazioneMenuId === menuId ? (
          <span className="man2-row-menu__panel" role="menu">
            <button
              type="button"
              className="man2-row-menu__item"
              role="menuitem"
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setSegnalazioneMenuId(null);
                void handleOpenCreaManutenzioneSegnalazione(item);
              }}
            >
              Crea manutenzione
            </button>
            <button
              type="button"
              className="man2-row-menu__item"
              role="menuitem"
              disabled={!targetGroup || saving}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setSegnalazioneMenuId(null);
                if (targetGroup) {
                  void handleAggiungiAGruppo(targetGroup.gruppoId, targetGroup.targa, selectedIds);
                }
              }}
            >
              Aggiungi a gruppo
            </button>
            <button
              type="button"
              className="man2-row-menu__item"
              role="menuitem"
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setSegnalazioneMenuId(null);
                void handleCreaGruppoSegnalazioni(targaGroup.targa, selectedIds);
              }}
            >
              Crea gruppo
            </button>
            <button
              type="button"
              className="man2-row-menu__item"
              role="menuitem"
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setSegnalazioneMenuId(null);
                void handleOpenAgganciaSegnalazione(item);
              }}
            >
              Aggancia a manutenzione esistente
            </button>
            <button
              type="button"
              className="man2-row-menu__item"
              role="menuitem"
              style={{ color: "#b91c1c" }}
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setSegnalazioneMenuId(null);
                void handleDeleteSegnalazione(item);
              }}
            >
              Elimina
            </button>
          </span>
        ) : null}
      </span>
    );
  }

  function renderSegnalazioneGruppoMenu(args: {
    item: NextAutistiSegnalazioneSectionItem;
    groupKey: string;
  }) {
    const { item, groupKey } = args;
    const menuId = `segnalazione-gruppo:${groupKey}:${item.id}`;
    return (
      <span className="man2-row-menu">
        <button
          type="button"
          className="man2-row-menu__trigger"
          aria-label={`Azioni segnalazione ${item.descrizione}`}
          aria-expanded={segnalazioneMenuId === menuId}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setSegnalazioneMenuId((current) => (current === menuId ? null : menuId));
          }}
        >
          ⋮
        </button>
        {segnalazioneMenuId === menuId ? (
          <span className="man2-row-menu__panel" role="menu">
            <button
              type="button"
              className="man2-row-menu__item"
              role="menuitem"
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setSegnalazioneMenuId(null);
                void handleOpenCreaManutenzioneSegnalazione(item);
              }}
            >
              Crea manutenzione
            </button>
            <button
              type="button"
              className="man2-row-menu__item"
              role="menuitem"
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setSegnalazioneMenuId(null);
                void handleRimuoviDaGruppo(groupKey, item.id);
              }}
            >
              Rimuovi dal gruppo
            </button>
            <button
              type="button"
              className="man2-row-menu__item"
              role="menuitem"
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setSegnalazioneMenuId(null);
                void handleOpenAgganciaSegnalazione(item);
              }}
            >
              Aggancia a manutenzione esistente
            </button>
            <button
              type="button"
              className="man2-row-menu__item"
              role="menuitem"
              style={{ color: "#b91c1c" }}
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setSegnalazioneMenuId(null);
                void handleDeleteSegnalazione(item);
              }}
            >
              Elimina
            </button>
          </span>
        ) : null}
      </span>
    );
  }

  function renderGruppoSegnalazioniMenu(gruppo: SegnalazioniDaFareGroup) {
    const menuId = `gruppo:${gruppo.key}`;
    return (
      <span className="man2-row-menu">
        <button
          type="button"
          className="man2-row-menu__trigger"
          aria-label={`Azioni gruppo segnalazioni ${gruppo.targa}`}
          aria-expanded={gruppoSegnalazioneMenuId === menuId}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setGruppoSegnalazioneMenuId((current) => (current === menuId ? null : menuId));
          }}
        >
          ⋮
        </button>
        {gruppoSegnalazioneMenuId === menuId ? (
          <span className="man2-row-menu__panel" role="menu">
            <button
              type="button"
              className="man2-row-menu__item"
              role="menuitem"
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setGruppoSegnalazioneMenuId(null);
                void handleCreaLavoroDaGruppo(gruppo);
              }}
            >
              Crea lavoro (Da fare)
            </button>
          </span>
        ) : null}
      </span>
    );
  }

  function renderManutenzioneOperativaCard(args: {
    item: NextManutenzioniLegacyDatasetRecord;
    checkbox?: {
      checked: boolean;
      onToggle: () => void;
    };
    targetGroups?: ManutenzioniDaFareGroup[];
    selectedFreeIdsForTarga?: string[];
    groupKey?: string;
  }) {
    const { item, checkbox, targetGroups = [], selectedFreeIdsForTarga = [], groupKey } = args;
    const urgenza = resolveMaintenanceUrgenza(item);
    const origine = resolveMaintenanceOrigine(item);
    const stato = resolveMaintenanceStato(item);
    const menuId = `manutenzione-operativa:${item.id}`;
    const isDaFare = stato === "daFare";
    const groupActionBusy = Boolean(gruppoManutenzioneBusyKey);
    const selectedIds = selectedFreeIdsForTarga.length > 0 ? selectedFreeIdsForTarga : [item.id];

    return (
      <article key={item.id} className="man2-last-item">
        <div className="man2-last-item__row1">
          {checkbox ? (
            <input
              type="checkbox"
              checked={checkbox.checked}
              disabled={groupActionBusy}
              onChange={checkbox.onToggle}
              aria-label={`Seleziona manutenzione ${item.descrizione}`}
              style={{ marginTop: 4 }}
            />
          ) : null}
          <div>
            <span className="man2-last-item__title">{buildDescrizioneSnippet(item.descrizione, 80)}</span>
            <div className="man2-last-item__meta">
              {[
                item.targa,
                `Inserimento ${formatDaFareDateLabel(item)}`,
                `Origine ${formatMaintenanceOrigineLabel(origine)}`,
                item.segnalatoDa ? `Segnalato da ${item.segnalatoDa}` : null,
              ]
                .filter(Boolean)
                .join(" - ")}
            </div>
          </div>
          <span className="man2-badge" style={URGENZA_BADGE_STYLE[urgenza]}>
            {urgenza.toUpperCase()}
          </span>
        </div>
        <div className="man2-last-item__meta">
          <span
            className={`man2-badge man2-badge--${item.tipo}`}
            style={getMaintenanceStatoBadgeStyle(stato)}
            title={buildChiusuraDaEventoTitle(item)}
          >
            {formatMaintenanceStatoLabel(stato)}
          </span>
          <span className={`man2-badge man2-badge--${item.tipo}`}>{item.tipo}</span>
        </div>
        <FraseStoriaRecord
          {...recordChiusoFromRaw(item as unknown as Record<string, unknown>, undefined, {
            sourceRecords: resolveSourceRecordsForItem(item as unknown as Record<string, unknown>),
          })}
          compact
        />
        <div className="man2-form-actions man2-form-actions--row">
          <button type="button" className="man2-btn-full" onClick={() => handleCompleteDaFare(item)}>
            Eseguita
          </button>
          <div className="man2-row-menu">
            <button
              type="button"
              className="man2-row-menu__trigger"
              aria-label={`Altre azioni per manutenzione ${item.descrizione}`}
              aria-expanded={daFareMenuId === menuId}
              onClick={() => setDaFareMenuId((current) => (current === menuId ? null : menuId))}
            >
              ⋮
            </button>
            {daFareMenuId === menuId ? (
              <div className="man2-row-menu__panel" role="menu">
                {checkbox && isDaFare
                  ? targetGroups.map((gruppo) => (
                      <button
                        key={gruppo.key}
                        type="button"
                        className="man2-row-menu__item"
                        role="menuitem"
                        onClick={() => {
                          setDaFareMenuId(null);
                          void handleAggiungiAGruppoManutenzioni(gruppo.gruppoId, gruppo.targa, selectedIds);
                        }}
                      >
                        Aggiungi a gruppo: {formatGruppoManutenzioneLabel(gruppo)}
                      </button>
                    ))
                  : null}
                {checkbox && isDaFare ? (
                  <button
                    type="button"
                    className="man2-row-menu__item"
                    role="menuitem"
                    onClick={() => {
                      setDaFareMenuId(null);
                      void handleCreaGruppoManutenzioni(item.targa, selectedIds);
                    }}
                  >
                    Crea gruppo
                  </button>
                ) : null}
                {groupKey && isDaFare ? (
                  <button
                    type="button"
                    className="man2-row-menu__item"
                    role="menuitem"
                    onClick={() => {
                      setDaFareMenuId(null);
                      void handleRimuoviDaGruppoManutenzioni(groupKey, item.id);
                    }}
                  >
                    Rimuovi dal gruppo
                  </button>
                ) : null}
                <button
                  type="button"
                  className="man2-row-menu__item"
                  role="menuitem"
                  onClick={() => {
                    setDaFareMenuId(null);
                    handleEdit(item);
                  }}
                >
                  Modifica
                </button>
                <button
                  type="button"
                  className="man2-row-menu__item"
                  role="menuitem"
                  onClick={() => {
                    setDaFareMenuId(null);
                    openDetailForRecord(item);
                  }}
                >
                  Apri
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  function renderDaFare() {
    return (
      <section className="man2-screen">
        <div className="man2-screen-head man2-screen-head--dashboard">
          <div>
            <h2 className="man2-screen-title">Da fare</h2>
          </div>
          <button type="button" className="man2-nav-btn man2-nav-btn--primary" onClick={() => setView("form")}>
            + Nuova manutenzione
          </button>
        </div>

        <div className="man2-field-row">
          <div className="man2-field">
            <label className="man2-field__label">Urgenza</label>
            <select
              value={daFareUrgenzaFilter}
              onChange={(event) => setDaFareUrgenzaFilter(event.target.value as DaFareUrgenzaFilter)}
              aria-label="Filtra manutenzioni da fare per urgenza"
            >
              <option value="tutte">Tutte</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="bassa">Bassa</option>
            </select>
          </div>
          <div className="man2-field">
            <label className="man2-field__label">Origine</label>
            <select
              value={daFareOrigineFilter}
              onChange={(event) => setDaFareOrigineFilter(event.target.value as DaFareOrigineFilter)}
              aria-label="Filtra manutenzioni da fare per origine"
            >
              <option value="tutte">Tutte</option>
              <option value="controllo">Controllo</option>
              <option value="segnalazione">Segnalazione</option>
              <option value="manuale">Manuale</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          className="man2-section-title man2-grp-toggle"
          aria-expanded={segnalazioniDaFareExpanded}
          onClick={() => setSegnalazioniDaFareExpanded((current) => !current)}
        >
          <span>{segnalazioniDaFareExpanded ? "▾" : "▸"}</span>
          <span>Segnalazioni aperte ({segnalazioniEleggibili.length})</span>
        </button>
        {segnalazioniDaFareExpanded ? (
          <>
            {lavoroGruppoRetryState ? (
              <div className="man2-grp-alert">
                <span>
                  Lavoro creato, {lavoroGruppoRetryState.failedIds.length} segnalazioni non agganciate.
                </span>
                <button
                  type="button"
                  className="man2-grp-btn"
                  disabled={saving}
                  onClick={() => void handleRetryAggancioLavoroGruppo()}
                >
                  Riprova
                </button>
              </div>
            ) : null}
            <div className="man2-grp-list">
              {segnalazioniDaFareByTarga.length > 0 ? (
                segnalazioniDaFareByTarga.map((targaGroup) => {
                  const selectedFreeIdsForTarga = targaGroup.libere
                    .filter((item) => selectedSegnalazioneIds.includes(item.id))
                    .map((item) => item.id);
                  return (
                    <section key={targaGroup.targa} className="man2-grp-targa">
                      <div className="man2-grp-targa__head">
                        <span>{targaGroup.targa}</span>
                        <span>
                          {targaGroup.gruppi.reduce((sum, gruppo) => sum + gruppo.segnalazioni.length, 0) +
                            targaGroup.libere.length}{" "}
                          segnalazioni
                        </span>
                      </div>
                      {targaGroup.gruppi.map((gruppo) => {
                        const selectedIds = selectedGruppoSegnalazioneIds[gruppo.key] ?? [];
                        return (
                          <article key={gruppo.key} className="man2-grp-card">
                            <div className="man2-grp-card__head">
                              <div>
                                <div className="man2-grp-card__title">Gruppo segnalazioni</div>
                                <div className="man2-grp-card__meta">
                                  {gruppo.segnalazioni.length} aperte su {gruppo.targa}
                                  {selectedIds.length > 0 ? ` - ${selectedIds.length} selezionate` : ""}
                                </div>
                              </div>
                              <div className="man2-grp-card__actions">
                                <button
                                  type="button"
                                  className="man2-grp-btn man2-grp-btn--ghost"
                                  disabled={saving}
                                  onClick={() => void handleCreaLavoroDaGruppo(gruppo)}
                                >
                                  Crea lavoro (Da fare)
                                </button>
                                {renderGruppoSegnalazioniMenu(gruppo)}
                              </div>
                            </div>
                            <div className="man2-grp-rows">
                              {gruppo.segnalazioni.map((item) =>
                                renderSegnalazioneRow({
                                  item,
                                  checked: selectedIds.includes(item.id),
                                  onToggle: () => toggleGruppoSegnalazioneSelection(gruppo.key, item.id),
                                  action: renderSegnalazioneGruppoMenu({ item, groupKey: gruppo.key }),
                                }),
                              )}
                            </div>
                          </article>
                        );
                      })}
                      {targaGroup.libere.length > 0 ? (
                        <article className="man2-grp-card man2-grp-card--free">
                          <div className="man2-grp-card__head">
                            <div>
                              <div className="man2-grp-card__title">Non raggruppate</div>
                              <div className="man2-grp-card__meta">
                                {targaGroup.libere.length} segnalazioni disponibili
                                {selectedFreeIdsForTarga.length > 0
                                  ? ` - ${selectedFreeIdsForTarga.length} selezionate`
                                  : ""}
                              </div>
                            </div>
                          </div>
                          <div className="man2-grp-rows">
                            {targaGroup.libere.map((item) =>
                              renderSegnalazioneRow({
                                item,
                                checked: selectedSegnalazioneIds.includes(item.id),
                                onToggle: () => toggleSegnalazioneLiberaSelection(item.id),
                                action: renderSegnalazioneNonRaggruppataMenu({
                                  item,
                                  targaGroup,
                                  selectedFreeIdsForTarga,
                                }),
                              }),
                            )}
                          </div>
                        </article>
                      ) : null}
                    </section>
                  );
                })
              ) : (
                <div className="man-empty">Nessuna segnalazione aperta non collegata con i filtri correnti.</div>
              )}
            </div>
          </>
        ) : null}

        <div className="man2-section-title">
          Manutenzioni operative ({manutenzioniOperativeFiltrate.length})
        </div>
        <div className="man2-last-list">
          {manutenzioniOperativeFiltrate.length > 0 ? (
            <>
              {manutenzioniOperativeGrouped.gruppi.map((gruppo) => (
                <article key={gruppo.key} className="man2-grp-card">
                  <div className="man2-grp-card__head">
                    <div>
                      <div className="man2-grp-card__title">Gruppo manutenzioni</div>
                      <div className="man2-grp-card__meta">
                        {gruppo.manutenzioni.length} da fare su {gruppo.targa}
                      </div>
                    </div>
                  </div>
                  <div className="man2-last-list">
                    {gruppo.manutenzioni.map((item) =>
                      renderManutenzioneOperativaCard({
                        item,
                        groupKey: gruppo.key,
                      }),
                    )}
                  </div>
                </article>
              ))}
              {manutenzioniOperativeGrouped.libere.map((item) => {
                const selectedFreeIdsForTarga = manutenzioniOperativeGrouped.libere
                  .filter((entry) => entry.targa === item.targa && selectedManutenzioneLiberaIds.includes(entry.id))
                  .map((entry) => entry.id);
                const targetGroups = manutenzioniOperativeGrouped.gruppi.filter((gruppo) => gruppo.targa === item.targa);
                return renderManutenzioneOperativaCard({
                  item,
                  checkbox: {
                    checked: selectedManutenzioneLiberaIds.includes(item.id),
                    onToggle: () => toggleManutenzioneLiberaSelection(item.id),
                  },
                  selectedFreeIdsForTarga,
                  targetGroups,
                });
              })}
              {manutenzioniOperativeGrouped.altre.map((item) =>
                renderManutenzioneOperativaCard({ item }),
              )}
            </>
          ) : (
            <div className="man-empty">Nessuna manutenzione da fare o programmata con i filtri correnti.</div>
          )}
        </div>
      </section>
    );
  }

  function renderDashboard() {
    const interventiMezzo = storicoMezzoVisibile.filter((item) => item.tipo === "mezzo").length;
    const interventiCompressore = storicoMezzoVisibile.filter((item) => item.tipo === "compressore").length;

    return (
      <section className="man2-screen">
        <div className="man2-screen-head man2-screen-head--dashboard">
          <div>
            <h2 className="man2-screen-title">Dashboard</h2>
          </div>
        </div>

        <div className="man2-dash-kpis">
          <article className="man2-kpi">
            <div className="man2-kpi__label">Interventi mezzo</div>
            <div className="man2-kpi__value">{interventiMezzo}</div>
            <div className="man2-kpi__sub">su {activeTarga || "nessuna targa"}</div>
          </article>
          <article className="man2-kpi">
            <div className="man2-kpi__label">Interventi compressore</div>
            <div className="man2-kpi__value">{interventiCompressore}</div>
            <div className="man2-kpi__sub">su {activeTarga || "nessuna targa"}</div>
          </article>
          <article className="man2-kpi">
            <div className="man2-kpi__label">Ultimo intervento</div>
            <div className="man2-kpi__value">{latestRecord ? formatDateShort(latestRecord.data) : "Nessuno"}</div>
            <div className="man2-kpi__sub">
              {latestRecord ? buildDescrizioneSnippet(latestRecord.descrizione, 38) : "nessun dato"}
            </div>
          </article>
          <article className="man2-kpi">
            <div className="man2-kpi__label">Manutenzioni da fare</div>
            <div className="man2-kpi__value">{lavoriApertiMezzo}</div>
            <div className="man2-kpi__sub">{lavoriApertiMezzo === 0 ? "nessuna" : "da fare"}</div>
          </article>
        </div>

        <div className="man2-nav-veloce">
          <button type="button" className="man2-nav-btn man2-nav-btn--primary" onClick={() => setView("form")}>
            + Nuova manutenzione
          </button>
          <button type="button" className="man2-nav-btn" onClick={() => setView("mappa")} disabled={!activeTarga}>
            Dettaglio mezzo
          </button>
          <button type="button" className="man2-nav-btn" onClick={() => setView("pdf")}>
            Quadro PDF
          </button>
          <button
            type="button"
            className="man2-nav-btn"
            onClick={() => mezzoPreviewSelezionato && navigate(buildNextDossierPath(mezzoPreviewSelezionato.targa))}
            disabled={!mezzoPreviewSelezionato}
          >
            Dossier mezzo
          </button>
        </div>

        <div className="man2-section-title">Ultimi interventi</div>
        <div className="man2-last-list">
          {ultimiInterventi.length > 0 ? (
            ultimiInterventi.slice(0, 3).map((item) => (
              <button
                key={item.id}
                type="button"
                className={`man2-last-item man2-last-item--button${selectedDetailRecordId === item.id ? " is-active" : ""}`}
                onClick={() => openDetailForRecord(item)}
              >
                <div className="man2-last-item__row1">
                  <div>
                    <span className="man2-last-item__title">{buildDescrizioneSnippet(item.descrizione, 40)}</span>
                    <div className="man2-last-item__meta">
                      {[
                        formatDateShort(item.data),
                        buildMisuraLabel(item),
                        item.fornitore || null,
                        formatMaintenanceImporto(item),
                        item.sottotipo || null,
                      ]
                        .filter(Boolean)
                        .join(" - ")}
                    </div>
                  </div>
                  <div className="man2-last-item__meta">
                    <span
                      className={`man2-badge man2-badge--${item.tipo}`}
                      style={getMaintenanceStatoBadgeStyle(resolveMaintenanceStato(item))}
                      title={buildChiusuraDaEventoTitle(item)}
                    >
                      {formatMaintenanceStatoLabelDisplay(item)}
                    </span>
                    <span className={`man2-badge man2-badge--${item.tipo}`}>{item.tipo}</span>
                  </div>
                </div>
                <FraseStoriaRecord
                  {...recordChiusoFromRaw(item as unknown as Record<string, unknown>, undefined, {
                    sourceRecords: resolveSourceRecordsForItem(item as unknown as Record<string, unknown>),
                  })}
                  compact
                  as="span"
                />
              </button>
            ))
          ) : (
            <div className="man-empty">Nessun intervento disponibile per il mezzo selezionato.</div>
          )}
        </div>
      </section>
    );
  }
  function renderForm() {
    const misuraValue = tipo === "mezzo" ? km : ore;
    const isNewRecordForm = !editingId;
    const showSegnalataDaField = isNewRecordForm && createAsDaFare;
    const showOfficinaField = !isNewRecordForm || !createAsDaFare;

    return (
      <section className="man2-screen">
        <div className="man2-form-shell">
            <div className="man2-screen-head man2-screen-head--form">
            <div>
              <h2 className="man2-screen-title">{editingId ? "Modifica manutenzione" : "Nuova manutenzione"}</h2>
            </div>
            <div className="man2-screen-context">
              <span className="man2-screen-context__label">Mezzo attivo</span>
              <strong>{mezzoPreviewSelezionato?.targa || activeTarga || "Nessuno"}</strong>
              <span>{mezzoPreviewSelezionato?.marcaModello || "Seleziona un mezzo dalla testata superiore"}</span>
            </div>
          </div>

          {!editingId ? (
            <div className="man2-field-row">
              <div className="man2-field">
                <span className="man2-field__label">Stato iniziale</span>
                <div
                  role="group"
                  aria-label="Stato iniziale manutenzione"
                  style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                >
                  <button
                    type="button"
                    className={createAsDaFare ? "man2-nav-btn man2-nav-btn--primary" : "man2-nav-btn"}
                    style={createAsDaFare ? INITIAL_STATE_TOGGLE_ACTIVE_STYLE : undefined}
                    aria-pressed={createAsDaFare}
                    onClick={() => setCreateAsDaFare(true)}
                  >
                    Da fare
                  </button>
                  <button
                    type="button"
                    className={!createAsDaFare ? "man2-nav-btn man2-nav-btn--primary" : "man2-nav-btn"}
                    style={!createAsDaFare ? INITIAL_STATE_TOGGLE_ACTIVE_STYLE : undefined}
                    aria-pressed={!createAsDaFare}
                    onClick={() => setCreateAsDaFare(false)}
                  >
                    Eseguita
                  </button>
                </div>
              </div>
              {createAsDaFare ? (
                <div className="man2-field">
                  <label className="man2-field__label">Urgenza</label>
                  <select
                    value={draftUrgenza}
                    onChange={(event) => setDraftUrgenza(event.target.value as NextManutenzioneUrgenza)}
                    aria-label="Urgenza manutenzione da fare"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="bassa">Bassa</option>
                  </select>
                </div>
              ) : null}
            </div>
          ) : null}

          <section className="man2-form-block">
            <div className="man2-section-title">Campi base</div>
            <div className="man2-field-row3">
              <div className="man2-field">
                <label className="man2-field__label">Mezzo</label>
                <select
                  value={targa}
                  onChange={(event) => handleSelectContextTarga(event.target.value)}
                  aria-label="Seleziona mezzo per la manutenzione"
                >
                  <option value="">- Seleziona mezzo -</option>
                  {mezzi.map((mezzo) => (
                    <option key={mezzo.id} value={mezzo.targa}>
                      {mezzo.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="man2-field">
                <label className="man2-field__label">Tipo</label>
                <select value={tipo} onChange={(event) => setTipo(event.target.value as TipoVoce)}>
                  <option value="mezzo">Mezzo</option>
                  <option value="compressore">Compressore</option>
                  <option value="attrezzature">Attrezzature</option>
                </select>
              </div>
              <div className="man2-field">
                <label className="man2-field__label">Sottotipo</label>
                <select
                  value={uiSubtype}
                  onChange={(event) => handleUiSubtypeChange(event.target.value as InterventoUiSubtype)}
                  title="Scegli il ramo operativo della manutenzione. Le gomme ordinarie aggiornano lo stato per asse, le straordinarie restano eventi separati."
                  aria-label="Sottotipo manutenzione"
                >
                  <option value="tagliando">Tagliando</option>
                  <option value="tagliando completo">Tagliando completo</option>
                  <option value="gomme">Gomme ordinarie per asse</option>
                  <option value="gomme-straordinario">Gomme straordinarie</option>
                  <option value="riparazione">Riparazione</option>
                  <option value="altro">Altro</option>
                </select>
              </div>
            </div>

            <div className="man2-metric-row">
              <div className="man2-field man2-metric-group man2-metric-group--date">
                <label className="man2-field__label">Data</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="GG/MM/AAAA"
                  value={toDisplay(data) || data}
                  onChange={(event) => setData(formatDateDigitsInput(event.target.value))}
                />
                {(() => {
                  // PROMPT 45 T4: messaggio errore solo se l'utente ha digitato qualcosa di "completo"
                  // (>= 10 caratteri o due slash) che non risulta parsabile da dateUnica.
                  const trimmed = String(data ?? "").trim();
                  if (!trimmed) return null;
                  const looksComplete =
                    trimmed.length >= 10 || (trimmed.match(/\//g)?.length ?? 0) >= 2;
                  if (!looksComplete) return null;
                  if (toDisplay(trimmed)) return null;
                  return (
                    <small
                      className="man2-field-error"
                      style={{ color: "#b91c1c", display: "block", marginTop: 4 }}
                    >
                      Data non valida. Formato atteso GG/MM/AAAA.
                    </small>
                  );
                })()}
              </div>
              <div className="man2-field man2-metric-group man2-metric-group--metric">
                <label className="man2-field__label">
                  {tipo === "mezzo"
                    ? isUiSubtypeGommeOrdinario(uiSubtype) && !categoriaMotorizzata
                      ? "KM (facoltativo)"
                      : isUiSubtypeGommeStraordinario(uiSubtype)
                        ? "KM mezzo (facoltativo)"
                      : "KM"
                    : "ORE"}
                </label>
                <input
                  type="number"
                  value={misuraValue}
                  onChange={(event) => {
                    if (tipo === "mezzo") {
                      setKm(event.target.value);
                      return;
                    }
                    setOre(event.target.value);
                  }}
                  inputMode="numeric"
                />
              </div>
              {showSegnalataDaField ? (
                <div className="man2-field man2-metric-group man2-metric-group--supplier">
                  <label className="man2-field__label">Segnalata da</label>
                  <input
                    className="man2-text-strong-input"
                    type="text"
                    value={draftSegnalatoDa}
                    onChange={(event) => setDraftSegnalatoDa(event.target.value)}
                    list="man2-segnalata-da-autisti"
                    placeholder="Es. Mario Rossi"
                    autoComplete="off"
                  />
                  <datalist id="man2-segnalata-da-autisti">
                    {autisti.map((autista) => (
                      <option key={autista.id} value={autista.nome} />
                    ))}
                  </datalist>
                </div>
              ) : null}
              {showOfficinaField ? (
                <div className="man2-field man2-metric-group man2-metric-group--supplier man2-text-strong-input">
                  <label className="man2-field__label">Officina</label>
                  <OfficinaAutocomplete
                    value={fornitore}
                    onChange={setFornitore}
                    officine={officine}
                    placeholder="Es. Officina Rossi"
                  />
                </div>
              ) : null}
              <div className="man2-field man2-metric-group man2-metric-group--supplier">
                <label className="man2-field__label">Importo</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={importo}
                  onChange={(event) => setImporto(event.target.value)}
                  placeholder="Es. 120.00"
                  inputMode="decimal"
                />
              </div>
            </div>

            {!editingId && !createAsDaFare && scadenzeDelMezzo.length > 0 ? (
              <div className="man2-field" style={{ marginTop: 12 }}>
                <label className="man2-field__label">Aggiorna scadenza del mezzo (opzionale)</label>
                <select
                  value={selectedScadenzaId}
                  onChange={(event) => setSelectedScadenzaId(event.target.value)}
                  aria-label="Scadenza del mezzo da aggiornare con questa esecuzione"
                >
                  <option value="">— Nessuna —</option>
                  {scadenzeDelMezzo.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <small style={{ color: "#64748b", marginTop: 4, display: "block" }}>
                  Se selezioni una scadenza, questa data (e i km) diventano l'ultima esecuzione e la
                  prossima scadenza viene ricalcolata.
                </small>
              </div>
            ) : null}

            {isUiSubtypeGommeOrdinario(uiSubtype) ? (
              <div className="man2-assi-section">
                <div
                  className="man2-section-title"
                  title="Aggiorna lo stato gomme ordinario del mezzo asse per asse."
                >
                  Cambio gomme ordinario per asse
                </div>
                {assiDisponibili.length > 0 ? (
                  <>
                    <div className="man2-assi-chip-row">
                      {assiDisponibili.map((asse) => {
                        const isActive = assiCoinvolti.includes(asse.id);
                        return (
                          <button
                            key={asse.id}
                            type="button"
                            className={`man2-assi-chip${isActive ? " is-active" : ""}`}
                            onClick={() => toggleAsseCoinvolto(asse.id)}
                            title={`Seleziona ${asse.label} per il cambio gomme ordinario.`}
                            aria-label={`Asse ${asse.label}, ${asse.wheelsCount} gomme`}
                          >
                            <span>{asse.label}</span>
                            <small>{asse.wheelsCount} gomme</small>
                          </button>
                        );
                      })}
                    </div>

                    {gommePerAsseDraft.length > 0 ? (
                      <div className="man2-gomme-asse-list">
                        {gommePerAsseDraft.map((entry) => (
                          <article key={entry.asseId} className="man2-gomme-asse-card">
                            <div className="man2-gomme-asse-card__head">
                              <strong>
                                {assiDisponibili.find((asse) => asse.id === entry.asseId)?.label ?? entry.asseId}
                              </strong>
                              <span>{categoriaMotorizzata ? "mezzo motorizzato" : "rimorchio / semirimorchio"}</span>
                            </div>
                            <div className="man2-gomme-asse-card__meta">
                              <div>
                                <span>Data cambio</span>
                                <strong>{toDisplay(entry.dataCambio) || entry.dataCambio || "DA INSERIRE"}</strong>
                              </div>
                              {categoriaMotorizzata ? (
                                <div>
                                  <span>Km cambio</span>
                                  <strong>
                                    {entry.kmCambio !== null ? formatNumberIt(entry.kmCambio) : "DA INSERIRE"}
                                  </strong>
                                </div>
                              ) : (
                                <div>
                                  <span>Nota</span>
                                  <strong>Per questa categoria fa fede soprattutto la data cambio.</strong>
                                </div>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="man2-assi-empty">
                        Seleziona almeno un asse per costruire lo stato gomme dell&apos;intervento.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="man2-assi-empty">
                    Nessuna tavola tecnica disponibile per la categoria del mezzo selezionato.
                  </div>
                )}
              </div>
            ) : null}

            {isUiSubtypeGommeStraordinario(uiSubtype) ? (
              <div className="man2-assi-section man2-assi-section--straordinario">
                <div
                  className="man2-section-title"
                  title="Registra un evento gomme puntuale senza aggiornare lo stato ordinario per asse."
                >
                  Evento gomme straordinario
                </div>
                <div className="man2-field-row3 man2-field-row3--gomme-straordinarie">
                  <div className="man2-field">
                    <label className="man2-field__label">Motivo straordinario</label>
                    <select
                      value={gommeStraordinarioMotivo}
                      onChange={(event) => setGommeStraordinarioMotivo(event.target.value)}
                      title="Spiega il motivo dell'intervento straordinario."
                      aria-label="Motivo intervento gomme straordinario"
                    >
                      <option value="">- Seleziona motivo -</option>
                      <option value="gomma singola">Gomma singola</option>
                      <option value="sostituzione urgente">Sostituzione urgente</option>
                      <option value="foratura / danno">Foratura / danno</option>
                      <option value="intervento non pianificato">Intervento non pianificato</option>
                      <option value="altro">Altro</option>
                    </select>
                  </div>
                  <div className="man2-field">
                    <label className="man2-field__label">Asse coinvolto (facoltativo)</label>
                    <select
                      value={gommeStraordinarioAsseId}
                      onChange={(event) =>
                        setGommeStraordinarioAsseId(event.target.value as AsseCoinvoltoId | "")
                      }
                      title="Indica l'asse solo se l'intervento straordinario riguarda una zona precisa."
                      aria-label="Asse coinvolto evento gomme straordinario"
                    >
                      <option value="">Non specificato</option>
                      {assiDisponibili.map((asse) => (
                        <option key={asse.id} value={asse.id}>
                          {asse.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="man2-field">
                    <label className="man2-field__label">Numero gomme coinvolte (facoltativo)</label>
                    <input
                      type="number"
                      min="1"
                      value={gommeStraordinarioQuantita}
                      onChange={(event) => setGommeStraordinarioQuantita(event.target.value)}
                      inputMode="numeric"
                      placeholder="Es. 1"
                      title="Numero di gomme coinvolte nell'evento straordinario."
                      aria-label="Numero gomme coinvolte"
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <section className="man2-form-block">
            <div className="man2-section-title">Descrizione / note</div>
            <div className="man2-field">
              <label className="man2-field__label">Dettaglio intervento</label>
              <textarea
                className="man2-text-strong-input"
                rows={4}
                value={descrizione}
                onChange={(event) => setDescrizione(event.target.value)}
                placeholder="Es. Sostituzione pastiglie freno anteriori"
              />
            </div>
          </section>

          {editingId && selectedDetailRecord
            ? (() => {
                const refs =
                  selectedDetailRecord.origineRefs && selectedDetailRecord.origineRefs.length > 0
                    ? selectedDetailRecord.origineRefs
                    : selectedDetailRecord.origineRefKey &&
                        selectedDetailRecord.origineRefId &&
                        selectedDetailRecord.origineTipo
                      ? [
                          {
                            tipo: selectedDetailRecord.origineTipo,
                            refKey: selectedDetailRecord.origineRefKey,
                            refId: selectedDetailRecord.origineRefId,
                          },
                        ]
                      : [];
                const segnRefs = refs.filter((ref) => ref.tipo === "segnalazione");
                if (segnRefs.length === 0) return null;
                return (
                  <section className="man2-form-block man2-form-block--accent">
                    <div className="man2-section-title">Segnalazione di origine (sola lettura)</div>
                    <div className="man2-origine-cards">
                      {segnRefs.map((origine, index) => {
                        const key = `${origine.refKey}:${origine.refId}`;
                        const rec = origineInlineMap[key] ?? null;
                        const details = rec ? buildOrigineDetails(rec) : [];
                        const get = (lab: string) => details.find((detail) => detail.label === lab)?.value ?? null;
                        const autista = get("Autista");
                        const dataSegn = get("Data");
                        const problema = get("Problema") ?? get("KO");
                        const descrizioneSegn = get("Descrizione");
                        return (
                          <article key={`${key}:${index}`} className="man2-origine-card">
                            <div className="man2-origine-card__top">
                              <span className="man2-origine-chip man2-origine-chip--segn">Segnalazione</span>
                              {autista ? <span className="man2-origine-autista">{autista}</span> : null}
                              {dataSegn ? <span className="man2-origine-data">· {dataSegn}</span> : null}
                            </div>
                            {problema || descrizioneSegn ? (
                              <div className="man2-origine-card__body">
                                {problema ? <span className="man2-origine-prob">{problema}</span> : null}
                                {descrizioneSegn ? <span className="man2-origine-desc">{descrizioneSegn}</span> : null}
                              </div>
                            ) : (
                              <div className="man2-origine-card__empty">Dettaglio segnalazione non caricato.</div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })()
            : null}

          <section className="man2-form-block">
            <div className="man2-section-title">Cosa è stato fatto</div>
            <div className="man2-field">
              <label className="man2-field__label">Dettaglio esecuzione</label>
              <textarea
                className="man2-text-strong-input"
                rows={3}
                value={noteEsecuzione}
                onChange={(event) => setNoteEsecuzione(event.target.value)}
                placeholder="Es. Oltre alla segnalazione, sostituiti anche i dischi e rabboccato l'olio"
              />
            </div>
          </section>

          {uiSubtype === "tagliando completo" ? (
            <section className="man2-form-block man2-form-block--accent">
              <div className="man2-section-title">Tagliando completo</div>
              <div className="man2-tagliando-box">
                <div className="man2-chip-row">
                  {TAGLIANDO_COMPONENTI.map((item) => (
                    <span key={item} className="man2-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <section className="man2-form-block man2-form-block--materials">
            <div className="man2-section-title">Componenti inclusi / materiali</div>
            <div className="man2-material-shell">
              <div className="man-row man-row-materiale">
                <div className="man-materiale-left" style={{ flex: 1 }}>
                  <label className="man-label-block">
                    <span className="man-label-text">Cerca in inventario / inserisci materiale</span>
                    <input
                      className="man-input man2-text-strong-input"
                      value={materialeSearch}
                      onChange={(event) => setMaterialeSearch(event.target.value)}
                      placeholder="Es. PASTIGLIE FRENO, OLIO MOTORE..."
                    />
                  </label>

                  {materialeSearch && materialiSuggeriti.length > 0 ? (
                    <div className="man-autosuggest">
                      {materialiSuggeriti.map((item) => (
                        <div
                          key={item.id}
                          className="man-autosuggest-item"
                          onClick={() => {
                            if (!quantitaTemp || Number(quantitaTemp) <= 0) {
                              window.alert("Inserisci prima la quantita.");
                              return;
                            }
                            handleAddMateriale(item.label, Number(quantitaTemp), item.unita || "pz", true, item.id);
                          }}
                        >
                          <div className="man-autosuggest-main man2-material-suggest-main">
                            <span className="man-autosuggest-label man2-material-suggest-label">{item.label}</span>
                            {item.fornitoreLabel ? (
                              <span className="man-autosuggest-supplier man2-material-suggest-supplier">
                                Officina: {item.fornitoreLabel}
                              </span>
                            ) : null}
                          </div>
                          <div className="man-autosuggest-extra">
                            Disponibili: {item.quantitaTotale} {item.unita}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="man-materiale-right man2-material-side">
                  <label className="man-label-inline">
                    <span className="man-label-text">Quantita</span>
                    <input
                      className="man-input man-input-small"
                      value={quantitaTemp}
                      onChange={(event) => setQuantitaTemp(event.target.value)}
                      placeholder="Es. 2"
                      inputMode="numeric"
                    />
                  </label>
                  <button
                    type="button"
                    className="man2-btn"
                    onClick={() => {
                      if (!materialeSearch.trim()) {
                        window.alert("Inserisci il nome del materiale o selezionalo dall'inventario.");
                        return;
                      }
                      if (!quantitaTemp || Number(quantitaTemp) <= 0) {
                        window.alert("Inserisci una quantita valida.");
                        return;
                      }
                      handleAddMateriale(materialeSearch.toUpperCase(), Number(quantitaTemp), "pz", false);
                    }}
                  >
                    Aggiungi materiale
                  </button>
                </div>
              </div>

              {materialiTemp.length > 0 ? (
                <div className="man2-material-list">
                  {materialiTemp.map((item) => (
                    <div key={item.id} className="man2-material-row">
                      <span>
                        <strong>{item.label}</strong> - {item.quantita} {item.unita}
                        {item.fromInventario ? " (da inventario)" : ""}
                      </span>
                      <button type="button" className="man-delete-btn" onClick={() => handleRemoveMateriale(item.id)}>
                        Rimuovi
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="man-empty">Nessun materiale associato alla manutenzione corrente.</div>
              )}
            </div>
          </section>

          <div className="man2-form-actions">
            <button type="button" className="man2-btn-full" onClick={() => void handleSave()} disabled={saving}>
              Salva manutenzione
            </button>
          </div>
        </div>
      </section>
    );
  }
  function renderPdfPanel() {
    const renderPdfResultRow = (result: (typeof pdfVisibleResults)[number]) => {
      const previewItems = result.items.slice(0, 3);
      const metricColumnLabel = resolvePdfMetricColumnLabel(result.items);
      const deltaColumnLabel = result.metricInfo?.deltaLabel ?? "Δ km";

      return (
        <article key={`${result.subjectType}:${result.targa}`} className="man2-pdf-row">
          <div className="man2-pdf-row__media">
            {result.mezzo?.fotoUrl ? (
              <img src={result.mezzo.fotoUrl} alt={`Mezzo ${result.targa}`} className="man2-pdf-thumb" />
            ) : (
              <div className="man2-pdf-thumb man2-pdf-thumb--placeholder">{result.targa}</div>
            )}
          </div>
          <div className="man2-pdf-row__content">
            <div className="man2-pdf-row__meta">
              <div>
                <span className="man2-pdf-row__label">Targa</span>
                <button
                  type="button"
                  className="man2-pdf-targa-btn"
                  aria-label={`Apri dossier mezzo ${result.targa}`}
                  onClick={() => navigate(buildNextDossierPath(result.targa))}
                >
                  {result.targa}
                </button>
              </div>
              <div>
                <span className="man2-pdf-row__label">Mezzo / modello</span>
                <strong>{result.mezzo?.marcaModello ?? result.mezzo?.label ?? "DA VERIFICARE"}</strong>
              </div>
              <div>
                <span className="man2-pdf-row__label">Autista</span>
                <strong>{result.mezzo?.autistaNome || "DA VERIFICARE"}</strong>
              </div>
              {result.metricInfo ? (
                <div>
                  <span className="man2-pdf-row__label">{result.metricInfo.primaryLabel}</span>
                  <strong>{result.metricInfo.primaryValue}</strong>
                </div>
              ) : null}
              {result.metricInfo?.secondaryLabel ? (
                <div>
                  <span className="man2-pdf-row__label">{result.metricInfo.secondaryLabel}</span>
                  <strong>{result.metricInfo.secondaryValue}</strong>
                </div>
              ) : null}
              {result.metricInfo?.deltaLabel ? (
                <div>
                  <span className="man2-pdf-row__label">{result.metricInfo.deltaLabel}</span>
                  <strong>{result.metricInfo.deltaValue}</strong>
                </div>
              ) : null}
              <div>
                <span className="man2-pdf-row__label">Data</span>
                <strong>{toDisplay(result.latest.data) || "DA VERIFICARE"}</strong>
              </div>
              <div>
                <span className="man2-pdf-row__label">Tipo</span>
                <strong>{result.latest.tipo}</strong>
              </div>
            </div>

            <section className="man2-pdf-list" aria-label={`Ultime manutenzioni ${result.targa}`}>
              <div className="man2-pdf-list__head">
                <div className="man2-pdf-list__title">Ultime 3 manutenzioni</div>
                {result.total > 3 ? (
                  <button
                  type="button"
                  className="man2-pdf-list__button"
                  onClick={() => {
                      setModalOpenForTarga(`${result.subjectType}:${result.targa}`);
                      setPdfModalLayout("data");
                    }}
                >
                    Vedi tutte ({result.total}) →
                  </button>
                ) : null}
              </div>

              {previewItems.length > 0 ? (
                <div className="man2-pdf-list__table-wrap">
                  <table className="man2-pdf-list__table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Stato</th>
                        <th>{metricColumnLabel}</th>
                        <th>{deltaColumnLabel}</th>
                        <th>Tipo</th>
                        <th>Descrizione</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renderPdfRows({
                        subjectType: result.subjectType,
                        items: previewItems,
                        currentKm: result.currentKm,
                        currentOre: result.currentOre,
                        categoria: result.mezzo?.categoria ?? null,
                        showType: true,
                        showSupplier: false,
                        showActions: true,
                        variant: "list",
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="man2-pdf-list__empty">Nessuna manutenzione nel periodo selezionato.</div>
              )}
            </section>

            <div className="man2-pdf-row__actions">
              <button
                type="button"
                className="man2-btn"
                title="Esporta il PDF della targa selezionata con la foto reale del mezzo, se disponibile."
                aria-label={`Esporta PDF ${result.targa}`}
                onClick={() =>
                  void exportPdfForItems(
                    pdfFilteredItems.filter(
                      (item) => item.tipo === result.subjectType && item.targa === result.targa,
                    ),
                    `PDF ${result.subjectType} - ${result.targa}`,
                  )
                }
              >
                PDF
              </button>
              <button
                type="button"
                className="man2-btn man2-btn--secondary"
                onClick={() => openDetailForRecord(result.latest)}
              >
                Apri dettaglio
              </button>
            </div>
            {result.subjectType === "mezzo" && (result.gommePerAsse.length > 0 || result.gommeStraordinarie.length > 0) ? (
              <div className="man2-gomme-pdf-state">
                {result.gommePerAsse.length > 0 ? (
                  <div className="man2-gomme-pdf-block">
                    <div className="man2-gomme-pdf-state__title">Stato gomme ordinario per asse</div>
                    <div className="man2-gomme-pdf-state__grid">
                      {result.gommePerAsse.map((entry) => (
                        <div key={`${result.targa}:${entry.asseId}`} className="man2-gomme-pdf-axis">
                          <strong>{entry.asseLabel}</strong>
                          <span>Data cambio: {toDisplay(entry.dataCambio) || entry.dataCambio || "DA VERIFICARE"}</span>
                          {entry.isMotorizzato ? (
                            <>
                              <span>
                                Km cambio: {entry.kmCambio !== null ? formatNumberIt(entry.kmCambio) : "DA VERIFICARE"}
                              </span>
                              <span>
                                Km attuali: {entry.kmAttuali !== null ? formatNumberIt(entry.kmAttuali) : "DA VERIFICARE"}
                              </span>
                              {entry.kmPercorsi !== null ? (
                                <span>Km percorsi dal cambio: {formatNumberIt(entry.kmPercorsi)}</span>
                              ) : null}
                            </>
                          ) : (
                            <span>Per questa categoria fa fede soprattutto la data cambio.</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {result.gommeStraordinarie.length > 0 ? (
                  <div className="man2-gomme-pdf-block man2-gomme-pdf-block--straordinario">
                    <div className="man2-gomme-pdf-state__title">Eventi gomme straordinari</div>
                    <div className="man2-gomme-pdf-events">
                      {result.gommeStraordinarie.map((entry) => (
                        <div
                          key={`${result.targa}:${entry.sourceMaintenanceId}`}
                          className="man2-gomme-pdf-event"
                        >
                          <strong>{entry.motivo || "Evento gomme straordinario"}</strong>
                          <span>Data: {toDisplay(entry.dataLabel) || "DA VERIFICARE"}</span>
                          <span>Asse: {entry.asseLabel || "Non specificato"}</span>
                          <span>
                            Gomme coinvolte: {entry.quantita !== null ? formatNumberIt(entry.quantita) : "DA VERIFICARE"}
                          </span>
                          {entry.fornitore ? <span>Officina: {entry.fornitore}</span> : null}
                          {entry.descrizione ? <span>Nota: {buildDescrizioneSnippet(entry.descrizione, 120)}</span> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </article>
      );
    };

    return (
      <section className="man2-screen">
        <div className="man2-pdf-shell">
          <div className="man2-pdf-head">
            <div>
              <div className="man2-panel-kicker">Quadro manutenzioni PDF</div>
              <h2 className="man2-screen-title">Quadro manutenzioni PDF</h2>
            </div>
            <button
              type="button"
              className="man2-btn"
              title="Esporta il quadro corrente. Se il filtro riguarda una sola targa, il PDF usa la foto reale del mezzo."
              aria-label="Esporta il quadro manutenzioni"
              onClick={() =>
                void exportPdfForItems(
                  pdfVisibleItems,
                  `Quadro manutenzioni ${formatMonthFilterLabel(pdfPeriodFilter)}`,
                )
              }
            >
              PDF quadro generale
            </button>
          </div>

          <div className="man2-pdf-steps">
            <div className="man2-pdf-step">
              <span className="man2-pdf-step__index">Step 1</span>
              <div className="man2-form-title">Soggetto</div>
              <div className="man2-field">
                <label className="man2-field__label">Filtro soggetto</label>
                <select
                  value={pdfSubjectType}
                  onChange={(event) => setPdfSubjectType(event.target.value as PdfSubjectSelection)}
                  title="Scegli se leggere il quadro per mezzo, compressore, attrezzature o tutti i soggetti."
                  aria-label="Filtro soggetto quadro manutenzioni"
                >
                  <option value="mezzo">Mezzo</option>
                  <option value="compressore">Compressore</option>
                  <option value="attrezzature">Attrezzature</option>
                  <option value="tutti">Tutti</option>
                </select>
              </div>
            </div>
            <div className="man2-pdf-step">
              <span className="man2-pdf-step__index">Step 2</span>
              <div className="man2-form-title">Periodo</div>
              <div className="man2-field">
                <label className="man2-field__label">Filtro periodo</label>
                <select
                  value={pdfPeriodFilter}
                  onChange={(event) => setPdfPeriodFilter(event.target.value as PdfPeriodFilter)}
                  title="Limita il quadro al periodo desiderato."
                  aria-label="Filtro periodo quadro manutenzioni"
                >
                  <option value="tutto">Tutto</option>
                  <option value="ultimo-mese">Ultimo mese</option>
                  {monthOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatMonthFilterLabel(option)}
                    </option>
                  ))}
                </select>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 10,
                    fontSize: 13,
                    color: "#374151",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={pdfIncludeOperative}
                    onChange={(event) => setPdfIncludeOperative(event.target.checked)}
                  />
                  Includi da fare e programmate
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="man2-section-title">Risultati esportabili</div>
        <div className="man2-pdf-results">
          {pdfVisibleResults.length > 0 ? (
            pdfSubjectType === "tutti" ? (
              pdfVisibleSections.map((section) => (
                <Fragment key={section.subjectType}>
                  <div className="man2-section-title">{section.title}</div>
                  {section.results.map(renderPdfResultRow)}
                </Fragment>
              ))
            ) : (
              pdfVisibleResults.map(renderPdfResultRow)
            )
          ) : (
            <div className="man-empty">Nessun risultato disponibile con i filtri attuali.</div>
          )}
        </div>

        {pdfModalResult ? (
          <div
            className="man2-pdf-modal__overlay"
            role="presentation"
            onClick={() => {
              setModalOpenForTarga(null);
              setPdfModalLayout("data");
            }}
          >
            <div
              className="man2-pdf-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="man2-pdf-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="man2-pdf-modal__head">
                <div>
                  <h2 id="man2-pdf-modal-title" className="man2-pdf-modal__title">
                    Tutte le manutenzioni — {pdfModalResult.targa}
                  </h2>
                  <div className="man2-pdf-modal__sub">
                    {pdfModalResult.mezzo?.marcaModello || "DA VERIFICARE"} ·{" "}
                    {pdfModalResult.mezzo?.autistaNome || "DA VERIFICARE"} · Periodo: {pdfModalPeriodLabel} ·{" "}
                    {resolvePdfListTitle(pdfModalResult.total)}
                  </div>
                </div>
                <button
                  type="button"
                  className="man2-pdf-modal__close"
                  aria-label={`Chiudi modale manutenzioni ${pdfModalResult.targa}`}
                  onClick={() => {
                    setModalOpenForTarga(null);
                    setPdfModalLayout("data");
                  }}
                >
                  ×
                </button>
              </div>

              <div className="man2-pdf-modal__info">
                <span>
                  {pdfModalResult.metricInfo?.primaryLabel || "Valore attuale"}:{" "}
                  <strong>{pdfModalResult.metricInfo?.primaryValue || "DA VERIFICARE"}</strong>
                </span>
                <span>
                  · La colonna {pdfModalResult.metricInfo?.deltaLabel || "Δ km"} mostra come varia la metrica dal
                  singolo intervento ad oggi
                </span>
              </div>

              <div className="man2-pdf-modal__tabs" role="tablist" aria-label="Layout modale manutenzioni">
                <button
                  type="button"
                  className={`man2-pdf-modal__tab${pdfModalLayout === "data" ? " is-active" : ""}`}
                  onClick={() => setPdfModalLayout("data")}
                >
                  A — Per data
                </button>
                <button
                  type="button"
                  className={`man2-pdf-modal__tab${pdfModalLayout === "month" ? " is-active" : ""}`}
                  onClick={() => setPdfModalLayout("month")}
                >
                  B — Per mese
                </button>
                <button
                  type="button"
                  className={`man2-pdf-modal__tab${pdfModalLayout === "type" ? " is-active" : ""}`}
                  onClick={() => setPdfModalLayout("type")}
                >
                  C — Per tipo
                </button>
              </div>

              <div className="man2-pdf-modal__content">
                {pdfModalLayout === "data" ? (
                  <div className="man2-pdf-modal__table-wrap">
                    <table className="man2-pdf-modal__table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Stato</th>
                          <th>{resolvePdfMetricColumnLabel(pdfModalResult.items)}</th>
                          <th>{pdfModalResult.metricInfo?.deltaLabel || "Δ km"}</th>
                          <th>Tipo</th>
                          <th>Descrizione</th>
                          <th>Officina</th>
                          <th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderPdfRows({
                          subjectType: pdfModalResult.subjectType,
                          items: pdfModalResult.items,
                          currentKm: pdfModalResult.currentKm,
                          currentOre: pdfModalResult.currentOre,
                          categoria: pdfModalResult.mezzo?.categoria ?? null,
                          showType: true,
                          showSupplier: true,
                          showActions: true,
                          variant: "modal",
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {pdfModalLayout === "month"
                  ? pdfModalMonthGroups.map((group) => (
                      <section key={group.key} className="man2-pdf-modal__month-group">
                        <div className="man2-pdf-modal__month-head">{group.label}</div>
                        <div className="man2-pdf-modal__table-wrap">
                          <table className="man2-pdf-modal__table">
                            <thead>
                              <tr>
                                <th>Data</th>
                                <th>Stato</th>
                                <th>{resolvePdfMetricColumnLabel(group.items)}</th>
                                <th>{pdfModalResult.metricInfo?.deltaLabel || "Δ km"}</th>
                                <th>Tipo</th>
                                <th>Descrizione</th>
                                <th>Azioni</th>
                              </tr>
                            </thead>
                            <tbody>
                              {renderPdfRows({
                                subjectType: pdfModalResult.subjectType,
                                items: group.items,
                                currentKm: pdfModalResult.currentKm,
                                currentOre: pdfModalResult.currentOre,
                                categoria: pdfModalResult.mezzo?.categoria ?? null,
                                showType: true,
                                showSupplier: false,
                                showActions: true,
                                variant: "modal",
                              })}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    ))
                  : null}

                {pdfModalLayout === "type"
                  ? pdfModalTypeGroups.map((group) => (
                      <section key={group.key} className="man2-pdf-modal__type-group">
                        <div className="man2-pdf-modal__type-head">
                          <div className="man2-pdf-modal__type-icon">{group.icon}</div>
                          <div className="man2-pdf-modal__type-label">{group.label}</div>
                          <div className="man2-pdf-modal__type-count">· {group.countLabel}</div>
                        </div>
                        <div className="man2-pdf-modal__table-wrap">
                          <table className="man2-pdf-modal__table">
                            <tbody>
                              {renderPdfRows({
                                subjectType: pdfModalResult.subjectType,
                                items: group.items,
                                currentKm: pdfModalResult.currentKm,
                                currentOre: pdfModalResult.currentOre,
                                categoria: pdfModalResult.mezzo?.categoria ?? null,
                                showType: false,
                                showSupplier: false,
                                showActions: true,
                                variant: "modal",
                              })}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    ))
                  : null}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  function renderOriginePanel() {
    const origineRefs =
      selectedDetailRecord?.origineRefs && selectedDetailRecord.origineRefs.length > 0
        ? selectedDetailRecord.origineRefs
        : selectedDetailRecord?.origineRefKey && selectedDetailRecord.origineRefId && selectedDetailRecord.origineTipo
          ? [
              {
                tipo: selectedDetailRecord.origineTipo,
                refKey: selectedDetailRecord.origineRefKey,
                refId: selectedDetailRecord.origineRefId,
              },
            ]
          : [];
    if (origineRefs.length === 0) {
      return null;
    }
    return (
      <section className="man2-screen">
        <div className="man2-origine-head">
          <h2 className="man2-screen-title">Origini ({origineRefs.length})</h2>
          <span className="man2-origine-note">Segnalazioni e controlli che hanno generato questa manutenzione</span>
        </div>
        {origineModalError ? <div className="man2-feedback man2-feedback--error">{origineModalError}</div> : null}
        <div className="man2-origine-cards">
          {origineRefs.map((origine, index) => {
            const key = `${origine.refKey}:${origine.refId}`;
            const isSegn = origine.tipo === "segnalazione";
            const vediLabel = isSegn
              ? "Vedi segnalazione"
              : origine.tipo === "controllo"
                ? "Vedi controllo"
                : "Vedi origine";
            const rec = origineInlineMap[key] ?? null;
            const details = rec ? buildOrigineDetails(rec) : [];
            const get = (lab: string) => details.find((detail) => detail.label === lab)?.value ?? null;
            const autista = get("Autista");
            const data = get("Data");
            const problema = get("Problema") ?? get("KO");
            const descrizione = get("Descrizione");
            return (
              <article key={`${key}:${index}`} className="man2-origine-card">
                <div className="man2-origine-card__top">
                  <span className={`man2-origine-chip man2-origine-chip--${isSegn ? "segn" : "ctrl"}`}>
                    {isSegn ? "Segnalazione" : origine.tipo === "controllo" ? "Controllo" : "Origine"}
                  </span>
                  {autista ? <span className="man2-origine-autista">{autista}</span> : null}
                  {data ? <span className="man2-origine-data">· {data}</span> : null}
                  <div className="man2-origine-card__actions">
                    <button
                      type="button"
                      className="man2-origine-btn"
                      onClick={() => void handleOpenOrigineRef(origine.refKey, origine.refId)}
                      disabled={origineModalLoading}
                    >
                      {origineModalLoading ? "..." : vediLabel}
                    </button>
                    {isSegn ? (
                      <button
                        type="button"
                        className="man2-origine-btn"
                        onClick={() => void handleRiapriOrigineSegnalazione(origine.refId)}
                        disabled={saving}
                      >
                        Riapri
                      </button>
                    ) : null}
                    {isSegn ? (
                      <button
                        type="button"
                        className="man2-origine-btn"
                        style={{ color: "#b91c1c" }}
                        onClick={() => void handleDeleteSegnalazioneById(origine.refId)}
                        disabled={saving}
                      >
                        Elimina
                      </button>
                    ) : null}
                  </div>
                </div>
                {problema || descrizione ? (
                  <div className="man2-origine-card__body">
                    {problema ? <span className="man2-origine-prob">{problema}</span> : null}
                    {descrizione ? <span className="man2-origine-desc">{descrizione}</span> : null}
                  </div>
                ) : (
                  <div className="man2-origine-card__empty">
                    Dettaglio non caricato — apri con &quot;{vediLabel}&quot;.
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  function renderPdfDeleteModal() {
    const record = pdfDeleteCandidate;
    if (!record) return null;
    const dataLabel = toDisplay(record.data) || record.data || "data non disponibile";
    const close = () => {
      if (!pdfDeleteBusy) setPdfDeleteCandidate(null);
    };
    return (
      <div
        className="man2-pdf-modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-label="Elimina manutenzione"
      >
        <div className="man2-pdf-modal man2-pdf-modal--confirm">
          <div className="man2-pdf-modal__head">
            <div>
              <h3>Elimina manutenzione</h3>
            </div>
            <button
              type="button"
              className="man2-pdf-modal__close"
              aria-label="Chiudi"
              onClick={close}
              disabled={pdfDeleteBusy}
            >
              x
            </button>
          </div>
          <div className="man2-pdf-modal__content">
            <p>Stai per eliminare definitivamente questa manutenzione:</p>
            <p>
              <strong>Manutenzione del {dataLabel}</strong>
              {record.descrizione ? <> — {record.descrizione}</> : null}
            </p>
            <p>
              Mezzo <strong>{record.targa || "—"}</strong> · tipo {record.tipo}
            </p>
            <p className="man2-feedback man2-feedback--error">
              L&apos;operazione non puo&apos; essere annullata.
            </p>
            <div className="man2-form-actions">
              <button
                type="button"
                className="man2-btn"
                autoFocus
                onClick={close}
                disabled={pdfDeleteBusy}
              >
                Annulla
              </button>
              <button
                type="button"
                className="man2-btn man2-btn--danger"
                onClick={() => void handleConfirmPdfDelete()}
                disabled={pdfDeleteBusy}
              >
                {pdfDeleteBusy ? "Eliminazione..." : "Elimina definitivamente"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderOrigineModal() {
    if (!origineModalLoading && !origineModalError && !origineModalRecord) {
      return null;
    }
    const details = origineModalRecord ? buildOrigineDetails(origineModalRecord) : [];
    const fotoUrls = origineModalRecord ? readOrigineFotoUrls(origineModalRecord.data) : [];
    const close = () => {
      setOrigineModalRecord(null);
      setOrigineModalError(null);
      setOrigineModalLoading(false);
    };

    return (
      <div className="man2-pdf-modal-backdrop" role="dialog" aria-modal="true" aria-label="Origine manutenzione">
        <div className="man2-pdf-modal">
          <div className="man2-pdf-modal__head">
            <div>
              <h3>
                {origineModalRecord?.origineTipo === "segnalazione"
                  ? "Segnalazione origine"
                  : origineModalRecord?.origineTipo === "controllo"
                    ? "Controllo origine"
                    : "Origine"}
              </h3>
              <p>{origineModalRecord?.origineRefId ?? "Lettura in corso"}</p>
            </div>
            <button type="button" className="man2-pdf-modal__close" aria-label="Chiudi origine" onClick={close}>
              x
            </button>
          </div>
          <div className="man2-pdf-modal__content">
            {origineModalLoading ? <div className="man-empty">Caricamento origine...</div> : null}
            {origineModalError ? <div className="man2-feedback man2-feedback--error">{origineModalError}</div> : null}
            {!origineModalLoading && origineModalRecord ? (
              <div className="man2-last-list">
                {details.length > 0 ? (
                  details.map((detail) => (
                    <div key={`${detail.label}:${detail.value}`} className="man2-last-item">
                      <div className="man2-last-item__row1">
                        <span className="man2-last-item__title">{detail.label}</span>
                        <span className="man2-last-item__meta">{detail.value}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="man-empty">Nessun dettaglio origine disponibile.</div>
                )}
                {fotoUrls.length > 0 ? (
                  <div className="man2-material-list">
                    {fotoUrls.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="man2-material-row">
                        Foto origine
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  function renderCreaManutenzioneSegnalazioneModal() {
    const modal = creaManutenzioneSegnalazioneModal;
    if (!modal) return null;
    const close = () => {
      if (!modal.busy) setCreaManutenzioneSegnalazioneModal(null);
    };
    return (
      <div
        className="man2-pdf-modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-label="Crea manutenzione da segnalazione"
      >
        <form className="man2-pdf-modal man2-pdf-modal--confirm" onSubmit={handleSubmitCreaManutenzioneSegnalazione}>
          <div className="man2-pdf-modal__head">
            <div>
              <h3>Crea manutenzione da segnalazione</h3>
              <p>{modal.item.id}</p>
            </div>
            <button
              type="button"
              className="man2-pdf-modal__close"
              aria-label="Chiudi"
              onClick={close}
              disabled={modal.busy}
            >
              x
            </button>
          </div>
          <div className="man2-pdf-modal__content">
            <div className="man2-field-row">
              <div className="man2-field">
                <label className="man2-field__label">Targa</label>
                <input value={modal.item.targa ?? ""} readOnly />
              </div>
              <div className="man2-field">
                <label className="man2-field__label">Urgenza</label>
                <select
                  value={modal.urgenza}
                  onChange={(event) =>
                    setCreaManutenzioneSegnalazioneModal((current) =>
                      current
                        ? {
                            ...current,
                            urgenza: event.target.value as Extract<NextManutenzioneUrgenza, "alta" | "media">,
                          }
                        : current,
                    )
                  }
                  disabled={modal.busy}
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                </select>
              </div>
            </div>
            <div className="man2-field">
              <label className="man2-field__label">Descrizione</label>
              <textarea
                value={modal.descrizione}
                rows={5}
                required
                disabled={modal.busy}
                onChange={(event) =>
                  setCreaManutenzioneSegnalazioneModal((current) =>
                    current ? { ...current, descrizione: event.target.value } : current,
                  )
                }
              />
            </div>
            <div className="man2-form-actions">
              <button type="button" className="man2-btn" onClick={close} disabled={modal.busy}>
                Annulla
              </button>
              <button type="submit" className="man2-btn-full" disabled={modal.busy || !modal.descrizione.trim()}>
                {modal.busy ? "Salvataggio..." : "Crea manutenzione"}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  function renderActiveSurface() {
    if (loading) {
      return <div className="man-empty">Caricamento manutenzioni in corso...</div>;
    }
    if (view === "dafare") return renderDaFare();
    if (view === "dashboard") return renderDashboard();
    if (view === "form") return renderForm();
    if (view === "pdf") return renderPdfPanel();
    return null;
  }

  function renderCompletionModal() {
    if (!completionModalRecord) return null;
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Segna manutenzione eseguita"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 80,
          background: "rgba(15, 23, 42, 0.48)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) closeCompletionModal();
        }}
      >
        <form
          className="man2-form-shell man2-completion-modal"
          style={{ width: "min(520px, 100%)", maxHeight: "90vh", overflowY: "auto" }}
          onMouseDown={(event) => event.stopPropagation()}
          onSubmit={(event) => {
            event.preventDefault();
            void handleConfirmCompletionModal();
          }}
        >
          <style>
            {`
              .man2-completion-modal .officina-ac {
                position: relative;
                width: 100%;
              }
              .man2-completion-modal .officina-ac__menu {
                position: absolute;
                z-index: 80;
                left: 0;
                right: 0;
                top: calc(100% + 6px);
                display: flex;
                flex-direction: column;
                align-items: stretch;
                gap: 0;
                padding: 4px 0;
                box-sizing: border-box;
              }
              .man2-completion-modal .officina-ac__option {
                display: block;
                width: 100%;
                border-radius: 0;
                white-space: normal;
                line-height: 1.25;
                text-align: left;
              }
            `}
          </style>
          <div className="man2-screen-head man2-screen-head--form">
            <div>
              <h2 className="man2-screen-title">Eseguita</h2>
            </div>
          </div>

          <section className="man2-form-block">
            <div className="man2-section-title">Dati esecuzione</div>
            <div className="man2-field-row" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
              <div className="man2-field man2-text-strong-input">
                <label className="man2-field__label">Officina</label>
                <OfficinaAutocomplete
                  value={completionDraftFornitore}
                  onChange={setCompletionDraftFornitore}
                  officine={officine}
                  placeholder="Es. Officina Rossi"
                />
              </div>
              <div className="man2-field">
                <label className="man2-field__label">Data esecuzione</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="GG/MM/AAAA"
                  value={toDisplay(completionDraftData) || completionDraftData}
                  onChange={(event) => setCompletionDraftData(formatDateDigitsInput(event.target.value))}
                />
              </div>
              {completionKmRequired ? (
                <div className="man2-field">
                  <label className="man2-field__label">KM</label>
                  <input
                    type="number"
                    value={completionDraftKm}
                    onChange={(event) => setCompletionDraftKm(event.target.value)}
                    inputMode="numeric"
                  />
                </div>
              ) : null}
            </div>
          </section>

          <div className="man2-form-actions">
            <button type="button" className="man2-btn" onClick={closeCompletionModal} disabled={saving}>
              Annulla
            </button>
            <button type="submit" className="man2-btn-full" disabled={saving}>
              {saving ? "Salvataggio..." : "Conferma eseguita"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="man2-page">
      <div className="man2-head">
        <div className="man2-head__left">
          <span className="man2-eyebrow">OPERATIVITÀ</span>
          <h1>Manutenzioni</h1>
        </div>
        <div className="man2-head__right">
          <select
            className="man2-select-mezzo"
            value={activeTarga}
            onChange={(event) => handleSelectContextTarga(event.target.value)}
          >
            <option value="">Tutte</option>
            {(mezziSelezionabili.length > 0 ? mezziSelezionabili : mezzi).map((mezzo) => (
              <option key={mezzo.id} value={mezzo.targa}>
                {mezzo.label}
              </option>
            ))}
          </select>
          <input
            className="man2-search"
            value={ricercaMezzo}
            onChange={(event) => setRicercaMezzo(event.target.value)}
            placeholder="Cerca targa / modello / autista"
            title="Ricerca rapida generale per targa, modello o autista."
            aria-label="Ricerca rapida mezzi"
          />
        </div>
      </div>

      {renderContextBar()}

      <nav className="man2-tabs">
        {[
          { key: "dafare", label: "Da fare" },
          { key: "dashboard", label: "Dashboard" },
          { key: "form", label: "Nuova / Modifica" },
          { key: "mappa", label: "Dettaglio" },
          { key: "pdf", label: "Quadro manutenzioni PDF" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`man2-tab${view === tab.key ? " active" : ""}`}
            onClick={() => setView(tab.key as ViewTab)}
            disabled={tab.key === "mappa" ? !activeTarga : false}
            title={
              tab.key === "mappa"
                ? "Apri il dettaglio visivo del mezzo selezionato."
                : tab.key === "pdf"
                  ? "Apri il quadro manutenzioni con ricerca ed export PDF."
                  : undefined
            }
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {notice ? <div className="man2-feedback man2-feedback--notice">{notice}</div> : null}
      {error ? <div className="man2-feedback man2-feedback--error">{error}</div> : null}

      {view === "mappa" ? (
        <Fragment>
          {renderOriginePanel()}
          <NextMappaStoricoPage
            targa={activeTarga}
            embedded={true}
            selectedMaintenance={selectedDetailRecord ? { ...selectedDetailRecord } : null}
            storicoManutenzioni={storicoMezzoOrdinato}
            storiaSatelliteRecords={storicoMezzoSatellitiEvento}
            kmAttuali={kmUltimoByTarga[activeTarga] ?? null}
            mezzoInfo={{
              targa: mezzoPreviewSelezionato?.targa || activeTarga,
              mezzoLabel: mezzoPreviewSelezionato?.marcaModello ?? mezzoPreviewSelezionato?.label ?? "DA VERIFICARE",
              autistaNome: mezzoPreviewSelezionato?.autistaNome ?? null,
              categoria: mezzoPreviewSelezionato?.categoria ?? null,
              kmAttuali: kmUltimoRifornimento,
              latestGommeKmCambio,
              ultimaManutenzione: latestRecord ? formatDateShort(latestRecord.data) : null,
              ultimoInterventoMezzo: ultimeManutenzioniMezzo[0]?.descrizione ?? null,
              ultimoInterventoCompressore: ultimeManutenzioniCompressore[0]?.descrizione ?? null,
              ultimeManutenzioniMezzo: ultimeManutenzioniMezzoSenzaUltimo.map((item) => ({
                id: item.id,
                data: formatDateShort(item.data),
                title: buildDescrizioneSnippet(item.descrizione, 78),
              })),
              ultimeManutenzioniCompressore: ultimeManutenzioniCompressoreSenzaUltimo.map((item) => ({
                id: item.id,
                data: formatDateShort(item.data),
                title: buildDescrizioneSnippet(item.descrizione, 78),
              })),
            }}
            onOpenDossier={() => {
              if (mezzoPreviewSelezionato) navigate(buildNextDossierPath(mezzoPreviewSelezionato.targa));
            }}
            onOpenDocument={(record) => {
              if (!record.sourceDocumentFileUrl) return;
              window.open(record.sourceDocumentFileUrl, "_blank", "noopener,noreferrer");
            }}
            onDownloadPdfSingle={(record) => void exportPdfForItems([record], `PDF dettaglio - ${record.targa}`)}
            onSelectMaintenance={(recordId) => setSelectedDetailRecordId(recordId)}
            onEditLatest={() => {
              if (selectedDetailRecord) handleEdit(selectedDetailRecord);
            }}
            onDelete={handleDelete}
            onCompleteMaintenance={(record) => {
              const fullRecord = storico.find((item) => item.id === record.id) ?? null;
              if (!fullRecord) {
                setError("Record manutenzione non trovato nello storico corrente.");
                return;
              }
              handleCompleteDaFare(fullRecord);
            }}
            onAgganciaEvento={(record) => setAggancioManutenzioneRecord(record as NextManutenzioniLegacyDatasetRecord)}
            onSganciaEvento={(record) => void handleSganciaManutenzione(record)}
          />
        </Fragment>
      ) : (
        renderActiveSurface()
      )}
      {agganciaSegnalazioneModal ? (
        <NextAgganciaLegameModal
          sorgente={agganciaSegnalazioneModal.sorgente}
          sorgenti={[agganciaSegnalazioneModal.sorgente]}
          mode="aggancia"
          candidati={agganciaSegnalazioneModal.candidati}
          busy={agganciaSegnalazioneModal.busy}
          onCancel={() => {
            if (!agganciaSegnalazioneModal.busy) setAgganciaSegnalazioneModal(null);
          }}
          onConfirm={(id) => void handleConfirmAgganciaSegnalazione(id)}
        />
      ) : null}
      {renderCreaManutenzioneSegnalazioneModal()}
      {renderCompletionModal()}
      <PdfPreviewModal
        open={pdfPreviewOpen}
        title={pdfPreviewTitle}
        pdfUrl={pdfPreviewUrl}
        fileName={pdfPreviewFileName}
        onClose={() => setPdfPreviewOpen(false)}
      />
      {aggancioManutenzioneRecord ? (
        <NextAggancioEventoModal
          record={{
            id: aggancioManutenzioneRecord.id,
            targa: aggancioManutenzioneRecord.targa,
            dataRiferimento: getManutenzioneAggancioTimestamp(aggancioManutenzioneRecord),
            titolo: buildDescrizioneSnippet(aggancioManutenzioneRecord.descrizione, 90),
          }}
          tipoRecord="manutenzione"
          busy={aggancioManutenzioneBusy}
          onCancel={() => {
            if (!aggancioManutenzioneBusy) setAggancioManutenzioneRecord(null);
          }}
          onConfirm={(evento) => void handleConfirmAggancioManutenzione(evento)}
        />
      ) : null}
      {renderOrigineModal()}
      {renderPdfDeleteModal()}
    </div>
  );
}


