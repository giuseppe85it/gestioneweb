import {
  INTERNAL_AI_UNIVERSAL_ADAPTER_CONTRACTS,
  INTERNAL_AI_UNIVERSAL_UI_HOOKS,
} from "./internalAiUniversalContracts";
import type {
  InternalAiUniversalActionIntent,
  InternalAiUniversalOrchestrationResult,
} from "./internalAiUniversalTypes";

export type InternalAiUniversalChatAugmentation = {
  shouldAugment: boolean;
  assistantAppendix: string | null;
  references: Array<{
    type: "integration_guidance" | "ui_pattern" | "capabilities" | "architecture_doc";
    label: string;
    targa: string | null;
  }>;
  actionIntents: InternalAiUniversalActionIntent[];
};

function buildAdapterLabel(adapterIds: string[]): string[] {
  return adapterIds
    .map((adapterId) => INTERNAL_AI_UNIVERSAL_ADAPTER_CONTRACTS.find((entry) => entry.adapterId === adapterId))
    .filter((entry): entry is (typeof INTERNAL_AI_UNIVERSAL_ADAPTER_CONTRACTS)[number] => Boolean(entry))
    .map((entry) => `${entry.domainCode} ${entry.moduleLabel}`);
}

function buildActionReference(actionIntent: InternalAiUniversalActionIntent) {
  const hook = actionIntent.hookId
    ? INTERNAL_AI_UNIVERSAL_UI_HOOKS.find((entry) => entry.hookId === actionIntent.hookId) ?? null
    : null;

  return {
    type: "ui_pattern" as const,
    label: `Action intent: ${hook?.label ?? actionIntent.label} -> ${actionIntent.path}`,
    targa: null,
  };
}

export function composeInternalAiUniversalSummary(
  result: InternalAiUniversalOrchestrationResult,
): string {
  const resolvedEntities = result.entityResolution.matches
    .slice(0, 4)
    .map((entry) => `${entry.entityKind}: ${entry.matchedLabel ?? entry.normalizedValue}`);
  const adapterLabels = buildAdapterLabel(result.requestResolution.selectedAdapterIds).slice(0, 4);
  const routedDocuments = result.documentRoutes
    .slice(0, 3)
    .map((entry) => `${entry.fileName} -> ${entry.classification} -> ${entry.targetPath}`);
  const handoffLabels = result.handoffPayloads
    .slice(0, 3)
    .map((entry) => `${entry.moduloTarget} (${entry.statoRichiesta})`);
  const inboxLabels = result.documentInboxItems
    .slice(0, 3)
    .map((entry) => `${entry.fileName} -> ${entry.suggestedModuleLabel}`);

  return [
    "Piano universale clone/NEXT:",
    resolvedEntities.length
      ? `- entita rilevate: ${resolvedEntities.join("; ")}`
      : "- entita rilevate: nessuna entita forte, richiesta trattata in modo prudente e multi-modulo",
    adapterLabels.length
      ? `- adapter selezionati: ${adapterLabels.join("; ")}`
      : "- adapter selezionati: gateway universale in fallback prudente",
    result.actionIntents.length
      ? `- action intent: ${result.actionIntents
          .slice(0, 3)
          .map((entry) => `${entry.label} (${entry.path})`)
          .join("; ")}`
      : null,
    handoffLabels.length ? `- handoff standard: ${handoffLabels.join("; ")}` : null,
    routedDocuments.length ? `- routing allegati: ${routedDocuments.join("; ")}` : null,
    inboxLabels.length ? `- inbox documentale: ${inboxLabels.join("; ")}` : null,
    result.requestResolution.explicitConstraints.length
      ? `- vincoli forti: ${result.requestResolution.explicitConstraints.join("; ")}`
      : null,
    `- gate moduli futuri: ${result.conformance.gateStatus}`,
  ]
    .filter((entry): entry is string => Boolean(entry))
    .join("\n");
}

export function buildInternalAiUniversalChatAugmentation(
  result: InternalAiUniversalOrchestrationResult,
): InternalAiUniversalChatAugmentation {
  const shouldAugment =
    result.documentRoutes.length > 0 ||
    result.entityResolution.matches.length > 0 ||
    result.actionIntents.length > 0;

  return {
    shouldAugment,
    assistantAppendix: shouldAugment ? composeInternalAiUniversalSummary(result) : null,
    references: shouldAugment
      ? [
          {
            type: "architecture_doc",
            label: "Dominio rilevato: Sistema universale clone/NEXT",
            targa: null,
          },
          {
            type: "capabilities",
            label: `Capability assorbite: ${result.registry.counts.absorbedAiCapabilities}/${result.registry.counts.aiCapabilities}`,
            targa: null,
          },
          ...result.actionIntents.slice(0, 3).map(buildActionReference),
        ]
      : [],
    actionIntents: result.actionIntents,
  };
}
