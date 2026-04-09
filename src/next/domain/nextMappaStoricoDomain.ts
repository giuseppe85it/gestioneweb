import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../../firebase";
import { getItemSync, setItemSync } from "../../utils/storageSync";
import { uploadBytes } from "../../utils/storageWriteOps";
import { readNextMezzoByTarga } from "../nextAnagraficheFlottaDomain";
import { readNextMezzoRifornimentiSnapshot } from "./nextRifornimentiDomain";
import { readNextMezzoManutenzioniGommeSnapshot } from "./nextManutenzioniGommeDomain";
import {
  getNextMezzoHotspotAreaById,
  getNextMezzoHotspotAreas,
  getNextMezzoHotspotAreasByVista,
  type NextMappaStoricoVista,
} from "../mezziHotspotAreas";

const FOTO_VISTE_KEY = "@mezzi_foto_viste";
const HOTSPOT_MAPPING_KEY = "@mezzi_hotspot_mapping";
const TECHNICAL_TARGET_OVERRIDES_KEY = "@mezzi_tecnico_target_overrides";

type RawRecord = Record<string, unknown>;

export type NextMappaStoricoPhotoRecord = {
  id: string;
  targa: string;
  vista: NextMappaStoricoVista;
  storagePath: string;
  downloadUrl: string;
  fileName: string;
  contentType: string | null;
  uploadedAt: number;
};

export type NextMappaStoricoHotspotRecord = {
  id: string;
  targa: string;
  vista: NextMappaStoricoVista;
  areaId: string;
  x: number;
  y: number;
  createdAt: number;
};

export type TechnicalMarkerShape = "pallino" | "cerchio" | "rombo";

export type NextMappaStoricoTechnicalTargetOverrideRecord = {
  id: string;
  categoriaKey: string;
  vista: NextMappaStoricoVista;
  targetId: string;
  markerShape: TechnicalMarkerShape;
  x: number;
  y: number;
  updatedAt: number;
};

export type NextMappaStoricoIntervento = {
  id: string;
  sourceKind: "manutenzione" | "gomme";
  title: string;
  descrizione: string;
  dataLabel: string;
  timestamp: number | null;
  areaIds: string[];
  areaLabels: string[];
  kmLabel: string | null;
  fornitoreLabel: string | null;
  searchText: string;
};

export type NextMappaStoricoZonaSnapshot = {
  areaId: string;
  label: string;
  description: string;
  vista: NextMappaStoricoVista;
  hotspots: NextMappaStoricoHotspotRecord[];
  interventi: NextMappaStoricoIntervento[];
};

export type NextMappaStoricoSnapshot = {
  targa: string;
  mezzoLabel: string;
  categoriaLabel: string;
  tipoMezzoLabel: string;
  showKmUltimoRifornimento: boolean;
  kmUltimoRifornimentoLabel: string | null;
  ultimaManutenzioneLabel: string | null;
  totaleInterventi: number;
  viste: Record<
    NextMappaStoricoVista,
    {
      foto: NextMappaStoricoPhotoRecord | null;
      hotspots: NextMappaStoricoHotspotRecord[];
      hotspotsConStorico: NextMappaStoricoHotspotRecord[];
      aree: NextMappaStoricoZonaSnapshot[];
    }
  >;
  interventi: NextMappaStoricoIntervento[];
  limitations: string[];
};

type NextMappaStoricoPhotoUploadInput = {
  targa: string;
  vista: NextMappaStoricoVista;
  file: File;
};

type NextMappaStoricoHotspotSaveInput = {
  targa: string;
  vista: NextMappaStoricoVista;
  areaId: string;
  x: number;
  y: number;
};

