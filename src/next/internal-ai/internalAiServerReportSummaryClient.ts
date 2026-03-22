import type { InternalAiReportPreview } from "./internalAiTypes";
import type {
  InternalAiServerAdapterResponseEnvelope,
  InternalAiServerApprovalsPrepareOperation,
  InternalAiServerApprovalsPrepareResponseData,
  InternalAiServerArtifactsPreviewResponseData,
  InternalAiServerProviderTarget,
  InternalAiServerReportSummaryWorkflow,
} from "../../../backend/internal-ai/src/internalAiServerPersistenceContracts";
import {
  INTERNAL_AI_SERVER_ADAPTER_PORT,
  INTERNAL_AI_SERVER_ADAPTER_ROUTES,
} from "../../../backend/internal-ai/src/internalAiServerPersistenceContracts";

export type { InternalAiServerProviderTarget, InternalAiServerReportSummaryWorkflow };

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

    const payload =
      (await response.json()) as InternalAiServerAdapterResponseEnvelope<TData>;
    return payload;
  } catch {
    return null;
  }
}

function buildRequestId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function hasInternalAiServerReportSummaryAdapterCandidate(): boolean {
  return Boolean(getConfiguredBaseUrl());
}

export async function generateInternalAiServerReportSummaryPreview(
  report: InternalAiReportPreview,
): Promise<{
  ok: true;
  workflow: InternalAiServerReportSummaryWorkflow;
  providerTarget: InternalAiServerProviderTarget;
  traceEntryId: string;
  message: string;
} | {
  ok: false;
  message: string;
} | null> {
  const response = await postToServer<InternalAiServerArtifactsPreviewResponseData>(
    INTERNAL_AI_SERVER_ADAPTER_ROUTES.artifactsPreview,
    {
      operation: "generate_report_summary_preview",
      actorId: "next-ia-interna",
      requestId: buildRequestId("summary-generate"),
      promptLabel: `Sintesi guidata ${report.targetLabel}`,
      report,
    },
  );

  if (
    !response ||
    response.endpointId !== "artifacts.preview"
  ) {
    return null;
  }

  if (!response.ok || response.data.operation !== "generate_report_summary_preview") {
    return {
      ok: false,
      message: response.message,
    };
  }

  return {
    ok: true,
    workflow: response.data.workflow,
    providerTarget: response.data.providerTarget as InternalAiServerProviderTarget,
    traceEntryId: response.data.traceEntryId,
    message: response.message,
  };
}

async function updateWorkflow(
  operation: InternalAiServerApprovalsPrepareOperation,
  workflowId: string,
  note: string,
): Promise<{
  ok: true;
  workflow: InternalAiServerReportSummaryWorkflow;
  traceEntryId: string;
  message: string;
} | {
  ok: false;
  message: string;
} | null> {
  const response = await postToServer<InternalAiServerApprovalsPrepareResponseData>(
    INTERNAL_AI_SERVER_ADAPTER_ROUTES.approvalsPrepare,
    {
      operation,
      actorId: "next-ia-interna",
      requestId: buildRequestId(operation),
      workflowId,
      note,
    },
  );

  if (!response || response.endpointId !== "approvals.prepare") {
    return null;
  }

  if (!response.ok) {
    return {
      ok: false,
      message: response.message,
    };
  }

  return {
    ok: true,
    workflow: response.data.workflow,
    traceEntryId: response.data.traceEntryId,
    message: response.message,
  };
}

export function approveInternalAiServerReportSummaryPreview(
  workflowId: string,
  note = "Approvazione esplicita dal clone IA interno.",
) {
  return updateWorkflow("approve_preview", workflowId, note);
}

export function rejectInternalAiServerReportSummaryPreview(
  workflowId: string,
  note = "Preview respinta dal clone IA interno.",
) {
  return updateWorkflow("reject_preview", workflowId, note);
}

export function rollbackInternalAiServerReportSummaryPreview(
  workflowId: string,
  note = "Rollback richiesto sul solo workflow IA dedicato.",
) {
  return updateWorkflow("rollback_preview", workflowId, note);
}
