import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";
import {
  readNextDossierMezzoCompositeSnapshot,
  type NextDossierMezzoCompositeSnapshot,
} from "../domain/nextDossierMezzoDomain";
import type {
  InternalAiEconomicAnalysisPreview,
  InternalAiPreviewState,
  InternalAiVehicleReportCard,
  InternalAiVehicleReportSection,
  InternalAiVehicleReportSource,
} from "./internalAiTypes";

export type InternalAiEconomicAnalysisReadResult =
  | {
      status: "invalid_query" | "not_found";
      normalizedTarga: string | null;
      message: string;
      preview: null;
    }
  | {
      status: "ready";
      normalizedTarga: string;
      message: string;
      preview: InternalAiEconomicAnalysisPreview;
    };

function takeNotes(notes: string[] | undefined, limit = 3): string[] {
  return (notes ?? []).filter(Boolean).slice(0, limit);
}

function formatDateTimeLabel(timestamp: number | null): string {
  if (!timestamp) {
    return "non disponibile";
  }

  try {
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return "non disponibile";
  }
}

function trimText(value: string | null, maxLength = 220): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function formatPeriodStatus(value: "affidabile" | "parziale" | "non_dimostrabile"): string {
  switch (value) {
    case "affidabile":
      return "affidabile";
    case "parziale":
      return "parziale";
    default:
      return "non dimostrabile";
  }
}

function formatProcurementDecision(value: "fuori_perimetro" | "parziale" | "forte"): string {
  switch (value) {
    case "forte":
      return "con match forte";
    case "parziale":
      return "solo parziale";
    default:
      return "fuori perimetro";
  }
}

function deriveDirectPeriodStatus(args: {
  total: number;
  withReliableDate: number;
}): "affidabile" | "parziale" | "non_dimostrabile" {
  const { total, withReliableDate } = args;
  if (total <= 0 || withReliableDate <= 0) return "non_dimostrabile";
  if (withReliableDate < total) return "parziale";
  return "affidabile";
}

function buildPreviewState(snapshot: NextDossierMezzoCompositeSnapshot): InternalAiPreviewState {
  const hasDirectBase = (snapshot.documentCosts.snapshot?.counts.total ?? 0) > 0;
  const hasLegacySnapshot = Boolean(snapshot.analisiEconomica.snapshot?.savedAnalysis);

  return {
    status: hasDirectBase || hasLegacySnapshot ? "preview_ready" : "revision_requested",
    updatedAt: new Date().toISOString(),
    note:
      hasDirectBase || hasLegacySnapshot
        ? "Anteprima analisi economica costruita in sola lettura sopra i layer clone-safe e l'eventuale snapshot legacy salvato."
        : "Anteprima economica disponibile ma senza una base diretta sufficiente: servono documenti/costi leggibili o uno snapshot legacy gia presente.",
  };
}

function buildCards(snapshot: NextDossierMezzoCompositeSnapshot): InternalAiVehicleReportCard[] {
  const documentCosts = snapshot.documentCosts.snapshot;
  const savedAnalysis = snapshot.analisiEconomica.snapshot?.savedAnalysis;
  const procurement = snapshot.procurementPerimeter.snapshot;
  const directPeriodStatus = deriveDirectPeriodStatus({
    total: documentCosts?.counts.total ?? 0,
    withReliableDate: documentCosts?.counts.withReliableDate ?? 0,
  });
  const totals = {
    eur:
      (documentCosts?.totals.preventivi.eur ?? 0) + (documentCosts?.totals.fatture.eur ?? 0),
    chf:
      (documentCosts?.totals.preventivi.chf ?? 0) + (documentCosts?.totals.fatture.chf ?? 0),
    unknownCount:
      (documentCosts?.totals.preventivi.unknownCount ?? 0) +
      (documentCosts?.totals.fatture.unknownCount ?? 0),
  };

  return [
    {
      label: "Documenti diretti",
      value: `${documentCosts?.counts.total ?? 0}`,
      meta: `${documentCosts?.counts.preventivi ?? 0} preventivi, ${documentCosts?.counts.fatture ?? 0} fatture.`,
      tone: documentCosts?.counts.total ? "success" : "warning",
    },
    {
      label: "Importi leggibili",
      value: `${documentCosts?.counts.withAmount ?? 0}`,
      meta: `Totali diretti: EUR ${totals.eur.toFixed(2)} / CHF ${totals.chf.toFixed(2)}.`,
      tone: documentCosts?.counts.withAmount ? "success" : "warning",
    },
    {
      label: "Snapshot legacy",
      value: savedAnalysis ? "Presente" : "Assente",
      meta: savedAnalysis
        ? `Qualita ${savedAnalysis.quality}; aggiornato ${formatDateTimeLabel(savedAnalysis.updatedAtTimestamp)}.`
        : "Nessuna analisi salvata in @analisi_economica_mezzi.",
      tone: savedAnalysis ? "success" : "warning",
    },
    {
      label: "Perimetro attuale",
      value: formatProcurementDecision(procurement?.perimeterDecision ?? "fuori_perimetro"),
      meta: `Filtro periodo diretto ${formatPeriodStatus(directPeriodStatus)}; valute da verificare ${totals.unknownCount}.`,
      tone:
        procurement?.perimeterDecision === "forte" && directPeriodStatus === "affidabile"
          ? "success"
          : "warning",
    },
  ];
}

