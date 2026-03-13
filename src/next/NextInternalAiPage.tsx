import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  NEXT_HOME_PATH,
  NEXT_IA_PATH,
  NEXT_INTERNAL_AI_ARTIFACTS_PATH,
  NEXT_INTERNAL_AI_AUDIT_PATH,
  NEXT_INTERNAL_AI_PATH,
  NEXT_INTERNAL_AI_REQUESTS_PATH,
  NEXT_INTERNAL_AI_SESSIONS_PATH,
} from "./nextStructuralPaths";
import {
  archiveInternalAiArtifact,
  readInternalAiScaffoldSnapshot,
  saveInternalAiDraftArtifact,
} from "./internal-ai/internalAiMockRepository";
import { runInternalAiChatTurn } from "./internal-ai/internalAiChatOrchestrator";
import {
  readInternalAiVehicleReportPreview,
  type InternalAiVehicleReportReadResult,
} from "./internal-ai/internalAiVehicleReportFacade";
import {
  findInternalAiExactVehicleMatch,
  matchInternalAiVehicleLookupCandidates,
  normalizeInternalAiVehicleLookupQuery,
  readInternalAiVehicleLookupCatalog,
} from "./internal-ai/internalAiVehicleLookup";
import {
  readInternalAiTrackingSummary,
  subscribeInternalAiTracking,
  trackInternalAiArtifactAction,
  trackInternalAiChatPrompt,
  trackInternalAiScreenVisit,
  trackInternalAiVehicleSearch,
  trackInternalAiVehicleSelection,
} from "./internal-ai/internalAiTracking";
import type {
  InternalAiApprovalState,
  InternalAiChatExecutionStatus,
  InternalAiChatMessage,
  InternalAiPreviewState,
  InternalAiVehicleLookupCandidate,
  InternalAiVehicleLookupMatchState,
  InternalAiVehicleReportPreview,
  NextInternalAiSectionId,
} from "./internal-ai/internalAiTypes";
import "./next-shell.css";
import "./internal-ai/internal-ai.css";

type NextInternalAiPageProps = {
  sectionId?: NextInternalAiSectionId;
};

type ReportSearchState =
  | {
      status: "idle";
      message: string | null;
      report: null;
      draftMessage: string | null;
    }
  | {
      status: "loading";
      message: string;
      report: null;
      draftMessage: string | null;
    }
  | {
      status: "invalid_query" | "not_found" | "error";
      message: string;
      report: null;
      draftMessage: string | null;
    }
  | {
      status: "ready";
      message: string;
      report: InternalAiVehicleReportPreview;
      draftMessage: string | null;
    };

type LookupCatalogState =
  | {
      status: "loading";
      items: InternalAiVehicleLookupCandidate[];
      message: string | null;
    }
  | {
      status: "ready";
      items: InternalAiVehicleLookupCandidate[];
      message: string | null;
    }
  | {
      status: "error";
      items: InternalAiVehicleLookupCandidate[];
      message: string;
    };

const SECTION_CONFIGS: Record<
  NextInternalAiSectionId,
  { title: string; description: string; path: string }
> = {
  overview: {
    title: "Panoramica",
    description: "Ricerca targa, anteprima report in sola lettura e guard rail del sottosistema IA.",
    path: NEXT_INTERNAL_AI_PATH,
  },
  sessions: {
    title: "Sessioni",
    description: "Scaffold locale `ai_sessions` per anteprima e revisione.",
    path: NEXT_INTERNAL_AI_SESSIONS_PATH,
  },
  requests: {
    title: "Richieste",
    description: "Stati `ai_requests` con anteprima, approvazione, revisione e scarto solo simulati.",
    path: NEXT_INTERNAL_AI_REQUESTS_PATH,
  },
  artifacts: {
    title: "Archivio artifact IA",
    description: "Archivio locale isolato del sottosistema IA, separato dai dati business.",
    path: NEXT_INTERNAL_AI_ARTIFACTS_PATH,
  },
  audit: {
    title: "Registro audit",
    description: "Audit locale e tracking d'uso in memoria confinati al subtree IA interno.",
    path: NEXT_INTERNAL_AI_AUDIT_PATH,
  },
};

const PREVIEW_STATUS_LABELS: Record<string, string> = {
  idle: "In attesa",
  preview_ready: "Anteprima pronta",
  revision_requested: "Da rivedere",
  discarded: "Scartata",
};

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  not_requested: "Non richiesta",
  awaiting_approval: "Approvabile",
  approved: "Approvata",
  rejected: "Respinta",
  revision_requested: "Revisione richiesta",
};

const REQUEST_TARGET_LABELS: Record<string, string> = {
  "report-page": "Report targa in anteprima",
  tracking: "Tracking isolato",
  "artifact-archive": "Archivio artifact IA",
};

const SECTION_STATUS_LABELS: Record<string, string> = {
  completa: "Completa",
  parziale: "Parziale",
  vuota: "Vuota",
  errore: "Errore",
};

const SOURCE_STATUS_LABELS: Record<string, string> = {
  disponibile: "Disponibile",
  parziale: "Parziale",
  errore: "Errore",
};

const SESSION_STATUS_LABELS: Record<string, string> = {
  draft: "Bozza",
  active_preview: "Anteprima attiva",
  review_queue: "In revisione",
  closed: "Chiusa",
};

const ARTIFACT_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  preview: "Preview",
  archived: "Archiviato",
};

const ARTIFACT_KIND_LABELS: Record<string, string> = {
  report_preview: "Report in anteprima",
  contract_catalog: "Catalogo contratti segnaposto",
  retrieval_snapshot: "Snapshot recupero contesto",
  checklist: "Checklist",
};

const ARTIFACT_STORAGE_LABELS: Record<string, string> = {
  mock_memory_only: "Memoria locale di fallback",
  local_storage_isolated: "Archivio locale isolato",
};

const AUDIT_SEVERITY_LABELS: Record<string, string> = {
  info: "Informazione",
  warning: "Avviso",
  critical: "Critico",
};

const AUDIT_RISK_LABELS: Record<string, string> = {
  low: "Basso",
  medium: "Medio",
  high: "Alto",
};

const AUDIT_SCOPE_LABELS: Record<string, string> = {
  preview: "Anteprima",
  tracking: "Tracking",
  artifacts: "Archivio artifact IA",
  "report-preview": "Report targa",
};

const CHAT_STATUS_LABELS: Record<InternalAiChatExecutionStatus, string> = {
  idle: "Pronta",
  running: "In elaborazione",
  completed: "Eseguita",
  partial: "Parziale",
  not_supported: "Non supportata",
  failed: "Errore",
};

const CHAT_SUGGESTIONS = [
  "Cosa puoi fare",
  "Crea report targa AB123CD",
  "Fammi una preview per la targa TI123456",
  "Analizza il mezzo AA111AA",
];

