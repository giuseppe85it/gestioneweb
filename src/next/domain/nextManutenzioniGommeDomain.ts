import { doc, getDoc } from "firebase/firestore";
import { wheelGeom, type WheelPoint } from "../../components/wheels";
import { db } from "../../firebase";
import {
  NEXT_MANUTENZIONI_DOMAIN,
  readNextMezzoManutenzioniSnapshot,
  type NextMaintenanceHistoryItem,
  type NextManutenzioneGommeInterventoTipo,
  type NextManutenzioneGommePerAsseRecord,
  type NextManutenzioneGommeStraordinarioRecord,
  type NextManutenzioneQuality,
  type NextScheduledMaintenance,
} from "./nextManutenzioniDomain";
import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";

const STORAGE_COLLECTION = "storage";
const GOMME_TMP_KEY = "@cambi_gomme_autisti_tmp";
const GOMME_EVENTI_KEY = "@gomme_eventi";
const NO_DATA_LABELS = new Set(["-", "n/d", "nd"]);

type RawRecord = Record<string, unknown>;

type NextLegacyDatasetShape =
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "missing"
  | "unsupported";

export type NextGommeSourceOrigin =
  | "manutenzione_derivata"
  | "evento_autista_tmp"
  | "evento_ufficiale";

export type NextGommeVehicleMatchReliability = "forte" | "plausibile";

export type NextGommeVehicleMatchField =
  | "manutenzione.targa"
  | "targetTarga"
  | "targa"
  | "targaCamion"
  | "targaRimorchio"
  | "contesto.targaCamion"
  | "contesto.targaRimorchio";

type NextGommeExternalDataset = typeof GOMME_TMP_KEY | typeof GOMME_EVENTI_KEY;
type NextWheelGeomKey = keyof typeof wheelGeom;
type NextTechnicalVista = "sinistra" | "destra";

export type NextManutenzioneAsseCoinvoltoId =
  | "anteriore"
  | "posteriore"
  | "asse1"
  | "asse2"
  | "asse3";

export type NextManutenzioneAsseOption = {
  id: NextManutenzioneAsseCoinvoltoId;
  label: string;
  wheelsCount: number;
};

export type NextManutenzioneTechnicalWheel = {
  id: string;
  axisId: NextManutenzioneAsseCoinvoltoId;
  x: number;
  y: number;
};

export type NextManutenzioneTechnicalView = {
  geomKey: NextWheelGeomKey;
  backgroundImage: string;
  isRimorchio: boolean;
  assi: NextManutenzioneAsseOption[];
  wheels: NextManutenzioneTechnicalWheel[];
};

type ParsedCambioGommeBlock = {
  evento: string;
  modalita: string | null;
  asseLabel: string | null;
  posizione: string | null;
  quantita: number | null;
  marca: string | null;
  km: number | null;
  interventoTipo: string | null;
  rotazioneText: string | null;
  flags: string[];
};

type NextGommeVehicleMatch = {
  field: NextGommeVehicleMatchField;
  reliability: NextGommeVehicleMatchReliability;
};

type NextStorageDatasetReadResult = {
  datasetShape: NextLegacyDatasetShape;
  items: unknown[];
};

export const NEXT_MANUTENZIONI_GOMME_DOMAIN = {
  code: "D02-GOM",
  name: "Manutenzioni e gomme mezzo",
  logicalDatasets: [
    ...NEXT_MANUTENZIONI_DOMAIN.logicalDatasets,
    GOMME_TMP_KEY,
    GOMME_EVENTI_KEY,
  ] as const,
  activeReadOnlyDatasets: [
    ...NEXT_MANUTENZIONI_DOMAIN.logicalDatasets,
    GOMME_TMP_KEY,
    GOMME_EVENTI_KEY,
  ] as const,
  normalizationStrategy:
    "STORICO_MANUTENZIONI_DA_LAYER_NEXT + CONVERGENZA_EVENTI_GOMME_BADGELESS_TARGA_FIRST",
} as const;

export type NextManutenzioneReadOnlyItem = {
  id: string;
  mezzoTarga: string;
  targa: string;
  data: string | null;
  dataLabel: string | null;
  timestamp: number | null;
  descrizione: string | null;
  tipo: string | null;
  km: number | null;
  ore: number | null;
  fornitore: string | null;
  materialiCount: number;
  assiCoinvolti: NextManutenzioneAsseCoinvoltoId[];
  gommePerAsse: NextManutenzioneGommePerAsseRecord[];
  gommeInterventoTipo: NextManutenzioneGommeInterventoTipo | null;
  gommeStraordinario: NextManutenzioneGommeStraordinarioRecord | null;
  isCambioGommeDerived: boolean;
  sourceDataset: string;
  sourceRecordId: string;
  sourceOrigin: string;
  quality: NextManutenzioneQuality;
  flags: string[];
};

export type NextGommeReadOnlyItem = {
  id: string;
  mezzoTarga: string;
  targa: string;
  data: string | null;
  dataLabel: string | null;
  timestamp: number | null;
  descrizione: string | null;
  evento: string;
  isCambioGommeDerived: boolean;
  modalita: string | null;
  posizione: string | null;
  asseLabel: string | null;
  quantita: number | null;
  pezzi: number | null;
  marca: string | null;
  km: number | null;
  costo: number | null;
  fornitore: string | null;
  sourceDataset: string;
  sourceRecordId: string;
  sourceMaintenanceId: string | null;
  sourceOrigin: NextGommeSourceOrigin;
  vehicleMatchReliability: NextGommeVehicleMatchReliability;
  vehicleMatchField: NextGommeVehicleMatchField;
  badgeAutista: string | null;
  autistaNome: string | null;
  statoEvento: string | null;
  interventoTipo: string | null;
  rotazioneText: string | null;
  quality: NextManutenzioneQuality;
  flags: string[];
};

export type NextGommeLegacyViewItem = {
  id: string;
  data: string;
  posizione: string;
  marca: string;
  km: number;
  costo: number;
  fornitore: string;
};

export type NextManutenzioneLegacyViewItem = {
  id: string;
  targa: string;
  tipo?: string;
  data?: string;
  timestamp?: number | null;
  km?: number;
  ore?: number;
  descrizione?: string;
};

export type NextGommePerAsseStatus = {
  asseId: NextManutenzioneAsseCoinvoltoId;
  asseLabel: string;
  dataCambio: string | null;
  kmCambio: number | null;
  kmAttuali: number | null;
  kmPercorsi: number | null;
  isMotorizzato: boolean;
  sourceMaintenanceId: string;
};