function buildSections(snapshot: NextDossierMezzoCompositeSnapshot): InternalAiVehicleReportSection[] {
  const documentCosts = snapshot.documentCosts.snapshot;
  const savedAnalysis = snapshot.analisiEconomica.snapshot?.savedAnalysis;
  const procurement = snapshot.procurementPerimeter.snapshot;
  const directPeriodStatus = deriveDirectPeriodStatus({
    total: documentCosts?.counts.total ?? 0,
    withReliableDate: documentCosts?.counts.withReliableDate ?? 0,
  });
  const economicSummary =
    trimText(savedAnalysis?.riepilogoBreve ?? null, 240) ??
    (documentCosts?.counts.total
      ? "Base economica diretta disponibile dai documenti/costi collegati alla targa."
      : "Nessuna base economica diretta sufficiente letta dal clone per questa targa.");

  return [
    {
      id: "analisi-economica-base-diretta",
      title: "Base economica diretta",
      status:
        snapshot.documentCosts.status === "error"
          ? "errore"
          : (documentCosts?.counts.total ?? 0) > 0
            ? "completa"
            : "vuota",
      summary: economicSummary,
      bullets: [
        `Record diretti letti: ${documentCosts?.counts.total ?? 0}`,
        `Preventivi diretti: ${documentCosts?.counts.preventivi ?? 0}`,
        `Fatture dirette: ${documentCosts?.counts.fatture ?? 0}`,
        `Importi leggibili: ${documentCosts?.counts.withAmount ?? 0}`,
        `Date evento affidabili: ${documentCosts?.counts.withReliableDate ?? 0}`,
      ],
      notes: takeNotes(documentCosts?.limitations),
    },
    {
      id: "analisi-economica-snapshot-legacy",
      title: "Snapshot legacy salvato",
      status:
        snapshot.analisiEconomica.status === "error"
          ? "errore"
          : savedAnalysis
            ? "completa"
            : "vuota",
      summary: savedAnalysis
        ? `Snapshot IA legacy disponibile con qualita ${savedAnalysis.quality}, separato dai documenti/costi base.`
        : "Nessuna analisi economica salvata in @analisi_economica_mezzi per questa targa.",
      bullets: [
        `Aggiornamento snapshot: ${formatDateTimeLabel(savedAnalysis?.updatedAtTimestamp ?? null)}`,
        `Riepilogo breve: ${savedAnalysis?.riepilogoBreve ? "presente" : "assente"}`,
        `Analisi costi: ${savedAnalysis?.analisiCosti ? "presente" : "assente"}`,
        `Anomalie: ${savedAnalysis?.anomalie ? "presenti" : "assenti"}`,
        `Fornitori notevoli: ${savedAnalysis?.fornitoriNotevoli ? "presenti" : "assenti"}`,
      ],
      notes: [
        trimText(savedAnalysis?.analisiCosti ?? null, 180),
        trimText(savedAnalysis?.anomalie ?? null, 180),
        trimText(savedAnalysis?.fornitoriNotevoli ?? null, 180),
        ...takeNotes(snapshot.analisiEconomica.snapshot?.limitations, 2),
      ].filter((entry): entry is string => Boolean(entry)),
    },
    {
      id: "analisi-economica-perimetro",
      title: "Perimetro e cautele",
      status: procurement?.perimeterDecision === "forte" ? "completa" : "parziale",
      summary:
        procurement?.perimeterDecision === "forte"
          ? "Il procurement espone match forte sulla targa, ma resta comunque separato dalla base economica diretta."
          : "Il primo assorbimento resta prudente: base diretta + snapshot salvato, procurement separato e nessuna rigenerazione IA.",
      bullets: [
        `Procurement: ${formatProcurementDecision(procurement?.perimeterDecision ?? "fuori_perimetro")}`,
        `Preventivi globali letti: ${procurement?.counts.preventiviGlobali ?? 0}`,
        `Match forti sulla targa: ${procurement?.counts.preventiviMatchForte ?? 0}`,
        `Approvazioni sulla targa: ${procurement?.counts.approvazioniMezzo ?? 0}`,
        `Filtro periodo diretto: ${formatPeriodStatus(directPeriodStatus)}`,
      ],
      notes: [
        ...takeNotes(snapshot.overview.analysisLimitations, 2),
        ...takeNotes(snapshot.overview.procurementLimitations, 2),
      ],
    },
  ];
}

