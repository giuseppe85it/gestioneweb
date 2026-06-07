import { getItemSync } from "../../../../utils/storageSync";
import { getNextMezzoHotspotAreaById } from "../../../mezziHotspotAreas";
import { formatItalianDate } from "../chatIaToolDates";

type AnyRecord = Record<string, unknown>;

export type VehiclePhotoToolItem = {
  _id: string;
  id: string;
  targa: string;
  vista: string;
  url: string | null;
  downloadUrl: string | null;
  storagePath: string | null;
  fileName: string | null;
  contentType: string | null;
  descrizione: string | null;
  uploadedAt: unknown;
  uploadedAt_italiana: string;
};

export type VehicleHotspotToolItem = {
  _id: string;
  id: string;
  targa: string;
  vista: string;
  areaId: string;
  areaLabel: string | null;
  descrizione: string | null;
  coordinate: {
    x: number | null;
    y: number | null;
  };
  x: number | null;
  y: number | null;
  createdAt: unknown;
  createdAt_italiana: string;
};

export type VehicleAppointmentFields = {
  presente: boolean;
  data: string;
  dataRaw: unknown;
  ora?: string;
  luogo?: string;
  note?: string;
  completata?: boolean | null;
  completataIl?: string;
  completataIlRaw?: unknown;
  esito?: string;
  noteEsito?: string;
  officina?: string;
  lavoriPrevisti?: string;
};

export type VehicleEnrichmentFields = {
  prenotazioneCollaudo: VehicleAppointmentFields;
  preCollaudo: VehicleAppointmentFields;
  prossimiAppuntamenti: {
    prenotazioneCollaudo: VehicleAppointmentFields;
    preCollaudo: VehicleAppointmentFields;
  };
  fotoUrl: string | null;
  fotoPath: string | null;
  librettoUrl: string | null;
  librettoStoragePath: string | null;
  libretto_raw: AnyRecord | null;
  media: {
    foto_viste: VehiclePhotoToolItem[];
    hotspots: VehicleHotspotToolItem[];
  };
  fotoViste: VehiclePhotoToolItem[];
  hotspots: VehicleHotspotToolItem[];
};

export type VehicleEnrichmentIndex = {
  rawByTarga: Map<string, AnyRecord>;
  fotoByTarga: Map<string, VehiclePhotoToolItem[]>;
  hotspotByTarga: Map<string, VehicleHotspotToolItem[]>;
};

const EMPTY_VALUE = "-";
const MEZZI_KEY = "@mezzi_aziendali";
const FOTO_VISTE_KEY = "@mezzi_foto_viste";
const HOTSPOT_MAPPING_KEY = "@mezzi_hotspot_mapping";

const RAW_LIBRETTO_FIELD_ALIASES: Record<string, string[]> = {
  numeroAvs: ["numeroAvs", "nAvs", "detentoreAfsAvs"],
  statoOrigine: ["statoOrigine", "detentoreStatoOrigine"],
  indirizzo: ["indirizzo", "detentoreIndirizzo"],
  localita: ["localita", "detentoreLocalita"],
  genereVeicolo: ["genereVeicolo", "tipoVeicolo"],
  carrozzeria: ["carrozzeria"],
  numeroMatricola: ["numeroMatricola", "matricola"],
  approvazioneTipo: ["approvazioneTipo"],
  pesoVuoto: ["pesoVuoto"],
  caricoUtileSella: ["caricoUtileSella"],
  pesoTotale: ["pesoTotale"],
  pesoTotaleRimorchio: ["pesoTotaleRimorchio", "pesoConvoglio"],
  caricoSulLetto: ["caricoSulLetto"],
  pesoRimorchiabile: ["pesoRimorchiabile"],
  luogoDataRilascio: ["luogoDataRilascio", "luogoRilascio", "luogoImmatricolazione"],
  annotazioni: ["annotazioni"],
  annotazioniCantonali: ["annotazioniCantonali"],
  decisioniAutorita: ["decisioniAutorita"],
};

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTarga(value: unknown): string {
  return normalizeText(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function textOrNull(value: unknown): string | null {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized || null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function textOrDash(value: unknown): string {
  return textOrNull(value) ?? EMPTY_VALUE;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", ".").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function booleanOrNull(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "si", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return null;
}

function firstDefined(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== null);
}

function firstText(record: AnyRecord, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = textOrNull(record[key]);
    if (value) return value;
  }
  return null;
}

function unwrapArray(value: unknown): AnyRecord[] {
  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }

  if (!isRecord(value)) {
    return [];
  }

  const valueRecord = isRecord(value.value) ? value.value : null;
  const candidates = [
    value.items,
    valueRecord?.items,
    value.value,
    value.records,
    value.list,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isRecord);
    }
  }

  const objectValues = Object.values(value).filter(isRecord);
  return objectValues.length > 0 ? objectValues : [];
}

