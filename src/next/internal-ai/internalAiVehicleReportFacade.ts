import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";
import {
  readNextDossierMezzoCompositeSnapshot,
  type NextDossierDomainSectionState,
  type NextDossierMezzoCompositeSnapshot,
} from "../domain/nextDossierMezzoDomain";
import type { NextDocumentiCostiReadOnlyItem } from "../domain/nextDocumentiCostiDomain";
import type { NextGommeReadOnlyItem, NextManutenzioneReadOnlyItem } from "../domain/nextManutenzioniGommeDomain";
import type { NextLavoroReadOnlyItem } from "../domain/nextLavoriDomain";
import type { NextRifornimentoReadOnlyItem } from "../domain/nextRifornimentiDomain";
import {
  describeInternalAiPeriodApplication,
  filterItemsByInternalAiReportPeriod,
  resolveInternalAiReportPeriodContext,
} from "./internalAiReportPeriod";
import type {
  InternalAiApprovalState,
  InternalAiPreviewState,
  InternalAiReportPeriodContext,
  InternalAiReportPeriodInput,
  InternalAiReportPeriodSectionStatus,
  InternalAiVehicleReportPreview,
  InternalAiVehicleReportSection,
  InternalAiVehicleReportSectionStatus,
  InternalAiVehicleReportSource,
  InternalAiVehicleReportSourceStatus,
} from "./internalAiTypes";

export type InternalAiVehicleReportReadResult =
  | {
      status: "invalid_query" | "not_found";
      normalizedTarga: string | null;
      message: string;
      report: null;
    }
  | {
      status: "ready";
      normalizedTarga: string;
      message: string;
      report: InternalAiVehicleReportPreview;
    };

type PeriodAwareMeta = {
  periodStatus: InternalAiReportPeriodSectionStatus;
  periodNote: string | null;
};

function takeNotes(notes: string[] | undefined, limit = 3): string[] {
  return (notes ?? []).filter(Boolean).slice(0, limit);
}

function formatCountLabel(value: number, suffix: string): string {
  return `${value} ${suffix}`;
}

function mapSectionStateToStatus(args: {
  state: NextDossierDomainSectionState<unknown>;
  visibleCount: number;
  availableCount: number;
  context: InternalAiReportPeriodContext;
}): InternalAiVehicleReportSectionStatus {
  if (args.state.status === "error") return "errore";
  if (args.visibleCount > 0) return "completa";
  if (args.context.appliesFilter && args.availableCount > 0) return "parziale";
  return "vuota";
}

function mapSourceStatus(args: {
  state: NextDossierDomainSectionState<unknown>;
  visibleCount: number;
  availableCount: number;
  context: InternalAiReportPeriodContext;
}): InternalAiVehicleReportSourceStatus {
  if (args.state.status === "error") return "errore";
  if (args.visibleCount > 0) return "disponibile";
  if (args.context.appliesFilter && args.availableCount > 0) return "parziale";
  return "parziale";
}

function buildFilterablePeriodMeta(args: {
  context: InternalAiReportPeriodContext;
  noun: string;
  totalCount: number;
  matchingCount: number;
  outsideRangeCount: number;
  missingTimestampCount: number;
}): PeriodAwareMeta {
  if (!args.context.appliesFilter) {
    return {
      periodStatus: "nessun_filtro",
      periodNote: "Nessun filtro periodo attivo: la sezione legge tutto lo storico disponibile.",
    };
  }

  if (args.totalCount === 0) {
    return {
      periodStatus: "non_disponibile",
      periodNote: `Nessun record ${args.noun} leggibile da confrontare con il periodo attivo.`,
    };
  }

  if (args.matchingCount === 0 && args.missingTimestampCount === args.totalCount) {
    return {
      periodStatus: "non_disponibile",
      periodNote: `Il filtro periodo non e applicabile ai record ${args.noun}: manca una data affidabile su tutti gli elementi letti.`,
    };
  }

  return {
    periodStatus: "applicato",
    periodNote: describeInternalAiPeriodApplication({
      noun: args.noun,
      totalCount: args.totalCount,
      matchingCount: args.matchingCount,
      outsideRangeCount: args.outsideRangeCount,
      missingTimestampCount: args.missingTimestampCount,
      context: args.context,
    }),
  };
}

