import { getDownloadURL, ref } from "firebase/storage";
import type { WheelPoint } from "../../components/wheels";
import { wheelGeom } from "../../components/wheels";
import { storage } from "../../firebase";
import {
  readNextStatoOperativoSnapshot,
  type D10SessionItem,
} from "../domain/nextCentroControlloDomain";
import {
  readNextMezzoManutenzioniGommeSnapshot,
  type NextGommeReadOnlyItem,
} from "../domain/nextManutenzioniGommeDomain";
import {
  readNextMezzoByTarga,
  type NextAnagraficheFlottaMezzoItem,
} from "../nextAnagraficheFlottaDomain";
import type { InternalAiServerReportSummaryWorkflow } from "./internalAiServerReportSummaryClient";
import type {
  InternalAiVehicleReportPreview,
  InternalAiVehicleReportSection,
} from "./internalAiTypes";

type ReportWheel = {
  id: string;
  axisId: string;
  x: number;
  y: number;
};

type ReportModalita = "ordinario" | "straordinario";

type ConfigAsse = {
  id: string;
  label: string;
  wheelsCount: number;
};

type ConfigGomme = {
  tipoLabel: string;
  assi: ConfigAsse[];
};

export type InternalAiProfessionalReportSection = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  emptyLabel: string | null;
};

export type InternalAiProfessionalReportMedia = {
  label: string;
  targa: string;
  categoria: string | null;
  marcaModello: string | null;
  autistaNome: string | null;
  revisione: string | null;
  collaudo: string | null;
  precollaudo: string | null;
  photoUrl: string | null;
  photoStatus: "available" | "not_available";
};

export type InternalAiProfessionalReportTyreVisual = {
  title: string;
  subtitle: string;
  backgroundImageUrl: string | null;
  wheels: ReportWheel[];
  selectedWheelIds: string[];
  selectedAxisId: string | null;
  modalita: ReportModalita;
  isRimorchio: boolean;
  highlights: string[];
  details: Array<{ label: string; value: string }>;
};

export type InternalAiProfessionalVehicleReport = {
  displayTitle: string;
  displaySubtitle: string;
  targetLabel: string;
  generatedAtLabel: string;
  periodLabel: string;
  cards: InternalAiVehicleReportPreview["cards"];
  executiveSummary: string[];
  vehicle: InternalAiProfessionalReportMedia;
  relatedAsset: InternalAiProfessionalReportMedia | null;
  sections: InternalAiProfessionalReportSection[];
  tyreVisual: InternalAiProfessionalReportTyreVisual | null;
  appendix: {
    sources: Array<{
      title: string;
      description: string;
      countLabel: string | null;
      status: string;
    }>;
    limits: string[];
    notes: string[];
    workflowSummary: string | null;
  };
};

const FALLBACK_UNAVAILABLE = "non disponibile";
const mediaUrlCache = new Map<string, Promise<string | null>>();

function formatDateLabel(value: string | null | undefined): string {
  if (!value) {
    return FALLBACK_UNAVAILABLE;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function normalizeSpace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizeUserFacingText(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return normalizeSpace(
    value
      .replace(/\bD0\d(?:-[A-Z]+)?\b/gi, "")
      .replace(/\bclone-safe\b/gi, "")
      .replace(/\bread-only\b/gi, "sola lettura")
      .replace(/\bregistry\b/gi, "fonti collegate")
      .replace(/\bstorage\/@[a-z0-9_]+/gi, "")
      .replace(/\s+\|\s+/g, " | ")
      .replace(/\s+:/g, ":")
      .replace(/\s{2,}/g, " "),
  );
}

function sanitizeBullet(value: string): string {
  return sanitizeUserFacingText(value).replace(/^[-*]\s*/, "");
}

function dedupeStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((entry) => sanitizeUserFacingText(entry ?? ""))
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  );
}

function isDeadlineText(value: string): boolean {
  return /revis|collaud|precollaud|scadenz/i.test(value);
}

function isEmptyOperationalText(value: string): boolean {
  return /^nessun /i.test(value) || /non disponibile/i.test(value);
}

