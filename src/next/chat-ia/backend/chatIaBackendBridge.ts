import { runInternalAiServerControlledChat } from "../../internal-ai/internalAiServerChatClient";
import type { InternalAiChatMessageReference } from "../../internal-ai/internalAiTypes";
import type { ChatIaRunnerResult } from "../core/chatIaTypes";

type ChatIaBackendBridgeArgs = {
  prompt: string;
  result: ChatIaRunnerResult;
  timeoutMs?: number;
};

export type ChatIaBackendBridgeResult = {
  text: string;
  usedBackend: boolean;
  notice: string | null;
};

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
