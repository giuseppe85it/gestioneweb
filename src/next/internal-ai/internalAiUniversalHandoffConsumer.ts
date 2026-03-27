import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import {
  readInternalAiUniversalRequestsRepositorySnapshot,
  subscribeInternalAiUniversalRequestsRepository,
  updateInternalAiUniversalHandoffLifecycle,
} from "./internalAiUniversalRequestsRepository";
import type {
  InternalAiUniversalEntityKind,
  InternalAiUniversalHandoffConsumptionStatus,
  InternalAiUniversalHandoffPayload,
  InternalAiUniversalNormalizedValue,
} from "./internalAiUniversalTypes";

export type InternalAiUniversalResolvedPrefill = {
  flusso: string | null;
  targa: string | null;
  fornitore: string | null;
  materiale: string | null;
  autista: string | null;
  badge: string | null;
  cisterna: string | null;
  documentoNome: string | null;
  prompt: string | null;
  queryMateriale: string | null;
  routeSecondaria: string | null;
  vistaTarget: string | null;
};

export type InternalAiUniversalHandoffConsumerState =
  | {
      status: "idle";
      handoffId: null;
      payload: null;
      prefill: null;
      errorMessage: null;
      requiresVerification: false;
    }
  | {
      status: "error";
      handoffId: string | null;
      payload: InternalAiUniversalHandoffPayload | null;
      prefill: InternalAiUniversalResolvedPrefill | null;
      errorMessage: string;
      requiresVerification: true;
    }
  | {
      status: "ready";
      handoffId: string;
      payload: InternalAiUniversalHandoffPayload;
      prefill: InternalAiUniversalResolvedPrefill;
      errorMessage: null;
      requiresVerification: boolean;
    };

function normalizeText(value: InternalAiUniversalNormalizedValue | null | undefined): string | null {
  if (Array.isArray(value)) {
    const label = value.join(", ").trim();
    return label || null;
  }

  if (value === null || value === undefined) {
    return null;
  }

  const label = String(value).trim();
  return label || null;
}

function resolveEntityValue(
  payload: InternalAiUniversalHandoffPayload,
  entityKind: InternalAiUniversalEntityKind,
): string | null {
  if (payload.entityRef?.entityKind === entityKind) {
    return payload.entityRef.label || payload.entityRef.normalizedValue;
  }

  return null;
}

function resolvePrefill(payload: InternalAiUniversalHandoffPayload): InternalAiUniversalResolvedPrefill {
  return {
    flusso: normalizeText(payload.prefillCanonico.flusso),
    targa:
      normalizeText(payload.prefillCanonico.targa) ??
      resolveEntityValue(payload, "targa") ??
      resolveEntityValue(payload, "mezzo"),
    fornitore:
      normalizeText(payload.prefillCanonico.fornitore) ?? resolveEntityValue(payload, "fornitore"),
    materiale:
      normalizeText(payload.prefillCanonico.materiale) ??
      normalizeText(payload.prefillCanonico.queryMateriale) ??
      resolveEntityValue(payload, "materiale"),
    autista:
      normalizeText(payload.prefillCanonico.autista) ??
      resolveEntityValue(payload, "autista") ??
      resolveEntityValue(payload, "badge"),
    badge: resolveEntityValue(payload, "badge"),
    cisterna:
      normalizeText(payload.prefillCanonico.cisterna) ?? resolveEntityValue(payload, "cisterna"),
    documentoNome: normalizeText(payload.prefillCanonico.documentoNome),
    prompt: normalizeText(payload.prefillCanonico.prompt) ?? normalizeText(payload.datiEstrattiNormalizzati.prompt),
    queryMateriale: normalizeText(payload.prefillCanonico.queryMateriale),
    routeSecondaria: normalizeText(payload.prefillCanonico.routeSecondaria),
    vistaTarget: normalizeText(payload.prefillCanonico.vistaTarget),
  };
}

function stripSearch(path: string): string {
  return String(path || "").split("?")[0] || "";
}