function buildConfig(categoria?: string | null): ConfigGomme {
  const cat = (categoria || "").toLowerCase();

  if (cat.includes("trattore")) {
    return {
      tipoLabel: "Trattore",
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "posteriore", label: "Posteriore", wheelsCount: 4 },
      ],
    };
  }

  if (cat.includes("motrice 4")) {
    return {
      tipoLabel: "Motrice 4 assi",
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "asse1", label: "1 asse", wheelsCount: 2 },
        { id: "asse2", label: "2 asse", wheelsCount: 4 },
        { id: "asse3", label: "3 asse", wheelsCount: 4 },
      ],
    };
  }

  if (cat.includes("motrice 3")) {
    return {
      tipoLabel: "Motrice 3 assi",
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "asse1", label: "1 asse", wheelsCount: 4 },
        { id: "asse2", label: "2 asse", wheelsCount: 2 },
      ],
    };
  }

  if (cat.includes("motrice 2")) {
    return {
      tipoLabel: "Motrice 2 assi",
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "asse1", label: "1 asse", wheelsCount: 4 },
      ],
    };
  }

  if (cat.includes("biga")) {
    return {
      tipoLabel: "Rimorchio 2 assi",
      assi: [
        { id: "asse1", label: "1 asse", wheelsCount: 4 },
        { id: "asse2", label: "2 asse", wheelsCount: 4 },
      ],
    };
  }

  if (
    cat.includes("rimorchio") ||
    cat.includes("porta silo container") ||
    cat.includes("pianale") ||
    cat.includes("centina") ||
    cat.includes("vasca")
  ) {
    return {
      tipoLabel: "Rimorchio 3 assi",
      assi: [
        { id: "asse1", label: "1 asse", wheelsCount: 4 },
        { id: "asse2", label: "2 asse", wheelsCount: 4 },
        { id: "asse3", label: "3 asse", wheelsCount: 4 },
      ],
    };
  }

  return {
    tipoLabel: categoria || "Mezzo",
    assi: [],
  };
}

function resolveWheelGeomKey(categoria?: string | null): keyof typeof wheelGeom | undefined {
  const cat = (categoria || "").toLowerCase();
  if (!cat) return undefined;

  if (cat.includes("motrice 4")) return "motrice4assi";
  if (cat.includes("motrice 3")) return "motrice3assi";
  if (cat.includes("motrice 2")) return "motrice2assi";
  if (cat.includes("biga")) return "biga";
  if (cat.includes("pianale")) return "pianale";
  if (cat.includes("vasca")) return "vasca";
  if (cat.includes("centina")) return "centina";
  if (cat.includes("porta silo container")) return "semirimorchioSterzante";
  if (cat.includes("semirimorchio") && cat.includes("sterz")) return "semirimorchioSterzante";
  if (cat.includes("semirimorchio")) return "semirimorchioFissi";
  if (cat.includes("trattore")) return "trattore";

  return undefined;
}

function buildWheelsForSvg(config: ConfigGomme, points: WheelPoint[], key: string): ReportWheel[] {
  if (!config.assi.length || !points.length) return [];

  const totalPoints = points.length;
  let perSideCounts = config.assi.map((asse) => Math.max(1, Math.round(asse.wheelsCount / 2)));
  const sum = perSideCounts.reduce((total, count) => total + count, 0);

  if (sum !== totalPoints) {
    const base = Math.floor(totalPoints / config.assi.length);
    const rest = totalPoints % config.assi.length;
    perSideCounts = config.assi.map((_, index) => base + (index < rest ? 1 : 0));
  }

  const result: ReportWheel[] = [];
  let index = 0;

  config.assi.forEach((asse, axisIndex) => {
    const count = perSideCounts[axisIndex];
    for (let inner = 0; inner < count && index < totalPoints; inner += 1, index += 1) {
      const point = points[index];
      result.push({
        id: `${key}-${asse.id}-${index}`,
        axisId: asse.id,
        x: point.cx,
        y: point.cy,
      });
    }
  });

  return result;
}

