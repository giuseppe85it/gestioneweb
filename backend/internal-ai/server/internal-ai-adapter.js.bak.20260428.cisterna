import "dotenv/config";
import bodyParser from "body-parser";
import express from "express";
import OpenAI from "openai";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  appendTraceabilityEntry,
  readAttachmentsState,
  getInternalAiRuntimeDataRoot,
  readArtifactsState,
  readMemoryState,
  readPreviewWorkflowState,
  readRepoUnderstandingSnapshot,
  readVehicleContextSnapshot,
  readVehicleDossierSnapshot,
  writeArtifactsState,
  writeAttachmentsState,
  writeMemoryState,
  writePreviewWorkflowState,
  writeRepoUnderstandingSnapshot,
  writeVehicleContextSnapshot,
  writeVehicleDossierSnapshot,
} from "./internal-ai-persistence.js";
import {
  buildInternalAiChatAttachmentAssetPath,
  buildInternalAiChatAttachmentFilePath,
  createAttachmentId,
  deleteInternalAiChatAttachmentFile,
  getInternalAiChatAttachmentMaxSizeBytes,
  materializeInternalAiChatAttachmentRecord,
  writeInternalAiChatAttachmentFile,
} from "./internal-ai-chat-attachments.js";
import {
  extractInternalAiDocumentAnalysis,
  extractPreventivoPriceFromDocument,
  LIBRETTO_CANONICAL_FIELDS,
} from "./internal-ai-document-extraction.js";
import {
  buildRepoOperationalAnswer,
  buildRepoUnderstandingMeta,
  buildRepoUnderstandingReferences,
  buildRepoUnderstandingSnapshot,
  isRepoUnderstandingQuestion,
  trimRepoUnderstandingSnapshotForChat,
} from "./internal-ai-repo-understanding.js";
import { getNextRuntimeObserverDirPath } from "./internal-ai-next-runtime-observer.js";
import { buildFirebaseReadinessSnapshot } from "./internal-ai-firebase-readiness.js";
import { probeInternalAiFirebaseAdminRuntime } from "./internal-ai-firebase-admin.js";

const host = process.env.INTERNAL_AI_BACKEND_HOST || "127.0.0.1";
const port = Number(process.env.INTERNAL_AI_BACKEND_PORT || "4310");
const app = express();

app.use(bodyParser.json({ limit: "12mb" }));
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

function formatMaintenanceMissingFields(fields) {
  const labels = {
    targa: "Targa del mezzo",
    fornitore: "Fornitore officina",
    dataDocumento: "Data documento",
    totaleDocumento: "Totale documento",
    righe: "Righe materiali / manodopera / ricambi",
  };

  return uniqueStrings((fields ?? []).map((field) => labels[field] ?? field));
}

function buildMaintenanceSummary(analysis) {
  if (typeof analysis?.riassuntoBreve === "string" && analysis.riassuntoBreve.trim()) {
    return analysis.riassuntoBreve.trim();
  }

  const parts = [];
  if (analysis?.targa) {
    parts.push(`mezzo ${analysis.targa}`);
  }
  if (analysis?.fornitore) {
    parts.push(`officina ${analysis.fornitore}`);
  }
  if (analysis?.dataDocumento) {
    parts.push(`data ${analysis.dataDocumento}`);
  }
  if (analysis?.totaleDocumento !== null && analysis?.totaleDocumento !== undefined) {
    parts.push(`totale ${analysis.totaleDocumento}`);
  }

  if (parts.length > 0) {
    return `Documento manutenzione letto: ${parts.join(", ")}.`;
  }

  return "Documento manutenzione letto con campi ancora da verificare.";
}

function mapMaintenanceReviewRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => ({
    descrizione: typeof row?.descrizione === "string" ? row.descrizione : null,
    categoria: typeof row?.categoria === "string" ? row.categoria : null,
    quantita: row?.quantita ?? null,
    unita: typeof row?.unita === "string" ? row.unita : null,
    prezzoUnitario: row?.prezzoUnitario ?? null,
    importo: row?.totaleRiga ?? null,
    totale: row?.totaleRiga ?? null,
    codiceArticolo: typeof row?.codiceArticolo === "string" ? row.codiceArticolo : null,
    codice: typeof row?.codiceArticolo === "string" ? row.codiceArticolo : null,
  }));
}

function buildMaintenanceWarnings(analysis) {
  const warnings = [
    ...(Array.isArray(analysis?.warnings)
      ? analysis.warnings.map((entry) => entry?.message ?? entry?.code)
      : []),
    ...(Array.isArray(analysis?.noteImportanti) ? analysis.noteImportanti : []),
  ];
  return uniqueStrings(warnings);
}

function formatVehicleDocumentMissingFields(fields) {
  const labels = {
    sottotipoDocumento: "Sottotipo documento",
    targa: "Targa del mezzo",
    dataDocumento: "Data documento",
  };

  return uniqueStrings((fields ?? []).map((field) => labels[field] ?? field));
}

function isLibrettoVehicleDocumentAnalysis(analysis) {
  return (analysis?.sottotipoDocumento ?? analysis?.tipoDocumento) === "libretto";
}

function mapCanonicalLibrettoAnalysisFields(analysis) {
  const output = {};
  LIBRETTO_CANONICAL_FIELDS.forEach((field) => {
    output[field] = typeof analysis?.[field] === "string" ? analysis[field] : "";
  });
  return output;
}

function buildVehicleDocumentSummary(analysis) {
  if (typeof analysis?.riassuntoBreve === "string" && analysis.riassuntoBreve.trim()) {
    return analysis.riassuntoBreve.trim();
  }

  const parts = [];
  if (analysis?.sottotipoDocumento || analysis?.tipoDocumento) {
    parts.push(analysis.sottotipoDocumento || analysis.tipoDocumento);
  }
  if (analysis?.targa) {
    parts.push(`mezzo ${analysis.targa}`);
  }
  if (analysis?.dataDocumento) {
    parts.push(`data ${analysis.dataDocumento}`);
  }
  if (analysis?.dataScadenza || analysis?.dataScadenzaRevisione) {
    parts.push(`scadenza ${analysis.dataScadenza || analysis.dataScadenzaRevisione}`);
  }

  if (parts.length > 0) {
    return `Documento mezzo letto: ${parts.join(", ")}.`;
  }

  return "Documento mezzo letto con campi ancora da verificare.";
}

function buildVehicleDocumentWarnings(analysis) {
  const warnings = [
    ...(Array.isArray(analysis?.warnings)
      ? analysis.warnings.map((entry) => entry?.message ?? entry?.code)
      : []),
    ...(Array.isArray(analysis?.noteImportanti) ? analysis.noteImportanti : []),
  ];
  return uniqueStrings(warnings);
}

function formatPreventivoMissingFields(fields) {
  const labels = {
    fornitore: "Fornitore",
    numeroDocumento: "Numero preventivo",
    dataDocumento: "Data preventivo",
    righe: "Righe materiali",
  };

  return uniqueStrings((fields ?? []).map((field) => labels[field] ?? field));
}

function buildPreventivoSummary(analysis) {
  if (typeof analysis?.riassuntoBreve === "string" && analysis.riassuntoBreve.trim()) {
    return analysis.riassuntoBreve.trim();
  }

  const parts = [];
  if (analysis?.fornitore) {
    parts.push(`fornitore ${analysis.fornitore}`);
  }
  if (analysis?.numeroDocumento) {
    parts.push(`numero ${analysis.numeroDocumento}`);
  }
  if (analysis?.dataDocumento) {
    parts.push(`data ${analysis.dataDocumento}`);
  }
  if (analysis?.totaleDocumento !== null && analysis?.totaleDocumento !== undefined) {
    parts.push(`totale ${analysis.totaleDocumento}`);
  }

  if (parts.length > 0) {
    return `Preventivo letto: ${parts.join(", ")}.`;
  }

  return "Preventivo letto con campi ancora da verificare.";
}

