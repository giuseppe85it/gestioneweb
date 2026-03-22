import type {
  InternalAiServerAdapterResponseEnvelope,
  InternalAiServerArtifactRepositoryState,
  InternalAiServerArtifactsRepositoryResponseData,
  InternalAiServerMemoryRepositoryResponseData,
  InternalAiServerTrackingRepositoryState,
} from "../../../backend/internal-ai/src/internalAiServerPersistenceContracts";
import { INTERNAL_AI_SERVER_ADAPTER_PORT, INTERNAL_AI_SERVER_ADAPTER_ROUTES } from "../../../backend/internal-ai/src/internalAiServerPersistenceContracts";

export type {
  InternalAiServerArtifactRepositoryState,
  InternalAiServerTrackingRepositoryState,
} from "../../../backend/internal-ai/src/internalAiServerPersistenceContracts";

export type InternalAiServerPersistenceTransport =
  | "server_http_adapter"
  | "frontend_fallback";

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

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as InternalAiServerAdapterResponseEnvelope<TData>;
  } catch {
    return null;
  }
}

export function hasInternalAiServerAdapterCandidate(): boolean {
  return Boolean(getConfiguredBaseUrl());
}

export async function readInternalAiServerArtifactRepositorySnapshot(): Promise<InternalAiServerArtifactRepositoryState | null> {
  const response = await postToServer<InternalAiServerArtifactsRepositoryResponseData>(
    INTERNAL_AI_SERVER_ADAPTER_ROUTES.artifactsRepository,
    {
      operation: "read_snapshot",
      actorId: "next-ia-interna",
      requestId: `artifact-read-${Date.now().toString(36)}`,
    },
  );

  if (!response?.ok || response.endpointId !== "artifacts.repository") {
    return null;
  }

  return response.data.repositoryState;
}

export async function writeInternalAiServerArtifactRepositorySnapshot(
  repositoryState: InternalAiServerArtifactRepositoryState,
): Promise<boolean> {
  const response = await postToServer<InternalAiServerArtifactsRepositoryResponseData>(
    INTERNAL_AI_SERVER_ADAPTER_ROUTES.artifactsRepository,
    {
      operation: "replace_snapshot",
      actorId: "next-ia-interna",
      requestId: `artifact-write-${Date.now().toString(36)}`,
      repositoryState,
    },
  );

  return Boolean(response?.ok && response.endpointId === "artifacts.repository");
}

export async function readInternalAiServerTrackingSummary(): Promise<InternalAiServerTrackingRepositoryState | null> {
  const response = await postToServer<InternalAiServerMemoryRepositoryResponseData>(
    INTERNAL_AI_SERVER_ADAPTER_ROUTES.memoryRepository,
    {
      operation: "read_tracking_summary",
      actorId: "next-ia-interna",
      requestId: `tracking-read-${Date.now().toString(36)}`,
    },
  );

  if (!response?.ok || response.endpointId !== "memory.repository") {
    return null;
  }

  return response.data.trackingState;
}

export async function writeInternalAiServerTrackingSummary(
  trackingState: InternalAiServerTrackingRepositoryState,
): Promise<boolean> {
  const response = await postToServer<InternalAiServerMemoryRepositoryResponseData>(
    INTERNAL_AI_SERVER_ADAPTER_ROUTES.memoryRepository,
    {
      operation: "replace_tracking_summary",
      actorId: "next-ia-interna",
      requestId: `tracking-write-${Date.now().toString(36)}`,
      trackingState,
    },
  );

  return Boolean(response?.ok && response.endpointId === "memory.repository");
}
