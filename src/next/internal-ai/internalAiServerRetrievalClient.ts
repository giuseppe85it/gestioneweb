import type { InternalAiServerAdapterResponseEnvelope } from "../../../backend/internal-ai/src/internalAiServerPersistenceContracts";
import { INTERNAL_AI_SERVER_ADAPTER_PORT } from "../../../backend/internal-ai/src/internalAiServerPersistenceContracts";
import {
  INTERNAL_AI_SERVER_RETRIEVAL_ROUTES,
  type InternalAiServerRetrievalReadRequestBody,
  type InternalAiServerRetrievalReadResponseData,
  type InternalAiServerVehicleContextSnapshot,
  type InternalAiServerVehicleDossierRecord,
} from "../../../backend/internal-ai/src/internalAiServerRetrievalContracts";
import { readNextDossierMezzoCompositeSnapshot } from "../domain/nextDossierMezzoDomain";
import { readNextLibrettiExportSnapshot } from "../domain/nextLibrettiExportDomain";
import { readNextAnagraficheFlottaSnapshot, normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";

export type InternalAiServerVehicleContextReadResult =
  | {
      status: "ready";
      message: string;
      payload: InternalAiServerRetrievalReadResponseData;
    }
  | {
      status: "not_found" | "not_enabled";
      message: string;
      payload: InternalAiServerRetrievalReadResponseData | null;
    };

export type InternalAiServerVehicleDossierReadResult =
  | {
      status: "ready";
      message: string;
      payload: InternalAiServerRetrievalReadResponseData;
    }
  | {
      status: "not_found" | "not_enabled";
      message: string;
      payload: InternalAiServerRetrievalReadResponseData | null;
    };

let vehicleContextSeeded = false;
let vehicleContextSeedPromise: Promise<boolean> | null = null;
const vehicleDossierSeededByTarga = new Set<string>();
const vehicleDossierSeedPromiseByTarga = new Map<string, Promise<SeedResult>>();

type SeedResult =
  | {
      status: "ready";
      message: string;
    }
  | {
      status: "not_found" | "not_enabled";
      message: string;
    };

function getConfiguredBaseUrl(): string | null {
  const configured = import.meta.env.VITE_INTERNAL_AI_BACKEND_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/g, "");
  }

  if (typeof window === "undefined") {
    return null;
  }

  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `http://127.0.0.1:${INTERNAL_AI_SERVER_ADAPTER_PORT}`;
  }

  return null;
}

async function postToServer<TData>(
  path: string,
  body: Record<string, unknown>,
): Promise<InternalAiServerAdapterResponseEnvelope<TData> | null> {
  const baseUrl = getConfiguredBaseUrl();
  if (!baseUrl) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(body),
    });
    const rawJson = await response.json().catch(() => null);

    if (!rawJson || typeof rawJson !== "object") {
      return null;
    }

    return rawJson as InternalAiServerAdapterResponseEnvelope<TData>;
  } catch {
    return null;
  }
}

function buildRequestId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function buildVehicleContextSnapshot(): Promise<InternalAiServerVehicleContextSnapshot> {
  const [flottaSnapshot, librettiSnapshot] = await Promise.all([
    readNextAnagraficheFlottaSnapshot(),
    readNextLibrettiExportSnapshot(),
  ]);
  const librettoStoragePathByTarga = new Map(
    librettiSnapshot.items.map((entry) => [entry.targa, entry.librettoStoragePath ?? null]),
  );

  return {
    version: 1,
    sourceMode: "clone_seeded_readonly_snapshot",
    domainCode: "D01",
    activeReadOnlyDataset: "@mezzi_aziendali",
    fileAvailabilityDataset: librettiSnapshot.activeReadOnlyDataset,
    seededAt: new Date().toISOString(),
    counts: {
      totalVehicles: flottaSnapshot.items.length,
      withLibrettoUrl: flottaSnapshot.items.filter((item) => Boolean(item.librettoUrl)).length,
      withLibrettoStoragePath: librettiSnapshot.items.filter((item) => Boolean(item.librettoStoragePath))
        .length,
    },
    flottaLimitations: [
      ...flottaSnapshot.limitations,
      "Snapshot seedato dal clone NEXT su layer D01 gia validato, senza lettura diretta Firestore lato server.",
    ],
    fileAvailabilityLimitations: [
      ...librettiSnapshot.limitations,
      "La copertura file libretto server-side deriva dal seed clone-safe, non da download o upload business.",
    ],
    notes: [
      "Primo retrieval server-side controllato: dominio mezzo-centrico D01 soltanto.",
      "Snapshot read-only persistito nel contenitore IA dedicato e separato dai dataset business.",
      "Nessun backend legacy, provider reale o segreto viene attivato da questo seed.",
    ],
    items: flottaSnapshot.items.map((item) => ({
      ...item,
      librettoStoragePath: librettoStoragePathByTarga.get(item.targa) ?? null,
    })),
  };
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim()))));
}