function buildPreventivoWarnings(analysis) {
  const warnings = [
    ...(Array.isArray(analysis?.warnings)
      ? analysis.warnings.map((entry) => entry?.message ?? entry?.code)
      : []),
    ...(Array.isArray(analysis?.noteImportanti) ? analysis.noteImportanti : []),
  ];
  return uniqueStrings(warnings);
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isAttachmentsRepositoryRequestBody(value) {
  return (
    value &&
    typeof value === "object" &&
    [
      "list_thread_attachments",
      "upload_thread_attachment",
      "remove_thread_attachment",
    ].includes(value.operation)
  );
}

function sanitizeAttachmentInputText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function sanitizeChatAttachments(attachments) {
  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments
    .filter((entry) => entry && typeof entry === "object")
    .slice(0, 6)
    .map((entry) => ({
      id: typeof entry.id === "string" ? entry.id : createId("attach-ref"),
      fileName:
        typeof entry.fileName === "string" && entry.fileName.trim()
          ? entry.fileName.trim()
          : "Allegato IA-only",
      mimeType: sanitizeAttachmentInputText(entry.mimeType),
      sizeBytes: Number.isFinite(entry.sizeBytes) ? Number(entry.sizeBytes) : 0,
      kind: typeof entry.kind === "string" ? entry.kind : "other",
      storageMode:
        entry.storageMode === "server_file_isolated" ? "server_file_isolated" : "local_browser_only",
      persisted: Boolean(entry.persisted),
      note:
        typeof entry.note === "string" && entry.note.trim()
          ? entry.note.trim()
          : "Allegato IA-only collegato al thread.",
      textExcerpt:
        typeof entry.textExcerpt === "string" && entry.textExcerpt.trim()
          ? entry.textExcerpt.trim().slice(0, 1600)
          : null,
      documentAnalysis:
        entry.documentAnalysis && typeof entry.documentAnalysis === "object"
          ? entry.documentAnalysis
          : null,
    }));
}

function normalizeAttachmentsRepositoryState(repositoryState) {
  return {
    version: 1,
    items: Array.isArray(repositoryState?.items)
      ? repositoryState.items
          .filter((entry) => entry && typeof entry === "object")
          .map((entry) => ({
            ...entry,
            documentAnalysis:
              entry.documentAnalysis && typeof entry.documentAnalysis === "object"
                ? entry.documentAnalysis
                : null,
          }))
      : [],
  };
}

function normalizeMemoryHints(memoryHints) {
  if (!memoryHints || typeof memoryHints !== "object") {
    return null;
  }

  return {
    repoUiRequested: Boolean(memoryHints.repoUiRequested),
    memoryFreshness:
      memoryHints.memoryFreshness === "fresh" ||
      memoryHints.memoryFreshness === "partial" ||
      memoryHints.memoryFreshness === "stale"
        ? memoryHints.memoryFreshness
        : "missing",
    screenHint:
      typeof memoryHints.screenHint === "string" && memoryHints.screenHint.trim()
        ? memoryHints.screenHint.trim()
        : null,
    focusKind:
      memoryHints.focusKind === "repo_ui" ||
      memoryHints.focusKind === "report" ||
      memoryHints.focusKind === "attachment"
        ? memoryHints.focusKind
        : "general",
    attachmentsCount: Number.isFinite(memoryHints.attachmentsCount)
      ? Number(memoryHints.attachmentsCount)
      : 0,
    runtimeObserverObserved: Boolean(memoryHints.runtimeObserverObserved),
  };
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

const CONTROLLED_CHAT_DATA_BOUNDARY = Object.freeze({
  businessLiveRead: "closed",
  businessWrites: "disabled",
  backendLiveSources: Object.freeze([
    "snapshot repo/UI curata del backend IA separato",
    "snapshot D01 seedata dal clone NEXT",
    "snapshot Dossier mezzo seedata dal clone NEXT",
  ]),
  backendNotAllowedLiveSources: Object.freeze([
    "Firestore business live",
    "Storage business live",
    "runtime legacy promosso a backend canonico",
  ]),
  guidance: Object.freeze([
    "Se l'utente chiede se il dato e live o clone, rispondi che oggi il live-read business e chiuso.",
    "Se vedi retrieval server-side, significa snapshot read-only dedicata o repo snapshot curata, non lettura live business.",
    "Quando il dato non e abbastanza forte devi dichiararlo come prudente, parziale o clone/read-only.",
  ]),
});

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

function buildVehicleContextSnapshotMeta(snapshot) {
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

function buildVehicleDossierSnapshotMeta(snapshot) {
  return {
    domainCode: snapshot.domainCode,
    activeReadOnlyDatasets: snapshot.activeReadOnlyDatasets ?? [],
    seededAt: snapshot.seededAt,
    counts: snapshot.counts,
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

function sanitizeChatReferences(references) {
  if (!Array.isArray(references)) {
    return [];
  }

  return references
    .filter((entry) => entry && typeof entry === "object")
    .slice(0, 6)
    .map((entry) => ({
      type: typeof entry.type === "string" ? entry.type : "safe_mode_notice",
      label:
        typeof entry.label === "string" && entry.label.trim()
          ? entry.label.trim()
          : "Riferimento IA interno",
      targa: typeof entry.targa === "string" && entry.targa.trim() ? entry.targa.trim() : null,
      artifactId:
        typeof entry.artifactId === "string" && entry.artifactId.trim()
          ? entry.artifactId.trim()
          : undefined,
    }));
}

function normalizeChatLocalTurn(localTurn) {
  if (!localTurn || typeof localTurn !== "object") {
    return null;
  }

  return {
    intent: typeof localTurn.intent === "string" ? localTurn.intent : "richiesta_generica",
    status: typeof localTurn.status === "string" ? localTurn.status : "partial",
    assistantText:
      typeof localTurn.assistantText === "string" ? localTurn.assistantText.trim() : "",
    references: sanitizeChatReferences(localTurn.references),
    reportContext:
      localTurn.reportContext && typeof localTurn.reportContext === "object"
        ? localTurn.reportContext
        : null,
  };
}

function isControlledChatRequestBody(value) {
  return (
    value &&
    typeof value === "object" &&
    value.operation === "run_controlled_chat" &&
    typeof value.prompt === "string" &&
    value.localTurn &&
    typeof value.localTurn === "object"
  );
}

function hasCurrentFirebaseReadinessShape(firebaseReadiness) {
  return Boolean(
    firebaseReadiness &&
      Array.isArray(firebaseReadiness.sharedRequirements) &&
      firebaseReadiness.sharedRequirements.some(
        (entry) => entry && entry.id === "backend-runtime-dependencies",
      ) &&
      firebaseReadiness.sharedRequirements.some(
        (entry) => entry && entry.id === "firebase-admin-runtime-resolution",
      ),
  );
}

async function loadRepoUnderstandingSnapshot(refresh = false) {
  const currentSnapshot = await readRepoUnderstandingSnapshot();
  if (
    !refresh &&
    currentSnapshot?.builtAt &&
    Array.isArray(currentSnapshot.documents) &&
    currentSnapshot.documents.length > 0 &&
    Array.isArray(currentSnapshot.repoZones) &&
    Array.isArray(currentSnapshot.fileIndex) &&
    Array.isArray(currentSnapshot.styleRelations) &&
    Array.isArray(currentSnapshot.legacyNextRelations) &&
    currentSnapshot.runtimeObserver &&
    Array.isArray(currentSnapshot.runtimeObserver.routes) &&
    Array.isArray(currentSnapshot.integrationGuidance) &&
    typeof currentSnapshot.runtimeObserver.stateCount === "number" &&
    typeof currentSnapshot.runtimeObserver.catalogVersion === "string" &&
    typeof currentSnapshot.runtimeObserver.observedRouteCount === "number" &&
    typeof currentSnapshot.runtimeObserver.unavailableRouteCount === "number" &&
    typeof currentSnapshot.runtimeObserver.observedStateCount === "number" &&
    currentSnapshot.integrationGuidance.every(
      (entry) =>
        entry &&
        typeof entry.primarySurfaceKind === "string" &&
        Array.isArray(entry.alternativeSurfaceKinds) &&
        typeof entry.confidence === "string",
    ) &&
    currentSnapshot.firebaseReadiness &&
    hasCurrentFirebaseReadinessShape(currentSnapshot.firebaseReadiness) &&
    currentSnapshot.firebaseReadiness.firestoreReadOnly &&
    currentSnapshot.firebaseReadiness.storageReadOnly
  ) {
    return currentSnapshot;
  }

  const nextSnapshot = await buildRepoUnderstandingSnapshot();
  await writeRepoUnderstandingSnapshot(nextSnapshot);
  return nextSnapshot;
}

function buildControlledChatUserPayload(args) {
  const localTurn = normalizeChatLocalTurn(args.localTurn);
  if (!localTurn) {
    return null;
  }

  return {
    prompt: args.prompt,
    intent: localTurn.intent,
    dataBoundary: CONTROLLED_CHAT_DATA_BOUNDARY,
    localTurn: {
      intent: localTurn.intent,
      status: localTurn.status,
      assistantText: localTurn.assistantText,
      references: localTurn.references,
      reportContext: localTurn.reportContext,
    },
    attachments: sanitizeChatAttachments(args.attachments),
    memoryHints: normalizeMemoryHints(args.memoryHints),
    repoUnderstanding: args.repoSnapshot
      ? trimRepoUnderstandingSnapshotForChat(args.repoSnapshot)
      : null,
  };
}

async function createControlledChatTurn(args) {
  const localTurn = normalizeChatLocalTurn(args.localTurn);
  if (!localTurn) {
    return {
      ok: false,
      reason: "validation_error",
      message: "Contesto locale della chat non valido per l'orchestrazione server-side.",
    };
  }

  const memoryHints = normalizeMemoryHints(args.memoryHints);
  const repoQuestion =
    isRepoUnderstandingQuestion(args.prompt) ||
    localTurn.intent === "repo_understanding" ||
    Boolean(memoryHints?.repoUiRequested);
  const repoSnapshot = repoQuestion ? await loadRepoUnderstandingSnapshot(false) : null;

  if (repoQuestion && repoSnapshot) {
    const deterministicRepoAnswer = buildRepoOperationalAnswer(args.prompt, repoSnapshot);
    const traceEntry = await appendTraceabilityEntry(
      buildTraceabilityEntry({
        endpointId: "orchestrator.chat",
        operation: "run_controlled_chat",
        actorId: args.actorId,
        requestId: args.requestId,
        note:
          "Chat repo/flussi/infrastruttura servita in modo deterministico dal backend IA separato sopra snapshot curata read-only e dependency map strutturale.",
        entityCount:
          (repoSnapshot.documents?.length ?? 0) +
          (repoSnapshot.integrationGuidance?.length ?? 0) +
          (repoSnapshot.flowPlaybooks?.length ?? 0) +
          (repoSnapshot.dependencyMaps?.length ?? 0),
      }),
    );

    return {
      ok: true,
      traceEntryId: traceEntry.id,
      providerConfigured: isProviderConfigured(),
      providerTarget: isProviderConfigured() ? getProviderTarget() : null,
      usedRealProvider: false,
      repoUnderstandingAvailable: Boolean(repoSnapshot?.builtAt),
      transportMessage:
        "Richiesta repo/flussi servita dal backend IA separato sopra snapshot curata e dependency map strutturale, con live-read business chiuso.",
      result: {
        intent: "repo_understanding",
        status: "completed",
        assistantText:
          deterministicRepoAnswer?.assistantText || localTurn.assistantText,
        references:
          deterministicRepoAnswer?.references || buildRepoUnderstandingReferences(repoSnapshot),
        report: null,
      },
    };
  }

  const providerClient = getProviderClient();
  if (!providerClient) {
    return {
      ok: false,
      reason: "provider_not_configured",
      message:
        "Provider reale non configurato nel runner server-side. Impostare `OPENAI_API_KEY` solo lato server per attivare la chat controllata.",
    };
  }

  const userPayload = buildControlledChatUserPayload({
    prompt: args.prompt,
    localTurn,
    repoSnapshot,
    attachments: args.attachments,
    memoryHints,
  });

  if (!userPayload) {
    return {
      ok: false,
      reason: "validation_error",
      message: "Payload della chat server-side non valido.",
    };
  }

  const providerTarget = getProviderTarget();
  const response = await providerClient.responses.create({
    model: providerTarget.model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "Sei la chat server-side controllata della nuova IA interna del gestionale. " +
              "Lavora solo in italiano. Usa esclusivamente il contesto strutturato ricevuto. " +
              "Non inventare dati, non proporre scritture business, non descrivere patch automatiche e non trasformarti in un agente che modifica il repository. " +
              "Non descrivere mai Firestore o Storage business come letture live attive: oggi il live-read business e chiuso e il backend usa solo clone/read model o snapshot read-only dedicate. " +
              "Se la richiesta riguarda report o preview, spiega solo dati gia letti e limiti dichiarati. " +
              "Se la richiesta riguarda repository o UI, usa solo la snapshot curata repo/UI allegata e dichiarane i limiti. " +
              "Se sono presenti allegati, usa solo metadata o estratti testuali esplicitamente forniti: se un file non e analizzabile in profondita, dichiaralo chiaramente. " +
              "Rispondi in modo operativo, breve e chiaro.",
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

  const assistantText =
    typeof response.output_text === "string" ? response.output_text.trim() : "";

  if (!assistantText) {
    return {
      ok: false,
      reason: "upstream_error",
      message:
        "Il provider reale ha risposto senza testo utile per la chat controllata.",
    };
  }

  const traceEntry = await appendTraceabilityEntry(
    buildTraceabilityEntry({
      endpointId: "orchestrator.chat",
      operation: "run_controlled_chat",
      actorId: args.actorId,
      requestId: args.requestId,
      note: repoQuestion
        ? `Chat controllata server-side con ${providerTarget.provider}/${providerTarget.model} e snapshot repo/UI curata.`
        : `Chat controllata server-side con ${providerTarget.provider}/${providerTarget.model} sopra contesto locale gia letto dal clone.`,
      entityCount: repoSnapshot
        ? (repoSnapshot.documents?.length ?? 0) + (repoSnapshot.uiPatterns?.length ?? 0)
        : 1,
    }),
  );

  const references = repoQuestion
    ? buildRepoUnderstandingReferences(repoSnapshot)
    : sanitizeChatReferences(localTurn.references);

  return {
    ok: true,
    traceEntryId: traceEntry.id,
    providerConfigured: true,
    providerTarget,
    usedRealProvider: true,
    transportMessage:
      "Chat interna controllata servita dal backend IA separato sopra contesto clone/read-only, con provider reale solo lato server.",
    repoUnderstandingAvailable: Boolean(repoSnapshot?.builtAt),
    result: {
      intent: repoQuestion ? "repo_understanding" : localTurn.intent,
      status: repoQuestion ? "completed" : localTurn.status,
      assistantText,
      references,
      report: null,
    },
  };
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
  const [firebaseReadiness, firebaseAdminRuntime] = await Promise.all([
    buildFirebaseReadinessSnapshot(),
    probeInternalAiFirebaseAdminRuntime(),
  ]);

  sendEnvelope(res, {
    httpStatus: 200,
    ok: true,
    endpointId: "health",
    status: "ok",
    message:
      "Adapter server-side del backend IA separato disponibile con persistenza IA dedicata, snapshot clone/read-only controllate e workflow preview/approval/rollback IA.",
    data: {
      adapterState: "server_adapter_mock_safe",
      persistenceMode: "server_file_isolated",
      runtimeDataRoot: "backend/internal-ai/runtime-data",
      providerEnabled: isProviderConfigured(),
      providerTarget,
      firebaseReadiness: {
        firestoreReadOnlyStatus: firebaseReadiness.firestoreReadOnly.status,
        storageReadOnlyStatus: firebaseReadiness.storageReadOnly.status,
        sharedRequirements: firebaseReadiness.sharedRequirements,
      },
      firebaseAdminRuntime,
      businessWritesEnabled: false,
      legacyCanonicalBackendEnabled: false,
      workflowEndpointsEnabled: ["artifacts.preview", "approvals.prepare"],
      notes: [
        "Il provider reale e ammesso solo lato server e solo per output di preview/proposta.",
        "L'approvazione e il rollback aggiornano solo artifact e traceability IA dedicati.",
        "Nessun dato business Firestore o Storage viene scritto da questi endpoint.",
        "Il retrieval server-side attivo legge solo snapshot D01/Dossier seedate dal clone e la snapshot curata repo/UI del repository.",
        "La snapshot repo/UI puo includere anche osservazioni runtime NEXT passive e screenshot locali, se l'observer dedicato e stato eseguito.",
        "La chat server-side reale usa OpenAI solo lato server, con fallback locale esplicito se provider o adapter non sono disponibili.",
        "Verdetto binario attuale: live-read business chiuso; la readiness Firebase/Storage resta solo descrittiva finche mancano access layer, credenziali e policy verificabili.",
      ],
    },
  });
});

app.get("/internal-ai-backend/runtime-observer/assets/:fileName", async (req, res) => {
  const fileName = String(req.params?.fileName ?? "").trim();
  if (!/^[a-z0-9._-]+\.(png|jpg|jpeg|webp)$/i.test(fileName)) {
    sendEnvelope(res, {
      httpStatus: 400,
      ok: false,
      endpointId: "runtime-observer.assets",
      status: "validation_error",
      message: "Nome file non valido per gli asset dell'osservatore runtime NEXT.",
      data: {
        fileName,
      },
    });
    return;
  }

  const assetDir = getNextRuntimeObserverDirPath();
  const assetPath = path.join(assetDir, fileName);

  try {
    const binary = await fs.readFile(assetPath);
    const extension = path.extname(fileName).toLowerCase();
    const mimeType =
      extension === ".jpg" || extension === ".jpeg"
        ? "image/jpeg"
        : extension === ".webp"
          ? "image/webp"
          : "image/png";

    res.status(200).setHeader("Content-Type", mimeType);
    res.send(binary);
  } catch {
    sendEnvelope(res, {
      httpStatus: 404,
      ok: false,
      endpointId: "runtime-observer.assets",
      status: "not_found",
      message: `Asset runtime NEXT non trovato: ${fileName}.`,
      data: {
        fileName,
      },
    });
  }
});

app.get("/internal-ai-backend/attachments/assets/:attachmentId", async (req, res) => {
  const attachmentId = String(req.params?.attachmentId ?? "").trim();
  if (!attachmentId) {
    sendEnvelope(res, {
      httpStatus: 400,
      ok: false,
      endpointId: "attachments.repository",
      status: "validation_error",
      message: "Identificativo allegato non valido.",
      data: {
        fileName: null,
      },
    });
    return;
  }

  const repositoryState = normalizeAttachmentsRepositoryState(await readAttachmentsState());
  const attachment =
    repositoryState.items.find(
      (entry) => entry.id === attachmentId && entry.threadId === "main_chat",
    ) ?? null;

  if (!attachment) {
    sendEnvelope(res, {
      httpStatus: 404,
      ok: false,
      endpointId: "attachments.repository",
      status: "not_found",
      message: `Allegato IA-only non trovato: ${attachmentId}.`,
      data: {
        fileName: null,
      },
    });
    return;
  }

  const absolutePath = buildInternalAiChatAttachmentFilePath(attachment.id, attachment.fileName);

  try {
    const binary = await fs.readFile(absolutePath);
    res.status(200).setHeader("Content-Type", attachment.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${attachment.fileName.replace(/"/g, '\\"')}"`,
    );
    res.send(binary);
  } catch {
    sendEnvelope(res, {
      httpStatus: 404,
      ok: false,
      endpointId: "attachments.repository",
      status: "not_found",
      message: `File allegato IA-only non trovato: ${attachment.fileName}.`,
      data: {
        fileName: attachment.fileName,
      },
    });
  }
});

app.post("/internal-ai-backend/attachments/repository", async (req, res) => {
  const operation = req.body?.operation;
  const threadId = "main_chat";

  if (operation === "list_thread_attachments") {
    const repositoryState = normalizeAttachmentsRepositoryState(await readAttachmentsState());
    const threadItems = repositoryState.items.filter((entry) => entry.threadId === threadId);
    const traceEntry = await appendTraceabilityEntry(
      buildTraceabilityEntry({
        endpointId: "attachments.repository",
        operation,
        actorId: req.body?.actorId,
        requestId: req.body?.requestId,
        note: "Lettura lista allegati IA-only del thread principale.",
        entityCount: threadItems.length,
      }),
    );

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "attachments.repository",
      status: "ok",
      message:
        "Lista allegati IA-only letta dal contenitore server-side dedicato in modalita mock-safe.",
      data: {
        operation,
        persistenceMode: "server_file_isolated",
        repositoryState: {
          version: 1,
          items: threadItems,
        },
        attachment: null,
        traceEntryId: traceEntry.id,
        notes: [
          "Gli allegati restano isolati nel runtime IA separato.",
          "Nessun dato business viene coinvolto.",
        ],
      },
    });
    return;
  }

  if (operation === "upload_thread_attachment") {
    const fileName = typeof req.body?.fileName === "string" ? req.body.fileName.trim() : "";
    const mimeType =
      typeof req.body?.mimeType === "string" && req.body.mimeType.trim()
        ? req.body.mimeType.trim()
        : null;
    const sizeBytes = Number(req.body?.sizeBytes);
    const contentBase64 =
      typeof req.body?.contentBase64 === "string" && req.body.contentBase64.trim()
        ? req.body.contentBase64.trim()
        : "";
    const textExcerptInput =
      typeof req.body?.textExcerpt === "string" && req.body.textExcerpt.trim()
        ? req.body.textExcerpt.trim().slice(0, 1600)
        : null;

    if (!fileName || !contentBase64 || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      sendEnvelope(res, {
        httpStatus: 400,
        ok: false,
        endpointId: "attachments.repository",
        status: "validation_error",
        message: "File, dimensione o contenuto base64 non validi per l'allegato IA-only.",
        data: {
          fileName,
        },
      });
      return;
    }

    if (sizeBytes > getInternalAiChatAttachmentMaxSizeBytes()) {
      sendEnvelope(res, {
        httpStatus: 413,
        ok: false,
        endpointId: "attachments.repository",
        status: "validation_error",
        message:
          "L'allegato supera il limite IA-only consentito dal backend separato (4 MB).",
        data: {
          fileName,
        },
      });
      return;
    }

    const attachmentId = createAttachmentId();
    let textExcerpt = textExcerptInput;
    if (!textExcerpt && typeof mimeType === "string" && mimeType.toLowerCase().startsWith("text/")) {
      try {
        textExcerpt = Buffer.from(contentBase64, "base64").toString("utf8").trim().slice(0, 1600) || null;
      } catch {
        textExcerpt = null;
      }
    }

    const providerClient = getProviderClient();
    const providerTarget = providerClient ? getProviderTarget() : null;
    const documentAnalysis = await extractInternalAiDocumentAnalysis({
      fileName,
      mimeType,
      contentBase64,
      textExcerpt,
      providerClient,
      providerTarget,
    });
    if (documentAnalysis?.testoEstrattoBreve && !textExcerpt) {
      textExcerpt = documentAnalysis.testoEstrattoBreve.slice(0, 1600);
    }

    const uploadedAt = new Date().toISOString();
    const attachment = materializeInternalAiChatAttachmentRecord({
      id: attachmentId,
      fileName,
      mimeType,
      sizeBytes,
      uploadedAt,
      textExcerpt,
      documentAnalysis,
    });

    await writeInternalAiChatAttachmentFile({
      id: attachmentId,
      fileName,
      contentBase64,
    });

    const repositoryState = normalizeAttachmentsRepositoryState(await readAttachmentsState());
    const nextState = {
      version: 1,
      items: [attachment, ...repositoryState.items].slice(0, 100),
    };
    await writeAttachmentsState(nextState);

    const traceEntry = await appendTraceabilityEntry(
      buildTraceabilityEntry({
        endpointId: "attachments.repository",
        operation,
        actorId: req.body?.actorId,
        requestId: req.body?.requestId,
        note: `Upload allegato IA-only ${attachment.fileName} con parsing documentale ${documentAnalysis?.stato ?? "non_disponibile"}.`,
        entityCount: nextState.items.length,
      }),
    );

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "attachments.repository",
      status: "ok",
      message:
        documentAnalysis?.stato === "ready"
          ? "Allegato IA-only caricato con estrazione documentale pronta per la review full screen."
          : documentAnalysis?.stato === "partial"
            ? "Allegato IA-only caricato con estrazione documentale parziale: review disponibile con campi da verificare."
            : "Allegato IA-only caricato nel contenitore server-side isolato.",
      data: {
        operation,
        persistenceMode: "server_file_isolated",
        repositoryState: nextState,
        attachment,
        traceEntryId: traceEntry.id,
        notes: [
          "L'allegato resta nel runtime IA separato.",
          "Sono ammessi solo parsing documentale, metadata e contesto dichiarato, nessuna scrittura business.",
        ],
      },
    });
    return;
  }

  if (operation === "remove_thread_attachment") {
    const attachmentId =
      typeof req.body?.attachmentId === "string" ? req.body.attachmentId.trim() : "";
    if (!attachmentId) {
      sendEnvelope(res, {
        httpStatus: 400,
        ok: false,
        endpointId: "attachments.repository",
        status: "validation_error",
        message: "Identificativo allegato mancante o non valido.",
        data: {
          fileName: null,
        },
      });
      return;
    }

    const repositoryState = normalizeAttachmentsRepositoryState(await readAttachmentsState());
    const attachment =
      repositoryState.items.find(
        (entry) => entry.id === attachmentId && entry.threadId === threadId,
      ) ?? null;

    if (!attachment) {
      sendEnvelope(res, {
        httpStatus: 404,
        ok: false,
        endpointId: "attachments.repository",
        status: "not_found",
        message: `Allegato IA-only non trovato: ${attachmentId}.`,
        data: {
          fileName: null,
        },
      });
      return;
    }

    const nextState = {
      version: 1,
      items: repositoryState.items.filter((entry) => entry.id !== attachmentId),
    };

    await deleteInternalAiChatAttachmentFile(
      buildInternalAiChatAttachmentFilePath(attachment.id, attachment.fileName),
    );
    await writeAttachmentsState(nextState);

    const traceEntry = await appendTraceabilityEntry(
      buildTraceabilityEntry({
        endpointId: "attachments.repository",
        operation,
        actorId: req.body?.actorId,
        requestId: req.body?.requestId,
        note: `Rimozione allegato IA-only ${attachment.fileName}.`,
        entityCount: nextState.items.length,
      }),
    );

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "attachments.repository",
      status: "ok",
      message: "Allegato IA-only rimosso dal contenitore server-side isolato.",
      data: {
        operation,
        persistenceMode: "server_file_isolated",
        repositoryState: nextState,
        attachment,
        traceEntryId: traceEntry.id,
        notes: [
          "La rimozione riguarda solo il runtime IA separato.",
          "Nessuna scrittura business viene applicata.",
        ],
      },
    });
    return;
  }

  sendEnvelope(res, {
    httpStatus: 400,
    ok: false,
    endpointId: "attachments.repository",
    status: "validation_error",
    message:
      "Operazione attachments.repository non valida. Sono ammesse solo list_thread_attachments, upload_thread_attachment e remove_thread_attachment.",
    data: {
      allowedOperations: [
        "list_thread_attachments",
        "upload_thread_attachment",
        "remove_thread_attachment",
      ],
    },
  });
});

app.post("/internal-ai-backend/documents/manutenzione-analyze", async (req, res) => {
  const fileName = typeof req.body?.fileName === "string" ? req.body.fileName.trim() : "";
  const mimeType =
    typeof req.body?.mimeType === "string" && req.body.mimeType.trim()
      ? req.body.mimeType.trim()
      : "application/octet-stream";
  const contentBase64 =
    typeof req.body?.contentBase64 === "string" && req.body.contentBase64.trim()
      ? req.body.contentBase64.trim()
      : "";
  const textExcerpt =
    typeof req.body?.textExcerpt === "string" && req.body.textExcerpt.trim()
      ? req.body.textExcerpt.trim().slice(0, 1600)
      : null;
  const pages = Array.isArray(req.body?.pages)
    ? req.body.pages
        .map((page) => {
          if (!page || typeof page !== "object") {
            return null;
          }

          const pageFileName =
            typeof page.fileName === "string" && page.fileName.trim() ? page.fileName.trim() : "";
          const pageMimeType =
            typeof page.mimeType === "string" && page.mimeType.trim()
              ? page.mimeType.trim()
              : "application/octet-stream";
          const pageContentBase64 =
            typeof page.contentBase64 === "string" && page.contentBase64.trim()
              ? page.contentBase64.trim()
              : "";

          if (!pageContentBase64) {
            return null;
          }

          return {
            fileName: pageFileName,
            mimeType: pageMimeType,
            contentBase64: pageContentBase64,
          };
        })
        .filter((page) => Boolean(page))
    : null;
  const hasPages = Array.isArray(pages) && pages.length > 0;
  const effectiveFileName = hasPages ? pages[0]?.fileName || fileName || "documento_multipagina" : fileName;
  const effectiveMimeType = hasPages
    ? pages[0]?.mimeType || mimeType || "application/octet-stream"
    : mimeType;
  const effectiveContentBase64 = hasPages ? pages[0]?.contentBase64 || contentBase64 : contentBase64;

  if ((!hasPages && (!fileName || !contentBase64)) || (hasPages && !effectiveFileName)) {
    sendEnvelope(res, {
      httpStatus: 400,
      ok: false,
      endpointId: "documents.manutenzione-analyze",
      status: "validation_error",
      message: "File o contenuto documento non validi per la review manutenzione.",
      data: { fileName: effectiveFileName || fileName },
    });
    return;
  }

  if (!isProviderConfigured()) {
    sendEnvelope(res, {
      httpStatus: 503,
      ok: false,
      endpointId: "documents.manutenzione-analyze",
      status: "provider_not_configured",
      message:
        "Backend OpenAI non configurato. Imposta OPENAI_API_KEY lato server per analizzare i documenti manutenzione.",
      data: {
        providerConfigured: false,
        providerTarget: getProviderTarget(),
      },
    });
    return;
  }

  try {
    const providerClient = getProviderClient();
    const providerTarget = getProviderTarget();
    const analysis = await extractInternalAiDocumentAnalysis({
      fileName: effectiveFileName,
      mimeType: effectiveMimeType,
      contentBase64: effectiveContentBase64,
      ...(hasPages ? { pages } : {}),
      textExcerpt,
      providerClient,
      providerTarget,
      profile: "manutenzione",
      providerRequired: true,
    });

    const traceEntry = await appendTraceabilityEntry(
      buildTraceabilityEntry({
        endpointId: "documents.manutenzione-analyze",
        operation: "analyze_document",
        actorId: req.body?.actorId,
        requestId: req.body?.requestId,
        note: `Review manutenzione OpenAI per ${effectiveFileName}.`,
        entityCount: Array.isArray(analysis?.righe) ? analysis.righe.length : 0,
      }),
    );

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "documents.manutenzione-analyze",
      status: "ok",
      message: "Analisi OpenAI manutenzione completata dal backend server-side.",
      data: {
        analysis: {
          stato: analysis?.stato ?? "partial",
          tipoDocumento: analysis?.tipoDocumento ?? null,
          fornitore: analysis?.fornitore ?? null,
          numeroDocumento: analysis?.numeroDocumento ?? null,
          dataDocumento: analysis?.dataDocumento ?? null,
          totaleDocumento: analysis?.totaleDocumento ?? null,
          targa: normalizeTarga(analysis?.targa ?? null) || null,
          km: analysis?.km ?? null,
          testo: analysis?.testoEstrattoBreve ?? null,
          riassuntoBreve: buildMaintenanceSummary(analysis),
          avvisi: buildMaintenanceWarnings(analysis),
          campiMancanti: formatMaintenanceMissingFields(analysis?.campiMancanti),
          voci: mapMaintenanceReviewRows(analysis?.righe),
        },
        providerTarget,
        traceEntryId: traceEntry.id,
      },
    });
  } catch (error) {
    sendEnvelope(res, {
      httpStatus: 502,
      ok: false,
      endpointId: "documents.manutenzione-analyze",
      status: "upstream_error",
      message:
        error instanceof Error
          ? `Analisi OpenAI manutenzione non completata: ${error.message}`
          : "Analisi OpenAI manutenzione non completata.",
      data: {
        providerConfigured: isProviderConfigured(),
        providerTarget: getProviderTarget(),
      },
    });
  }
});

