import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { readNextFlottaClonePatches } from "./nextFlottaCloneState";

const STORAGE_COLLECTION = "storage";
const MEZZI_DATASET_KEY = "@mezzi_aziendali";
const COLLEGHI_DATASET_KEY = "@colleghi";

const NEXT_FLOTTA_CANONICAL_CATEGORIES = [
  "motrice 2 assi",
  "motrice 3 assi",
  "motrice 4 assi",
  "trattore stradale",
  "semirimorchio asse fisso",
  "semirimorchio asse sterzante",
  "porta silo container",
  "pianale",
  "biga",
  "centina",
  "vasca",
  "Senza categoria",
] as const;

const NEXT_FLOTTA_CANONICAL_CATEGORY_MAP = NEXT_FLOTTA_CANONICAL_CATEGORIES.reduce(
  (acc, category) => {
    acc[category.trim().replace(/\s+/g, " ").toLowerCase()] = category;
    return acc;
  },
  {} as Record<string, (typeof NEXT_FLOTTA_CANONICAL_CATEGORIES)[number]>
);

type NextAnagraficheFlottaRaw = Record<string, unknown>;

type NextLegacyDatasetShape =
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "missing"
  | "unsupported";

type NextMezzoQuality = "certo" | "parziale" | "da_verificare";

type NextCollegaQuality = "certo" | "parziale" | "da_verificare";

export const NEXT_ANAGRAFICHE_FLOTTA_DOMAIN = {
  code: "D01",
  name: "Anagrafiche flotta e persone",
  logicalDatasets: [MEZZI_DATASET_KEY, COLLEGHI_DATASET_KEY] as const,
  activeReadOnlyDataset: MEZZI_DATASET_KEY,
  nextListFields: [
    "id",
    "targa",
    "categoria",
    "marca",
    "modello",
    "autistaNome",
  ] as const,
} as const;

export type NextMezzoListField =
  (typeof NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.nextListFields)[number];

export type NextAnagraficheFlottaCollegaItem = {
  id: string;
  nome: string;
  cognome: string;
  nomeCompleto: string;
  badge: string;
  codice: string;
  descrizione: string;
  datasetShape: NextLegacyDatasetShape;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof COLLEGHI_DATASET_KEY;
  quality: NextCollegaQuality;
  flags: string[];
};

export type NextAnagraficheFlottaMezzoItem = {
  id: string;
  targa: string;
  anno: string;
  categoria: string;
  tipo: "motrice" | "cisterna" | null;
  marca: string;
  modello: string;
  marcaModello: string;
  telaio: string;
  colore: string;
  cilindrata: string;
  potenza: string;
  massaComplessiva: string;
  proprietario: string;
  assicurazione: string;
  dataImmatricolazione: string;
  dataImmatricolazioneTimestamp: number | null;
  dataScadenzaRevisione: string;
  dataScadenzaRevisioneTimestamp: number | null;
  dataUltimoCollaudo: string;
  dataUltimoCollaudoTimestamp: number | null;
  manutenzioneProgrammata: boolean;
  manutenzioneDataInizio: string;
  manutenzioneDataInizioTimestamp: number | null;
  manutenzioneDataFine: string;
  manutenzioneDataFineTimestamp: number | null;
  manutenzioneKmMax: string;
  manutenzioneContratto: string;
  note: string;
  autistaId: string | null;
  autistaNome: string | null;
  fotoUrl: string | null;
  fotoPath: string | null;
  fotoStoragePath: string | null;
  librettoUrl: string | null;
  datasetShape: NextLegacyDatasetShape;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof MEZZI_DATASET_KEY;
  quality: NextMezzoQuality;
  flags: string[];
};

export type NextMezzoListItem = NextAnagraficheFlottaMezzoItem;

export type NextAnagraficheFlottaSnapshot = {
  domainCode: typeof NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.code;
  domainName: typeof NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.name;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.activeReadOnlyDataset;
  fields: readonly NextMezzoListField[];
  mezziDatasetShape: NextLegacyDatasetShape;
  colleghiDatasetShape: NextLegacyDatasetShape;
  items: NextAnagraficheFlottaMezzoItem[];
  colleghi: NextAnagraficheFlottaCollegaItem[];
  counts: {
    totalMezzi: number;
    withAutista: number;
    withFoto: number;
    withLibretto: number;
    withRevision: number;
    missingTargaDiscarded: number;
    totalColleghi: number;
  };
  limitations: string[];
};