function collectVehicleDossierSourceDatasetLabels(
  record: NonNullable<Awaited<ReturnType<typeof readNextDossierMezzoCompositeSnapshot>>>,
): string[] {
  const datasets: Array<string | null> = [record.mezzo.sourceKey];

  if (record.lavori.status === "success") {
    datasets.push("@lavori");
  }

  if (record.materialiMovimenti.status === "success") {
    datasets.push("@materialiconsegnati");
  }

  if (record.maintenance.status === "success") {
    datasets.push("@manutenzioni");
  }

  if (record.refuels.status === "success") {
    datasets.push("@rifornimenti", "@rifornimenti_autisti_tmp");
  }

  if (record.documentCosts.status === "success") {
    datasets.push("@costiMezzo");
  }

  if (record.procurementPerimeter.status === "success") {
    datasets.push("@preventivi", "@preventivi_approvazioni");
  }

  if (record.analisiEconomica.status === "success") {
    datasets.push("@analisi_economica_mezzi");
  }

  return uniqueStrings(datasets);
}

function collectVehicleDossierLimitations(
  record: NonNullable<Awaited<ReturnType<typeof readNextDossierMezzoCompositeSnapshot>>>,
): string[] {
  return uniqueStrings([
    ...record.overview.technicalLimitations,
    ...record.overview.refuelLimitations,
    ...record.overview.documentCostLimitations,
    ...record.overview.analysisLimitations,
    ...record.overview.procurementLimitations,
    "Snapshot Dossier seedata dal clone NEXT e persistita nel backend IA separato, non da una lettura Firestore/Storage business diretta lato server.",
  ]).slice(0, 18);
}

async function buildVehicleDossierRecord(
  rawTarga: string,
): Promise<InternalAiServerVehicleDossierRecord | null> {
  const normalizedTarga = normalizeNextMezzoTarga(rawTarga);
  if (!normalizedTarga) {
    return null;
  }

  const snapshot = await readNextDossierMezzoCompositeSnapshot(normalizedTarga);
  if (!snapshot) {
    return null;
  }

  return {
    targa: snapshot.mezzo.targa,
    seededAt: new Date().toISOString(),
    sourceMode: "clone_seeded_vehicle_dossier_snapshot",
    snapshot,
    sourceDatasetLabels: collectVehicleDossierSourceDatasetLabels(snapshot),
    limitations: collectVehicleDossierLimitations(snapshot),
  };
}

async function ensureInternalAiServerVehicleContextSeeded(): Promise<boolean> {
  if (vehicleContextSeeded) {
    return true;
  }

  if (vehicleContextSeedPromise) {
    return vehicleContextSeedPromise;
  }

  vehicleContextSeedPromise = (async () => {
    const baseUrl = getConfiguredBaseUrl();
    if (!baseUrl) {
      return false;
    }

    const snapshot = await buildVehicleContextSnapshot();
    const body: InternalAiServerRetrievalReadRequestBody = {
      operation: "seed_vehicle_context_snapshot",
      actorId: "next-ia-interna",
      requestId: buildRequestId("retrieval-seed"),
      snapshot,
    };
    const response = await postToServer<InternalAiServerRetrievalReadResponseData>(
      INTERNAL_AI_SERVER_RETRIEVAL_ROUTES.read,
      body,
    );
    const seeded = Boolean(response?.ok && response.endpointId === "retrieval.read");

    if (seeded) {
      vehicleContextSeeded = true;
    }

    return seeded;
  })().finally(() => {
    vehicleContextSeedPromise = null;
  });

  return vehicleContextSeedPromise;
}

async function ensureInternalAiServerVehicleDossierSeeded(rawTarga: string): Promise<SeedResult> {
  const normalizedTarga = normalizeNextMezzoTarga(rawTarga);
  if (!normalizedTarga) {
    return {
      status: "not_found",
      message: "Il Dossier mezzo server-side richiede una targa valida.",
    };
  }

  if (vehicleDossierSeededByTarga.has(normalizedTarga)) {
    return {
      status: "ready",
      message: `Snapshot Dossier ${normalizedTarga} gia disponibile nel backend IA separato.`,
    };
  }

  const pendingPromise = vehicleDossierSeedPromiseByTarga.get(normalizedTarga);
  if (pendingPromise) {
    return pendingPromise;
  }

  const seedPromise = (async (): Promise<SeedResult> => {
    const baseUrl = getConfiguredBaseUrl();
    if (!baseUrl) {
      return {
        status: "not_enabled",
        message:
          "Adapter server-side non configurato nel browser corrente: resta attivo il fallback locale clone-safe.",
      };
    }

    const snapshot = await buildVehicleDossierRecord(normalizedTarga);
    if (!snapshot) {
      return {
        status: "not_found",
        message: `Nessun Dossier mezzo clone-safe disponibile per la targa ${normalizedTarga}.`,
      };
    }

    const body: InternalAiServerRetrievalReadRequestBody = {
      operation: "seed_vehicle_dossier_snapshot",
      actorId: "next-ia-interna",
      requestId: buildRequestId("retrieval-dossier-seed"),
      snapshot,
    };
    const response = await postToServer<InternalAiServerRetrievalReadResponseData>(
      INTERNAL_AI_SERVER_RETRIEVAL_ROUTES.read,
      body,
    );

    if (response?.ok && response.endpointId === "retrieval.read") {
      vehicleDossierSeededByTarga.add(normalizedTarga);
      return {
        status: "ready",
        message: response.message,
      };
    }

    return {
      status: "not_enabled",
      message:
        response?.message ??
        "Impossibile seedare lo snapshot Dossier sul backend IA separato: resta attivo il fallback locale clone-safe.",
    };
  })().finally(() => {
    vehicleDossierSeedPromiseByTarga.delete(normalizedTarga);
  });

  vehicleDossierSeedPromiseByTarga.set(normalizedTarga, seedPromise);
  return seedPromise;
}