function normalizeAxisId(config: ConfigGomme, rawValue: string | null | undefined): string | null {
  const value = sanitizeUserFacingText(rawValue ?? "").toLowerCase();
  if (!value) return null;

  if (value.includes("anter")) return "anteriore";
  if (value.includes("poster")) return "posteriore";

  for (const asse of config.assi) {
    if (value.includes(asse.id.toLowerCase())) return asse.id;
    if (value.includes(asse.label.toLowerCase())) return asse.id;
  }

  const digitMatch = value.match(/(\d+)/);
  if (digitMatch) {
    const candidate = `asse${digitMatch[1]}`;
    if (config.assi.some((asse) => asse.id === candidate)) return candidate;
  }

  return null;
}

function detectTyreSide(item: NextGommeReadOnlyItem): "dx" | "sx" | null {
  const text = [
    item.posizione,
    item.asseLabel,
    item.descrizione,
    item.rotazioneText,
    item.interventoTipo,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!text) return null;
  if (/\b(dx|destro|destra)\b/.test(text)) return "dx";
  if (/\b(sx|sinistro|sinistra)\b/.test(text)) return "sx";
  return null;
}

function detectTyreScope(args: {
  item: NextGommeReadOnlyItem;
  axisId: string | null;
  side: "dx" | "sx" | null;
  config: ConfigGomme;
}): "singola" | "lato" | "asse" | "da_verificare" {
  const text = [
    args.item.posizione,
    args.item.asseLabel,
    args.item.descrizione,
    args.item.rotazioneText,
    args.item.interventoTipo,
    args.item.evento,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const axisConfig = args.axisId
    ? args.config.assi.find((asse) => asse.id === args.axisId) ?? null
    : null;
  const axisWheelCount = axisConfig?.wheelsCount ?? 0;
  const requestedCount = Math.max(
    1,
    args.item.quantita ??
      args.item.pezzi ??
      (args.side ? Math.max(1, Math.round(axisWheelCount / 2)) : 1),
  );

  if (args.axisId && !args.side) {
    if (
      /\b(asse intero|asse completo|anteriore intero|anteriore completo|coppia anteriore|intero|intera|completo|completa)\b/.test(
        text,
      ) ||
      (axisWheelCount > 0 && requestedCount >= axisWheelCount) ||
      args.axisId === "anteriore"
    ) {
      return "asse";
    }
  }

  if (args.axisId && args.side && requestedCount === 1) {
    return "singola";
  }

  if (args.side) {
    return "lato";
  }

  return args.axisId ? "asse" : "da_verificare";
}

function takeTyreVisualCandidate(items: NextGommeReadOnlyItem[]): NextGommeReadOnlyItem | null {
  return (
    [...items].sort((left, right) => {
      const rightStrong = right.vehicleMatchReliability === "forte" ? 1 : 0;
      const leftStrong = left.vehicleMatchReliability === "forte" ? 1 : 0;
      if (rightStrong !== leftStrong) return rightStrong - leftStrong;
      return (right.timestamp ?? 0) - (left.timestamp ?? 0);
    })[0] ?? null
  );
}

function asAbsoluteAssetUrl(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) {
    return value;
  }
  if (value.startsWith("/") && typeof window !== "undefined") {
    return new URL(value, window.location.origin).toString();
  }
  return value;
}

async function resolveMediaUrl(value: string | null | undefined): Promise<string | null> {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;

  const cached = mediaUrlCache.get(normalized);
  if (cached) {
    return cached;
  }

  const request = (async () => {
    if (
      normalized.startsWith("http://") ||
      normalized.startsWith("https://") ||
      normalized.startsWith("data:")
    ) {
      return normalized;
    }

    if (normalized.startsWith("/")) {
      return asAbsoluteAssetUrl(normalized);
    }

    try {
      return await getDownloadURL(ref(storage, normalized));
    } catch {
      return null;
    }
  })();

  mediaUrlCache.set(normalized, request);
  return request;
}

