import { runInternalAiServerControlledChat } from "../../internal-ai/internalAiServerChatClient";
import { INTERNAL_AI_SERVER_ADAPTER_PORT } from "../../../../backend/internal-ai/src/internalAiServerPersistenceContracts";
import type { InternalAiChatMessageReference } from "../../internal-ai/internalAiTypes";
import { getAllToolDefinitions } from "../tools/chatIaToolRegistry";
import {
  buildZeroInvenzioniErrorMessage,
  validateChatZeroInvenzioniMessage,
} from "../core/catalogValidator";
import type {
  ChatIaMessage,
  ChatIaRunnerResult,
  ChatZeroInvenzioniMessage,
} from "../core/chatIaTypes";
import type { ChatIaToolUseRequest } from "../tools/chatIaToolTypes";

type ChatIaBackendBridgeArgs = {
  prompt: string;
  result: ChatIaRunnerResult;
  timeoutMs?: number;
};

type ChatIaToolUseSessionContext = {
  sessionId?: string;
  actorId?: string;
  previousMessages?: ChatIaMessage[];
  nowIso?: string;
};

export type ChatIaBackendBridgeResult = {
  text: string;
  usedBackend: boolean;
  notice: string | null;
};

type ChatIaToolUseEnvelope = {
  ok: boolean;
  endpointId: string;
  status: string;
  message: string;
  data?: ChatZeroToolUseResponse;
};

type ChatZeroToolUseResponse =
  | {
      mode: "final";
      responseId: string | null;
      model: string;
      finalMessage: ChatZeroInvenzioniMessage;
      usage: unknown;
      costEstimate: unknown;
    }
  | {
      mode: "tool_calls";
      responseId: string | null;
      model: string;
      toolCalls: unknown[];
      usage: unknown;
      costEstimate: unknown;
    };

type ChatIaToolUsePostResult =
  | { kind: "success"; envelope: ChatIaToolUseEnvelope; httpStatus: number }
  | { kind: "missing_base_url" }
  | { kind: "timeout" }
  | { kind: "network_error"; message: string }
  | { kind: "server_error"; httpStatus: number; envelope: ChatIaToolUseEnvelope | null }
  | { kind: "malformed_json"; httpStatus: number };

const CHAT_TOOL_USE_ENDPOINT = "/internal-ai-backend/chat/tool-use";
const BACKEND_TIMEOUT_MS = 45000;

function safeToolUseJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return JSON.stringify({
      serializationError: error instanceof Error ? error.message : String(error),
    });
  }
}

function toolUsePreview(value: unknown, maxLength = 200): string {
  const text = typeof value === "string" ? value : safeToolUseJson(value);
  return text.slice(0, maxLength);
}

function logToolUseBridge(event: string, payload: Record<string, unknown>): void {
  console.log(
    "[chat-tool-use-bridge]",
    safeToolUseJson({
      ts: new Date().toISOString(),
      event,
      ...payload,
    }),
  );
}

function mapLocalStatus(status: ChatIaRunnerResult["status"]): "completed" | "partial" {
  return status === "completed" ? "completed" : "partial";
}

function findTarga(result: ChatIaRunnerResult): string | null {
  return result.entities.find((entity) => entity.kind === "targa")?.value ?? null;
}

function buildReferences(result: ChatIaRunnerResult) {
  const targa = findTarga(result);
  const references: InternalAiChatMessageReference[] = [
    {
      type: "architecture_doc" as const,
      label: `Ossatura Chat IA NEXT - settore ${result.sector}`,
      targa,
    },
    {
      type: "safe_mode_notice" as const,
      label: "Contesto locale gia selezionato dal runner; nessuna scrittura business richiesta.",
      targa,
    },
  ];

  if (result.report) {
    references.push({
      type: "report_preview" as const,
      label: result.report.title,
      targa,
    });
  }

  return references;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), timeoutMs);
    }),
  ]);
}