function buildStaticPeriodMeta(
  context: InternalAiReportPeriodContext,
  note: string,
): PeriodAwareMeta {
  if (!context.appliesFilter) {
    return {
      periodStatus: "nessun_filtro",
      periodNote: "Nessun filtro periodo attivo sul report corrente.",
    };
  }

  return {
    periodStatus: "non_applicabile",
    periodNote: note,
  };
}

function createSection(args: {
  id: string;
  title: string;
  status: InternalAiVehicleReportSectionStatus;
  summary: string;
  bullets: string[];
  notes?: string[];
  period: PeriodAwareMeta;
}): InternalAiVehicleReportSection {
  return {
    id: args.id,
    title: args.title,
    status: args.status,
    summary: args.summary,
    bullets: args.bullets,
    notes: takeNotes(args.notes, 4),
    periodStatus: args.period.periodStatus,
    periodNote: args.period.periodNote,
  };
}

function createSource(args: {
  id: string;
  title: string;
  status: InternalAiVehicleReportSourceStatus;
  description: string;
  datasetLabels: string[];
  countLabel: string | null;
  notes?: string[];
  period: PeriodAwareMeta;
}): InternalAiVehicleReportSource {
  return {
    id: args.id,
    title: args.title,
    status: args.status,
    description: args.description,
    datasetLabels: args.datasetLabels,
    countLabel: args.countLabel,
    notes: takeNotes(args.notes, 4),
    periodStatus: args.period.periodStatus,
    periodNote: args.period.periodNote,
  };
}

function buildPreviewStates(snapshot: NextDossierMezzoCompositeSnapshot): Pick<
  InternalAiVehicleReportPreview,
  "previewState" | "approvalState"
> {
  const hasEnoughData =
    (snapshot.lavori.snapshot?.counts.total ?? 0) > 0 ||
    (snapshot.refuels.snapshot?.counts.total ?? 0) > 0 ||
    (snapshot.documentCosts.snapshot?.counts.total ?? 0) > 0 ||
    (snapshot.maintenance.snapshot?.counts.manutenzioni ?? 0) > 0 ||
    (snapshot.materialiMovimenti.snapshot?.counts.total ?? 0) > 0 ||
    Boolean(snapshot.analisiEconomica.snapshot?.savedAnalysis);

  const previewState: InternalAiPreviewState = {
    status: hasEnoughData ? "preview_ready" : "revision_requested",
    updatedAt: new Date().toISOString(),
    note: hasEnoughData
      ? "Anteprima report costruita dai layer in sola lettura del clone."
      : "Anteprima disponibile ma con copertura dati limitata; utile una revisione manuale.",
  };

  const approvalState: InternalAiApprovalState = {
    status: hasEnoughData ? "awaiting_approval" : "revision_requested",
    requestedBy: "ia.interna.preview",
    updatedAt: previewState.updatedAt,
    note: hasEnoughData
      ? "Report solo approvabile a livello di scaffolding, senza applicazione reale."
      : "Prima di considerarla approvabile va completata la verifica dei dati mancanti.",
  };

  return { previewState, approvalState };
}

function buildMissingData(
  snapshot: NextDossierMezzoCompositeSnapshot,
  periodContext: InternalAiReportPeriodContext,
): string[] {
  const missing: string[] = [];

  if (!snapshot.mezzo.autistaNome) {
    missing.push("Autista assegnato non disponibile nell'anagrafica flotta.");
  }
  if (!snapshot.mezzo.librettoUrl) {
    missing.push("Libretto mezzo non presente nel dataset anagrafico.");
  }
  if ((snapshot.refuels.snapshot?.counts.total ?? 0) === 0) {
    missing.push("Nessun rifornimento utile collegato alla targa.");
  }
  if ((snapshot.documentCosts.snapshot?.counts.total ?? 0) === 0) {
    missing.push("Nessun documento o costo utile collegato alla targa.");
  }
  if ((snapshot.materialiMovimenti.snapshot?.counts.total ?? 0) === 0) {
    missing.push("Nessun movimento materiali collegabile in modo affidabile al mezzo.");
  }
  if (!snapshot.analisiEconomica.snapshot?.savedAnalysis) {
    missing.push("Nessuna analisi economica legacy salvata per questa targa.");
  }
  if (periodContext.appliesFilter) {
    missing.push(
      "Il filtro periodo non viene applicato a identita mezzo, movimenti materiali e analisi economica per evitare inferenze temporali non affidabili.",
    );
  }

  return missing;
}