async function resolveVehiclePhoto(record: {
  fotoUrl?: string | null;
  fotoStoragePath?: string | null;
  fotoPath?: string | null;
}): Promise<string | null> {
  return (
    (await resolveMediaUrl(record.fotoUrl ?? null)) ??
    (await resolveMediaUrl(record.fotoStoragePath ?? null)) ??
    (await resolveMediaUrl(record.fotoPath ?? null)) ??
    null
  );
}

function buildScadenzeList(
  report: InternalAiVehicleReportPreview,
  mezzo: NextAnagraficheFlottaMezzoItem | null,
): string[] {
  const collected = [
    report.header.revisione ? `Revisione: ${report.header.revisione}` : null,
    mezzo?.dataUltimoCollaudo ? `Ultimo collaudo: ${mezzo.dataUltimoCollaudo}` : null,
    ...report.sections.flatMap((section) =>
      [...section.bullets, section.summary].filter((entry) => isDeadlineText(entry)),
    ),
  ];

  return dedupeStrings(collected).slice(0, 4);
}

function buildExecutiveSummary(args: {
  report: InternalAiVehicleReportPreview;
  mezzo: NextAnagraficheFlottaMezzoItem | null;
  relatedAsset: InternalAiProfessionalReportMedia | null;
  sections: InternalAiProfessionalReportSection[];
  tyreVisual: InternalAiProfessionalReportTyreVisual | null;
}): string[] {
  const operational = args.sections.find((section) => section.id === "criticita");
  const scadenze = args.sections.find((section) => section.id === "scadenze");
  const lavori = args.sections.find((section) => section.id === "lavori-manutenzioni");
  const fuel = args.sections.find((section) => section.id === "rifornimenti");
  const fuelAnomalies = args.sections.find((section) => section.id === "rifornimenti-anomalie");
  const fuelActions = args.sections.find((section) => section.id === "rifornimenti-azioni");
  const summary: string[] = [];

  summary.push(
    `Quadro generale: ${args.mezzo?.categoria || args.report.header.categoria || "Mezzo"} ${args.report.header.targa}${args.mezzo?.marcaModello || args.report.header.marcaModello ? `, ${args.mezzo?.marcaModello || args.report.header.marcaModello}` : ""}.`,
  );

  if (operational) {
    summary.push(`Criticita principali: ${operational.summary}`);
  } else if (fuel) {
    summary.push(`Rifornimenti: ${fuel.summary}`);
  } else {
    summary.push("Criticita principali: non trovate criticita operative forti nel periodo letto.");
  }

  if (fuel && operational) {
    summary.push(`Rifornimenti: ${fuel.summary}`);
  }

  if (scadenze) {
    summary.push(`Scadenze: ${scadenze.bullets.slice(0, 2).join(" | ") || scadenze.summary}`);
  }

  if (fuelActions) {
    summary.push(`Azione consigliata: ${fuelActions.bullets[0] || fuelActions.summary}`);
  } else if (lavori) {
    summary.push(
      `Azioni consigliate: ${lavori.bullets.length > 0 ? lavori.bullets[0] : "verificare pianificazione lavori e manutenzioni aperte."}`,
    );
  } else if (args.tyreVisual) {
    summary.push("Azioni consigliate: verificare priorita gomme e confermare l'intervento sul mezzo.");
  }

  if (fuelAnomalies?.bullets.length) {
    summary.push(`Anomalie: ${fuelAnomalies.bullets.slice(0, 2).join(" | ")}`);
  }

  if (args.relatedAsset?.targa) {
    summary.push(
      `${args.relatedAsset.label}: ${args.relatedAsset.targa}${args.relatedAsset.categoria ? ` (${args.relatedAsset.categoria})` : ""}.`,
    );
  }

  if (args.report.missingData.length > 0) {
    summary.push(`Da verificare: ${sanitizeBullet(args.report.missingData[0])}`);
  }

  return dedupeStrings(summary).slice(0, 6);
}