export async function readInternalAiServerVehicleContextByTarga(
  rawTarga: string,
): Promise<InternalAiServerVehicleContextReadResult> {
  const baseUrl = getConfiguredBaseUrl();
  if (!baseUrl) {
    return {
      status: "not_enabled",
      message:
        "Adapter server-side non configurato nel browser corrente: resta attivo il fallback locale clone-safe.",
      payload: null,
    };
  }

  const seeded = await ensureInternalAiServerVehicleContextSeeded();
  if (!seeded) {
    return {
      status: "not_enabled",
      message:
        "Snapshot read-only D01 non disponibile sul backend IA separato: resta attivo il fallback locale clone-safe.",
      payload: null,
    };
  }

  const body: InternalAiServerRetrievalReadRequestBody = {
    operation: "read_vehicle_context_by_targa",
    actorId: "next-ia-interna",
    requestId: buildRequestId("retrieval-read"),
    rawTarga,
  };
  const response = await postToServer<InternalAiServerRetrievalReadResponseData>(
    INTERNAL_AI_SERVER_RETRIEVAL_ROUTES.read,
    body,
  );

  if (!response || response.endpointId !== "retrieval.read") {
    return {
      status: "not_enabled",
      message:
        "Endpoint retrieval.read non raggiungibile sull'adapter server-side: resta attivo il fallback locale clone-safe.",
      payload: null,
    };
  }

  if (!response.ok) {
    return {
      status: response.status === "not_found" ? "not_found" : "not_enabled",
      message: response.message,
      payload: null,
    };
  }

  if (response.data.operation !== "read_vehicle_context_by_targa") {
    return {
      status: "not_enabled",
      message:
        "Risposta inattesa dal retrieval server-side: resta attivo il fallback locale clone-safe.",
      payload: null,
    };
  }

  if (!response.data.vehicleContext) {
    return {
      status: "not_found",
      message: response.message,
      payload: response.data,
    };
  }

  return {
    status: "ready",
    message: response.message,
    payload: response.data,
  };
}

export async function readInternalAiServerVehicleDossierByTarga(
  rawTarga: string,
): Promise<InternalAiServerVehicleDossierReadResult> {
  const baseUrl = getConfiguredBaseUrl();
  if (!baseUrl) {
    return {
      status: "not_enabled",
      message:
        "Adapter server-side non configurato nel browser corrente: resta attivo il fallback locale clone-safe.",
      payload: null,
    };
  }

  const seedResult = await ensureInternalAiServerVehicleDossierSeeded(rawTarga);
  if (seedResult.status !== "ready") {
    return {
      status: seedResult.status,
      message: seedResult.message,
      payload: null,
    };
  }

  const body: InternalAiServerRetrievalReadRequestBody = {
    operation: "read_vehicle_dossier_by_targa",
    actorId: "next-ia-interna",
    requestId: buildRequestId("retrieval-dossier-read"),
    rawTarga,
  };
  const response = await postToServer<InternalAiServerRetrievalReadResponseData>(
    INTERNAL_AI_SERVER_RETRIEVAL_ROUTES.read,
    body,
  );

  if (!response || response.endpointId !== "retrieval.read") {
    return {
      status: "not_enabled",
      message:
        "Endpoint retrieval.read non raggiungibile sull'adapter server-side: resta attivo il fallback locale clone-safe.",
      payload: null,
    };
  }

  if (!response.ok) {
    return {
      status: response.status === "not_found" ? "not_found" : "not_enabled",
      message: response.message,
      payload: null,
    };
  }

  if (response.data.operation !== "read_vehicle_dossier_by_targa") {
    return {
      status: "not_enabled",
      message:
        "Risposta inattesa dal retrieval server-side Dossier: resta attivo il fallback locale clone-safe.",
      payload: null,
    };
  }

  if (!response.data.vehicleDossier) {
    return {
      status: "not_found",
      message: response.message,
      payload: response.data,
    };
  }

  return {
    status: "ready",
    message: response.message,
    payload: response.data,
  };
}