function withPeriodNotes(
  base: InternalAiReportPeriodContext,
  extraNotes: string[],
): InternalAiReportPeriodContext {
  return {
    ...base,
    notes: [...base.notes, ...extraNotes.filter(Boolean)],
  };
}

function buildReport(
  snapshot: NextDossierMezzoCompositeSnapshot,
  periodInput?: InternalAiReportPeriodInput,
): InternalAiVehicleReportPreview {
  const generatedAt = new Date().toISOString();
  const periodBase = resolveInternalAiReportPeriodContext(periodInput);
  const previewStates = buildPreviewStates(snapshot);

  const lavoriItems = snapshot.lavori.snapshot?.items ?? [];
  const lavoriPeriod = filterItemsByInternalAiReportPeriod<NextLavoroReadOnlyItem>(
    lavoriItems,
    (item) => item.timestampEsecuzione ?? item.timestampInserimento,
    periodBase,
  );
  const lavoriDaEseguire = lavoriPeriod.filteredItems.filter((entry) => entry.matchesGlobalOpenView);
  const lavoriInAttesa = lavoriPeriod.filteredItems.filter((entry) => entry.matchesDossierInAttesaView);
  const lavoriEseguiti = lavoriPeriod.filteredItems.filter((entry) => entry.eseguito === true);
  const lavoriPeriodMeta = buildFilterablePeriodMeta({
    context: periodBase,
    noun: "lavori",
    totalCount: lavoriPeriod.totalCount,
    matchingCount: lavoriPeriod.matchingCount,
    outsideRangeCount: lavoriPeriod.outsideRangeCount,
    missingTimestampCount: lavoriPeriod.missingTimestampCount,
  });

  const maintenanceItems = snapshot.maintenance.snapshot?.maintenanceItems ?? [];
  const gommeItems = snapshot.maintenance.snapshot?.gommeItems ?? [];
  const maintenancePeriod = filterItemsByInternalAiReportPeriod<NextManutenzioneReadOnlyItem>(
    maintenanceItems,
    (item) => item.timestamp,
    periodBase,
  );
  const gommePeriod = filterItemsByInternalAiReportPeriod<NextGommeReadOnlyItem>(
    gommeItems,
    (item) => item.timestamp,
    periodBase,
  );
  const maintenancePeriodMeta = buildFilterablePeriodMeta({
    context: periodBase,
    noun: "manutenzioni",
    totalCount: maintenancePeriod.totalCount + gommePeriod.totalCount,
    matchingCount: maintenancePeriod.matchingCount + gommePeriod.matchingCount,
    outsideRangeCount: maintenancePeriod.outsideRangeCount + gommePeriod.outsideRangeCount,
    missingTimestampCount:
      maintenancePeriod.missingTimestampCount + gommePeriod.missingTimestampCount,
  });
  const gommeFromMaintenance = gommePeriod.filteredItems.filter(
    (item) => item.sourceOrigin === "manutenzione_derivata",
  ).length;
  const gommeFromTmp = gommePeriod.filteredItems.filter(
    (item) => item.sourceOrigin === "evento_autista_tmp",
  ).length;
  const gommeFromOfficial = gommePeriod.filteredItems.filter(
    (item) => item.sourceOrigin === "evento_ufficiale",
  ).length;
  const gommeStrongMatches = gommePeriod.filteredItems.filter(
    (item) => item.vehicleMatchReliability === "forte",
  ).length;
  const gommePlausibleMatches = gommePeriod.filteredItems.filter(
    (item) => item.vehicleMatchReliability === "plausibile",
  ).length;

  const refuelItems = snapshot.refuels.snapshot?.items ?? [];
  const refuelPeriod = filterItemsByInternalAiReportPeriod<NextRifornimentoReadOnlyItem>(
    refuelItems,
    (item) => item.timestampRicostruito,
    periodBase,
  );
  const refuelsTotal = refuelPeriod.filteredItems.length;
  const refuelPeriodMeta = buildFilterablePeriodMeta({
    context: periodBase,
    noun: "rifornimenti",
    totalCount: refuelPeriod.totalCount,
    matchingCount: refuelPeriod.matchingCount,
    outsideRangeCount: refuelPeriod.outsideRangeCount,
    missingTimestampCount: refuelPeriod.missingTimestampCount,
  });

  const documentItems = snapshot.documentCosts.snapshot?.items ?? [];
  const documentPeriod = filterItemsByInternalAiReportPeriod<NextDocumentiCostiReadOnlyItem>(
    documentItems,
    (item) => item.sortTimestamp ?? item.timestamp,
    periodBase,
  );
  const filteredPreventivi = documentPeriod.filteredItems.filter(
    (item) => item.category === "preventivo",
  );
  const filteredFatture = documentPeriod.filteredItems.filter((item) => item.category === "fattura");
  const filteredDocumentiUtili = documentPeriod.filteredItems.filter(
    (item) => item.category === "documento_utile",
  );
  const documentsTotal = documentPeriod.filteredItems.length;
  const savedAnalysisAvailable = Boolean(snapshot.analisiEconomica.snapshot?.savedAnalysis);
  const documentPeriodMeta = buildFilterablePeriodMeta({
    context: periodBase,
    noun: "documenti e costi",
    totalCount: documentPeriod.totalCount,
    matchingCount: documentPeriod.matchingCount,
    outsideRangeCount: documentPeriod.outsideRangeCount,
    missingTimestampCount: documentPeriod.missingTimestampCount,
  });

  const materialiTotal = snapshot.materialiMovimenti.snapshot?.counts.total ?? 0;
  const materialiPeriodMeta = buildStaticPeriodMeta(
    periodBase,
    "La sezione materiali resta fuori filtro: il layer combina date e match legacy non abbastanza uniformi per un periodo affidabile del report.",
  );
  const identitaPeriodMeta = buildStaticPeriodMeta(
    periodBase,
    "La sezione identita mezzo e anagrafica e non rappresenta eventi temporali filtrabili.",
  );
  const analisiPeriodMeta = buildStaticPeriodMeta(
    periodBase,
    "L'analisi economica salvata e uno snapshot legacy puntuale: il report la mostra come contesto, senza rifiltrarne la copertura storica.",
  );

  const periodContext = withPeriodNotes(periodBase, [
    periodBase.appliesFilter
      ? "Filtro periodo applicato davvero a lavori, manutenzioni, rifornimenti e documenti/costi con data leggibile."
      : "Il report mostra tutto lo storico disponibile delle sezioni lette nel clone.",
      periodBase.appliesFilter
      ? "Identita mezzo, movimenti materiali e analisi economica restano visibili come contesto non filtrabile."
      : "",
  ]);

  const missingData = buildMissingData(snapshot, periodContext);

  const documentSectionStatus: InternalAiVehicleReportSectionStatus =
    snapshot.documentCosts.status === "error"
      ? "errore"
      : documentsTotal > 0
        ? mapSectionStateToStatus({
            state: snapshot.documentCosts,
            visibleCount: documentsTotal,
            availableCount: documentItems.length,
            context: periodBase,
          })
        : savedAnalysisAvailable
          ? "parziale"
          : mapSectionStateToStatus({
              state: snapshot.documentCosts,
              visibleCount: documentsTotal,
              availableCount: documentItems.length,
              context: periodBase,
            });

  const documentSectionSummary = (() => {
    if (documentsTotal > 0 && savedAnalysisAvailable) {
      return `Trovati ${documentsTotal} documenti/costi collegati al mezzo nel periodo attivo; e disponibile anche una analisi economica legacy salvata fuori filtro.`;
    }

    if (documentsTotal > 0) {
      return `Trovati ${documentsTotal} documenti/costi collegati al mezzo nel periodo attivo.`;
    }

    if (savedAnalysisAvailable) {
      return periodBase.appliesFilter && documentItems.length > 0
        ? "Nessun documento o costo ricade nel periodo attivo, ma e disponibile una analisi economica legacy salvata fuori filtro."
        : "Nessun documento/costo utile collegato alla targa, ma e disponibile una analisi economica legacy salvata come contesto read-only.";
    }

    return periodBase.appliesFilter && documentItems.length > 0
      ? "Nessun documento o costo ricade nel periodo attivo, ma il layer documentale e disponibile."
      : "Nessun documento o costo utile collegato alla targa.";
  })();

  const documentSourceCountLabel = savedAnalysisAvailable
    ? documentsTotal > 0
      ? `${documentsTotal} documenti/costi nel periodo + 1 analisi salvata`
      : "1 analisi salvata"
    : formatCountLabel(documentsTotal, "documenti/costi nel periodo");

  const sections: InternalAiVehicleReportSection[] = [
    createSection({
      id: "identita-mezzo",
      title: "Identita mezzo",
      status: "completa",
      summary: "Intestazione mezzo costruita dall'anagrafica flotta in sola lettura.",
      bullets: [
        `Targa: ${snapshot.mezzo.targa}`,
        `Categoria: ${snapshot.mezzo.categoria ?? "Non disponibile"}`,
        `Marca e modello: ${snapshot.mezzo.marcaModello ?? "Non disponibile"}`,
        `Autista: ${snapshot.mezzo.autistaNome ?? "Non disponibile"}`,
      ],
      notes: takeNotes(snapshot.overview.technicalLimitations, 2),
      period: identitaPeriodMeta,
    }),
    createSection({
      id: "lavori-operativita",
      title: "Lavori e operativita tecnica",
      status: mapSectionStateToStatus({
        state: snapshot.lavori,
        visibleCount: lavoriPeriod.filteredItems.length,
        availableCount: lavoriItems.length,
        context: periodBase,
      }),
      summary:
        lavoriPeriod.filteredItems.length > 0
          ? `Trovati ${lavoriPeriod.filteredItems.length} lavori collegati alla targa nel periodo attivo.`
          : periodBase.appliesFilter && lavoriItems.length > 0
            ? "Nessun lavoro ricade nel periodo attivo, ma il layer lavori e disponibile."
            : "Nessun lavoro collegato alla targa nel perimetro in sola lettura.",
      bullets: [
        `Da eseguire: ${lavoriDaEseguire.length}`,
        `In attesa: ${lavoriInAttesa.length}`,
        `Eseguiti: ${lavoriEseguiti.length}`,
        `Storico tecnico: ${maintenancePeriod.filteredItems.length} manutenzioni lette nel periodo`,
      ],
      notes: [
        ...(snapshot.lavori.error ? [snapshot.lavori.error] : []),
        ...takeNotes(snapshot.lavori.snapshot?.limitations),
      ],
      period: lavoriPeriodMeta,
    }),
    createSection({
      id: "manutenzioni-gomme",
      title: "Manutenzioni e gomme",
      status: mapSectionStateToStatus({
        state: snapshot.maintenance,
        visibleCount: maintenancePeriod.filteredItems.length + gommePeriod.filteredItems.length,
        availableCount: maintenanceItems.length + gommeItems.length,
        context: periodBase,
      }),
      summary:
        maintenancePeriod.filteredItems.length > 0 || gommePeriod.filteredItems.length > 0
          ? `Trovate ${maintenancePeriod.filteredItems.length} manutenzioni e ${gommePeriod.filteredItems.length} eventi gomme nel periodo attivo (${gommeStrongMatches} match forti, ${gommePlausibleMatches} plausibili).`
          : periodBase.appliesFilter && (maintenanceItems.length > 0 || gommeItems.length > 0)
            ? "Nessuna manutenzione o evento gomme ricade nel periodo attivo, ma il layer dedicato e disponibile."
            : "Nessuna manutenzione o evento gomme disponibile per il mezzo nel layer dedicato.",
      bullets: [
        `Manutenzioni con km: ${maintenancePeriod.filteredItems.filter((item) => item.km !== null).length}`,
        `Manutenzioni con ore: ${maintenancePeriod.filteredItems.filter((item) => item.ore !== null).length}`,
        `Eventi gomme: ${gommePeriod.filteredItems.length} (${gommeFromMaintenance} da manutenzioni, ${gommeFromTmp + gommeFromOfficial} da dataset gomme)`,
        `Match gomme: ${gommeStrongMatches} forti, ${gommePlausibleMatches} plausibili`,
        `Stato manutenzione programmata: ${
          snapshot.maintenance.snapshot?.scheduledMaintenance.status ?? "non disponibile"
        }`,
      ],
      notes: [
        ...(snapshot.maintenance.error ? [snapshot.maintenance.error] : []),
        ...(gommePlausibleMatches > 0
          ? [
              `${gommePlausibleMatches} eventi gomme del periodo sono collegati solo da targa di contesto e restano copertura plausibile, non conferma forte del mezzo.`,
            ]
          : []),
        ...((snapshot.maintenance.snapshot?.counts.gommeDeduplicateConManutenzione ?? 0) > 0
          ? [
              `${snapshot.maintenance.snapshot?.counts.gommeDeduplicateConManutenzione ?? 0} eventi gomme extra sono stati deduplicati rispetto alle manutenzioni per evitare doppio conteggio.`,
            ]
          : []),
        ...takeNotes(snapshot.maintenance.snapshot?.limitations),
      ],
      period: maintenancePeriodMeta,
    }),
    createSection({
      id: "rifornimenti",
      title: "Rifornimenti",
      status: mapSectionStateToStatus({
        state: snapshot.refuels,
        visibleCount: refuelsTotal,
        availableCount: refuelItems.length,
        context: periodBase,
      }),
      summary:
        refuelsTotal > 0
          ? `Trovati ${refuelsTotal} rifornimenti per la targa nel periodo attivo.`
          : periodBase.appliesFilter && refuelItems.length > 0
            ? "Nessun rifornimento ricade nel periodo attivo, ma il layer D04 e disponibile."
            : "Nessun rifornimento utile letto per questa targa.",
      bullets: [
        `Record con km: ${refuelPeriod.filteredItems.filter((item) => item.km !== null).length}`,
        `Record con costo: ${refuelPeriod.filteredItems.filter((item) => item.costo !== null).length}`,
        `Litri totali: ${refuelPeriod.filteredItems.reduce((sum, item) => sum + (item.litri ?? 0), 0)}`,
        `Costo totale noto: ${refuelPeriod.filteredItems.reduce((sum, item) => sum + (item.costo ?? 0), 0)}`,
      ],
      notes: [
        ...(snapshot.refuels.error ? [snapshot.refuels.error] : []),
        ...takeNotes(snapshot.refuels.snapshot?.limitations),
      ],
      period: refuelPeriodMeta,
    }),
    createSection({
      id: "materiali",
      title: "Movimenti materiali",
      status:
        snapshot.materialiMovimenti.status === "error"
          ? "errore"
          : materialiTotal > 0
            ? "parziale"
            : "vuota",
      summary:
        materialiTotal > 0
          ? `Trovati ${materialiTotal} movimenti materiali collegabili alla targa nel quadro generale read-only.`
          : "Nessun movimento materiali collegabile in modo affidabile al mezzo.",
      bullets: [
        `Match targa esplicita: ${snapshot.materialiMovimenti.snapshot?.counts.matchedByExplicitTarga ?? 0}`,
        `Match da destinatario: ${
          (snapshot.materialiMovimenti.snapshot?.counts.matchedByDestinatarioLabel ?? 0) +
          (snapshot.materialiMovimenti.snapshot?.counts.matchedByDestinatarioRefId ?? 0)
        }`,
        `Movimenti con costo: ${snapshot.materialiMovimenti.snapshot?.counts.withCost ?? 0}`,
        `Documenti supporto costo: ${snapshot.materialiMovimenti.snapshot?.materialCostSupport.documentCount ?? 0}`,
      ],
      notes: [
        ...(snapshot.materialiMovimenti.error ? [snapshot.materialiMovimenti.error] : []),
        ...takeNotes(snapshot.materialiMovimenti.snapshot?.limitations),
      ],
      period: materialiPeriodMeta,
    }),
    createSection({
      id: "documenti-costi",
      title: "Documenti, costi e analisi",
      status: documentSectionStatus,
      summary: documentSectionSummary,
      bullets: [
        `Preventivi: ${filteredPreventivi.length}`,
        `Fatture: ${filteredFatture.length}`,
        `Documenti utili: ${filteredDocumentiUtili.length}`,
        `Analisi economica salvata: ${snapshot.analisiEconomica.snapshot?.savedAnalysis ? "Si" : "No"}`,
      ],
      notes: [
        ...(snapshot.documentCosts.error ? [snapshot.documentCosts.error] : []),
        ...takeNotes(snapshot.documentCosts.snapshot?.limitations),
        ...takeNotes(snapshot.analisiEconomica.snapshot?.limitations),
      ],
      period: documentPeriodMeta,
    }),
  ];

  const sources: InternalAiVehicleReportSource[] = [
    createSource({
      id: "anagrafica",
      title: "Anagrafica flotta",
      status: "disponibile",
      description: "Identita mezzo letta dal layer in sola lettura delle anagrafiche NEXT.",
      datasetLabels: ["storage/@mezzi_aziendali"],
      countLabel: "1 mezzo letto",
      notes: [],
      period: identitaPeriodMeta,
    }),
    createSource({
      id: "lavori",
      title: snapshot.lavori.snapshot?.domainName ?? "Lavori",
      status: mapSourceStatus({
        state: snapshot.lavori,
        visibleCount: lavoriPeriod.filteredItems.length,
        availableCount: lavoriItems.length,
        context: periodBase,
      }),
      description: "Lettura in sola lettura dei lavori mezzo-centrici gia normalizzati nel clone.",
      datasetLabels: snapshot.lavori.snapshot
        ? [...snapshot.lavori.snapshot.logicalDatasets]
        : ["storage/@lavori"],
      countLabel: formatCountLabel(lavoriPeriod.filteredItems.length, "lavori nel periodo"),
      notes: takeNotes(snapshot.lavori.snapshot?.limitations),
      period: lavoriPeriodMeta,
    }),
    createSource({
      id: "manutenzioni",
      title: snapshot.maintenance.snapshot?.domainName ?? "Manutenzioni e gomme",
      status: mapSourceStatus({
        state: snapshot.maintenance,
        visibleCount: maintenancePeriod.filteredItems.length + gommePeriod.filteredItems.length,
        availableCount: maintenanceItems.length + gommeItems.length,
        context: periodBase,
      }),
      description:
        "Storico manutenzioni e convergenza eventi gomme letti dai layer NEXT dedicati, con distinzione tra match forti e plausibili.",
      datasetLabels: snapshot.maintenance.snapshot
        ? [...snapshot.maintenance.snapshot.logicalDatasets]
        : [
            "storage/@manutenzioni",
            "storage/@mezzi_aziendali",
            "storage/@cambi_gomme_autisti_tmp",
            "storage/@gomme_eventi",
          ],
      countLabel: `${maintenancePeriod.filteredItems.length} manutenzioni, ${gommePeriod.filteredItems.length} eventi gomme`,
      notes: takeNotes(snapshot.maintenance.snapshot?.limitations),
      period: maintenancePeriodMeta,
    }),
    createSource({
      id: "rifornimenti",
      title: snapshot.refuels.snapshot?.domainName ?? "Rifornimenti",
      status: mapSourceStatus({
        state: snapshot.refuels,
        visibleCount: refuelsTotal,
        availableCount: refuelItems.length,
        context: periodBase,
      }),
      description: "Rifornimenti letti con merge in sola lettura tra dataset business e feed campo.",
      datasetLabels: snapshot.refuels.snapshot
        ? [
            snapshot.refuels.snapshot.activeReadOnlyDataset,
            ...snapshot.refuels.snapshot.supportingReadOnlyDatasets,
          ]
        : ["storage/@rifornimenti", "storage/@rifornimenti_autisti_tmp"],
      countLabel: formatCountLabel(refuelsTotal, "record nel periodo"),
      notes: takeNotes(snapshot.refuels.snapshot?.limitations),
      period: refuelPeriodMeta,
    }),
    createSource({
      id: "materiali",
      title: snapshot.materialiMovimenti.snapshot?.domainName ?? "Movimenti materiali",
      status:
        snapshot.materialiMovimenti.status === "error"
          ? "errore"
          : materialiTotal > 0
            ? "parziale"
            : "parziale",
      description: "Movimenti materiali ricostruiti dal layer mezzo-centrico in sola lettura del clone.",
      datasetLabels: snapshot.materialiMovimenti.snapshot
        ? [...snapshot.materialiMovimenti.snapshot.logicalDatasets]
        : ["storage/@materialiconsegnati"],
      countLabel: formatCountLabel(materialiTotal, "movimenti totali"),
      notes: takeNotes(snapshot.materialiMovimenti.snapshot?.limitations),
      period: materialiPeriodMeta,
    }),
    createSource({
      id: "documenti-costi",
      title: snapshot.documentCosts.snapshot?.domainName ?? "Documenti e costi",
      status: mapSourceStatus({
        state: snapshot.documentCosts,
        visibleCount: documentsTotal,
        availableCount: documentItems.length,
        context: periodBase,
      }),
      description: "Documenti e costi letti dai layer documentali ed economici in sola lettura del clone.",
      datasetLabels: snapshot.documentCosts.snapshot
        ? [...snapshot.documentCosts.snapshot.activeReadOnlyDatasets]
        : ["storage/@costiMezzo", "@documenti_mezzi", "@documenti_magazzino", "@documenti_generici"],
      countLabel: documentSourceCountLabel,
      notes: takeNotes(snapshot.documentCosts.snapshot?.limitations),
      period: documentPeriodMeta,
    }),
    createSource({
      id: "analisi-economica",
      title: "Analisi economica salvata",
      status: snapshot.analisiEconomica.snapshot?.savedAnalysis ? "disponibile" : "parziale",
      description: "Verifica in sola lettura dell'eventuale snapshot legacy di analisi economica.",
      datasetLabels: ["@analisi_economica_mezzi"],
      countLabel: snapshot.analisiEconomica.snapshot?.savedAnalysis ? "1 analisi trovata" : null,
      notes: takeNotes(snapshot.analisiEconomica.snapshot?.limitations),
      period: analisiPeriodMeta,
    }),
  ];

  return {
    reportType: "targa",
    targetId: snapshot.mezzo.id,
    targetLabel: snapshot.mezzo.targa,
    mezzoTarga: snapshot.mezzo.targa,
    title: `Anteprima report targa ${snapshot.mezzo.targa}`,
    subtitle:
      "Report costruito in sola lettura dai layer NEXT gia esistenti, con contesto periodo esplicito e senza scritture.",
    generatedAt,
    header: {
      targa: snapshot.mezzo.targa,
      categoria: snapshot.mezzo.categoria,
      marcaModello: snapshot.mezzo.marcaModello,
      autistaNome: snapshot.mezzo.autistaNome,
      revisione: snapshot.mezzo.dataScadenzaRevisione,
      librettoPresente: Boolean(snapshot.mezzo.librettoUrl),
      manutenzioneProgrammata: snapshot.mezzo.manutenzioneProgrammata,
    },
    cards: [
      {
        label: "Lavori",
        value: String(lavoriPeriod.filteredItems.length),
        meta: `Da eseguire ${lavoriDaEseguire.length}, in attesa ${lavoriInAttesa.length}, eseguiti ${lavoriEseguiti.length}`,
        tone: lavoriPeriod.filteredItems.length > 0 ? "success" : "warning",
      },
      {
        label: "Manutenzioni e gomme",
        value: String(maintenancePeriod.filteredItems.length + gommePeriod.filteredItems.length),
        meta: `Eventi gomme ${gommePeriod.filteredItems.length} (forti ${gommeStrongMatches}, plausibili ${gommePlausibleMatches})`,
        tone:
          maintenancePeriod.filteredItems.length > 0 || gommePeriod.filteredItems.length > 0
            ? "success"
            : "warning",
      },
      {
        label: "Rifornimenti",
        value: String(refuelsTotal),
        meta: `Litri totali ${refuelPeriod.filteredItems.reduce((sum, item) => sum + (item.litri ?? 0), 0)}`,
        tone: refuelsTotal > 0 ? "success" : "warning",
      },
      {
        label: "Documenti e costi",
        value: String(documentsTotal),
        meta: `Preventivi ${filteredPreventivi.length}, fatture ${filteredFatture.length}`,
        tone: documentsTotal > 0 ? "success" : "warning",
      },
    ],
    periodContext,
    sections,
    missingData,
    evidences: [
      ...snapshot.overview.keySignals,
      ...snapshot.overview.readerLabels,
      `Periodo attivo: ${periodContext.label}`,
      `Blocchi importati: ${snapshot.overview.importedBlockLabels.join(", ") || "nessuno"}`,
    ].filter(Boolean),
    sources,
    previewState: previewStates.previewState,
    approvalState: previewStates.approvalState,
  };
}