export type NextGommeStraordinarioEvent = {
  sourceMaintenanceId: string;
  dataLabel: string | null;
  motivo: string | null;
  asseId: NextManutenzioneAsseCoinvoltoId | null;
  asseLabel: string | null;
  quantita: number | null;
  descrizione: string | null;
  fornitore: string | null;
};

export type NextMezzoManutenzioniGommeSnapshot = {
  domainCode: typeof NEXT_MANUTENZIONI_GOMME_DOMAIN.code;
  domainName: typeof NEXT_MANUTENZIONI_GOMME_DOMAIN.name;
  mezzoTarga: string;
  logicalDatasets: readonly string[];
  activeReadOnlyDatasets: readonly string[];
  normalizationStrategy: typeof NEXT_MANUTENZIONI_GOMME_DOMAIN.normalizationStrategy;
  datasetShapes: {
    gommeTmp: NextLegacyDatasetShape;
    gommeEventi: NextLegacyDatasetShape;
  };
  scheduledMaintenance: NextScheduledMaintenance;
  maintenanceItems: NextManutenzioneReadOnlyItem[];
  gommeItems: NextGommeReadOnlyItem[];
  counts: {
    manutenzioni: number;
    manutenzioniConKm: number;
    manutenzioniConOre: number;
    manutenzioniConMateriali: number;
    gommeDerivate: number;
    gommeDaEventiTmp: number;
    gommeDaEventiUfficiali: number;
    gommeMatchForti: number;
    gommeMatchPlausibili: number;
    gommeDeduplicateConManutenzione: number;
    gommeConPosizione: number;
    gommeConQuantita: number;
    gommeConKm: number;
    gommeConFornitore: number;
  };
  limitations: string[];
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeMeaningfulText(value: unknown): string | null {
  const normalized = normalizeOptionalText(value);
  if (!normalized) return null;
  const compact = normalized.replace(/\s+/g, " ").trim();
  if (!compact) return null;
  return NO_DATA_LABELS.has(compact.toLowerCase()) ? null : compact;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").replace(/[^\d.-]/g, "").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function normalizeNextAssiCoinvolti(value: unknown): NextManutenzioneAsseCoinvoltoId[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((entry) => normalizeText(entry).toLowerCase())
        .filter(
          (entry): entry is NextManutenzioneAsseCoinvoltoId =>
            entry === "anteriore" ||
            entry === "posteriore" ||
            entry === "asse1" ||
            entry === "asse2" ||
            entry === "asse3",
        ),
    ),
  );
}

function buildTechnicalConfig(categoria?: string | null): {
  tipoLabel: string;
  assi: NextManutenzioneAsseOption[];
  isRimorchio: boolean;
} {
  const cat = (categoria || "").toLowerCase();

  if (cat.includes("trattore")) {
    return {
      tipoLabel: "Trattore",
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "posteriore", label: "Posteriore", wheelsCount: 4 },
      ],
      isRimorchio: false,
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
      isRimorchio: false,
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
      isRimorchio: false,
    };
  }

  if (cat.includes("motrice 2")) {
    return {
      tipoLabel: "Motrice 2 assi",
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "asse1", label: "1 asse", wheelsCount: 4 },
      ],
      isRimorchio: false,
    };
  }

  if (cat.includes("biga")) {
    return {
      tipoLabel: "Rimorchio 2 assi",
      assi: [
        { id: "asse1", label: "1 asse", wheelsCount: 4 },
        { id: "asse2", label: "2 asse", wheelsCount: 4 },
      ],
      isRimorchio: true,
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
      isRimorchio: true,
    };
  }

  return {
    tipoLabel: categoria || "Mezzo",
    assi: [],
    isRimorchio: false,
  };
}

function resolveTechnicalGeomKey(categoria?: string | null): NextWheelGeomKey | null {
  const cat = (categoria || "").toLowerCase();
  if (!cat) return null;
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
  return null;
}

export function resolveNextManutenzioneTechnicalCategoryKey(
  categoria?: string | null,
): string | null {
  return resolveTechnicalGeomKey(categoria);
}

function buildTechnicalWheels(
  assi: NextManutenzioneAsseOption[],
  points: WheelPoint[],
  key: string,
): NextManutenzioneTechnicalWheel[] {
  if (!assi.length || !points.length) return [];

  const totalPoints = points.length;
  let perSideCounts = assi.map((asse) => Math.max(1, Math.round(asse.wheelsCount / 2)));
  const expected = perSideCounts.reduce((sum, count) => sum + count, 0);

  if (expected !== totalPoints) {
    const base = Math.floor(totalPoints / assi.length);
    const rest = totalPoints % assi.length;
    perSideCounts = assi.map((_, index) => base + (index < rest ? 1 : 0));
  }

  const wheels: NextManutenzioneTechnicalWheel[] = [];
  let cursor = 0;

  assi.forEach((asse, axisIndex) => {
    const count = perSideCounts[axisIndex];
    for (let index = 0; index < count && cursor < totalPoints; index += 1, cursor += 1) {
      const point = points[cursor];
      wheels.push({
        id: `${key}-${asse.id}-${cursor}`,
        axisId: asse.id,
        x: point.cx,
        y: point.cy,
      });
    }
  });

  return wheels;
}

export function getNextAssiOptionsForCategoria(
  categoria?: string | null,
): NextManutenzioneAsseOption[] {
  return buildTechnicalConfig(categoria).assi;
}

export function isNextCategoriaMotorizzata(
  categoria?: string | null,
): boolean {
  const config = buildTechnicalConfig(categoria);
  return config.assi.length > 0 && !config.isRimorchio;
}

export function resolveNextManutenzioneTechnicalView(
  categoria: string | null | undefined,
  vista: NextTechnicalVista,
): NextManutenzioneTechnicalView | null {
  const geomKey = resolveTechnicalGeomKey(categoria);
  if (!geomKey) return null;

  const config = buildTechnicalConfig(categoria);
  if (config.assi.length === 0) return null;

  const geomEntry = wheelGeom[geomKey];
  const points = vista === "destra" ? geomEntry.dx : geomEntry.sx;
  const backgroundImage = `/gomme/${vista === "destra" ? geomEntry.imageDX : geomEntry.imageSX}`;

  return {
    geomKey,
    backgroundImage,
    isRimorchio: config.isRimorchio,
    assi: config.assi,
    wheels: buildTechnicalWheels(config.assi, points, `${geomKey}-${vista}`),
  };
}

