import type { InternalAiServerAdapterResponseEnvelope } from "../../../backend/internal-ai/src/internalAiServerPersistenceContracts";
import { INTERNAL_AI_SERVER_ADAPTER_PORT } from "../../../backend/internal-ai/src/internalAiServerPersistenceContracts";
import {
  INTERNAL_AI_SERVER_RETRIEVAL_ROUTES,
  type InternalAiServerRepoUnderstandingSnapshot,
  type InternalAiServerRetrievalReadRequestBody,
  type InternalAiServerRetrievalReadResponseData,
} from "../../../backend/internal-ai/src/internalAiServerRetrievalContracts";

export type { InternalAiServerRepoUnderstandingSnapshot };

export function getInternalAiServerAdapterBaseUrl(): string | null {
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

export function buildInternalAiRuntimeObserverAssetUrl(
  fileName: string | null | undefined,
): string | null {
  if (!fileName) {
    return null;
  }

  const baseUrl = getInternalAiServerAdapterBaseUrl();
  if (!baseUrl) {
    return null;
  }

  return `${baseUrl}/internal-ai-backend/runtime-observer/assets/${encodeURIComponent(fileName)}`;
}

async function postToServer<TData>(
  path: string,
  body: Record<string, unknown>,
): Promise<InternalAiServerAdapterResponseEnvelope<TData> | null> {
  const baseUrl = getInternalAiServerAdapterBaseUrl();
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

export async function readInternalAiServerRepoUnderstandingSnapshot(
  refresh = false,
): Promise<
  | {
      status: "ready";
      message: string;
      payload: InternalAiServerRepoUnderstandingSnapshot;
    }
  | {
      status: "not_enabled" | "error";
      message: string;
      payload: null;
    }
> {
  const baseUrl = getInternalAiServerAdapterBaseUrl();
  if (!baseUrl) {
    return {
      status: "not_enabled",
      message:
        "Adapter server-side non configurato nel browser corrente: resta attivo il fallback locale clone-safe.",
      payload: null,
    };
  }

  const body: InternalAiServerRetrievalReadRequestBody = {
    operation: "read_repo_understanding_snapshot",
    actorId: "next-ia-interna",
    requestId: buildRequestId("repo-understanding"),
    refresh,
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

  if (!response.ok || response.data.operation !== "read_repo_understanding_snapshot") {
    return {
      status: "error",
      message: response.message,
      payload: null,
    };
  }

  if (!response.data.repoUnderstanding) {
    return {
      status: "error",
      message:
        "Lo snapshot controllato repo/UI non contiene ancora dati utili lato server.",
      payload: null,
    };
  }

  return {
    status: "ready",
    message: response.message,
    payload: response.data.repoUnderstanding,
  };
}