type ReadNextAnagraficheFlottaSnapshotOptions = {
  includeClonePatches?: boolean;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "si";
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
    /^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2}))?$/
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

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDateInputValue(value: unknown): {
  value: string;
  timestamp: number | null;
  parsed: boolean;
} {
  if (value == null) {
    return { value: "", timestamp: null, parsed: false };
  }

  const parsed = parseDateFlexible(value);
  if (parsed) {
    return {
      value: formatDateInput(parsed),
      timestamp: parsed.getTime(),
      parsed: true,
    };
  }

  return {
    value: normalizeText(value),
    timestamp: null,
    parsed: false,
  };
}

function unwrapStorageArray(
  rawDoc: Record<string, unknown> | unknown[] | null
): { datasetShape: NextLegacyDatasetShape; items: unknown[] } {
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

function normalizeTarga(value: unknown): string {
  return normalizeText(value).toUpperCase().replace(/\s+/g, "");
}

export function normalizeNextMezzoTarga(value: unknown): string {
  return normalizeTarga(value);
}

export function normalizeNextMezzoCategoria(value: unknown): string {
  const normalized = normalizeText(value).replace(/\s+/g, " ").toLowerCase();
  if (!normalized) return "Senza categoria";
  return NEXT_FLOTTA_CANONICAL_CATEGORY_MAP[normalized] ?? normalized;
}

function normalizeNextMezzoTipo(value: unknown): "motrice" | "cisterna" | null {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "motrice") return "motrice";
  if (
    normalized === "cisterna" ||
    normalized === "rimorchio" ||
    normalized === "cisterna / rimorchio"
  ) {
    return "cisterna";
  }
  return null;
}

function getFirstDefined(raw: NextAnagraficheFlottaRaw, aliases: string[]): unknown {
  for (const alias of aliases) {
    if (raw[alias] !== undefined) return raw[alias];
  }
  return undefined;
}

function getFirstText(raw: NextAnagraficheFlottaRaw, aliases: string[]): string {
  for (const alias of aliases) {
    const normalized = normalizeText(raw[alias]);
    if (normalized) return normalized;
  }
  return "";
}

function getFirstOptionalText(
  raw: NextAnagraficheFlottaRaw,
  aliases: string[]
): string | null {
  for (const alias of aliases) {
    const normalized = normalizeOptionalText(raw[alias]);
    if (normalized) return normalized;
  }
  return null;
}

function buildFallbackId(raw: NextAnagraficheFlottaRaw, targa: string, index: number) {
  const directId = normalizeText(raw.id);
  if (directId) return directId;
  if (targa) return `targa:${targa}`;
  return `mezzo:${index}`;
}

function buildFallbackCollegaId(raw: NextAnagraficheFlottaRaw, index: number): string {
  const directId = normalizeText(raw.id);
  if (directId) return directId;
  const nome = normalizeText(raw.nome).toLowerCase().replace(/\s+/g, "-");
  if (nome) return `collega:${nome}:${index}`;
  return `collega:${index}`;
}

function deriveMezzoQuality(args: {
  marca: string;
  modello: string;
  telaio: string;
  dataImmatricolazioneTimestamp: number | null;
  dataScadenzaRevisioneTimestamp: number | null;
}): NextMezzoQuality {
  const {
    marca,
    modello,
    telaio,
    dataImmatricolazioneTimestamp,
    dataScadenzaRevisioneTimestamp,
  } = args;

  if (
    marca &&
    modello &&
    telaio &&
    dataImmatricolazioneTimestamp !== null &&
    dataScadenzaRevisioneTimestamp !== null
  ) {
    return "certo";
  }

  if (
    marca ||
    modello ||
    telaio ||
    dataImmatricolazioneTimestamp !== null ||
    dataScadenzaRevisioneTimestamp !== null
  ) {
    return "parziale";
  }

  return "da_verificare";
}

function deriveCollegaQuality(args: {
  id: string;
  nome: string;
}): NextCollegaQuality {
  if (args.id && args.nome) return "certo";
  if (args.id || args.nome) return "parziale";
  return "da_verificare";
}