export function buildNextGommeStateByAsse(args: {
  categoria?: string | null;
  maintenanceItems: NextManutenzioneReadOnlyItem[];
  kmAttuali?: number | null;
}): NextGommePerAsseStatus[] {
  const assi = getNextAssiOptionsForCategoria(args.categoria);
  if (!assi.length) return [];

  const assiById = new Map(assi.map((entry) => [entry.id, entry] as const));
  const isMotorizzato = isNextCategoriaMotorizzata(args.categoria);
  const sortedItems = [...args.maintenanceItems].sort((left, right) => {
    const rightTs = right.timestamp ?? parseDateFlexible(right.data)?.getTime() ?? 0;
    const leftTs = left.timestamp ?? parseDateFlexible(left.data)?.getTime() ?? 0;
    return rightTs - leftTs;
  });
  const byAsse = new Map<NextManutenzioneAsseCoinvoltoId, NextGommePerAsseStatus>();

  for (const item of sortedItems) {
    const entries = deriveGommePerAsseFromMaintenance(item);
    if (!entries.length) continue;

    for (const entry of entries) {
      if (byAsse.has(entry.asseId)) continue;
      const asse = assiById.get(entry.asseId);
      if (!asse) continue;

      const kmCambio = isMotorizzato ? entry.kmCambio : null;
      const kmAttuali = isMotorizzato ? args.kmAttuali ?? null : null;
      const kmPercorsi =
        kmCambio !== null && kmAttuali !== null && kmAttuali >= kmCambio
          ? kmAttuali - kmCambio
          : null;

      byAsse.set(entry.asseId, {
        asseId: entry.asseId,
        asseLabel: asse.label,
        dataCambio: entry.dataCambio,
        kmCambio,
        kmAttuali,
        kmPercorsi,
        isMotorizzato,
        sourceMaintenanceId: item.id,
      });
    }
  }

  return assi
    .map((asse) => byAsse.get(asse.id))
    .filter((entry): entry is NextGommePerAsseStatus => Boolean(entry));
}

function parseDateFlexible(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "object" && value !== null) {
    const maybe = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };

    if (typeof maybe.toDate === "function") {
      const date = maybe.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
    }

    if (typeof maybe.seconds === "number") {
      const date = new Date(maybe.seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof maybe._seconds === "number") {
      const date = new Date(maybe._seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;

  const dmyMatch = raw.match(
    /^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2}))?$/,
  );
  if (!dmyMatch) return null;

  const yearRaw = Number(dmyMatch[3]);
  const year = dmyMatch[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
  const month = Number(dmyMatch[2]) - 1;
  const day = Number(dmyMatch[1]);
  const hours = Number(dmyMatch[4] ?? "12");
  const minutes = Number(dmyMatch[5] ?? "00");
  const date = new Date(year, month, day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateLabel(date: Date | null): string | null {
  if (!date || Number.isNaN(date.getTime())) return null;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function buildDateLabel(rawValue: unknown, timestamp: number | null): string | null {
  const parsed = parseDateFlexible(rawValue);
  if (parsed) return formatDateLabel(parsed);
  if (timestamp !== null) return formatDateLabel(new Date(timestamp));
  return normalizeOptionalText(rawValue);
}

function unwrapStorageArray(
  rawDoc: Record<string, unknown> | unknown[] | null,
): NextStorageDatasetReadResult {
  if (!rawDoc) {
    return { datasetShape: "missing", items: [] };
  }

  if (Array.isArray(rawDoc)) {
    return { datasetShape: "array", items: rawDoc };
  }

  if (Array.isArray(rawDoc.items)) {
    return { datasetShape: "items", items: rawDoc.items };
  }

  if (Array.isArray((rawDoc.value as { items?: unknown[] } | undefined)?.items)) {
    return {
      datasetShape: "value.items",
      items: (rawDoc.value as { items: unknown[] }).items,
    };
  }

  if (Array.isArray(rawDoc.value)) {
    return { datasetShape: "value", items: rawDoc.value };
  }

  return { datasetShape: "unsupported", items: [] };
}

async function readStorageDataset(key: string): Promise<NextStorageDatasetReadResult> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, key));
  const rawDoc = snapshot.exists()
    ? ((snapshot.data() as Record<string, unknown>) ?? null)
    : null;
  return unwrapStorageArray(rawDoc);
}

function splitCambioGommeBlocks(descrizione: string | null): string[] {
  if (!descrizione) return [];

  const lines = descrizione
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim());

  const blocks: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (/^CAMBIO GOMME\b/i.test(line)) {
      if (current.length > 0) {
        blocks.push(current.join("\n").trim());
      }
      current = [line];
      continue;
    }

    if (current.length > 0) {
      current.push(line);
    }
  }

  if (current.length > 0) {
    blocks.push(current.join("\n").trim());
  }

  return blocks.filter(Boolean);
}

function parseCambioGommeBlock(block: string): ParsedCambioGommeBlock | null {
  const lines = block
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0 || !/^CAMBIO GOMME\b/i.test(lines[0])) {
    return null;
  }

  const header = lines[0];
  const normalizedHeader = header.replace(/[\u2013\u2014]/g, "-");
  const modalitaMatch = normalizedHeader.match(/^CAMBIO GOMME(?:\s*-\s*(.+))?$/i);
  const modalita = normalizeMeaningfulText(modalitaMatch?.[1]);

  let asseLabel: string | null = null;
  let quantita: number | null = null;
  let marca: string | null = null;
  let km: number | null = null;
  let interventoTipo: string | null = null;
  let rotazioneText: string | null = null;
  const flags: string[] = [];

  for (const line of lines.slice(1)) {
    if (/^asse\s*:/i.test(line)) {
      asseLabel = normalizeMeaningfulText(line.replace(/^asse\s*:/i, ""));
      continue;
    }
    if (/^gomme cambiate\s*:/i.test(line)) {
      quantita = normalizeNumber(line.replace(/^gomme cambiate\s*:/i, ""));
      continue;
    }
    if (/^marca\s*:/i.test(line)) {
      marca = normalizeMeaningfulText(line.replace(/^marca\s*:/i, ""));
      continue;
    }
    if (/^km mezzo\s*:/i.test(line)) {
      km = normalizeNumber(line.replace(/^km mezzo\s*:/i, ""));
      continue;
    }
    if (/^intervento\s*:/i.test(line)) {
      interventoTipo = normalizeMeaningfulText(line.replace(/^intervento\s*:/i, ""));
      continue;
    }
    if (/^rotazione\s*:/i.test(line)) {
      rotazioneText = normalizeMeaningfulText(line.replace(/^rotazione\s*:/i, ""));
      continue;
    }
  }

  if (!asseLabel) flags.push("asse_non_disponibile");
  if (quantita === null) flags.push("quantita_non_disponibile");
  if (!marca) flags.push("marca_non_disponibile");
  if (km === null) flags.push("km_non_disponibile");

  return {
    evento: modalita ? `CAMBIO GOMME - ${modalita}` : "CAMBIO GOMME",
    modalita,
    asseLabel,
    posizione: asseLabel,
    quantita,
    marca,
    km,
    interventoTipo,
    rotazioneText,
    flags,
  };
}

