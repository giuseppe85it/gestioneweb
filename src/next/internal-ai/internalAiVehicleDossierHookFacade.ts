import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";
import { resolveInternalAiReportPeriodContext } from "./internalAiReportPeriod";
import {
  readInternalAiVehicleReportPreview,
  readInternalAiVehicleVerticalSnapshot,
  type InternalAiVehicleReportReadResult,
  type InternalAiVehicleVerticalSnapshot,
} from "./internalAiVehicleReportFacade";
import { findInternalAiVehicleCapabilityDescriptor } from "./internalAiVehicleCapabilityCatalog";
import { planInternalAiVehicleCapability } from "./internalAiVehicleCapabilityPlanner";
import type { InternalAiChatTurnResult } from "./internalAiChatOrchestrator";
import type {
  InternalAiChatMessageReference,
  InternalAiReportPeriodInput,
  InternalAiVehicleCapabilityDescriptor,
  InternalAiVehicleCapabilityPlan,
} from "./internalAiTypes";

type InternalAiVehicleDossierSnapshotSource = {
  snapshot: InternalAiVehicleVerticalSnapshot;
  sourceDatasets: string[];
  limitations: string[];
  transportMessage: string;
};

function formatOptionalText(value: string | null | undefined): string {
  return value && value.trim() ? value.trim() : "non disponibile";
}

function buildCapabilityReferences(
  descriptor: InternalAiVehicleCapabilityDescriptor,
  normalizedTarga: string | null,
  extraScopeLabel: string,
): InternalAiChatMessageReference[] {
  return [
    {
      type: "capabilities",
      label: `Capability attiva: ${descriptor.title}`,
      targa: normalizedTarga,
    },
    {
      type: "safe_mode_notice",
      label: extraScopeLabel,
      targa: normalizedTarga,
    },
    {
      type: "architecture_doc",
      label: "Reader canonici: D01 anagrafica, D10 stato operativo, D02 operativita tecnica",
      targa: normalizedTarga,
    },
  ];
}

function buildMissingTargaResponse(
  descriptor: InternalAiVehicleCapabilityDescriptor,
  outputKind: InternalAiVehicleCapabilityPlan["outputKind"],
): InternalAiChatTurnResult {
  if (outputKind === "report_preview") {
    return {
      intent: "report_targa",
      status: "partial",
      assistantText:
        `Per usare la capability "${descriptor.title}" mi serve una targa valida.\n\n` +
        'Esempio: "crea report mezzo AB123CD ultimi 30 giorni".',
      references: buildCapabilityReferences(
        descriptor,
        null,
        "Perimetro read-only della prima verticale: prima serve una targa reale.",
      ),
      report: {
        status: "invalid_query",
        normalizedTarga: null,
        message: "Inserisci una targa valida prima di aprire il report targa.",
        preview: null,
      },
    };
  }

  return {
    intent: "mezzo_dossier",
    status: "partial",
    assistantText:
      `Per usare la capability "${descriptor.title}" mi serve una targa valida.\n\n` +
      'Esempio: "dimmi lo stato del mezzo AB123CD".',
    references: buildCapabilityReferences(
      descriptor,
      null,
      "Perimetro read-only della prima verticale: nessuna deduzione senza targa reale.",
    ),
    report: null,
  };
}

function buildNotFoundResponse(
  descriptor: InternalAiVehicleCapabilityDescriptor,
  normalizedTarga: string,
): InternalAiChatTurnResult {
  return {
    intent: descriptor.outputKind === "report_preview" ? "report_targa" : "mezzo_dossier",
    status: "partial",
    assistantText:
      `Non ho trovato un mezzo leggibile nel clone per la targa ${normalizedTarga}.\n\n` +
      "Posso riprovare se mi dai una targa diversa oppure una corrispondenza esatta del lookup.",
    references: buildCapabilityReferences(
      descriptor,
      normalizedTarga,
      "La prima verticale usa solo mezzi reali leggibili dai reader NEXT clone-safe.",
    ),
    report:
      descriptor.outputKind === "report_preview"
        ? {
            status: "not_found",
            normalizedTarga,
            message: `Nessun mezzo clone-safe trovato per ${normalizedTarga}.`,
            preview: null,
          }
        : null,
  };
}

function buildSourceDatasetLine(source: InternalAiVehicleDossierSnapshotSource): string {
  if (!source.sourceDatasets.length) {
    return "";
  }

  return `- Dataset letti: ${source.sourceDatasets.join(", ")}.\n`;
}

