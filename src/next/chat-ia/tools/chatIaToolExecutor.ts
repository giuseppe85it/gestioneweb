import { getToolByName } from "./chatIaToolRegistry";
import type {
  ChatIaToolCall,
  ChatIaToolExecutionContext,
  ChatIaToolResult,
} from "./chatIaToolTypes";

const DEFAULT_TOOL_TIMEOUT_MS = 25000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("Timeout esecuzione tool Chat IA."));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function normalizeErrorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : "Errore durante l'esecuzione del tool.";
}

export async function executeToolCall(
  call: ChatIaToolCall,
  context?: Partial<ChatIaToolExecutionContext>,
): Promise<ChatIaToolResult> {
  const tool = getToolByName(call.name);
  if (!tool) {
    return {
      toolCallId: call.id,
      name: call.name,
      ok: false,
      error: {
        code: "not_found",
        message: "Tool non disponibile nel client NEXT.",
      },
    };
  }

  const executionContext: ChatIaToolExecutionContext = {
    requestId: context?.requestId ?? call.id,
    sessionId: context?.sessionId ?? "chat-ia-sessione-locale",
    prompt: context?.prompt ?? "",
    nowIso: context?.nowIso ?? new Date().toISOString(),
  };

  try {
    const data = await withTimeout(
      tool.run(call.arguments, executionContext),
      tool.timeoutMs ?? DEFAULT_TOOL_TIMEOUT_MS,
    );

    return {
      toolCallId: call.id,
      name: call.name,
      ok: true,
      data,
      outputKind: tool.outputKindHint,
    };
  } catch (error) {
    const message = normalizeErrorMessage(error);
    return {
      toolCallId: call.id,
      name: call.name,
      ok: false,
      error: {
        code: message.toLowerCase().includes("timeout") ? "timeout" : "tool_error",
        message,
      },
      outputKind: tool.outputKindHint,
    };
  }
}