function dedupeFlags(flags: string[]): string[] {
  return Array.from(new Set(flags.filter(Boolean)));
}

function resolveAsseIdFromLabel(
  value: string | null | undefined,
): NextManutenzioneAsseCoinvoltoId | null {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return null;

  if (normalized.includes("anter")) return "anteriore";
  if (normalized.includes("poster")) return "posteriore";
  if (normalized === "asse1" || normalized === "asse 1" || normalized === "1asse" || normalized === "1 asse") {
    return "asse1";
  }
  if (normalized === "asse2" || normalized === "asse 2" || normalized === "2asse" || normalized === "2 asse") {
    return "asse2";
  }
  if (normalized === "asse3" || normalized === "asse 3" || normalized === "3asse" || normalized === "3 asse") {
    return "asse3";
  }
  return null;
}

function getFallbackAsseLabel(
  asseId: NextManutenzioneAsseCoinvoltoId | null | undefined,
): string | null {
  if (!asseId) return null;
  if (asseId === "anteriore") return "Anteriore";
  if (asseId === "posteriore") return "Posteriore";
  if (asseId === "asse1") return "1 asse";
  if (asseId === "asse2") return "2 asse";
  if (asseId === "asse3") return "3 asse";
  return asseId;
}

function isTyreMaintenanceItem(item: {
  descrizione: string | null;
  gommeInterventoTipo: NextManutenzioneGommeInterventoTipo | null;
  isCambioGommeDerived: boolean;
  assiCoinvolti: NextManutenzioneAsseCoinvoltoId[];
  gommePerAsse: NextManutenzioneGommePerAsseRecord[];
}): boolean {
  if (item.gommeInterventoTipo === "straordinario") return false;
  if (item.gommePerAsse.length > 0) return true;
  if (item.gommeInterventoTipo === "ordinario" && item.assiCoinvolti.length > 0) return true;
  if (item.isCambioGommeDerived && item.assiCoinvolti.length > 0) return true;
  const normalized = normalizeText(item.descrizione).toUpperCase();
  return (normalized.includes("GOMME") || normalized.includes("PNEUM")) && item.assiCoinvolti.length > 0;
}

function deriveGommePerAsseFromMaintenance(
  item: NextManutenzioneReadOnlyItem,
): NextManutenzioneGommePerAsseRecord[] {
  if (item.gommePerAsse.length > 0) {
    return item.gommePerAsse;
  }

  const fromBlocks = splitCambioGommeBlocks(item.descrizione)
    .map((block) => parseCambioGommeBlock(block))
    .filter((entry): entry is ParsedCambioGommeBlock => Boolean(entry))
    .map<NextManutenzioneGommePerAsseRecord | null>((entry) => {
      const asseId = resolveAsseIdFromLabel(entry.asseLabel);
      if (!asseId) return null;
      return {
        asseId,
        dataCambio: item.dataLabel ?? item.data ?? null,
        kmCambio: entry.km ?? item.km,
      };
    })
    .filter((entry): entry is NextManutenzioneGommePerAsseRecord => Boolean(entry));

  if (fromBlocks.length > 0) {
    return fromBlocks;
  }

  if (!isTyreMaintenanceItem(item)) {
    return [];
  }

  return item.assiCoinvolti.map((asseId) => ({
    asseId,
    dataCambio: item.dataLabel ?? item.data ?? null,
    kmCambio: item.km,
  }));
}

function buildStraordinarioEventLabel(
  item: NextManutenzioneReadOnlyItem,
): string | null {
  const motivo = normalizeMeaningfulText(item.gommeStraordinario?.motivo);
  if (motivo) return motivo;

  const normalized = normalizeMeaningfulText(item.descrizione);
  if (!normalized) return null;
  return normalized.toUpperCase().includes("GOMME") ? "Evento gomme straordinario" : normalized;
}

function buildOrdinarioEventLabel(
  entry: NextManutenzioneGommePerAsseRecord,
): string {
  const asseLabel = getFallbackAsseLabel(entry.asseId);
  return asseLabel ? `CAMBIO GOMME ORDINARIO - ${asseLabel}` : "CAMBIO GOMME ORDINARIO";
}

function buildStructuredMaintenanceDescription(
  item: NextManutenzioneReadOnlyItem,
): string | null {
  if (item.gommeInterventoTipo === "straordinario") {
    return buildStraordinarioEventLabel(item);
  }

  const entries = deriveGommePerAsseFromMaintenance(item);
  if (entries.length === 0) {
    return normalizeMeaningfulText(item.descrizione);
  }

  const asseLabels = Array.from(
    new Set(
      entries
        .map((entry) => getFallbackAsseLabel(entry.asseId))
        .filter((entry): entry is string => Boolean(entry)),
    ),
  );

  if (asseLabels.length === 0) {
    return "CAMBIO GOMME ORDINARIO";
  }

  return `CAMBIO GOMME ORDINARIO - ${asseLabels.join(", ")}`;
}