function getConfiguredToolUseBaseUrl(): string | null {
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

function buildToolUseRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `chat-tool-use-${globalThis.crypto.randomUUID()}`;
  }

  return `chat-tool-use-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildToolUseSessionId(context?: ChatIaToolUseSessionContext): string {
  if (context?.sessionId?.trim()) {
    return context.sessionId.trim();
  }

  return `chat-tool-session-${Date.now().toString(36)}`;
}

function mapHistoryToToolUseMessages(previousMessages: ChatIaMessage[] = []) {
  return previousMessages.slice(-8).map((message) => {
    const content = message.role === "assistente" && message.zeroMessage
      ? safeToolUseJson({
          action: message.zeroMessage.action,
          view: message.zeroMessage.view,
          accompaniment: message.zeroMessage.accompaniment,
        })
      : message.text;

    return {
      role: message.role === "assistente" ? ("assistant" as const) : ("user" as const),
      content,
    };
  });
}

async function postChatToolUseTurn(
  body: ChatIaToolUseRequest,
): Promise<ChatIaToolUsePostResult> {
  const baseUrl = getConfiguredToolUseBaseUrl();
  if (!baseUrl) {
    return { kind: "missing_base_url" };
  }

  try {
    const response = await fetch(`${baseUrl}${CHAT_TOOL_USE_ENDPOINT}`, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(body),
    });
    const rawText = await response.text();
    let rawJson: unknown = null;
    try {
      rawJson = rawText.trim() ? JSON.parse(rawText) as unknown : null;
    } catch {
      return { kind: "malformed_json", httpStatus: response.status };
    }
    const envelope = rawJson && typeof rawJson === "object"
      ? (rawJson as ChatIaToolUseEnvelope)
      : null;
    if (!envelope) {
      return { kind: "malformed_json", httpStatus: response.status };
    }
    if (response.status >= 500) {
      return { kind: "server_error", httpStatus: response.status, envelope };
    }
    return { kind: "success", envelope, httpStatus: response.status };
  } catch (error) {
    return {
      kind: "network_error",
      message: error instanceof Error && error.message.trim()
        ? error.message
        : "Errore rete non specificato.",
    };
  }
}

function withToolUsePostTimeout(
  promise: Promise<ChatIaToolUsePostResult>,
  timeoutMs: number,
): Promise<ChatIaToolUsePostResult> {
  return Promise.race([
    promise,
    new Promise<ChatIaToolUsePostResult>((resolve) => {
      window.setTimeout(() => resolve({ kind: "timeout" }), timeoutMs);
    }),
  ]);
}

function buildTransportFallback(_result: ChatIaToolUsePostResult): ChatZeroInvenzioniMessage {
  return buildZeroInvenzioniErrorMessage();
}

export async function runToolUseConversation(
  prompt: string,
  sessionContext: ChatIaToolUseSessionContext = {},
): Promise<ChatZeroInvenzioniMessage> {
  const trimmedPrompt = prompt.trim();
  const tools = getAllToolDefinitions();
  if (!trimmedPrompt) {
    return buildZeroInvenzioniErrorMessage();
  }

  const requestId = buildToolUseRequestId();
  const sessionId = buildToolUseSessionId(sessionContext);
  const nowIso = sessionContext.nowIso ?? new Date().toISOString();
  const messages: ChatIaToolUseRequest["messages"] = [
    ...mapHistoryToToolUseMessages(sessionContext.previousMessages),
    { role: "user", content: trimmedPrompt },
  ];

  logToolUseBridge("multi_agent_bypass_disabled", {
    requestId,
    sessionId,
    prompt_preview: toolUsePreview(trimmedPrompt, 100),
  });

  logToolUseBridge("request_send", {
    requestId,
    sessionId,
    iteration: 0,
    prompt_preview: toolUsePreview(trimmedPrompt, 100),
    responseId: null,
    tools_count: tools.length,
    tool_results_count: 0,
    nowIso,
  });

  const postResult = await withToolUsePostTimeout(
    postChatToolUseTurn({
      operation: "run_tool_use_turn",
      requestId,
      actorId: sessionContext.actorId ?? "next-chat-ia",
      sessionId,
      iteration: 0,
      prompt: trimmedPrompt,
      messages,
      tools,
      toolResults: [],
      responseId: null,
    }),
    BACKEND_TIMEOUT_MS,
  );

  if (postResult.kind !== "success") {
    logToolUseBridge("request_failed", {
      requestId,
      iteration: 0,
      kind: postResult.kind,
      detail: postResult.kind === "timeout"
        ? "timeout"
        : postResult.kind === "network_error"
          ? postResult.message
          : "backend_or_transport_error",
    });
    return buildTransportFallback(postResult);
  }

  const backendResponse: ChatIaToolUseEnvelope = postResult.envelope;
  logToolUseBridge("response_received", {
    requestId,
    iteration: 0,
    httpStatus: postResult.httpStatus,
    ok: backendResponse.ok,
    status: backendResponse.status,
    mode: backendResponse.data?.mode ?? null,
    responseId: backendResponse.data?.responseId ?? null,
    tool_calls: backendResponse.data?.mode === "tool_calls" ? backendResponse.data.toolCalls.length : 0,
    final_size: backendResponse.data?.mode === "final"
      ? safeToolUseJson(backendResponse.data.finalMessage).length
      : null,
    final_preview: backendResponse.data?.mode === "final"
      ? toolUsePreview(backendResponse.data.finalMessage, 200)
      : null,
  });

  if (!backendResponse.ok || !backendResponse.data || backendResponse.data.mode !== "final") {
    return buildZeroInvenzioniErrorMessage();
  }

  const validation = validateChatZeroInvenzioniMessage(backendResponse.data.finalMessage);
  if (!validation.valid) {
    logToolUseBridge("frontend_catalog_validator_rejected", {
      requestId,
      errors: validation.errors,
    });
  }

  return validation.finalMessage;
}

export async function refineChatIaRunnerResult(
  args: ChatIaBackendBridgeArgs,
): Promise<ChatIaBackendBridgeResult> {
  const response = await withTimeout(
    runInternalAiServerControlledChat({
      operation: "run_controlled_chat",
      prompt: args.prompt,
      attachments: [],
      memoryHints: {
        repoUiRequested: false,
        memoryFreshness: "fresh",
        screenHint: "/next/chat",
        focusKind: args.result.report ? "report" : "general",
        attachmentsCount: 0,
        runtimeObserverObserved: false,
      },
      localTurn: {
        intent: "richiesta_generica",
        status: mapLocalStatus(args.result.status),
        assistantText: args.result.text,
        references: buildReferences(args.result),
        reportContext: null,
      },
    }),
    args.timeoutMs ?? 8000,
  );

  if (!response) {
    return { text: args.result.text, usedBackend: false, notice: null };
  }

  if (!response.ok) {
    return {
      text: args.result.text,
      usedBackend: false,
      notice:
        response.status === "upstream_error"
          ? "Risposta locale: il servizio di rifinitura IA non e' disponibile."
          : null,
    };
  }

  const refinedText = response.payload.result.assistantText.trim();
  return {
    text: refinedText || args.result.text,
    usedBackend: Boolean(refinedText),
    notice: null,
  };
}