app.post("/internal-ai-backend/documents/documento-mezzo-analyze", async (req, res) => {
  const fileName = typeof req.body?.fileName === "string" ? req.body.fileName.trim() : "";
  const mimeType =
    typeof req.body?.mimeType === "string" && req.body.mimeType.trim()
      ? req.body.mimeType.trim()
      : "application/octet-stream";
  const contentBase64 =
    typeof req.body?.contentBase64 === "string" && req.body.contentBase64.trim()
      ? req.body.contentBase64.trim()
      : "";
  const documentSubtypeHint =
    typeof req.body?.documentSubtypeHint === "string" && req.body.documentSubtypeHint.trim()
      ? req.body.documentSubtypeHint.trim()
      : null;

  if (!fileName || !contentBase64) {
    sendEnvelope(res, {
      httpStatus: 400,
      ok: false,
      endpointId: "documents.documento-mezzo-analyze",
      status: "validation_error",
      message: "File o contenuto documento non validi per la review documento mezzo.",
      data: { fileName },
    });
    return;
  }

  if (!isProviderConfigured()) {
    sendEnvelope(res, {
      httpStatus: 503,
      ok: false,
      endpointId: "documents.documento-mezzo-analyze",
      status: "provider_not_configured",
      message:
        "Backend OpenAI non configurato. Imposta OPENAI_API_KEY lato server per analizzare i documenti mezzo.",
      data: {
        providerConfigured: false,
        providerTarget: getProviderTarget(),
      },
    });
    return;
  }

  try {
    const providerClient = getProviderClient();
    const providerTarget = getProviderTarget();
    const analysis = await extractInternalAiDocumentAnalysis({
      fileName,
      mimeType,
      contentBase64,
      providerClient,
      providerTarget,
      profile: "documento_mezzo",
      providerRequired: true,
      documentSubtypeHint,
    });

    const traceEntry = await appendTraceabilityEntry(
      buildTraceabilityEntry({
        endpointId: "documents.documento-mezzo-analyze",
        operation: "analyze_document",
        actorId: req.body?.actorId,
        requestId: req.body?.requestId,
        note: `Review documento mezzo OpenAI per ${fileName}.`,
      }),
    );
    const isLibrettoAnalysis = isLibrettoVehicleDocumentAnalysis(analysis);
    const baseAnalysisPayload = {
      stato: analysis?.stato ?? "partial",
      tipoDocumento: analysis?.sottotipoDocumento ?? analysis?.tipoDocumento ?? null,
      sottotipoDocumento: analysis?.sottotipoDocumento ?? null,
      fornitore: analysis?.fornitore ?? null,
      numeroDocumento: analysis?.numeroDocumento ?? null,
      dataDocumento: analysis?.dataDocumento ?? null,
      targa: normalizeTarga(analysis?.targa ?? null) || null,
      telaio: analysis?.telaio ?? null,
      proprietario: analysis?.proprietario ?? null,
      assicurazione: analysis?.assicurazione ?? null,
      marca: analysis?.marca ?? null,
      modello: analysis?.modello ?? null,
      dataImmatricolazione: analysis?.dataImmatricolazione ?? null,
      dataScadenza: analysis?.dataScadenza ?? null,
      dataUltimoCollaudo: analysis?.dataUltimoCollaudo ?? null,
      dataScadenzaRevisione: analysis?.dataScadenzaRevisione ?? null,
      testo: analysis?.testoEstrattoBreve ?? null,
      riassuntoBreve: buildVehicleDocumentSummary(analysis),
      avvisi: buildVehicleDocumentWarnings(analysis),
      campiMancanti: formatVehicleDocumentMissingFields(analysis?.campiMancanti),
    };

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "documents.documento-mezzo-analyze",
      status: "ok",
      message: "Analisi OpenAI documento mezzo completata dal backend server-side.",
      data: {
        analysis: isLibrettoAnalysis
          ? {
              ...baseAnalysisPayload,
              ...mapCanonicalLibrettoAnalysisFields(analysis),
            }
          : baseAnalysisPayload,
        providerTarget,
        traceEntryId: traceEntry.id,
      },
    });
  } catch (error) {
    sendEnvelope(res, {
      httpStatus: 502,
      ok: false,
      endpointId: "documents.documento-mezzo-analyze",
      status: "upstream_error",
      message:
        error instanceof Error
          ? `Analisi OpenAI documento mezzo non completata: ${error.message}`
          : "Analisi OpenAI documento mezzo non completata.",
      data: {
        providerConfigured: isProviderConfigured(),
        providerTarget: getProviderTarget(),
      },
    });
  }
});