function mapCollegaItem(
  raw: NextAnagraficheFlottaRaw,
  index: number,
  datasetShape: NextLegacyDatasetShape
): NextAnagraficheFlottaCollegaItem | null {
  const nome = getFirstText(raw, ["nome"]);
  const cognome = getFirstText(raw, ["cognome"]);
  const id = buildFallbackCollegaId(raw, index);
  const nomeCompleto = [nome, cognome].filter(Boolean).join(" ").trim();
  const flags: string[] = [];

  if (!nome) flags.push("nome_assente");
  if (!normalizeText(raw.id)) flags.push("id_ricostruito");
  if (!cognome) flags.push("cognome_assente");
  if (datasetShape === "unsupported") flags.push("dataset_shape_non_supportata");

  if (!nome && !cognome && !normalizeText(raw.badge) && !normalizeText(raw.codice)) {
    return null;
  }

  return {
    id,
    nome,
    cognome,
    nomeCompleto: nomeCompleto || nome,
    badge: getFirstText(raw, ["badge"]),
    codice: getFirstText(raw, ["codice"]),
    descrizione: getFirstText(raw, ["descrizione"]),
    datasetShape,
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: COLLEGHI_DATASET_KEY,
    quality: deriveCollegaQuality({ id, nome }),
    flags,
  };
}

function sortColleghi(items: NextAnagraficheFlottaCollegaItem[]) {
  return [...items].sort((left, right) => {
    const nameOrder = left.nomeCompleto.localeCompare(right.nomeCompleto, "it", {
      sensitivity: "base",
    });
    if (nameOrder !== 0) return nameOrder;
    return left.id.localeCompare(right.id, "it", { sensitivity: "base" });
  });
}