function buildAppendix(args: {
  report: InternalAiVehicleReportPreview;
  workflow: InternalAiServerReportSummaryWorkflow | null;
}) {
  return {
    sources: args.report.sources.map((source) => ({
      title: sanitizeUserFacingText(source.title),
      description: sanitizeUserFacingText(source.description) || FALLBACK_UNAVAILABLE,
      countLabel: source.countLabel ?? null,
      status: source.status,
    })),
    limits: dedupeStrings(args.report.missingData),
    notes: dedupeStrings([
      ...args.report.sections.flatMap((section) => section.notes),
      ...args.report.periodContext.notes,
    ]),
    workflowSummary: args.workflow ? sanitizeUserFacingText(args.workflow.previewText) : null,
  };
}

function mapSectionTitle(section: InternalAiVehicleReportSection): string {
  if (section.id === "stato-operativo-attuale") return "Criticita e priorita operative";
  if (section.id === "lavori-manutenzioni") return "Lavori e manutenzioni";
  if (section.id === "gomme") return "Gomme";
  if (section.id === "rifornimenti") return "Rifornimenti e consumi";
  if (section.id === "rifornimenti-records") return "Record del periodo";
  if (section.id === "rifornimenti-anomalie") return "Anomalie rilevate";
  if (section.id === "rifornimenti-azioni") return "Azione consigliata";
  if (section.id === "materiali-inventario") return "Materiali e inventario";
  if (section.id === "procurement") return "Ordini, preventivi e fornitori";
  if (section.id === "documenti-costi") return "Documenti e costi";
  if (section.id === "cisterna") return "Cisterna";
  if (section.id === "riscontri-registry") return "Riscontri operativi collegati";
  return sanitizeUserFacingText(section.title);
}

function isFuelOnlyReport(report: InternalAiVehicleReportPreview): boolean {
  return report.sections.some((section) => section.id === "rifornimenti");
}

function buildProfessionalSections(
  report: InternalAiVehicleReportPreview,
  mezzo: NextAnagraficheFlottaMezzoItem | null,
): InternalAiProfessionalReportSection[] {
  const sectionsById = new Map(report.sections.map((section) => [section.id, section]));
  const operational = sectionsById.get("stato-operativo-attuale") ?? null;
  const technical = sectionsById.get("lavori-manutenzioni") ?? null;
  const tyres = sectionsById.get("gomme") ?? null;
  const isFuelReport =
    isFuelOnlyReport(report) &&
    report.sections.every((section) =>
      ["identita-mezzo", "rifornimenti", "rifornimenti-records", "rifornimenti-anomalie", "rifornimenti-azioni"].includes(section.id),
    );
  const deadlineBullets = buildScadenzeList(report, mezzo);
  const result: InternalAiProfessionalReportSection[] = [];

  if (operational) {
    const bullets = dedupeStrings(
      operational.bullets.filter(
        (bullet) => !isDeadlineText(bullet) && !/sessione attiva/i.test(bullet),
      ),
    ).slice(0, 6);

    result.push({
      id: "criticita",
      title: "Criticita e priorita operative",
      summary: sanitizeUserFacingText(operational.summary),
      bullets,
      emptyLabel:
        bullets.length === 0
          ? "Non risultano criticita operative forti nel periodo richiesto."
          : null,
    });
  }

  if (!isFuelReport && deadlineBullets.length > 0) {
    result.push({
      id: "scadenze",
      title: "Scadenze e verifiche",
      summary: "Le principali scadenze disponibili sono raccolte qui sotto.",
      bullets: deadlineBullets,
      emptyLabel: null,
    });
  }

  if (technical) {
    const bullets = dedupeStrings(technical.bullets).slice(0, 6);
    result.push({
      id: technical.id,
      title: mapSectionTitle(technical),
      summary: sanitizeUserFacingText(technical.summary),
      bullets,
      emptyLabel:
        bullets.length === 0 ? "Non risultano lavori o manutenzioni aperte nel periodo letto." : null,
    });
  }

  if (tyres) {
    const bullets = dedupeStrings(tyres.bullets).slice(0, 6);
    result.push({
      id: tyres.id,
      title: mapSectionTitle(tyres),
      summary: sanitizeUserFacingText(tyres.summary),
      bullets,
      emptyLabel:
        bullets.length === 0 ? "Nessun intervento gomme collegato in modo dimostrabile." : null,
    });
  }

  for (const section of report.sections) {
    if (
      section.id === "identita-mezzo" ||
      section.id === "stato-operativo-attuale" ||
      section.id === "lavori-manutenzioni" ||
      section.id === "gomme"
    ) {
      continue;
    }

    const bulletLimit =
      section.id === "rifornimenti-records"
        ? 14
        : section.id === "rifornimenti-anomalie"
          ? 10
          : 6;
    const bullets = dedupeStrings(section.bullets).slice(0, bulletLimit);
    const summary = sanitizeUserFacingText(section.summary);
    if (bullets.length === 0 && (!summary || isEmptyOperationalText(summary))) {
      continue;
    }

    result.push({
      id: section.id,
      title: mapSectionTitle(section),
      summary,
      bullets,
      emptyLabel: bullets.length === 0 ? "non disponibile" : null,
    });
  }

  return result;
}