type NextMappaStoricoTechnicalTargetOverrideSaveInput = {
  categoriaKey: string;
  vista: NextMappaStoricoVista;
  targetId: string;
  markerShape: TechnicalMarkerShape;
  x: number;
  y: number;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeUpper(value: unknown): string {
  return normalizeText(value).toUpperCase().replace(/\s+/g, "");
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", ".").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function unwrapArray(rawValue: unknown): unknown[] {
  if (Array.isArray(rawValue)) return rawValue;
  if (rawValue && typeof rawValue === "object") {
    const raw = rawValue as RawRecord;
    if (Array.isArray(raw.items)) return raw.items;
    if (Array.isArray(raw.value)) return raw.value;
    if (raw.value && typeof raw.value === "object" && Array.isArray((raw.value as RawRecord).items)) {
      return (raw.value as RawRecord).items as unknown[];
    }
  }
  return [];
}

async function readVisualRecords<T extends Record<string, unknown>>(key: string): Promise<T[]> {
  const raw = await getItemSync(key);
  return unwrapArray(raw).filter((item): item is T => Boolean(item) && typeof item === "object");
}

function buildPhotoId(targa: string, vista: NextMappaStoricoVista, uploadedAt: number): string {
  return `foto:${targa}:${vista}:${uploadedAt}`;
}

function buildHotspotId(targa: string, vista: NextMappaStoricoVista, areaId: string): string {
  return `hotspot:${targa}:${vista}:${areaId}`;
}

function sanitizePhotoRecord(raw: RawRecord): NextMappaStoricoPhotoRecord | null {
  const targa = normalizeUpper(raw.targa);
  const vista = normalizeOptionalText(raw.vista) as NextMappaStoricoVista | null;
  const storagePath = normalizeOptionalText(raw.storagePath);
  const downloadUrl = normalizeOptionalText(raw.downloadUrl);
  if (!targa || !vista || !storagePath || !downloadUrl) return null;

  const uploadedAt = normalizeNumber(raw.uploadedAt) ?? Date.now();
  return {
    id: normalizeOptionalText(raw.id) ?? buildPhotoId(targa, vista, uploadedAt),
    targa,
    vista,
    storagePath,
    downloadUrl,
    fileName: normalizeOptionalText(raw.fileName) ?? `${vista}.jpg`,
    contentType: normalizeOptionalText(raw.contentType),
    uploadedAt,
  };
}

function sanitizeHotspotRecord(raw: RawRecord): NextMappaStoricoHotspotRecord | null {
  const targa = normalizeUpper(raw.targa);
  const vista = normalizeOptionalText(raw.vista) as NextMappaStoricoVista | null;
  const areaId = normalizeOptionalText(raw.areaId);
  const x = normalizeNumber(raw.x);
  const y = normalizeNumber(raw.y);
  if (!targa || !vista || !areaId || x === null || y === null) return null;

  return {
    id: normalizeOptionalText(raw.id) ?? buildHotspotId(targa, vista, areaId),
    targa,
    vista,
    areaId,
    x,
    y,
    createdAt: normalizeNumber(raw.createdAt) ?? Date.now(),
  };
}

function buildTechnicalTargetOverrideId(
  categoriaKey: string,
  vista: NextMappaStoricoVista,
  targetId: string,
): string {
  return `technical-target:${categoriaKey}:${vista}:${targetId}`;
}

const VALID_MARKER_SHAPES = new Set<TechnicalMarkerShape>(["pallino", "cerchio", "rombo"]);

function sanitizeMarkerShape(value: unknown): TechnicalMarkerShape {
  return typeof value === "string" && VALID_MARKER_SHAPES.has(value as TechnicalMarkerShape)
    ? (value as TechnicalMarkerShape)
    : "pallino";
}

function sanitizeTechnicalTargetOverrideRecord(
  raw: RawRecord,
): NextMappaStoricoTechnicalTargetOverrideRecord | null {
  const categoriaKey = normalizeOptionalText(raw.categoriaKey)?.toLowerCase() ?? null;
  const vista = normalizeOptionalText(raw.vista) as NextMappaStoricoVista | null;
  const targetId = normalizeOptionalText(raw.targetId);
  const x = normalizeNumber(raw.x);
  const y = normalizeNumber(raw.y);
  if (!categoriaKey || !vista || !targetId || x === null || y === null) return null;

  return {
    id: normalizeOptionalText(raw.id) ?? buildTechnicalTargetOverrideId(categoriaKey, vista, targetId),
    categoriaKey,
    vista,
    targetId,
    markerShape: sanitizeMarkerShape(raw.markerShape),
    x,
    y,
    updatedAt: normalizeNumber(raw.updatedAt) ?? Date.now(),
  };
}

function formatNumberLabel(value: number | null): string | null {
  if (value === null) return null;
  return value.toLocaleString("it-IT", { maximumFractionDigits: 0 });
}

function deriveVehicleTypeLabel(categoria: string | null, tipo: string | null): {
  label: string;
  showKm: boolean;
} {
  const source = `${categoria ?? ""} ${tipo ?? ""}`.toLowerCase();
  if (source.includes("trattore")) {
    return { label: "Trattore", showKm: true };
  }
  if (source.includes("motrice")) {
    return { label: "Motrice", showKm: true };
  }
  if (
    source.includes("rimorchio") ||
    source.includes("semi") ||
    source.includes("vasca") ||
    source.includes("pianale") ||
    source.includes("centina") ||
    source.includes("biga") ||
    source.includes("porta silo") ||
    source.includes("cisterna")
  ) {
    return { label: "Rimorchio / semirimorchio", showKm: false };
  }
  return { label: "DA VERIFICARE", showKm: false };
}

function buildInterventoSearchText(args: {
  title: string;
  descrizione: string;
  kmLabel: string | null;
  fornitoreLabel: string | null;
  areaLabels: string[];
}): string {
  return [
    args.title,
    args.descrizione,
    args.kmLabel,
    args.fornitoreLabel,
    ...args.areaLabels,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const COMPONENTE_PNEUMATICI_TERMS = [
  "gomma",
  "gomme",
  "pneumatico",
  "pneumatici",
  "ruota",
  "ruote",
];

const COMPONENTE_ASSALE_TERMS = [
  "asse",
  "assi",
  "assale",
  "assali",
];

const DIREZIONE_FRONTE_TERMS = [
  "anteriore",
  "anteriori",
  "frontale",
  "frontali",
  "avantreno",
  "davanti",
];

const DIREZIONE_SINISTRA_TERMS = [
  "sinistra",
  "sinistro",
  "sinistre",
  "sinistri",
  "sx",
  "lato sinistro",
];

const DIREZIONE_DESTRA_TERMS = [
  "destra",
  "destro",
  "destre",
  "destri",
  "dx",
  "lato destro",
];

const DIREZIONE_RETRO_TERMS = [
  "posteriore",
  "posteriori",
  "retro",
  "dietro",
  "retrotreno",
  "rimorchio",
];

function normalizeMatchText(value: string): string {
  return ` ${value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
}

function hasMatchTerm(normalizedText: string, term: string): boolean {
  const normalizedTerm = normalizeMatchText(term).trim();
  if (!normalizedTerm) return false;
  return normalizedText.includes(` ${normalizedTerm} `);
}

function hasAnyMatchTerm(normalizedText: string, terms: string[]): boolean {
  return terms.some((term) => hasMatchTerm(normalizedText, term));
}

function inferPriorityAreaIds(normalizedText: string): string[] | null {
  const hasPneumatici = hasAnyMatchTerm(normalizedText, COMPONENTE_PNEUMATICI_TERMS);
  const hasAssale = hasAnyMatchTerm(normalizedText, COMPONENTE_ASSALE_TERMS);

  if (!hasPneumatici && !hasAssale) {
    return null;
  }

  const priorityAreaIds: string[] = [];

  if (hasAnyMatchTerm(normalizedText, DIREZIONE_FRONTE_TERMS)) {
    priorityAreaIds.push("fronte-assale");
  }
  if (hasAnyMatchTerm(normalizedText, DIREZIONE_SINISTRA_TERMS)) {
    priorityAreaIds.push("sinistra-assi");
  }
  if (hasAnyMatchTerm(normalizedText, DIREZIONE_DESTRA_TERMS)) {
    priorityAreaIds.push("destra-assi");
  }
  if (hasAnyMatchTerm(normalizedText, DIREZIONE_RETRO_TERMS)) {
    priorityAreaIds.push("retro-assi");
  }

  return priorityAreaIds.length > 0 ? priorityAreaIds : [];
}

function resolveAreaIdsFromText(text: string): string[] {
  const normalized = normalizeMatchText(text);
  if (!normalized.trim()) return [];

  const priorityAreaIds = inferPriorityAreaIds(normalized);
  if (priorityAreaIds) {
    return priorityAreaIds;
  }

  const scoredAreas = getNextMezzoHotspotAreas()
    .map((area) => {
      const matchedKeywords = area.keywords.filter((keyword) => hasMatchTerm(normalized, keyword));
      const score = matchedKeywords.reduce((sum, keyword) => {
        const normalizedKeyword = normalizeMatchText(keyword).trim();
        const keywordWeight = normalizedKeyword.includes(" ") ? 100 : 10;
        return sum + keywordWeight + normalizedKeyword.length;
      }, 0);

      return {
        areaId: area.id,
        score,
      };
    })
    .filter((item) => item.score > 0);

  if (scoredAreas.length === 0) {
    return [];
  }

  const maxScore = Math.max(...scoredAreas.map((item) => item.score));
  return scoredAreas
    .filter((item) => item.score === maxScore)
    .map((item) => item.areaId);
}

function buildIntervento(
  raw: {
    id: string;
    title: string | null;
    descrizione: string | null;
    dataLabel: string | null;
    timestamp: number | null;
    km: number | null;
    fornitore: string | null;
  },
  sourceKind: "manutenzione" | "gomme",
): NextMappaStoricoIntervento | null {
  const title = normalizeOptionalText(raw.title) ?? normalizeOptionalText(raw.descrizione) ?? "Intervento";
  const descrizione = normalizeOptionalText(raw.descrizione) ?? title;
  const areaIds = resolveAreaIdsFromText(`${title} ${descrizione}`);
  const areaLabels = areaIds
    .map((areaId) => getNextMezzoHotspotAreaById(areaId)?.label ?? null)
    .filter((label): label is string => Boolean(label));
  const kmLabel = formatNumberLabel(raw.km);
  return {
    id: raw.id,
    sourceKind,
    title,
    descrizione,
    dataLabel: normalizeOptionalText(raw.dataLabel) ?? "Data non disponibile",
    timestamp: raw.timestamp,
    areaIds,
    areaLabels,
    kmLabel,
    fornitoreLabel: normalizeOptionalText(raw.fornitore),
    searchText: buildInterventoSearchText({
      title,
      descrizione,
      kmLabel,
      fornitoreLabel: normalizeOptionalText(raw.fornitore),
      areaLabels,
    }),
  };
}

function sortInterventi(items: NextMappaStoricoIntervento[]): NextMappaStoricoIntervento[] {
  return [...items].sort((left, right) => {
    const rightTs = right.timestamp ?? -1;
    const leftTs = left.timestamp ?? -1;
    if (rightTs !== leftTs) return rightTs - leftTs;
    return left.id.localeCompare(right.id, "it", { sensitivity: "base" });
  });
}

function buildAreaSnapshot(args: {
  vista: NextMappaStoricoVista;
  hotspots: NextMappaStoricoHotspotRecord[];
  interventi: NextMappaStoricoIntervento[];
}): NextMappaStoricoZonaSnapshot[] {
  return getNextMezzoHotspotAreasByVista(args.vista).map((area) => {
    const interventi = args.interventi.filter((item) => item.areaIds.includes(area.id));
    const hotspots = args.hotspots.filter((item) => item.areaId === area.id);
    return {
      areaId: area.id,
      label: area.label,
      description: area.description,
      vista: area.vista,
      hotspots,
      interventi,
    };
  });
}

function buildStorageExtension(file: File): string {
  const fileExt = file.name.split(".").pop()?.trim().toLowerCase();
  if (fileExt) return fileExt;
  const contentTypeExt = file.type.split("/").pop()?.trim().toLowerCase();
  return contentTypeExt || "jpg";
}

export async function uploadNextMappaStoricoPhoto(
  input: NextMappaStoricoPhotoUploadInput,
): Promise<NextMappaStoricoPhotoRecord> {
  const targa = normalizeUpper(input.targa);
  const uploadedAt = Date.now();
  const ext = buildStorageExtension(input.file);
  const storagePath = `mezzi_foto/${targa}/${input.vista}_${uploadedAt}.${ext}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, input.file, {
    contentType: input.file.type || undefined,
  });
  const downloadUrl = await getDownloadURL(storageRef);

  const current = (await readVisualRecords<RawRecord>(FOTO_VISTE_KEY))
    .map(sanitizePhotoRecord)
    .filter((item): item is NextMappaStoricoPhotoRecord => Boolean(item))
    .filter((item) => !(item.targa === targa && item.vista === input.vista));

  const nextRecord: NextMappaStoricoPhotoRecord = {
    id: buildPhotoId(targa, input.vista, uploadedAt),
    targa,
    vista: input.vista,
    storagePath,
    downloadUrl,
    fileName: input.file.name,
    contentType: input.file.type || null,
    uploadedAt,
  };

  await setItemSync(FOTO_VISTE_KEY, [nextRecord, ...current]);
  return nextRecord;
}

export async function saveNextMappaStoricoHotspot(
  input: NextMappaStoricoHotspotSaveInput,
): Promise<NextMappaStoricoHotspotRecord> {
  const targa = normalizeUpper(input.targa);
  const area = getNextMezzoHotspotAreaById(input.areaId);
  if (!area || area.vista !== input.vista) {
    throw new Error("Zona hotspot non valida per la vista selezionata.");
  }

  const current = (await readVisualRecords<RawRecord>(HOTSPOT_MAPPING_KEY))
    .map(sanitizeHotspotRecord)
    .filter((item): item is NextMappaStoricoHotspotRecord => Boolean(item))
    .filter((item) => !(item.targa === targa && item.vista === input.vista && item.areaId === input.areaId));

  const nextRecord: NextMappaStoricoHotspotRecord = {
    id: buildHotspotId(targa, input.vista, input.areaId),
    targa,
    vista: input.vista,
    areaId: input.areaId,
    x: Math.max(0, Math.min(100, input.x)),
    y: Math.max(0, Math.min(100, input.y)),
    createdAt: Date.now(),
  };

  await setItemSync(HOTSPOT_MAPPING_KEY, [nextRecord, ...current]);
  return nextRecord;
}

export async function deleteNextMappaStoricoHotspot(hotspotId: string): Promise<void> {
  const normalizedId = normalizeOptionalText(hotspotId);
  if (!normalizedId) return;

  const nextRecords = (await readVisualRecords<RawRecord>(HOTSPOT_MAPPING_KEY))
    .map(sanitizeHotspotRecord)
    .filter((item): item is NextMappaStoricoHotspotRecord => Boolean(item))
    .filter((item) => item.id !== normalizedId);

  await setItemSync(HOTSPOT_MAPPING_KEY, nextRecords);
}

export async function readNextMappaStoricoTechnicalTargetOverrides(
  categoriaKey: string,
  vista: NextMappaStoricoVista,
): Promise<NextMappaStoricoTechnicalTargetOverrideRecord[]> {
  const normalizedCategoryKey = normalizeOptionalText(categoriaKey)?.toLowerCase();
  if (!normalizedCategoryKey) return [];

  return (await readVisualRecords<RawRecord>(TECHNICAL_TARGET_OVERRIDES_KEY))
    .map(sanitizeTechnicalTargetOverrideRecord)
    .filter((item): item is NextMappaStoricoTechnicalTargetOverrideRecord => Boolean(item))
    .filter((item) => item.categoriaKey === normalizedCategoryKey && item.vista === vista)
    .sort((left, right) => right.updatedAt - left.updatedAt);
}

export async function saveNextMappaStoricoTechnicalTargetOverride(
  input: NextMappaStoricoTechnicalTargetOverrideSaveInput,
): Promise<NextMappaStoricoTechnicalTargetOverrideRecord> {
  const categoriaKey = normalizeOptionalText(input.categoriaKey)?.toLowerCase();
  const targetId = normalizeOptionalText(input.targetId);
  if (!categoriaKey || !targetId) {
    throw new Error("Override tecnico non valido.");
  }

  const current = (await readVisualRecords<RawRecord>(TECHNICAL_TARGET_OVERRIDES_KEY))
    .map(sanitizeTechnicalTargetOverrideRecord)
    .filter((item): item is NextMappaStoricoTechnicalTargetOverrideRecord => Boolean(item))
    .filter(
      (item) =>
        !(
          item.categoriaKey === categoriaKey &&
          item.vista === input.vista &&
          item.targetId === targetId
        ),
    );

  const nextRecord: NextMappaStoricoTechnicalTargetOverrideRecord = {
    id: buildTechnicalTargetOverrideId(categoriaKey, input.vista, targetId),
    categoriaKey,
    vista: input.vista,
    targetId,
    markerShape: input.markerShape,
    x: Math.max(0, Math.min(100, input.x)),
    y: Math.max(0, Math.min(100, input.y)),
    updatedAt: Date.now(),
  };

  await setItemSync(TECHNICAL_TARGET_OVERRIDES_KEY, [nextRecord, ...current]);
  return nextRecord;
}

export async function readNextMappaStoricoSnapshot(
  targa: string,
): Promise<NextMappaStoricoSnapshot> {
  const normalizedTarga = normalizeUpper(targa);
  const [mezzo, manutenzioniGomme, rifornimenti, photoRaw, hotspotRaw] = await Promise.all([
    readNextMezzoByTarga(normalizedTarga),
    readNextMezzoManutenzioniGommeSnapshot(normalizedTarga),
    readNextMezzoRifornimentiSnapshot(normalizedTarga),
    readVisualRecords<RawRecord>(FOTO_VISTE_KEY),
    readVisualRecords<RawRecord>(HOTSPOT_MAPPING_KEY),
  ]);

  const { label: tipoMezzoLabel, showKm } = deriveVehicleTypeLabel(mezzo?.categoria ?? null, mezzo?.tipo ?? null);
  const kmUltimoRifornimento = rifornimenti.items.find((item) => item.km !== null)?.km ?? null;

  const manutenzioni = manutenzioniGomme.maintenanceItems
    .map((item) =>
      buildIntervento(
        {
          id: item.id,
          title: item.tipo,
          descrizione: item.descrizione,
          dataLabel: item.dataLabel,
          timestamp: item.timestamp,
          km: item.km,
          fornitore: item.fornitore,
        },
        "manutenzione",
      ),
    )
    .filter((item): item is NextMappaStoricoIntervento => Boolean(item));

  const eventiGommeEsterni = manutenzioniGomme.gommeItems
    .filter((item) => item.sourceOrigin !== "manutenzione_derivata")
    .map((item) =>
      buildIntervento(
        {
          id: item.id,
          title: item.evento,
          descrizione: item.descrizione,
          dataLabel: item.dataLabel,
          timestamp: item.timestamp,
          km: item.km,
          fornitore: item.fornitore,
        },
        "gomme",
      ),
    )
    .filter((item): item is NextMappaStoricoIntervento => Boolean(item));

  const interventi = sortInterventi([...manutenzioni, ...eventiGommeEsterni]);
  const foto = photoRaw
    .map(sanitizePhotoRecord)
    .filter((item): item is NextMappaStoricoPhotoRecord => item !== null)
    .filter((item) => item.targa === normalizedTarga);
  const hotspots = hotspotRaw
    .map(sanitizeHotspotRecord)
    .filter((item): item is NextMappaStoricoHotspotRecord => item !== null)
    .filter((item) => item.targa === normalizedTarga);

  const viste: Record<
    NextMappaStoricoVista,
    {
      foto: NextMappaStoricoPhotoRecord | null;
      hotspots: NextMappaStoricoHotspotRecord[];
      hotspotsConStorico: NextMappaStoricoHotspotRecord[];
      aree: NextMappaStoricoZonaSnapshot[];
    }
  > = {
    fronte: { foto: null, hotspots: [], hotspotsConStorico: [], aree: [] },
    sinistra: { foto: null, hotspots: [], hotspotsConStorico: [], aree: [] },
    destra: { foto: null, hotspots: [], hotspotsConStorico: [], aree: [] },
    retro: { foto: null, hotspots: [], hotspotsConStorico: [], aree: [] },
  };

  (["fronte", "sinistra", "destra", "retro"] as NextMappaStoricoVista[]).forEach((vista) => {
    const vistaHotspots = hotspots.filter((item) => item.vista === vista);
    const aree = buildAreaSnapshot({
      vista,
      hotspots: vistaHotspots,
      interventi,
    });

    viste[vista] = {
      foto: foto
        .filter((item) => item.vista === vista)
        .sort((left, right) => right.uploadedAt - left.uploadedAt)[0] ?? null,
      hotspots: vistaHotspots,
      hotspotsConStorico: vistaHotspots.filter((item) =>
        interventi.some((intervento) => intervento.areaIds.includes(item.areaId)),
      ),
      aree,
    };
  });

  return {
    targa: normalizedTarga,
    mezzoLabel: mezzo?.marcaModello
      ? `${normalizedTarga} - ${mezzo.marcaModello}`
      : normalizedTarga,
    categoriaLabel: mezzo?.categoria || "Categoria non disponibile",
    tipoMezzoLabel,
    showKmUltimoRifornimento: showKm,
    kmUltimoRifornimentoLabel: showKm ? formatNumberLabel(kmUltimoRifornimento) : null,
    ultimaManutenzioneLabel: interventi[0]?.dataLabel ?? null,
    totaleInterventi: interventi.length,
    viste,
    interventi,
    limitations: [
      "La mappa storico legge i dati business reali dalle manutenzioni, dalla convergenza gomme e dal domain rifornimenti gia verificato.",
      "Le foto per vista e gli hotspot sono metadati visuali separati: non alterano `@manutenzioni`, `@inventario` o `@materialiconsegnati`.",
      showKm
        ? "Il blocco `Km ultimo rifornimento` usa solo il domain rifornimenti NEXT e non ordina raw `@rifornimenti`."
        : "Per questa tipologia mezzo il blocco `Km ultimo rifornimento` resta nascosto in modo prudente.",
      hotspots.length === 0
        ? "Nessun hotspot manuale ancora configurato per il mezzo selezionato."
        : null,
      foto.length === 0
        ? "Nessuna foto vista caricata: la mappa resta utilizzabile anche con placeholder."
        : null,
    ].filter((item): item is string => Boolean(item)),
  };
}
