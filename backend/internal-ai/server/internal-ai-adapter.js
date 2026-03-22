import "dotenv/config";
import bodyParser from "body-parser";
import express from "express";
import OpenAI from "openai";
import {
  appendTraceabilityEntry,
  getInternalAiRuntimeDataRoot,
  readArtifactsState,
  readMemoryState,
  readPreviewWorkflowState,
  readVehicleContextSnapshot,
  writeArtifactsState,
  writeMemoryState,
  writePreviewWorkflowState,
  writeVehicleContextSnapshot,
} from "./internal-ai-persistence.js";

const host = process.env.INTERNAL_AI_BACKEND_HOST || "127.0.0.1";
const port = Number(process.env.INTERNAL_AI_BACKEND_PORT || "4310");
const app = express();

app.use(bodyParser.json({ limit: "2mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
});

function buildTraceabilityEntry(args) {
  return {
    id: `trace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    endpointId: args.endpointId,
    operation: args.operation,
    actorId: args.actorId ?? null,
    requestId: args.requestId ?? null,
    note: args.note,
    entityCount: args.entityCount ?? null,
  };
}

function sendEnvelope(res, args) {
  res.status(args.httpStatus).json({
    ok: args.ok,
    endpointId: args.endpointId,
    status: args.status,
    message: args.message,
    data: args.data,
  });
}

function normalizeTarga(value) {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : "";
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function uniqueStrings(values) {
  return Array.from(new Set((values ?? []).filter(Boolean)));
}

function getProviderTarget() {
  return {
    provider: "openai",
    api: "responses",
    model: process.env.INTERNAL_AI_OPENAI_MODEL?.trim() || "gpt-5-mini",
  };
}

function isProviderConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function getProviderClient() {
  if (!isProviderConfigured()) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function buildVehicleSnapshotMeta(snapshot) {
  return {
    domainCode: snapshot.domainCode,
    activeReadOnlyDataset: snapshot.activeReadOnlyDataset,
    fileAvailabilityDataset: snapshot.fileAvailabilityDataset,
    seededAt: snapshot.seededAt,
    counts: snapshot.counts,
    flottaLimitations: snapshot.flottaLimitations ?? [],
    fileAvailabilityLimitations: snapshot.fileAvailabilityLimitations ?? [],
    notes: snapshot.notes ?? [],
  };
}

function buildReportSummaryContext(report) {
  if (!report || typeof report !== "object") {
    return null;
  }

  const targetLabel =
    typeof report.targetLabel === "string" && report.targetLabel
      ? report.targetLabel
      : typeof report.mezzoTarga === "string" && report.mezzoTarga
        ? report.mezzoTarga
        : report?.header?.nomeCompleto ||
          report?.header?.nomeCompletoAutista ||
          report?.header?.targa ||
          "Target non disponibile";

  const sourceLabels = uniqueStrings(
    Array.isArray(report.sources)
      ? report.sources.flatMap((source) => source.datasetLabels ?? [])
      : [],
  ).slice(0, 8);

  return {
    reportType: typeof report.reportType === "string" ? report.reportType : "targa",
    title: typeof report.title === "string" ? report.title : "Report senza titolo",
    subtitle:
      typeof report.subtitle === "string" ? report.subtitle : "Sottotitolo non disponibile",
    targetLabel,
    periodLabel:
      typeof report?.periodContext?.label === "string"
        ? report.periodContext.label
        : "Periodo non disponibile",
    generatedAt:
      typeof report.generatedAt === "string" ? report.generatedAt : new Date().toISOString(),
    sourceCount: Array.isArray(report.sources) ? report.sources.length : 0,
    missingDataCount: Array.isArray(report.missingData) ? report.missingData.length : 0,
    evidenceCount: Array.isArray(report.evidences) ? report.evidences.length : 0,
    sourceLabels,
    cards: Array.isArray(report.cards)
      ? report.cards.slice(0, 6).map((card) => ({
          label: String(card.label ?? "Dato"),
          value: String(card.value ?? "-"),
          meta: String(card.meta ?? ""),
        }))
      : [],
    sections: Array.isArray(report.sections)
      ? report.sections.slice(0, 5).map((section) => ({
          title: String(section.title ?? "Sezione"),
          summary: String(section.summary ?? ""),
          status: String(section.status ?? "parziale"),
        }))
      : [],
    missingData: Array.isArray(report.missingData)
      ? report.missingData.slice(0, 6).map((entry) => String(entry))
      : [],
    evidences: Array.isArray(report.evidences)
      ? report.evidences.slice(0, 6).map((entry) => String(entry))
      : [],
  };
}

function buildReportSummaryReferences(report) {
  const targa =
    typeof report?.mezzoTarga === "string"
      ? report.mezzoTarga
      : typeof report?.header?.targa === "string"
        ? report.header.targa
        : typeof report?.header?.ultimoMezzoNoto === "string"
          ? report.header.ultimoMezzoNoto
          : null;

  return [
    {
      type: "report_preview",
      label: typeof report?.title === "string" ? report.title : "Report in anteprima",
      targa,
    },
    {
      type: "safe_mode_notice",
      label: "Preview IA reale controllata lato server",
      targa: null,
    },
  ];
}

function isReportSummaryPreviewRequestBody(value) {
  return (
    value &&
    typeof value === "object" &&
    value.operation === "generate_report_summary_preview" &&
    value.report &&
    typeof value.report === "object"
  );
}

function isReadReportSummaryPreviewRequestBody(value) {
  return (
    value &&
    typeof value === "object" &&
    value.operation === "read_report_summary_preview" &&
    typeof value.workflowId === "string"
  );
}

function isApprovalWorkflowRequestBody(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.workflowId === "string" &&
    ["approve_preview", "reject_preview", "rollback_preview"].includes(value.operation)
  );
}

function upsertWorkflow(state, workflow) {
  return {
    version: 1,
    items: [workflow, ...(state.items ?? []).filter((entry) => entry.id !== workflow.id)].slice(
      0,
      200,
    ),
  };
}

async function createReportSummaryPreview(args) {
  const providerClient = getProviderClient();
  if (!providerClient) {
    return {
      ok: false,
      reason: "provider_not_configured",
      message:
        "Provider reale non configurato nel runner server-side. Impostare `OPENAI_API_KEY` solo lato server per attivare la preview controllata.",
    };
  }

  const reportContext = buildReportSummaryContext(args.report);
  if (!reportContext) {
    return {
      ok: false,
      reason: "validation_error",
      message: "Contesto report non valido per la sintesi server-side.",
    };
  }

  const providerTarget = getProviderTarget();
  const userPayload = {
    promptLabel:
      typeof args.promptLabel === "string" && args.promptLabel.trim()
        ? args.promptLabel.trim()
        : `Sintesi guidata del report ${reportContext.targetLabel}`,
    reportContext,
  };

  const response = await providerClient.responses.create({
    model: providerTarget.model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "Sei il motore server-side della nuova IA interna del gestionale. " +
              "Lavora solo in italiano. Usa esclusivamente il contesto strutturato ricevuto. " +
              "Non inventare dati mancanti, non proporre scritture business e non descrivere azioni automatiche. " +
              "Restituisci una preview testuale breve e chiara, con massimo 3 blocchi: sintesi, punti solidi, limiti o dati mancanti.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(userPayload, null, 2),
          },
        ],
      },
    ],
  });

  const previewText =
    typeof response.output_text === "string" ? response.output_text.trim() : "";

  if (!previewText) {
    return {
      ok: false,
      reason: "upstream_error",
      message:
        "Il provider reale ha risposto senza testo utile per la preview controllata.",
    };
  }

  const now = new Date().toISOString();
  const traceEntry = await appendTraceabilityEntry(
    buildTraceabilityEntry({
      endpointId: "artifacts.preview",
      operation: "generate_report_summary_preview",
      actorId: args.actorId,
      requestId: args.requestId,
      note: `Preview server-side generata con ${providerTarget.provider}/${providerTarget.model} per ${reportContext.targetLabel}.`,
      entityCount: 1,
    }),
  );

  const workflow = {
    id: createId("summary-preview"),
    requestId: args.requestId || createId("request"),
    createdAt: now,
    updatedAt: now,
    actorId: args.actorId ?? null,
    promptLabel:
      typeof args.promptLabel === "string" && args.promptLabel.trim()
        ? args.promptLabel.trim()
        : `Sintesi guidata ${reportContext.targetLabel}`,
    capabilityId: "report-summary-preview",
    artifactKind: "report_summary_preview",
    providerTarget,
    requestState: "preview_ready",
    previewState: "preview_ready",
    approvalState: "awaiting_approval",
    rollbackState: "available",
    previewText,
    previewNote:
      "Preview generata dal provider reale lato server. Nessuna applicazione automatica sui dati business.",
    traceEntryIds: [traceEntry.id],
    approvedAt: null,
    rejectedAt: null,
    rolledBackAt: null,
    reportContext,
    references: buildReportSummaryReferences(args.report),
    notes: [
      "Il provider reale lavora solo su contesto report gia letto e strutturato.",
      "L'approvazione non applica scritture business: cambia solo lo stato del workflow IA dedicato.",
      "Il rollback riguarda solo artifact e traceability del sottosistema IA separato.",
    ],
  };

  const workflowState = await readPreviewWorkflowState();
  await writePreviewWorkflowState(upsertWorkflow(workflowState, workflow));

  return {
    ok: true,
    workflow,
    traceEntryId: traceEntry.id,
    providerTarget,
  };
}

async function readReportSummaryPreview(workflowId, actorId, requestId) {
  const workflowState = await readPreviewWorkflowState();
  const workflow = (workflowState.items ?? []).find((entry) => entry.id === workflowId) ?? null;

  if (!workflow) {
    return {
      ok: false,
      status: "not_found",
      message: `Nessuna preview IA server-side trovata per workflow ${workflowId}.`,
    };
  }

  const traceEntry = await appendTraceabilityEntry(
    buildTraceabilityEntry({
      endpointId: "artifacts.preview",
      operation: "read_report_summary_preview",
      actorId,
      requestId,
      note: `Lettura preview IA server-side ${workflowId}.`,
      entityCount: 1,
    }),
  );

  const updatedWorkflow = {
    ...workflow,
    updatedAt: new Date().toISOString(),
    traceEntryIds: uniqueStrings([traceEntry.id, ...(workflow.traceEntryIds ?? [])]).slice(0, 50),
  };

  await writePreviewWorkflowState(upsertWorkflow(workflowState, updatedWorkflow));

  return {
    ok: true,
    workflow: updatedWorkflow,
    traceEntryId: traceEntry.id,
    providerTarget: updatedWorkflow.providerTarget,
  };
}

async function updatePreviewWorkflow(body) {
  const workflowState = await readPreviewWorkflowState();
  const currentWorkflow =
    (workflowState.items ?? []).find((entry) => entry.id === body.workflowId) ?? null;

  if (!currentWorkflow) {
    return {
      ok: false,
      status: "not_found",
      message: `Workflow ${body.workflowId} non trovato nel contenitore IA dedicato.`,
    };
  }

  if (body.operation === "rollback_preview" && currentWorkflow.requestState !== "approved") {
    return {
      ok: false,
      status: "validation_error",
      message:
        "Il rollback server-side e ammesso solo dopo un'approvazione esplicita della preview.",
    };
  }

  const now = new Date().toISOString();
  const nextWorkflow = {
    ...currentWorkflow,
    updatedAt: now,
  };

  if (body.operation === "approve_preview") {
    nextWorkflow.requestState = "approved";
    nextWorkflow.approvalState = "approved";
    nextWorkflow.rollbackState = "available";
    nextWorkflow.approvedAt = now;
    nextWorkflow.rejectedAt = null;
    nextWorkflow.previewNote =
      "Preview approvata esplicitamente. Nessuna azione business applicata in automatico.";
  }

  if (body.operation === "reject_preview") {
    nextWorkflow.requestState = "rejected";
    nextWorkflow.approvalState = "rejected";
    nextWorkflow.rollbackState = "not_requested";
    nextWorkflow.rejectedAt = now;
    nextWorkflow.previewNote =
      "Preview respinta esplicitamente. Nessuna azione business applicata.";
  }

  if (body.operation === "rollback_preview") {
    nextWorkflow.requestState = "rolled_back";
    nextWorkflow.rollbackState = "rolled_back";
    nextWorkflow.rolledBackAt = now;
    nextWorkflow.previewNote =
      "Rollback tracciato del workflow IA dedicato. Nessun dato business e stato toccato.";
  }

  const traceEntry = await appendTraceabilityEntry(
    buildTraceabilityEntry({
      endpointId: "approvals.prepare",
      operation: body.operation,
      actorId: body.actorId,
      requestId: body.requestId,
      note:
        body.note && typeof body.note === "string" && body.note.trim()
          ? body.note.trim()
          : `Workflow ${body.workflowId} aggiornato con operazione ${body.operation}.`,
      entityCount: 1,
    }),
  );

  nextWorkflow.traceEntryIds = uniqueStrings([
    traceEntry.id,
    ...(currentWorkflow.traceEntryIds ?? []),
  ]).slice(0, 50);
  nextWorkflow.notes = uniqueStrings([
    ...(currentWorkflow.notes ?? []),
    body.note && typeof body.note === "string" ? body.note.trim() : "",
  ]).slice(0, 8);

  await writePreviewWorkflowState(upsertWorkflow(workflowState, nextWorkflow));

  return {
    ok: true,
    workflow: nextWorkflow,
    traceEntryId: traceEntry.id,
  };
}

app.get("/internal-ai-backend/health", async (_req, res) => {
  const providerTarget = getProviderTarget();

  sendEnvelope(res, {
    httpStatus: 200,
    ok: true,
    endpointId: "health",
    status: "ok",
    message:
      "Adapter server-side del backend IA separato disponibile con persistenza IA dedicata, retrieval read-only e primo workflow preview/approval/rollback controllato.",
    data: {
      adapterState: "server_adapter_mock_safe",
      persistenceMode: "server_file_isolated",
      runtimeDataRoot: "backend/internal-ai/runtime-data",
      providerEnabled: isProviderConfigured(),
      providerTarget,
      businessWritesEnabled: false,
      legacyCanonicalBackendEnabled: false,
      workflowEndpointsEnabled: ["artifacts.preview", "approvals.prepare"],
      notes: [
        "Il provider reale e ammesso solo lato server e solo per output di preview/proposta.",
        "L'approvazione e il rollback aggiornano solo artifact e traceability IA dedicati.",
        "Nessun dato business Firestore o Storage viene scritto da questi endpoint.",
        "Il retrieval read-only attivo continua a leggere solo lo snapshot D01 seedato dal clone.",
      ],
    },
  });
});

app.post("/internal-ai-backend/orchestrator/chat", async (_req, res) => {
  sendEnvelope(res, {
    httpStatus: 501,
    ok: false,
    endpointId: "orchestrator.chat",
    status: "not_enabled",
    message:
      "La chat continua a usare il ponte backend-first mock-safe gia aperto. Il primo provider reale viene attivato in questo step solo sulla sintesi guidata dei report gia letti.",
    data: {
      nextStep:
        "Usare il workflow server-side `artifacts.preview` + `approvals.prepare` per la prima preview reale controllata.",
    },
  });
});

app.post("/internal-ai-backend/artifacts/repository", async (req, res) => {
  const operation = req.body?.operation;

  if (operation === "read_snapshot") {
    const repositoryState = await readArtifactsState();
    const traceEntry = await appendTraceabilityEntry(
      buildTraceabilityEntry({
        endpointId: "artifacts.repository",
        operation,
        actorId: req.body?.actorId,
        requestId: req.body?.requestId,
        note: "Lettura snapshot artifact/server repository IA.",
        entityCount: repositoryState.artifacts?.length ?? 0,
      }),
    );

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "artifacts.repository",
      status: "ok",
      message:
        "Snapshot artifact IA letto dal contenitore server-side dedicato in modalita mock-safe.",
      data: {
        operation,
        persistenceMode: "server_file_isolated",
        repositoryState,
        traceEntryId: traceEntry.id,
        notes: [
          "Lettura da file JSON locale del backend IA separato.",
          "Nessun dato business del gestionale coinvolto.",
        ],
      },
    });
    return;
  }

  if (operation === "replace_snapshot" && req.body?.repositoryState) {
    const repositoryState = await writeArtifactsState(req.body.repositoryState);
    const traceEntry = await appendTraceabilityEntry(
      buildTraceabilityEntry({
        endpointId: "artifacts.repository",
        operation,
        actorId: req.body?.actorId,
        requestId: req.body?.requestId,
        note: "Scrittura snapshot artifact/server repository IA.",
        entityCount: repositoryState.artifacts?.length ?? 0,
      }),
    );

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "artifacts.repository",
      status: "ok",
      message:
        "Snapshot artifact IA salvato nel contenitore server-side dedicato in modalita mock-safe.",
      data: {
        operation,
        persistenceMode: "server_file_isolated",
        repositoryState,
        traceEntryId: traceEntry.id,
        notes: [
          "Scrittura su file JSON locale del backend IA separato.",
          "Nessun passaggio su Firestore o Storage business.",
        ],
      },
    });
    return;
  }

  sendEnvelope(res, {
    httpStatus: 400,
    ok: false,
    endpointId: "artifacts.repository",
    status: "validation_error",
    message:
      "Operazione artifact repository non valida. Sono ammesse solo `read_snapshot` e `replace_snapshot`.",
    data: {
      allowedOperations: ["read_snapshot", "replace_snapshot"],
    },
  });
});

app.post("/internal-ai-backend/artifacts/preview", async (req, res) => {
  if (isReportSummaryPreviewRequestBody(req.body)) {
    try {
      const result = await createReportSummaryPreview(req.body);
      if (!result.ok) {
        sendEnvelope(res, {
          httpStatus: result.reason === "provider_not_configured" ? 503 : 400,
          ok: false,
          endpointId: "artifacts.preview",
          status: result.reason,
          message: result.message,
          data: {
            operation: "generate_report_summary_preview",
            providerConfigured: isProviderConfigured(),
            providerTarget: getProviderTarget(),
            notes: [
              "Il provider reale resta solo server-side e non viene mai esposto al client.",
              "Se il provider non e configurato, il clone continua a usare i fallback gia esistenti.",
            ],
          },
        });
        return;
      }

      sendEnvelope(res, {
        httpStatus: 200,
        ok: true,
        endpointId: "artifacts.preview",
        status: "ok",
        message:
          "Preview testuale generata lato server con provider reale, in modalita solo proposta e senza scritture business.",
        data: {
          operation: "generate_report_summary_preview",
          persistenceMode: "server_file_isolated",
          providerConfigured: true,
          providerTarget: result.providerTarget,
          workflow: result.workflow,
          traceEntryId: result.traceEntryId,
          notes: [
            "Il testo generato e solo una proposta di preview sopra dati gia letti e verificabili.",
            "La preview richiede approvazione esplicita e il rollback agisce solo sul workflow IA dedicato.",
          ],
        },
      });
      return;
    } catch (error) {
      sendEnvelope(res, {
        httpStatus: 502,
        ok: false,
        endpointId: "artifacts.preview",
        status: "upstream_error",
        message:
          error instanceof Error
            ? `Errore del provider reale lato server: ${error.message}`
            : "Errore non previsto durante la generazione della preview server-side.",
        data: {
          operation: "generate_report_summary_preview",
          providerConfigured: isProviderConfigured(),
          providerTarget: getProviderTarget(),
          notes: [
            "Il fallback locale del clone resta disponibile.",
            "Nessun dato business viene scritto anche in caso di errore del provider.",
          ],
        },
      });
      return;
    }
  }

  if (isReadReportSummaryPreviewRequestBody(req.body)) {
    const result = await readReportSummaryPreview(
      req.body.workflowId,
      req.body.actorId,
      req.body.requestId,
    );

    if (!result.ok) {
      sendEnvelope(res, {
        httpStatus: 404,
        ok: false,
        endpointId: "artifacts.preview",
        status: result.status,
        message: result.message,
        data: {
          operation: "read_report_summary_preview",
        },
      });
      return;
    }

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "artifacts.preview",
      status: "ok",
      message: "Preview server-side letta dal contenitore IA dedicato.",
      data: {
        operation: "read_report_summary_preview",
        persistenceMode: "server_file_isolated",
        providerConfigured: true,
        providerTarget: result.providerTarget,
        workflow: result.workflow,
        traceEntryId: result.traceEntryId,
        notes: [
          "Lettura da file JSON IA dedicato e separato dai dataset business.",
        ],
      },
    });
    return;
  }

  sendEnvelope(res, {
    httpStatus: 400,
    ok: false,
    endpointId: "artifacts.preview",
    status: "validation_error",
    message:
      "Operazione artifacts.preview non valida. Sono ammesse `generate_report_summary_preview` e `read_report_summary_preview`.",
    data: {
      allowedOperations: [
        "generate_report_summary_preview",
        "read_report_summary_preview",
      ],
    },
  });
});

app.post("/internal-ai-backend/memory/repository", async (req, res) => {
  const operation = req.body?.operation;

  if (operation === "read_tracking_summary") {
    const trackingState = await readMemoryState();
    trackingState.summary.mode = "server_file_isolated";
    const traceEntry = await appendTraceabilityEntry(
      buildTraceabilityEntry({
        endpointId: "memory.repository",
        operation,
        actorId: req.body?.actorId,
        requestId: req.body?.requestId,
        note: "Lettura memoria operativa IA server-side.",
        entityCount: trackingState.summary.totalEvents ?? 0,
      }),
    );

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "memory.repository",
      status: "ok",
      message:
        "Memoria operativa IA letta dal contenitore server-side dedicato in modalita mock-safe.",
      data: {
        operation,
        persistenceMode: "server_file_isolated",
        trackingState,
        traceEntryId: traceEntry.id,
        notes: [
          "Lettura da file JSON locale del backend IA separato.",
          "Tracking isolato dalla telemetria business del gestionale.",
        ],
      },
    });
    return;
  }

  if (operation === "replace_tracking_summary" && req.body?.trackingState) {
    const nextState = {
      ...req.body.trackingState,
      summary: {
        ...req.body.trackingState.summary,
        mode: "server_file_isolated",
      },
    };
    const trackingState = await writeMemoryState(nextState);
    const traceEntry = await appendTraceabilityEntry(
      buildTraceabilityEntry({
        endpointId: "memory.repository",
        operation,
        actorId: req.body?.actorId,
        requestId: req.body?.requestId,
        note: "Scrittura memoria operativa IA server-side.",
        entityCount: trackingState.summary.totalEvents ?? 0,
      }),
    );

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "memory.repository",
      status: "ok",
      message:
        "Memoria operativa IA salvata nel contenitore server-side dedicato in modalita mock-safe.",
      data: {
        operation,
        persistenceMode: "server_file_isolated",
        trackingState,
        traceEntryId: traceEntry.id,
        notes: [
          "Scrittura su file JSON locale del backend IA separato.",
          "Nessun dato business del gestionale viene tracciato da questo endpoint.",
        ],
      },
    });
    return;
  }

  sendEnvelope(res, {
    httpStatus: 400,
    ok: false,
    endpointId: "memory.repository",
    status: "validation_error",
    message:
      "Operazione memory repository non valida. Sono ammesse solo `read_tracking_summary` e `replace_tracking_summary`.",
    data: {
      allowedOperations: ["read_tracking_summary", "replace_tracking_summary"],
    },
  });
});

app.post("/internal-ai-backend/retrieval/read", async (req, res) => {
  const operation = req.body?.operation;

  if (operation === "seed_vehicle_context_snapshot" && req.body?.snapshot) {
    const nextSnapshot = {
      ...req.body.snapshot,
      version: 1,
      seededAt: req.body.snapshot.seededAt || new Date().toISOString(),
    };
    const snapshot = await writeVehicleContextSnapshot(nextSnapshot);
    const traceEntry = await appendTraceabilityEntry(
      buildTraceabilityEntry({
        endpointId: "retrieval.read",
        operation,
        actorId: req.body?.actorId,
        requestId: req.body?.requestId,
        note: "Seed snapshot read-only D01 per retrieval server-side IA.",
        entityCount: snapshot.items?.length ?? 0,
      }),
    );

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "retrieval.read",
      status: "ok",
      message:
        "Snapshot read-only dei mezzi seedato nel backend IA separato per il primo retrieval server-side controllato.",
      data: {
        operation,
        persistenceMode: "server_file_isolated",
        sourceMode: snapshot.sourceMode,
        snapshotMeta: buildVehicleSnapshotMeta(snapshot),
        vehicleContext: null,
        traceEntryId: traceEntry.id,
        notes: [
          "Seed eseguito da layer clone-safe gia validato sul frontend.",
          "Nessuna lettura diretta Firestore o Storage business dal backend in questo step.",
        ],
      },
    });
    return;
  }

  if (operation === "read_vehicle_context_by_targa" && typeof req.body?.rawTarga === "string") {
    const normalizedTarga = normalizeTarga(req.body.rawTarga);

    if (!normalizedTarga) {
      sendEnvelope(res, {
        httpStatus: 400,
        ok: false,
        endpointId: "retrieval.read",
        status: "validation_error",
        message: "La lettura server-side del contesto mezzo richiede una targa valida.",
        data: {
          allowedOperations: ["seed_vehicle_context_snapshot", "read_vehicle_context_by_targa"],
        },
      });
      return;
    }

    const snapshot = await readVehicleContextSnapshot();
    if (!snapshot.seededAt) {
      sendEnvelope(res, {
        httpStatus: 404,
        ok: false,
        endpointId: "retrieval.read",
        status: "not_found",
        message:
          "Nessuno snapshot read-only dei mezzi e ancora disponibile nel backend IA separato.",
        data: {
          snapshotMeta: buildVehicleSnapshotMeta(snapshot),
          allowedOperations: ["seed_vehicle_context_snapshot", "read_vehicle_context_by_targa"],
        },
      });
      return;
    }

    const vehicleContext =
      snapshot.items?.find((entry) => normalizeTarga(entry?.targa) === normalizedTarga) ?? null;
    const traceEntry = await appendTraceabilityEntry(
      buildTraceabilityEntry({
        endpointId: "retrieval.read",
        operation,
        actorId: req.body?.actorId,
        requestId: req.body?.requestId,
        note: vehicleContext
          ? `Lettura server-side contesto mezzo ${normalizedTarga} da snapshot read-only IA.`
          : `Nessun mezzo ${normalizedTarga} trovato nello snapshot read-only IA.`,
        entityCount: vehicleContext ? 1 : 0,
      }),
    );

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "retrieval.read",
      status: "ok",
      message: vehicleContext
        ? `Contesto mezzo ${normalizedTarga} letto dal retrieval server-side IA su snapshot read-only dedicato.`
        : `Nessun mezzo ${normalizedTarga} trovato nello snapshot read-only del backend IA separato.`,
      data: {
        operation,
        persistenceMode: "server_file_isolated",
        sourceMode: snapshot.sourceMode,
        snapshotMeta: buildVehicleSnapshotMeta(snapshot),
        vehicleContext,
        traceEntryId: traceEntry.id,
        notes: [
          "Retrieval read-only servito da contenitore IA dedicato e separato dai dataset business.",
          "Il backend non legge ancora Firestore o Storage business in modo diretto.",
        ],
      },
    });
    return;
  }

  sendEnvelope(res, {
    httpStatus: 400,
    ok: false,
    endpointId: "retrieval.read",
    status: "validation_error",
    message:
      "Operazione retrieval.read non valida. Sono ammesse solo `seed_vehicle_context_snapshot` e `read_vehicle_context_by_targa`.",
    data: {
      allowedOperations: ["seed_vehicle_context_snapshot", "read_vehicle_context_by_targa"],
    },
  });
});

app.post("/internal-ai-backend/approvals/prepare", async (req, res) => {
  if (!isApprovalWorkflowRequestBody(req.body)) {
    sendEnvelope(res, {
      httpStatus: 400,
      ok: false,
      endpointId: "approvals.prepare",
      status: "validation_error",
      message:
        "Operazione approvals.prepare non valida. Sono ammesse `approve_preview`, `reject_preview` e `rollback_preview`.",
      data: {
        allowedOperations: ["approve_preview", "reject_preview", "rollback_preview"],
      },
    });
    return;
  }

  const result = await updatePreviewWorkflow(req.body);
  if (!result.ok) {
    sendEnvelope(res, {
      httpStatus: result.status === "not_found" ? 404 : 409,
      ok: false,
      endpointId: "approvals.prepare",
      status: result.status,
      message: result.message,
      data: {
        operation: req.body.operation,
        workflowId: req.body.workflowId,
      },
    });
    return;
  }

  sendEnvelope(res, {
    httpStatus: 200,
    ok: true,
    endpointId: "approvals.prepare",
    status: "ok",
    message:
      "Workflow preview/approval/rollback aggiornato nel contenitore IA dedicato, senza scritture business.",
    data: {
      operation: req.body.operation,
      persistenceMode: "server_file_isolated",
      workflow: result.workflow,
      traceEntryId: result.traceEntryId,
      notes: [
        "Lo stato cambia solo nel workflow IA dedicato.",
        "Nessun writer Firestore o Storage business viene attivato da questo endpoint.",
      ],
    },
  });
});

app.listen(port, host, () => {
  console.log(
    `[internal-ai-adapter] attivo su http://${host}:${port}/internal-ai-backend | runtime-data=${getInternalAiRuntimeDataRoot()}`,
  );
});
