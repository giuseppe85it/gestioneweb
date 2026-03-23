import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";
import {
  readNextDossierMezzoCompositeSnapshot,
  type NextDossierMezzoCompositeSnapshot,
} from "../domain/nextDossierMezzoDomain";
import type { NextDocumentiCostiReadOnlyItem } from "../domain/nextDocumentiCostiDomain";
import type { NextRifornimentoReadOnlyItem } from "../domain/nextRifornimentiDomain";
import {
  filterItemsByInternalAiReportPeriod,
  resolveInternalAiReportPeriodContext,
} from "./internalAiReportPeriod";
import {
  readInternalAiDocumentsPreview,
  type InternalAiDocumentsPreviewReadResult,
} from "./internalAiDocumentsPreviewFacade";
import {
  readInternalAiEconomicAnalysisPreview,
  type InternalAiEconomicAnalysisReadResult,
} from "./internalAiEconomicAnalysisFacade";
import {
  readInternalAiLibrettoPreview,
  type InternalAiLibrettoPreviewReadResult,
} from "./internalAiLibrettoPreviewFacade";
import {
  readInternalAiPreventiviPreview,
  type InternalAiPreventiviPreviewReadResult,
} from "./internalAiPreventiviPreviewFacade";
import {
  readInternalAiServerVehicleDossierByTarga,
} from "./internalAiServerRetrievalClient";
import {
  readInternalAiVehicleReportPreview,
  type InternalAiVehicleReportReadResult,
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
  snapshot: NextDossierMezzoCompositeSnapshot;
  transport: "server_http_retrieval" | "frontend_fallback";
  transportMessage: string;
  sourceDatasets: string[];
  limitations: string[];
};

function formatOptionalText(value: string | null | undefined): string {
  return value && value.trim() ? value.trim() : "non disponibile";
}

function formatCurrencyAmount(amount: number): string {
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim()))));
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
  ];
}

function buildVehicleDossierSourceDatasetLabels(
  snapshot: NextDossierMezzoCompositeSnapshot,
): string[] {
  const labels: Array<string | null> = [snapshot.mezzo.sourceKey];

  if (snapshot.lavori.status === "success") {
    labels.push("@lavori");
  }

  if (snapshot.materialiMovimenti.status === "success") {
    labels.push("@materialiconsegnati");
  }

  if (snapshot.maintenance.status === "success") {
    labels.push("@manutenzioni");
  }

  if (snapshot.refuels.status === "success") {
    labels.push("@rifornimenti", "@rifornimenti_autisti_tmp");
  }

  if (snapshot.documentCosts.status === "success") {
    labels.push("@costiMezzo");
  }

  if (snapshot.procurementPerimeter.status === "success") {
    labels.push("@preventivi", "@preventivi_approvazioni");
  }

  if (snapshot.analisiEconomica.status === "success") {
    labels.push("@analisi_economica_mezzi");
  }

  return uniqueStrings(labels);
}

function buildVehicleDossierLimitations(
  snapshot: NextDossierMezzoCompositeSnapshot,
): string[] {
  return uniqueStrings([
    ...snapshot.overview.technicalLimitations,
    ...snapshot.overview.refuelLimitations,
    ...snapshot.overview.documentCostLimitations,
    ...snapshot.overview.analysisLimitations,
    ...snapshot.overview.procurementLimitations,
  ]).slice(0, 18);
}

function buildCisternaSpecialistNote(snapshot: NextDossierMezzoCompositeSnapshot): string | null {
  const categoria = (snapshot.mezzo.categoria ?? "").toLowerCase();
  if (!categoria.includes("cisterna")) {
    return null;
  }

  return "Nota verticale specialistica: il mezzo rientra nell'area Cisterna, ma in questo step la IA legge solo il perimetro mezzo-centrico governato e non apre ancora retrieval live dedicati del verticale.";
}