function pickPrecollaudoLabel(report: InternalAiVehicleReportPreview): string | null {
  const matches = report.sections
    .flatMap((section) => [section.summary, ...section.bullets])
    .map((entry) => sanitizeUserFacingText(entry))
    .filter((entry) => /precollaud/i.test(entry));
  return matches[0] ?? null;
}

function getRelatedAssetLabel(args: {
  currentTarga: string;
  relatedCategoria: string | null;
  session: D10SessionItem | null;
}): string {
  const relatedCategory = (args.relatedCategoria || "").toLowerCase();
  const currentIsMotrice = args.session?.targaMotrice === args.currentTarga;

  if (currentIsMotrice) {
    if (relatedCategory.includes("centina")) return "Centina collegata";
    if (relatedCategory.includes("rimorchio") || relatedCategory.includes("semirimorchio")) {
      return "Rimorchio collegato";
    }
    return "Configurazione collegata";
  }

  return "Motrice collegata";
}

async function readRelatedAsset(
  currentTarga: string,
): Promise<InternalAiProfessionalReportMedia | null> {
  const snapshot = await readNextStatoOperativoSnapshot();
  const session =
    [...snapshot.sessioni]
      .filter(
        (item) => item.targaMotrice === currentTarga || item.targaRimorchio === currentTarga,
      )
      .sort((left, right) => (right.timestamp ?? 0) - (left.timestamp ?? 0))[0] ?? null;

  if (!session) {
    return null;
  }

  const relatedTarga =
    session.targaMotrice === currentTarga ? session.targaRimorchio : session.targaMotrice;
  if (!relatedTarga) {
    return null;
  }

  const relatedMezzo = await readNextMezzoByTarga(relatedTarga);
  const photoUrl = relatedMezzo ? await resolveVehiclePhoto(relatedMezzo) : null;

  return {
    label: getRelatedAssetLabel({
      currentTarga: currentTarga,
      relatedCategoria: relatedMezzo?.categoria ?? null,
      session,
    }),
    targa: relatedTarga,
    categoria: relatedMezzo?.categoria ?? null,
    marcaModello: relatedMezzo?.marcaModello ?? null,
    autistaNome: relatedMezzo?.autistaNome ?? null,
    revisione: relatedMezzo?.dataScadenzaRevisione ?? null,
    collaudo: relatedMezzo?.dataUltimoCollaudo ?? null,
    precollaudo: null,
    photoUrl,
    photoStatus: photoUrl ? "available" : "not_available",
  };
}

