// Satellite del modulo Manutenzioni: la "macchina PDF" pura (tipi, costanti,
// font Unicode, immagini, formattazioni, metriche, nomi file). Codice spostato
// 1:1 da NextManutenzioniPage.tsx (regola "moduli a satelliti"): nessun cambio
// di comportamento. Gli orchestratori (exportPdfForItems, exportConsumoOlioPdf)
// restano nella madre perché usano lo stato della pagina.
import type {
  NextManutenzioneOrigineRecord,
  NextManutenzioniLegacyDatasetRecord,
} from "../domain/nextManutenzioniDomain";
import { isSatelliteChiusoDaEvento } from "../helpers/storiaRecord";
import { toDisplay } from "../helpers/dateUnica";
import { formatDateTimeUI } from "../nextDateFormat";
import { isNextCategoriaMotorizzata } from "../domain/nextManutenzioniGommeDomain";
import {
  formatDateFull,
  formatNumberIt,
  getLegacyDateTimestamp,
  readOrigineDateText,
  readOrigineText,
  resolveMaintenanceStato,
  type TipoVoce,
} from "./manutenzioniCondivisi";

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

const PDF_SUBJECT_ORDER: TipoVoce[] = ["mezzo", "compressore", "attrezzature"];
const PDF_SUBJECT_LABELS: Record<TipoVoce, { singular: string; plural: string }> = {
  mezzo: { singular: "Mezzo", plural: "Mezzi" },
  compressore: { singular: "Compressore", plural: "Compressori" },
  attrezzature: { singular: "Attrezzatura", plural: "Attrezzature" },
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

export type {
  PdfContainPlacement,
  PdfDocWithPlugins,
  PdfImageData,
  PdfMetricInfo,
  PdfModalLayout,
  PdfOriginNotesById,
};
export {
  PDF_HEADER_BLACK_RGB,
  PDF_IMAGE_COMPRESSION,
  PDF_IMAGE_JPEG_QUALITY,
  PDF_IMAGE_MAX_LONG_SIDE_PX,
  PDF_SUBJECT_LABELS,
  PDF_SUBJECT_ORDER,
  PDF_UNICODE_FONT_FAMILY,
  PDF_UNICODE_FONT_FILE,
  PDF_UNICODE_FONT_URL,
  arrayBufferToBase64,
  buildMisuraLabel,
  buildPdfClosedExternalOriginLabel,
  buildPdfDescrizione,
  buildPdfDescrizioneWithOrigin,
  buildPdfFileName,
  buildPdfMetricInfo,
  buildPdfOriginNote,
  buildPdfPeriodRangeLabel,
  buildPdfTableMetricValue,
  calculatePdfContainPlacement,
  createPdfImageCanvas,
  drawPdfImageToCanvas,
  ensurePdfUnicodeFont,
  estimateDataUrlByteSize,
  fitPdfSingleLineText,
  formatMaintenancePdfDateLabel,
  formatMetricValue,
  formatPdfChiusuraDateLabel,
  formatPdfGenerationDate,
  getMaintenancePdfDateValue,
  getMaintenancePdfSortTimestamp,
  getPdfImageFormat,
  getPdfUnicodeFontBase64,
  isPdfClosedByExternalEvent,
  isPdfOperativeMaintenance,
  loadImageElement,
  loadPdfImageData,
  normalizePdfDateCandidate,
  normalizePdfFallbackText,
  renderImageElementToPdfData,
  resolvePdfListTitle,
  resolvePdfMaintenanceTypeLabel,
  resolvePdfMetricColumnLabel,
  toPdfText,
};