const LOOKUP_MATCH_LABELS: Record<InternalAiVehicleLookupMatchState, string> = {
  idle: "In attesa",
  loading: "Caricamento",
  empty_query: "Inserimento richiesto",
  no_match: "Nessuna corrispondenza",
  exact_match: "Corrispondenza precisa",
  multiple_matches: "Selezione richiesta",
  selected: "Mezzo selezionato",
  error: "Errore",
};

const VEHICLE_SEARCH_SOURCE_LABELS: Record<string, string> = {
  manuale: "Manuale",
  selezione_guidata: "Selezione guidata",
  chat: "Chat",
};

const VEHICLE_SEARCH_RESULT_LABELS: Record<string, string> = {
  selected: "Selezionata",
  ready: "Anteprima eseguita",
  not_found: "Non trovata",
  invalid_query: "Query non valida",
};

const ARTIFACT_ACTION_LABELS: Record<string, string> = {
  saved: "Salvato",
  opened: "Aperto",
  archived: "Archiviato",
};

function statusToneClass(status: string) {
  if (
    status.includes("warning") ||
    status.includes("awaiting") ||
    status.includes("revision") ||
    status.includes("preview") ||
    status.includes("parziale")
  ) {
    return "internal-ai-pill is-warning";
  }

  if (status.includes("reject") || status.includes("discard") || status.includes("errore")) {
    return "internal-ai-pill is-danger";
  }

  return "internal-ai-pill is-neutral";
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("it-IT");
}

function renderPreviewState(previewState: InternalAiPreviewState) {
  return (
    <div className="internal-ai-pill-row">
      <span className={statusToneClass(previewState.status)}>
        Anteprima: {PREVIEW_STATUS_LABELS[previewState.status] ?? previewState.status}
      </span>
      <span className="internal-ai-pill is-neutral">{formatDateLabel(previewState.updatedAt)}</span>
      <span className="internal-ai-muted">{previewState.note}</span>
    </div>
  );
}

function renderApprovalState(approvalState: InternalAiApprovalState) {
  return (
    <div className="internal-ai-pill-row">
      <span className={statusToneClass(approvalState.status)}>
        Stato: {APPROVAL_STATUS_LABELS[approvalState.status] ?? approvalState.status}
      </span>
      <span className="internal-ai-pill is-neutral">{approvalState.requestedBy}</span>
      <span className="internal-ai-muted">{approvalState.note}</span>
    </div>
  );
}