function mapMezzoItem(args: {
  raw: NextAnagraficheFlottaRaw;
  index: number;
  datasetShape: NextLegacyDatasetShape;
  colleaguesById: Map<string, NextAnagraficheFlottaCollegaItem>;
}): NextAnagraficheFlottaMezzoItem | null {
  const { raw, index, datasetShape, colleaguesById } = args;
  const targa = normalizeTarga(raw.targa);
  if (!targa) return null;

  const categoriaRaw = getFirstDefined(raw, [
    "categoria",
    "categoriaMezzo",
    "tipoMezzo",
  ]);
  const categoria = normalizeNextMezzoCategoria(categoriaRaw);
  const tipo = normalizeNextMezzoTipo(getFirstDefined(raw, ["tipo", "tipoMezzo"]));
  const marca = getFirstText(raw, ["marca"]);
  const modello = getFirstText(raw, ["modello"]);
  const derivedMarcaModello = [marca, modello].filter(Boolean).join(" ").trim();
  const marcaModello =
    getFirstText(raw, ["marcaModello"]) || derivedMarcaModello;
  const autistaId = getFirstOptionalText(raw, ["autistaId"]);
  const autistaNomeDirect = getFirstOptionalText(raw, ["autistaNome", "driverName"]);
  const collega = autistaId ? colleaguesById.get(autistaId) ?? null : null;
  const autistaNome = autistaNomeDirect ?? collega?.nomeCompleto ?? null;
  const immatricolazione = normalizeDateInputValue(raw.dataImmatricolazione);
  const revisione = normalizeDateInputValue(raw.dataScadenzaRevisione);
  const ultimoCollaudo = normalizeDateInputValue(raw.dataUltimoCollaudo);
  const manutenzioneDataInizio = normalizeDateInputValue(raw.manutenzioneDataInizio);
  const manutenzioneDataFine = normalizeDateInputValue(raw.manutenzioneDataFine);
  const flags: string[] = [];

  if (!normalizeText(raw.id)) flags.push("id_ricostruito");
  if (!marca) flags.push("marca_assente");
  if (!modello) flags.push("modello_assente");
  if (!getFirstText(raw, ["categoria", "categoriaMezzo", "tipoMezzo"])) {
    flags.push("categoria_assente");
  }
  if (categoriaRaw !== undefined && categoria !== normalizeText(categoriaRaw)) {
    flags.push("categoria_normalizzata");
  }
  if (!normalizeText(raw.marcaModello) && marcaModello) {
    flags.push("marca_modello_ricostruito");
  }
  if (!autistaNome) flags.push("autista_assente");
  if (!autistaNomeDirect && collega?.nomeCompleto) {
    flags.push("autista_nome_risolto_da_colleghi");
  }
  if (autistaId && !collega && !autistaNomeDirect) {
    flags.push("autista_id_senza_match_collega");
  }
  if (!normalizeOptionalText(raw.fotoUrl)) flags.push("foto_assente");
  if (!normalizeOptionalText(raw.librettoUrl)) flags.push("libretto_assente");
  if (normalizeOptionalText(raw.dataImmatricolazione) && !immatricolazione.parsed) {
    flags.push("immatricolazione_non_parseabile");
  }
  if (normalizeOptionalText(raw.dataScadenzaRevisione) && !revisione.parsed) {
    flags.push("revisione_non_parseabile");
  }
  if (normalizeOptionalText(raw.dataUltimoCollaudo) && !ultimoCollaudo.parsed) {
    flags.push("ultimo_collaudo_non_parseabile");
  }
  if (datasetShape === "unsupported") flags.push("dataset_shape_non_supportata");

  return {
    id: buildFallbackId(raw, targa, index),
    targa,
    anno: getFirstText(raw, ["anno"]),
    categoria,
    tipo,
    marca,
    modello,
    marcaModello,
    telaio: getFirstText(raw, ["telaio"]),
    colore: getFirstText(raw, ["colore"]),
    cilindrata: getFirstText(raw, ["cilindrata"]),
    potenza: getFirstText(raw, ["potenza"]),
    massaComplessiva: getFirstText(raw, ["massaComplessiva"]),
    proprietario: getFirstText(raw, ["proprietario"]),
    assicurazione: getFirstText(raw, ["assicurazione"]),
    dataImmatricolazione: immatricolazione.value,
    dataImmatricolazioneTimestamp: immatricolazione.timestamp,
    dataScadenzaRevisione: revisione.value,
    dataScadenzaRevisioneTimestamp: revisione.timestamp,
    dataUltimoCollaudo: ultimoCollaudo.value,
    dataUltimoCollaudoTimestamp: ultimoCollaudo.timestamp,
    manutenzioneProgrammata: normalizeBoolean(raw.manutenzioneProgrammata),
    manutenzioneDataInizio: manutenzioneDataInizio.value,
    manutenzioneDataInizioTimestamp: manutenzioneDataInizio.timestamp,
    manutenzioneDataFine: manutenzioneDataFine.value,
    manutenzioneDataFineTimestamp: manutenzioneDataFine.timestamp,
    manutenzioneKmMax: getFirstText(raw, ["manutenzioneKmMax"]),
    manutenzioneContratto: getFirstText(raw, ["manutenzioneContratto"]),
    note: getFirstText(raw, ["note"]),
    autistaId,
    autistaNome,
    fotoUrl: normalizeOptionalText(raw.fotoUrl),
    fotoPath: normalizeOptionalText(raw.fotoPath),
    fotoStoragePath: normalizeOptionalText(raw.fotoStoragePath),
    librettoUrl: normalizeOptionalText(raw.librettoUrl),
    datasetShape,
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: MEZZI_DATASET_KEY,
    quality: deriveMezzoQuality({
      marca,
      modello,
      telaio: getFirstText(raw, ["telaio"]),
      dataImmatricolazioneTimestamp: immatricolazione.timestamp,
      dataScadenzaRevisioneTimestamp: revisione.timestamp,
    }),
    flags,
  };
}

function sortMezzi(items: NextAnagraficheFlottaMezzoItem[]) {
  return [...items].sort((left, right) => {
    const categoryOrder = left.categoria.localeCompare(right.categoria, "it", {
      sensitivity: "base",
    });
    if (categoryOrder !== 0) return categoryOrder;

    const targaOrder = left.targa.localeCompare(right.targa, "it", {
      sensitivity: "base",
    });
    if (targaOrder !== 0) return targaOrder;

    return left.id.localeCompare(right.id, "it", { sensitivity: "base" });
  });
}

