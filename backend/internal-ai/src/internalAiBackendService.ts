import {
  INTERNAL_AI_BACKEND_GUARD_RAILS,
  INTERNAL_AI_BACKEND_ROUTE_DEFINITIONS,
  type InternalAiBackendHttpRequest,
  type InternalAiBackendHttpResponse,
  type InternalAiBackendManifest,
} from "./internalAiBackendContracts";
import { dispatchInternalAiBackendRequest } from "./internalAiBackendHandlers";

export type InternalAiBackendService = {
  manifest: InternalAiBackendManifest;
  dispatch: (
    request: InternalAiBackendHttpRequest,
  ) => Promise<InternalAiBackendHttpResponse<Record<string, unknown>>>;
};

export function createInternalAiBackendService(): InternalAiBackendService {
  const manifest: InternalAiBackendManifest = {
    serviceId: "internal-ai-backend-separato",
    repoPathRoot: "backend/internal-ai",
    mode: "mock_safe",
    state: "server_adapter_mock_safe",
    routes: INTERNAL_AI_BACKEND_ROUTE_DEFINITIONS,
    guardRails: INTERNAL_AI_BACKEND_GUARD_RAILS,
    legacyChannelsExplicitlyNotCanonical: [
      "functions/index.js",
      "functions/estrazioneDocumenti.js",
      "functions/analisiEconomica.js",
      "functions-schede/*",
      "api/pdf-ai-enhance.ts",
      "server.js",
      "Cloud Run esterno libretto",
    ],
    notes: [
      "Esiste ora un primo adapter server-side reale in `backend/internal-ai/server/internal-ai-adapter.js`, con supporto controllato a provider reale solo per preview/proposte IA e mai per scritture business automatiche.",
      "Esiste ora anche un primo retrieval server-side read-only sull'endpoint `/internal-ai-backend/retrieval/read`, confinato a uno snapshot D01 seedato dal clone e persistito nel contenitore IA dedicato.",
      "L'adapter espone anche `artifacts.preview` e `approvals.prepare` per il primo workflow server-side preview/approval/rollback su artifact IA dedicati.",
      "I ponti mock-safe attivi collegano oggi `chat-orchestrator`, `documents-preview`, `economic-analysis-preview`, `libretto-preview`, `preventivi-preview`, `vehicle-report-preview`, `driver-report-preview` e `combined-report-preview` via dispatcher interno.",
      "Artifact, memoria operativa e traceability minima vengono persistiti solo nel contenitore locale dedicato `backend/internal-ai/runtime-data/*`.",
      "Nessuna scrittura business su Firestore o Storage consentita in questo step.",
      "Eventuali adapter futuri dovranno incapsulare questo servizio, non rendere canonici i backend legacy.",
    ],
  };

  return {
    manifest,
    dispatch: dispatchInternalAiBackendRequest,
  };
}

export const internalAiBackendService = createInternalAiBackendService();
