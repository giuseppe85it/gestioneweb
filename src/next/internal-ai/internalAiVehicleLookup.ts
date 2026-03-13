import {
  normalizeNextMezzoTarga,
  readNextAnagraficheFlottaSnapshot,
  type NextAnagraficheFlottaMezzoItem,
} from "../nextAnagraficheFlottaDomain";
import type { InternalAiVehicleLookupCandidate } from "./internalAiTypes";

let lookupCatalogPromise: Promise<InternalAiVehicleLookupCandidate[]> | null = null;

function toLookupCandidate(item: NextAnagraficheFlottaMezzoItem): InternalAiVehicleLookupCandidate {
  return {
    id: item.id,
    targa: item.targa,
    categoria: item.categoria,
    marcaModello: item.marcaModello || null,
    autistaNome: item.autistaNome ?? null,
    quality: item.quality,
    sourceKey: item.sourceKey,
  };
}

function computeLookupScore(candidate: InternalAiVehicleLookupCandidate, query: string): number {
  const normalizedQuery = normalizeNextMezzoTarga(query);
  const targa = candidate.targa;
  const brandModel = (candidate.marcaModello ?? "").toLowerCase();
  const category = candidate.categoria.toLowerCase();
  const autista = (candidate.autistaNome ?? "").toLowerCase();
  const textQuery = query.trim().toLowerCase();

  if (!normalizedQuery && !textQuery) return 0;
  if (normalizedQuery && targa === normalizedQuery) return 100;
  if (normalizedQuery && targa.startsWith(normalizedQuery)) return 80;
  if (normalizedQuery && targa.includes(normalizedQuery)) return 60;
  if (textQuery && brandModel.includes(textQuery)) return 35;
  if (textQuery && autista.includes(textQuery)) return 25;
  if (textQuery && category.includes(textQuery)) return 15;
  return 0;
}

export function normalizeInternalAiVehicleLookupQuery(value: string): string {
  return normalizeNextMezzoTarga(value);
}

export async function readInternalAiVehicleLookupCatalog(): Promise<InternalAiVehicleLookupCandidate[]> {
  if (!lookupCatalogPromise) {
    lookupCatalogPromise = readNextAnagraficheFlottaSnapshot().then((snapshot) =>
      snapshot.items.map(toLookupCandidate),
    );
  }

  return lookupCatalogPromise;
}

export function matchInternalAiVehicleLookupCandidates(
  catalog: InternalAiVehicleLookupCandidate[],
  query: string,
  limit = 8,
): InternalAiVehicleLookupCandidate[] {
  const normalizedQuery = normalizeInternalAiVehicleLookupQuery(query);
  const textQuery = query.trim().toLowerCase();
  if (!normalizedQuery && !textQuery) {
    return [];
  }

  return [...catalog]
    .map((candidate) => ({
      candidate,
      score: computeLookupScore(candidate, query),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.candidate.targa.localeCompare(right.candidate.targa, "it", {
        sensitivity: "base",
      });
    })
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

export function findInternalAiExactVehicleMatch(
  catalog: InternalAiVehicleLookupCandidate[],
  query: string,
): InternalAiVehicleLookupCandidate | null {
  const normalizedQuery = normalizeInternalAiVehicleLookupQuery(query);
  if (!normalizedQuery) return null;
  return catalog.find((candidate) => candidate.targa === normalizedQuery) ?? null;
}