function buildStatusText(
  plan: InternalAiVehicleCapabilityPlan,
  source: InternalAiVehicleDossierSnapshotSource,
): string {
  const snapshot = source.snapshot;
  const keySignals = [
    ...snapshot.alerts.slice(0, 2).map((item) => item.title),
    ...snapshot.focusItems.slice(0, 2).map((item) => item.title),
  ].filter(Boolean);
  const revisionText =
    snapshot.revisioni[0]?.classe ??
    (snapshot.mezzo.dataScadenzaRevisione
      ? `scadenza ${snapshot.mezzo.dataScadenzaRevisione}`
      : "non disponibile");

  return (
    `Per la targa ${snapshot.mezzo.targa ?? plan.normalizedTarga} la prima verticale mezzo/Home/tecnica mi restituisce questo quadro sintetico.\n\n` +
    `- Mezzo: ${formatOptionalText(snapshot.mezzo.marcaModello)} | categoria ${formatOptionalText(snapshot.mezzo.categoria)}.\n` +
    `- Autista dichiarato: ${formatOptionalText(snapshot.mezzo.autistaNome)}.\n` +
    `- Revisione: ${formatOptionalText(snapshot.mezzo.dataScadenzaRevisione)} | stato operativo ${revisionText}.\n` +
    `- Segnali D10: ${snapshot.alerts.length} alert, ${snapshot.focusItems.length} focus, ${snapshot.sessioni.length} sessioni correlate.\n` +
    `- Dati tecnici D02: ${snapshot.operativita.counts.lavoriAperti} lavori aperti, ${snapshot.operativita.counts.lavoriChiusi} chiusi, ${snapshot.operativita.counts.manutenzioni} manutenzioni.\n` +
    buildSourceDatasetLine(source) +
    `${keySignals.length ? `- Segnali principali: ${keySignals.join("; ")}.\n` : ""}` +
    "- Fonte dichiarata: reader NEXT canonici D01 + D10 + D02, senza usare pagine legacy come reader IA.\n" +
    `${source.limitations[0] ? `Limite dichiarato: ${source.limitations[0]}\n` : ""}\n` +
    "Se vuoi posso spiegarti meglio alert e revisione, riassumere il backlog tecnico oppure preparare il report targa della stessa verticale."
  );
}

function buildAlertStatusText(
  plan: InternalAiVehicleCapabilityPlan,
  source: InternalAiVehicleDossierSnapshotSource,
): string {
  const snapshot = source.snapshot;
  const firstAlert = snapshot.alerts[0];
  const firstFocus = snapshot.focusItems[0];
  const firstRevision = snapshot.revisioni[0];

  return (
    `Per la targa ${plan.normalizedTarga} questo e il perimetro alert/revisione/stato operativo oggi consolidato.\n\n` +
    `- Alert attivi: ${snapshot.alerts.length}.\n` +
    `- Focus operativi: ${snapshot.focusItems.length}.\n` +
    `- Sessioni attive correlate: ${snapshot.sessioni.length}.\n` +
    `- Eventi Home importanti: ${snapshot.importantEvents.length}.\n` +
    `- Revisione: ${firstRevision?.classe ?? formatOptionalText(snapshot.mezzo.dataScadenzaRevisione)}.\n` +
    `${firstAlert ? `- Primo alert: ${firstAlert.title} | ${firstAlert.detailText}.\n` : ""}` +
    `${firstFocus ? `- Primo focus: ${firstFocus.title} | ${firstFocus.detailText}.\n` : ""}` +
    `${source.limitations[0] ? `Limite dichiarato: ${source.limitations[0]}` : "Limite dichiarato: il cockpit D10 resta read-only e non sostituisce verifiche operative live."}`
  );
}

function buildBacklogTecnicoText(
  plan: InternalAiVehicleCapabilityPlan,
  source: InternalAiVehicleDossierSnapshotSource,
): string {
  const snapshot = source.snapshot;
  const periodContext = resolveInternalAiReportPeriodContext(plan.periodInput);
  const firstLavoro = snapshot.operativita.lavoriAperti[0] ?? snapshot.operativita.lavoriChiusi[0] ?? null;
  const firstMaintenance = snapshot.operativita.manutenzioni[0] ?? null;

  return (
    `Per la targa ${plan.normalizedTarga} questo e il backlog tecnico letto nel periodo ${periodContext.label}.\n\n` +
    `- Lavori aperti: ${snapshot.operativita.counts.lavoriAperti}.\n` +
    `- Lavori chiusi: ${snapshot.operativita.counts.lavoriChiusi}.\n` +
    `- Manutenzioni lette: ${snapshot.operativita.counts.manutenzioni}.\n` +
    `- Urgenze alte aperte: ${snapshot.operativita.lavoriAperti.filter((item) => item.urgenza === "alta").length}.\n` +
    buildSourceDatasetLine(source) +
    `${firstLavoro?.descrizione ? `- Primo lavoro utile: ${firstLavoro.descrizione}.\n` : ""}` +
    `${firstMaintenance?.descrizione ?? firstMaintenance?.tipo ? `- Prima manutenzione utile: ${firstMaintenance?.descrizione ?? firstMaintenance?.tipo}.\n` : ""}` +
    `${source.limitations[0] ? `Limite dichiarato: ${source.limitations[0]}` : "Limite dichiarato: il backlog tecnico resta confinato a lavori e manutenzioni del layer D02."}`
  );
}