function applyMezzoClonePatch(
  item: NextAnagraficheFlottaMezzoItem,
  patchByTarga: Map<string, ReturnType<typeof readNextFlottaClonePatches>[number]>,
): NextAnagraficheFlottaMezzoItem | null {
  const patch = patchByTarga.get(item.targa);
  if (!patch) {
    return item;
  }
  if (patch.deleted) {
    return null;
  }

  const immatricolazione =
    patch.dataImmatricolazione !== undefined
      ? normalizeDateInputValue(patch.dataImmatricolazione)
      : {
          value: item.dataImmatricolazione,
          timestamp: item.dataImmatricolazioneTimestamp,
          parsed: item.dataImmatricolazioneTimestamp !== null,
        };
  const revisione =
    patch.dataScadenzaRevisione !== undefined
      ? normalizeDateInputValue(patch.dataScadenzaRevisione)
      : {
          value: item.dataScadenzaRevisione,
          timestamp: item.dataScadenzaRevisioneTimestamp,
          parsed: item.dataScadenzaRevisioneTimestamp !== null,
        };
  const ultimoCollaudo =
    patch.dataUltimoCollaudo !== undefined
      ? normalizeDateInputValue(patch.dataUltimoCollaudo)
      : {
          value: item.dataUltimoCollaudo,
          timestamp: item.dataUltimoCollaudoTimestamp,
          parsed: item.dataUltimoCollaudoTimestamp !== null,
        };
  const manutenzioneDataInizio =
    patch.manutenzioneDataInizio !== undefined
      ? normalizeDateInputValue(patch.manutenzioneDataInizio)
      : {
          value: item.manutenzioneDataInizio,
          timestamp: item.manutenzioneDataInizioTimestamp,
          parsed: item.manutenzioneDataInizioTimestamp !== null,
        };
  const manutenzioneDataFine =
    patch.manutenzioneDataFine !== undefined
      ? normalizeDateInputValue(patch.manutenzioneDataFine)
      : {
          value: item.manutenzioneDataFine,
          timestamp: item.manutenzioneDataFineTimestamp,
          parsed: item.manutenzioneDataFineTimestamp !== null,
        };

  const flags = item.flags.filter((entry) => {
    if (entry === "foto_assente" && patch.fotoUrl) return false;
    if (entry === "libretto_assente" && patch.librettoUrl) return false;
    return true;
  });

  if (patch.fotoUrl) flags.push("foto_clone_patch");
  if (patch.librettoUrl) flags.push("libretto_clone_patch");
  if (patch.source === "mezzi") flags.push("mezzo_clone_patch");

  const marca = patch.marca ?? item.marca;
  const modello = patch.modello ?? item.modello;
  const telaio = patch.telaio ?? item.telaio;
  const merged = {
    ...item,
    id: patch.mezzoId ?? item.id,
    anno: patch.anno ?? item.anno,
    categoria: patch.categoria ?? item.categoria,
    tipo: patch.tipo ?? item.tipo,
    marca,
    modello,
    marcaModello: [marca, modello].filter(Boolean).join(" ").trim() || item.marcaModello,
    telaio,
    colore: patch.colore ?? item.colore,
    cilindrata: patch.cilindrata ?? item.cilindrata,
    potenza: patch.potenza ?? item.potenza,
    massaComplessiva: patch.massaComplessiva ?? item.massaComplessiva,
    proprietario: patch.proprietario ?? item.proprietario,
    assicurazione: patch.assicurazione ?? item.assicurazione,
    dataImmatricolazione: immatricolazione.value,
    dataImmatricolazioneTimestamp: immatricolazione.timestamp,
    dataScadenzaRevisione: revisione.value,
    dataScadenzaRevisioneTimestamp: revisione.timestamp,
    dataUltimoCollaudo: ultimoCollaudo.value,
    dataUltimoCollaudoTimestamp: ultimoCollaudo.timestamp,
    manutenzioneProgrammata: patch.manutenzioneProgrammata ?? item.manutenzioneProgrammata,
    manutenzioneDataInizio: manutenzioneDataInizio.value,
    manutenzioneDataInizioTimestamp: manutenzioneDataInizio.timestamp,
    manutenzioneDataFine: manutenzioneDataFine.value,
    manutenzioneDataFineTimestamp: manutenzioneDataFine.timestamp,
    manutenzioneKmMax: patch.manutenzioneKmMax ?? item.manutenzioneKmMax,
    manutenzioneContratto: patch.manutenzioneContratto ?? item.manutenzioneContratto,
    note: patch.note ?? item.note,
    autistaId:
      patch.autistaId !== undefined
        ? patch.autistaId
        : item.autistaId,
    autistaNome:
      patch.autistaNome !== undefined
        ? patch.autistaNome
        : item.autistaNome,
    fotoUrl: patch.fotoUrl ?? item.fotoUrl,
    fotoPath: patch.fotoPath ?? item.fotoPath,
    fotoStoragePath: patch.fotoStoragePath ?? item.fotoStoragePath,
    librettoUrl: patch.librettoUrl ?? item.librettoUrl,
    quality: deriveMezzoQuality({
      marca,
      modello,
      telaio,
      dataImmatricolazioneTimestamp: immatricolazione.timestamp,
      dataScadenzaRevisioneTimestamp: revisione.timestamp,
    }),
    flags: Array.from(new Set(flags)),
  } satisfies NextAnagraficheFlottaMezzoItem;

  return merged;
}

