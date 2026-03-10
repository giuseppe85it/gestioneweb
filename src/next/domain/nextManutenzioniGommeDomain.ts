import {
  NEXT_MANUTENZIONI_DOMAIN,
  readNextMezzoManutenzioniSnapshot,
  type NextMaintenanceHistoryItem,
  type NextManutenzioneQuality,
  type NextScheduledMaintenance,
} from "./nextManutenzioniDomain";
import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";

export const NEXT_MANUTENZIONI_GOMME_DOMAIN = {
  code: "D02-GOM",
  name: "Manutenzioni e gomme mezzo",
  logicalDatasets: NEXT_MANUTENZIONI_DOMAIN.logicalDatasets,
  activeReadOnlyDatasets: NEXT_MANUTENZIONI_DOMAIN.logicalDatasets,
  normalizationStrategy:
    "STORICO_MANUTENZIONI_DA_LAYER_NEXT + DERIVAZIONE_GOMME_DA_BLOCCHI_CAMBIO_GOMME",
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
  sourceMaintenanceId: string;
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

export type NextMezzoManutenzioniGommeSnapshot = {
  domainCode: typeof NEXT_MANUTENZIONI_GOMME_DOMAIN.code;
  domainName: typeof NEXT_MANUTENZIONI_GOMME_DOMAIN.name;
  mezzoTarga: string;
  logicalDatasets: readonly string[];
  activeReadOnlyDatasets: readonly string[];
  normalizationStrategy: typeof NEXT_MANUTENZIONI_GOMME_DOMAIN.normalizationStrategy;
  scheduledMaintenance: NextScheduledMaintenance;
  maintenanceItems: NextManutenzioneReadOnlyItem[];
  gommeItems: NextGommeReadOnlyItem[];
  counts: {
    manutenzioni: number;
    manutenzioniConKm: number;
    manutenzioniConOre: number;
    manutenzioniConMateriali: number;
    gommeDerivate: number;
    gommeConPosizione: number;
    gommeConQuantita: number;
    gommeConKm: number;
    gommeConFornitore: number;
  };
  limitations: string[];
};

type ParsedCambioGommeBlock = {
  evento: string;
  modalita: string | null;
  asseLabel: string | null;
  posizione: string | null;
  quantita: number | null;
  marca: string | null;
  km: number | null;
  flags: string[];
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
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
  const modalita = normalizeOptionalText(modalitaMatch?.[1]);

  let asseLabel: string | null = null;
  let quantita: number | null = null;
  let marca: string | null = null;
  let km: number | null = null;
  const flags: string[] = [];

  for (const line of lines.slice(1)) {
    if (/^asse\s*:/i.test(line)) {
      asseLabel = normalizeOptionalText(line.replace(/^asse\s*:/i, ""));
      continue;
    }
    if (/^gomme cambiate\s*:/i.test(line)) {
      quantita = normalizeNumber(line.replace(/^gomme cambiate\s*:/i, ""));
      continue;
    }
    if (/^marca\s*:/i.test(line)) {
      marca = normalizeOptionalText(line.replace(/^marca\s*:/i, ""));
      continue;
    }
    if (/^km mezzo\s*:/i.test(line)) {
      km = normalizeNumber(line.replace(/^km mezzo\s*:/i, ""));
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
    flags,
  };
}

function dedupeFlags(flags: string[]): string[] {
  return Array.from(new Set(flags.filter(Boolean)));
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
    isCambioGommeDerived: item.isCambioGommeDerived,
    sourceDataset: item.sourceDataset,
    sourceRecordId: item.id,
    sourceOrigin: item.sourceOrigin,
    quality: item.quality,
    flags: dedupeFlags(flags),
  };
}

function toGommeItems(item: NextManutenzioneReadOnlyItem): NextGommeReadOnlyItem[] {
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
        quality: "derived_acceptable",
        flags: dedupeFlags(flags),
      });
  });

  return items.sort((left, right) => {
    const rightTs = right.timestamp ?? -1;
    const leftTs = left.timestamp ?? -1;
    if (rightTs !== leftTs) return rightTs - leftTs;
    return left.id.localeCompare(right.id);
  });
}

export function mapNextManutenzioniItemsToLegacyView(
  items: NextManutenzioneReadOnlyItem[]
): NextManutenzioneLegacyViewItem[] {
  return items.map((item) => ({
    id: item.id,
    targa: item.mezzoTarga,
    tipo: item.tipo ?? undefined,
    data: item.dataLabel ?? item.data ?? undefined,
    timestamp: item.timestamp,
    km: item.km ?? undefined,
    ore: item.ore ?? undefined,
    descrizione: item.descrizione ?? undefined,
  }));
}

export function mapNextGommeItemsToLegacyView(
  items: NextGommeReadOnlyItem[]
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
  targa: string
): Promise<NextMezzoManutenzioniGommeSnapshot> {
  const mezzoTarga = normalizeNextMezzoTarga(targa);
  const maintenanceSnapshot = await readNextMezzoManutenzioniSnapshot(mezzoTarga);

  const maintenanceItems = maintenanceSnapshot.historyItems.map(toMaintenanceItem);
  const gommeItems = maintenanceItems.flatMap(toGommeItems);

  return {
    domainCode: NEXT_MANUTENZIONI_GOMME_DOMAIN.code,
    domainName: NEXT_MANUTENZIONI_GOMME_DOMAIN.name,
    mezzoTarga,
    logicalDatasets: NEXT_MANUTENZIONI_GOMME_DOMAIN.logicalDatasets,
    activeReadOnlyDatasets: NEXT_MANUTENZIONI_GOMME_DOMAIN.activeReadOnlyDatasets,
    normalizationStrategy: NEXT_MANUTENZIONI_GOMME_DOMAIN.normalizationStrategy,
    scheduledMaintenance: maintenanceSnapshot.scheduledMaintenance,
    maintenanceItems,
    gommeItems,
    counts: {
      manutenzioni: maintenanceItems.length,
      manutenzioniConKm: maintenanceItems.filter((item) => item.km !== null).length,
      manutenzioniConOre: maintenanceItems.filter((item) => item.ore !== null).length,
      manutenzioniConMateriali: maintenanceItems.filter((item) => item.materialiCount > 0).length,
      gommeDerivate: gommeItems.length,
      gommeConPosizione: gommeItems.filter((item) => Boolean(item.posizione)).length,
      gommeConQuantita: gommeItems.filter((item) => item.quantita !== null).length,
      gommeConKm: gommeItems.filter((item) => item.km !== null).length,
      gommeConFornitore: gommeItems.filter((item) => Boolean(item.fornitore)).length,
    },
    limitations: [
      "Il layer legge storico manutenzioni e pianificazione mezzo dagli stessi dataset gia letti dal clone: `@manutenzioni` e `@mezzi_aziendali`.",
      "Le gomme del clone non vengono inventate: sono derivate solo dai blocchi testuali `CAMBIO GOMME` realmente presenti nelle descrizioni manutenzione.",
      "Gli eventi autisti `@cambi_gomme_autisti_tmp` e `@gomme_eventi` restano fuori da questo reader per mantenere la stessa base dati oggi usata dalla madre nel Dossier Gomme.",
      "Costo gomme e dati di posizione/quantita restano valorizzati solo quando il testo legacy li contiene davvero; in caso contrario il limite resta nel modello tramite flags.",
    ],
  };
}