async function readStorageRecords(key: string): Promise<AnyRecord[]> {
  const raw = await getItemSync(key);
  return unwrapArray(raw);
}

function groupByTarga<T extends { targa: string }>(items: T[]): Map<string, T[]> {
  const output = new Map<string, T[]>();
  for (const item of items) {
    const targa = normalizeTarga(item.targa);
    if (!targa) continue;
    const current = output.get(targa) ?? [];
    current.push(item);
    output.set(targa, current);
  }
  return output;
}

function readLibrettoRaw(baseRecord: AnyRecord, rawRecord: AnyRecord): AnyRecord | null {
  const direct = firstDefined(baseRecord.libretto_raw, rawRecord.libretto_raw);
  if (isRecord(direct)) {
    return direct;
  }

  const extracted: AnyRecord = {};
  for (const [field, aliases] of Object.entries(RAW_LIBRETTO_FIELD_ALIASES)) {
    const value = firstText(rawRecord, aliases) ?? firstText(baseRecord, aliases);
    if (value) {
      extracted[field] = value;
    }
  }

  return Object.keys(extracted).length > 0 ? extracted : null;
}

function appointmentDate(value: unknown): string {
  return value === undefined || value === null || value === "" ? EMPTY_VALUE : formatItalianDate(value);
}

function normalizePrenotazioneCollaudo(value: unknown): VehicleAppointmentFields {
  const item = isRecord(value) ? value : {};
  const completata = booleanOrNull(item.completata);
  const dataRaw = firstDefined(item.data);
  const completataIlRaw = firstDefined(item.completataIl);
  const presente = Object.keys(item).length > 0;

  return {
    presente,
    data: appointmentDate(dataRaw),
    dataRaw: dataRaw ?? null,
    ora: textOrDash(item.ora),
    luogo: textOrDash(item.luogo),
    note: textOrDash(item.note),
    completata,
    completataIl: appointmentDate(completataIlRaw),
    completataIlRaw: completataIlRaw ?? null,
    esito: textOrDash(item.esito),
    noteEsito: textOrDash(item.noteEsito),
  };
}

function normalizePreCollaudo(value: unknown): VehicleAppointmentFields {
  const item = isRecord(value) ? value : {};
  const dataRaw = firstDefined(item.data);
  const presente = Object.keys(item).length > 0;

  return {
    presente,
    data: appointmentDate(dataRaw),
    dataRaw: dataRaw ?? null,
    officina: textOrDash(item.officina),
    lavoriPrevisti: textOrDash(item.lavoriPrevisti),
  };
}

function sanitizePhoto(raw: AnyRecord): VehiclePhotoToolItem | null {
  const targa = normalizeTarga(raw.targa);
  const vista = textOrNull(raw.vista) ?? EMPTY_VALUE;
  const downloadUrl = textOrNull(firstDefined(raw.downloadUrl, raw.url, raw.fotoUrl));
  const storagePath = textOrNull(firstDefined(raw.storagePath, raw.fotoStoragePath, raw.path));
  const uploadedAt = firstDefined(raw.uploadedAt, raw.createdAt, raw.updatedAt);
  if (!targa || (!downloadUrl && !storagePath)) return null;

  const id =
    textOrNull(raw.id) ??
    (storagePath ? `foto:${targa}:${vista}:${storagePath}` : `foto:${targa}:${vista}:${textOrDash(uploadedAt)}`);

  return {
    _id: id,
    id,
    targa,
    vista,
    url: downloadUrl,
    downloadUrl,
    storagePath,
    fileName: textOrNull(raw.fileName),
    contentType: textOrNull(raw.contentType),
    descrizione: textOrNull(firstDefined(raw.descrizione, raw.caption, raw.note, raw.vista)),
    uploadedAt: uploadedAt ?? null,
    uploadedAt_italiana: appointmentDate(uploadedAt),
  };
}