async function readVehicleDossierSnapshotSource(
  normalizedTarga: string,
): Promise<InternalAiVehicleDossierSnapshotSource | null> {
  const serverResult = await readInternalAiServerVehicleDossierByTarga(normalizedTarga);
  if (serverResult.status === "ready" && serverResult.payload.vehicleDossier) {
    return {
      snapshot: serverResult.payload.vehicleDossier.snapshot,
      transport: "server_http_retrieval",
      transportMessage: `${serverResult.message} Fonti dichiarate: snapshot Dossier clone-seeded nel backend IA dedicato, senza Firestore/Storage business diretti.`,
      sourceDatasets:
        serverResult.payload.vehicleDossier.sourceDatasetLabels ??
        buildVehicleDossierSourceDatasetLabels(serverResult.payload.vehicleDossier.snapshot),
      limitations:
        serverResult.payload.vehicleDossier.limitations ??
        buildVehicleDossierLimitations(serverResult.payload.vehicleDossier.snapshot),
    };
  }

  const fallbackSnapshot = await readNextDossierMezzoCompositeSnapshot(normalizedTarga);
  if (!fallbackSnapshot) {
    return null;
  }

  return {
    snapshot: fallbackSnapshot,
    transport: "frontend_fallback",
    transportMessage:
      serverResult.status === "not_enabled" || serverResult.status === "not_found"
        ? `${serverResult.message} Attivato fallback locale clone-safe sul composito Dossier mezzo.`
        : "Attivato fallback locale clone-safe sul composito Dossier mezzo.",
    sourceDatasets: buildVehicleDossierSourceDatasetLabels(fallbackSnapshot),
    limitations: buildVehicleDossierLimitations(fallbackSnapshot),
  };
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
        "Perimetro read-only mezzo-centrico: prima serve una targa reale.",
      ),
      report: {
        status: "invalid_query",
        normalizedTarga: null,
        message: "Inserisci una targa valida prima di aprire il report mezzo-centrico.",
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
      "Perimetro read-only mezzo-centrico: nessuna deduzione senza targa reale.",
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
      "Il hook Dossier usa solo mezzi reali leggibili dai layer NEXT clone-safe.",
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

function buildDossierStatusText(
  plan: InternalAiVehicleCapabilityPlan,
  source: InternalAiVehicleDossierSnapshotSource,
): string {
  const snapshot = source.snapshot;
  const lavoriCount = snapshot.lavori.snapshot?.items?.length ?? 0;
  const manutenzioniCount = snapshot.maintenance.snapshot?.maintenanceItems?.length ?? 0;
  const gommeCount = snapshot.maintenance.snapshot?.gommeItems?.length ?? 0;
  const rifornimentiCount = snapshot.refuels.snapshot?.items?.length ?? 0;
  const documentItems = snapshot.documentCosts.snapshot?.items ?? [];
  const preventiviCount = documentItems.filter((item) => item.category === "preventivo").length;
  const fattureCount = documentItems.filter((item) => item.category === "fattura").length;
  const keySignals = snapshot.overview.keySignals.slice(0, 3);
  const limitations = source.limitations;
  const cisternaNote = buildCisternaSpecialistNote(snapshot);

  return (
    `Per la targa ${snapshot.mezzo.targa ?? plan.normalizedTarga} il Dossier mezzo-centrico read-only mi restituisce questo quadro sintetico.\n\n` +
    `- Mezzo: ${formatOptionalText(snapshot.mezzo.marcaModello)} | categoria ${formatOptionalText(snapshot.mezzo.categoria)}.\n` +
    `- Autista dichiarato: ${formatOptionalText(snapshot.mezzo.autistaNome)}.\n` +
    `- Revisione: ${formatOptionalText(snapshot.mezzo.dataScadenzaRevisione)} | libretto ${snapshot.mezzo.librettoUrl ? "presente" : "non presente"}.\n` +
    `- Dati mezzo-centrici letti: ${lavoriCount} lavori, ${manutenzioniCount} manutenzioni, ${gommeCount} eventi gomme, ${rifornimentiCount} rifornimenti.\n` +
    `- Perimetro documentale: ${documentItems.length} record, di cui ${preventiviCount} preventivi e ${fattureCount} fatture.\n` +
    buildSourceDatasetLine(source) +
    `${keySignals.length ? `- Segnali principali: ${keySignals.join("; ")}.\n` : ""}` +
    `- Fonte dichiarata: ${source.transport === "server_http_retrieval" ? "retrieval server-side read-only sul Dossier seedato dal clone" : "fallback locale clone-safe sul composito Dossier"}.\n` +
    `${limitations[0] ? `Limite dichiarato: ${limitations[0]}\n` : ""}` +
    `${cisternaNote ? `${cisternaNote}\n` : ""}\n` +
    "Se vuoi posso anche riepilogare i rifornimenti, elencare documenti, spiegare i costi oppure preparare il report PDF del mezzo."
  );
}

function buildDocumentsText(
  result: Extract<InternalAiDocumentsPreviewReadResult, { status: "ready" }>,
): string {
  const directBucket = result.preview.buckets.find((bucket) => bucket.id === "diretti");
  const plausibleBucket = result.preview.buckets.find((bucket) => bucket.id === "plausibili");
  const directItems = directBucket?.items.slice(0, 3) ?? [];
  const plausibleItems = plausibleBucket?.items.slice(0, 2) ?? [];
  const highlights = [...directItems, ...plausibleItems]
    .map((item) => item.title)
    .filter(Boolean)
    .slice(0, 4);

  return (
    `Per la targa ${result.normalizedTarga} posso leggere un perimetro documentale mezzo-centrico gia governato.\n\n` +
    `- Diretti: ${result.preview.header.documentiDiretti}.\n` +
    `- Plausibili: ${result.preview.header.documentiPlausibili}.\n` +
    `- Fuori perimetro: ${result.preview.header.fuoriPerimetro}.\n` +
    `- File leggibili: ${result.preview.header.fileLeggibili}.\n` +
    `${highlights.length ? `- Primi riferimenti utili: ${highlights.join("; ")}.\n` : ""}\n` +
    `${result.preview.outOfScope[0] ? `Limite dichiarato: ${result.preview.outOfScope[0]}` : "Limite dichiarato: OCR, upload e Storage business live restano fuori perimetro."}`
  );
}

function buildEconomicText(
  plan: InternalAiVehicleCapabilityPlan,
  source: InternalAiVehicleDossierSnapshotSource,
  economicResult: InternalAiEconomicAnalysisReadResult,
): string {
  const snapshot = source.snapshot;
  const periodContext = resolveInternalAiReportPeriodContext(plan.periodInput);
  const documentItems = snapshot.documentCosts.snapshot?.items ?? [];
  const filtered = filterItemsByInternalAiReportPeriod<NextDocumentiCostiReadOnlyItem>(
    documentItems,
    (item) => item.sortTimestamp ?? item.timestamp,
    periodContext,
  );
  const filteredItems = filtered.filteredItems;
  const preventiviCount = filteredItems.filter((item) => item.category === "preventivo").length;
  const fattureCount = filteredItems.filter((item) => item.category === "fattura").length;
  const documentiUtiliCount = filteredItems.filter(
    (item) => item.category === "documento_utile",
  ).length;
  const eurTotal = filteredItems
    .filter((item) => typeof item.amount === "number" && item.currency === "EUR")
    .reduce((total, item) => total + (item.amount ?? 0), 0);
  const chfTotal = filteredItems
    .filter((item) => typeof item.amount === "number" && item.currency === "CHF")
    .reduce((total, item) => total + (item.amount ?? 0), 0);
  const recordsWithoutAmount = filteredItems.filter((item) => item.amount === null).length;

  let groupingLine = "";
  if (plan.groupBy === "document_type") {
    groupingLine =
      `- Ripartizione per tipo: ${preventiviCount} preventivi, ${fattureCount} fatture, ` +
      `${documentiUtiliCount} documenti utili.\n`;
  } else if (plan.groupBy === "source") {
    const sourceGroups = Array.from(
      filteredItems.reduce((map, item) => {
        const current = map.get(item.sourceLabel) ?? 0;
        map.set(item.sourceLabel, current + 1);
        return map;
      }, new Map<string, number>()),
    )
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([label, count]) => `${label} (${count})`);
    if (sourceGroups.length) {
      groupingLine = `- Ripartizione per fonte: ${sourceGroups.join("; ")}.\n`;
    }
  }

  const economicLimit =
    economicResult.status === "ready"
      ? economicResult.preview.missingData[0] ?? null
      : null;

  return (
    `Per la targa ${plan.normalizedTarga} posso darti un riepilogo costi mezzo-centrico nel periodo ${periodContext.label}.\n\n` +
    `- Record economici letti: ${filteredItems.length} su ${filtered.totalCount} totali.\n` +
    `- Totali con importo: EUR ${formatCurrencyAmount(eurTotal)} | CHF ${formatCurrencyAmount(chfTotal)}.\n` +
    `- Record senza importo leggibile: ${recordsWithoutAmount}.\n` +
    `- Fonti documentali dirette: ${fattureCount} fatture e ${preventiviCount} preventivi.\n` +
    buildSourceDatasetLine(source) +
    groupingLine +
    `- Fonte dichiarata: ${source.transport === "server_http_retrieval" ? "retrieval server-side read-only sul Dossier seedato dal clone" : "fallback locale clone-safe sul composito Dossier"}.\n\n` +
    `${economicLimit ?? "Limite dichiarato: il riepilogo resta documentale/read-only e non sostituisce contabilita o procurement live."}`
  );
}