export function buildNextGommeStraordinarieEvents(args: {
  categoria?: string | null;
  maintenanceItems: NextManutenzioneReadOnlyItem[];
}): NextGommeStraordinarioEvent[] {
  const assiMap = new Map(
    getNextAssiOptionsForCategoria(args.categoria).map((asse) => [asse.id, asse.label] as const),
  );

  return [...args.maintenanceItems]
    .filter((item) => item.gommeInterventoTipo === "straordinario")
    .sort((left, right) => {
      const rightTs = right.timestamp ?? parseDateFlexible(right.data)?.getTime() ?? 0;
      const leftTs = left.timestamp ?? parseDateFlexible(left.data)?.getTime() ?? 0;
      return rightTs - leftTs;
    })
    .map((item) => {
      const asseId = item.gommeStraordinario?.asseId ?? null;
      return {
        sourceMaintenanceId: item.id,
        dataLabel: item.dataLabel ?? item.data ?? null,
        motivo: buildStraordinarioEventLabel(item),
        asseId,
        asseLabel: asseId ? assiMap.get(asseId) ?? asseId : null,
        quantita: item.gommeStraordinario?.quantita ?? null,
        descrizione: item.descrizione,
        fornitore: item.fornitore,
      };
    });
}

function sortGommeItems(items: NextGommeReadOnlyItem[]): NextGommeReadOnlyItem[] {
  return [...items].sort((left, right) => {
    const rightTs = right.timestamp ?? -1;
    const leftTs = left.timestamp ?? -1;
    if (rightTs !== leftTs) return rightTs - leftTs;
    return left.id.localeCompare(right.id);
  });
}