app.post("/internal-ai-backend/documents/preventivo-magazzino-analyze", async (req, res) => {
  const fileName = typeof req.body?.fileName === "string" ? req.body.fileName.trim() : "";
  const mimeType =
    typeof req.body?.mimeType === "string" && req.body.mimeType.trim()
      ? req.body.mimeType.trim()
      : "application/octet-stream";
  const contentBase64 =
    typeof req.body?.contentBase64 === "string" && req.body.contentBase64.trim()
      ? req.body.contentBase64.trim()
      : "";

  if (!fileName || !contentBase64) {
    sendEnvelope(res, {
      httpStatus: 400,
      ok: false,
      endpointId: "documents.preventivo-magazzino-analyze",
      status: "validation_error",
      message: "File o contenuto documento non validi per la review preventivo.",
      data: { fileName },
    });
    return;
  }

  if (!isProviderConfigured()) {
    sendEnvelope(res, {
      httpStatus: 503,
      ok: false,
      endpointId: "documents.preventivo-magazzino-analyze",
      status: "provider_not_configured",
      message:
        "Backend OpenAI non configurato. Imposta OPENAI_API_KEY lato server per analizzare i preventivi.",
      data: {
        providerConfigured: false,
        providerTarget: getProviderTarget(),
      },
    });
    return;
  }

  try {
    const providerClient = getProviderClient();
    const providerTarget = getProviderTarget();
    const analysis = await extractInternalAiDocumentAnalysis({
      fileName,
      mimeType,
      contentBase64,
      providerClient,
      providerTarget,
      profile: "preventivo_magazzino",
      providerRequired: true,
    });

    const traceEntry = await appendTraceabilityEntry(
      buildTraceabilityEntry({
        endpointId: "documents.preventivo-magazzino-analyze",
        operation: "analyze_document",
        actorId: req.body?.actorId,
        requestId: req.body?.requestId,
        note: `Review preventivo magazzino OpenAI per ${fileName}.`,
        entityCount: Array.isArray(analysis?.righe) ? analysis.righe.length : 0,
      }),
    );

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "documents.preventivo-magazzino-analyze",
      status: "ok",
      message: "Analisi OpenAI preventivo completata dal backend server-side.",
      data: {
        analysis: {
          stato: analysis?.stato ?? "partial",
          tipoDocumento: analysis?.tipoDocumento ?? null,
          fornitore: analysis?.fornitore ?? null,
          numeroDocumento: analysis?.numeroDocumento ?? null,
          dataDocumento: analysis?.dataDocumento ?? null,
          totaleDocumento: analysis?.totaleDocumento ?? null,
          testo: analysis?.testoEstrattoBreve ?? null,
          riassuntoBreve: buildPreventivoSummary(analysis),
          avvisi: buildPreventivoWarnings(analysis),
          campiMancanti: formatPreventivoMissingFields(analysis?.campiMancanti),
          voci: mapMaintenanceReviewRows(analysis?.righe),
        },
        providerTarget,
        traceEntryId: traceEntry.id,
      },
    });
  } catch (error) {
    sendEnvelope(res, {
      httpStatus: 502,
      ok: false,
      endpointId: "documents.preventivo-magazzino-analyze",
      status: "upstream_error",
      message:
        error instanceof Error
          ? `Analisi OpenAI preventivo non completata: ${error.message}`
          : "Analisi OpenAI preventivo non completata.",
      data: {
        providerConfigured: isProviderConfigured(),
        providerTarget: getProviderTarget(),
      },
    });
  }
});