function buildRefuelsText(
  plan: InternalAiVehicleCapabilityPlan,
  source: InternalAiVehicleDossierSnapshotSource,
): string {
  const snapshot = source.snapshot;
  const periodContext = resolveInternalAiReportPeriodContext(plan.periodInput);
  const refuelItems = snapshot.refuels.snapshot?.items ?? [];
  const filtered = filterItemsByInternalAiReportPeriod<NextRifornimentoReadOnlyItem>(
    refuelItems,
    (item) => item.timestampRicostruito ?? item.timestamp,
    periodContext,
  );
  const filteredItems = filtered.filteredItems;
  const litersTotal = filteredItems.reduce((total, item) => total + (item.litri ?? 0), 0);
  const eurTotal = filteredItems
    .filter((item) => item.costo !== null && item.valuta === "EUR")
    .reduce((total, item) => total + (item.costo ?? 0), 0);
  const chfTotal = filteredItems
    .filter((item) => item.costo !== null && item.valuta === "CHF")
    .reduce((total, item) => total + (item.costo ?? 0), 0);
  const unknownCurrencyCostCount = filteredItems.filter(
    (item) => item.costo !== null && item.valuta === null,
  ).length;
  const businessCount = filteredItems.filter((item) => item.provenienza === "business").length;
  const fieldCount = filteredItems.filter((item) => item.provenienza === "campo").length;
  const reconstructedCount = filteredItems.filter(
    (item) => item.provenienza === "ricostruito",
  ).length;
  const latestRows = filteredItems
    .slice(0, 3)
    .map((item) => {
      const parts = [
        item.dataLabel ?? item.dataDisplay ?? "data non disponibile",
        item.litri != null ? `${formatCurrencyAmount(item.litri)} litri` : null,
        item.costo != null && item.valuta ? `${formatCurrencyAmount(item.costo)} ${item.valuta}` : null,
      ].filter(Boolean);
      return parts.join(" | ");
    })
    .filter(Boolean);
  const cisternaNote = buildCisternaSpecialistNote(snapshot);

  return (
    `Per la targa ${plan.normalizedTarga} posso leggere i rifornimenti nel perimetro ${periodContext.label} usando il layer D04 gia normalizzato.\n\n` +
    `- Record utili: ${filteredItems.length} su ${filtered.totalCount} totali.\n` +
    `- Litri complessivi leggibili: ${formatCurrencyAmount(litersTotal)}.\n` +
    `- Costi con valuta nota: EUR ${formatCurrencyAmount(eurTotal)} | CHF ${formatCurrencyAmount(chfTotal)}.\n` +
    `- Record con costo ma valuta non deducibile: ${unknownCurrencyCostCount}.\n` +
    `- Provenienza: ${businessCount} business, ${reconstructedCount} ricostruiti, ${fieldCount} solo feed campo.\n` +
    buildSourceDatasetLine(source) +
    `${latestRows.length ? `- Ultimi riferimenti: ${latestRows.join("; ")}.\n` : ""}` +
    `- Fonte dichiarata: ${source.transport === "server_http_retrieval" ? "retrieval server-side read-only sul Dossier seedato dal clone" : "fallback locale clone-safe sul composito Dossier"}.\n` +
    `${source.limitations[0] ? `Limite dichiarato: ${source.limitations[0]}\n` : ""}` +
    `${cisternaNote ? `${cisternaNote}\n` : ""}`
  );
}