export async function readInternalAiVehicleReportPreview(
  rawTarga: string,
  periodInput?: InternalAiReportPeriodInput,
): Promise<InternalAiVehicleReportReadResult> {
  const normalizedTarga = normalizeNextMezzoTarga(rawTarga);
  const periodContext = resolveInternalAiReportPeriodContext(periodInput);

  if (!normalizedTarga) {
    return {
      status: "invalid_query",
      normalizedTarga: null,
      message: "Inserisci una targa valida prima di avviare l'anteprima.",
      report: null,
    };
  }

  if (!periodContext.isValid) {
    return {
      status: "invalid_query",
      normalizedTarga,
      message: "Il periodo selezionato non e valido. Controlla le date da e a prima di generare l'anteprima.",
      report: null,
    };
  }

  const snapshot = await readNextDossierMezzoCompositeSnapshot(normalizedTarga);

  if (!snapshot) {
    return {
      status: "not_found",
      normalizedTarga,
      message: `Nessun mezzo trovato nel clone in sola lettura per la targa ${normalizedTarga}.`,
      report: null,
    };
  }

  return {
    status: "ready",
    normalizedTarga,
    message: `Anteprima report generata in sola lettura per la targa ${normalizedTarga} con periodo ${periodContext.label}.`,
    report: buildReport(snapshot, periodInput),
  };
}
