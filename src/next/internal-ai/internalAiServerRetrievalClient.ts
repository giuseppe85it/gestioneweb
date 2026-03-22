import type { InternalAiServerAdapterResponseEnvelope } from "../../../backend/internal-ai/src/internalAiServerPersistenceContracts";
import { INTERNAL_AI_SERVER_ADAPTER_PORT } from "../../../backend/internal-ai/src/internalAiServerPersistenceContracts";
import {
  INTERNAL_AI_SERVER_RETRIEVAL_ROUTES,
  type InternalAiServerRetrievalReadRequestBody,
  type InternalAiServerRetrievalReadResponseData,
  type InternalAiServerVehicleContextSnapshot,
} from "../../../backend/internal-ai/src/internalAiServerRetrievalContracts";
import { readNextLibrettiExportSnapshot } from "../domain/nextLibrettiExportDomain";
import { readNextAnagraficheFlottaSnapshot } from "../nextAnagraficheFlottaDomain";

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

let vehicleContextSeeded = false;
let vehicleContextSeedPromise: Promise<boolean> | null = null;

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