function buildMezzoFromClonePatch(args: {
  patch: ReturnType<typeof readNextFlottaClonePatches>[number];
  datasetShape: NextLegacyDatasetShape;
  colleaguesById: Map<string, NextAnagraficheFlottaCollegaItem>;
}): NextAnagraficheFlottaMezzoItem | null {
  const { patch, datasetShape, colleaguesById } = args;
  if (patch.deleted) {
    return null;
  }

  const raw = {
    id: patch.mezzoId ?? `next-clone-mezzo:${patch.targa}`,
    targa: patch.targa,
    anno: patch.anno ?? "",
    categoria: patch.categoria ?? "",
    tipo: patch.tipo ?? null,
    marca: patch.marca ?? "",
    modello: patch.modello ?? "",
    telaio: patch.telaio ?? "",
    colore: patch.colore ?? "",
    cilindrata: patch.cilindrata ?? "",
    potenza: patch.potenza ?? "",
    massaComplessiva: patch.massaComplessiva ?? "",
    proprietario: patch.proprietario ?? "",
    assicurazione: patch.assicurazione ?? "",
    dataImmatricolazione: patch.dataImmatricolazione ?? "",
    dataScadenzaRevisione: patch.dataScadenzaRevisione ?? "",
    dataUltimoCollaudo: patch.dataUltimoCollaudo ?? "",
    manutenzioneProgrammata: patch.manutenzioneProgrammata ?? false,
    manutenzioneDataInizio: patch.manutenzioneDataInizio ?? "",
    manutenzioneDataFine: patch.manutenzioneDataFine ?? "",
    manutenzioneKmMax: patch.manutenzioneKmMax ?? "",
    manutenzioneContratto: patch.manutenzioneContratto ?? "",
    note: patch.note ?? "",
    autistaId: patch.autistaId ?? null,
    autistaNome: patch.autistaNome ?? null,
    fotoUrl: patch.fotoUrl ?? null,
    fotoPath: patch.fotoPath ?? null,
    fotoStoragePath: patch.fotoStoragePath ?? null,
    librettoUrl: patch.librettoUrl ?? null,
  } satisfies NextAnagraficheFlottaRaw;

  const mapped = mapMezzoItem({
    raw,
    index: Number.MAX_SAFE_INTEGER,
    datasetShape,
    colleaguesById,
  });
  if (!mapped) {
    return null;
  }

  return {
    ...mapped,
    flags: Array.from(new Set([...mapped.flags, "mezzo_clone_only"])),
  };
}

