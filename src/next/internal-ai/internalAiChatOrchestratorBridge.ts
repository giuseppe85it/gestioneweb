import {
  runInternalAiChatTurn,
  type InternalAiChatTurnResult,
} from "./internalAiChatOrchestrator";
import {
  hasInternalAiServerChatAdapterCandidate,
  runInternalAiServerControlledChat,
} from "./internalAiServerChatClient";
import { buildInternalAiUniversalChatAugmentation } from "./internalAiUniversalComposer";
import { orchestrateInternalAiUniversalRequest } from "./internalAiUniversalOrchestrator";
import { syncInternalAiUniversalRequestsRepository } from "./internalAiUniversalRequestsRepository";
import type {
  InternalAiChatAttachment,
  InternalAiChatMemoryHints,
  InternalAiReportPeriodInput,
  InternalAiReportType,
} from "./internalAiTypes";

const UNIFIED_ENGINE_REFERENCE = "Motore: Unified Intelligence Engine";

export type InternalAiChatOrchestratorTransport =
  | "server_http_provider"
  | "frontend_fallback";

export type InternalAiChatOrchestratorBridgeResult = {
  transport: InternalAiChatOrchestratorTransport;
  transportMessage: string;
  backendStatus:
    | "ok"
    | "not_enabled"
    | "not_found"
    | "validation_error"
    | "provider_not_configured"
    | "upstream_error";
  result: InternalAiChatTurnResult;
};

function buildLocalTurnReportContext(
  result: InternalAiChatTurnResult,
):
  | {
      status: "ready";
      reportType: InternalAiReportType;
      targetLabel: string;
      periodLabel: string;
      sourceLabels: string[];
      sections: { title: string; summary: string; status: string }[];
      missingData: string[];
    }
  | {
      status: "invalid_query" | "not_found";
      message: string;
    }
  | null {
  if (!result.report) {
    return null;
  }

  if (result.report.status === "ready") {
    const preview = result.report.preview;
    return {
      status: "ready",
      reportType: preview.reportType,
      targetLabel: preview.targetLabel,
      periodLabel: preview.periodContext.label,
      sourceLabels: preview.sources.flatMap((source) => source.datasetLabels ?? []).slice(0, 8),
      sections: preview.sections.slice(0, 5).map((section) => ({
        title: section.title,
        summary: section.summary,
        status: section.status,
      })),
      missingData: preview.missingData.slice(0, 6),
    };
  }

  if (result.report.status === "invalid_query" || result.report.status === "not_found") {
    return {
      status: result.report.status,
      message: result.report.message,
    };
  }

  return null;
}

function mergeServerChatResult(
  localResult: InternalAiChatTurnResult,
  serverResult: InternalAiChatTurnResult,
): InternalAiChatTurnResult {
  if (
    localResult.references.some((reference) =>
      reference.label.toLowerCase().includes(UNIFIED_ENGINE_REFERENCE.toLowerCase()),
    )
  ) {
    return {
      ...localResult,
      report: localResult.report ?? serverResult.report,
    };
  }

  return {
    ...localResult,
    intent: serverResult.intent,
    status: serverResult.status,
    assistantText: serverResult.assistantText,
    references: serverResult.references,
    report: localResult.report ?? serverResult.report,
  };
}

function applyUniversalAugmentation(
  result: InternalAiChatTurnResult,
  augmentation: ReturnType<typeof buildInternalAiUniversalChatAugmentation>,
): InternalAiChatTurnResult {
  if (!augmentation.shouldAugment) {
    return result;
  }

  const appendix = augmentation.assistantAppendix?.trim();
  const assistantText = appendix
    ? `${result.assistantText.trim()}\n\n${appendix}`.trim()
    : result.assistantText;

  const references = [
    ...result.references,
    ...augmentation.references.filter(
      (entry) =>
        !result.references.some(
          (reference) =>
            reference.type === entry.type &&
            reference.label === entry.label &&
            reference.targa === entry.targa,
        ),
    ),
  ];

  return {
    ...result,
    assistantText,
    references,
  };
}

export async function runInternalAiChatTurnThroughBackend(
  prompt: string,
  fallbackPeriodInput?: InternalAiReportPeriodInput,
  options?: {
    attachments?: InternalAiChatAttachment[];
    memoryHints?: InternalAiChatMemoryHints;
  },
): Promise<InternalAiChatOrchestratorBridgeResult> {
  const localResult = await runInternalAiChatTurn(prompt, fallbackPeriodInput);
  const universalOrchestration = await orchestrateInternalAiUniversalRequest({
    prompt,
    attachments: options?.attachments ?? [],
  });
  syncInternalAiUniversalRequestsRepository({
    handoffs: universalOrchestration.handoffPayloads,
    inboxItems: universalOrchestration.documentInboxItems,
  });
  const universalAugmentation = buildInternalAiUniversalChatAugmentation(universalOrchestration);

  if (!hasInternalAiServerChatAdapterCandidate()) {
    return {
      transport: "frontend_fallback",
      transportMessage:
        "Adapter server-side non configurato nel browser corrente. Attivato fallback locale clone-safe della chat interna.",
      backendStatus: "not_enabled",
      result: applyUniversalAugmentation(localResult, universalAugmentation),
    };
  }

  const serverResponse = await runInternalAiServerControlledChat({
    operation: "run_controlled_chat",
    prompt,
    periodInput: fallbackPeriodInput,
    attachments: options?.attachments,
    memoryHints: options?.memoryHints,
    localTurn: {
      intent: localResult.intent,
      status: localResult.status,
      assistantText: localResult.assistantText,
      references: localResult.references,
      reportContext: buildLocalTurnReportContext(localResult),
    },
  });

  if (!serverResponse) {
    return {
      transport: "frontend_fallback",
      transportMessage:
        "Endpoint chat server-side non raggiungibile. Attivato fallback locale clone-safe della chat interna.",
      backendStatus: "not_enabled",
      result: applyUniversalAugmentation(localResult, universalAugmentation),
    };
  }

  if (!serverResponse.ok) {
    return {
      transport: "frontend_fallback",
      transportMessage:
        `Provider o adapter chat non disponibile (${serverResponse.message}). ` +
        "Attivato fallback locale clone-safe della chat interna.",
      backendStatus: serverResponse.status,
      result: applyUniversalAugmentation(localResult, universalAugmentation),
    };
  }

  return {
    transport: "server_http_provider",
    transportMessage: serverResponse.message,
    backendStatus: "ok",
    result: applyUniversalAugmentation(
      mergeServerChatResult(localResult, serverResponse.payload.result),
      universalAugmentation,
    ),
  };
}