function buildTyreVisual(
  mezzo: NextAnagraficheFlottaMezzoItem | null,
  items: NextGommeReadOnlyItem[],
): InternalAiProfessionalReportTyreVisual | null {
  const category = mezzo?.categoria ?? null;
  const config = buildConfig(category);
  const geomKey = resolveWheelGeomKey(category);
  if (!geomKey || config.assi.length === 0) {
    return null;
  }

  const candidate = takeTyreVisualCandidate(items);
  if (!candidate) {
    return null;
  }

  const geom = wheelGeom[geomKey];
  const dxWheels = buildWheelsForSvg(config, geom.dx, geomKey);
  const sxWheels = buildWheelsForSvg(config, geom.sx, geomKey);
  const allWheels = [...dxWheels, ...sxWheels];
  const axisId = normalizeAxisId(config, candidate.asseLabel ?? candidate.posizione);
  const side = detectTyreSide(candidate);
  const scope = detectTyreScope({
    item: candidate,
    axisId,
    side,
    config,
  });
  const sideLabel = side === "dx" ? "destro" : side === "sx" ? "sinistro" : null;
  const involvementLabel =
    scope === "asse"
      ? "asse intero"
      : scope === "lato"
        ? `lato ${sideLabel ?? FALLBACK_UNAVAILABLE}`
        : scope === "singola"
          ? `gomma singola${sideLabel ? ` lato ${sideLabel}` : ""}`
          : "da verificare";
  const details = [
    { label: "Evento", value: sanitizeBullet(candidate.evento) || FALLBACK_UNAVAILABLE },
    { label: "Asse", value: sanitizeBullet(candidate.asseLabel ?? "") || FALLBACK_UNAVAILABLE },
    { label: "Coinvolgimento", value: involvementLabel },
    {
      label: "Quantita",
      value:
        candidate.quantita !== null || candidate.pezzi !== null
          ? String(candidate.quantita ?? candidate.pezzi ?? "-")
          : FALLBACK_UNAVAILABLE,
    },
    { label: "Marca", value: sanitizeBullet(candidate.marca ?? "") || FALLBACK_UNAVAILABLE },
  ];

  let modalita: ReportModalita = "ordinario";
  let selectedAxisId: string | null = axisId;
  let selectedWheelIds: string[] = [];

  if (side && axisId) {
    modalita = "straordinario";
    selectedAxisId = null;
    const sourceSet = side === "dx" ? dxWheels : sxWheels;
    const axisWheels = sourceSet.filter((wheel) => wheel.axisId === axisId);
    const requestedCount = Math.max(1, candidate.quantita ?? candidate.pezzi ?? axisWheels.length);
    selectedWheelIds = axisWheels.slice(0, requestedCount).map((wheel) => wheel.id);
  } else if (!axisId && side) {
    modalita = "straordinario";
    selectedAxisId = null;
    const sourceSet = side === "dx" ? dxWheels : sxWheels;
    selectedWheelIds = sourceSet.slice(0, Math.max(1, candidate.quantita ?? candidate.pezzi ?? 1)).map((wheel) => wheel.id);
  }

  const backgroundImageUrl = asAbsoluteAssetUrl(
    geom.imageDX ? `/gomme/${geom.imageDX}` : null,
  );
  const highlights = dedupeStrings([
    candidate.asseLabel ? `Asse coinvolto: ${candidate.asseLabel}` : null,
    scope === "asse"
      ? "Coinvolgimento: asse intero"
      : side
        ? `Coinvolgimento: lato ${side === "dx" ? "destro" : "sinistro"}`
        : null,
    candidate.marca ? `Marca: ${candidate.marca}` : null,
    candidate.dataLabel ? `Data: ${candidate.dataLabel}` : null,
  ]);

  return {
    title: "Schema gomme",
    subtitle: sanitizeUserFacingText(candidate.evento),
    backgroundImageUrl,
    wheels: allWheels,
    selectedWheelIds,
    selectedAxisId,
    modalita,
    isRimorchio: config.tipoLabel.toLowerCase().includes("rimorchio"),
    highlights,
    details,
  };
}