function buildTyreDayKey(item: Pick<NextGommeReadOnlyItem, "timestamp" | "data" | "dataLabel">): string | null {
  const parsed =
    (item.timestamp !== null ? new Date(item.timestamp) : null) ??
    parseDateFlexible(item.dataLabel) ??
    parseDateFlexible(item.data);

  if (!parsed || Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildTyreDedupSignature(item: NextGommeReadOnlyItem): string | null {
  const dayKey = buildTyreDayKey(item);
  const asseLabel = normalizeMeaningfulText(item.asseLabel ?? item.posizione);
  const marca = normalizeMeaningfulText(item.marca);
  const km = item.km;

  if (!dayKey || !asseLabel || !marca || km === null) {
    return null;
  }

  const typeLabel =
    normalizeMeaningfulText(item.interventoTipo) ??
    normalizeMeaningfulText(item.rotazioneText) ??
    normalizeMeaningfulText(item.modalita) ??
    normalizeMeaningfulText(item.evento) ??
    "evento_gomme";

  return [
    item.mezzoTarga,
    dayKey,
    asseLabel.toLowerCase(),
    marca.toLowerCase(),
    String(km),
    typeLabel.toLowerCase(),
  ].join("|");
}

function toMaintenanceItem(item: NextMaintenanceHistoryItem): NextManutenzioneReadOnlyItem {
  const flags: string[] = [];

  if (!item.descrizione) flags.push("descrizione_non_disponibile");
  if (item.timestamp === null && item.dataRaw) flags.push("data_non_parseabile");
  if (item.km === null) flags.push("km_non_disponibile");
  if (item.ore === null) flags.push("ore_non_disponibili");
  if (!item.fornitoreLabel && item.eseguitoLabel) flags.push("fornitore_da_eseguito");
  if (item.isCambioGommeDerived) flags.push("evento_gomme_derivato_da_descrizione");

  return {
    id: item.id,
    mezzoTarga: item.mezzoTarga,
    targa: item.mezzoTarga,
    data: item.dataRaw,
    dataLabel: item.dataRaw,
    timestamp: item.timestamp,
    descrizione: item.descrizione,
    tipo: item.tipo,
    km: item.km,
    ore: item.ore,
    fornitore: item.fornitoreLabel,
    materialiCount: item.materialiCount,
    assiCoinvolti: normalizeNextAssiCoinvolti(item.assiCoinvolti),
    gommePerAsse: item.gommePerAsse,
    gommeInterventoTipo: item.gommeInterventoTipo,
    gommeStraordinario: item.gommeStraordinario,
    isCambioGommeDerived: item.isCambioGommeDerived,
    sourceDataset: item.sourceDataset,
    sourceRecordId: item.id,
    sourceOrigin: item.sourceOrigin,
    quality: item.quality,
    flags: dedupeFlags(flags),
  };
}

function toGommeItems(item: NextManutenzioneReadOnlyItem): NextGommeReadOnlyItem[] {
  if (item.gommeInterventoTipo === "straordinario") {
    const motivo = normalizeMeaningfulText(item.gommeStraordinario?.motivo);
    const asseLabel = getFallbackAsseLabel(item.gommeStraordinario?.asseId);
    const flags: string[] = [];
    if (!motivo) flags.push("motivo_straordinario_non_disponibile");
    if (!item.fornitore) flags.push("fornitore_non_disponibile");
    flags.push("costo_non_disponibile");

    return [
      {
        id: `${item.id}:gomme-straordinarie`,
        mezzoTarga: item.mezzoTarga,
        targa: item.targa,
        data: item.data,
        dataLabel: item.dataLabel,
        timestamp: item.timestamp,
        descrizione: item.descrizione,
        evento: motivo ? `CAMBIO GOMME STRAORDINARIO - ${motivo}` : "CAMBIO GOMME STRAORDINARIO",
        isCambioGommeDerived: true,
        modalita: "straordinario",
        posizione: asseLabel,
        asseLabel,
        quantita: item.gommeStraordinario?.quantita ?? null,
        pezzi: item.gommeStraordinario?.quantita ?? null,
        marca: null,
        km: item.km,
        costo: null,
        fornitore: item.fornitore,
        sourceDataset: item.sourceDataset,
        sourceRecordId: `${item.id}:gomme-straordinarie`,
        sourceMaintenanceId: item.id,
        sourceOrigin: "manutenzione_derivata",
        vehicleMatchReliability: "forte",
        vehicleMatchField: "manutenzione.targa",
        badgeAutista: null,
        autistaNome: null,
        statoEvento: null,
        interventoTipo: motivo,
        rotazioneText: null,
        quality: "derived_acceptable",
        flags: dedupeFlags(flags),
      },
    ];
  }

  const structuredEntries = deriveGommePerAsseFromMaintenance(item);
  if (structuredEntries.length > 0) {
    return sortGommeItems(
      structuredEntries.map((entry, index) => {
        const asseLabel = getFallbackAsseLabel(entry.asseId);
        const flags: string[] = ["evento_gomme_strutturato_per_asse", "costo_non_disponibile"];
        if (!item.fornitore) flags.push("fornitore_non_disponibile");
        if (!asseLabel) flags.push("asse_non_disponibile");
        if ((entry.kmCambio ?? item.km) === null) flags.push("km_non_disponibile");

        return {
          id: `${item.id}:gomme-strutturate:${index}`,
          mezzoTarga: item.mezzoTarga,
          targa: item.targa,
          data: item.data,
          dataLabel: entry.dataCambio ?? item.dataLabel,
          timestamp: item.timestamp,
          descrizione: item.descrizione,
          evento: buildOrdinarioEventLabel(entry),
          isCambioGommeDerived: true,
          modalita: "ordinario",
          posizione: asseLabel,
          asseLabel,
          quantita: null,
          pezzi: null,
          marca: null,
          km: entry.kmCambio ?? item.km,
          costo: null,
          fornitore: item.fornitore,
          sourceDataset: item.sourceDataset,
          sourceRecordId: `${item.id}:gomme-strutturate:${index}`,
          sourceMaintenanceId: item.id,
          sourceOrigin: "manutenzione_derivata",
          vehicleMatchReliability: "forte",
          vehicleMatchField: "manutenzione.targa",
          badgeAutista: null,
          autistaNome: null,
          statoEvento: null,
          interventoTipo: "Ordinario per asse",
          rotazioneText: null,
          quality: "source_direct",
          flags: dedupeFlags(flags),
        };
      }),
    );
  }

  const blocks = splitCambioGommeBlocks(item.descrizione);
  if (blocks.length === 0) return [];

  const items: NextGommeReadOnlyItem[] = [];

  blocks.forEach((block, index) => {
    const parsed = parseCambioGommeBlock(block);
    if (!parsed) return;

    const flags = [...parsed.flags];
    if (!item.fornitore) flags.push("fornitore_non_disponibile");
    flags.push("costo_non_disponibile");

    items.push({
      id: `${item.id}:gomme:${index}`,
      mezzoTarga: item.mezzoTarga,
      targa: item.targa,
      data: item.data,
      dataLabel: item.dataLabel,
      timestamp: item.timestamp,
      descrizione: block,
      evento: parsed.evento,
      isCambioGommeDerived: true,
      modalita: parsed.modalita,
      posizione: parsed.posizione,
      asseLabel: parsed.asseLabel,
      quantita: parsed.quantita,
      pezzi: parsed.quantita,
      marca: parsed.marca,
      km: parsed.km,
      costo: null,
      fornitore: item.fornitore,
      sourceDataset: item.sourceDataset,
      sourceRecordId: `${item.id}:gomme:${index}`,
      sourceMaintenanceId: item.id,
      sourceOrigin: "manutenzione_derivata",
      vehicleMatchReliability: "forte",
      vehicleMatchField: "manutenzione.targa",
      badgeAutista: null,
      autistaNome: null,
      statoEvento: null,
      interventoTipo: parsed.interventoTipo,
      rotazioneText: parsed.rotazioneText,
      quality: "derived_acceptable",
      flags: dedupeFlags(flags),
    });
  });

  return sortGommeItems(items);
}

function resolveEventAutista(record: RawRecord): {
  badgeAutista: string | null;
  autistaNome: string | null;
} {
  const autista =
    record.autista && typeof record.autista === "object"
      ? (record.autista as RawRecord)
      : null;

  return {
    badgeAutista: normalizeMeaningfulText(
      autista?.badge ?? record.badgeAutista ?? record.badge,
    ),
    autistaNome: normalizeMeaningfulText(
      autista?.nome ?? record.autistaNome ?? record.nomeAutista ?? record.autista,
    ),
  };
}

function resolveExternalTyreMatch(
  record: RawRecord,
  mezzoTarga: string,
): NextGommeVehicleMatch | null {
  const targetTarga = normalizeNextMezzoTarga(record.targetTarga);
  if (targetTarga === mezzoTarga) {
    return { field: "targetTarga", reliability: "forte" };
  }

  const directTarga = normalizeNextMezzoTarga(record.targa);
  if (directTarga === mezzoTarga) {
    return { field: "targa", reliability: "forte" };
  }

  if (targetTarga || directTarga) {
    return null;
  }

  const contesto =
    record.contesto && typeof record.contesto === "object"
      ? (record.contesto as RawRecord)
      : null;

  const plausibleCandidates: Array<{
    field: NextGommeVehicleMatchField;
    value: unknown;
  }> = [
    { field: "targaCamion", value: record.targaCamion },
    { field: "targaRimorchio", value: record.targaRimorchio },
    { field: "contesto.targaCamion", value: contesto?.targaCamion },
    { field: "contesto.targaRimorchio", value: contesto?.targaRimorchio },
  ];

  for (const candidate of plausibleCandidates) {
    if (normalizeNextMezzoTarga(candidate.value) === mezzoTarga) {
      return {
        field: candidate.field,
        reliability: "plausibile",
      };
    }
  }

  return null;
}

function resolveExternalTyreEventLabel(record: RawRecord): {
  evento: string;
  modalita: string | null;
  interventoTipo: string | null;
  rotazioneText: string | null;
} {
  const interventoTipo = normalizeMeaningfulText(record.tipo ?? record.tipoIntervento);
  const rotazioneText = normalizeMeaningfulText(record.rotazioneText);
  const modalita = interventoTipo;

  if (!interventoTipo) {
    return {
      evento: rotazioneText ? "ROTAZIONE GOMME" : "EVENTO GOMME",
      modalita,
      interventoTipo,
      rotazioneText,
    };
  }

  const upper = interventoTipo.toUpperCase();
  if (upper === "ROTAZIONE") {
    return {
      evento: "ROTAZIONE GOMME",
      modalita,
      interventoTipo,
      rotazioneText,
    };
  }

  if (upper === "SOSTITUZIONE" || upper === "CAMBIO") {
    return {
      evento: "CAMBIO GOMME",
      modalita,
      interventoTipo,
      rotazioneText,
    };
  }

  return {
    evento: `EVENTO GOMME - ${interventoTipo.toUpperCase()}`,
    modalita,
    interventoTipo,
    rotazioneText,
  };
}

function buildExternalTyreDescription(args: {
  eventLabel: string;
  asseLabel: string | null;
  marca: string | null;
  km: number | null;
  interventoTipo: string | null;
  rotazioneText: string | null;
  sourceOrigin: NextGommeSourceOrigin;
}): string {
  const lines = [
    args.eventLabel,
    `fonte: ${args.sourceOrigin === "evento_ufficiale" ? "@gomme_eventi" : "@cambi_gomme_autisti_tmp"}`,
  ];

  if (args.asseLabel) lines.push(`asse: ${args.asseLabel}`);
  if (args.marca) lines.push(`marca: ${args.marca}`);
  if (args.km !== null) lines.push(`km mezzo: ${args.km}`);
  if (args.interventoTipo) lines.push(`intervento: ${args.interventoTipo}`);
  if (args.rotazioneText) lines.push(`rotazione: ${args.rotazioneText}`);

  return lines.join("\n");
}

function buildExternalEventId(
  dataset: NextGommeExternalDataset,
  record: RawRecord,
  index: number,
  mezzoTarga: string,
): string {
  const id = normalizeMeaningfulText(record.id);
  if (id) return `${dataset}:${id}`;
  return `${dataset}:${mezzoTarga}:${index}`;
}

function buildSourceRecordId(record: RawRecord, index: number, mezzoTarga: string): string {
  return normalizeMeaningfulText(record.id) ?? `evento:${mezzoTarga}:${index}`;
}

function resolveExternalTyreEvent(
  record: RawRecord,
  index: number,
  mezzoTarga: string,
  dataset: NextGommeExternalDataset,
): NextGommeReadOnlyItem | null {
  const match = resolveExternalTyreMatch(record, mezzoTarga);
  if (!match) return null;

  const timestamp =
    parseDateFlexible(record.timestamp)?.getTime() ??
    parseDateFlexible(record.data)?.getTime() ??
    null;
  const dataLabel = buildDateLabel(record.data ?? record.timestamp, timestamp);
  const asseLabel =
    normalizeMeaningfulText(record.asseLabel) ??
    normalizeMeaningfulText(record.asseId);
  const quantita =
    Array.isArray(record.gommeIds) && record.gommeIds.length > 0
      ? record.gommeIds.length
      : normalizeNumber(record.quantita ?? record.pezzi);
  const marca = normalizeMeaningfulText(record.marca);
  const km = normalizeNumber(record.km ?? record.kmMezzo);
  const { badgeAutista, autistaNome } = resolveEventAutista(record);
  const { evento, modalita, interventoTipo, rotazioneText } =
    resolveExternalTyreEventLabel(record);
  const sourceOrigin: NextGommeSourceOrigin =
    dataset === GOMME_EVENTI_KEY ? "evento_ufficiale" : "evento_autista_tmp";
  const flags: string[] = [];

  if (match.reliability === "plausibile") {
    flags.push("match_mezzo_plausibile_da_contesto");
  }
  if (timestamp === null) flags.push("data_non_disponibile");
  if (!asseLabel) flags.push("asse_non_disponibile");
  if (!marca) flags.push("marca_non_disponibile");
  if (km === null) flags.push("km_non_disponibile");
  if (quantita === null) flags.push("quantita_non_disponibile");
  if (!badgeAutista) flags.push("badge_autista_non_disponibile");
  if (!autistaNome) flags.push("autista_non_disponibile");
  flags.push(dataset === GOMME_EVENTI_KEY ? "fonte_evento_ufficiale" : "fonte_evento_tmp");
  flags.push("costo_non_disponibile");
  flags.push("fornitore_non_disponibile");

  return {
    id: buildExternalEventId(dataset, record, index, mezzoTarga),
    mezzoTarga,
    targa: mezzoTarga,
    data: dataLabel,
    dataLabel,
    timestamp,
    descrizione: buildExternalTyreDescription({
      eventLabel: evento,
      asseLabel,
      marca,
      km,
      interventoTipo,
      rotazioneText,
      sourceOrigin,
    }),
    evento,
    isCambioGommeDerived: false,
    modalita,
    posizione: asseLabel,
    asseLabel,
    quantita,
    pezzi: quantita,
    marca,
    km,
    costo: null,
    fornitore: null,
    sourceDataset: dataset,
    sourceRecordId: buildSourceRecordId(record, index, mezzoTarga),
    sourceMaintenanceId: null,
    sourceOrigin,
    vehicleMatchReliability: match.reliability,
    vehicleMatchField: match.field,
    badgeAutista,
    autistaNome,
    statoEvento: normalizeMeaningfulText(record.stato),
    interventoTipo,
    rotazioneText,
    quality: match.reliability === "forte" ? "source_direct" : "derived_acceptable",
    flags: dedupeFlags(flags),
  };
}

function dedupeExternalTyreItems(items: NextGommeReadOnlyItem[]): NextGommeReadOnlyItem[] {
  const ordered = [...items].sort((left, right) => {
    const leftOfficial = left.sourceOrigin === "evento_ufficiale" ? 1 : 0;
    const rightOfficial = right.sourceOrigin === "evento_ufficiale" ? 1 : 0;
    if (leftOfficial !== rightOfficial) return rightOfficial - leftOfficial;

    const leftStrong = left.vehicleMatchReliability === "forte" ? 1 : 0;
    const rightStrong = right.vehicleMatchReliability === "forte" ? 1 : 0;
    if (leftStrong !== rightStrong) return rightStrong - leftStrong;

    const rightTs = right.timestamp ?? -1;
    const leftTs = left.timestamp ?? -1;
    if (rightTs !== leftTs) return rightTs - leftTs;

    return left.id.localeCompare(right.id);
  });

  const byRecordId = new Map<string, NextGommeReadOnlyItem>();
  ordered.forEach((item) => {
    const key = item.sourceRecordId;
    if (!byRecordId.has(key)) {
      byRecordId.set(key, item);
    }
  });

  return sortGommeItems(Array.from(byRecordId.values()));
}

function dedupeExternalAgainstMaintenance(args: {
  maintenanceDerivedItems: NextGommeReadOnlyItem[];
  externalItems: NextGommeReadOnlyItem[];
}): { items: NextGommeReadOnlyItem[]; deduplicatedCount: number } {
  const maintenanceSignatures = new Set(
    args.maintenanceDerivedItems
      .map(buildTyreDedupSignature)
      .filter((entry): entry is string => Boolean(entry)),
  );

  let deduplicatedCount = 0;
  const items = args.externalItems.filter((item) => {
    const signature = buildTyreDedupSignature(item);
    if (!signature || !maintenanceSignatures.has(signature)) {
      return true;
    }

    deduplicatedCount += 1;
    return false;
  });

  return { items, deduplicatedCount };
}

export function mapNextManutenzioniItemsToLegacyView(
  items: NextManutenzioneReadOnlyItem[],
): NextManutenzioneLegacyViewItem[] {
  return items.map((item) => ({
    id: item.id,
    targa: item.mezzoTarga,
    tipo: item.tipo ?? undefined,
    data: item.dataLabel ?? item.data ?? undefined,
    timestamp: item.timestamp,
    km: item.km ?? undefined,
    ore: item.ore ?? undefined,
    descrizione: buildStructuredMaintenanceDescription(item) ?? undefined,
  }));
}

export function mapNextGommeItemsToLegacyView(
  items: NextGommeReadOnlyItem[],
): NextGommeLegacyViewItem[] {
  return items.map((item) => ({
    id: item.id,
    data: item.dataLabel ?? item.data ?? "",
    posizione: item.posizione || "Cambio gomme",
    marca: item.marca || "",
    km: item.km ?? 0,
    costo: item.costo ?? 0,
    fornitore: item.fornitore || "",
  }));
}

export async function readNextMezzoManutenzioniGommeSnapshot(
  targa: string,
): Promise<NextMezzoManutenzioniGommeSnapshot> {
  const mezzoTarga = normalizeNextMezzoTarga(targa);
  const [maintenanceSnapshot, gommeTmpDataset, gommeEventiDataset] = await Promise.all([
    readNextMezzoManutenzioniSnapshot(mezzoTarga),
    readStorageDataset(GOMME_TMP_KEY),
    readStorageDataset(GOMME_EVENTI_KEY),
  ]);

  const maintenanceItems = maintenanceSnapshot.historyItems.map(toMaintenanceItem);
  const maintenanceDerivedGommeItems = maintenanceItems.flatMap(toGommeItems);

  const tmpItems = gommeTmpDataset.items
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      return resolveExternalTyreEvent(
        entry as RawRecord,
        index,
        mezzoTarga,
        GOMME_TMP_KEY,
      );
    })
    .filter((entry): entry is NextGommeReadOnlyItem => Boolean(entry));

  const officialItems = gommeEventiDataset.items
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      return resolveExternalTyreEvent(
        entry as RawRecord,
        index,
        mezzoTarga,
        GOMME_EVENTI_KEY,
      );
    })
    .filter((entry): entry is NextGommeReadOnlyItem => Boolean(entry));

  const dedupedExternalItems = dedupeExternalTyreItems([...officialItems, ...tmpItems]);
  const externalDedupedAgainstMaintenance = dedupeExternalAgainstMaintenance({
    maintenanceDerivedItems: maintenanceDerivedGommeItems,
    externalItems: dedupedExternalItems,
  });
  const gommeItems = sortGommeItems([
    ...maintenanceDerivedGommeItems,
    ...externalDedupedAgainstMaintenance.items,
  ]);

  const gommeDaEventiTmp = gommeItems.filter(
    (item) => item.sourceOrigin === "evento_autista_tmp",
  ).length;
  const gommeDaEventiUfficiali = gommeItems.filter(
    (item) => item.sourceOrigin === "evento_ufficiale",
  ).length;
  const gommeMatchForti = gommeItems.filter(
    (item) => item.vehicleMatchReliability === "forte",
  ).length;
  const gommeMatchPlausibili = gommeItems.filter(
    (item) => item.vehicleMatchReliability === "plausibile",
  ).length;

  return {
    domainCode: NEXT_MANUTENZIONI_GOMME_DOMAIN.code,
    domainName: NEXT_MANUTENZIONI_GOMME_DOMAIN.name,
    mezzoTarga,
    logicalDatasets: NEXT_MANUTENZIONI_GOMME_DOMAIN.logicalDatasets,
    activeReadOnlyDatasets: NEXT_MANUTENZIONI_GOMME_DOMAIN.activeReadOnlyDatasets,
    normalizationStrategy: NEXT_MANUTENZIONI_GOMME_DOMAIN.normalizationStrategy,
    datasetShapes: {
      gommeTmp: gommeTmpDataset.datasetShape,
      gommeEventi: gommeEventiDataset.datasetShape,
    },
    scheduledMaintenance: maintenanceSnapshot.scheduledMaintenance,
    maintenanceItems,
    gommeItems,
    counts: {
      manutenzioni: maintenanceItems.length,
      manutenzioniConKm: maintenanceItems.filter((item) => item.km !== null).length,
      manutenzioniConOre: maintenanceItems.filter((item) => item.ore !== null).length,
      manutenzioniConMateriali: maintenanceItems.filter((item) => item.materialiCount > 0).length,
      gommeDerivate: maintenanceDerivedGommeItems.length,
      gommeDaEventiTmp,
      gommeDaEventiUfficiali,
      gommeMatchForti,
      gommeMatchPlausibili,
      gommeDeduplicateConManutenzione:
        externalDedupedAgainstMaintenance.deduplicatedCount,
      gommeConPosizione: gommeItems.filter((item) => Boolean(item.posizione)).length,
      gommeConQuantita: gommeItems.filter((item) => item.quantita !== null).length,
      gommeConKm: gommeItems.filter((item) => item.km !== null).length,
      gommeConFornitore: gommeItems.filter((item) => Boolean(item.fornitore)).length,
    },
    limitations: [
      "Il layer legge storico manutenzioni e pianificazione mezzo da `@manutenzioni` e `@mezzi_aziendali`, poi converge in sola lettura anche `@cambi_gomme_autisti_tmp` e `@gomme_eventi`.",
      "Gli eventi gomme extra-manutenzione entrano come match forte solo con `targetTarga` o `targa`; i match solo di contesto (`targaCamion`, `targaRimorchio`, `contesto.*`) restano al massimo plausibili e non vengono promossi a conferma certa.",
      externalDedupedAgainstMaintenance.deduplicatedCount > 0
        ? `${externalDedupedAgainstMaintenance.deduplicatedCount} eventi gomme tmp/ufficiali sono stati deduplicati per evitare doppio conteggio con manutenzioni gia importate nello storico.`
        : null,
      gommeMatchPlausibili > 0
        ? `${gommeMatchPlausibili} eventi gomme sono presenti solo come match plausibile di contesto: il report li mostra ma non li tratta come collegamento forte al mezzo.`
        : null,
      "Costo gomme e dati di posizione/quantita restano valorizzati solo quando i record legacy o i testi manutenzione li espongono davvero; in caso contrario il limite resta nel modello tramite flags.",
    ].filter((entry): entry is string => Boolean(entry)),
  };
}
