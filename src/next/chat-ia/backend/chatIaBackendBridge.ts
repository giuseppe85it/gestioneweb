import { runInternalAiServerControlledChat } from "../../internal-ai/internalAiServerChatClient";
import { INTERNAL_AI_SERVER_ADAPTER_PORT } from "../../../../backend/internal-ai/src/internalAiServerPersistenceContracts";
import type { InternalAiChatMessageReference } from "../../internal-ai/internalAiTypes";
import { executeToolCall } from "../tools/chatIaToolExecutor";
import { getAllToolDefinitions } from "../tools/chatIaToolRegistry";
import type {
  ChatIaAssistantFinalMessage,
  ChatIaMessage,
  ChatIaRunnerResult,
} from "../core/chatIaTypes";
import type {
  ChatIaToolCall,
  ChatIaToolResult,
  ChatIaToolUseRequest,
  ChatIaToolUseResponse,
} from "../tools/chatIaToolTypes";

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
  data?: ChatIaToolUseResponse;
};

const CHAT_TOOL_USE_ENDPOINT = "/internal-ai-backend/chat/tool-use";
const MAX_TOOL_ITERATIONS = 4;
const BACKEND_TIMEOUT_MS = 20000;

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
  return previousMessages.slice(-8).map((message) => ({
    role: message.role === "assistente" ? ("assistant" as const) : ("user" as const),
    content: message.text,
  }));
}

async function postChatToolUseTurn(
  body: ChatIaToolUseRequest,
): Promise<ChatIaToolUseEnvelope | null> {
  const baseUrl = getConfiguredToolUseBaseUrl();
  if (!baseUrl) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}${CHAT_TOOL_USE_ENDPOINT}`, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(body),
    });
    const rawJson = await response.json().catch(() => null);
    return rawJson && typeof rawJson === "object" ? (rawJson as ChatIaToolUseEnvelope) : null;
  } catch {
    return null;
  }
}

function buildToolUseFallbackMessage(text: string, status: "partial" | "failed"): ChatIaAssistantFinalMessage {
  return {
    text,
    status,
    blocks: [{ kind: "text", text }],
    entities: [],
    sources: [],
    notices: [],
  };
}

function appendToolResultsToMessages(
  messages: ChatIaToolUseRequest["messages"],
  results: ChatIaToolResult[],
): ChatIaToolUseRequest["messages"] {
  return [
    ...messages,
    ...results.map((result) => ({
      role: "tool" as const,
      name: result.name,
      toolCallId: result.toolCallId,
      content: JSON.stringify(result),
    })),
  ];
}

export async function runToolUseConversation(
  prompt: string,
  sessionContext: ChatIaToolUseSessionContext = {},
): Promise<ChatIaAssistantFinalMessage> {
  const trimmedPrompt = prompt.trim();
  const tools = getAllToolDefinitions();
  if (!trimmedPrompt) {
    return buildToolUseFallbackMessage("Scrivi una domanda per la chat IA NEXT.", "partial");
  }
  if (tools.length === 0) {
    return buildToolUseFallbackMessage(
      "La chat tool use non ha ancora tool registrati. Usa /next/chat come rete di sicurezza.",
      "partial",
    );
  }

  const requestId = buildToolUseRequestId();
  const sessionId = buildToolUseSessionId(sessionContext);
  const nowIso = sessionContext.nowIso ?? new Date().toISOString();
  let responseId: string | null = null;
  let messages: ChatIaToolUseRequest["messages"] = [
    ...mapHistoryToToolUseMessages(sessionContext.previousMessages),
    { role: "user", content: trimmedPrompt },
  ];
  let toolResults: ChatIaToolResult[] = [];

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
    const backendResponse: ChatIaToolUseEnvelope | null = await withTimeout(
      postChatToolUseTurn({
        operation: "run_tool_use_turn",
        requestId,
        actorId: sessionContext.actorId ?? "next-chat-ia",
        sessionId,
        iteration,
        prompt: trimmedPrompt,
        messages,
        tools,
        toolResults,
        responseId,
      }),
      BACKEND_TIMEOUT_MS,
    );

    if (!backendResponse) {
      return buildToolUseFallbackMessage(
        "La chat tool use non riesce a contattare il backend OpenAI. Usa /next/chat come rete di sicurezza.",
        "partial",
      );
    }

    if (!backendResponse.ok || !backendResponse.data) {
      return buildToolUseFallbackMessage(
        backendResponse.message || "La chat tool use non ha completato la risposta.",
        backendResponse.status === "upstream_error" ? "failed" : "partial",
      );
    }

    if (backendResponse.data.mode === "final") {
      return backendResponse.data.finalMessage;
    }

    responseId = backendResponse.data.responseId;
    toolResults = await Promise.all(
      backendResponse.data.toolCalls.map((call: ChatIaToolCall) =>
        executeToolCall(call, { requestId, sessionId, prompt: trimmedPrompt, nowIso }),
      ),
    );
    messages = appendToolResultsToMessages(messages, toolResults);
  }

  return buildToolUseFallbackMessage(
    "La chat tool use ha raggiunto il limite di iterazioni senza risposta finale.",
    "partial",
  );
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
