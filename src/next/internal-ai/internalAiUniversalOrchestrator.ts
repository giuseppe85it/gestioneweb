import {
  INTERNAL_AI_UNIVERSAL_ADAPTER_CONTRACTS,
  INTERNAL_AI_UNIVERSAL_AI_CAPABILITIES,
  INTERNAL_AI_UNIVERSAL_GAPS,
} from "./internalAiUniversalContracts";
import { readInternalAiUniversalConformanceSummary } from "./internalAiUniversalConformance";
import {
  buildInternalAiUniversalChatAugmentation,
  composeInternalAiUniversalSummary,
  type InternalAiUniversalChatAugmentation,
} from "./internalAiUniversalComposer";
import { routeInternalAiUniversalDocuments } from "./internalAiUniversalDocumentRouter";
import { resolveInternalAiUniversalEntities } from "./internalAiUniversalEntityResolver";
import { buildInternalAiUniversalHandoffs } from "./internalAiUniversalHandoff";
import { readInternalAiUniversalRegistrySnapshot } from "./internalAiUniversalRegistry";
import { resolveInternalAiUniversalRequest } from "./internalAiUniversalRequestResolver";
import type {
  InternalAiUniversalActionIntent,
  InternalAiUniversalOrchestrationInput,
  InternalAiUniversalOrchestrationResult,
} from "./internalAiUniversalTypes";

function dedupeActionIntents(actionIntents: InternalAiUniversalActionIntent[]) {
  const seen = new Set<string>();
  return actionIntents.filter((entry) => {
    const key = [
      entry.type,
      entry.path,
      entry.hookId ?? "no-hook",
      entry.handoff?.handoffId ?? "no-handoff",
    ].join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function mapDocumentRoutesWithHandoffs(
  actionHandoffs: InternalAiUniversalOrchestrationResult["handoffPayloads"],
  documentRoutes: InternalAiUniversalOrchestrationResult["documentRoutes"],
  entityResolution: InternalAiUniversalOrchestrationResult["entityResolution"],
) {
  return documentRoutes.map((route) => {
    const handoffPayload =
      actionHandoffs.find(
        (entry) =>
          entry.attachmentId === route.attachmentId &&
          entry.documentType === route.classification &&
          entry.moduloTarget === route.targetModuleId,
      ) ??
      null;

    return {
      ...route,
      handoffPayload,
      entityCandidateLabels: entityResolution.matches
        .slice(0, 4)
        .map((entry) => `${entry.entityKind}: ${entry.matchedLabel ?? entry.normalizedValue}`),
    };
  });
}

function computeRelevantGaps() {
  return INTERNAL_AI_UNIVERSAL_GAPS.filter((gap) => {
    if (gap.gapId === "gap.live-read") {
      return true;
    }

    return false;
  });
}

export async function orchestrateInternalAiUniversalRequest(
  input: InternalAiUniversalOrchestrationInput,
): Promise<InternalAiUniversalOrchestrationResult> {
  const registry = await readInternalAiUniversalRegistrySnapshot();
  const entityResolution = await resolveInternalAiUniversalEntities(input);
  const documentRouting = routeInternalAiUniversalDocuments({
    attachments: input.attachments,
    prompt: input.prompt,
  });
  const requestResolution = resolveInternalAiUniversalRequest({
    prompt: input.prompt,
    entityResolution,
    hasAttachments: input.attachments.length > 0,
    documentRoutes: documentRouting.routes,
  });
  const handoffResult = buildInternalAiUniversalHandoffs({
    prompt: input.prompt,
    attachments: input.attachments,
    entityResolution,
    requestResolution,
    documentRoutes: documentRouting.routes,
  });
  const conformance = readInternalAiUniversalConformanceSummary();
  const documentRoutes = mapDocumentRoutesWithHandoffs(
    handoffResult.handoffPayloads,
    documentRouting.routes,
    entityResolution,
  );

  const actionIntents = dedupeActionIntents([
    ...handoffResult.actionIntents,
    ...(requestResolution.primaryActionIntent ? [requestResolution.primaryActionIntent] : []),
  ]);

  const selectedAdapters = INTERNAL_AI_UNIVERSAL_ADAPTER_CONTRACTS.filter((adapter) =>
    requestResolution.selectedAdapterIds.includes(adapter.adapterId),
  );

  const capabilityIds = new Set([
    ...requestResolution.reusableCapabilityIds,
    ...selectedAdapters.flatMap((adapter) => adapter.reusableCapabilityIds),
    ...documentRoutes.flatMap((entry) => (entry.targetCapabilityId ? [entry.targetCapabilityId] : [])),
    ...handoffResult.handoffPayloads.flatMap((entry) =>
      entry.capabilityRiutilizzata ? [entry.capabilityRiutilizzata] : [],
    ),
  ]);

  const activeCapabilities = INTERNAL_AI_UNIVERSAL_AI_CAPABILITIES.filter((capability) =>
    capabilityIds.has(capability.capabilityId),
  );

  const uncoveredGaps = computeRelevantGaps();

  const result: InternalAiUniversalOrchestrationResult = {
    generatedAt: new Date().toISOString(),
    registry,
    entityResolution,
    requestResolution,
    documentRoutes,
    actionIntents,
    handoffPayloads: handoffResult.handoffPayloads,
    documentInboxItems: handoffResult.documentInboxItems,
    selectedAdapters,
    activeCapabilities,
    gaps: uncoveredGaps,
    coverage: {
      fullyCoveredAdapters: selectedAdapters.filter((entry) => entry.coverageStatus === "assorbito")
        .length,
      partialAdapters: selectedAdapters.filter((entry) => entry.coverageStatus === "parziale").length,
      uncoveredGaps: uncoveredGaps.length,
      trustLabel:
        selectedAdapters.some((entry) => entry.trustLevel === "prudente")
          ? "Prudente"
          : selectedAdapters.some((entry) => entry.trustLevel === "media")
            ? "Media"
            : "Alta",
      readyHandoffs: handoffResult.handoffPayloads.filter((entry) =>
        ["pronto_handoff", "pronto_prefill"].includes(entry.statoRichiesta),
      ).length,
      inboxItems: handoffResult.documentInboxItems.length,
    },
    conformance,
    composerText: "",
  };

  result.composerText = composeInternalAiUniversalSummary(result);
  return result;
}

export async function buildInternalAiUniversalChatAugmentationFromInput(
  input: InternalAiUniversalOrchestrationInput,
): Promise<InternalAiUniversalChatAugmentation> {
  const orchestration = await orchestrateInternalAiUniversalRequest(input);
  return buildInternalAiUniversalChatAugmentation(orchestration);
}