function sanitizeHotspot(raw: AnyRecord): VehicleHotspotToolItem | null {
  const targa = normalizeTarga(raw.targa);
  const vista = textOrNull(raw.vista) ?? EMPTY_VALUE;
  const areaId = textOrNull(raw.areaId);
  const x = numberOrNull(raw.x);
  const y = numberOrNull(raw.y);
  if (!targa || !areaId) return null;

  const area = getNextMezzoHotspotAreaById(areaId);
  const createdAt = firstDefined(raw.createdAt, raw.updatedAt);
  const id = textOrNull(raw.id) ?? `hotspot:${targa}:${vista}:${areaId}`;

  return {
    _id: id,
    id,
    targa,
    vista,
    areaId,
    areaLabel: area?.label ?? null,
    descrizione: textOrNull(firstDefined(raw.descrizione, raw.caption, raw.note, area?.description, areaId)),
    coordinate: { x, y },
    x,
    y,
    createdAt: createdAt ?? null,
    createdAt_italiana: appointmentDate(createdAt),
  };
}

export async function readVehicleEnrichmentIndex(): Promise<VehicleEnrichmentIndex> {
  const [rawVehicles, rawPhotos, rawHotspots] = await Promise.all([
    readStorageRecords(MEZZI_KEY),
    readStorageRecords(FOTO_VISTE_KEY),
    readStorageRecords(HOTSPOT_MAPPING_KEY),
  ]);

  const rawByTarga = new Map<string, AnyRecord>();
  for (const item of rawVehicles) {
    const targa = normalizeTarga(item.targa);
    if (targa) {
      rawByTarga.set(targa, item);
    }
  }

  return {
    rawByTarga,
    fotoByTarga: groupByTarga(rawPhotos.map(sanitizePhoto).filter((item): item is VehiclePhotoToolItem => Boolean(item))),
    hotspotByTarga: groupByTarga(rawHotspots.map(sanitizeHotspot).filter((item): item is VehicleHotspotToolItem => Boolean(item))),
  };
}

export function buildVehicleEnrichmentFields(
  vehicle: unknown,
  index: VehicleEnrichmentIndex,
): VehicleEnrichmentFields {
  const baseRecord = isRecord(vehicle) ? vehicle : {};
  const targa = normalizeTarga(baseRecord.targa);
  const rawRecord = targa ? index.rawByTarga.get(targa) ?? {} : {};
  const mergedRecord = { ...rawRecord, ...baseRecord };
  const fotoViste = targa ? index.fotoByTarga.get(targa) ?? [] : [];
  const hotspots = targa ? index.hotspotByTarga.get(targa) ?? [] : [];
  const prenotazioneCollaudo = normalizePrenotazioneCollaudo(
    firstDefined(rawRecord.prenotazioneCollaudo, baseRecord.prenotazioneCollaudo),
  );
  const preCollaudo = normalizePreCollaudo(firstDefined(rawRecord.preCollaudo, baseRecord.preCollaudo));

  return {
    prenotazioneCollaudo,
    preCollaudo,
    prossimiAppuntamenti: {
      prenotazioneCollaudo,
      preCollaudo,
    },
    fotoUrl: textOrNull(firstDefined(mergedRecord.fotoUrl, mergedRecord.downloadUrl)),
    fotoPath: textOrNull(firstDefined(mergedRecord.fotoPath, mergedRecord.fotoStoragePath)),
    librettoUrl: textOrNull(mergedRecord.librettoUrl),
    librettoStoragePath: textOrNull(mergedRecord.librettoStoragePath),
    libretto_raw: readLibrettoRaw(baseRecord, rawRecord),
    media: {
      foto_viste: fotoViste,
      hotspots,
    },
    fotoViste,
    hotspots,
  };
}

export async function readVehicleEnrichmentFields(vehicle: unknown): Promise<VehicleEnrichmentFields> {
  const index = await readVehicleEnrichmentIndex();
  return buildVehicleEnrichmentFields(vehicle, index);
}