export async function readNextAnagraficheFlottaSnapshot(
  options: ReadNextAnagraficheFlottaSnapshotOptions = {},
): Promise<NextAnagraficheFlottaSnapshot> {
  const includeClonePatches = options.includeClonePatches === true;
  const [mezziSnapshot, colleghiSnapshot] = await Promise.all([
    getDoc(doc(db, STORAGE_COLLECTION, MEZZI_DATASET_KEY)),
    getDoc(doc(db, STORAGE_COLLECTION, COLLEGHI_DATASET_KEY)),
  ]);

  const mezziRawDoc = mezziSnapshot.exists()
    ? ((mezziSnapshot.data() as Record<string, unknown>) ?? null)
    : null;
  const colleghiRawDoc = colleghiSnapshot.exists()
    ? ((colleghiSnapshot.data() as Record<string, unknown>) ?? null)
    : null;

  const mezziDataset = unwrapStorageArray(mezziRawDoc);
  const colleghiDataset = unwrapStorageArray(colleghiRawDoc);

  const colleghi = sortColleghi(
    colleghiDataset.items
      .map((entry, index) => {
        if (!entry || typeof entry !== "object") return null;
        return mapCollegaItem(
          entry as NextAnagraficheFlottaRaw,
          index,
          colleghiDataset.datasetShape
        );
      })
      .filter((entry): entry is NextAnagraficheFlottaCollegaItem => Boolean(entry))
  );

  const colleaguesById = new Map(colleghi.map((entry) => [entry.id, entry]));
  const rawMissingTarga = mezziDataset.items.reduce<number>((count, entry) => {
    if (!entry || typeof entry !== "object") return count;
    return normalizeTarga((entry as NextAnagraficheFlottaRaw).targa)
      ? count
      : count + 1;
  }, 0);
  const clonePatches = includeClonePatches ? readNextFlottaClonePatches() : [];
  const patchByTarga = new Map(clonePatches.map((entry) => [normalizeTarga(entry.targa), entry]));

  const baseItems = mezziDataset.items
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const mapped = mapMezzoItem({
        raw: entry as NextAnagraficheFlottaRaw,
        index,
        datasetShape: mezziDataset.datasetShape,
        colleaguesById,
      });
      return mapped ? applyMezzoClonePatch(mapped, patchByTarga) : null;
    })
    .filter((entry): entry is NextAnagraficheFlottaMezzoItem => Boolean(entry));

  const existingTarghe = new Set(baseItems.map((entry) => entry.targa));
  const extraCloneItems = clonePatches
    .filter((entry) => !entry.deleted && !existingTarghe.has(normalizeTarga(entry.targa)))
    .map((patch) =>
      buildMezzoFromClonePatch({
        patch,
        datasetShape: mezziDataset.datasetShape,
        colleaguesById,
      }),
    )
    .filter((entry): entry is NextAnagraficheFlottaMezzoItem => Boolean(entry));

  const items = sortMezzi([...baseItems, ...extraCloneItems]);

  return {
    domainCode: NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.code,
    domainName: NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.name,
    logicalDatasets: NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.activeReadOnlyDataset,
    fields: NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.nextListFields,
    mezziDatasetShape: mezziDataset.datasetShape,
    colleghiDatasetShape: colleghiDataset.datasetShape,
    items,
    colleghi,
    counts: {
      totalMezzi: items.length,
      withAutista: items.filter((entry) => Boolean(entry.autistaNome)).length,
      withFoto: items.filter((entry) => Boolean(entry.fotoUrl)).length,
      withLibretto: items.filter((entry) => Boolean(entry.librettoUrl)).length,
      withRevision: items.filter(
        (entry) => entry.dataScadenzaRevisioneTimestamp !== null
      ).length,
      missingTargaDiscarded: rawMissingTarga,
      totalColleghi: colleghi.length,
    },
    limitations: [
      includeClonePatches
        ? "Il layer flotta legge `@mezzi_aziendali` e `@colleghi` in read-only; le patch locali restano disponibili solo su richiesta esplicita del chiamante."
        : "Il layer flotta legge `@mezzi_aziendali` e `@colleghi` in read-only senza applicare patch locali del clone.",
      "Il collegamento collega -> mezzo viene usato solo per risolvere `autistaNome` quando il mezzo espone un `autistaId` leggibile; nessun match debole su nome libero.",
      rawMissingTarga > 0
        ? "Una parte di `@mezzi_aziendali` non espone una targa leggibile ed e stata esclusa dalla flotta clone."
        : null,
      mezziDataset.datasetShape === "unsupported"
        ? "Il dataset `@mezzi_aziendali` non e in una shape supportata fuori dai formati `array/items/value/value.items`."
        : null,
      colleghiDataset.datasetShape === "unsupported"
        ? "Il dataset `@colleghi` non e in una shape supportata fuori dai formati `array/items/value/value.items`."
        : null,
      items.some((entry) => entry.flags.includes("immatricolazione_non_parseabile"))
        ? "Alcune date immatricolazione restano non parseabili nel formato legacy e vengono lasciate come stringa grezza."
        : null,
      items.some((entry) => entry.flags.includes("revisione_non_parseabile"))
        ? "Alcune scadenze revisione restano non parseabili nel formato legacy e non vengono forzate dal layer."
        : null,
      includeClonePatches && patchByTarga.size > 0
        ? `Il chiamante ha richiesto ${patchByTarga.size} patch locali opzionali su libretti/foto senza scrivere sulla madre.`
        : null,
    ].filter((entry): entry is string => Boolean(entry)),
  };
}

export async function readNextMezzoByTarga(
  targa: string
): Promise<NextAnagraficheFlottaMezzoItem | null> {
  const normalizedTarga = normalizeTarga(targa);
  if (!normalizedTarga) {
    return null;
  }

  const snapshot = await readNextAnagraficheFlottaSnapshot();
  return snapshot.items.find((item) => item.targa === normalizedTarga) ?? null;
}
