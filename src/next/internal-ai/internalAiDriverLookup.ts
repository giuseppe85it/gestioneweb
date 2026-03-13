import { readNextColleghiSnapshot } from "../domain/nextColleghiDomain";
import { readNextAnagraficheFlottaSnapshot } from "../nextAnagraficheFlottaDomain";
import type { InternalAiDriverLookupCandidate } from "./internalAiTypes";
import {
  matchInternalAiDriverVehicleIdentity,
  normalizeInternalAiDriverIdentityBadge,
  normalizeInternalAiDriverIdentityName,
  normalizeInternalAiDriverIdentityText,
} from "./internalAiDriverIdentity";

type DriverAssociationMatch = "autista_id" | "nome_dichiarato";

type DriverAssociationSummary = {
  count: number;
  preview: string[];
};

type DriverCandidateBase = {
  id: string;
  nomeCompleto: string;
  badge: string | null;
  telefono: string | null;
  codice: string | null;
  descrizione: string | null;
  quality: "certo" | "parziale" | "da_verificare";
  sourceKey: string;
};

let driverLookupCatalogPromise: Promise<InternalAiDriverLookupCandidate[]> | null = null;

function findUniqueDriverByExactName(
  nameBuckets: Map<string, DriverCandidateBase[]>,
  value: string | null | undefined,
): DriverCandidateBase | null {
  const normalizedName = normalizeInternalAiDriverIdentityName(value);
  if (!normalizedName) {
    return null;
  }

  const bucket = nameBuckets.get(normalizedName) ?? [];
  return bucket.length === 1 ? bucket[0] : null;
}

async function buildAssociationMap(
  drivers: DriverCandidateBase[],
): Promise<Map<string, DriverAssociationSummary>> {
  const driverById = new Map(drivers.map((entry) => [entry.id, entry]));
  const driverByName = new Map<string, DriverCandidateBase[]>();

  drivers.forEach((entry) => {
    const normalizedName = normalizeInternalAiDriverIdentityName(entry.nomeCompleto);
    if (!normalizedName) {
      return;
    }

    const current = driverByName.get(normalizedName) ?? [];
    current.push(entry);
    driverByName.set(normalizedName, current);
  });

  const map = new Map<string, { labels: string[]; kinds: Set<DriverAssociationMatch> }>();
  const snapshot = await readNextAnagraficheFlottaSnapshot();

  snapshot.items.forEach((mezzo) => {
    const byId = mezzo.autistaId ? driverById.get(mezzo.autistaId) ?? null : null;
    const byName =
      !byId && mezzo.autistaNome
        ? findUniqueDriverByExactName(driverByName, mezzo.autistaNome)
        : null;
    const match = byId ?? byName;
    const matchResult = match
      ? matchInternalAiDriverVehicleIdentity({
          driver: {
            driverId: match.id,
            nomeCompleto: match.nomeCompleto,
          },
          layerIdentity: {
            autistaId: mezzo.autistaId,
            autistaNome: mezzo.autistaNome,
          },
        })
      : null;
    const matchKind: DriverAssociationMatch | null =
      matchResult?.matched && matchResult.reason === "autista_id"
        ? "autista_id"
        : matchResult?.matched && matchResult.reason === "nome_fallback"
          ? "nome_dichiarato"
          : null;

    if (!match || !matchKind) return;

    const current = map.get(match.id) ?? { labels: [], kinds: new Set<DriverAssociationMatch>() };
    const label = [mezzo.targa, mezzo.marcaModello || null].filter(Boolean).join(" - ");
    if (label && !current.labels.includes(label)) {
      current.labels.push(label);
    }
    current.kinds.add(matchKind);
    map.set(match.id, current);
  });

  return new Map(
    Array.from(map.entries()).map(([id, value]) => [
      id,
      {
        count: value.labels.length,
        preview: value.labels.slice(0, 3),
      },
    ]),
  );
}