function buildMissingData(snapshot: NextDossierMezzoCompositeSnapshot): string[] {
  const documentCosts = snapshot.documentCosts.snapshot;
  const savedAnalysis = snapshot.analisiEconomica.snapshot?.savedAnalysis;
  const procurement = snapshot.procurementPerimeter.snapshot;
  const directPeriodStatus = deriveDirectPeriodStatus({
    total: documentCosts?.counts.total ?? 0,
    withReliableDate: documentCosts?.counts.withReliableDate ?? 0,
  });
  const totalsUnknownCount =
    (documentCosts?.totals.preventivi.unknownCount ?? 0) +
    (documentCosts?.totals.fatture.unknownCount ?? 0);

  const missing: string[] = [];

  if (!documentCosts?.counts.total) {
    missing.push("Nessun documento/costo diretto collegato alla targa: la base economica diretta resta vuota.");
  }
  if (documentCosts?.counts.total && documentCosts.counts.withAmount === 0) {
    missing.push("I documenti diretti letti non espongono ancora importi parsabili.");
  }
  if (directPeriodStatus === "parziale") {
    missing.push("Il filtro periodo sulla base economica diretta e solo parziale: non tutti i record hanno una data evento parsabile.");
  }
  if (directPeriodStatus === "non_dimostrabile") {
    missing.push("Il filtro periodo sulla base economica diretta non e dimostrabile con i record oggi leggibili.");
  }
  if (!savedAnalysis) {
    missing.push("Nessuno snapshot legacy salvato disponibile in @analisi_economica_mezzi.");
  }
  if (totalsUnknownCount > 0) {
    missing.push(`Sono presenti ${totalsUnknownCount} documenti con valuta da verificare: i totali diretti restano prudenziali.`);
  }
  if ((procurement?.counts.preventiviGlobali ?? 0) > 0 && procurement?.perimeterDecision !== "forte") {
    missing.push(
      `Il procurement esiste nel repo con ${procurement?.counts.preventiviGlobali ?? 0} preventivi globali, ma resta ${formatProcurementDecision(
        procurement?.perimeterDecision ?? "fuori_perimetro",
      )} per questa targa.`
    );
  }

  return missing;
}