function buildLibrettoText(
  result: Extract<InternalAiLibrettoPreviewReadResult, { status: "ready" }>,
): string {
  const highlights = result.preview.buckets
    .flatMap((bucket) => bucket.items.slice(0, 2))
    .map((item) => `${item.title}: ${item.valueLabel}`)
    .slice(0, 4);

  return (
    `Per la targa ${result.normalizedTarga} il perimetro libretto read-only e questo.\n\n` +
    `- Dati diretti: ${result.preview.header.datiDiretti}.\n` +
    `- Dati plausibili: ${result.preview.header.datiPlausibili}.\n` +
    `- Fuori perimetro: ${result.preview.header.fuoriPerimetro}.\n` +
    `- File libretto: ${result.preview.header.fileLibretto}.\n` +
    `${highlights.length ? `- Evidenze disponibili: ${highlights.join("; ")}.\n` : ""}\n` +
    `${result.preview.outOfScope[0] ?? "Limite dichiarato: OCR e upload restano fuori perimetro."}`
  );
}

function buildPreventiviText(
  result: Extract<InternalAiPreventiviPreviewReadResult, { status: "ready" }>,
): string {
  const highlights = result.preview.buckets
    .flatMap((bucket) => bucket.items.slice(0, 2))
    .map((item) => item.title)
    .slice(0, 4);

  return (
    `Per la targa ${result.normalizedTarga} posso leggere solo i preventivi gia governati nel perimetro mezzo-centrico.\n\n` +
    `- Diretti: ${result.preview.header.preventiviDiretti}.\n` +
    `- Supporti plausibili: ${result.preview.header.supportiPlausibili}.\n` +
    `- Fuori perimetro: ${result.preview.header.fuoriPerimetro}.\n` +
    `${highlights.length ? `- Riferimenti utili: ${highlights.join("; ")}.\n` : ""}\n` +
    `${result.preview.outOfScope[0] ?? "Limite dichiarato: procurement globale e approvazioni restano fuori perimetro."}`
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
        `Ho preparato il report mezzo-centrico per la targa ${normalizedTarga} nel perimetro Dossier read-only.\n\n` +
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
          "Fonti read-only: Dossier mezzo clone-safe, D01 e D07-D08.",
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

  if (descriptor.id === "mezzo.status.dossier") {
    const dossierSource = await readVehicleDossierSnapshotSource(normalizedTarga);
    if (!dossierSource) {
      return buildNotFoundResponse(descriptor, normalizedTarga);
    }

    return {
      intent: "mezzo_dossier",
      status: "completed",
      assistantText: buildDossierStatusText(plan, dossierSource),
      references: buildCapabilityReferences(
        descriptor,
        normalizedTarga,
        dossierSource.transportMessage,
      ),
      report: null,
    };
  }

  if (descriptor.id === "mezzo.summary.rifornimenti") {
    const dossierSource = await readVehicleDossierSnapshotSource(normalizedTarga);
    if (!dossierSource) {
      return buildNotFoundResponse(descriptor, normalizedTarga);
    }

    return {
      intent: "mezzo_dossier",
      status: "completed",
      assistantText: buildRefuelsText(plan, dossierSource),
      references: buildCapabilityReferences(
        descriptor,
        normalizedTarga,
        dossierSource.transportMessage,
      ),
      report: null,
    };
  }

  if (descriptor.id === "mezzo.preview.documents") {
    const result = await readInternalAiDocumentsPreview(normalizedTarga);
    if (result.status !== "ready") {
      return buildNotFoundResponse(descriptor, normalizedTarga);
    }

    return {
      intent: "mezzo_dossier",
      status: "completed",
      assistantText: buildDocumentsText(result),
      references: buildCapabilityReferences(
        descriptor,
        normalizedTarga,
        "Preview documentale governata: diretti, plausibili e fuori perimetro restano distinti.",
      ),
      report: null,
    };
  }

  if (descriptor.id === "mezzo.report.economic") {
    const [dossierSource, economicResult] = await Promise.all([
      readVehicleDossierSnapshotSource(normalizedTarga),
      readInternalAiEconomicAnalysisPreview(normalizedTarga),
    ]);
    if (!dossierSource) {
      return buildNotFoundResponse(descriptor, normalizedTarga);
    }

    return {
      intent: "mezzo_dossier",
      status: "completed",
      assistantText: buildEconomicText(plan, dossierSource, economicResult),
      references: buildCapabilityReferences(
        descriptor,
        normalizedTarga,
        dossierSource.transportMessage,
      ),
      report: null,
    };
  }

  if (descriptor.id === "mezzo.preview.libretto") {
    const result = await readInternalAiLibrettoPreview(normalizedTarga);
    if (result.status !== "ready") {
      return buildNotFoundResponse(descriptor, normalizedTarga);
    }

    return {
      intent: "mezzo_dossier",
      status: "completed",
      assistantText: buildLibrettoText(result),
      references: buildCapabilityReferences(
        descriptor,
        normalizedTarga,
        "Preview libretto read-only: nessun OCR, nessun upload, nessun bridge Storage live.",
      ),
      report: null,
    };
  }

  if (descriptor.id === "mezzo.preview.preventivi") {
    const result = await readInternalAiPreventiviPreview(normalizedTarga);
    if (result.status !== "ready") {
      return buildNotFoundResponse(descriptor, normalizedTarga);
    }

    return {
      intent: "mezzo_dossier",
      status: "completed",
      assistantText: buildPreventiviText(result),
      references: buildCapabilityReferences(
        descriptor,
        normalizedTarga,
        "Preview preventivi read-only: supporta solo record mezzo-centrici e supporti dichiarati.",
      ),
      report: null,
    };
  }

  return null;
}