function computeLookupScore(candidate: InternalAiDriverLookupCandidate, query: string): number {
  const normalizedQuery = normalizeInternalAiDriverIdentityName(query);
  const badgeQuery = normalizeInternalAiDriverIdentityBadge(query);

  if (!normalizedQuery && !badgeQuery) return 0;

  const name = normalizeInternalAiDriverIdentityName(candidate.nomeCompleto);
  const badge = normalizeInternalAiDriverIdentityBadge(candidate.badge);
  const code = normalizeInternalAiDriverIdentityName(candidate.codice);
  const description = normalizeInternalAiDriverIdentityName(candidate.descrizione);
  const phones = normalizeInternalAiDriverIdentityText(candidate.telefono).replace(/\s+/g, "");
  const queryDigits = query.replace(/\s+/g, "");

  if (badgeQuery && badge && badge === badgeQuery) return 100;
  if (normalizedQuery && name === normalizedQuery) return 95;
  if (normalizedQuery && name.startsWith(normalizedQuery)) return 82;
  if (normalizedQuery && name.includes(normalizedQuery)) return 68;
  if (badgeQuery && badge && badge.startsWith(badgeQuery)) return 62;
  if (normalizedQuery && code.includes(normalizedQuery)) return 38;
  if (normalizedQuery && description.includes(normalizedQuery)) return 25;
  if (queryDigits && phones.includes(queryDigits)) return 20;
  return 0;
}

function buildCandidateBaseFromLookupSnapshot(): Promise<DriverCandidateBase[]> {
  return readNextColleghiSnapshot().then((snapshot) =>
    snapshot.items.map((item) => ({
      id: item.id,
      nomeCompleto: item.nome,
      badge: item.badge,
      telefono: item.telefono ?? item.telefonoPrivato,
      codice: item.codice,
      descrizione: item.descrizione,
      quality: item.quality,
      sourceKey: item.sourceKey,
    })),
  );
}

export function normalizeInternalAiDriverLookupQuery(value: string): string {
  return normalizeInternalAiDriverIdentityText(value);
}

export async function readInternalAiDriverLookupCatalog(): Promise<InternalAiDriverLookupCandidate[]> {
  if (!driverLookupCatalogPromise) {
    driverLookupCatalogPromise = buildCandidateBaseFromLookupSnapshot().then(async (drivers) => {
      const associations = await buildAssociationMap(drivers);
      return drivers
        .map((driver) => {
          const association = associations.get(driver.id) ?? { count: 0, preview: [] };
          return {
            ...driver,
            mezziAssociatiCount: association.count,
            mezziAssociatiPreview: association.preview,
          };
        })
        .sort((left, right) =>
          left.nomeCompleto.localeCompare(right.nomeCompleto, "it", {
            sensitivity: "base",
          }),
        );
    });
  }

  return driverLookupCatalogPromise;
}

export function matchInternalAiDriverLookupCandidates(
  catalog: InternalAiDriverLookupCandidate[],
  query: string,
  limit = 8,
): InternalAiDriverLookupCandidate[] {
  const normalizedQuery = normalizeInternalAiDriverLookupQuery(query);
  if (!normalizedQuery) {
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
      return left.candidate.nomeCompleto.localeCompare(right.candidate.nomeCompleto, "it", {
        sensitivity: "base",
      });
    })
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

export function findInternalAiExactDriverMatch(
  catalog: InternalAiDriverLookupCandidate[],
  query: string,
): InternalAiDriverLookupCandidate | null {
  const normalizedQuery = normalizeInternalAiDriverIdentityName(query);
  const badgeQuery = normalizeInternalAiDriverIdentityBadge(query);
  if (!normalizedQuery && !badgeQuery) return null;

  const badgeMatch =
    catalog.find(
      (candidate) =>
        Boolean(
          badgeQuery &&
            normalizeInternalAiDriverIdentityBadge(candidate.badge) === badgeQuery,
        ),
    ) ?? null;
  if (badgeMatch) {
    return badgeMatch;
  }

  if (!normalizedQuery) {
    return null;
  }

  const exactNameMatches = catalog.filter(
    (candidate) =>
      normalizeInternalAiDriverIdentityName(candidate.nomeCompleto) === normalizedQuery,
  );
  return exactNameMatches.length === 1 ? exactNameMatches[0] : null;
}
