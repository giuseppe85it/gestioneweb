import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";
import {
  readNextDossierMezzoCompositeSnapshot,
  type NextDossierMezzoCompositeSnapshot,
  type NextDossierDomainSectionState,
} from "../domain/nextDossierMezzoDomain";
import type {
  InternalAiApprovalState,
  InternalAiPreviewState,
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

function takeNotes(notes: string[] | undefined, limit = 3): string[] {
  return (notes ?? []).filter(Boolean).slice(0, limit);
}

function formatCountLabel(value: number, suffix: string): string {
  return `${value} ${suffix}`;
}

function mapSectionStateToStatus(
  state: NextDossierDomainSectionState<unknown>,
  count: number,
): InternalAiVehicleReportSectionStatus {
  if (state.status === "error") return "errore";
  if (count === 0) return "vuota";
  return state.status === "success" ? "completa" : "parziale";
}

function mapSourceStatus(
  state: NextDossierDomainSectionState<unknown>,
  count: number,
): InternalAiVehicleReportSourceStatus {
  if (state.status === "error") return "errore";
  if (count === 0) return "parziale";
  return "disponibile";
}

function createSection(args: {
  id: string;
  title: string;
  state: NextDossierDomainSectionState<unknown>;
  count: number;
  summary: string;
  bullets: string[];
  notes?: string[];
}): InternalAiVehicleReportSection {
  return {
    id: args.id,
    title: args.title,
    status: mapSectionStateToStatus(args.state, args.count),
    summary: args.summary,
    bullets: args.bullets,
    notes: takeNotes(args.notes),
  };
}

function createSource(args: {
  id: string;
  title: string;
  state: NextDossierDomainSectionState<unknown>;
  count: number;
  description: string;
  datasetLabels: string[];
  countLabel: string | null;
  notes?: string[];
}): InternalAiVehicleReportSource {
  return {
    id: args.id,
    title: args.title,
    status: mapSourceStatus(args.state, args.count),
    description: args.description,
    datasetLabels: args.datasetLabels,
    countLabel: args.countLabel,
    notes: takeNotes(args.notes),
  };
}

function buildPreviewStates(
  snapshot: NextDossierMezzoCompositeSnapshot,
): Pick<InternalAiVehicleReportPreview, "previewState" | "approvalState"> {
  const hasEnoughData =
    snapshot.lavori.snapshot?.counts.total ||
    snapshot.refuels.snapshot?.counts.total ||
    snapshot.documentCosts.snapshot?.counts.total ||
    snapshot.maintenance.snapshot?.counts.manutenzioni;

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

function buildMissingData(snapshot: NextDossierMezzoCompositeSnapshot): string[] {
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

  return missing;
}

function buildReport(snapshot: NextDossierMezzoCompositeSnapshot): InternalAiVehicleReportPreview {
  const generatedAt = new Date().toISOString();
  const previewStates = buildPreviewStates(snapshot);
  const missingData = buildMissingData(snapshot);
  const refuelsTotal = snapshot.refuels.snapshot?.counts.total ?? 0;
  const documentsTotal = snapshot.documentCosts.snapshot?.counts.total ?? 0;
  const lavoriTotal = snapshot.lavori.snapshot?.counts.total ?? 0;
  const manutenzioniTotal = snapshot.maintenance.snapshot?.counts.manutenzioni ?? 0;
  const materialiTotal = snapshot.materialiMovimenti.snapshot?.counts.total ?? 0;

  const sections: InternalAiVehicleReportSection[] = [
    {
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
    },
    createSection({
      id: "lavori-operativita",
      title: "Lavori e operativita tecnica",
      state: snapshot.lavori,
      count: lavoriTotal,
      summary:
        lavoriTotal > 0
          ? `Trovati ${lavoriTotal} lavori collegati alla targa.`
          : "Nessun lavoro collegato alla targa nel perimetro in sola lettura.",
      bullets: [
        `Da eseguire: ${snapshot.lavori.snapshot?.counts.daEseguire ?? 0}`,
        `In attesa: ${snapshot.lavori.snapshot?.counts.inAttesa ?? 0}`,
        `Eseguiti: ${snapshot.lavori.snapshot?.counts.eseguiti ?? 0}`,
        `Storico tecnico: ${snapshot.technical.snapshot?.counts.manutenzioni ?? 0} manutenzioni lette`,
      ],
      notes: [
        ...(snapshot.lavori.error ? [snapshot.lavori.error] : []),
        ...takeNotes(snapshot.lavori.snapshot?.limitations),
      ],
    }),
    createSection({
      id: "manutenzioni-gomme",
      title: "Manutenzioni e gomme",
      state: snapshot.maintenance,
      count: manutenzioniTotal,
      summary:
        manutenzioniTotal > 0
          ? `Trovate ${manutenzioniTotal} manutenzioni e ${
              snapshot.maintenance.snapshot?.counts.gommeDerivate ?? 0
            } eventi gomme derivati.`
          : "Nessuna manutenzione disponibile per il mezzo nel layer dedicato.",
      bullets: [
        `Manutenzioni con km: ${snapshot.maintenance.snapshot?.counts.manutenzioniConKm ?? 0}`,
        `Manutenzioni con ore: ${snapshot.maintenance.snapshot?.counts.manutenzioniConOre ?? 0}`,
        `Gomme derivate: ${snapshot.maintenance.snapshot?.counts.gommeDerivate ?? 0}`,
        `Stato manutenzione programmata: ${
          snapshot.maintenance.snapshot?.scheduledMaintenance.status ?? "non disponibile"
        }`,
      ],
      notes: [
        ...(snapshot.maintenance.error ? [snapshot.maintenance.error] : []),
        ...takeNotes(snapshot.maintenance.snapshot?.limitations),
      ],
    }),
    createSection({
      id: "rifornimenti",
      title: "Rifornimenti",
      state: snapshot.refuels,
      count: refuelsTotal,
      summary:
        refuelsTotal > 0
          ? `Trovati ${refuelsTotal} rifornimenti per la targa con lettura normalizzata in sola lettura.`
          : "Nessun rifornimento utile letto per questa targa.",
      bullets: [
        `Record con km: ${snapshot.refuels.snapshot?.counts.withKm ?? 0}`,
        `Record con costo: ${snapshot.refuels.snapshot?.counts.withCosto ?? 0}`,
        `Litri totali: ${snapshot.refuels.snapshot?.totals.litri ?? 0}`,
        `Costo totale noto: ${snapshot.refuels.snapshot?.totals.costo ?? 0}`,
      ],
      notes: [
        ...(snapshot.refuels.error ? [snapshot.refuels.error] : []),
        ...takeNotes(snapshot.refuels.snapshot?.limitations),
      ],
    }),
    createSection({
      id: "materiali",
      title: "Movimenti materiali",
      state: snapshot.materialiMovimenti,
      count: materialiTotal,
      summary:
        materialiTotal > 0
          ? `Trovati ${materialiTotal} movimenti materiali collegabili in modo utile alla targa.`
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
    }),
    createSection({
      id: "documenti-costi",
      title: "Documenti, costi e analisi",
      state: snapshot.documentCosts,
      count: documentsTotal,
      summary:
        documentsTotal > 0
          ? `Trovati ${documentsTotal} documenti/costi collegati al mezzo.`
          : "Nessun documento o costo utile collegato alla targa.",
      bullets: [
        `Preventivi: ${snapshot.documentCosts.snapshot?.counts.preventivi ?? 0}`,
        `Fatture: ${snapshot.documentCosts.snapshot?.counts.fatture ?? 0}`,
        `Documenti utili: ${snapshot.documentCosts.snapshot?.counts.documentiUtili ?? 0}`,
        `Analisi economica salvata: ${
          snapshot.analisiEconomica.snapshot?.savedAnalysis ? "Si" : "No"
        }`,
      ],
      notes: [
        ...(snapshot.documentCosts.error ? [snapshot.documentCosts.error] : []),
        ...takeNotes(snapshot.documentCosts.snapshot?.limitations),
        ...takeNotes(snapshot.analisiEconomica.snapshot?.limitations),
      ],
    }),
  ];

  const sources: InternalAiVehicleReportSource[] = [
    {
      id: "anagrafica",
      title: "Anagrafica flotta",
      status: "disponibile",
      description: "Identita mezzo letta dal layer in sola lettura delle anagrafiche NEXT.",
      datasetLabels: ["storage/@mezzi_aziendali"],
      countLabel: "1 mezzo letto",
      notes: [],
    },
    createSource({
      id: "lavori",
      title: snapshot.lavori.snapshot?.domainName ?? "Lavori",
      state: snapshot.lavori,
      count: lavoriTotal,
      description: "Lettura in sola lettura dei lavori mezzo-centrici gia normalizzati nel clone.",
      datasetLabels: snapshot.lavori.snapshot
        ? [...snapshot.lavori.snapshot.logicalDatasets]
        : ["storage/@lavori"],
      countLabel: formatCountLabel(lavoriTotal, "lavori"),
      notes: takeNotes(snapshot.lavori.snapshot?.limitations),
    }),
    createSource({
      id: "manutenzioni",
      title: snapshot.maintenance.snapshot?.domainName ?? "Manutenzioni e gomme",
      state: snapshot.maintenance,
      count: manutenzioniTotal,
      description: "Storico manutenzioni e derivazione gomme letti dai layer NEXT dedicati.",
      datasetLabels: snapshot.maintenance.snapshot
        ? [...snapshot.maintenance.snapshot.logicalDatasets]
        : ["storage/@manutenzioni"],
      countLabel: formatCountLabel(manutenzioniTotal, "manutenzioni"),
      notes: takeNotes(snapshot.maintenance.snapshot?.limitations),
    }),
    createSource({
      id: "rifornimenti",
      title: snapshot.refuels.snapshot?.domainName ?? "Rifornimenti",
      state: snapshot.refuels,
      count: refuelsTotal,
      description: "Rifornimenti letti con merge in sola lettura tra dataset business e feed campo.",
      datasetLabels: snapshot.refuels.snapshot
        ? [
            snapshot.refuels.snapshot.activeReadOnlyDataset,
            ...snapshot.refuels.snapshot.supportingReadOnlyDatasets,
          ]
        : ["storage/@rifornimenti", "storage/@rifornimenti_autisti_tmp"],
      countLabel: formatCountLabel(refuelsTotal, "record"),
      notes: takeNotes(snapshot.refuels.snapshot?.limitations),
    }),
    createSource({
      id: "materiali",
      title: snapshot.materialiMovimenti.snapshot?.domainName ?? "Movimenti materiali",
      state: snapshot.materialiMovimenti,
      count: materialiTotal,
      description: "Movimenti materiali ricostruiti dal layer mezzo-centrico in sola lettura del clone.",
      datasetLabels: snapshot.materialiMovimenti.snapshot
        ? [...snapshot.materialiMovimenti.snapshot.logicalDatasets]
        : ["storage/@materialiconsegnati"],
      countLabel: formatCountLabel(materialiTotal, "movimenti"),
      notes: takeNotes(snapshot.materialiMovimenti.snapshot?.limitations),
    }),
    createSource({
      id: "documenti-costi",
      title: snapshot.documentCosts.snapshot?.domainName ?? "Documenti e costi",
      state: snapshot.documentCosts,
      count: documentsTotal,
      description: "Documenti e costi letti dai layer documentali ed economici in sola lettura del clone.",
      datasetLabels: snapshot.documentCosts.snapshot
        ? [...snapshot.documentCosts.snapshot.activeReadOnlyDatasets]
        : ["storage/@costiMezzo", "@documenti_mezzi", "@documenti_magazzino", "@documenti_generici"],
      countLabel: formatCountLabel(documentsTotal, "documenti/costi"),
      notes: takeNotes(snapshot.documentCosts.snapshot?.limitations),
    }),
    {
      id: "analisi-economica",
      title: "Analisi economica salvata",
      status: snapshot.analisiEconomica.snapshot?.savedAnalysis ? "disponibile" : "parziale",
      description: "Verifica in sola lettura dell'eventuale snapshot legacy di analisi economica.",
      datasetLabels: ["@analisi_economica_mezzi"],
      countLabel: snapshot.analisiEconomica.snapshot?.savedAnalysis ? "1 analisi trovata" : null,
      notes: takeNotes(snapshot.analisiEconomica.snapshot?.limitations),
    },
  ];

  return {
    mezzoTarga: snapshot.mezzo.targa,
    title: `Anteprima report targa ${snapshot.mezzo.targa}`,
    subtitle:
      "Report costruito in sola lettura dai layer NEXT gia esistenti, senza scritture e senza backend IA.",
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
        value: String(lavoriTotal),
        meta: `Da eseguire ${snapshot.lavori.snapshot?.counts.daEseguire ?? 0}, in attesa ${
          snapshot.lavori.snapshot?.counts.inAttesa ?? 0
        }, eseguiti ${snapshot.lavori.snapshot?.counts.eseguiti ?? 0}`,
        tone: lavoriTotal > 0 ? "success" : "warning",
      },
      {
        label: "Manutenzioni",
        value: String(manutenzioniTotal),
        meta: `Gomme derivate ${snapshot.maintenance.snapshot?.counts.gommeDerivate ?? 0}`,
        tone: manutenzioniTotal > 0 ? "success" : "warning",
      },
      {
        label: "Rifornimenti",
        value: String(refuelsTotal),
        meta: `Litri totali ${snapshot.refuels.snapshot?.totals.litri ?? 0}`,
        tone: refuelsTotal > 0 ? "success" : "warning",
      },
      {
        label: "Documenti e costi",
        value: String(documentsTotal),
        meta: `Preventivi ${snapshot.documentCosts.snapshot?.counts.preventivi ?? 0}, fatture ${
          snapshot.documentCosts.snapshot?.counts.fatture ?? 0
        }`,
        tone: documentsTotal > 0 ? "success" : "warning",
      },
    ],
    sections,
    missingData,
    evidences: [
      ...snapshot.overview.keySignals,
      ...snapshot.overview.readerLabels,
      `Blocchi importati: ${snapshot.overview.importedBlockLabels.join(", ") || "nessuno"}`,
    ].filter(Boolean),
    sources,
    previewState: previewStates.previewState,
    approvalState: previewStates.approvalState,
  };
}

export async function readInternalAiVehicleReportPreview(
  rawTarga: string,
): Promise<InternalAiVehicleReportReadResult> {
  const normalizedTarga = normalizeNextMezzoTarga(rawTarga);

  if (!normalizedTarga) {
    return {
      status: "invalid_query",
      normalizedTarga: null,
      message: "Inserisci una targa valida prima di avviare l'anteprima.",
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
    message: `Anteprima report generata in sola lettura per la targa ${normalizedTarga}.`,
    report: buildReport(snapshot),
  };
}