export function buildInternalAiProfessionalVehicleReportText(
  report: InternalAiVehicleReportPreview,
  workflow: InternalAiServerReportSummaryWorkflow | null,
): string {
  void workflow;
  const sections = buildProfessionalSections(report, null);
  const executiveSummary = buildExecutiveSummary({
    report,
    mezzo: null,
    relatedAsset: null,
    sections,
    tyreVisual: null,
  });
  const displayTitle = sanitizeUserFacingText(report.title) || "Report operativo mezzo";
  const lines: string[] = [
    displayTitle,
    `Targa: ${report.header.targa}`,
    `Periodo: ${report.periodContext.label}`,
    `Generato il: ${formatDateLabel(report.generatedAt)}`,
    "",
    "Sintesi esecutiva",
    ...executiveSummary.map((entry) => `- ${entry}`),
    "",
    "Dati mezzo",
    `- Categoria: ${sanitizeUserFacingText(report.header.categoria) || FALLBACK_UNAVAILABLE}`,
    `- Marca / modello: ${sanitizeUserFacingText(report.header.marcaModello) || FALLBACK_UNAVAILABLE}`,
    `- Autista associato: ${sanitizeUserFacingText(report.header.autistaNome) || FALLBACK_UNAVAILABLE}`,
    `- Revisione: ${sanitizeUserFacingText(report.header.revisione) || FALLBACK_UNAVAILABLE}`,
    "",
    "Sezioni operative",
  ];

  sections.forEach((section) => {
    lines.push(`- ${section.title}: ${section.summary || section.emptyLabel || FALLBACK_UNAVAILABLE}`);
    section.bullets.forEach((bullet) => {
      lines.push(`  - ${bullet}`);
    });
  });

  return lines.join("\n");
}

export async function readInternalAiProfessionalVehicleReport(
  report: InternalAiVehicleReportPreview,
  workflow: InternalAiServerReportSummaryWorkflow | null,
): Promise<InternalAiProfessionalVehicleReport> {
  const mezzo = await readNextMezzoByTarga(report.mezzoTarga);
  const [vehiclePhotoUrl, relatedAsset, gommeSnapshot] = await Promise.all([
    mezzo ? resolveVehiclePhoto(mezzo) : Promise.resolve<string | null>(null),
    readRelatedAsset(report.mezzoTarga),
    report.sections.some((section) => section.id === "gomme")
      ? readNextMezzoManutenzioniGommeSnapshot(report.mezzoTarga)
      : Promise.resolve(null),
  ]);

  const professionalSections = buildProfessionalSections(report, mezzo);
  const tyreVisual = gommeSnapshot ? buildTyreVisual(mezzo, gommeSnapshot.gommeItems) : null;
  const executiveSummary = buildExecutiveSummary({
    report,
    mezzo,
    relatedAsset,
    sections: professionalSections,
    tyreVisual,
  });
  const scadenze = buildScadenzeList(report, mezzo);
  const appendix = buildAppendix({ report, workflow });

  return {
    displayTitle: sanitizeUserFacingText(report.title) || "Report operativo mezzo",
    displaySubtitle:
      report.subtitle && report.subtitle !== report.title
        ? sanitizeUserFacingText(report.subtitle)
        : `Targa ${report.header.targa}`,
    targetLabel: report.header.targa,
    generatedAtLabel: formatDateLabel(report.generatedAt),
    periodLabel: report.periodContext.label,
    cards: report.cards,
    executiveSummary,
    vehicle: {
      label: "Mezzo",
      targa: report.header.targa,
      categoria: mezzo?.categoria ?? report.header.categoria ?? null,
      marcaModello: mezzo?.marcaModello ?? report.header.marcaModello ?? null,
      autistaNome: mezzo?.autistaNome ?? report.header.autistaNome ?? null,
      revisione: mezzo?.dataScadenzaRevisione ?? report.header.revisione ?? null,
      collaudo: mezzo?.dataUltimoCollaudo ?? null,
      precollaudo: pickPrecollaudoLabel(report),
      photoUrl: vehiclePhotoUrl,
      photoStatus: vehiclePhotoUrl ? "available" : "not_available",
    },
    relatedAsset,
    sections: professionalSections.map((section) =>
      section.id === "scadenze"
        ? {
            ...section,
            bullets: scadenze.length > 0 ? scadenze : section.bullets,
          }
        : section,
    ),
    tyreVisual,
    appendix,
  };
}
