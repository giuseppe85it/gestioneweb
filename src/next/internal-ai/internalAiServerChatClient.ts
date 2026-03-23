import type {
  InternalAiServerAdapterResponseEnvelope,
  InternalAiServerOrchestratorChatRequestBody,
  InternalAiServerOrchestratorChatResponseData,
} from "../../../backend/internal-ai/src/internalAiServerPersistenceContracts";
import {
  INTERNAL_AI_SERVER_ADAPTER_PORT,
  INTERNAL_AI_SERVER_ADAPTER_ROUTES,
} from "../../../backend/internal-ai/src/internalAiServerPersistenceContracts";

export type InternalAiServerChatTransport = "server_http_provider" | "frontend_fallback";

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

export function hasInternalAiServerChatAdapterCandidate(): boolean {
  return Boolean(getConfiguredBaseUrl());
}

export async function runInternalAiServerControlledChat(
  requestBody: Omit<InternalAiServerOrchestratorChatRequestBody, "requestId" | "actorId">,
): Promise<
  | {
      ok: true;
      payload: InternalAiServerOrchestratorChatResponseData;
      message: string;
    }
  | {
      ok: false;
      message: string;
      status:
        | "not_enabled"
        | "validation_error"
        | "provider_not_configured"
        | "upstream_error"
        | "not_found";
    }
  | null
> {
  const response = await postToServer<InternalAiServerOrchestratorChatResponseData>(
    INTERNAL_AI_SERVER_ADAPTER_ROUTES.orchestratorChat,
    {
      ...requestBody,
      actorId: "next-ia-interna",
      requestId: buildRequestId("chat-server"),
    },
  );

  if (!response || response.endpointId !== "orchestrator.chat") {
    return null;
  }

  if (!response.ok) {
    return {
      ok: false,
      message: response.message,
      status:
        response.status === "validation_error" ||
        response.status === "provider_not_configured" ||
        response.status === "upstream_error" ||
        response.status === "not_found"
          ? response.status
          : "not_enabled",
    };
  }

  return {
    ok: true,
    payload: response.data,
    message: response.message,
  };
}