app.post("/internal-ai-backend/documents/preventivo-extract", async (req, res) => {
  const fileName = typeof req.body?.fileName === "string" ? req.body.fileName.trim() : "";
  const originalFileName =
    typeof req.body?.originalFileName === "string" && req.body.originalFileName.trim()
      ? req.body.originalFileName.trim()
      : null;
  const mimeType =
    typeof req.body?.mimeType === "string" && req.body.mimeType.trim()
      ? req.body.mimeType.trim()
      : "application/octet-stream";
  const contentBase64 =
    typeof req.body?.contentBase64 === "string" && req.body.contentBase64.trim()
      ? req.body.contentBase64.trim()
      : "";
  const pages = Array.isArray(req.body?.pages)
    ? req.body.pages
        .map((page, index) => {
          if (!page || typeof page !== "object") {
            return null;
          }

          const pageMimeType =
            typeof page.mimeType === "string" && page.mimeType.trim()
              ? page.mimeType.trim()
              : "application/octet-stream";
          const pageContentBase64 =
            typeof page.contentBase64 === "string" && page.contentBase64.trim()
              ? page.contentBase64.trim()
              : "";
          const pageFileName =
            typeof page.fileName === "string" && page.fileName.trim()
              ? page.fileName.trim()
              : `preventivo-${index + 1}.jpg`;

          if (!pageContentBase64) {
            return null;
          }

          return {
            fileName: pageFileName,
            mimeType: pageMimeType,
            contentBase64: pageContentBase64,
          };
        })
        .filter((page) => Boolean(page))
    : [];
  const hasSingleVariant = Boolean(contentBase64);
  const hasPagesVariant = pages.length > 0;
  const effectiveFileName =
    originalFileName ||
    fileName ||
    (hasPagesVariant
      ? pages[0]?.fileName || "preventivo-multipagina"
      : mimeType === "application/pdf"
        ? "preventivo.pdf"
        : "preventivo.jpg");

  if ((hasSingleVariant && hasPagesVariant) || (!hasSingleVariant && !hasPagesVariant)) {
    sendEnvelope(res, {
      httpStatus: 400,
      ok: false,
      endpointId: "documents.preventivo-extract",
      status: "validation_error",
      message:
        "Payload non valido per preventivo-extract: fornire un singolo file oppure pages[] di immagini, ma non entrambi.",
      data: {
        fileName: effectiveFileName,
      },
    });
    return;
  }

  if (hasSingleVariant) {
    const isAllowedSingleMime =
      mimeType === "application/pdf" || mimeType.toLowerCase().startsWith("image/");
    if (!isAllowedSingleMime) {
      sendEnvelope(res, {
        httpStatus: 400,
        ok: false,
        endpointId: "documents.preventivo-extract",
        status: "validation_error",
        message:
          "Payload non valido per preventivo-extract: la variante singola accetta solo application/pdf o mime image/*.",
        data: {
          fileName: effectiveFileName,
          mimeType,
        },
      });
      return;
    }
  }

  if (hasPagesVariant) {
    if (pages.length > 10) {
      sendEnvelope(res, {
        httpStatus: 400,
        ok: false,
        endpointId: "documents.preventivo-extract",
        status: "validation_error",
        message:
          "Payload non valido per preventivo-extract: pages[] supporta da 1 a 10 immagini.",
        data: {
          fileName: effectiveFileName,
          pagesCount: pages.length,
        },
      });
      return;
    }

    const invalidPage = pages.find(
      (page) =>
        !page?.contentBase64 ||
        typeof page.mimeType !== "string" ||
        !page.mimeType.toLowerCase().startsWith("image/"),
    );
    if (invalidPage) {
      sendEnvelope(res, {
        httpStatus: 400,
        ok: false,
        endpointId: "documents.preventivo-extract",
        status: "validation_error",
        message:
          "Payload non valido per preventivo-extract: ogni elemento di pages[] deve essere un'immagine con contentBase64 non vuoto.",
        data: {
          fileName: effectiveFileName,
          mimeType: invalidPage.mimeType ?? null,
        },
      });
      return;
    }
  }

  if (!isProviderConfigured()) {
    sendEnvelope(res, {
      httpStatus: 503,
      ok: false,
      endpointId: "documents.preventivo-extract",
      status: "provider_not_configured",
      message:
        "Backend OpenAI non configurato. Imposta OPENAI_API_KEY lato server per estrarre i preventivi.",
      data: {
        providerConfigured: false,
        providerTarget: getProviderTarget(),
      },
    });
    return;
  }

  try {
    const providerClient = getProviderClient();
    const providerTarget = getProviderTarget();
    const result = await extractPreventivoPriceFromDocument({
      fileName: effectiveFileName,
      mimeType,
      contentBase64,
      ...(hasPagesVariant ? { pages } : {}),
      providerClient,
      providerTarget,
    });

    const traceEntry = await appendTraceabilityEntry(
      buildTraceabilityEntry({
        endpointId: "documents.preventivo-extract",
        operation: "analyze_document",
        actorId: req.body?.actorId,
        requestId: req.body?.requestId,
        note: `Review preventivo OpenAI per ${effectiveFileName}.`,
        entityCount: Array.isArray(result?.items) ? result.items.length : 0,
      }),
    );

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "documents.preventivo-extract",
      status: "ok",
      message: "Estrazione preventivo completata.",
      data: {
        result,
        providerTarget,
        traceEntryId: traceEntry.id,
      },
    });
  } catch (error) {
    sendEnvelope(res, {
      httpStatus: 502,
      ok: false,
      endpointId: "documents.preventivo-extract",
      status: "upstream_error",
      message:
        error instanceof Error
          ? `Estrazione preventivo non completata: ${error.message}`
          : "Estrazione preventivo non completata.",
      data: {
        providerConfigured: isProviderConfigured(),
        providerTarget: getProviderTarget(),
      },
    });
  }
});