function createChatMessage(args: {
  role: InternalAiChatMessage["role"];
  text: string;
  intent: InternalAiChatMessage["intent"];
  status: InternalAiChatMessage["status"];
  references?: InternalAiChatMessage["references"];
}): InternalAiChatMessage {
  return {
    id: `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    role: args.role,
    createdAt: new Date().toISOString(),
    text: args.text,
    intent: args.intent,
    status: args.status,
    references: args.references ?? [],
  };
}

function createWelcomeChatMessage(): InternalAiChatMessage {
  return createChatMessage({
    role: "assistente",
    intent: "capabilities",
    status: "completed",
    text:
      "Chat interna controllata attiva.\n\n" +
      "Posso aiutarti con richieste sicure gia supportate dal sottosistema IA interno, in particolare la preview report per targa in sola lettura.\n\n" +
      'Prova con: "crea report targa AB123CD" oppure "cosa puoi fare".',
    references: [
      {
        type: "safe_mode_notice",
        label: "Modalita sicura e controllata",
        targa: null,
      },
    ],
  });
}

function formatVehicleLookupDescription(candidate: InternalAiVehicleLookupCandidate) {
  return [
    candidate.marcaModello,
    candidate.categoria !== "Senza categoria" ? candidate.categoria : null,
    candidate.autistaNome ? `Autista ${candidate.autistaNome}` : null,
  ]
    .filter(Boolean)
    .join(" - ");
}

function buildContractLabelMap(contractCatalog: ReturnType<typeof readInternalAiScaffoldSnapshot>["contractCatalog"]) {
  return new Map<string, string>(contractCatalog.map((entry) => [entry.id, entry.title]));
}

function NextInternalAiPage({ sectionId = "overview" }: NextInternalAiPageProps) {
  const location = useLocation();
  const section = SECTION_CONFIGS[sectionId];
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  const snapshot = useMemo(() => {
    void snapshotVersion;
    return readInternalAiScaffoldSnapshot();
  }, [snapshotVersion]);
  const contractLabelMap = useMemo(
    () => buildContractLabelMap(snapshot.contractCatalog),
    [snapshot.contractCatalog],
  );
  const tracking = useSyncExternalStore(
    subscribeInternalAiTracking,
    readInternalAiTrackingSummary,
    readInternalAiTrackingSummary,
  );
  const [targaInput, setTargaInput] = useState("");
  const [lookupCatalog, setLookupCatalog] = useState<LookupCatalogState>({
    status: "loading",
    items: [],
    message: null,
  });
  const [selectedVehicle, setSelectedVehicle] = useState<InternalAiVehicleLookupCandidate | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<InternalAiChatMessage[]>(() => [
    createWelcomeChatMessage(),
  ]);
  const [chatStatus, setChatStatus] = useState<InternalAiChatExecutionStatus>("idle");
  const [openedArtifactId, setOpenedArtifactId] = useState<string | null>(null);
  const [searchState, setSearchState] = useState<ReportSearchState>({
    status: "idle",
    message: null,
    report: null,
    draftMessage: null,
  });
  const openedArtifact = useMemo(
    () => snapshot.artifacts.find((artifact) => artifact.id === openedArtifactId) ?? null,
    [openedArtifactId, snapshot.artifacts],
  );
  const persistedArtifactsCount = snapshot.artifacts.filter((artifact) => artifact.isPersisted).length;
  const normalizedLookupQuery = useMemo(
    () => normalizeInternalAiVehicleLookupQuery(targaInput),
    [targaInput],
  );
  const lookupSuggestions = useMemo(
    () => matchInternalAiVehicleLookupCandidates(lookupCatalog.items, targaInput),
    [lookupCatalog.items, targaInput],
  );
  const exactVehicleMatch = useMemo(
    () => findInternalAiExactVehicleMatch(lookupCatalog.items, targaInput),
    [lookupCatalog.items, targaInput],
  );
  const lookupUiState = useMemo((): {
    status: InternalAiVehicleLookupMatchState;
    message: string;
  } => {
    if (lookupCatalog.status === "loading") {
      return {
        status: "loading",
        message: "Sto leggendo le targhe reali dai layer anagrafici read-only del clone...",
      };
    }

    if (lookupCatalog.status === "error") {
      return {
        status: "error",
        message: lookupCatalog.message,
      };
    }

    if (!normalizedLookupQuery) {
      return {
        status: "empty_query",
        message: "Inizia a digitare una targa per vedere i mezzi reali disponibili nel gestionale.",
      };
    }

    if (selectedVehicle && selectedVehicle.targa === normalizedLookupQuery) {
      return {
        status: "selected",
        message: `Mezzo reale selezionato: ${selectedVehicle.targa}. Puoi avviare l'anteprima report in sola lettura.`,
      };
    }

    if (exactVehicleMatch) {
      return {
        status: "exact_match",
        message: `Trovata una corrispondenza precisa per ${exactVehicleMatch.targa}. Se vuoi ridurre gli errori, seleziona il mezzo prima di generare l'anteprima.`,
      };
    }

    if (lookupSuggestions.length === 0) {
      return {
        status: "no_match",
        message: "Nessun mezzo reale corrisponde ai caratteri inseriti.",
      };
    }

    return {
      status: "multiple_matches",
      message:
        lookupSuggestions.length === 1
          ? "Trovata una corrispondenza possibile. Seleziona il mezzo suggerito per confermare la targa corretta."
          : `Trovate ${lookupSuggestions.length} corrispondenze possibili. Seleziona il mezzo corretto per una preview piu affidabile.`,
    };
  }, [
    exactVehicleMatch,
    lookupCatalog.message,
    lookupCatalog.status,
    lookupSuggestions.length,
    normalizedLookupQuery,
    selectedVehicle,
  ]);

  useEffect(() => {
    trackInternalAiScreenVisit(sectionId, location.pathname);
  }, [location.pathname, sectionId]);

  useEffect(() => {
    let cancelled = false;

    void readInternalAiVehicleLookupCatalog()
      .then((items) => {
        if (cancelled) return;
        setLookupCatalog({
          status: "ready",
          items,
          message: null,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setLookupCatalog({
          status: "error",
          items: [],
          message:
            error instanceof Error
              ? error.message
              : "Errore durante la lettura delle targhe reali del gestionale.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const applyPreviewReadResult = (
    result: InternalAiVehicleReportReadResult,
    source: "manuale" | "selezione_guidata" | "chat",
  ) => {
    if (result.status !== "ready") {
      if (result.normalizedTarga) {
        trackInternalAiVehicleSearch({
          targa: result.normalizedTarga,
          source,
          result: result.status,
          sectionId,
          path: location.pathname,
        });
      }
      setSearchState({
        status: result.status,
        message: result.message,
        report: null,
        draftMessage: null,
      });
      return;
    }

    setTargaInput(result.normalizedTarga);
    const catalogMatch =
      findInternalAiExactVehicleMatch(lookupCatalog.items, result.normalizedTarga) ?? null;
    if (catalogMatch) {
      setSelectedVehicle(catalogMatch);
    }
    trackInternalAiVehicleSearch({
      targa: result.normalizedTarga,
      source,
      result: "ready",
      sectionId,
      path: location.pathname,
    });
    setSearchState({
      status: "ready",
      message: result.message,
      report: result.report,
      draftMessage: null,
    });
  };

  const handleSelectVehicle = (candidate: InternalAiVehicleLookupCandidate) => {
    setSelectedVehicle(candidate);
    setTargaInput(candidate.targa);
    trackInternalAiVehicleSelection({
      targa: candidate.targa,
      sectionId,
      path: location.pathname,
    });
    setSearchState((current) =>
      current.status === "loading"
        ? current
        : {
            status: "idle",
            message: `Mezzo selezionato dal gestionale read-only: ${candidate.targa}. Ora puoi generare l'anteprima report.`,
            report: null,
            draftMessage: null,
          },
    );
  };

  const handleGeneratePreview = async () => {
    const candidateToUse =
      selectedVehicle && selectedVehicle.targa === normalizedLookupQuery
        ? selectedVehicle
        : exactVehicleMatch;

    if (!normalizedLookupQuery) {
      setSearchState({
        status: "invalid_query",
        message: "Inserisci almeno una targa o seleziona un mezzo reale prima di avviare l'anteprima.",
        report: null,
        draftMessage: null,
      });
      return;
    }

    if (!candidateToUse && lookupSuggestions.length > 0) {
      trackInternalAiVehicleSearch({
        targa: normalizedLookupQuery,
        source: "manuale",
        result: "invalid_query",
        sectionId,
        path: location.pathname,
      });
      setSearchState({
        status: "invalid_query",
        message:
          lookupSuggestions.length === 1
            ? "Ricerca incompleta: seleziona il mezzo suggerito oppure completa la targa prima di generare l'anteprima report."
            : "Ricerca ambigua: seleziona un mezzo reale dall'elenco suggerito prima di generare l'anteprima report.",
        report: null,
        draftMessage: null,
      });
      return;
    }

    const targaToRead = candidateToUse?.targa ?? normalizedLookupQuery;
    if (candidateToUse && (!selectedVehicle || selectedVehicle.targa !== candidateToUse.targa)) {
      setSelectedVehicle(candidateToUse);
    }
    setTargaInput(targaToRead);
    setSearchState({
      status: "loading",
      message: `Analisi in sola lettura in corso dai layer NEXT per la targa ${targaToRead}...`,
      report: null,
      draftMessage: null,
    });

    try {
      const result: InternalAiVehicleReportReadResult =
        await readInternalAiVehicleReportPreview(targaToRead);
      applyPreviewReadResult(result, selectedVehicle ? "selezione_guidata" : "manuale");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore non previsto durante la costruzione dell'anteprima report.";

      setSearchState({
        status: "error",
        message,
        report: null,
        draftMessage: null,
      });
    }
  };

  const handleChatSubmit = async (promptOverride?: string) => {
    const prompt = (promptOverride ?? chatInput).trim();
    if (!prompt || chatStatus === "running") {
      return;
    }

    setChatMessages((current) => [
      ...current,
      createChatMessage({
        role: "utente",
        text: prompt,
        intent: "richiesta_generica",
        status: "completed",
      }),
    ]);
    setChatInput("");
    setChatStatus("running");

    try {
      const result = await runInternalAiChatTurn(prompt);
      trackInternalAiChatPrompt({
        prompt,
        intent: result.intent,
        status: result.status,
        sectionId,
        path: location.pathname,
      });

      if (result.report) {
        if (result.report.status === "ready") {
          applyPreviewReadResult({
            status: "ready",
            normalizedTarga: result.report.normalizedTarga,
            message: result.report.message,
            report: result.report.preview,
          }, "chat");
        } else {
          applyPreviewReadResult({
            status: result.report.status,
            normalizedTarga: result.report.normalizedTarga,
            message: result.report.message,
            report: null,
          }, "chat");
        }
      }

      setChatMessages((current) => [
        ...current,
        createChatMessage({
          role: "assistente",
          text: result.assistantText,
          intent: result.intent,
          status: result.status,
          references: result.references,
        }),
      ]);
      setChatStatus("idle");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore non previsto nell'orchestratore locale della chat interna.";

      trackInternalAiChatPrompt({
        prompt,
        intent: "richiesta_generica",
        status: "failed",
        sectionId,
        path: location.pathname,
      });

      setChatMessages((current) => [
        ...current,
        createChatMessage({
          role: "assistente",
          text:
            "Si e verificato un errore interno nella chat controllata.\n\n" +
            `Dettaglio: ${message}`,
          intent: "richiesta_generica",
          status: "failed",
          references: [
            {
              type: "safe_mode_notice",
              label: "Errore locale della chat controllata",
              targa: null,
            },
          ],
        }),
      ]);
      setChatStatus("idle");
    }
  };

  const applyReportState = (next: {
    previewState: InternalAiPreviewState;
    approvalState: InternalAiApprovalState;
  }) => {
    setSearchState((current) => {
      if (current.status !== "ready") {
        return current;
      }

      return {
        ...current,
        report: {
          ...current.report,
          previewState: next.previewState,
          approvalState: next.approvalState,
        },
        draftMessage: null,
      };
    });
  };

  const markRevisionRequested = () => {
    if (searchState.status !== "ready") return;

    const updatedAt = new Date().toISOString();
    applyReportState({
      previewState: {
        status: "revision_requested",
        updatedAt,
        note: "Anteprima marcata come da rivedere nel solo scaffolding IA interno.",
      },
      approvalState: {
        status: "revision_requested",
        requestedBy: "ia.interna.preview",
        updatedAt,
        note: "Richiesta revisione solo lato clone, senza applicazione reale.",
      },
    });
  };

  const markApprovable = () => {
    if (searchState.status !== "ready") return;

    const updatedAt = new Date().toISOString();
    applyReportState({
      previewState: {
        status: "preview_ready",
        updatedAt,
        note: "Anteprima pronta e considerata approvabile a livello di scaffolding.",
      },
      approvalState: {
        status: "awaiting_approval",
        requestedBy: "ia.interna.preview",
        updatedAt,
        note: "Approvabile solo nel workflow simulato del sottosistema IA interno.",
      },
    });
  };

  const discardPreview = () => {
    if (searchState.status !== "ready") return;

    const updatedAt = new Date().toISOString();
    applyReportState({
      previewState: {
        status: "discarded",
        updatedAt,
        note: "Anteprima scartata solo nel sottosistema IA interno.",
      },
      approvalState: {
        status: "rejected",
        requestedBy: "ia.interna.preview",
        updatedAt,
        note: "Scarto registrato solo nel workflow simulato del clone.",
      },
    });
  };

  const saveDraftArtifact = () => {
    if (searchState.status !== "ready") return;

    const saved = saveInternalAiDraftArtifact({ report: searchState.report });
    trackInternalAiArtifactAction({
      artifactId: saved.artifact.id,
      title: saved.artifact.title,
      mezzoTarga: saved.artifact.mezzoTarga,
      action: "saved",
      sectionId,
      path: location.pathname,
    });
    setSnapshotVersion((value) => value + 1);
    setSearchState((current) =>
      current.status === "ready"
        ? {
            ...current,
            draftMessage: saved.artifact.isPersisted
              ? `Draft IA salvato nell'archivio locale isolato: sessione ${saved.session.id}, richiesta ${saved.request.id}, artifact ${saved.artifact.id}.`
              : `Draft IA mantenuto solo in memoria locale di fallback: sessione ${saved.session.id}, richiesta ${saved.request.id}, artifact ${saved.artifact.id}.`,
          }
        : current,
    );
  };

  const handleArchiveArtifact = (artifactId: string) => {
    const archived = archiveInternalAiArtifact(artifactId);
    if (!archived) {
      return;
    }

    trackInternalAiArtifactAction({
      artifactId: archived.id,
      title: archived.title,
      mezzoTarga: archived.mezzoTarga,
      action: "archived",
      sectionId,
      path: location.pathname,
    });
    setSnapshotVersion((value) => value + 1);
    setOpenedArtifactId(artifactId);
  };

  const handleOpenArtifact = (artifactId: string) => {
    const artifact = snapshot.artifacts.find((entry) => entry.id === artifactId) ?? null;
    if (!artifact) {
      return;
    }

    setOpenedArtifactId(artifactId);
    trackInternalAiArtifactAction({
      artifactId: artifact.id,
      title: artifact.title,
      mezzoTarga: artifact.mezzoTarga,
      action: "opened",
      sectionId,
      path: location.pathname,
    });
  };

  return (
    <section className="next-page internal-ai-page">
      <header className="internal-ai-hero">
        <div className="next-panel">
          <p className="next-page__eyebrow">IA interna / modalita sicura</p>
          <h1>{section.title}</h1>
          <p className="next-page__description">
            Sottosistema IA interno isolato sotto <code>/next/ia/interna*</code>. Stato attuale:
            scaffolding, non operativo, orientato all&apos;anteprima e reversibile.
          </p>
          <div className="internal-ai-pill-row" style={{ marginTop: 14 }}>
            <span className="next-chip next-chip--accent">SCAFFOLDING</span>
            <span className="next-chip">NON OPERATIVO</span>
            <span className="next-chip">SOLO LETTURA</span>
            <span className="next-chip next-chip--subtle">NESSUNA SCRITTURA BUSINESS</span>
          </div>
          <p className="internal-ai-card__meta">
            {section.description} Nessun backend IA reale, nessun segreto lato client, nessun
            riuso runtime dei moduli IA legacy.
          </p>
          <div className="internal-ai-nav" style={{ marginTop: 16 }}>
            {(
              Object.entries(SECTION_CONFIGS) as [
                NextInternalAiSectionId,
                (typeof SECTION_CONFIGS)[NextInternalAiSectionId],
              ][]
            ).map(([id, entry]) => (
              <Link
                key={id}
                to={entry.path}
                className={`internal-ai-nav__link ${id === sectionId ? "is-active" : ""}`}
              >
                {entry.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="next-panel internal-ai-hero__meta">
          <span className="next-chip next-chip--accent">Esecuzione: scaffolding isolato</span>
          <span className="next-chip">Backend: solo contratti segnaposto</span>
          <span className="next-chip">
            Archivio artifact:{" "}
            {snapshot.summary.artifactArchiveMode === "local_storage_isolated"
              ? "locale isolato"
              : "fallback in memoria"}
          </span>
          <span className="next-chip">
            Tracking:{" "}
            {tracking.mode === "local_storage_isolated"
              ? "memoria locale persistente IA"
              : "solo memoria locale"}
          </span>
          <span className="next-chip next-chip--subtle">Scritture bloccate: si</span>
          <p className="internal-ai-muted">
            Questa superficie resta confinata alla famiglia clone IA e non aggancia le pagine
            correnti fuori da <code>/next/ia/interna*</code>.
          </p>
          <div className="internal-ai-pill-row">
            <Link to={NEXT_IA_PATH} className="next-clone-topbar__link">
              Hub IA clone
            </Link>
            <Link to={NEXT_HOME_PATH} className="next-clone-topbar__link">
              Home clone
            </Link>
          </div>
        </div>
      </header>

      <section className="internal-ai-grid">
        <article className="internal-ai-card">
          <p className="internal-ai-card__eyebrow">Sessioni</p>
          <h3>{snapshot.sessions.length}</h3>
          <p className="internal-ai-card__meta">
            Sessioni simulate del sottosistema IA per anteprima e revisione.
          </p>
        </article>
        <article className="internal-ai-card">
          <p className="internal-ai-card__eyebrow">Richieste</p>
          <h3>{snapshot.requests.length}</h3>
          <p className="internal-ai-card__meta">
            Richieste locali con stato anteprima, approvabile, revisione e scarto.
          </p>
        </article>
        <article className="internal-ai-card">
          <p className="internal-ai-card__eyebrow">Artifact IA</p>
          <h3>{snapshot.artifacts.length}</h3>
          <p className="internal-ai-card__meta">
            Persistenti locali {persistedArtifactsCount}, fallback memoria{" "}
            {snapshot.artifacts.length - persistedArtifactsCount}.
          </p>
        </article>
        <article className="internal-ai-card">
          <p className="internal-ai-card__eyebrow">Audit</p>
          <h3>{snapshot.auditLog.length}</h3>
          <p className="internal-ai-card__meta">
            Registro locale di sicurezza e tracciabilita del sottosistema.
          </p>
        </article>
      </section>

      {sectionId === "overview" ? (
        <>
          <article className="next-panel internal-ai-chat">
            <div className="next-panel__header">
              <h2>Chat interna controllata</h2>
            </div>
            <p className="next-panel__description">
              Interfaccia locale/mock del sottosistema IA. Nessun LLM reale, nessun backend esterno,
              nessuna scrittura business. I messaggi restano solo in memoria nella pagina corrente.
            </p>
            <div className="internal-ai-chat__suggestions">
              {CHAT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="internal-ai-chat__suggestion"
                  onClick={() => setChatInput(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="internal-ai-chat__messages">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`internal-ai-chat__message ${
                    message.role === "utente" ? "is-user" : "is-assistant"
                  }`}
                >
                  <div className="internal-ai-chat__message-header">
                    <strong>{message.role === "utente" ? "Utente" : "Assistente IA interno"}</strong>
                    <div className="internal-ai-pill-row">
                      <span className={statusToneClass(message.status)}>
                        {CHAT_STATUS_LABELS[message.status]}
                      </span>
                      <span className="internal-ai-pill is-neutral">
                        {formatDateLabel(message.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="internal-ai-chat__message-text">{message.text}</p>
                  {message.references.length ? (
                    <div className="internal-ai-pill-row">
                      {message.references.map((reference) => (
                        <span
                          key={`${message.id}:${reference.type}:${reference.label}`}
                          className="internal-ai-pill is-neutral"
                        >
                          {reference.label}
                          {reference.targa ? ` - ${reference.targa}` : ""}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {chatStatus === "running" ? (
                <div className="internal-ai-chat__message is-assistant">
                  <div className="internal-ai-chat__message-header">
                    <strong>Assistente IA interno</strong>
                    <span className={statusToneClass("running")}>In elaborazione</span>
                  </div>
                  <p className="internal-ai-chat__message-text">
                    Sto elaborando la richiesta con l&apos;orchestratore locale controllato...
                  </p>
                </div>
              ) : null}
            </div>
            <div className="internal-ai-chat__composer">
              <label className="internal-ai-search__field">
                <span>Scrivi una richiesta</span>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Es. crea report targa AB123CD"
                  className="internal-ai-search__input"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleChatSubmit();
                    }
                  }}
                />
              </label>
              <div className="internal-ai-search__actions">
                <button
                  type="button"
                  className="internal-ai-search__button"
                  disabled={chatStatus === "running" || !chatInput.trim()}
                  onClick={() => void handleChatSubmit()}
                >
                  {chatStatus === "running" ? "Elaborazione..." : "Invia richiesta"}
                </button>
              </div>
            </div>
          </article>

          <article className="next-panel internal-ai-search">
            <div className="next-panel__header">
              <h2>Anteprima report per targa</h2>
            </div>
            <p className="next-panel__description">
              Inserisci una targa oppure seleziona un mezzo reale dall&apos;autosuggest. La preview
              continua a riusare solo i layer NEXT gia normalizzati del clone in sola lettura.
            </p>
            <div className="internal-ai-search__form">
              <label className="internal-ai-search__field">
                <span>Targa mezzo</span>
                <input
                  type="text"
                  value={targaInput}
                  onChange={(event) => {
                    const nextValue = event.target.value.toUpperCase();
                    const normalizedNextValue = normalizeInternalAiVehicleLookupQuery(nextValue);
                    setTargaInput(nextValue);
                    if (selectedVehicle && selectedVehicle.targa !== normalizedNextValue) {
                      setSelectedVehicle(null);
                    }
                  }}
                  placeholder="Es. AB123CD"
                  className="internal-ai-search__input"
                  autoComplete="off"
                />
              </label>
              <div className="internal-ai-search__actions">
                <button
                  type="button"
                  className="internal-ai-search__button"
                  onClick={handleGeneratePreview}
                  disabled={searchState.status === "loading" || lookupCatalog.status === "loading"}
                >
                  {searchState.status === "loading" ? "Lettura in corso..." : "Genera anteprima"}
                </button>
              </div>
            </div>

            <div className="internal-ai-search__status">
              <div className="internal-ai-pill-row">
                <span className={statusToneClass(lookupUiState.status)}>
                  {LOOKUP_MATCH_LABELS[lookupUiState.status]}
                </span>
                {selectedVehicle ? (
                  <span className="internal-ai-pill is-neutral">
                    Mezzo reale selezionato: {selectedVehicle.targa}
                  </span>
                ) : null}
              </div>
              <p className="internal-ai-card__meta">{lookupUiState.message}</p>
            </div>

            {lookupSuggestions.length > 0 ? (
              <div className="internal-ai-suggestions">
                {lookupSuggestions.map((candidate) => {
                  const description = formatVehicleLookupDescription(candidate);
                  const isSelected = selectedVehicle?.id === candidate.id;
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      className={`internal-ai-suggestion ${isSelected ? "is-selected" : ""}`}
                      onClick={() => handleSelectVehicle(candidate)}
                    >
                      <div className="internal-ai-suggestion__header">
                        <strong>{candidate.targa}</strong>
                        <div className="internal-ai-pill-row">
                          <span className="internal-ai-pill is-neutral">{candidate.categoria}</span>
                          {isSelected ? (
                            <span className="internal-ai-pill is-warning">Selezionato</span>
                          ) : null}
                        </div>
                      </div>
                      {description ? (
                        <p className="internal-ai-card__meta">{description}</p>
                      ) : (
                        <p className="internal-ai-card__meta">
                          Mezzo reale letto da <code>{candidate.sourceKey}</code>.
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {searchState.message ? (
              <div className="next-clone-placeholder internal-ai-empty">
                <p>{searchState.message}</p>
              </div>
            ) : null}
          </article>

          <div className="next-section-grid">
            <article className="next-panel">
              <div className="next-panel__header">
                <h2>Memoria recente del modulo IA</h2>
              </div>
              <p className="next-panel__description">
                Memoria locale e tracking persistente solo nel browser del clone. Nessun dato
                business, nessun tracking globale del gestionale.
              </p>
              <div className="internal-ai-grid">
                <article className="internal-ai-card">
                  <p className="internal-ai-card__eyebrow">Ultime targhe</p>
                  {tracking.recentVehicleSearches.length ? (
                    <ul className="internal-ai-inline-list">
                      {tracking.recentVehicleSearches.map((entry) => (
                        <li key={`${entry.targa}:${entry.updatedAt}`}>
                          {entry.targa} - {VEHICLE_SEARCH_RESULT_LABELS[entry.result] ?? entry.result} -{" "}
                          {VEHICLE_SEARCH_SOURCE_LABELS[entry.source] ?? entry.source}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="internal-ai-card__meta">Nessuna targa recente ancora memorizzata.</p>
                  )}
                </article>

                <article className="internal-ai-card">
                  <p className="internal-ai-card__eyebrow">Richieste recenti</p>
                  {tracking.recentChatPrompts.length ? (
                    <ul className="internal-ai-inline-list">
                      {tracking.recentChatPrompts.map((entry) => (
                        <li key={`${entry.prompt}:${entry.updatedAt}`}>
                          {entry.prompt} - {CHAT_STATUS_LABELS[entry.status]}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="internal-ai-card__meta">Nessuna richiesta chat recente salvata.</p>
                  )}
                </article>

                <article className="internal-ai-card">
                  <p className="internal-ai-card__eyebrow">Artifact recenti</p>
                  {tracking.recentArtifacts.length ? (
                    <ul className="internal-ai-inline-list">
                      {tracking.recentArtifacts.map((entry) => (
                        <li key={`${entry.artifactId}:${entry.updatedAt}`}>
                          {entry.title} - {ARTIFACT_ACTION_LABELS[entry.action] ?? entry.action}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="internal-ai-card__meta">Nessun artifact recente ancora memorizzato.</p>
                  )}
                </article>

                <article className="internal-ai-card">
                  <p className="internal-ai-card__eyebrow">Ultimo stato di lavoro</p>
                  <ul className="internal-ai-inline-list">
                    <li>
                      Sezione:{" "}
                      {tracking.sessionState.lastSectionId
                        ? SECTION_CONFIGS[tracking.sessionState.lastSectionId].title
                        : "non disponibile"}
                    </li>
                    <li>Targa: {tracking.sessionState.lastTarga ?? "non disponibile"}</li>
                    <li>Intento: {tracking.sessionState.lastIntent ?? "non disponibile"}</li>
                    <li>Artifact: {tracking.sessionState.lastArtifactId ?? "non disponibile"}</li>
                  </ul>
                </article>
              </div>
            </article>

            <article className="next-panel">
              <div className="next-panel__header">
                <h2>Intenti e attivita piu recenti</h2>
              </div>
              <div className="internal-ai-pill-row">
                <span className="internal-ai-pill is-neutral">
                  Modalita memoria:{" "}
                  {tracking.mode === "local_storage_isolated"
                    ? "locale persistente IA"
                    : "solo memoria locale"}
                </span>
                <span className="internal-ai-pill is-neutral">
                  Visite: {tracking.totalVisits}
                </span>
                <span className="internal-ai-pill is-neutral">
                  Eventi: {tracking.totalEvents}
                </span>
              </div>
              {tracking.recentIntents.length ? (
                <ul className="internal-ai-inline-list">
                  {tracking.recentIntents.map((entry) => (
                    <li key={`${entry.intent}:${entry.updatedAt}`}>
                      {entry.intent} - usi {entry.count}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="internal-ai-card__meta">Nessun intento ancora registrato.</p>
              )}
              {tracking.recentEvents.length ? (
                <div className="internal-ai-list" style={{ marginTop: 16 }}>
                  {tracking.recentEvents.slice(0, 4).map((entry) => (
                    <div key={entry.id} className="internal-ai-list__row">
                      <div className="internal-ai-list__row-header">
                        <strong>{entry.label}</strong>
                        <span className="internal-ai-pill is-neutral">
                          {formatDateLabel(entry.ts)}
                        </span>
                      </div>
                      <p className="internal-ai-card__meta">
                        Sezione {SECTION_CONFIGS[entry.sectionId].title}
                        {entry.targa ? ` - targa ${entry.targa}` : ""}
                        {entry.artifactId ? ` - artifact ${entry.artifactId}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          </div>

          {searchState.status === "ready" ? (
            <>
              <article className="next-panel">
                <div className="next-panel__header">
                  <h2>{searchState.report.title}</h2>
                </div>
                <p className="next-panel__description">{searchState.report.subtitle}</p>
                <div className="internal-ai-pill-row" style={{ marginTop: 12 }}>
                  <span className="internal-ai-pill is-neutral">
                    Generata il {formatDateLabel(searchState.report.generatedAt)}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    Targa {searchState.report.header.targa}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    Categoria {searchState.report.header.categoria ?? "non disponibile"}
                  </span>
                </div>
                {renderPreviewState(searchState.report.previewState)}
                {renderApprovalState(searchState.report.approvalState)}

                <div className="internal-ai-button-row">
                  <button type="button" className="internal-ai-search__button" onClick={markRevisionRequested}>
                    Segna da rivedere
                  </button>
                  <button type="button" className="internal-ai-search__button" onClick={markApprovable}>
                    Segna come approvabile
                  </button>
                  <button type="button" className="internal-ai-search__button" onClick={discardPreview}>
                    Scarta anteprima
                  </button>
                  <button type="button" className="internal-ai-search__button" onClick={saveDraftArtifact}>
                    Salva draft nell&apos;archivio IA
                  </button>
                </div>

                {searchState.draftMessage ? (
                  <p className="internal-ai-card__meta">{searchState.draftMessage}</p>
                ) : null}
              </article>

              <section className="internal-ai-grid">
                {searchState.report.cards.map((card) => (
                  <article key={card.label} className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">{card.label}</p>
                    <h3>{card.value}</h3>
                    <p className="internal-ai-card__meta">{card.meta}</p>
                  </article>
                ))}
              </section>

              <div className="next-section-grid">
                <article className="next-panel">
                  <div className="next-panel__header">
                    <h2>Sezioni del report</h2>
                  </div>
                  <div className="internal-ai-list">
                    {searchState.report.sections.map((item) => (
                      <div key={item.id} className="internal-ai-list__row">
                        <div className="internal-ai-list__row-header">
                          <strong>{item.title}</strong>
                          <span className={statusToneClass(item.status)}>
                            {SECTION_STATUS_LABELS[item.status] ?? item.status}
                          </span>
                        </div>
                        <p className="internal-ai-muted">{item.summary}</p>
                        <ul className="internal-ai-inline-list">
                          {item.bullets.map((bullet) => (
                            <li key={`${item.id}:${bullet}`}>{bullet}</li>
                          ))}
                        </ul>
                        {item.notes.length ? (
                          <ul className="internal-ai-inline-list">
                            {item.notes.map((note) => (
                              <li key={`${item.id}:note:${note}`}>{note}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </article>

                <article className="next-panel">
                  <div className="next-panel__header">
                    <h2>Fonti lette</h2>
                  </div>
                  <div className="internal-ai-list">
                    {searchState.report.sources.map((source) => (
                      <div key={source.id} className="internal-ai-list__row">
                        <div className="internal-ai-list__row-header">
                          <strong>{source.title}</strong>
                          <span className={statusToneClass(source.status)}>
                            {SOURCE_STATUS_LABELS[source.status] ?? source.status}
                          </span>
                        </div>
                        <p className="internal-ai-muted">{source.description}</p>
                        <div className="internal-ai-pill-row">
                          {source.datasetLabels.map((dataset) => (
                            <span key={`${source.id}:${dataset}`} className="internal-ai-pill is-neutral">
                              {dataset}
                            </span>
                          ))}
                          {source.countLabel ? (
                            <span className="internal-ai-pill is-neutral">{source.countLabel}</span>
                          ) : null}
                        </div>
                        {source.notes.length ? (
                          <ul className="internal-ai-inline-list">
                            {source.notes.map((note) => (
                              <li key={`${source.id}:source-note:${note}`}>{note}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <div className="next-section-grid">
                <article className="next-panel next-tone next-tone--warning">
                  <div className="next-panel__header">
                    <h2>Dati mancanti o da completare</h2>
                  </div>
                  {searchState.report.missingData.length ? (
                    <ul className="internal-ai-inline-list">
                      {searchState.report.missingData.map((entry) => (
                        <li key={entry}>{entry}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="next-panel__description">
                      Nessun dato mancante rilevante emerso per questa anteprima.
                    </p>
                  )}
                </article>

                <article className="next-panel">
                  <div className="next-panel__header">
                    <h2>Evidenze e segnali</h2>
                  </div>
                  <ul className="internal-ai-inline-list">
                    {searchState.report.evidences.map((entry) => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </>
          ) : null}

          <div className="next-section-grid">
            <article className="next-panel">
              <div className="next-panel__header">
              <h2>Contratti segnaposto predisposti</h2>
              </div>
              <div className="internal-ai-list">
                {snapshot.contractCatalog.map((contract) => (
                  <div key={contract.id} className="internal-ai-list__row">
                    <div className="internal-ai-list__row-header">
                      <strong>{contract.title}</strong>
                      <div className="internal-ai-pill-row">
                        <span className="internal-ai-pill is-warning">Solo contratto</span>
                        <span className="internal-ai-pill is-danger">Esecuzione disattivata</span>
                      </div>
                    </div>
                    <p className="internal-ai-muted">{contract.note}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="next-panel next-tone next-tone--warning">
              <div className="next-panel__header">
                <h2>Guard rail attivi</h2>
              </div>
              <ul className="internal-ai-inline-list">
                <li>Nessun runtime `aiCore`, `estrazioneDocumenti`, `analisi` o PDF legacy.</li>
                <li>Nessuna lettura o scrittura su Firestore/Storage business fuori dai layer NEXT.</li>
                <li>Nessun provider o segreto lato client.</li>
                <li>Nessun hook globale attivo fuori dal subtree IA interno.</li>
              </ul>
              <p className="internal-ai-card__meta">
                L&apos;archivio artifact usa solo persistenza locale isolata namespaced del clone, con
                fallback in memoria e senza impatto sul gestionale corrente.
              </p>
            </article>
          </div>
        </>
      ) : null}

      {sectionId === "sessions" ? (
        <article className="next-panel">
          <div className="next-panel__header">
            <h2>Sessioni (`ai_sessions`)</h2>
          </div>
          <div className="internal-ai-list">
            {snapshot.sessions.map((session) => (
              <div key={session.id} className="internal-ai-list__row">
                <div className="internal-ai-list__row-header">
                  <strong>{session.title}</strong>
                  <span className={statusToneClass(session.status)}>
                    {SESSION_STATUS_LABELS[session.status] ?? session.status}
                  </span>
                </div>
                <p className="internal-ai-muted">
                  Ambito: <code>{session.scope}</code>
                </p>
                {renderPreviewState(session.previewState)}
                {renderApprovalState(session.approvalState)}
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {sectionId === "requests" ? (
        <article className="next-panel">
          <div className="next-panel__header">
            <h2>Richieste (`ai_requests`)</h2>
          </div>
          <div className="internal-ai-list">
            {snapshot.requests.map((request) => (
              <div key={request.id} className="internal-ai-list__row">
                <div className="internal-ai-list__row-header">
                  <strong>{request.title}</strong>
                  <span className={statusToneClass(request.status)}>
                    {APPROVAL_STATUS_LABELS[request.approvalState.status] ?? request.status}
                  </span>
                </div>
                <p className="internal-ai-muted">
                  Obiettivo: {REQUEST_TARGET_LABELS[request.target] ?? request.target} | Contratti:{" "}
                  {request.requestedAdapters
                    .map((adapterId) => contractLabelMap.get(adapterId) ?? adapterId)
                    .join(", ")}
                </p>
                {renderPreviewState(request.previewState)}
                {renderApprovalState(request.approvalState)}
                <p className="internal-ai-card__meta">{request.note}</p>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {sectionId === "artifacts" ? (
        <div className="next-section-grid">
          <article className="next-panel">
            <div className="next-panel__header">
              <h2>Archivio artifact IA (`analysis_artifacts`)</h2>
            </div>
            <div className="internal-ai-list">
              {snapshot.artifacts.map((artifact) => (
                <div key={artifact.id} className="internal-ai-list__row">
                  <div className="internal-ai-list__row-header">
                    <strong>{artifact.title}</strong>
                    <span className={statusToneClass(artifact.status)}>
                      {ARTIFACT_STATUS_LABELS[artifact.status] ?? artifact.status}
                    </span>
                  </div>
                  <p className="internal-ai-muted">
                    Tipo: {ARTIFACT_KIND_LABELS[artifact.kind] ?? artifact.kind} | targa:{" "}
                    {artifact.mezzoTarga ?? "non applicabile"} | storage:{" "}
                    {ARTIFACT_STORAGE_LABELS[artifact.storageMode] ?? artifact.storageMode} |
                    persistito: {artifact.isPersisted ? "si" : "no"}
                  </p>
                  <p className="internal-ai-muted">
                    Creato: {formatDateLabel(artifact.createdAt)} | Aggiornato:{" "}
                    {formatDateLabel(artifact.updatedAt)}
                  </p>
                  {artifact.tags.length ? (
                    <div className="internal-ai-pill-row">
                      {artifact.tags.map((tag) => (
                        <span key={`${artifact.id}:tag:${tag}`} className="internal-ai-pill is-neutral">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <p className="internal-ai-card__meta">{artifact.note}</p>
                  <div className="internal-ai-button-row">
                    {artifact.payload ? (
                      <button
                        type="button"
                        className="internal-ai-search__button"
                        onClick={() => handleOpenArtifact(artifact.id)}
                      >
                        Apri artifact
                      </button>
                    ) : null}
                    {artifact.status !== "archived" ? (
                      <button
                        type="button"
                        className="internal-ai-search__button"
                        onClick={() => handleArchiveArtifact(artifact.id)}
                      >
                        Porta ad archiviato
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </article>
          <article className="next-panel next-tone">
            <div className="next-panel__header">
              <h2>Decisione archivio artifact</h2>
            </div>
            <p className="next-panel__description">
              In questo step la scelta piu sicura e un archivio locale isolato e namespaced nel
              browser del clone. Firestore e Storage reali restano fuori: le policy effettive non
              sono dimostrate nel repo e l&apos;app continua a usare auth anonima.
            </p>
          </article>
        </div>
      ) : null}

      {sectionId === "artifacts" && openedArtifact ? (
        <article className="next-panel">
          <div className="next-panel__header">
            <h2>Artifact aperto</h2>
          </div>
          <p className="next-panel__description">
            {openedArtifact.title} {openedArtifact.mezzoTarga ? `per la targa ${openedArtifact.mezzoTarga}` : ""}
          </p>
          {openedArtifact.payload ? (
            <>
              {renderPreviewState(openedArtifact.payload.report.previewState)}
              {renderApprovalState(openedArtifact.payload.report.approvalState)}
              <div className="internal-ai-grid">
                {openedArtifact.payload.report.cards.map((card) => (
                  <article key={`${openedArtifact.id}:${card.label}`} className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">{card.label}</p>
                    <h3>{card.value}</h3>
                    <p className="internal-ai-card__meta">{card.meta}</p>
                  </article>
                ))}
              </div>
              <div className="internal-ai-list" style={{ marginTop: 16 }}>
                <div className="internal-ai-list__row">
                  <div className="internal-ai-list__row-header">
                    <strong>Fonti lette</strong>
                    <span className="internal-ai-pill is-neutral">
                      {openedArtifact.payload.report.sources.length} fonti
                    </span>
                  </div>
                  <div className="internal-ai-pill-row">
                    {openedArtifact.payload.sourceDatasetLabels.map((dataset) => (
                      <span
                        key={`${openedArtifact.id}:dataset:${dataset}`}
                        className="internal-ai-pill is-neutral"
                      >
                        {dataset}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="internal-ai-list__row">
                  <div className="internal-ai-list__row-header">
                    <strong>Dati mancanti</strong>
                    <span className="internal-ai-pill is-warning">
                      {openedArtifact.payload.missingDataCount}
                    </span>
                  </div>
                  <ul className="internal-ai-inline-list">
                    {openedArtifact.payload.report.missingData.map((entry) => (
                      <li key={`${openedArtifact.id}:missing:${entry}`}>{entry}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <p className="next-panel__description">
              Questo artifact non contiene una preview apribile: resta un record tecnico di supporto
              dell&apos;archivio IA interno.
            </p>
          )}
        </article>
      ) : null}

      {sectionId === "audit" ? (
        <div className="next-section-grid">
          <article className="next-panel">
            <div className="next-panel__header">
              <h2>Registro audit (`ai_audit_log`)</h2>
            </div>
            <div className="internal-ai-list">
              {snapshot.auditLog.map((entry) => (
                <div key={entry.id} className="internal-ai-list__row">
                  <div className="internal-ai-list__row-header">
                    <strong>{AUDIT_SCOPE_LABELS[entry.scope] ?? entry.scope}</strong>
                    <div className="internal-ai-pill-row">
                      <span className={statusToneClass(entry.severity)}>
                        {AUDIT_SEVERITY_LABELS[entry.severity] ?? entry.severity}
                      </span>
                      <span className={statusToneClass(entry.riskLevel)}>
                        {AUDIT_RISK_LABELS[entry.riskLevel] ?? entry.riskLevel}
                      </span>
                    </div>
                  </div>
                  <p className="internal-ai-muted">{entry.message}</p>
                  <p className="internal-ai-card__meta">{formatDateLabel(entry.createdAt)}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="next-panel">
            <div className="next-panel__header">
              <h2>Tracking d'uso isolato</h2>
            </div>
            <p className="next-panel__description">
              Modalita:{" "}
              <code>
                {tracking.mode === "local_storage_isolated"
                  ? "memoria locale persistente IA"
                  : "solo memoria locale"}
              </code>
              . Nessuna attivazione globale; conteggio solo per la famiglia{" "}
              <code>/next/ia/interna*</code>.
            </p>
            <div className="internal-ai-pill-row">
              <span className="internal-ai-pill is-neutral">
                Visite totali: {tracking.totalVisits}
              </span>
              <span className="internal-ai-pill is-neutral">
                Eventi tracciati: {tracking.totalEvents}
              </span>
              {Object.entries(tracking.sectionCounts).map(([id, count]) => (
                <span key={id} className="internal-ai-pill is-neutral">
                  {SECTION_CONFIGS[id as NextInternalAiSectionId].title}: {count}
                </span>
              ))}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}

export default NextInternalAiPage;