export async function runInternalAiVehicleDossierHook(
  prompt: string,
  fallbackPeriodInput?: InternalAiReportPeriodInput,
): Promise<InternalAiChatTurnResult | null> {
  const plan = planInternalAiVehicleCapability(prompt, fallbackPeriodInput);
  if (!plan) {
    return null;
  }

  const descriptor = findInternalAiVehicleCapabilityDescriptor(plan.capabilityId);
  if (!descriptor) {
    return null;
  }

  if (plan.missingInputs.includes("targa")) {
    return buildMissingTargaResponse(descriptor, plan.outputKind);
  }

  const normalizedTarga = normalizeNextMezzoTarga(plan.normalizedTarga);
  if (!normalizedTarga) {
    return buildMissingTargaResponse(descriptor, plan.outputKind);
  }

  if (descriptor.id === "mezzo.report.overview") {
    const result: InternalAiVehicleReportReadResult = await readInternalAiVehicleReportPreview(
      normalizedTarga,
      plan.periodInput,
    );

    if (result.status !== "ready") {
      return buildNotFoundResponse(descriptor, normalizedTarga);
    }

    return {
      intent: "report_targa",
      status: "completed",
      assistantText:
        `Ho preparato il report targa della prima verticale per ${normalizedTarga}.\n\n` +
        `Periodo: ${result.report.periodContext.label}. Fonti lette: ${result.report.sources.length}. ` +
        `Dati mancanti: ${result.report.missingData.length}.`,
      references: [
        {
          type: "report_preview",
          label: `Report mezzo ${normalizedTarga}`,
          targa: normalizedTarga,
        },
        ...buildCapabilityReferences(
          descriptor,
          normalizedTarga,
          "Output riusato: anteprima PDF gia esistente del clone, senza nuovi tipi di output.",
        ),
      ],
      report: {
        status: "ready",
        normalizedTarga,
        message: result.message,
        preview: result.report,
      },
    };
  }

  const verticalResult = await readInternalAiVehicleVerticalSnapshot(normalizedTarga);
  if (verticalResult.status !== "ready") {
    return buildNotFoundResponse(descriptor, normalizedTarga);
  }

  const source: InternalAiVehicleDossierSnapshotSource = {
    snapshot: verticalResult.snapshot,
    sourceDatasets: verticalResult.snapshot.sourceDatasetLabels,
    limitations: verticalResult.snapshot.limitations,
    transportMessage: "Perimetro consolidato: reader NEXT read-only D01 + D10 + D02.",
  };

  if (descriptor.id === "mezzo.status.dossier") {
    return {
      intent: "mezzo_dossier",
      status: "completed",
      assistantText: buildStatusText(plan, source),
      references: buildCapabilityReferences(descriptor, normalizedTarga, source.transportMessage),
      report: null,
    };
  }

  if (descriptor.id === "mezzo.preview.libretto") {
    return {
      intent: "mezzo_dossier",
      status: "completed",
      assistantText: buildAlertStatusText(plan, source),
      references: buildCapabilityReferences(descriptor, normalizedTarga, source.transportMessage),
      report: null,
    };
  }

  if (descriptor.id === "mezzo.preview.preventivi") {
    return {
      intent: "mezzo_dossier",
      status: "completed",
      assistantText: buildBacklogTecnicoText(plan, source),
      references: buildCapabilityReferences(descriptor, normalizedTarga, source.transportMessage),
      report: null,
    };
  }

  if (
    descriptor.id === "mezzo.summary.rifornimenti" ||
    descriptor.id === "mezzo.preview.documents" ||
    descriptor.id === "mezzo.report.economic"
  ) {
    return {
      intent: "non_supportato",
      status: "not_supported",
      assistantText:
        `La richiesta sulla targa ${normalizedTarga} esce dalla prima verticale consolidata.\n\n` +
        "In questo step la chat resta affidabile solo su D01 anagrafica mezzo, D10 stato operativo e D02 operativita tecnica.\n" +
        "Domini come rifornimenti, documenti, costi e procurement vengono dichiarati come esterni e non ancora consolidati qui.",
      references: buildCapabilityReferences(
        descriptor,
        normalizedTarga,
        "Fuori verticale: D04, D06, D07 e D08 non ancora consolidati nella chat V1.",
      ),
      report: null,
    };
  }

  return null;
}