app.post("/internal-ai-backend/orchestrator/chat", async (req, res) => {
  if (!isControlledChatRequestBody(req.body)) {
    sendEnvelope(res, {
      httpStatus: 400,
      ok: false,
      endpointId: "orchestrator.chat",
      status: "validation_error",
      message:
        "Operazione orchestrator.chat non valida. E ammessa solo `run_controlled_chat` con prompt e contesto locale strutturato.",
      data: {
        allowedOperations: ["run_controlled_chat"],
      },
    });
    return;
  }

  try {
    const result = await createControlledChatTurn(req.body);
    if (!result.ok) {
      sendEnvelope(res, {
        httpStatus:
          result.reason === "provider_not_configured"
            ? 503
            : result.reason === "upstream_error"
              ? 502
              : 400,
        ok: false,
        endpointId: "orchestrator.chat",
        status: result.reason,
        message: result.message,
        data: {
          operation: "run_controlled_chat",
          persistenceMode: "server_file_isolated",
          chatState: {
            providerConfigured: isProviderConfigured(),
            providerTarget: isProviderConfigured() ? getProviderTarget() : null,
            repoUnderstandingAvailable: false,
          },
          summary: {
            intent: req.body.localTurn?.intent ?? "richiesta_generica",
            status: req.body.localTurn?.status ?? "partial",
            usedRealProvider: false,
          },
          result: {
            intent: req.body.localTurn?.intent ?? "richiesta_generica",
            status: req.body.localTurn?.status ?? "partial",
            assistantText:
              "La chat server-side non e disponibile: il clone deve mantenere il fallback locale esplicito.",
            references: sanitizeChatReferences(req.body.localTurn?.references),
            report: null,
          },
          traceEntryId: null,
          notes: [
            "Se il provider o l'adapter non sono disponibili, il frontend deve ricadere sull'orchestratore locale clone-safe.",
            "Nessun dato business viene scritto da questo endpoint anche in caso di errore.",
          ],
        },
      });
      return;
    }

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "orchestrator.chat",
      status: "ok",
      message:
        result.transportMessage ||
        "Chat interna controllata servita dal backend IA separato con provider reale solo lato server e fallback locale esplicito sul clone.",
      data: {
        operation: "run_controlled_chat",
        persistenceMode: "server_file_isolated",
        chatState: {
          providerConfigured: result.providerConfigured,
          providerTarget: result.providerTarget,
          repoUnderstandingAvailable: result.repoUnderstandingAvailable,
        },
        summary: {
          intent: result.result.intent,
          status: result.result.status,
          usedRealProvider: result.usedRealProvider,
        },
        result: result.result,
        traceEntryId: result.traceEntryId,
        notes: [
          result.usedRealProvider
            ? "La chat usa OpenAI solo lato server e non espone segreti al client."
            : "Le richieste repo/flussi sono servite dal backend IA separato in modo deterministico sopra snapshot read-only, anche senza provider reale.",
          "Anche quando il provider reale e attivo, il testo puo usare solo contesto clone/read-only o snapshot curate: nessun live-read business viene aperto.",
          "Le richieste repo/UI leggono solo la snapshot curata del repository e non autorizzano modifiche automatiche del codice.",
          "Le richieste report continuano a usare solo il contesto gia letto dal clone e non aprono scritture business.",
        ],
      },
    });
  } catch (error) {
    sendEnvelope(res, {
      httpStatus: 502,
      ok: false,
      endpointId: "orchestrator.chat",
      status: "upstream_error",
      message:
        error instanceof Error
          ? `Errore del provider reale lato server nella chat controllata: ${error.message}`
          : "Errore non previsto nella chat server-side controllata.",
      data: {
        operation: "run_controlled_chat",
        persistenceMode: "server_file_isolated",
        chatState: {
          providerConfigured: isProviderConfigured(),
          providerTarget: isProviderConfigured() ? getProviderTarget() : null,
          repoUnderstandingAvailable: false,
        },
        summary: {
          intent: req.body?.localTurn?.intent ?? "richiesta_generica",
          status: req.body?.localTurn?.status ?? "partial",
          usedRealProvider: false,
        },
        result: {
          intent: req.body?.localTurn?.intent ?? "richiesta_generica",
          status: req.body?.localTurn?.status ?? "partial",
          assistantText:
            "La chat server-side ha avuto un errore. Il clone deve mantenere il fallback locale esplicito.",
          references: sanitizeChatReferences(req.body?.localTurn?.references),
          report: null,
        },
        traceEntryId: null,
        notes: [
          "Il fallback locale del clone resta obbligatorio.",
          "Nessun dato business viene scritto da questo endpoint anche in caso di errore del provider.",
        ],
      },
    });
  }
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
        snapshotMeta: buildVehicleContextSnapshotMeta(snapshot),
        repoUnderstandingMeta: null,
        vehicleContext: null,
        vehicleDossier: null,
        repoUnderstanding: null,
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
          sourceMode: "clone_seeded_readonly_snapshot",
          snapshotMeta: buildVehicleContextSnapshotMeta(snapshot),
          repoUnderstandingMeta: null,
          vehicleContext: null,
          vehicleDossier: null,
          repoUnderstanding: null,
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
        snapshotMeta: buildVehicleContextSnapshotMeta(snapshot),
        repoUnderstandingMeta: null,
        vehicleContext,
        vehicleDossier: null,
        repoUnderstanding: null,
        traceEntryId: traceEntry.id,
        notes: [
          "Retrieval read-only servito da contenitore IA dedicato e separato dai dataset business.",
          "Il backend non legge ancora Firestore o Storage business in modo diretto.",
        ],
      },
    });
    return;
  }

  if (operation === "seed_vehicle_dossier_snapshot" && req.body?.snapshot) {
    const normalizedTarga = normalizeTarga(req.body.snapshot.targa);

    if (!normalizedTarga) {
      sendEnvelope(res, {
        httpStatus: 400,
        ok: false,
        endpointId: "retrieval.read",
        status: "validation_error",
        message: "Il seed del Dossier mezzo richiede una targa valida.",
        data: {
          allowedOperations: [
            "seed_vehicle_context_snapshot",
            "read_vehicle_context_by_targa",
            "seed_vehicle_dossier_snapshot",
            "read_vehicle_dossier_by_targa",
            "read_repo_understanding_snapshot",
          ],
        },
      });
      return;
    }

    const currentSnapshot = await readVehicleDossierSnapshot();
    const nextRecord = {
      ...req.body.snapshot,
      targa: normalizedTarga,
      seededAt: req.body.snapshot.seededAt || new Date().toISOString(),
      sourceMode: "clone_seeded_vehicle_dossier_snapshot",
      sourceDatasetLabels: uniqueStrings(req.body.snapshot.sourceDatasetLabels ?? []),
      limitations: uniqueStrings(req.body.snapshot.limitations ?? []),
    };
    const nextItems = [
      nextRecord,
      ...((currentSnapshot.items ?? []).filter(
        (entry) => normalizeTarga(entry?.targa) !== normalizedTarga,
      ) ?? []),
    ].slice(0, 120);
    const nextSnapshot = {
      version: 1,
      sourceMode: "clone_seeded_vehicle_dossier_snapshot",
      domainCode: "DOSSIER_MEZZO",
      activeReadOnlyDatasets: uniqueStrings(
        nextItems.flatMap((entry) => entry.sourceDatasetLabels ?? []),
      ),
      seededAt: new Date().toISOString(),
      counts: {
        trackedVehicles: nextItems.length,
      },
      notes: [
        "Snapshot Dossier mezzo seedata dal clone NEXT tramite read model gia governati.",
        "Il backend IA separato persiste solo dati read-only e non legge Firestore/Storage business in modo diretto.",
      ],
      items: nextItems,
    };
    const snapshot = await writeVehicleDossierSnapshot(nextSnapshot);
    const traceEntry = await appendTraceabilityEntry(
      buildTraceabilityEntry({
        endpointId: "retrieval.read",
        operation,
        actorId: req.body?.actorId,
        requestId: req.body?.requestId,
        note: `Seed snapshot Dossier read-only per ${normalizedTarga} nel backend IA separato.`,
        entityCount: 1,
      }),
    );

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "retrieval.read",
      status: "ok",
      message:
        "Snapshot Dossier mezzo read-only seedata nel backend IA separato per il primo retrieval server-side mezzo-centrico controllato.",
      data: {
        operation,
        persistenceMode: "server_file_isolated",
        sourceMode: snapshot.sourceMode,
        snapshotMeta: buildVehicleDossierSnapshotMeta(snapshot),
        repoUnderstandingMeta: null,
        vehicleContext: null,
        vehicleDossier: null,
        repoUnderstanding: null,
        traceEntryId: traceEntry.id,
        notes: [
          "Seed eseguito dal clone NEXT sopra il composito Dossier e i suoi layer read-only.",
          "Nessuna lettura diretta Firestore o Storage business viene aperta in questo step.",
        ],
      },
    });
    return;
  }

  if (operation === "read_vehicle_dossier_by_targa" && typeof req.body?.rawTarga === "string") {
    const normalizedTarga = normalizeTarga(req.body.rawTarga);

    if (!normalizedTarga) {
      sendEnvelope(res, {
        httpStatus: 400,
        ok: false,
        endpointId: "retrieval.read",
        status: "validation_error",
        message: "La lettura server-side del Dossier mezzo richiede una targa valida.",
        data: {
          allowedOperations: [
            "seed_vehicle_context_snapshot",
            "read_vehicle_context_by_targa",
            "seed_vehicle_dossier_snapshot",
            "read_vehicle_dossier_by_targa",
            "read_repo_understanding_snapshot",
          ],
        },
      });
      return;
    }

    const snapshot = await readVehicleDossierSnapshot();
    if (!snapshot.seededAt) {
      sendEnvelope(res, {
        httpStatus: 404,
        ok: false,
        endpointId: "retrieval.read",
        status: "not_found",
        message:
          "Nessuno snapshot Dossier read-only e ancora disponibile nel backend IA separato.",
        data: {
          sourceMode: "clone_seeded_vehicle_dossier_snapshot",
          snapshotMeta: buildVehicleDossierSnapshotMeta(snapshot),
          repoUnderstandingMeta: null,
          vehicleContext: null,
          vehicleDossier: null,
          repoUnderstanding: null,
          allowedOperations: [
            "seed_vehicle_context_snapshot",
            "read_vehicle_context_by_targa",
            "seed_vehicle_dossier_snapshot",
            "read_vehicle_dossier_by_targa",
            "read_repo_understanding_snapshot",
          ],
        },
      });
      return;
    }

    const vehicleDossier =
      snapshot.items?.find((entry) => normalizeTarga(entry?.targa) === normalizedTarga) ?? null;
    const traceEntry = await appendTraceabilityEntry(
      buildTraceabilityEntry({
        endpointId: "retrieval.read",
        operation,
        actorId: req.body?.actorId,
        requestId: req.body?.requestId,
        note: vehicleDossier
          ? `Lettura server-side Dossier mezzo ${normalizedTarga} da snapshot read-only IA.`
          : `Nessun Dossier mezzo ${normalizedTarga} trovato nello snapshot read-only IA.`,
        entityCount: vehicleDossier ? 1 : 0,
      }),
    );

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "retrieval.read",
      status: "ok",
      message: vehicleDossier
        ? `Dossier mezzo ${normalizedTarga} letto dal retrieval server-side IA su snapshot read-only dedicato.`
        : `Nessun Dossier mezzo ${normalizedTarga} trovato nello snapshot read-only del backend IA separato.`,
      data: {
        operation,
        persistenceMode: "server_file_isolated",
        sourceMode: snapshot.sourceMode,
        snapshotMeta: buildVehicleDossierSnapshotMeta(snapshot),
        repoUnderstandingMeta: null,
        vehicleContext: null,
        vehicleDossier,
        repoUnderstanding: null,
        traceEntryId: traceEntry.id,
        notes: [
          "Retrieval mezzo-centrico servito da contenitore IA dedicato e separato dai dataset business.",
          "Il backend non legge ancora Firestore o Storage business in modo diretto.",
        ],
      },
    });
    return;
  }

  if (operation === "read_repo_understanding_snapshot") {
    const snapshot = await loadRepoUnderstandingSnapshot(Boolean(req.body?.refresh));
    const traceEntry = await appendTraceabilityEntry(
      buildTraceabilityEntry({
        endpointId: "retrieval.read",
        operation,
        actorId: req.body?.actorId,
        requestId: req.body?.requestId,
        note: Boolean(req.body?.refresh)
          ? "Snapshot controllata repo/UI rigenerata dal backend IA separato."
          : "Snapshot controllata repo/UI letta dal backend IA separato.",
        entityCount:
          (snapshot.documents?.length ?? 0) +
          (snapshot.moduleAreas?.length ?? 0) +
          (snapshot.uiPatterns?.length ?? 0),
      }),
    );

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "retrieval.read",
      status: "ok",
      message:
        "Snapshot controllata di repository e UI letta dal backend IA separato in modalita read-only.",
      data: {
        operation,
        persistenceMode: "server_file_isolated",
        sourceMode: snapshot.sourceMode,
        snapshotMeta: null,
        repoUnderstandingMeta: buildRepoUnderstandingMeta(snapshot),
        vehicleContext: null,
        vehicleDossier: null,
        repoUnderstanding: snapshot,
        traceEntryId: traceEntry.id,
        notes: [
          "La snapshot legge solo documenti architetturali e file rappresentativi del repo, in modo curato e read-only.",
          "La snapshot non autorizza patch automatiche, scritture business o riuso dei backend legacy come canale canonico.",
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
      "Operazione retrieval.read non valida. Sono ammesse `seed_vehicle_context_snapshot`, `read_vehicle_context_by_targa`, `seed_vehicle_dossier_snapshot`, `read_vehicle_dossier_by_targa` e `read_repo_understanding_snapshot`.",
    data: {
      allowedOperations: [
        "seed_vehicle_context_snapshot",
        "read_vehicle_context_by_targa",
        "seed_vehicle_dossier_snapshot",
        "read_vehicle_dossier_by_targa",
        "read_repo_understanding_snapshot",
      ],
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

app.post("/internal-ai-backend/euromecc/pdf-analyze", async (req, res) => {
  const inputText = typeof req.body?.inputText === "string" ? req.body.inputText : undefined;
  const imageBase64 = typeof req.body?.imageBase64 === "string" ? req.body.imageBase64 : undefined;

  if (!inputText && !imageBase64) {
    sendEnvelope(res, {
      httpStatus: 400,
      ok: false,
      endpointId: "euromecc.pdf-analyze",
      status: "validation_error",
      message: "Devi passare almeno inputText o imageBase64.",
      data: {},
    });
    return;
  }

  if (!isProviderConfigured()) {
    sendEnvelope(res, {
      httpStatus: 503,
      ok: false,
      endpointId: "euromecc.pdf-analyze",
      status: "provider_not_configured",
      message:
        "Provider non configurato. Impostare OPENAI_API_KEY lato server per attivare l'analisi documenti Euromecc.",
      data: { providerConfigured: false, providerTarget: getProviderTarget() },
    });
    return;
  }

  try {
    const providerClient = getProviderClient();
    const providerTarget = getProviderTarget();

    const userContent = [];
    if (inputText) {
      userContent.push({ type: "input_text", text: inputText });
    }
    if (imageBase64) {
      // Rileva se è PDF o immagine dal magic bytes base64
      const isPdf = imageBase64.startsWith("JVBERi"); // %PDF in base64
      if (isPdf) {
        userContent.push({
          type: "input_file",
          filename: "relazione.pdf",
          file_data: `data:application/pdf;base64,${imageBase64}`,
        });
      } else {
        const imageUrl = imageBase64.startsWith("data:")
          ? imageBase64
          : `data:image/jpeg;base64,${imageBase64}`;
        userContent.push({ type: "input_image", image_url: imageUrl });
      }
    }

    console.log("[euromecc-pdf] inputText length:", inputText?.length ?? 0);
    console.log("[euromecc-pdf] imageBase64 length:", imageBase64?.length ?? 0);
    console.log("[euromecc-pdf] imageBase64 prefix:", imageBase64?.substring(0, 20) ?? "none");
    console.log("[euromecc-pdf] userContent types:", userContent.map(c => c.type));

    const response = await providerClient.responses.create({
      model: providerTarget.model,
      input: [
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    const raw = typeof response.output_text === "string" ? response.output_text.trim() : "";
    console.log("[euromecc-pdf] raw response (first 300):", raw.substring(0, 300));
    const result = raw;

    sendEnvelope(res, {
      httpStatus: 200,
      ok: true,
      endpointId: "euromecc.pdf-analyze",
      status: "ok",
      message: "Analisi documento Euromecc completata dal provider lato server.",
      data: { result, providerTarget },
    });
  } catch (error) {
    sendEnvelope(res, {
      httpStatus: 502,
      ok: false,
      endpointId: "euromecc.pdf-analyze",
      status: "upstream_error",
      message:
        error instanceof Error
          ? `Errore provider: ${error.message}`
          : "Errore non previsto durante l'analisi Euromecc.",
      data: {
        providerConfigured: isProviderConfigured(),
        providerTarget: getProviderTarget(),
      },
    });
  }
});

export function startInternalAiAdapterServer(options = {}) {
  const listenHost = options.listenHost || options.host || host;
  const listenPort = Number(options.listenPort || options.port || port);

  return new Promise((resolve) => {
    const server = app.listen(listenPort, listenHost, () => {
      console.log(
        `[internal-ai-adapter] attivo su http://${listenHost}:${listenPort}/internal-ai-backend | runtime-data=${getInternalAiRuntimeDataRoot()}`,
      );
      resolve(server);
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await startInternalAiAdapterServer();
}