export function useInternalAiUniversalHandoffConsumer(args: {
  moduleId: string;
}): {
  state: InternalAiUniversalHandoffConsumerState;
  acknowledge: (status: InternalAiUniversalHandoffConsumptionStatus, note: string) => void;
} {
  const location = useLocation();
  const acknowledgedRef = useRef<Set<string>>(new Set());
  const repository = useSyncExternalStore(
    subscribeInternalAiUniversalRequestsRepository,
    readInternalAiUniversalRequestsRepositorySnapshot,
    readInternalAiUniversalRequestsRepositorySnapshot,
  );

  const state = useMemo<InternalAiUniversalHandoffConsumerState>(() => {
    const params = new URLSearchParams(location.search);
    const handoffId = params.get("iaHandoff");
    if (!handoffId) {
      return {
        status: "idle",
        handoffId: null,
        payload: null,
        prefill: null,
        errorMessage: null,
        requiresVerification: false,
      };
    }

    const payload = repository.handoffs.find((entry) => entry.handoffId === handoffId) ?? null;
    if (!payload) {
      return {
        status: "error",
        handoffId,
        payload: null,
        prefill: null,
        errorMessage: "Payload `iaHandoff` non trovato nel repository IA interno.",
        requiresVerification: true,
      };
    }

    if (payload.moduloTarget !== args.moduleId) {
      return {
        status: "error",
        handoffId,
        payload,
        prefill: resolvePrefill(payload),
        errorMessage: `Payload destinato a ${payload.moduloTarget}, non a ${args.moduleId}.`,
        requiresVerification: true,
      };
    }

    const requiresVerification =
      payload.campiMancanti.length > 0 ||
      payload.campiDaVerificare.length > 0 ||
      payload.statoRichiesta === "da_verificare" ||
      payload.statoRichiesta === "inbox_documentale";

    return {
      status: "ready",
      handoffId,
      payload,
      prefill: resolvePrefill(payload),
      errorMessage: null,
      requiresVerification,
    };
  }, [args.moduleId, location.search, repository.handoffs]);

  useEffect(() => {
    if (state.status !== "ready") {
      return;
    }

    const routePath = stripSearch(location.pathname);
    const ackKey = `${state.handoffId}:instradato:${routePath}`;
    if (acknowledgedRef.current.has(ackKey)) {
      return;
    }

    updateInternalAiUniversalHandoffLifecycle({
      handoffId: state.handoffId,
      status: "instradato",
      moduleId: args.moduleId,
      routePath,
      note: "La route target NEXT ha ricevuto il payload `iaHandoff`.",
    });
    updateInternalAiUniversalHandoffLifecycle({
      handoffId: state.handoffId,
      status: "letto_dal_modulo",
      moduleId: args.moduleId,
      routePath,
      note: "Il modulo target ha validato e letto il payload standard.",
    });
    acknowledgedRef.current.add(ackKey);
  }, [args.moduleId, location.pathname, state]);

  useEffect(() => {
    if (state.status !== "error" || !state.handoffId) {
      return;
    }

    const routePath = stripSearch(location.pathname);
    const ackKey = `${state.handoffId}:errore:${routePath}:${state.errorMessage}`;
    if (acknowledgedRef.current.has(ackKey)) {
      return;
    }

    updateInternalAiUniversalHandoffLifecycle({
      handoffId: state.handoffId,
      status: "errore",
      moduleId: args.moduleId,
      routePath,
      note: state.errorMessage,
    });
    acknowledgedRef.current.add(ackKey);
  }, [args.moduleId, location.pathname, state]);

  const acknowledge = useCallback(
    (status: InternalAiUniversalHandoffConsumptionStatus, note: string) => {
      if (state.status !== "ready") {
        return;
      }

      const routePath = stripSearch(location.pathname);
      const ackKey = `${state.handoffId}:${status}:${routePath}:${note}`;
      if (acknowledgedRef.current.has(ackKey)) {
        return;
      }

      updateInternalAiUniversalHandoffLifecycle({
        handoffId: state.handoffId,
        status,
        moduleId: args.moduleId,
        routePath,
        note,
      });
      acknowledgedRef.current.add(ackKey);
    },
    [args.moduleId, location.pathname, state],
  );

  return {
    state,
    acknowledge,
  };
}