function buildSources(snapshot: NextDossierMezzoCompositeSnapshot): InternalAiVehicleReportSource[] {
  const documentCosts = snapshot.documentCosts.snapshot;
  const savedAnalysis = snapshot.analisiEconomica.snapshot?.savedAnalysis;
  const procurement = snapshot.procurementPerimeter.snapshot;

  return [
    {
      id: "fonte-economica-documenti-diretti",
      title: "Documenti e costi diretti",
      status: (documentCosts?.counts.total ?? 0) > 0 ? "disponibile" : "parziale",
      description:
        "Base economica diretta letta dal layer clone-safe sui documenti/costi collegati alla targa, senza rigenerare IA.",
      datasetLabels: [...(documentCosts?.activeReadOnlyDatasets ?? ["@costiMezzo", "@documenti_mezzi", "@documenti_magazzino", "@documenti_generici"])],
      countLabel: `${documentCosts?.counts.total ?? 0} record diretti`,
      notes: takeNotes(documentCosts?.limitations, 2),
    },
    {
      id: "fonte-economica-snapshot-legacy",
      title: "Snapshot analitico legacy salvato",
      status: savedAnalysis ? "disponibile" : "parziale",
      description:
        "Supporto read-only da @analisi_economica_mezzi, mantenuto separato dai documenti/costi base e non rigenerato dal clone.",
      datasetLabels: ["@analisi_economica_mezzi"],
      countLabel: savedAnalysis
        ? `Aggiornato ${formatDateTimeLabel(savedAnalysis.updatedAtTimestamp)}`
        : null,
      notes: takeNotes(snapshot.analisiEconomica.snapshot?.limitations, 2),
    },
    {
      id: "fonte-economica-procurement",
      title: "Procurement e approvazioni",
      status: procurement?.perimeterDecision === "forte" ? "disponibile" : "parziale",
      description:
        "Supporto perimetrale read-only: il workflow procurement resta separato dalla base economica diretta del mezzo.",
      datasetLabels: [...(procurement?.datasets ?? ["@preventivi", "@preventivi_approvazioni"])],
      countLabel: `${procurement?.counts.preventiviGlobali ?? 0} preventivi globali`,
      notes: takeNotes(procurement?.limitations, 2),
    },
  ];
}

function buildPreview(snapshot: NextDossierMezzoCompositeSnapshot): InternalAiEconomicAnalysisPreview {
  const documentCosts = snapshot.documentCosts.snapshot;
  const savedAnalysis = snapshot.analisiEconomica.snapshot?.savedAnalysis;
  const procurement = snapshot.procurementPerimeter.snapshot;
  const directPeriodStatus = deriveDirectPeriodStatus({
    total: documentCosts?.counts.total ?? 0,
    withReliableDate: documentCosts?.counts.withReliableDate ?? 0,
  });

  return {
    mezzoTarga: snapshot.mezzo.targa,
    title: `Analisi economica preview-first per ${snapshot.mezzo.targa}`,
    subtitle:
      "Primo assorbimento read-only della capability legacy: usa solo layer clone-safe e l'eventuale snapshot economico gia salvato, senza backend legacy canonico.",
    generatedAt: new Date().toISOString(),
    header: {
      targa: snapshot.mezzo.targa,
      categoria: snapshot.mezzo.categoria,
      marcaModello: snapshot.mezzo.marcaModello,
      documentiDiretti: `${documentCosts?.counts.total ?? 0} record`,
      snapshotLegacy: savedAnalysis ? `presente (${savedAnalysis.quality})` : "assente",
      procurement: formatProcurementDecision(procurement?.perimeterDecision ?? "fuori_perimetro"),
      periodoDiretto: formatPeriodStatus(directPeriodStatus),
    },
    cards: buildCards(snapshot),
    sections: buildSections(snapshot),
    missingData: buildMissingData(snapshot),
    sources: buildSources(snapshot),
    previewState: buildPreviewState(snapshot),
  };
}

export async function readInternalAiEconomicAnalysisPreview(
  targa: string,
): Promise<InternalAiEconomicAnalysisReadResult> {
  const normalizedTarga = normalizeNextMezzoTarga(targa);

  if (!normalizedTarga) {
    return {
      status: "invalid_query",
      normalizedTarga: null,
      message: "Inserisci una targa valida prima di aprire l'analisi economica in anteprima.",
      preview: null,
    };
  }

  const snapshot = await readNextDossierMezzoCompositeSnapshot(normalizedTarga);
  if (!snapshot) {
    return {
      status: "not_found",
      normalizedTarga,
      message: `Nessun mezzo leggibile trovato nel clone per la targa ${normalizedTarga}.`,
      preview: null,
    };
  }

  const preview = buildPreview(snapshot);
  const savedAnalysis = snapshot.analisiEconomica.snapshot?.savedAnalysis;
  const directRecords = snapshot.documentCosts.snapshot?.counts.total ?? 0;

  return {
    status: "ready",
    normalizedTarga,
    message: savedAnalysis
      ? `Analisi economica in anteprima pronta per ${normalizedTarga}: ${directRecords} record diretti letti e snapshot legacy salvato disponibile.`
      : `Analisi economica in anteprima pronta per ${normalizedTarga}: ${directRecords} record diretti letti e nessuno snapshot legacy salvato disponibile.`,
    preview,
  };
}
