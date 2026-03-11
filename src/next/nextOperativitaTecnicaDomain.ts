import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { normalizeNextMezzoTarga } from "./nextAnagraficheFlottaDomain";
import {
  NEXT_LAVORI_DOMAIN,
  readNextMezzoLavoriSnapshot,
  type NextLavoroReadOnlyItem,
} from "./domain/nextLavoriDomain";

const STORAGE_COLLECTION = "storage";
const MANUTENZIONI_DATASET_KEY = "@manutenzioni";

type NextOperativitaTecnicaRaw = Record<string, unknown>;

export const NEXT_OPERATIVITA_TECNICA_DOMAIN = {
  code: "D02",
  name: "Operativita tecnica mezzo",
  logicalDatasets: [NEXT_LAVORI_DOMAIN.activeReadOnlyDataset, MANUTENZIONI_DATASET_KEY] as const,
  nextReadOnlyFields: {
    lavori: [
      "id",
      "gruppoId",
      "targa",
      "descrizione",
      "dettagli",
      "dataInserimento",
      "dataEsecuzione",
      "eseguito",
      "urgenza",
      "statoVista",
      "source",
      "quality",
      "flags",
    ] as const,
    manutenzioni: [
      "id",
      "targa",
      "descrizione",
      "tipo",
      "data",
      "km",
      "ore",
    ] as const,
  },
} as const;

export type NextLavoroTecnicoField =
  (typeof NEXT_OPERATIVITA_TECNICA_DOMAIN.nextReadOnlyFields.lavori)[number];

export type NextManutenzioneTecnicaField =
  (typeof NEXT_OPERATIVITA_TECNICA_DOMAIN.nextReadOnlyFields.manutenzioni)[number];

export type NextLavoroTecnicoItem = NextLavoroReadOnlyItem;

export type NextManutenzioneTecnicaItem = {
  id: string;
  targa: string;
  descrizione: string | null;
  tipo: string | null;
  data: string | null;
  km: number | null;
  ore: number | null;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof MANUTENZIONI_DATASET_KEY;
};

export type NextMezzoOperativitaTecnicaSnapshot = {
  domainCode: typeof NEXT_OPERATIVITA_TECNICA_DOMAIN.code;
  domainName: typeof NEXT_OPERATIVITA_TECNICA_DOMAIN.name;
  mezzoTarga: string;
  logicalDatasets: readonly string[];
  fields: {
    lavori: readonly NextLavoroTecnicoField[];
    manutenzioni: readonly NextManutenzioneTecnicaField[];
  };
  lavoriAperti: NextLavoroTecnicoItem[];
  lavoriChiusi: NextLavoroTecnicoItem[];
  manutenzioni: NextManutenzioneTecnicaItem[];
  counts: {
    lavoriAperti: number;
    lavoriChiusi: number;
    manutenzioni: number;
  };
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
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

function toTimestamp(value: unknown): number | null {
  const parsed = parseDateFlexible(value);
  return parsed ? parsed.getTime() : null;
}

function sortByDateDesc<T extends { data?: string | null }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const rightDate = toTimestamp(right.data) ?? 0;
    const leftDate = toTimestamp(left.data) ?? 0;
    return rightDate - leftDate;
  });
}

function unwrapStorageArray(rawDoc: Record<string, unknown> | null): unknown[] {
  if (Array.isArray(rawDoc)) return rawDoc;
  if (Array.isArray(rawDoc?.value)) return rawDoc.value;
  if (Array.isArray(rawDoc?.items)) return rawDoc.items;
  return [];
}

async function readStorageDataset(key: string): Promise<unknown[]> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, key));
  const rawDoc = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  return unwrapStorageArray(rawDoc);
}

function buildManutenzioneId(raw: NextOperativitaTecnicaRaw, index: number): string {
  const id = normalizeText(raw.id);
  if (id) return id;

  const targa = normalizeNextMezzoTarga(raw.targa);
  if (targa) return `manutenzione:${targa}:${index}`;

  return `manutenzione:${index}`;
}

function toNextManutenzioneTecnicaItem(
  raw: NextOperativitaTecnicaRaw,
  index: number
): NextManutenzioneTecnicaItem | null {
  const targa = normalizeNextMezzoTarga(raw.targa);
  if (!targa) return null;

  return {
    id: buildManutenzioneId(raw, index),
    targa,
    descrizione: normalizeOptionalText(raw.descrizione),
    tipo: normalizeOptionalText(raw.tipo),
    data: normalizeOptionalText(raw.data),
    km: normalizeNumber(raw.km),
    ore: normalizeNumber(raw.ore),
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: MANUTENZIONI_DATASET_KEY,
  };
}

export async function readNextMezzoOperativitaTecnicaSnapshot(
  targa: string
): Promise<NextMezzoOperativitaTecnicaSnapshot> {
  const mezzoTarga = normalizeNextMezzoTarga(targa);

  const [lavoriSnapshot, manutenzioniRaw] = await Promise.all([
    readNextMezzoLavoriSnapshot(mezzoTarga),
    readStorageDataset(MANUTENZIONI_DATASET_KEY),
  ]);

  const manutenzioniPerMezzo = manutenzioniRaw
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      return toNextManutenzioneTecnicaItem(entry as NextOperativitaTecnicaRaw, index);
    })
    .filter((entry): entry is NextManutenzioneTecnicaItem => Boolean(entry))
    .filter((entry) => entry.targa === mezzoTarga);

  const manutenzioni = sortByDateDesc(manutenzioniPerMezzo);

  return {
    domainCode: NEXT_OPERATIVITA_TECNICA_DOMAIN.code,
    domainName: NEXT_OPERATIVITA_TECNICA_DOMAIN.name,
    mezzoTarga,
    logicalDatasets: NEXT_OPERATIVITA_TECNICA_DOMAIN.logicalDatasets,
    fields: NEXT_OPERATIVITA_TECNICA_DOMAIN.nextReadOnlyFields,
    lavoriAperti: lavoriSnapshot.daEseguire,
    lavoriChiusi: lavoriSnapshot.eseguiti,
    manutenzioni,
    counts: {
      lavoriAperti: lavoriSnapshot.counts.daEseguire,
      lavoriChiusi: lavoriSnapshot.counts.eseguiti,
      manutenzioni: manutenzioni.length,
    },
  };
}
